import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquareQuote, PenLine, Clock, CheckCircle2, Sparkles, Loader2, Quote, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Depoimento {
    id: string;
    user_id: string;
    cerimonia_id: string | null;
    texto: string;
    aprovado: boolean;
    created_at: string;
    profiles: {
        full_name: string | null;
    };
    cerimonias: {
        nome: string | null;
        medicina_principal: string | null;
        data: string;
    } | null;
}

interface Cerimonia {
    id: string;
    nome: string | null;
    medicina_principal: string | null;
    data: string;
}

const Depoimentos: React.FC = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [texto, setTexto] = useState('');
    const [cerimoniaId, setCerimoniaId] = useState<string>('livre');

    // Query para depoimentos aprovados
    const { data: depoimentos, isLoading } = useQuery({
        queryKey: ['depoimentos-aprovados'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('depoimentos')
                .select(`
          *,
          profiles:user_id (full_name),
          cerimonias:cerimonia_id (nome, medicina_principal, data)
        `)
                .eq('aprovado', true)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data as Depoimento[];
        },
    });

    // Query para cerimônias (para o select)
    const { data: cerimonias } = useQuery({
        queryKey: ['cerimonias-select'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cerimonias')
                .select('id, nome, medicina_principal, data')
                .order('data', { ascending: false });
            if (error) throw error;
            return data as Cerimonia[];
        },
    });

    // Query para depoimentos do usuário (pendentes)
    const { data: meusDepoimentos } = useQuery({
        queryKey: ['meus-depoimentos'],
        enabled: !!user,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('depoimentos')
                .select('*')
                .eq('user_id', user?.id)
                .eq('aprovado', false);
            if (error) throw error;
            return data;
        },
    });

    // Mutation para criar depoimento
    const createMutation = useMutation({
        mutationFn: async () => {
            if (!user) throw new Error('Usuário não autenticado');

            const { error } = await supabase
                .from('depoimentos')
                .insert({
                    user_id: user.id,
                    cerimonia_id: cerimoniaId === 'livre' ? null : cerimoniaId,
                    texto,
                });
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('Depoimento enviado!', {
                description: 'Aguarde a aprovação do administrador para que seja publicado.',
            });
            setTexto('');
            setCerimoniaId('livre');
            setIsDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ['meus-depoimentos'] });
        },
        onError: () => {
            toast.error('Erro ao enviar depoimento.');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!texto.trim()) {
            toast.error('Por favor, escreva seu depoimento.');
            return;
        }
        createMutation.mutate();
    };

    return (
        <div className="min-h-screen py-8 px-4 bg-background/50 pb-24">
            <div className="container max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 animate-fade-in">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <MessageSquareQuote className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="font-display text-3xl font-medium text-foreground">
                                Depoimentos
                            </h1>
                            <p className="text-muted-foreground font-body">
                                Experiências transformadoras compartilhadas por nossa comunidade.
                            </p>
                        </div>
                    </div>

                    {user && (
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-primary hover:bg-primary/90">
                                    <PenLine className="w-4 h-4 mr-2" /> Compartilhar Experiência
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                                <DialogHeader>
                                    <DialogTitle className="font-display flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-primary" />
                                        Compartilhe sua Experiência
                                    </DialogTitle>
                                    <DialogDescription>
                                        Seu depoimento será revisado antes de ser publicado.
                                    </DialogDescription>
                                </DialogHeader>

                                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="cerimonia">Relacionado a qual consagração? (opcional)</Label>
                                        <Select value={cerimoniaId} onValueChange={setCerimoniaId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione uma consagração" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="livre">Depoimento Livre</SelectItem>
                                                {cerimonias?.map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.nome || c.medicina_principal} - {format(new Date(c.data), "dd/MM/yyyy", { locale: ptBR })}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="texto">Seu Depoimento</Label>
                                        <Textarea
                                            id="texto"
                                            placeholder="Compartilhe sua experiência, insights e transformações..."
                                            className="min-h-[150px] resize-none"
                                            value={texto}
                                            onChange={(e) => setTexto(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Seu nome será exibido junto ao depoimento.
                                        </p>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={createMutation.isPending}
                                    >
                                        {createMutation.isPending ? (
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                        )}
                                        Enviar Depoimento
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                {/* Aviso de depoimento pendente */}
                {meusDepoimentos && meusDepoimentos.length > 0 && (
                    <Card className="mb-6 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900">
                        <CardContent className="py-4 flex items-center gap-3">
                            <Clock className="w-5 h-5 text-amber-600" />
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                                Você tem <strong>{meusDepoimentos.length}</strong> depoimento(s) aguardando aprovação.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Lista de depoimentos */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : !depoimentos || depoimentos.length === 0 ? (
                    <Card className="text-center py-12 border-dashed border-2 bg-card/50">
                        <CardContent>
                            <Quote className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <p className="text-xl text-muted-foreground font-display">
                                Ainda não há depoimentos publicados.
                            </p>
                            {user && (
                                <p className="text-sm text-muted-foreground mt-2">
                                    Seja o primeiro a compartilhar sua experiência!
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {depoimentos.map((depoimento) => (
                            <Card key={depoimento.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <Quote className="w-8 h-8 text-primary/30 shrink-0 mt-1" />
                                        <div className="flex-1 space-y-4">
                                            <p className="text-foreground leading-relaxed italic">
                                                "{depoimento.texto}"
                                            </p>

                                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <span className="text-sm font-medium text-primary">
                                                            {depoimento.profiles?.full_name?.charAt(0).toUpperCase() || '?'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {depoimento.profiles?.full_name || 'Anônimo'}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {format(new Date(depoimento.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                                        </p>
                                                    </div>
                                                </div>

                                                {depoimento.cerimonias && (
                                                    <Badge variant="outline" className="text-xs">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        {depoimento.cerimonias.nome || depoimento.cerimonias.medicina_principal}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Depoimentos;

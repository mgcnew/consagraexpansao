import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquareQuote, PenLine, Clock, CheckCircle2, Sparkles, Loader2, Quote, Calendar, Instagram } from 'lucide-react';
import { PageHeader, PageContainer } from '@/components/shared';
import { toast } from 'sonner';
import { TOAST_MESSAGES } from '@/constants/messages';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { 
    useDepoimentosInfinito, 
    useCerimoniasSelect, 
    useMeusDepoimentosPendentes 
} from '@/hooks/queries';

const Depoimentos: React.FC = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [texto, setTexto] = useState('');
    const [cerimoniaId, setCerimoniaId] = useState<string>('livre');
    const [autorizaInstagram, setAutorizaInstagram] = useState(false);
    const virtuosoRef = React.useRef<VirtuosoHandle>(null);

    // Infinite Query para depoimentos aprovados (Requirements: 6.2)
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useDepoimentosInfinito();

    const allDepoimentos = data?.pages.flatMap((page) => page.data) || [];

    // Query para cerimônias (para o select) (Requirements: 6.2)
    const { data: cerimonias } = useCerimoniasSelect();

    // Query para depoimentos do usuário (pendentes) (Requirements: 6.2)
    const { data: meusDepoimentos } = useMeusDepoimentosPendentes(user?.id);

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
                    autoriza_instagram: autorizaInstagram,
                });
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('Partilha enviada!', {
                description: 'Aguarde a aprovação do administrador para que seja publicada. Gratidão por compartilhar sua experiência!',
            });
            setTexto('');
            setCerimoniaId('livre');
            setAutorizaInstagram(false);
            setIsDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ['meus-depoimentos'] });
        },
        onError: () => {
            toast.error('Erro ao enviar partilha', {
                description: 'Não foi possível enviar sua partilha. Tente novamente.',
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!texto.trim()) {
            toast.error('Campo obrigatório', {
                description: 'Por favor, escreva sua partilha antes de enviar.',
            });
            return;
        }
        createMutation.mutate();
    };

    return (
        <PageContainer maxWidth="lg">
                {/* Header */}
                <PageHeader
                    icon={MessageSquareQuote}
                    title="Partilhas"
                    description="Experiências transformadoras compartilhadas por nossa comunidade."
                >
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
                                        Sua partilha será revisada antes de ser publicada.
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
                                                <SelectItem value="livre">Partilha Livre</SelectItem>
                                                {cerimonias?.map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.nome || c.medicina_principal} - {format(new Date(c.data), "dd/MM/yyyy", { locale: ptBR })}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="texto">Sua Partilha</Label>
                                        <Textarea
                                            id="texto"
                                            placeholder="Compartilhe sua experiência, insights e transformações..."
                                            className="min-h-[150px] resize-none"
                                            value={texto}
                                            onChange={(e) => setTexto(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Seu nome será exibido junto à partilha.
                                        </p>
                                    </div>

                                    <div className="flex items-start space-x-3 p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200 dark:border-purple-800">
                                        <Checkbox
                                            id="autoriza-instagram"
                                            checked={autorizaInstagram}
                                            onCheckedChange={(checked) => setAutorizaInstagram(checked === true)}
                                        />
                                        <div className="space-y-1">
                                            <Label htmlFor="autoriza-instagram" className="flex items-center gap-2 cursor-pointer">
                                                <Instagram className="w-4 h-4 text-pink-500" />
                                                Autorizo compartilhar no Instagram
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                Sua partilha poderá ser publicada no Instagram do Templo Xamânico Consciência Divinal.
                                            </p>
                                        </div>
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
                                        Enviar Partilha
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </PageHeader>

                {/* Aviso de depoimento pendente */}
                {meusDepoimentos && meusDepoimentos.length > 0 && (
                    <Card className="mb-6 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900 animate-in fade-in slide-in-from-top-4">
                        <CardContent className="py-4 flex items-center gap-3">
                            <Clock className="w-5 h-5 text-amber-600" />
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                                Você tem <strong>{meusDepoimentos.length}</strong> partilha(s) aguardando aprovação.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Lista de depoimentos com Virtualização */}
                <div className="space-y-6">
                    {isLoading ? (
                        // Skeleton Loading Inicial
                        Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i} className="overflow-hidden mb-6">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                                        <div className="flex-1 space-y-4">
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-full" />
                                                <Skeleton className="h-4 w-[90%]" />
                                                <Skeleton className="h-4 w-[80%]" />
                                            </div>
                                            <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                                <div className="flex items-center gap-2">
                                                    <Skeleton className="w-8 h-8 rounded-full" />
                                                    <div className="space-y-1">
                                                        <Skeleton className="h-3 w-24" />
                                                        <Skeleton className="h-3 w-16" />
                                                    </div>
                                                </div>
                                                <Skeleton className="h-5 w-20 rounded-full" />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : allDepoimentos.length === 0 ? (
                        <Card className="text-center py-12 border-dashed border-2 bg-card/50">
                            <CardContent>
                                <Quote className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                                <p className="text-xl text-muted-foreground font-display">
                                    Ainda não há partilhas publicadas.
                                </p>
                                {user && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Seja o primeiro a compartilhar sua experiência!
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Virtuoso
                            ref={virtuosoRef}
                            useWindowScroll
                            data={allDepoimentos}
                            endReached={() => {
                                if (hasNextPage && !isFetchingNextPage) {
                                    fetchNextPage();
                                }
                            }}
                            itemContent={(index, depoimento) => (
                                <div className="pb-6 px-1">
                                    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
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
                                </div>
                            )}
                            components={{
                                Footer: () => (
                                    isFetchingNextPage ? (
                                        <div className="flex justify-center py-4">
                                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                        </div>
                                    ) : null
                                )
                            }}
                        />
                    )}
                </div>
        </PageContainer>
    );
};

export default Depoimentos;

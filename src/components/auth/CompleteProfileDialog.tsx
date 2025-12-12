import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { TOAST_MESSAGES } from '@/constants/messages';
import { Loader2 } from 'lucide-react';

const CompleteProfileDialog = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form states
    const [fullName, setFullName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [referralSource, setReferralSource] = useState('');
    const [referralName, setReferralName] = useState('');

    useEffect(() => {
        const checkProfile = async () => {
            if (!user) return;

            // Check if profile exists and has full_name
            const { data, error } = await supabase
                .from('profiles')
                .select('full_name, birth_date, referral_source')
                .eq('id', user.id)
                .maybeSingle();

            // Abrir modal se não existe perfil OU se não tem nome preenchido
            const needsCompletion = !data || !data.full_name;
            
            if (needsCompletion) {
                // Try to get name from metadata
                const metaName = user.user_metadata?.full_name || user.user_metadata?.nome_completo || user.user_metadata?.name;
                if (metaName) {
                    setFullName(metaName);
                }
                // Preencher dados existentes se houver
                if (data) {
                    if (data.full_name) setFullName(data.full_name);
                    if (data.birth_date) setBirthDate(data.birth_date);
                    if (data.referral_source) setReferralSource(data.referral_source);
                }
                setIsOpen(true);
            }
        };

        checkProfile();
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!fullName || !birthDate || !referralSource) {
            toast.error('Campos obrigatórios', {
                description: 'Por favor, preencha todos os campos obrigatórios.',
            });
            return;
        }

        if (referralSource === 'indicacao' && !referralName) {
            toast.error('Campo obrigatório', {
                description: 'Por favor, informe quem indicou você.',
            });
            return;
        }

        setLoading(true);
        try {
            // Usar upsert para lidar com casos onde o perfil já existe (criado por trigger)
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    full_name: fullName,
                    birth_date: birthDate,
                    referral_source: referralSource,
                    referral_name: referralName
                }, {
                    onConflict: 'id'
                });

            if (error) throw error;

            setIsOpen(false);
            // Disparar evento para mostrar WelcomeModal
            window.dispatchEvent(new CustomEvent('profile-completed'));
        } catch (error: any) {
            console.error('Erro ao salvar perfil:', error);
            if (error.message?.includes('relation "profiles" does not exist')) {
                toast.error('Erro de configuração', {
                    description: 'Tabela de perfis não encontrada. Contate o administrador.',
                });
            } else if (error.code === '23505') {
                // Duplicate key - tentar update
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        full_name: fullName,
                        birth_date: birthDate,
                        referral_source: referralSource,
                        referral_name: referralName
                    })
                    .eq('id', user.id);
                
                if (updateError) {
                    toast.error(TOAST_MESSAGES.generico.erro.title, {
                        description: 'Erro ao atualizar perfil. Tente novamente.',
                    });
                } else {
                    setIsOpen(false);
                    // Disparar evento para mostrar WelcomeModal
                    window.dispatchEvent(new CustomEvent('profile-completed'));
                }
            } else {
                toast.error(TOAST_MESSAGES.generico.erro.title, {
                    description: `Erro ao salvar perfil: ${error.message || 'Tente novamente.'}`,
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent className="w-[95vw] max-w-[425px] rounded-lg" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Complete seu Cadastro</DialogTitle>
                    <DialogDescription>
                        Para continuar, precisamos de algumas informações adicionais importantes para nossa egrégora.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Nome Completo</Label>
                        <Input
                            id="fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Seu nome completo"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="birthDate">Data de Nascimento</Label>
                        <Input
                            id="birthDate"
                            type="date"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="referralSource">Como nos conheceu?</Label>
                        <Select onValueChange={setReferralSource} value={referralSource}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione uma opção" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="instagram">Instagram</SelectItem>
                                <SelectItem value="google">Google</SelectItem>
                                <SelectItem value="indicacao">Indicação de Amigo</SelectItem>
                                <SelectItem value="outro">Outro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {referralSource === 'indicacao' && (
                        <div className="space-y-2 animate-fade-in">
                            <Label htmlFor="referralName">Quem indicou?</Label>
                            <Input
                                id="referralName"
                                value={referralName}
                                onChange={(e) => setReferralName(e.target.value)}
                                placeholder="Nome da pessoa que indicou"
                                required
                            />
                        </div>
                    )}

                    <DialogFooter className="pt-4">
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Confirmar Cadastro
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CompleteProfileDialog;

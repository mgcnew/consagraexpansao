import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';

interface CreateCeremonyDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

interface CeremonyFormData {
    data: string;
    horario: string;
    local: string;
    descricao: string;
    medicina_principal: string;
    vagas: number;
    observacoes: string;
    banner_url: string;
}

const CreateCeremonyDialog: React.FC<CreateCeremonyDialogProps> = ({ isOpen, onClose }) => {
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset, formState: { errors } } = useForm<CeremonyFormData>();

    const createMutation = useMutation({
        mutationFn: async (data: CeremonyFormData) => {
            const { error } = await supabase
                .from('cerimonias')
                .insert([data]);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('Cerimônia criada com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['cerimonias'] });
            reset();
            onClose();
        },
        onError: (error) => {
            console.error(error);
            toast.error('Erro ao criar cerimônia.');
        }
    });

    const onSubmit = (data: CeremonyFormData) => {
        createMutation.mutate(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="font-display text-2xl text-primary">Nova Cerimônia</DialogTitle>
                    <DialogDescription>
                        Preencha os detalhes para agendar uma nova cerimônia.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="data">Data</Label>
                            <Input id="data" type="date" {...register('data', { required: true })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="horario">Horário</Label>
                            <Input id="horario" type="time" {...register('horario', { required: true })} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="local">Local</Label>
                        <Input id="local" placeholder="Ex: Templo Principal" {...register('local', { required: true })} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="medicina">Medicina Principal</Label>
                        <Input id="medicina" placeholder="Ex: Ayahuasca" {...register('medicina_principal', { required: true })} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="vagas">Vagas</Label>
                        <Input id="vagas" type="number" placeholder="Ex: 20" {...register('vagas', { required: true, min: 1 })} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="banner">URL do Banner (Opcional)</Label>
                        <Input id="banner" placeholder="https://..." {...register('banner_url')} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="descricao">Descrição</Label>
                        <Textarea id="descricao" placeholder="Detalhes sobre a cerimônia..." {...register('descricao')} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="observacoes">Observações</Label>
                        <Textarea id="observacoes" placeholder="O que levar, recomendações..." {...register('observacoes')} />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" className="bg-primary text-primary-foreground" disabled={createMutation.isPending}>
                            {createMutation.isPending ? 'Criando...' : 'Criar Cerimônia'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateCeremonyDialog;

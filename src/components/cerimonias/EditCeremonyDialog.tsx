import React, { useEffect } from 'react';
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

interface Cerimonia {
    id: string;
    nome: string | null;
    data: string;
    horario: string;
    local: string;
    descricao: string | null;
    medicina_principal: string | null;
    vagas: number | null;
    observacoes: string | null;
    banner_url: string | null;
}

interface EditCeremonyDialogProps {
    isOpen: boolean;
    onClose: () => void;
    ceremony: Cerimonia | null;
}

interface CeremonyFormData {
    nome: string;
    data: string;
    horario: string;
    local: string;
    descricao: string;
    medicina_principal: string;
    vagas: number;
    observacoes: string;
    banner_url: string;
}

const EditCeremonyDialog: React.FC<EditCeremonyDialogProps> = ({ isOpen, onClose, ceremony }) => {
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CeremonyFormData>();

    useEffect(() => {
        if (ceremony && isOpen) {
            setValue('nome', ceremony.nome || '');
            setValue('data', ceremony.data);
            setValue('horario', ceremony.horario);
            setValue('local', ceremony.local);
            setValue('descricao', ceremony.descricao || '');
            setValue('medicina_principal', ceremony.medicina_principal || '');
            setValue('vagas', ceremony.vagas || 0);
            setValue('observacoes', ceremony.observacoes || '');
            setValue('banner_url', ceremony.banner_url || '');
        }
    }, [ceremony, isOpen, setValue]);

    const updateMutation = useMutation({
        mutationFn: async (data: CeremonyFormData) => {
            if (!ceremony) throw new Error('Cerimônia não encontrada');

            const { error } = await supabase
                .from('cerimonias')
                .update(data)
                .eq('id', ceremony.id);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('Cerimônia atualizada com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['cerimonias'] });
            queryClient.invalidateQueries({ queryKey: ['admin-cerimonias'] });
            reset();
            onClose();
        },
        onError: (error) => {
            console.error(error);
            toast.error('Erro ao atualizar cerimônia.');
        }
    });

    const onSubmit = (data: CeremonyFormData) => {
        updateMutation.mutate(data);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="font-display text-2xl text-primary">Editar Cerimônia</DialogTitle>
                    <DialogDescription>
                        Atualize os detalhes da cerimônia.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-nome">Nome da Consagração</Label>
                        <Input id="edit-nome" placeholder="Ex: Roda de Cura com Rapé" {...register('nome', { required: true })} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-data">Data</Label>
                            <Input id="edit-data" type="date" {...register('data', { required: true })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-horario">Horário</Label>
                            <Input id="edit-horario" type="time" {...register('horario', { required: true })} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-local">Local</Label>
                        <Input id="edit-local" placeholder="Ex: Templo Principal" {...register('local', { required: true })} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-medicina">Medicina Principal</Label>
                        <Input id="edit-medicina" placeholder="Ex: Ayahuasca" {...register('medicina_principal', { required: true })} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-vagas">Vagas</Label>
                        <Input id="edit-vagas" type="number" placeholder="Ex: 20" {...register('vagas', { required: true, min: 1 })} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-banner">URL da Foto/Banner (Opcional)</Label>
                        <Input id="edit-banner" placeholder="https://..." {...register('banner_url')} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-descricao">Descrição</Label>
                        <Textarea id="edit-descricao" placeholder="Detalhes sobre a cerimônia..." {...register('descricao')} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-observacoes">Observações</Label>
                        <Textarea id="edit-observacoes" placeholder="O que levar, recomendações..." {...register('observacoes')} />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
                        <Button type="submit" className="bg-primary text-primary-foreground" disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditCeremonyDialog;

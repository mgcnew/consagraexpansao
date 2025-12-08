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
import { TOAST_MESSAGES } from '@/constants/messages';
import type { Cerimonia } from '@/types';

/**
 * Componente unificado para criar e editar cerimônias
 * Requirements: 6.4 - Reutilizar código através de componentes genéricos
 */

type DialogMode = 'create' | 'edit';

interface CeremonyFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    mode: DialogMode;
    ceremony?: Cerimonia | null;
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

const CeremonyFormDialog: React.FC<CeremonyFormDialogProps> = ({ 
    isOpen, 
    onClose, 
    mode,
    ceremony 
}) => {
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CeremonyFormData>();
    
    const isEditMode = mode === 'edit';
    const idPrefix = isEditMode ? 'edit-' : '';

    // Preencher formulário com dados da cerimônia no modo edição
    useEffect(() => {
        if (ceremony && isOpen && isEditMode) {
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
    }, [ceremony, isOpen, isEditMode, setValue]);

    // Mutation para criar cerimônia
    const createMutation = useMutation({
        mutationFn: async (data: CeremonyFormData) => {
            const { error } = await supabase
                .from('cerimonias')
                .insert([data]);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success(TOAST_MESSAGES.cerimonia.criada.title, {
                description: TOAST_MESSAGES.cerimonia.criada.description,
            });
            invalidateAndClose();
        },
        onError: (error) => {
            console.error(error);
            toast.error(TOAST_MESSAGES.cerimonia.erro.title, {
                description: 'Não foi possível criar a cerimônia. Tente novamente.',
            });
        }
    });

    // Mutation para atualizar cerimônia
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
            toast.success(TOAST_MESSAGES.cerimonia.atualizada.title, {
                description: TOAST_MESSAGES.cerimonia.atualizada.description,
            });
            invalidateAndClose();
        },
        onError: (error) => {
            console.error(error);
            toast.error(TOAST_MESSAGES.cerimonia.erro.title, {
                description: 'Não foi possível atualizar a cerimônia. Tente novamente.',
            });
        }
    });

    const invalidateAndClose = () => {
        queryClient.invalidateQueries({ queryKey: ['cerimonias'] });
        queryClient.invalidateQueries({ queryKey: ['admin-cerimonias'] });
        reset();
        onClose();
    };

    const onSubmit = (data: CeremonyFormData) => {
        if (isEditMode) {
            updateMutation.mutate(data);
        } else {
            createMutation.mutate(data);
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const isPending = isEditMode ? updateMutation.isPending : createMutation.isPending;

    // Configurações baseadas no modo
    const dialogConfig = {
        create: {
            title: 'Nova Cerimônia',
            description: 'Preencha os detalhes para agendar uma nova cerimônia.',
            submitText: 'Criar Cerimônia',
            pendingText: 'Criando...',
        },
        edit: {
            title: 'Editar Cerimônia',
            description: 'Atualize os detalhes da cerimônia.',
            submitText: 'Salvar Alterações',
            pendingText: 'Salvando...',
        }
    };

    const config = dialogConfig[mode];


    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="font-display text-2xl text-primary">
                        {config.title}
                    </DialogTitle>
                    <DialogDescription>
                        {config.description}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor={`${idPrefix}nome`}>Nome da Consagração</Label>
                        <Input 
                            id={`${idPrefix}nome`} 
                            placeholder="Ex: Roda de Cura com Rapé" 
                            {...register('nome', { required: true })} 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor={`${idPrefix}data`}>Data</Label>
                            <Input 
                                id={`${idPrefix}data`} 
                                type="date" 
                                {...register('data', { required: true })} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`${idPrefix}horario`}>Horário</Label>
                            <Input 
                                id={`${idPrefix}horario`} 
                                type="time" 
                                {...register('horario', { required: true })} 
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`${idPrefix}local`}>Local</Label>
                        <Input 
                            id={`${idPrefix}local`} 
                            placeholder="Ex: Templo Principal" 
                            {...register('local', { required: true })} 
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`${idPrefix}medicina`}>Medicina Principal</Label>
                        <Input 
                            id={`${idPrefix}medicina`} 
                            placeholder="Ex: Ayahuasca" 
                            {...register('medicina_principal', { required: true })} 
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`${idPrefix}vagas`}>Vagas</Label>
                        <Input 
                            id={`${idPrefix}vagas`} 
                            type="number" 
                            placeholder="Ex: 20" 
                            {...register('vagas', { required: true, min: 1 })} 
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`${idPrefix}banner`}>URL da Foto/Banner (Opcional)</Label>
                        <Input 
                            id={`${idPrefix}banner`} 
                            placeholder="https://..." 
                            {...register('banner_url')} 
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`${idPrefix}descricao`}>Descrição</Label>
                        <Textarea 
                            id={`${idPrefix}descricao`} 
                            placeholder="Detalhes sobre a cerimônia..." 
                            {...register('descricao')} 
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`${idPrefix}observacoes`}>Observações</Label>
                        <Textarea 
                            id={`${idPrefix}observacoes`} 
                            placeholder="O que levar, recomendações..." 
                            {...register('observacoes')} 
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancelar
                        </Button>
                        <Button 
                            type="submit" 
                            className="bg-primary text-primary-foreground" 
                            disabled={isPending}
                        >
                            {isPending ? config.pendingText : config.submitText}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CeremonyFormDialog;

import React, { useEffect, useState, useRef } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { TOAST_MESSAGES } from '@/constants/messages';
import { Upload, Link, X, Loader2 } from 'lucide-react';
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
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [imageTab, setImageTab] = useState<'url' | 'upload'>('url');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    
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
            if (ceremony.banner_url) {
                setPreviewUrl(ceremony.banner_url);
            }
        }
    }, [ceremony, isOpen, isEditMode, setValue]);

    // Limpar preview quando fechar o dialog
    useEffect(() => {
        if (!isOpen) {
            setSelectedFile(null);
            setPreviewUrl(null);
            setImageTab('url');
        }
    }, [isOpen]);

    // Upload de imagem para o Supabase Storage
    const uploadImage = async (file: File): Promise<string> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `banners/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('cerimonias')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('cerimonias')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    // Handler para seleção de arquivo
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validar tamanho (5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Arquivo muito grande', {
                    description: 'O tamanho máximo permitido é 5MB.',
                });
                return;
            }

            // Validar tipo
            if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
                toast.error('Tipo de arquivo inválido', {
                    description: 'Apenas imagens JPG, PNG, WebP e GIF são permitidas.',
                });
                return;
            }

            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setValue('banner_url', ''); // Limpar URL se tiver arquivo
        }
    };

    // Remover imagem selecionada
    const handleRemoveImage = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setValue('banner_url', '');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

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

    const onSubmit = async (data: CeremonyFormData) => {
        try {
            // Se tiver arquivo selecionado, fazer upload primeiro
            if (selectedFile) {
                setIsUploading(true);
                const imageUrl = await uploadImage(selectedFile);
                data.banner_url = imageUrl;
                setIsUploading(false);
            }

            if (isEditMode) {
                updateMutation.mutate(data);
            } else {
                createMutation.mutate(data);
            }
        } catch (error) {
            setIsUploading(false);
            console.error('Error uploading image:', error);
            toast.error('Erro ao enviar imagem', {
                description: 'Não foi possível fazer upload da imagem. Tente novamente.',
            });
        }
    };

    const handleClose = () => {
        reset();
        setSelectedFile(null);
        setPreviewUrl(null);
        setImageTab('url');
        onClose();
    };

    const isPending = isEditMode ? updateMutation.isPending : createMutation.isPending || isUploading;

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
                        <Label>Foto/Banner (Opcional)</Label>
                        <Tabs value={imageTab} onValueChange={(v) => setImageTab(v as 'url' | 'upload')} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="url" className="gap-2">
                                    <Link className="w-4 h-4" />
                                    URL
                                </TabsTrigger>
                                <TabsTrigger value="upload" className="gap-2">
                                    <Upload className="w-4 h-4" />
                                    Upload
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="url" className="mt-2">
                                <Input 
                                    id={`${idPrefix}banner`} 
                                    placeholder="https://..." 
                                    {...register('banner_url')}
                                    onChange={(e) => {
                                        setValue('banner_url', e.target.value);
                                        if (e.target.value) {
                                            setPreviewUrl(e.target.value);
                                            setSelectedFile(null);
                                        } else {
                                            setPreviewUrl(null);
                                        }
                                    }}
                                />
                            </TabsContent>
                            <TabsContent value="upload" className="mt-2">
                                <div className="space-y-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        id={`${idPrefix}file-upload`}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Selecionar Imagem
                                    </Button>
                                    <p className="text-xs text-muted-foreground text-center">
                                        JPG, PNG, WebP ou GIF. Máximo 5MB.
                                    </p>
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* Preview da imagem */}
                        {previewUrl && (
                            <div className="relative mt-2 rounded-lg overflow-hidden border border-border">
                                <img 
                                    src={previewUrl} 
                                    alt="Preview" 
                                    className="w-full h-32 object-cover"
                                    onError={() => setPreviewUrl(null)}
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-6 w-6"
                                    onClick={handleRemoveImage}
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>
                        )}
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
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Enviando imagem...
                                </>
                            ) : isPending ? config.pendingText : config.submitText}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CeremonyFormDialog;

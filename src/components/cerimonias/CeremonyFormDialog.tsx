import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { TOAST_MESSAGES } from '@/constants/messages';
import { Upload, Link, X, Loader2, Plus } from 'lucide-react';
import type { Cerimonia } from '@/types';

interface TipoConsagracao {
    id: string;
    nome: string;
}

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
    valor: number;
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
    const [showAddTipo, setShowAddTipo] = useState(false);
    const [novoTipo, setNovoTipo] = useState('');
    const [selectedTipo, setSelectedTipo] = useState<string>('');
    const [customNome, setCustomNome] = useState('');
    const [valorDisplay, setValorDisplay] = useState('');
    
    const isEditMode = mode === 'edit';
    const idPrefix = isEditMode ? 'edit-' : '';

    // Buscar tipos de consagração
    const { data: tiposConsagracao, refetch: refetchTipos } = useQuery({
        queryKey: ['tipos-consagracao'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tipos_consagracao')
                .select('id, nome')
                .eq('ativo', true)
                .order('nome');
            if (error) throw error;
            return data as TipoConsagracao[];
        },
    });

    // Mutation para adicionar novo tipo
    const addTipoMutation = useMutation({
        mutationFn: async (nome: string) => {
            const { data, error } = await supabase
                .from('tipos_consagracao')
                .insert({ nome })
                .select('id, nome')
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            toast.success('Tipo adicionado!');
            refetchTipos();
            setSelectedTipo(data.nome);
            setValue('nome', data.nome);
            setNovoTipo('');
            setShowAddTipo(false);
        },
        onError: (error: Error) => {
            toast.error('Erro ao adicionar tipo', {
                description: error.message.includes('duplicate') 
                    ? 'Este tipo já existe.' 
                    : 'Tente novamente.',
            });
        },
    });

    // Preencher formulário com dados da cerimônia no modo edição
    useEffect(() => {
        if (ceremony && isOpen && isEditMode) {
            const nomeValue = ceremony.nome || '';
            setValue('nome', nomeValue);
            
            // Verificar se o nome existe nos tipos cadastrados
            const tipoExiste = tiposConsagracao?.some(t => t.nome === nomeValue);
            if (tipoExiste) {
                setSelectedTipo(nomeValue);
                setCustomNome('');
            } else if (nomeValue) {
                // Nome customizado
                setSelectedTipo('__custom__');
                setCustomNome(nomeValue);
            } else {
                setSelectedTipo('');
                setCustomNome('');
            }
            
            setValue('data', ceremony.data);
            setValue('horario', ceremony.horario);
            setValue('local', ceremony.local);
            setValue('descricao', ceremony.descricao || '');
            setValue('medicina_principal', ceremony.medicina_principal || '');
            setValue('vagas', ceremony.vagas || 0);
            setValue('observacoes', ceremony.observacoes || '');
            setValue('banner_url', ceremony.banner_url || '');
            // Valor vem em centavos, converter para display
            const valorCentavos = ceremony.valor || 0;
            setValue('valor', valorCentavos);
            setValorDisplay(formatCentavosToReal(valorCentavos));
            if (ceremony.banner_url) {
                setPreviewUrl(ceremony.banner_url);
            }
        }
    }, [ceremony, isOpen, isEditMode, setValue, tiposConsagracao]);

    // Limpar preview quando fechar o dialog
    useEffect(() => {
        if (!isOpen) {
            setSelectedFile(null);
            setPreviewUrl(null);
            setImageTab('url');
            setShowAddTipo(false);
            setNovoTipo('');
            setSelectedTipo('');
            setCustomNome('');
            setValorDisplay('');
        }
    }, [isOpen]);

    // Funções para formatação de valor em Real
    const formatCentavosToReal = (centavos: number): string => {
        if (!centavos) return '';
        return (centavos / 100).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const parseRealToCentavos = (valor: string): number => {
        // Remove tudo exceto números e vírgula
        const cleaned = valor.replace(/[^\d,]/g, '');
        // Substitui vírgula por ponto e converte
        const numero = parseFloat(cleaned.replace(',', '.')) || 0;
        // Converte para centavos
        return Math.round(numero * 100);
    };

    const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        
        // Remove caracteres não numéricos exceto vírgula
        value = value.replace(/[^\d,]/g, '');
        
        // Garante apenas uma vírgula
        const parts = value.split(',');
        if (parts.length > 2) {
            value = parts[0] + ',' + parts.slice(1).join('');
        }
        
        // Limita casas decimais a 2
        if (parts.length === 2 && parts[1].length > 2) {
            value = parts[0] + ',' + parts[1].slice(0, 2);
        }
        
        setValorDisplay(value);
        setValue('valor', parseRealToCentavos(value));
    };

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
        setShowAddTipo(false);
        setNovoTipo('');
        setSelectedTipo('');
        setCustomNome('');
        setValorDisplay('');
        onClose();
    };

    const handleTipoChange = (value: string) => {
        if (value === '__custom__') {
            setSelectedTipo('__custom__');
            setValue('nome', customNome);
        } else {
            setSelectedTipo(value);
            setCustomNome('');
            setValue('nome', value);
        }
    };

    const handleCustomNomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomNome(e.target.value);
        setValue('nome', e.target.value);
    };

    const handleAddTipo = () => {
        if (novoTipo.trim()) {
            addTipoMutation.mutate(novoTipo.trim());
        }
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
                        <div className="flex items-center justify-between">
                            <Label htmlFor={`${idPrefix}nome`}>Nome da Consagração</Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-primary hover:text-primary/80"
                                onClick={() => setShowAddTipo(!showAddTipo)}
                            >
                                <Plus className="w-3 h-3 mr-1" />
                                Novo Tipo
                            </Button>
                        </div>
                        
                        {showAddTipo && (
                            <div className="flex gap-2 p-3 bg-muted/50 rounded-lg border border-border">
                                <Input
                                    placeholder="Nome do novo tipo..."
                                    value={novoTipo}
                                    onChange={(e) => setNovoTipo(e.target.value)}
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleAddTipo}
                                    disabled={!novoTipo.trim() || addTipoMutation.isPending}
                                >
                                    {addTipoMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        'Adicionar'
                                    )}
                                </Button>
                            </div>
                        )}

                        <Select value={selectedTipo} onValueChange={handleTipoChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo de consagração" />
                            </SelectTrigger>
                            <SelectContent>
                                {tiposConsagracao?.map((tipo) => (
                                    <SelectItem key={tipo.id} value={tipo.nome}>
                                        {tipo.nome}
                                    </SelectItem>
                                ))}
                                <SelectItem value="__custom__">
                                    ✏️ Escrever outro nome...
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {selectedTipo === '__custom__' && (
                            <Input
                                placeholder="Digite o nome da consagração..."
                                value={customNome}
                                onChange={handleCustomNomeChange}
                                className="mt-2"
                            />
                        )}
                        
                        <input type="hidden" {...register('nome', { required: true })} />
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor={`${idPrefix}vagas`}>Vagas</Label>
                            <Input 
                                id={`${idPrefix}vagas`} 
                                type="number" 
                                placeholder="20" 
                                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                {...register('vagas', { required: true, min: 1 })} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`${idPrefix}valor`}>Valor (R$)</Label>
                            <Input 
                                id={`${idPrefix}valor`}
                                type="text"
                                inputMode="decimal"
                                placeholder="150,00"
                                value={valorDisplay}
                                onChange={handleValorChange}
                            />
                            <input type="hidden" {...register('valor')} />
                        </div>
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

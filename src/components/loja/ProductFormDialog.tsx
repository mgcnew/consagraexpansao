import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, X, Loader2, BookOpen, Package, Smartphone, ImagePlus, FileText, Star, Eye } from 'lucide-react';
import type { Produto, CategoriaProduto } from '@/types';
import { useActiveHouse } from '@/hooks/useActiveHouse';

type DialogMode = 'create' | 'edit';

interface ProductFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: DialogMode;
  product?: Produto | null;
  categorias: CategoriaProduto[];
}

type TipoProduto = 'produto' | 'livro' | 'ebook';

interface ProductFormData {
  nome: string;
  descricao: string;
  preco: number;
  preco_promocional: number | null;
  categoria: string;
  estoque: number;
  ativo: boolean;
  destaque: boolean;
  imagem_url: string;
  is_ebook: boolean;
  arquivo_url: string | null;
  paginas: number | null;
  tipo_produto: TipoProduto;
}

const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
  isOpen,
  onClose,
  mode,
  product,
  categorias,
}) => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { data: house } = useActiveHouse();
  const { register, handleSubmit, reset, setValue, watch } = useForm<ProductFormData>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [precoDisplay, setPrecoDisplay] = useState('');
  const [precoPromoDisplay, setPrecoPromoDisplay] = useState('');
  const [ebookFile, setEbookFile] = useState<File | null>(null);
  const [isUploadingEbook, setIsUploadingEbook] = useState(false);
  const ebookInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = mode === 'edit';
  const ativo = watch('ativo');
  const destaque = watch('destaque');
  const tipoProduto = watch('tipo_produto') || 'produto';
  const isEbook = tipoProduto === 'ebook';
  const isLivro = tipoProduto === 'livro';
  const isLivroOuEbook = isEbook || isLivro;

  // Preencher formulário no modo edição
  useEffect(() => {
    if (product && isOpen && isEditMode) {
      setValue('nome', product.nome);
      setValue('descricao', product.descricao || '');
      setValue('preco', product.preco);
      setValue('preco_promocional', product.preco_promocional);
      setValue('categoria', product.categoria || '');
      setValue('estoque', product.estoque);
      setValue('ativo', product.ativo);
      setValue('destaque', product.destaque);
      setValue('imagem_url', product.imagem_url || '');
      setValue('is_ebook', product.is_ebook || false);
      setValue('arquivo_url', product.arquivo_url || null);
      setValue('paginas', product.paginas || null);
      // Determinar tipo baseado nos dados existentes
      if (product.is_ebook) {
        setValue('tipo_produto', 'ebook');
      } else if (product.categoria === 'Livros' || product.paginas) {
        setValue('tipo_produto', 'livro');
      } else {
        setValue('tipo_produto', 'produto');
      }
      setPrecoDisplay(formatCentavosToReal(product.preco));
      setPrecoPromoDisplay(product.preco_promocional ? formatCentavosToReal(product.preco_promocional) : '');
      if (product.imagem_url) {
        setPreviewUrl(product.imagem_url);
      }
    } else if (isOpen && !isEditMode) {
      setValue('ativo', true);
      setValue('destaque', false);
      setValue('estoque', 0);
      setValue('is_ebook', false);
      setValue('arquivo_url', null);
      setValue('paginas', null);
      setValue('tipo_produto', 'produto');
    }
  }, [product, isOpen, isEditMode, setValue]);

  // Limpar ao fechar
  useEffect(() => {
    if (!isOpen) {
      reset();
      setSelectedFile(null);
      setPreviewUrl(null);
      setPrecoDisplay('');
      setPrecoPromoDisplay('');
      setEbookFile(null);
    }
  }, [isOpen, reset]);

  // Formatação de valores
  const formatCentavosToReal = (centavos: number): string => {
    if (!centavos) return '';
    return (centavos / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseRealToCentavos = (valor: string): number => {
    const cleaned = valor.replace(/[^\d,]/g, '');
    const numero = parseFloat(cleaned.replace(',', '.')) || 0;
    return Math.round(numero * 100);
  };

  const handlePrecoChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'preco' | 'preco_promocional') => {
    let value = e.target.value.replace(/[^\d,]/g, '');
    const parts = value.split(',');
    if (parts.length > 2) value = parts[0] + ',' + parts.slice(1).join('');
    if (parts.length === 2 && parts[1].length > 2) value = parts[0] + ',' + parts[1].slice(0, 2);

    if (field === 'preco') {
      setPrecoDisplay(value);
      setValue('preco', parseRealToCentavos(value));
    } else {
      setPrecoPromoDisplay(value);
      setValue('preco_promocional', value ? parseRealToCentavos(value) : null);
    }
  };

  // Upload de imagem
  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `produtos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('produtos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('produtos')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Arquivo muito grande', { description: 'Máximo 5MB.' });
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Tipo inválido', { description: 'Apenas JPG, PNG ou WebP.' });
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setValue('imagem_url', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Upload de arquivo ebook
  const uploadEbookFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `ebooks-loja/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('ebooks')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('ebooks')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleEbookFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error('Arquivo muito grande', { description: 'Máximo 50MB.' });
        return;
      }
      const validTypes = ['application/pdf', 'application/epub+zip'];
      if (!validTypes.includes(file.type)) {
        toast.error('Tipo inválido', { description: 'Apenas PDF ou EPUB.' });
        return;
      }
      setEbookFile(file);
    }
  };

  const handleRemoveEbookFile = () => {
    setEbookFile(null);
    setValue('arquivo_url', null);
    if (ebookInputRef.current) ebookInputRef.current.value = '';
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const { error } = await supabase.from('produtos').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Produto criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      handleClose();
    },
    onError: () => {
      toast.error('Erro ao criar produto');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (!product) throw new Error('Produto não encontrado');
      const { error } = await supabase.from('produtos').update(data).eq('id', product.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Produto atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      handleClose();
    },
    onError: () => {
      toast.error('Erro ao atualizar produto');
    },
  });

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (selectedFile) {
        setIsUploading(true);
        data.imagem_url = await uploadImage(selectedFile);
        setIsUploading(false);
      }

      if (ebookFile && data.is_ebook) {
        setIsUploadingEbook(true);
        data.arquivo_url = await uploadEbookFile(ebookFile);
        setIsUploadingEbook(false);
      }

      // Se for ebook, estoque é infinito (não se aplica)
      if (data.is_ebook) {
        data.estoque = 999999;
      }

      if (isEditMode) {
        updateMutation.mutate(data);
      } else {
        createMutation.mutate(data);
      }
    } catch {
      setIsUploading(false);
      setIsUploadingEbook(false);
      toast.error('Erro ao enviar arquivo');
    }
  };

  const handleClose = () => {
    reset();
    setSelectedFile(null);
    setPreviewUrl(null);
    setPrecoDisplay('');
    setPrecoPromoDisplay('');
    setEbookFile(null);
    onClose();
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isUploading || isUploadingEbook;

  const formContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Imagem no topo - mais visual */}
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        {previewUrl ? (
          <div 
            className="relative rounded-xl overflow-hidden border-2 border-dashed border-primary/30 bg-muted/30 cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <img src={previewUrl} alt="Preview" className="w-full h-36 object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-medium">Trocar imagem</span>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveImage();
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            className="w-full h-32 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 bg-muted/30 hover:bg-muted/50 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="w-8 h-8" />
            <span className="text-sm font-medium">Adicionar imagem</span>
          </button>
        )}
      </div>

      {/* Nome e Tipo lado a lado no desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="nome" className="text-xs font-medium text-muted-foreground">Nome *</Label>
          <Input
            id="nome"
            placeholder="Ex: Colar de Sementes"
            className="h-10"
            {...register('nome', { required: true })}
          />
        </div>
        
        {/* Tipo de Produto compacto */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Tipo</Label>
          <div className="flex gap-1 h-10">
            <button
              type="button"
              onClick={() => {
                setValue('tipo_produto', 'produto');
                setValue('is_ebook', false);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border transition-all text-xs font-medium ${
                tipoProduto === 'produto' 
                  ? 'border-primary bg-primary text-primary-foreground' 
                  : 'border-input hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Produto</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('tipo_produto', 'livro');
                setValue('is_ebook', false);
                setValue('categoria', 'Livros');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border transition-all text-xs font-medium ${
                tipoProduto === 'livro' 
                  ? 'border-primary bg-primary text-primary-foreground' 
                  : 'border-input hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Livro</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('tipo_produto', 'ebook');
                setValue('is_ebook', true);
                setValue('categoria', 'Livros');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border transition-all text-xs font-medium ${
                tipoProduto === 'ebook' 
                  ? 'border-primary bg-primary text-primary-foreground' 
                  : 'border-input hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ebook</span>
            </button>
          </div>
        </div>
      </div>

      {/* Descricao */}
      <div className="space-y-1.5">
        <Label htmlFor="descricao" className="text-xs font-medium text-muted-foreground">Descricao</Label>
        <Textarea
          id="descricao"
          placeholder="Descreva o produto..."
          className="min-h-[70px] resize-none"
          {...register('descricao')}
        />
      </div>

      {/* Precos e Categoria/Estoque em grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="preco" className="text-xs font-medium text-muted-foreground">Preco (R$) *</Label>
          <Input
            id="preco"
            type="text"
            inputMode="decimal"
            placeholder="50,00"
            className="h-10"
            value={precoDisplay}
            onChange={(e) => handlePrecoChange(e, 'preco')}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="preco_promo" className="text-xs font-medium text-muted-foreground">Promocional</Label>
          <Input
            id="preco_promo"
            type="text"
            inputMode="decimal"
            placeholder="40,00"
            className="h-10"
            value={precoPromoDisplay}
            onChange={(e) => handlePrecoChange(e, 'preco_promocional')}
          />
        </div>
        
        {!isLivroOuEbook && (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Categoria</Label>
            <Select
              value={watch('categoria') || ''}
              onValueChange={(v) => setValue('categoria', v)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.nome}>
                    {cat.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {!isEbook && (
          <div className="space-y-1.5">
            <Label htmlFor="estoque" className="text-xs font-medium text-muted-foreground">Estoque</Label>
            <Input
              id="estoque"
              type="number"
              min="0"
              placeholder="0"
              className="h-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              {...register('estoque', { valueAsNumber: true })}
            />
          </div>
        )}
        
        {isLivroOuEbook && (
          <div className="space-y-1.5">
            <Label htmlFor="paginas" className="text-xs font-medium text-muted-foreground">Paginas</Label>
            <Input
              id="paginas"
              type="number"
              min="1"
              placeholder="150"
              className="h-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              {...register('paginas', { valueAsNumber: true })}
            />
          </div>
        )}
      </div>

      {/* Arquivo Ebook */}
      {isEbook && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Arquivo (PDF/EPUB)</Label>
          <input
            ref={ebookInputRef}
            type="file"
            accept=".pdf,.epub"
            onChange={handleEbookFileSelect}
            className="hidden"
          />
          {ebookFile || watch('arquivo_url') ? (
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {ebookFile?.name || 'Arquivo enviado'}
                </p>
                {ebookFile && (
                  <p className="text-xs text-muted-foreground">
                    {(ebookFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={handleRemoveEbookFile}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full h-10"
              onClick={() => ebookInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Selecionar Arquivo
            </Button>
          )}
        </div>
      )}

      {/* Switches com visual melhorado */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
        <div 
          className={`flex items-center gap-2 flex-1 p-2 rounded-lg cursor-pointer transition-colors ${ativo ? 'bg-green-500/10' : 'bg-muted/50'}`}
          onClick={() => setValue('ativo', !ativo)}
        >
          <Switch
            id="ativo"
            checked={ativo}
            onCheckedChange={(v) => setValue('ativo', v)}
          />
          <div className="flex items-center gap-1.5">
            <Eye className={`w-4 h-4 ${ativo ? 'text-green-600' : 'text-muted-foreground'}`} />
            <Label htmlFor="ativo" className="cursor-pointer text-sm">Visivel</Label>
          </div>
        </div>
        <div 
          className={`flex items-center gap-2 flex-1 p-2 rounded-lg cursor-pointer transition-colors ${destaque ? 'bg-amber-500/10' : 'bg-muted/50'}`}
          onClick={() => setValue('destaque', !destaque)}
        >
          <Switch
            id="destaque"
            checked={destaque}
            onCheckedChange={(v) => setValue('destaque', v)}
          />
          <div className="flex items-center gap-1.5">
            <Star className={`w-4 h-4 ${destaque ? 'text-amber-500' : 'text-muted-foreground'}`} />
            <Label htmlFor="destaque" className="cursor-pointer text-sm">Destaque</Label>
          </div>
        </div>
      </div>

      {/* Botoes */}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending} className="flex-1">
          {isUploading || isUploadingEbook ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : isEditMode ? (
            'Salvar'
          ) : (
            'Criar Produto'
          )}
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleClose}>
        <DrawerContent className="max-h-[90vh]">
          <div className="mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/20 mb-2" />
          <DrawerHeader className="pb-3 pt-0">
            <DrawerTitle className="font-display text-xl text-primary">
              {isEditMode ? 'Editar Produto' : 'Novo Produto'}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto flex-1 scrollbar-none">
            {formContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <DialogTitle className="font-display text-xl text-primary">
            {isEditMode ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 px-5 py-4 scrollbar-none">
          {formContent}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormDialog;

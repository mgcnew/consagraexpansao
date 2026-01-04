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
import { toast } from 'sonner';
import { Upload, X, Loader2, BookOpen, Package, Smartphone, ImagePlus, FileText, Star, Eye } from 'lucide-react';
import type { Produto, CategoriaProduto } from '@/types';

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
  const { register, handleSubmit, reset, setValue, watch } = useForm<ProductFormData>({
    defaultValues: {
      nome: '',
      descricao: '',
      preco: 0,
      preco_promocional: null,
      categoria: '',
      estoque: 0,
      ativo: true,
      destaque: false,
      imagem_url: '',
      is_ebook: false,
      arquivo_url: null,
      paginas: null,
      tipo_produto: 'produto',
    },
  });
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
  const ativo = watch('ativo') ?? true;
  const destaque = watch('destaque') ?? false;
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
      // Reset para valores default ao criar novo produto
      reset();
      setPrecoDisplay('');
      setPrecoPromoDisplay('');
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Imagem */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        {previewUrl ? (
          <div 
            className="relative rounded-lg overflow-hidden border border-border cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <img src={previewUrl} alt="Preview" className="w-full h-32 object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm">Trocar imagem</span>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveImage();
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            className="w-full h-28 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 bg-muted/20 hover:bg-muted/40 transition-all flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-primary"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="w-6 h-6" />
            <span className="text-xs">Adicionar imagem</span>
          </button>
        )}
      </div>

      {/* Nome */}
      <div className="space-y-1.5">
        <Label htmlFor="nome" className="text-sm">Nome do produto *</Label>
        <Input
          id="nome"
          placeholder="Ex: Colar de Sementes"
          {...register('nome', { required: true })}
        />
      </div>

      {/* Tipo de Produto */}
      <div className="space-y-1.5">
        <Label className="text-sm">Tipo</Label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              setValue('tipo_produto', 'produto');
              setValue('is_ebook', false);
            }}
            className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border transition-all text-sm ${
              tipoProduto === 'produto' 
                ? 'border-primary bg-primary text-primary-foreground' 
                : 'border-input hover:border-primary/50'
            }`}
          >
            <Package className="w-4 h-4" />
            Produto
          </button>
          <button
            type="button"
            onClick={() => {
              setValue('tipo_produto', 'livro');
              setValue('is_ebook', false);
              setValue('categoria', 'Livros');
            }}
            className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border transition-all text-sm ${
              tipoProduto === 'livro' 
                ? 'border-primary bg-primary text-primary-foreground' 
                : 'border-input hover:border-primary/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Livro
          </button>
          <button
            type="button"
            onClick={() => {
              setValue('tipo_produto', 'ebook');
              setValue('is_ebook', true);
              setValue('categoria', 'Livros');
            }}
            className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border transition-all text-sm ${
              tipoProduto === 'ebook' 
                ? 'border-primary bg-primary text-primary-foreground' 
                : 'border-input hover:border-primary/50'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Ebook
          </button>
        </div>
      </div>

      {/* Descricao */}
      <div className="space-y-1.5">
        <Label htmlFor="descricao" className="text-sm">Descricao</Label>
        <Textarea
          id="descricao"
          placeholder="Descreva o produto..."
          className="min-h-[60px] resize-none"
          {...register('descricao')}
        />
      </div>

      {/* Precos */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="preco" className="text-sm">Preco (R$) *</Label>
          <Input
            id="preco"
            type="text"
            inputMode="decimal"
            placeholder="50,00"
            value={precoDisplay}
            onChange={(e) => handlePrecoChange(e, 'preco')}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="preco_promo" className="text-sm">Promocional</Label>
          <Input
            id="preco_promo"
            type="text"
            inputMode="decimal"
            placeholder="40,00"
            value={precoPromoDisplay}
            onChange={(e) => handlePrecoChange(e, 'preco_promocional')}
          />
        </div>
      </div>

      {/* Categoria e Estoque */}
      <div className="grid grid-cols-2 gap-3">
        {!isLivroOuEbook ? (
          <div className="space-y-1.5">
            <Label className="text-sm">Categoria</Label>
            <Select
              value={watch('categoria') || ''}
              onValueChange={(v) => setValue('categoria', v)}
            >
              <SelectTrigger>
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
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="paginas" className="text-sm">Paginas</Label>
            <Input
              id="paginas"
              type="number"
              min="1"
              placeholder="150"
              className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              {...register('paginas', { valueAsNumber: true })}
            />
          </div>
        )}
        
        {!isEbook && (
          <div className="space-y-1.5">
            <Label htmlFor="estoque" className="text-sm">Estoque</Label>
            <Input
              id="estoque"
              type="number"
              min="0"
              placeholder="0"
              className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              {...register('estoque', { valueAsNumber: true })}
            />
          </div>
        )}
        
        {isEbook && (
          <div className="space-y-1.5">
            <Label htmlFor="estoque" className="text-sm">Estoque</Label>
            <Input
              value="Ilimitado"
              disabled
              className="bg-muted"
            />
          </div>
        )}
      </div>

      {/* Arquivo Ebook */}
      {isEbook && (
        <div className="space-y-1.5">
          <Label className="text-sm">Arquivo (PDF/EPUB)</Label>
          <input
            ref={ebookInputRef}
            type="file"
            accept=".pdf,.epub"
            onChange={handleEbookFileSelect}
            className="hidden"
          />
          {ebookFile || watch('arquivo_url') ? (
            <div className="flex items-center gap-3 p-2.5 rounded-lg border bg-muted/30">
              <FileText className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">
                  {ebookFile?.name || 'Arquivo enviado'}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={handleRemoveEbookFile}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => ebookInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Selecionar Arquivo
            </Button>
          )}
        </div>
      )}

      {/* Switches */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <Switch
            checked={ativo}
            onCheckedChange={(v) => setValue('ativo', v)}
          />
          <span className="flex items-center gap-1.5 text-sm">
            <Eye className={`w-4 h-4 ${ativo ? 'text-green-500' : 'text-muted-foreground'}`} />
            Visivel
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Switch
            checked={destaque}
            onCheckedChange={(v) => setValue('destaque', v)}
          />
          <span className="flex items-center gap-1.5 text-sm">
            <Star className={`w-4 h-4 ${destaque ? 'text-amber-500' : 'text-muted-foreground'}`} />
            Destaque
          </span>
        </label>
      </div>

      {/* Botoes */}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isUploading || isUploadingEbook ? 'Enviando...' : 'Salvando...'}
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
        <DrawerContent className="max-h-[85vh]">
          <div className="mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/20 mb-2" />
          <DrawerHeader className="pb-2 pt-0">
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
      <DialogContent 
        className="sm:max-w-lg bg-card border-border max-h-[85vh] flex flex-col"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-primary">
            {isEditMode ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 scrollbar-none -mx-6 px-6">
          {formContent}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormDialog;

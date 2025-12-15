import { useEffect, useState, useRef, memo } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { TOAST_MESSAGES } from '@/constants/messages';
import { Upload, Link, X, Loader2, Plus } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Cerimonia } from '@/types';

interface TipoConsagracao { id: string; nome: string; }
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

const formatCentavosToReal = (centavos: number): string => {
  if (!centavos) return '';
  return (centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const parseRealToCentavos = (valor: string): number => {
  const cleaned = valor.replace(/[^\d,]/g, '');
  const numero = parseFloat(cleaned.replace(',', '.')) || 0;
  return Math.round(numero * 100);
};

const CeremonyFormDialog: React.FC<CeremonyFormDialogProps> = ({ isOpen, onClose, mode, ceremony }) => {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue } = useForm<CeremonyFormData>();
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

  const { data: tiposConsagracao, refetch: refetchTipos } = useQuery({
    queryKey: ['tipos-consagracao'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tipos_consagracao').select('id, nome').eq('ativo', true).order('nome');
      if (error) throw error;
      return data as TipoConsagracao[];
    },
  });

  const addTipoMutation = useMutation({
    mutationFn: async (nome: string) => {
      const { data, error } = await supabase.from('tipos_consagracao').insert({ nome }).select('id, nome').single();
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
      toast.error('Erro ao adicionar tipo', { description: error.message.includes('duplicate') ? 'Este tipo já existe.' : 'Tente novamente.' });
    },
  });

  useEffect(() => {
    if (ceremony && isOpen && isEditMode) {
      const nomeValue = ceremony.nome || '';
      setValue('nome', nomeValue);
      const tipoExiste = tiposConsagracao?.some(t => t.nome === nomeValue);
      if (tipoExiste) { setSelectedTipo(nomeValue); setCustomNome(''); }
      else if (nomeValue) { setSelectedTipo('__custom__'); setCustomNome(nomeValue); }
      else { setSelectedTipo(''); setCustomNome(''); }
      setValue('data', ceremony.data);
      setValue('horario', ceremony.horario);
      setValue('local', ceremony.local);
      setValue('descricao', ceremony.descricao || '');
      setValue('medicina_principal', ceremony.medicina_principal || '');
      setValue('vagas', ceremony.vagas || 0);
      setValue('observacoes', ceremony.observacoes || '');
      setValue('banner_url', ceremony.banner_url || '');
      const valorCentavos = ceremony.valor || 0;
      setValue('valor', valorCentavos);
      setValorDisplay(formatCentavosToReal(valorCentavos));
      if (ceremony.banner_url) setPreviewUrl(ceremony.banner_url);
    }
  }, [ceremony, isOpen, isEditMode, setValue, tiposConsagracao]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null); setPreviewUrl(null); setImageTab('url');
      setShowAddTipo(false); setNovoTipo(''); setSelectedTipo('');
      setCustomNome(''); setValorDisplay('');
    }
  }, [isOpen]);

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^\d,]/g, '');
    const parts = value.split(',');
    if (parts.length > 2) value = parts[0] + ',' + parts.slice(1).join('');
    if (parts.length === 2 && parts[1].length > 2) value = parts[0] + ',' + parts[1].slice(0, 2);
    setValorDisplay(value);
    setValue('valor', parseRealToCentavos(value));
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('cerimonias').upload(`banners/${fileName}`, file);
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabase.storage.from('cerimonias').getPublicUrl(`banners/${fileName}`);
    return publicUrl;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast.error('Arquivo muito grande', { description: 'Máximo 5MB.' }); return; }
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) { toast.error('Tipo inválido'); return; }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setValue('banner_url', '');
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null); setPreviewUrl(null); setValue('banner_url', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const createMutation = useMutation({
    mutationFn: async (data: CeremonyFormData) => {
      const { error } = await supabase.from('cerimonias').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => { toast.success(TOAST_MESSAGES.cerimonia.criada.title); invalidateAndClose(); },
    onError: () => { toast.error(TOAST_MESSAGES.cerimonia.erro.title); }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CeremonyFormData) => {
      if (!ceremony) throw new Error('Cerimônia não encontrada');
      const { error } = await supabase.from('cerimonias').update(data).eq('id', ceremony.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success(TOAST_MESSAGES.cerimonia.atualizada.title); invalidateAndClose(); },
    onError: () => { toast.error(TOAST_MESSAGES.cerimonia.erro.title); }
  });

  const invalidateAndClose = () => {
    queryClient.invalidateQueries({ queryKey: ['cerimonias'] });
    queryClient.invalidateQueries({ queryKey: ['admin-cerimonias'] });
    reset(); onClose();
  };

  const onSubmit = async (data: CeremonyFormData) => {
    try {
      if (selectedFile) {
        setIsUploading(true);
        data.banner_url = await uploadImage(selectedFile);
        setIsUploading(false);
      }
      if (isEditMode) updateMutation.mutate(data);
      else createMutation.mutate(data);
    } catch {
      setIsUploading(false);
      toast.error('Erro ao enviar imagem');
    }
  };

  const handleClose = () => {
    reset(); setSelectedFile(null); setPreviewUrl(null); setImageTab('url');
    setShowAddTipo(false); setNovoTipo(''); setSelectedTipo('');
    setCustomNome(''); setValorDisplay(''); onClose();
  };

  const handleTipoChange = (value: string) => {
    if (value === '__custom__') { setSelectedTipo('__custom__'); setValue('nome', customNome); }
    else { setSelectedTipo(value); setCustomNome(''); setValue('nome', value); }
  };

  const isPending = isEditMode ? updateMutation.isPending : createMutation.isPending || isUploading;
  const config = {
    create: { title: 'Nova Cerimônia', submitText: 'Criar', pendingText: 'Criando...' },
    edit: { title: 'Editar Cerimônia', submitText: 'Salvar', pendingText: 'Salvando...' }
  }[mode];

  if (!isOpen) return null;

  const formContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Nome */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Consagração</Label>
          <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setShowAddTipo(!showAddTipo)}>
            <Plus className="w-3 h-3 mr-1" />Novo
          </Button>
        </div>
        {showAddTipo && (
          <div className="flex gap-2 p-2 bg-muted/50 rounded-lg">
            <Input placeholder="Novo tipo..." value={novoTipo} onChange={(e) => setNovoTipo(e.target.value)} className="flex-1 h-8" />
            <Button type="button" size="sm" onClick={() => novoTipo.trim() && addTipoMutation.mutate(novoTipo.trim())} disabled={addTipoMutation.isPending}>
              {addTipoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
            </Button>
          </div>
        )}
        <Select value={selectedTipo} onValueChange={handleTipoChange}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {tiposConsagracao?.map((t) => <SelectItem key={t.id} value={t.nome}>{t.nome}</SelectItem>)}
            <SelectItem value="__custom__">✏️ Outro...</SelectItem>
          </SelectContent>
        </Select>
        {selectedTipo === '__custom__' && <Input placeholder="Nome..." value={customNome} onChange={(e) => { setCustomNome(e.target.value); setValue('nome', e.target.value); }} />}
        <input type="hidden" {...register('nome', { required: true })} />
      </div>

      {/* Data/Hora */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Data</Label>
          <Input type="date" {...register('data', { required: true })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Horário</Label>
          <Input type="time" {...register('horario', { required: true })} />
        </div>
      </div>

      {/* Local */}
      <div className="space-y-1">
        <Label className="text-xs">Local</Label>
        <Input placeholder="Ex: Templo Principal" {...register('local', { required: true })} />
      </div>

      {/* Medicina */}
      <div className="space-y-1">
        <Label className="text-xs">Medicina</Label>
        <Input placeholder="Ex: Ayahuasca" {...register('medicina_principal', { required: true })} />
      </div>

      {/* Vagas/Valor */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Vagas</Label>
          <Input type="number" placeholder="20" {...register('vagas', { required: true, min: 1 })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Valor (R$)</Label>
          <Input type="text" inputMode="decimal" placeholder="150,00" value={valorDisplay} onChange={handleValorChange} />
          <input type="hidden" {...register('valor')} />
        </div>
      </div>

      {/* Imagem */}
      <div className="space-y-2">
        <Label className="text-xs">Banner (opcional)</Label>
        <Tabs value={imageTab} onValueChange={(v) => setImageTab(v as 'url' | 'upload')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="url" className="text-xs gap-1"><Link className="w-3 h-3" />URL</TabsTrigger>
            <TabsTrigger value="upload" className="text-xs gap-1"><Upload className="w-3 h-3" />Upload</TabsTrigger>
          </TabsList>
          <TabsContent value="url" className="mt-2">
            <Input placeholder="https://..." {...register('banner_url')} onChange={(e) => { setValue('banner_url', e.target.value); setPreviewUrl(e.target.value || null); setSelectedFile(null); }} />
          </TabsContent>
          <TabsContent value="upload" className="mt-2">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />Selecionar
            </Button>
          </TabsContent>
        </Tabs>
        {previewUrl && (
          <div className="relative rounded-lg overflow-hidden border">
            <img src={previewUrl} alt="Preview" className="w-full h-24 object-cover" onError={() => setPreviewUrl(null)} />
            <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={handleRemoveImage}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Descrição */}
      <div className="space-y-1">
        <Label className="text-xs">Descrição</Label>
        <Textarea placeholder="Detalhes..." {...register('descricao')} className="min-h-[60px]" />
      </div>

      {/* Botões */}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={handleClose} className="flex-1">Cancelar</Button>
        <Button type="submit" disabled={isPending} className="flex-1">
          {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</> : isPending ? config.pendingText : config.submitText}
        </Button>
      </div>
    </form>
  );

  // Mobile: Drawer
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader>
            <DrawerTitle className="font-display text-lg text-primary">{config.title}</DrawerTitle>
            <DrawerDescription className="sr-only">Formulário de cerimônia</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto">{formContent}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Dialog
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-primary">{config.title}</DialogTitle>
          <DialogDescription className="sr-only">Formulário de cerimônia</DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default memo(CeremonyFormDialog);

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
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { TOAST_MESSAGES } from '@/constants/messages';
import { Upload, Link, X, Loader2, Plus } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useActiveHouse } from '@/hooks/useActiveHouse';
import type { Cerimonia } from '@/types';

interface TemaConsagracao { id: string; nome: string; }
interface Medicina { id: string; nome: string; }
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
  const { data: activeHouse } = useActiveHouse();
  const { register, handleSubmit, reset, setValue } = useForm<CeremonyFormData>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageTab, setImageTab] = useState<'url' | 'upload'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showAddTema, setShowAddTema] = useState(false);
  const [novoTema, setNovoTema] = useState('');
  const [selectedTema, setSelectedTema] = useState<string>('');
  const [customNome, setCustomNome] = useState('');
  const [valorDisplay, setValorDisplay] = useState('');
  
  // Medicinas
  const [showAddMedicina, setShowAddMedicina] = useState(false);
  const [novaMedicina, setNovaMedicina] = useState('');
  const [selectedMedicinas, setSelectedMedicinas] = useState<string[]>([]);

  const isEditMode = mode === 'edit';

  // Buscar temas de consagracao
  const { data: temasConsagracao, refetch: refetchTemas } = useQuery({
    queryKey: ['temas-consagracao'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tipos_consagracao').select('id, nome').eq('ativo', true).order('nome');
      if (error) throw error;
      return data as TemaConsagracao[];
    },
  });

  // Buscar medicinas
  const { data: medicinas, refetch: refetchMedicinas } = useQuery({
    queryKey: ['medicinas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('medicinas').select('id, nome').order('nome');
      if (error) throw error;
      return data as Medicina[];
    },
  });

  // Adicionar novo tema
  const addTemaMutation = useMutation({
    mutationFn: async (nome: string) => {
      const { data, error } = await supabase.from('tipos_consagracao').insert({ nome }).select('id, nome').single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Tema adicionado!');
      refetchTemas();
      setSelectedTema(data.nome);
      setValue('nome', data.nome);
      setNovoTema('');
      setShowAddTema(false);
    },
    onError: (error: Error) => {
      toast.error('Erro ao adicionar tema', { description: error.message.includes('duplicate') ? 'Este tema ja existe.' : 'Tente novamente.' });
    },
  });

  // Adicionar nova medicina
  const addMedicinaMutation = useMutation({
    mutationFn: async (nome: string) => {
      const { data, error } = await supabase.from('medicinas').insert({ nome }).select('id, nome').single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Medicina adicionada!');
      refetchMedicinas();
      setSelectedMedicinas(prev => [...prev, data.nome]);
      setNovaMedicina('');
      setShowAddMedicina(false);
    },
    onError: (error: Error) => {
      toast.error('Erro ao adicionar medicina', { description: error.message.includes('duplicate') ? 'Esta medicina ja existe.' : 'Tente novamente.' });
    },
  });

  useEffect(() => {
    if (ceremony && isOpen && isEditMode) {
      const nomeValue = ceremony.nome || '';
      setValue('nome', nomeValue);
      const temaExiste = temasConsagracao?.some(t => t.nome === nomeValue);
      if (temaExiste) { setSelectedTema(nomeValue); setCustomNome(''); }
      else if (nomeValue) { setSelectedTema('__custom__'); setCustomNome(nomeValue); }
      else { setSelectedTema(''); setCustomNome(''); }
      setValue('data', ceremony.data);
      setValue('horario', ceremony.horario);
      setValue('local', ceremony.local);
      setValue('descricao', ceremony.descricao || '');
      
      // Medicinas - pode ser string separada por virgula ou array
      const medicinaValue = ceremony.medicina_principal || '';
      if (medicinaValue) {
        const meds = medicinaValue.split(',').map(m => m.trim()).filter(Boolean);
        setSelectedMedicinas(meds);
      } else {
        setSelectedMedicinas([]);
      }
      setValue('medicina_principal', medicinaValue);
      
      setValue('vagas', ceremony.vagas || 0);
      setValue('observacoes', ceremony.observacoes || '');
      setValue('banner_url', ceremony.banner_url || '');
      const valorCentavos = ceremony.valor || 0;
      setValue('valor', valorCentavos);
      setValorDisplay(formatCentavosToReal(valorCentavos));
      if (ceremony.banner_url) setPreviewUrl(ceremony.banner_url);
    }
  }, [ceremony, isOpen, isEditMode, setValue, temasConsagracao]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null); setPreviewUrl(null); setImageTab('url');
      setShowAddTema(false); setNovoTema(''); setSelectedTema('');
      setCustomNome(''); setValorDisplay('');
      setShowAddMedicina(false); setNovaMedicina(''); setSelectedMedicinas([]);
    }
  }, [isOpen]);

  // Atualizar medicina_principal quando selectedMedicinas mudar
  useEffect(() => {
    setValue('medicina_principal', selectedMedicinas.join(', '));
  }, [selectedMedicinas, setValue]);

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
      if (file.size > 5 * 1024 * 1024) { toast.error('Arquivo muito grande', { description: 'Maximo 5MB.' }); return; }
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) { toast.error('Tipo invalido'); return; }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setValue('banner_url', '');
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null); setPreviewUrl(null); setValue('banner_url', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleMedicina = (medicina: string) => {
    setSelectedMedicinas(prev => 
      prev.includes(medicina) 
        ? prev.filter(m => m !== medicina)
        : [...prev, medicina]
    );
  };

  const removeMedicina = (medicina: string) => {
    setSelectedMedicinas(prev => prev.filter(m => m !== medicina));
  };

  const createMutation = useMutation({
    mutationFn: async (data: CeremonyFormData) => {
      if (!activeHouse?.id) throw new Error('Nenhuma casa ativa');
      const { error } = await supabase.from('cerimonias').insert([{ ...data, house_id: activeHouse.id }]);
      if (error) throw error;
    },
    onSuccess: () => { toast.success(TOAST_MESSAGES.cerimonia.criada.title); invalidateAndClose(); },
    onError: () => { toast.error(TOAST_MESSAGES.cerimonia.erro.title); }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CeremonyFormData) => {
      if (!ceremony) throw new Error('Cerimonia nao encontrada');
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
    setShowAddTema(false); setNovoTema(''); setSelectedTema('');
    setCustomNome(''); setValorDisplay('');
    setShowAddMedicina(false); setNovaMedicina(''); setSelectedMedicinas([]);
    onClose();
  };

  const handleTemaChange = (value: string) => {
    if (value === '__custom__') { setSelectedTema('__custom__'); setValue('nome', customNome); }
    else { setSelectedTema(value); setCustomNome(''); setValue('nome', value); }
  };

  const isPending = isEditMode ? updateMutation.isPending : createMutation.isPending || isUploading;
  const config = {
    create: { title: 'Nova Cerimonia', submitText: 'Criar', pendingText: 'Criando...' },
    edit: { title: 'Editar Cerimonia', submitText: 'Salvar', pendingText: 'Salvando...' }
  }[mode];

  if (!isOpen) return null;

  const formContent = (
    <div className="space-y-4">
      {/* Tema da Consagracao */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Tema da Consagracao</Label>
          <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setShowAddTema(!showAddTema)}>
            <Plus className="w-3 h-3 mr-1" />Novo
          </Button>
        </div>
        {showAddTema && (
          <div className="flex gap-2 p-2 bg-muted/50 rounded-lg">
            <Input placeholder="Novo tema..." value={novoTema} onChange={(e) => setNovoTema(e.target.value)} className="flex-1 h-8" />
            <Button type="button" size="sm" onClick={() => novoTema.trim() && addTemaMutation.mutate(novoTema.trim())} disabled={addTemaMutation.isPending}>
              {addTemaMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
            </Button>
          </div>
        )}
        <Select value={selectedTema} onValueChange={handleTemaChange}>
          <SelectTrigger><SelectValue placeholder="Selecione um tema" /></SelectTrigger>
          <SelectContent>
            {temasConsagracao?.map((t) => <SelectItem key={t.id} value={t.nome}>{t.nome}</SelectItem>)}
            <SelectItem value="__custom__">Outro...</SelectItem>
          </SelectContent>
        </Select>
        {selectedTema === '__custom__' && <Input placeholder="Nome do tema..." value={customNome} onChange={(e) => { setCustomNome(e.target.value); setValue('nome', e.target.value); }} />}
        <input type="hidden" {...register('nome', { required: true })} />
      </div>

      {/* Data/Hora */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Data</Label>
          <Input type="date" {...register('data', { required: true })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Horario</Label>
          <Input type="time" {...register('horario', { required: true })} />
        </div>
      </div>

      {/* Local */}
      <div className="space-y-1">
        <Label className="text-xs">Local</Label>
        <Input placeholder="Ex: Templo Principal" {...register('local', { required: true })} />
      </div>

      {/* Medicinas - Multi-select */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Medicinas</Label>
          <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setShowAddMedicina(!showAddMedicina)}>
            <Plus className="w-3 h-3 mr-1" />Nova
          </Button>
        </div>
        {showAddMedicina && (
          <div className="flex gap-2 p-2 bg-muted/50 rounded-lg">
            <Input placeholder="Nova medicina..." value={novaMedicina} onChange={(e) => setNovaMedicina(e.target.value)} className="flex-1 h-8" />
            <Button type="button" size="sm" onClick={() => novaMedicina.trim() && addMedicinaMutation.mutate(novaMedicina.trim())} disabled={addMedicinaMutation.isPending}>
              {addMedicinaMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
            </Button>
          </div>
        )}
        
        {/* Medicinas selecionadas */}
        {selectedMedicinas.length > 0 && (
          <div className="flex flex-wrap gap-1.5 p-2 bg-muted/30 rounded-lg min-h-[36px]">
            {selectedMedicinas.map((med) => (
              <Badge key={med} variant="secondary" className="gap-1 pr-1">
                {med}
                <button type="button" onClick={() => removeMedicina(med)} className="ml-1 hover:bg-destructive/20 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        
        {/* Lista de medicinas disponiveis */}
        <div className="flex flex-wrap gap-1.5">
          {medicinas?.filter(m => !selectedMedicinas.includes(m.nome)).map((med) => (
            <Badge 
              key={med.id} 
              variant="outline" 
              className="cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() => toggleMedicina(med.nome)}
            >
              <Plus className="w-3 h-3 mr-1" />
              {med.nome}
            </Badge>
          ))}
          {(!medicinas || medicinas.length === 0) && !showAddMedicina && (
            <p className="text-xs text-muted-foreground">Nenhuma medicina cadastrada. Clique em "Nova" para adicionar.</p>
          )}
        </div>
        <input type="hidden" {...register('medicina_principal')} />
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

      {/* Descricao */}
      <div className="space-y-1">
        <Label className="text-xs">Descricao</Label>
        <Textarea placeholder="Detalhes..." {...register('descricao')} className="min-h-[60px]" />
      </div>

      {/* Botoes */}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={handleClose} className="flex-1">Cancelar</Button>
        <Button 
          type="button" 
          onClick={handleSubmit(onSubmit)}
          disabled={isPending} 
          className="flex-1"
        >
          {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</> : isPending ? config.pendingText : config.submitText}
        </Button>
      </div>
    </div>
  );

  // Mobile: Drawer
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()} modal={false}>
        <DrawerContent className="max-h-[92vh]" onPointerDownOutside={(e) => e.preventDefault()}>
          <DrawerHeader>
            <DrawerTitle className="font-display text-lg text-primary">{config.title}</DrawerTitle>
            <DrawerDescription className="sr-only">Formulario de cerimonia</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto">{formContent}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Dialog
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-primary">{config.title}</DialogTitle>
          <DialogDescription className="sr-only">Formulario de cerimonia</DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default memo(CeremonyFormDialog);

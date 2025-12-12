import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS, ROUTES } from '@/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  FileText, 
  User, 
  Heart, 
  Pill, 
  Sparkles, 
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Eye,
  Edit,
  Check,
  X,
  Camera,
  Upload
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { z } from 'zod';

const anamneseSchema = z.object({
  nome_completo: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  contato_emergencia: z.string().min(10, 'Contato de emergência é obrigatório'),
  nome_contato_emergencia: z.string().min(2, 'Nome do contato de emergência é obrigatório'),
  parentesco_contato: z.string().optional(),
  // Saúde - com opção de negar
  sem_doencas: z.boolean(),
  pressao_alta: z.boolean(),
  problemas_cardiacos: z.boolean(),
  historico_convulsivo: z.boolean(),
  diabetes: z.boolean(),
  problemas_respiratorios: z.boolean(),
  problemas_renais: z.boolean(),
  problemas_hepaticos: z.boolean(),
  transtorno_psiquiatrico: z.boolean(),
  transtorno_psiquiatrico_qual: z.string().optional(),
  gestante_lactante: z.boolean(),
  uso_medicamentos: z.string().optional(),
  uso_antidepressivos: z.boolean(),
  tipo_antidepressivo: z.string().optional(),
  alergias: z.string().optional(),
  cirurgias_recentes: z.string().optional(),
  // Substâncias - com opção de negar
  sem_vicios: z.boolean(),
  tabaco: z.boolean(),
  tabaco_frequencia: z.string().optional(),
  alcool: z.boolean(),
  alcool_frequencia: z.string().optional(),
  cannabis: z.boolean(),
  outras_substancias: z.string().optional(),
  // Experiência
  ja_consagrou: z.boolean(),
  quantas_vezes_consagrou: z.string().optional(),
  como_foi_experiencia: z.string().optional(),
  intencao: z.string().optional(),
  restricao_alimentar: z.string().optional(),
  // Consentimentos
  aceite_contraindicacoes: z.boolean().refine(val => val === true, 'Você deve aceitar as contraindicações'),
  aceite_livre_vontade: z.boolean().refine(val => val === true, 'Você deve confirmar sua livre vontade'),
  aceite_termo_responsabilidade: z.boolean().refine(val => val === true, 'Você deve aceitar o termo de responsabilidade'),
});

type AnamneseFormData = z.infer<typeof anamneseSchema>;

const Anamnese: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [existingAnamnese, setExistingAnamnese] = useState<AnamneseFormData | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<'view' | 'edit' | 'new'>('new');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [formData, setFormData] = useState<AnamneseFormData>({
    nome_completo: '',
    data_nascimento: '',
    telefone: '',
    contato_emergencia: '',
    nome_contato_emergencia: '',
    parentesco_contato: '',
    sem_doencas: false,
    pressao_alta: false,
    problemas_cardiacos: false,
    historico_convulsivo: false,
    diabetes: false,
    problemas_respiratorios: false,
    problemas_renais: false,
    problemas_hepaticos: false,
    transtorno_psiquiatrico: false,
    transtorno_psiquiatrico_qual: '',
    gestante_lactante: false,
    uso_medicamentos: '',
    uso_antidepressivos: false,
    tipo_antidepressivo: '',
    alergias: '',
    cirurgias_recentes: '',
    sem_vicios: false,
    tabaco: false,
    tabaco_frequencia: '',
    alcool: false,
    alcool_frequencia: '',
    cannabis: false,
    outras_substancias: '',
    ja_consagrou: false,
    quantas_vezes_consagrou: '',
    como_foi_experiencia: '',
    intencao: '',
    restricao_alimentar: '',
    aceite_contraindicacoes: false,
    aceite_livre_vontade: false,
    aceite_termo_responsabilidade: false,
  });

  useEffect(() => {
    const fetchAnamnese = async () => {
      if (!user) return;

      // Buscar avatar do profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();
      
      if (profileData?.avatar_url) {
        setAvatarUrl(profileData.avatar_url);
      }

      // Always check if user has existing anamnese in database first
      const { data, error } = await supabase
        .from('anamneses')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        // User has existing anamnese - load from database
        const mapped: AnamneseFormData = {
          nome_completo: data.nome_completo,
          data_nascimento: data.data_nascimento,
          telefone: data.telefone,
          contato_emergencia: data.contato_emergencia,
          nome_contato_emergencia: data.nome_contato_emergencia || '',
          parentesco_contato: data.parentesco_contato || '',
          sem_doencas: data.sem_doencas || false,
          pressao_alta: data.pressao_alta,
          problemas_cardiacos: data.problemas_cardiacos,
          historico_convulsivo: data.historico_convulsivo,
          diabetes: data.diabetes,
          problemas_respiratorios: data.problemas_respiratorios || false,
          problemas_renais: data.problemas_renais || false,
          problemas_hepaticos: data.problemas_hepaticos || false,
          transtorno_psiquiatrico: data.transtorno_psiquiatrico || false,
          transtorno_psiquiatrico_qual: data.transtorno_psiquiatrico_qual || '',
          gestante_lactante: data.gestante_lactante || false,
          uso_medicamentos: data.uso_medicamentos || '',
          uso_antidepressivos: data.uso_antidepressivos,
          tipo_antidepressivo: data.tipo_antidepressivo || '',
          alergias: data.alergias || '',
          cirurgias_recentes: data.cirurgias_recentes || '',
          sem_vicios: data.sem_vicios || false,
          tabaco: data.tabaco,
          tabaco_frequencia: data.tabaco_frequencia || '',
          alcool: data.alcool,
          alcool_frequencia: data.alcool_frequencia || '',
          cannabis: data.cannabis || false,
          outras_substancias: data.outras_substancias || '',
          ja_consagrou: data.ja_consagrou,
          quantas_vezes_consagrou: data.quantas_vezes_consagrou || '',
          como_foi_experiencia: data.como_foi_experiencia || '',
          intencao: data.intencao || '',
          restricao_alimentar: data.restricao_alimentar || '',
          aceite_contraindicacoes: data.aceite_contraindicacoes ?? false,
          aceite_livre_vontade: data.aceite_livre_vontade ?? false,
          aceite_termo_responsabilidade: data.aceite_termo_responsabilidade ?? false,
        };
        setFormData(mapped);
        setExistingAnamnese(mapped);
        setViewMode('view'); // Mostrar modo visualização quando já existe ficha
        // Clear any draft since we have real data
        try {
          localStorage.removeItem(STORAGE_KEYS.ANAMNESE_DRAFT);
        } catch (e) {
          console.error('Failed to clear draft:', e);
        }
      }

      setIsFetching(false);
    };

    fetchAnamnese();
  }, [user]);

  // Save form data to localStorage
  const saveToLocalStorage = (data: AnamneseFormData) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ANAMNESE_DRAFT, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  };

  // Load form data from localStorage
  const loadFromLocalStorage = (): AnamneseFormData | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ANAMNESE_DRAFT);
      return saved ? JSON.parse(saved) : null;
    } catch (err) {
      console.error('Failed to load from localStorage:', err);
      return null;
    }
  };

  // Clear localStorage after successful submit
  const clearLocalStorage = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.ANAMNESE_DRAFT);
    } catch (err) {
      console.error('Failed to clear localStorage:', err);
    }
  };

  const updateField = <K extends keyof AnamneseFormData>(field: K, value: AnamneseFormData[K]) => {
    setFormData(prev => {
      const updatedData = { ...prev, [field]: value };
      // Auto-save to localStorage on every field change
      saveToLocalStorage(updatedData);
      return updatedData;
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateMultipleFields = (updates: Partial<AnamneseFormData>) => {
    setFormData(prev => {
      const updatedData = { ...prev, ...updates };
      saveToLocalStorage(updatedData);
      return updatedData;
    });
  };

  const hasContraindicacoes = formData.pressao_alta || 
    formData.problemas_cardiacos || 
    formData.historico_convulsivo || 
    formData.uso_antidepressivos ||
    formData.transtorno_psiquiatrico ||
    formData.gestante_lactante;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validar tipo e tamanho
    if (!file.type.startsWith('image/')) {
      toast.error('Arquivo inválido', { description: 'Selecione uma imagem.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande', { description: 'Máximo 5MB.' });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload para o storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const newAvatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Atualizar profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(newAvatarUrl);
      toast.success('Foto atualizada!');
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao enviar foto');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async () => {
    setErrors({});

    try {
      anamneseSchema.parse(formData);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            newErrors[e.path[0].toString()] = e.message;
          }
        });
        setErrors(newErrors);
        toast.error('Campos obrigatórios', {
          description: 'Por favor, verifique os campos destacados.',
        });
        return;
      }
    }

    if (!user) return;

    setIsLoading(true);

    const payload = {
      user_id: user.id,
      ...formData,
    };

    let error;

    if (existingAnamnese) {
      const { error: updateError } = await supabase
        .from('anamneses')
        .update(payload)
        .eq('user_id', user.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('anamneses')
        .insert(payload);
      error = insertError;
    }

    setIsLoading(false);

    if (error) {
      toast.error('Erro ao salvar', {
        description: error.message,
      });
    } else {
      // Clear localStorage after successful submission
      clearLocalStorage();
      setExistingAnamnese(formData);
      setViewMode('view');
      setStep(1);
      toast.success(existingAnamnese ? 'Ficha atualizada!' : 'Ficha salva!', {
        description: 'Sua ficha de anamnese foi salva com sucesso.',
      });
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const steps = [
    { number: 1, title: 'Dados Pessoais', icon: User },
    { number: 2, title: 'Saúde', icon: Heart },
    { number: 3, title: 'Substâncias', icon: Pill },
    { number: 4, title: 'Experiência', icon: Sparkles },
    { number: 5, title: 'Consentimento', icon: CheckCircle2 },
  ];

  // Formatar data para exibição
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Componente para exibir item de informação
  const InfoItem = ({ label, value }: { label: string; value: string | boolean | undefined }) => (
    <div className="py-2 border-b border-border last:border-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">
        {typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : (value || '-')}
      </p>
    </div>
  );

  // Tela de visualização da ficha preenchida
  if (viewMode === 'view' && existingAnamnese) {
    return (
      <div className="min-h-screen py-4 md:py-6">
        <div className="container max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="font-display text-3xl font-medium text-foreground mb-2">
              Ficha de Anamnese
            </h1>
            <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
              <Check className="w-3 h-3 mr-1" />
              Preenchida
            </Badge>
          </div>

          {/* Botões de ação */}
          <div className="flex justify-center gap-4 mb-8">
            <Button
              variant="outline"
              onClick={() => setViewMode('edit')}
              className="gap-2"
            >
              <Edit className="w-4 h-4" />
              Editar Ficha
            </Button>
          </div>

          {/* Cards de visualização */}
          <div className="space-y-4">
            {/* Dados Pessoais */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Dados Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InfoItem label="Nome Completo" value={formData.nome_completo} />
                <InfoItem label="Data de Nascimento" value={formatDate(formData.data_nascimento)} />
                <InfoItem label="Telefone" value={formData.telefone} />
                <InfoItem label="Contato de Emergência" value={formData.nome_contato_emergencia} />
                <InfoItem label="Telefone de Emergência" value={formData.contato_emergencia} />
                <InfoItem label="Parentesco" value={formData.parentesco_contato} />
              </CardContent>
            </Card>

            {/* Saúde */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Histórico de Saúde
                </CardTitle>
              </CardHeader>
              <CardContent>
                {formData.sem_doencas ? (
                  <p className="text-green-600 dark:text-green-400 font-medium py-2">
                    <Check className="w-4 h-4 inline mr-2" />
                    Não possui doenças ou condições de saúde
                  </p>
                ) : (
                  <>
                    {formData.pressao_alta && <InfoItem label="Pressão Alta" value={true} />}
                    {formData.problemas_cardiacos && <InfoItem label="Problemas Cardíacos" value={true} />}
                    {formData.historico_convulsivo && <InfoItem label="Histórico de Convulsões" value={true} />}
                    {formData.diabetes && <InfoItem label="Diabetes" value={true} />}
                    {formData.problemas_respiratorios && <InfoItem label="Problemas Respiratórios" value={true} />}
                    {formData.problemas_renais && <InfoItem label="Problemas Renais" value={true} />}
                    {formData.problemas_hepaticos && <InfoItem label="Problemas Hepáticos" value={true} />}
                    {formData.transtorno_psiquiatrico && <InfoItem label="Transtorno Psiquiátrico" value={formData.transtorno_psiquiatrico_qual || 'Sim'} />}
                    {formData.gestante_lactante && <InfoItem label="Gestante ou Lactante" value={true} />}
                    {formData.uso_antidepressivos && <InfoItem label="Uso de Antidepressivos" value={formData.tipo_antidepressivo || 'Sim'} />}
                  </>
                )}
                <InfoItem label="Medicamentos em uso" value={formData.uso_medicamentos} />
                <InfoItem label="Alergias" value={formData.alergias} />
                <InfoItem label="Cirurgias recentes" value={formData.cirurgias_recentes} />
              </CardContent>
            </Card>

            {/* Substâncias */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Pill className="w-5 h-5 text-primary" />
                  Uso de Substâncias
                </CardTitle>
              </CardHeader>
              <CardContent>
                {formData.sem_vicios ? (
                  <p className="text-green-600 dark:text-green-400 font-medium py-2">
                    <Check className="w-4 h-4 inline mr-2" />
                    Não faz uso de substâncias
                  </p>
                ) : (
                  <>
                    {formData.tabaco && <InfoItem label="Tabaco" value={formData.tabaco_frequencia || 'Sim'} />}
                    {formData.alcool && <InfoItem label="Álcool" value={formData.alcool_frequencia || 'Sim'} />}
                    {formData.cannabis && <InfoItem label="Cannabis" value={true} />}
                    {formData.outras_substancias && <InfoItem label="Outras substâncias" value={formData.outras_substancias} />}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Experiência */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Experiência Espiritual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InfoItem label="Já participou de cerimônias" value={formData.ja_consagrou} />
                {formData.ja_consagrou && (
                  <>
                    <InfoItem label="Quantas vezes" value={formData.quantas_vezes_consagrou} />
                    <InfoItem label="Como foi a experiência" value={formData.como_foi_experiencia} />
                  </>
                )}
                <InfoItem label="Intenção" value={formData.intencao} />
                <InfoItem label="Restrições alimentares" value={formData.restricao_alimentar} />
              </CardContent>
            </Card>

            {/* Consentimentos */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Termos de Consentimento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <Check className="w-4 h-4" />
                    <span>Contraindicações aceitas</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <Check className="w-4 h-4" />
                    <span>Livre vontade confirmada</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <Check className="w-4 h-4" />
                    <span>Termo de responsabilidade aceito</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 md:py-6">
      <div className="container max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-medium text-foreground mb-2">
            Ficha de Anamnese
          </h1>
          <p className="text-muted-foreground font-body">
            {viewMode === 'edit' ? 'Edite suas informações de saúde.' : 'Preencha sua ficha para participar das cerimônias.'}
          </p>
          {viewMode === 'edit' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('view')}
              className="mt-2 gap-2"
            >
              <X className="w-4 h-4" />
              Cancelar edição
            </Button>
          )}
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((s) => (
            <div
              key={s.number}
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-body transition-all ${
                step === s.number
                  ? 'bg-primary text-primary-foreground'
                  : step > s.number
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <s.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{s.title}</span>
            </div>
          ))}
        </div>

        {/* Form Card */}
        <Card className="animate-fade-in-up">
          {/* Step 1: Dados Pessoais */}
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Dados Pessoais
                </CardTitle>
                <CardDescription>Informações básicas para contato.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 md:space-y-4">
                {/* Upload de Foto */}
                <div className="flex flex-col items-center gap-3 pb-4 border-b">
                  <div className="relative">
                    <Avatar className="w-24 h-24 border-4 border-primary/20">
                      <AvatarImage src={avatarUrl || undefined} alt="Sua foto" />
                      <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                        {formData.nome_completo?.charAt(0)?.toUpperCase() || <User className="w-8 h-8" />}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Clique no ícone para adicionar sua foto<br />
                    (aparecerá nas suas partilhas)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={formData.nome_completo}
                    onChange={(e) => updateField('nome_completo', e.target.value)}
                    placeholder="Seu nome completo"
                    autoComplete="name"
                  />
                  {errors.nome_completo && <p className="text-sm text-destructive">{errors.nome_completo}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nascimento">Data de Nascimento *</Label>
                  <Input
                    id="nascimento"
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) => updateField('data_nascimento', e.target.value)}
                    autoComplete="bday"
                  />
                  {errors.data_nascimento && <p className="text-sm text-destructive">{errors.data_nascimento}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    type="tel"
                    inputMode="tel"
                    value={formData.telefone}
                    onChange={(e) => updateField('telefone', e.target.value)}
                    placeholder="(00) 00000-0000"
                    autoComplete="tel"
                  />
                  {errors.telefone && <p className="text-sm text-destructive">{errors.telefone}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome_contato_emergencia">Nome do Contato de Emergência *</Label>
                  <Input
                    id="nome_contato_emergencia"
                    value={formData.nome_contato_emergencia}
                    onChange={(e) => updateField('nome_contato_emergencia', e.target.value)}
                    placeholder="Nome completo do contato"
                  />
                  {errors.nome_contato_emergencia && <p className="text-sm text-destructive">{errors.nome_contato_emergencia}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencia">Telefone do Contato de Emergência *</Label>
                  <Input
                    id="emergencia"
                    type="tel"
                    inputMode="tel"
                    value={formData.contato_emergencia}
                    onChange={(e) => updateField('contato_emergencia', e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                  {errors.contato_emergencia && <p className="text-sm text-destructive">{errors.contato_emergencia}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentesco">Parentesco/Relação</Label>
                  <Input
                    id="parentesco"
                    value={formData.parentesco_contato}
                    onChange={(e) => updateField('parentesco_contato', e.target.value)}
                    placeholder="Ex: Mãe, Pai, Cônjuge, Amigo(a)"
                  />
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2: Saúde */}
          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Histórico de Saúde
                </CardTitle>
                <CardDescription>Marque as condições que se aplicam a você ou selecione "Não possuo doenças".</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasContraindicacoes && (
                  <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive">Atenção: Contraindicações detectadas</p>
                      <p className="text-sm text-muted-foreground">
                        Algumas condições marcadas podem representar contraindicações. 
                        Converse com o facilitador antes de participar.
                      </p>
                    </div>
                  </div>
                )}

                {/* Opção de não ter doenças */}
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="sem_doencas"
                      checked={formData.sem_doencas}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          // Desmarcar todas as doenças se marcar "não tenho"
                          updateMultipleFields({
                            sem_doencas: true,
                            pressao_alta: false,
                            problemas_cardiacos: false,
                            historico_convulsivo: false,
                            diabetes: false,
                            problemas_respiratorios: false,
                            problemas_renais: false,
                            problemas_hepaticos: false,
                            transtorno_psiquiatrico: false,
                            gestante_lactante: false,
                            uso_antidepressivos: false,
                          });
                        } else {
                          updateField('sem_doencas', false);
                        }
                      }}
                    />
                    <Label htmlFor="sem_doencas" className="cursor-pointer font-medium text-primary">
                      Não possuo nenhuma doença ou condição de saúde
                    </Label>
                  </div>
                </div>

                <div className="space-y-4 md:space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {formData.sem_doencas ? 'Você indicou não possuir doenças.' : 'Marque as condições que se aplicam:'}
                  </p>
                  {[
                    { id: 'pressao_alta', label: 'Pressão Alta (Hipertensão)', warning: true },
                    { id: 'problemas_cardiacos', label: 'Problemas Cardíacos', warning: true },
                    { id: 'historico_convulsivo', label: 'Histórico de Convulsões', warning: true },
                    { id: 'diabetes', label: 'Diabetes', warning: false },
                    { id: 'problemas_respiratorios', label: 'Problemas Respiratórios (Asma, etc.)', warning: false },
                    { id: 'problemas_renais', label: 'Problemas Renais', warning: false },
                    { id: 'problemas_hepaticos', label: 'Problemas Hepáticos (Fígado)', warning: false },
                    { id: 'transtorno_psiquiatrico', label: 'Transtorno Psiquiátrico', warning: true },
                    { id: 'gestante_lactante', label: 'Gestante ou Lactante', warning: true },
                    { id: 'uso_antidepressivos', label: 'Uso de Antidepressivos', warning: true },
                  ].map((item) => (
                    <div key={item.id} className={`flex items-center space-x-3 min-h-[44px] md:min-h-0 ${formData.sem_doencas ? 'opacity-50' : ''}`}>
                      <Checkbox
                        id={item.id}
                        checked={formData[item.id as keyof AnamneseFormData] as boolean}
                        disabled={formData.sem_doencas}
                        onCheckedChange={(checked) => {
                          updateField(item.id as keyof AnamneseFormData, checked as boolean);
                          if (checked) updateField('sem_doencas', false);
                        }}
                      />
                      <Label 
                        htmlFor={item.id} 
                        className={`flex-1 py-2 md:py-0 ${formData.sem_doencas ? 'cursor-not-allowed' : 'cursor-pointer'} ${item.warning && formData[item.id as keyof AnamneseFormData] ? 'text-destructive font-medium' : ''}`}
                      >
                        {item.label}
                        {item.warning && !formData.sem_doencas && <span className="text-xs text-destructive ml-2">(contraindicação)</span>}
                      </Label>
                    </div>
                  ))}

                  {formData.transtorno_psiquiatrico && !formData.sem_doencas && (
                    <div className="space-y-2 ml-7 animate-fade-in">
                      <Label htmlFor="transtorno_qual">Qual transtorno?</Label>
                      <Input
                        id="transtorno_qual"
                        value={formData.transtorno_psiquiatrico_qual}
                        onChange={(e) => updateField('transtorno_psiquiatrico_qual', e.target.value)}
                        placeholder="Descreva o transtorno..."
                      />
                    </div>
                  )}

                  {formData.uso_antidepressivos && !formData.sem_doencas && (
                    <div className="space-y-2 ml-7 animate-fade-in">
                      <Label htmlFor="tipo_antidepressivo">Qual medicamento?</Label>
                      <Input
                        id="tipo_antidepressivo"
                        value={formData.tipo_antidepressivo}
                        onChange={(e) => updateField('tipo_antidepressivo', e.target.value)}
                        placeholder="Nome do antidepressivo..."
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medicamentos">Outros medicamentos em uso</Label>
                  <Textarea
                    id="medicamentos"
                    value={formData.uso_medicamentos}
                    onChange={(e) => updateField('uso_medicamentos', e.target.value)}
                    placeholder="Liste outros medicamentos que você usa regularmente..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alergias">Alergias</Label>
                  <Textarea
                    id="alergias"
                    value={formData.alergias}
                    onChange={(e) => updateField('alergias', e.target.value)}
                    placeholder="Liste suas alergias conhecidas ou escreva 'Nenhuma'..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cirurgias">Cirurgias recentes (últimos 6 meses)</Label>
                  <Textarea
                    id="cirurgias"
                    value={formData.cirurgias_recentes}
                    onChange={(e) => updateField('cirurgias_recentes', e.target.value)}
                    placeholder="Descreva cirurgias recentes ou escreva 'Nenhuma'..."
                  />
                </div>
              </CardContent>
            </>
          )}

          {/* Step 3: Substâncias */}
          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  <Pill className="w-5 h-5 text-primary" />
                  Uso de Substâncias
                </CardTitle>
                <CardDescription>Informações sobre consumo de substâncias. Seja honesto, isso é importante para sua segurança.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Opção de não ter vícios */}
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="sem_vicios"
                      checked={formData.sem_vicios}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateMultipleFields({
                            sem_vicios: true,
                            tabaco: false,
                            alcool: false,
                            cannabis: false,
                            tabaco_frequencia: '',
                            alcool_frequencia: '',
                            outras_substancias: '',
                          });
                        } else {
                          updateField('sem_vicios', false);
                        }
                      }}
                    />
                    <Label htmlFor="sem_vicios" className="cursor-pointer font-medium text-primary">
                      Não faço uso de nenhuma substância
                    </Label>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {formData.sem_vicios ? 'Você indicou não fazer uso de substâncias.' : 'Marque as substâncias que você utiliza:'}
                  </p>
                  
                  <div className="space-y-3">
                    <div className={`flex items-center space-x-3 ${formData.sem_vicios ? 'opacity-50' : ''}`}>
                      <Checkbox
                        id="tabaco"
                        checked={formData.tabaco}
                        disabled={formData.sem_vicios}
                        onCheckedChange={(checked) => {
                          updateField('tabaco', checked as boolean);
                          if (checked) updateField('sem_vicios', false);
                          if (!checked) updateField('tabaco_frequencia', '');
                        }}
                      />
                      <Label htmlFor="tabaco" className={formData.sem_vicios ? 'cursor-not-allowed' : 'cursor-pointer'}>Tabaco (cigarro, charuto, etc.)</Label>
                    </div>
                    {formData.tabaco && !formData.sem_vicios && (
                      <div className="ml-7 animate-fade-in">
                        <Input
                          value={formData.tabaco_frequencia}
                          onChange={(e) => updateField('tabaco_frequencia', e.target.value)}
                          placeholder="Com que frequência? (ex: 10 cigarros/dia)"
                        />
                      </div>
                    )}

                    <div className={`flex items-center space-x-3 ${formData.sem_vicios ? 'opacity-50' : ''}`}>
                      <Checkbox
                        id="alcool"
                        checked={formData.alcool}
                        disabled={formData.sem_vicios}
                        onCheckedChange={(checked) => {
                          updateField('alcool', checked as boolean);
                          if (checked) updateField('sem_vicios', false);
                          if (!checked) updateField('alcool_frequencia', '');
                        }}
                      />
                      <Label htmlFor="alcool" className={formData.sem_vicios ? 'cursor-not-allowed' : 'cursor-pointer'}>Bebidas Alcoólicas</Label>
                    </div>
                    {formData.alcool && !formData.sem_vicios && (
                      <div className="ml-7 animate-fade-in">
                        <Input
                          value={formData.alcool_frequencia}
                          onChange={(e) => updateField('alcool_frequencia', e.target.value)}
                          placeholder="Com que frequência? (ex: socialmente, diariamente)"
                        />
                      </div>
                    )}

                    <div className={`flex items-center space-x-3 ${formData.sem_vicios ? 'opacity-50' : ''}`}>
                      <Checkbox
                        id="cannabis"
                        checked={formData.cannabis}
                        disabled={formData.sem_vicios}
                        onCheckedChange={(checked) => {
                          updateField('cannabis', checked as boolean);
                          if (checked) updateField('sem_vicios', false);
                        }}
                      />
                      <Label htmlFor="cannabis" className={formData.sem_vicios ? 'cursor-not-allowed' : 'cursor-pointer'}>Cannabis (maconha)</Label>
                    </div>
                  </div>

                  <div className={`space-y-2 ${formData.sem_vicios ? 'opacity-50' : ''}`}>
                    <Label htmlFor="outras">Outras substâncias</Label>
                    <Textarea
                      id="outras"
                      value={formData.outras_substancias}
                      onChange={(e) => updateField('outras_substancias', e.target.value)}
                      placeholder="Descreva outras substâncias que você utiliza ou utilizou recentemente..."
                      disabled={formData.sem_vicios}
                    />
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 4: Experiência */}
          {step === 4 && (
            <>
              <CardHeader>
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Experiência Espiritual
                </CardTitle>
                <CardDescription>Conte-nos sobre suas experiências anteriores e intenções.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="ja_consagrou"
                    checked={formData.ja_consagrou}
                    onCheckedChange={(checked) => {
                      updateField('ja_consagrou', checked as boolean);
                      if (!checked) {
                        updateField('quantas_vezes_consagrou', '');
                        updateField('como_foi_experiencia', '');
                      }
                    }}
                  />
                  <Label htmlFor="ja_consagrou" className="cursor-pointer">
                    Já participei de cerimônias com Ayahuasca ou outras medicinas sagradas
                  </Label>
                </div>

                {formData.ja_consagrou && (
                  <div className="space-y-4 ml-7 animate-fade-in">
                    <div className="space-y-2">
                      <Label htmlFor="quantas_vezes">Quantas vezes aproximadamente?</Label>
                      <Input
                        id="quantas_vezes"
                        value={formData.quantas_vezes_consagrou}
                        onChange={(e) => updateField('quantas_vezes_consagrou', e.target.value)}
                        placeholder="Ex: 5 vezes, mais de 10, primeira vez foi em 2020..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experiencia">Como foram suas experiências?</Label>
                      <Textarea
                        id="experiencia"
                        value={formData.como_foi_experiencia}
                        onChange={(e) => updateField('como_foi_experiencia', e.target.value)}
                        placeholder="Descreva brevemente como foram suas experiências anteriores, se teve dificuldades, como se sentiu..."
                      />
                    </div>
                  </div>
                )}

                {!formData.ja_consagrou && (
                  <div className="p-4 bg-muted rounded-lg animate-fade-in">
                    <p className="text-sm text-muted-foreground">
                      Esta será sua primeira experiência. Não se preocupe, você receberá todas as orientações necessárias antes da cerimônia.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="intencao">Qual sua intenção ao participar? *</Label>
                  <Textarea
                    id="intencao"
                    value={formData.intencao}
                    onChange={(e) => updateField('intencao', e.target.value)}
                    placeholder="O que você busca nesta jornada? Qual sua intenção? O que te motivou a participar?"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="restricao_alimentar">Restrições Alimentares</Label>
                  <Textarea
                    id="restricao_alimentar"
                    value={formData.restricao_alimentar}
                    onChange={(e) => updateField('restricao_alimentar', e.target.value)}
                    placeholder="Vegetariano, vegano, intolerância a lactose, alergia a glúten, etc. Ou escreva 'Nenhuma'"
                  />
                </div>
              </CardContent>
            </>
          )}

          {/* Step 5: Consentimento */}
          {step === 5 && (
            <>
              <CardHeader>
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Termo de Consentimento
                </CardTitle>
                <CardDescription>Leia atentamente e confirme sua concordância.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-muted rounded-lg space-y-3 text-sm">
                  <p><strong>Contraindicações importantes:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Gestantes e lactantes não devem participar</li>
                    <li>Pessoas com transtornos psiquiátricos graves devem consultar previamente</li>
                    <li>Uso de antidepressivos ISRS é contraindicado com Ayahuasca</li>
                    <li>Problemas cardíacos graves podem representar riscos</li>
                    <li>Histórico de convulsões requer avaliação especial</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="aceite1"
                      checked={formData.aceite_contraindicacoes}
                      onCheckedChange={(checked) => updateField('aceite_contraindicacoes', checked as boolean)}
                    />
                    <Label htmlFor="aceite1" className="cursor-pointer text-sm leading-relaxed">
                      Li e compreendi as contraindicações acima. Caso me enquadre em alguma, 
                      comprometo-me a conversar com o facilitador antes da cerimônia.
                    </Label>
                  </div>
                  {errors.aceite_contraindicacoes && (
                    <p className="text-sm text-destructive ml-7">{errors.aceite_contraindicacoes}</p>
                  )}

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="aceite2"
                      checked={formData.aceite_livre_vontade}
                      onCheckedChange={(checked) => updateField('aceite_livre_vontade', checked as boolean)}
                    />
                    <Label htmlFor="aceite2" className="cursor-pointer text-sm leading-relaxed">
                      Declaro que estou participando por livre e espontânea vontade, 
                      ciente de que se trata de uma prática espiritual com uso de medicinas sagradas.
                    </Label>
                  </div>
                  {errors.aceite_livre_vontade && (
                    <p className="text-sm text-destructive ml-7">{errors.aceite_livre_vontade}</p>
                  )}

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="aceite3"
                      checked={formData.aceite_termo_responsabilidade}
                      onCheckedChange={(checked) => updateField('aceite_termo_responsabilidade', checked as boolean)}
                    />
                    <Label htmlFor="aceite3" className="cursor-pointer text-sm leading-relaxed">
                      Aceito o termo de responsabilidade e me comprometo a seguir 
                      as orientações do facilitador durante toda a cerimônia.
                    </Label>
                  </div>
                  {errors.aceite_termo_responsabilidade && (
                    <p className="text-sm text-destructive ml-7">{errors.aceite_termo_responsabilidade}</p>
                  )}
                </div>
              </CardContent>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between p-6 pt-0">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            {step < 5 ? (
              <Button onClick={() => setStep(step + 1)}>
                Próximo
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {existingAnamnese ? 'Atualizar Ficha' : 'Salvar Ficha'}
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Anamnese;

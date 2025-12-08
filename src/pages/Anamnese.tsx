import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
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
  ChevronLeft
} from 'lucide-react';
import { z } from 'zod';

const anamneseSchema = z.object({
  nome_completo: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  contato_emergencia: z.string().min(10, 'Contato de emergência é obrigatório'),
  pressao_alta: z.boolean(),
  problemas_cardiacos: z.boolean(),
  historico_convulsivo: z.boolean(),
  diabetes: z.boolean(),
  uso_medicamentos: z.string().optional(),
  uso_antidepressivos: z.boolean(),
  alergias: z.string().optional(),
  tabaco: z.boolean(),
  alcool: z.boolean(),
  outras_substancias: z.string().optional(),
  ja_consagrou: z.boolean(),
  como_foi_experiencia: z.string().optional(),
  intencao: z.string().optional(),
  aceite_contraindicacoes: z.boolean().refine(val => val === true, 'Você deve aceitar as contraindicações'),
  aceite_livre_vontade: z.boolean().refine(val => val === true, 'Você deve confirmar sua livre vontade'),
  aceite_termo_responsabilidade: z.boolean().refine(val => val === true, 'Você deve aceitar o termo de responsabilidade'),
});

type AnamneseFormData = z.infer<typeof anamneseSchema>;

const Anamnese: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [existingAnamnese, setExistingAnamnese] = useState<AnamneseFormData | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<AnamneseFormData>({
    nome_completo: '',
    data_nascimento: '',
    telefone: '',
    contato_emergencia: '',
    pressao_alta: false,
    problemas_cardiacos: false,
    historico_convulsivo: false,
    diabetes: false,
    uso_medicamentos: '',
    uso_antidepressivos: false,
    alergias: '',
    tabaco: false,
    alcool: false,
    outras_substancias: '',
    ja_consagrou: false,
    como_foi_experiencia: '',
    intencao: '',
    aceite_contraindicacoes: false,
    aceite_livre_vontade: false,
    aceite_termo_responsabilidade: false,
  });

  useEffect(() => {
    const fetchAnamnese = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('anamneses')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        const mapped: AnamneseFormData = {
          nome_completo: data.nome_completo,
          data_nascimento: data.data_nascimento,
          telefone: data.telefone,
          contato_emergencia: data.contato_emergencia,
          pressao_alta: data.pressao_alta,
          problemas_cardiacos: data.problemas_cardiacos,
          historico_convulsivo: data.historico_convulsivo,
          diabetes: data.diabetes,
          uso_medicamentos: data.uso_medicamentos || '',
          uso_antidepressivos: data.uso_antidepressivos,
          alergias: data.alergias || '',
          tabaco: data.tabaco,
          alcool: data.alcool,
          outras_substancias: data.outras_substancias || '',
          ja_consagrou: data.ja_consagrou,
          como_foi_experiencia: data.como_foi_experiencia || '',
          intencao: data.intencao || '',
          aceite_contraindicacoes: data.aceite_contraindicacoes,
          aceite_livre_vontade: data.aceite_livre_vontade,
          aceite_termo_responsabilidade: data.aceite_termo_responsabilidade,
        };
        setFormData(mapped);
        setExistingAnamnese(mapped);
      }

      setIsFetching(false);
    };

    fetchAnamnese();
  }, [user]);

  const updateField = <K extends keyof AnamneseFormData>(field: K, value: AnamneseFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const hasContraindicacoes = formData.pressao_alta || 
    formData.problemas_cardiacos || 
    formData.historico_convulsivo || 
    formData.uso_antidepressivos;

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
        toast({
          title: 'Campos obrigatórios',
          description: 'Por favor, verifique os campos destacados.',
          variant: 'destructive',
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
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: existingAnamnese ? 'Ficha atualizada!' : 'Ficha salva!',
        description: 'Sua ficha de anamnese foi salva com sucesso.',
      });
      navigate('/');
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

  return (
    <div className="min-h-screen py-8 px-4">
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
            {existingAnamnese ? 'Atualize suas informações de saúde.' : 'Preencha sua ficha para participar das cerimônias.'}
          </p>
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
                  <Label htmlFor="emergencia">Contato de Emergência *</Label>
                  <Input
                    id="emergencia"
                    type="tel"
                    inputMode="tel"
                    value={formData.contato_emergencia}
                    onChange={(e) => updateField('contato_emergencia', e.target.value)}
                    placeholder="Nome e telefone de um familiar"
                  />
                  {errors.contato_emergencia && <p className="text-sm text-destructive">{errors.contato_emergencia}</p>}
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
                <CardDescription>Marque as condições que se aplicam a você.</CardDescription>
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

                <div className="space-y-4 md:space-y-3">
                  {[
                    { id: 'pressao_alta', label: 'Pressão Alta (Hipertensão)', warning: true },
                    { id: 'problemas_cardiacos', label: 'Problemas Cardíacos', warning: true },
                    { id: 'historico_convulsivo', label: 'Histórico de Convulsões', warning: true },
                    { id: 'diabetes', label: 'Diabetes', warning: false },
                    { id: 'uso_antidepressivos', label: 'Uso de Antidepressivos', warning: true },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 min-h-[44px] md:min-h-0">
                      <Checkbox
                        id={item.id}
                        checked={formData[item.id as keyof AnamneseFormData] as boolean}
                        onCheckedChange={(checked) => updateField(item.id as keyof AnamneseFormData, checked as boolean)}
                      />
                      <Label htmlFor={item.id} className={`cursor-pointer flex-1 py-2 md:py-0 ${item.warning && formData[item.id as keyof AnamneseFormData] ? 'text-destructive font-medium' : ''}`}>
                        {item.label}
                        {item.warning && <span className="text-xs text-destructive ml-2">(contraindicação)</span>}
                      </Label>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medicamentos">Medicamentos em uso (se houver)</Label>
                  <Textarea
                    id="medicamentos"
                    value={formData.uso_medicamentos}
                    onChange={(e) => updateField('uso_medicamentos', e.target.value)}
                    placeholder="Liste os medicamentos que você usa regularmente..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alergias">Alergias (se houver)</Label>
                  <Textarea
                    id="alergias"
                    value={formData.alergias}
                    onChange={(e) => updateField('alergias', e.target.value)}
                    placeholder="Liste suas alergias conhecidas..."
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
                <CardDescription>Informações sobre consumo de substâncias.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="tabaco"
                      checked={formData.tabaco}
                      onCheckedChange={(checked) => updateField('tabaco', checked as boolean)}
                    />
                    <Label htmlFor="tabaco" className="cursor-pointer">Uso de Tabaco</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="alcool"
                      checked={formData.alcool}
                      onCheckedChange={(checked) => updateField('alcool', checked as boolean)}
                    />
                    <Label htmlFor="alcool" className="cursor-pointer">Consumo de Álcool</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outras">Outras substâncias (se houver)</Label>
                  <Textarea
                    id="outras"
                    value={formData.outras_substancias}
                    onChange={(e) => updateField('outras_substancias', e.target.value)}
                    placeholder="Descreva outras substâncias que você utiliza..."
                  />
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
                <CardDescription>Conte-nos sobre suas experiências anteriores.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="ja_consagrou"
                    checked={formData.ja_consagrou}
                    onCheckedChange={(checked) => updateField('ja_consagrou', checked as boolean)}
                  />
                  <Label htmlFor="ja_consagrou" className="cursor-pointer">
                    Já participei de cerimônias com Ayahuasca ou outras medicinas
                  </Label>
                </div>

                {formData.ja_consagrou && (
                  <div className="space-y-2 animate-fade-in">
                    <Label htmlFor="experiencia">Como foi sua experiência?</Label>
                    <Textarea
                      id="experiencia"
                      value={formData.como_foi_experiencia}
                      onChange={(e) => updateField('como_foi_experiencia', e.target.value)}
                      placeholder="Descreva brevemente como foram suas experiências anteriores..."
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="intencao">Qual sua intenção ao participar?</Label>
                  <Textarea
                    id="intencao"
                    value={formData.intencao}
                    onChange={(e) => updateField('intencao', e.target.value)}
                    placeholder="O que você busca nesta jornada? Qual sua intenção?"
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

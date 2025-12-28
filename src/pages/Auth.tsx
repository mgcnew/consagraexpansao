import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Loader2, Mail, ArrowLeft, ArrowRight, LogIn, UserPlus, TestTube, 
  Check, Building2, User, MapPin, CreditCard, Sparkles, Crown, Zap
} from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

// Estados brasileiros
const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

interface HousePlan {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  billing_period: string;
  features: string[];
}

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn, signUp, resetPassword, signInWithGoogle } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [activeTab, setActiveTab] = useState('entrar');
  
  // Wizard step para criar casa
  const [createStep, setCreateStep] = useState(1);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  // Step 1: Dados do usuário
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerConfirmPassword, setOwnerConfirmPassword] = useState('');
  
  // Step 2: Dados da casa
  const [houseName, setHouseName] = useState('');
  const [houseCity, setHouseCity] = useState('');
  const [houseState, setHouseState] = useState('');
  
  // Step 3: Plano
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  
  // Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/app';

  // Buscar planos disponíveis
  const { data: plans = [] } = useQuery({
    queryKey: ['house-plans-auth'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('house_plans')
        .select('*')
        .eq('active', true)
        .order('price_cents');
      
      if (error) throw error;
      return data as HousePlan[];
    },
  });

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  // Selecionar plano intermediário por padrão (melhor conversão)
  useEffect(() => {
    if (plans.length > 1 && !selectedPlanId) {
      setSelectedPlanId(plans[1]?.id || plans[0]?.id);
    }
  }, [plans, selectedPlanId]);

  // Formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  // Login com Google
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error('Erro no login com Google', { description: error.message });
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrors({});

    try {
      const validatedData = loginSchema.parse({
        email: loginEmail,
        password: loginPassword,
      });

      setIsLoading(true);
      const { error } = await signIn(validatedData.email, validatedData.password);

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Erro ao entrar', { description: 'Email ou senha incorretos.' });
        } else {
          toast.error('Erro ao entrar', { description: error.message });
        }
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) errors[e.path[0].toString()] = e.message;
        });
        setLoginErrors(errors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Validar step 1
  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!ownerName || ownerName.length < 3) {
      errors.ownerName = 'Nome deve ter pelo menos 3 caracteres';
    }
    if (!ownerEmail || !z.string().email().safeParse(ownerEmail).success) {
      errors.ownerEmail = 'Email inválido';
    }
    if (!ownerPhone || ownerPhone.replace(/\D/g, '').length < 10) {
      errors.ownerPhone = 'Telefone inválido';
    }
    if (!ownerPassword || ownerPassword.length < 6) {
      errors.ownerPassword = 'Senha deve ter pelo menos 6 caracteres';
    }
    if (ownerPassword !== ownerConfirmPassword) {
      errors.ownerConfirmPassword = 'As senhas não coincidem';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validar step 2
  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!houseName || houseName.length < 3) {
      errors.houseName = 'Nome da casa deve ter pelo menos 3 caracteres';
    }
    if (!houseCity || houseCity.length < 2) {
      errors.houseCity = 'Cidade é obrigatória';
    }
    if (!houseState) {
      errors.houseState = 'Estado é obrigatório';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Avançar step
  const handleNextStep = () => {
    if (createStep === 1 && validateStep1()) {
      setCreateStep(2);
    } else if (createStep === 2 && validateStep2()) {
      setCreateStep(3);
    }
  };

  // Voltar step
  const handlePrevStep = () => {
    if (createStep > 1) {
      setCreateStep(createStep - 1);
      setFormErrors({});
    }
  };

  // Finalizar cadastro
  const handleCreateHouse = async () => {
    if (!selectedPlanId) {
      toast.error('Selecione um plano');
      return;
    }

    setIsLoading(true);
    
    try {
      // Criar usuário
      const { error: signUpError } = await signUp(ownerEmail, ownerPassword, ownerName);

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          toast.error('Email já cadastrado', {
            description: 'Este email já está registrado. Tente fazer login.',
          });
        } else {
          toast.error('Erro ao criar conta', { description: signUpError.message });
        }
        return;
      }

      // Salvar dados para criar casa após confirmação do email
      localStorage.setItem('pending_house', JSON.stringify({
        name: houseName,
        city: houseCity,
        state: houseState,
        planId: selectedPlanId,
        ownerPhone: ownerPhone.replace(/\D/g, ''),
      }));

      toast.success('Conta criada com sucesso!', {
        description: 'Verifique seu email para confirmar o cadastro.',
      });
      
      // Resetar formulário
      setCreateStep(1);
      setActiveTab('entrar');
      
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail) {
      toast.error('Email necessário', { description: 'Por favor, digite seu email.' });
      return;
    }

    setIsLoading(true);
    const { error } = await resetPassword(resetEmail);
    setIsLoading(false);

    if (error) {
      toast.error('Erro', { description: error.message });
    } else {
      toast.success('Email enviado', {
        description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      });
      setShowResetPassword(false);
      setResetEmail('');
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  // Ícone do plano
  const getPlanIcon = (index: number) => {
    if (index === 0) return <Zap className="w-5 h-5" />;
    if (index === 1) return <Sparkles className="w-5 h-5" />;
    return <Crown className="w-5 h-5" />;
  };

  // Cor do plano
  const getPlanColor = (index: number) => {
    if (index === 0) return 'text-blue-500';
    if (index === 1) return 'text-purple-500';
    return 'text-amber-500';
  };

  if (showResetPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-2 md:px-4 py-6 md:py-12">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="text-center pb-2">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 left-4"
                onClick={() => setShowResetPassword(false)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="font-display text-2xl">Recuperar Senha</CardTitle>
              <CardDescription className="font-body">
                Digite seu email para receber um link de recuperação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar Link'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-background px-2 md:px-4 py-4 md:py-8">
      <div className="w-full max-w-lg animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-3">
            <img src="/logo-full.png" alt="Ahoo" className="w-full h-full object-contain" />
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-medium text-foreground mb-1">Ahoo</h1>
          <p className="text-muted-foreground font-body text-sm">Plataforma para Casas de Consagração</p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCreateStep(1); setFormErrors({}); }} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="entrar" className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Entrar</span>
              </TabsTrigger>
              <TabsTrigger value="criar" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Criar Casa</span>
              </TabsTrigger>
              <TabsTrigger value="teste" className="flex items-center gap-2">
                <TestTube className="w-4 h-4" />
                <span className="hidden sm:inline">Teste</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab Entrar */}
            <TabsContent value="entrar">
              <CardHeader className="text-center pb-4">
                <CardTitle className="font-display text-xl">Bem-vindo de volta!</CardTitle>
                <CardDescription className="font-body">Entre com sua conta para acessar o sistema.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full bg-white text-black hover:bg-gray-100 border-gray-200 h-12 text-base"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 488 512">
                      <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                    </svg>
                  )}
                  Entrar com Google
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">ou com email</span>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      disabled={isLoading}
                      className={loginErrors.email ? 'border-red-500' : ''}
                    />
                    {loginErrors.email && <p className="text-xs text-red-500">{loginErrors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={isLoading}
                      className={loginErrors.password ? 'border-red-500' : ''}
                    />
                    {loginErrors.password && <p className="text-xs text-red-500">{loginErrors.password}</p>}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar'}
                  </Button>
                </form>

                <Button
                  variant="link"
                  className="w-full text-muted-foreground"
                  onClick={() => setShowResetPassword(true)}
                >
                  Esqueceu sua senha?
                </Button>
              </CardContent>
            </TabsContent>

            {/* Tab Criar Casa - Wizard */}
            <TabsContent value="criar">
              {/* Progress indicator */}
              <div className="px-6 pt-4">
                <div className="flex items-center justify-between mb-2">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                        createStep >= step 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        {createStep > step ? <Check className="w-4 h-4" /> : step}
                      </div>
                      {step < 3 && (
                        <div className={cn(
                          "w-16 sm:w-24 h-1 mx-2 rounded transition-colors",
                          createStep > step ? "bg-primary" : "bg-muted"
                        )} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Seus dados</span>
                  <span>Sua casa</span>
                  <span>Plano</span>
                </div>
              </div>

              {/* Step 1: Dados do usuário */}
              {createStep === 1 && (
                <>
                  <CardHeader className="text-center pb-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="font-display text-xl">Seus Dados</CardTitle>
                    <CardDescription className="font-body">Informações do responsável pela casa</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="owner-name">Nome Completo *</Label>
                      <Input
                        id="owner-name"
                        placeholder="Seu nome completo"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        disabled={isLoading}
                        className={formErrors.ownerName ? 'border-red-500' : ''}
                      />
                      {formErrors.ownerName && <p className="text-xs text-red-500">{formErrors.ownerName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="owner-email">Email *</Label>
                      <Input
                        id="owner-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        disabled={isLoading}
                        className={formErrors.ownerEmail ? 'border-red-500' : ''}
                      />
                      {formErrors.ownerEmail && <p className="text-xs text-red-500">{formErrors.ownerEmail}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="owner-phone">Telefone/WhatsApp *</Label>
                      <Input
                        id="owner-phone"
                        placeholder="(11) 99999-9999"
                        value={ownerPhone}
                        onChange={(e) => setOwnerPhone(formatPhone(e.target.value))}
                        disabled={isLoading}
                        className={formErrors.ownerPhone ? 'border-red-500' : ''}
                      />
                      {formErrors.ownerPhone && <p className="text-xs text-red-500">{formErrors.ownerPhone}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="owner-password">Senha *</Label>
                        <Input
                          id="owner-password"
                          type="password"
                          placeholder="••••••••"
                          value={ownerPassword}
                          onChange={(e) => setOwnerPassword(e.target.value)}
                          disabled={isLoading}
                          className={formErrors.ownerPassword ? 'border-red-500' : ''}
                        />
                        {formErrors.ownerPassword && <p className="text-xs text-red-500">{formErrors.ownerPassword}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="owner-confirm">Confirmar *</Label>
                        <Input
                          id="owner-confirm"
                          type="password"
                          placeholder="••••••••"
                          value={ownerConfirmPassword}
                          onChange={(e) => setOwnerConfirmPassword(e.target.value)}
                          disabled={isLoading}
                          className={formErrors.ownerConfirmPassword ? 'border-red-500' : ''}
                        />
                        {formErrors.ownerConfirmPassword && <p className="text-xs text-red-500">{formErrors.ownerConfirmPassword}</p>}
                      </div>
                    </div>

                    <Button onClick={handleNextStep} className="w-full" disabled={isLoading}>
                      Próximo
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </>
              )}

              {/* Step 2: Dados da casa */}
              {createStep === 2 && (
                <>
                  <CardHeader className="text-center pb-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="font-display text-xl">Sua Casa</CardTitle>
                    <CardDescription className="font-body">Informações básicas da casa de consagração</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="house-name">Nome da Casa *</Label>
                      <Input
                        id="house-name"
                        placeholder="Ex: Casa do Sol, Espaço Luz..."
                        value={houseName}
                        onChange={(e) => setHouseName(e.target.value)}
                        disabled={isLoading}
                        className={formErrors.houseName ? 'border-red-500' : ''}
                      />
                      {formErrors.houseName && <p className="text-xs text-red-500">{formErrors.houseName}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="house-city">Cidade *</Label>
                        <Input
                          id="house-city"
                          placeholder="São Paulo"
                          value={houseCity}
                          onChange={(e) => setHouseCity(e.target.value)}
                          disabled={isLoading}
                          className={formErrors.houseCity ? 'border-red-500' : ''}
                        />
                        {formErrors.houseCity && <p className="text-xs text-red-500">{formErrors.houseCity}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="house-state">Estado *</Label>
                        <Select value={houseState} onValueChange={setHouseState} disabled={isLoading}>
                          <SelectTrigger className={formErrors.houseState ? 'border-red-500' : ''}>
                            <SelectValue placeholder="UF" />
                          </SelectTrigger>
                          <SelectContent>
                            {ESTADOS_BR.map((uf) => (
                              <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formErrors.houseState && <p className="text-xs text-red-500">{formErrors.houseState}</p>}
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Você poderá adicionar endereço completo, logo e outras informações depois de criar sua conta.
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={handlePrevStep} className="flex-1" disabled={isLoading}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                      </Button>
                      <Button onClick={handleNextStep} className="flex-1" disabled={isLoading}>
                        Próximo
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </>
              )}

              {/* Step 3: Escolha do plano */}
              {createStep === 3 && (
                <>
                  <CardHeader className="text-center pb-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <CreditCard className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="font-display text-xl">Escolha seu Plano</CardTitle>
                    <CardDescription className="font-body">Comece com 14 dias grátis em qualquer plano</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {plans.map((plan, index) => (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={cn(
                            "relative p-4 rounded-xl border-2 cursor-pointer transition-all",
                            selectedPlanId === plan.id
                              ? "border-primary bg-primary/5 shadow-md"
                              : "border-border hover:border-primary/50",
                            index === 1 && "ring-2 ring-purple-500/20"
                          )}
                        >
                          {index === 1 && (
                            <span className="absolute -top-2.5 left-4 bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
                              Mais popular
                            </span>
                          )}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={getPlanColor(index)}>{getPlanIcon(index)}</span>
                              <span className="font-semibold">{plan.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xl font-bold">{formatPrice(plan.price_cents)}</span>
                              <span className="text-xs text-muted-foreground">/mês</span>
                            </div>
                          </div>
                          {plan.description && (
                            <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                          )}
                          <div className="space-y-1.5">
                            {(plan.features as string[])?.map((feature, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <Check className="w-4 h-4 text-green-500 shrink-0" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm">
                      <Sparkles className="w-4 h-4 inline mr-2 text-green-600" />
                      <strong>14 dias grátis!</strong> Teste todas as funcionalidades sem compromisso.
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={handlePrevStep} className="flex-1" disabled={isLoading}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                      </Button>
                      <Button 
                        onClick={handleCreateHouse} 
                        className="flex-1" 
                        disabled={isLoading || !selectedPlanId}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            Criar Conta
                            <Check className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>

                    <p className="text-center text-xs text-muted-foreground">
                      Ao criar sua conta, você concorda com nossos termos de uso.
                    </p>
                  </CardContent>
                </>
              )}
            </TabsContent>

            {/* Tab Teste */}
            <TabsContent value="teste">
              <CardHeader className="text-center pb-4">
                <CardTitle className="font-display text-xl">Teste Grátis</CardTitle>
                <CardDescription className="font-body">
                  Experimente a plataforma por 14 dias sem compromisso.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8">
                  <TestTube className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Ao criar sua casa na aba "Criar Casa", você automaticamente ganha 14 dias de teste grátis!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Não precisa de cartão de crédito para começar.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setActiveTab('criar')}
                >
                  Criar minha casa agora
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Ao continuar, você concorda com nossos termos de uso e política de privacidade.
        </p>
      </div>
    </div>
  );
};

export default Auth;

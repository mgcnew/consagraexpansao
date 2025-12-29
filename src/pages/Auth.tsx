import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  Loader2, Mail, ArrowLeft, ArrowRight, LogIn, UserPlus, TestTube, 
  Check, Building2, User, Sparkles
} from 'lucide-react';
import { z } from 'zod';
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

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: authLoading, signIn, signUp, resetPassword } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [activeTab, setActiveTab] = useState('entrar');
  
  // Wizard step para criar casa
  const [createStep, setCreateStep] = useState(1);

  // Detectar parâmetro ?demo=true para ir direto para criar casa
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('demo') === 'true') {
      setActiveTab('criar');
    }
  }, [location.search]);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [rememberMe, setRememberMe] = useState(false);

  // Carregar email salvo do localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      setLoginEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Step 1: Dados do usuário
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerConfirmPassword, setOwnerConfirmPassword] = useState('');
  
  // Step 2: Dados da casa
  const [houseName, setHouseName] = useState('');
  const [houseCep, setHouseCep] = useState('');
  const [houseAddress, setHouseAddress] = useState('');
  const [houseNeighborhood, setHouseNeighborhood] = useState('');
  const [houseCity, setHouseCity] = useState('');
  const [houseState, setHouseState] = useState('');
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  
  // Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && !authLoading) {
      // Usuário logado, mostrar toast de boas-vindas se tiver casa pendente
      const hasPendingHouse = localStorage.getItem('pending_house');
      if (hasPendingHouse) {
        toast.success('Email confirmado!', {
          description: 'Aguarde enquanto criamos sua casa...',
        });
      }
      // Redirecionar para o app
      navigate('/app', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  // Formatar CEP
  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return value;
  };

  // Buscar endereço via ViaCEP
  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast.error('CEP não encontrado', { description: 'Verifique o CEP digitado.' });
        return;
      }

      // Preencher campos automaticamente
      setHouseCity(data.localidade || '');
      setHouseState(data.uf || '');
      setHouseNeighborhood(data.bairro || '');
      setHouseAddress(data.logradouro || '');
      
      toast.success('Endereço encontrado!');
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar CEP', { description: 'Tente novamente.' });
    } finally {
      setIsLoadingCep(false);
    }
  };

  // Handler para mudança do CEP
  const handleCepChange = (value: string) => {
    const formatted = formatCep(value);
    setHouseCep(formatted);
    
    // Buscar automaticamente quando tiver 8 dígitos
    const cleanCep = value.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      fetchAddressByCep(cleanCep);
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
      
      // Salvar ou remover email do localStorage baseado no checkbox
      if (rememberMe) {
        localStorage.setItem('remembered_email', validatedData.email);
      } else {
        localStorage.removeItem('remembered_email');
      }
      
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
    const cleanCep = houseCep.replace(/\D/g, '');
    if (!cleanCep || cleanCep.length !== 8) {
      errors.houseCep = 'CEP inválido';
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
    }
  };

  // Voltar step
  const handlePrevStep = () => {
    if (createStep > 1) {
      setCreateStep(createStep - 1);
      setFormErrors({});
    }
  };

  // Finalizar cadastro (trial - sem plano)
  const handleCreateHouse = async () => {
    if (!validateStep2()) return;

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

      // Salvar dados para criar casa após confirmação do email (sem plano - trial)
      localStorage.setItem('pending_house', JSON.stringify({
        name: houseName,
        cep: houseCep.replace(/\D/g, ''),
        address: houseAddress,
        neighborhood: houseNeighborhood,
        city: houseCity,
        state: houseState,
        planId: null, // Sem plano durante trial
        ownerPhone: ownerPhone.replace(/\D/g, ''),
        isTrial: true,
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

  // Mostrar loading enquanto verifica autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

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
                <CardTitle className="font-display text-xl">Área do Dono de Casa</CardTitle>
                <CardDescription className="font-body">Entre com sua conta para gerenciar sua casa.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                      disabled={isLoading}
                    />
                    <Label 
                      htmlFor="remember-me" 
                      className="text-sm font-normal text-muted-foreground cursor-pointer"
                    >
                      Lembrar meu email
                    </Label>
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
                <div className="flex items-center justify-center mb-2">
                  {[1, 2].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                        createStep >= step 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        {createStep > step ? <Check className="w-4 h-4" /> : step}
                      </div>
                      {step < 2 && (
                        <div className={cn(
                          "w-20 sm:w-32 h-1 mx-2 rounded transition-colors",
                          createStep > step ? "bg-primary" : "bg-muted"
                        )} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-24 text-xs text-muted-foreground">
                  <span>Seus dados</span>
                  <span>Sua casa</span>
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

                    <div className="space-y-2">
                      <Label htmlFor="house-cep">CEP *</Label>
                      <div className="relative">
                        <Input
                          id="house-cep"
                          placeholder="00000-000"
                          value={houseCep}
                          onChange={(e) => handleCepChange(e.target.value)}
                          disabled={isLoading || isLoadingCep}
                          maxLength={9}
                          className={formErrors.houseCep ? 'border-red-500' : ''}
                        />
                        {isLoadingCep && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                      {formErrors.houseCep && <p className="text-xs text-red-500">{formErrors.houseCep}</p>}
                      <p className="text-xs text-muted-foreground">Digite o CEP para preencher automaticamente</p>
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

                    <div className="space-y-2">
                      <Label htmlFor="house-neighborhood">Bairro</Label>
                      <Input
                        id="house-neighborhood"
                        placeholder="Centro"
                        value={houseNeighborhood}
                        onChange={(e) => setHouseNeighborhood(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="house-address">Endereço</Label>
                      <Input
                        id="house-address"
                        placeholder="Rua, número, complemento"
                        value={houseAddress}
                        onChange={(e) => setHouseAddress(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm">
                      <Sparkles className="w-4 h-4 inline mr-2 text-green-600" />
                      <strong>7 dias grátis!</strong> Acesso completo a todas as funcionalidades.
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={handlePrevStep} className="flex-1" disabled={isLoading}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                      </Button>
                      <Button 
                        onClick={handleCreateHouse} 
                        className="flex-1 bg-gradient-to-r from-primary to-amber-600 hover:from-primary/90 hover:to-amber-600/90" 
                        disabled={isLoading || isLoadingCep}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            Começar Teste Grátis
                            <Sparkles className="w-4 h-4 ml-2" />
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
                  Experimente a plataforma por 7 dias sem compromisso.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8">
                  <TestTube className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Ao criar sua casa na aba "Criar Casa", você automaticamente ganha 7 dias de teste grátis!
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

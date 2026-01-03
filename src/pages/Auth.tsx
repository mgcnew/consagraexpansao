import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  Loader2, ArrowLeft, ArrowRight, LogIn, 
  Check, Building2, User, Sparkles, Heart, Shield, Users
} from 'lucide-react';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants';

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

type AuthMode = 'select' | 'house-login' | 'house-create' | 'consagrador';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isRoleChecked, isLoading: authLoading, signIn, signUp, signInWithGoogle } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  
  // Modo de autenticação
  const [authMode, setAuthMode] = useState<AuthMode>('select');
  
  // Wizard step para criar casa
  const [createStep, setCreateStep] = useState(1);

  // Detectar parâmetros da URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('demo') === 'true' || searchParams.get('criar') === 'true') {
      setAuthMode('house-create');
    }
    if (searchParams.get('consagrador') === 'true') {
      setAuthMode('consagrador');
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
    // Esperar user estar logado E role ter sido verificada
    if (user && !authLoading && isRoleChecked) {
      const hasPendingHouse = localStorage.getItem('pending_house');
      if (hasPendingHouse) {
        toast.success('Email confirmado!', {
          description: 'Aguarde enquanto criamos sua casa...',
        });
      }
      // Super admin vai direto para o portal
      if (isAdmin) {
        navigate('/portal', { replace: true });
      } else {
        navigate('/app', { replace: true });
      }
    }
  }, [user, isAdmin, isRoleChecked, authLoading, navigate]);

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

  const handleCepChange = (value: string) => {
    const formatted = formatCep(value);
    setHouseCep(formatted);
    
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

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error('Erro no login com Google', { description: error.message });
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

  // Validar step 2 - simplificado (só nome da casa é obrigatório)
  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!houseName || houseName.length < 3) {
      errors.houseName = 'Nome da casa deve ter pelo menos 3 caracteres';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (createStep === 1 && validateStep1()) {
      setCreateStep(2);
    }
  };

  const handlePrevStep = () => {
    if (createStep > 1) {
      setCreateStep(createStep - 1);
      setFormErrors({});
    }
  };

  const handleCreateHouse = async () => {
    if (!validateStep2()) return;

    setIsLoading(true);
    
    try {
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

      localStorage.setItem('pending_house', JSON.stringify({
        name: houseName,
        cep: houseCep.replace(/\D/g, ''),
        address: houseAddress,
        neighborhood: houseNeighborhood,
        city: houseCity,
        state: houseState,
        planId: null,
        ownerPhone: ownerPhone.replace(/\D/g, ''),
        isTrial: true,
      }));

      toast.success('Conta criada com sucesso!', {
        description: 'Verifique seu email para confirmar o cadastro.',
      });
      
      setCreateStep(1);
      setAuthMode('house-login');
      
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-primary/5 via-background to-background px-4 py-8">
      {/* Botão voltar para landing */}
      <div className="absolute top-4 left-4 z-10">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            if (authMode !== 'select') {
              setAuthMode('select');
              setCreateStep(1);
              setFormErrors({});
            } else {
              navigate('/');
            }
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {authMode !== 'select' ? 'Voltar' : 'Início'}
        </Button>
      </div>

      <div className="w-full max-w-lg animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="Ahoo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Ahoo</h1>
          <p className="text-muted-foreground text-sm">Plataforma para Casas de Consagração</p>
        </div>

        {/* Seleção inicial */}
        {authMode === 'select' && (
          <div className="space-y-4">
            {/* Card Consagrador/Guardião */}
            <Card 
              className="border-2 border-transparent hover:border-primary/50 cursor-pointer transition-all hover:shadow-lg group"
              onClick={() => setAuthMode('consagrador')}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-primary/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Heart className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">Sou Consagrador ou Guardião</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Participe de cerimônias e conecte-se com casas de consagração
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Shield className="w-3.5 h-3.5 text-green-500" />
                      <span>Login rápido com Google</span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>

            {/* Card Dono de Casa */}
            <Card 
              className="border-2 border-transparent hover:border-primary/50 cursor-pointer transition-all hover:shadow-lg group"
              onClick={() => setAuthMode('house-login')}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Building2 className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">Tenho uma Casa</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Gerencie sua casa de consagração, cerimônias e consagradores
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <LogIn className="w-3.5 h-3.5 text-blue-500" />
                      <span>Login com email e senha</span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>

            {/* Divider */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-4 text-sm text-muted-foreground">ou</span>
              </div>
            </div>

            {/* Criar casa */}
            <Button 
              variant="outline" 
              className="w-full h-14 text-base gap-2"
              onClick={() => setAuthMode('house-create')}
            >
              <Sparkles className="w-5 h-5 text-amber-500" />
              Criar minha casa (14 dias gratis)
            </Button>

            {/* Link buscar casas */}
            <p className="text-center text-sm text-muted-foreground">
              Quer encontrar uma casa perto de você?{' '}
              <Button variant="link" className="p-0 h-auto" onClick={() => navigate(ROUTES.BUSCAR_CASAS)}>
                Buscar casas
              </Button>
            </p>
          </div>
        )}

        {/* Login Consagrador/Guardião (Google) */}
        {authMode === 'consagrador' && (
          <Card className="border-border/50 shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-primary/20 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Bem-vindo, Consagrador</CardTitle>
              <CardDescription>
                Entre para participar de cerimônias e conectar-se com casas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button
                variant="outline"
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white text-black hover:bg-gray-100 border-gray-200 h-14 text-base font-medium"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <svg className="mr-3 h-5 w-5" viewBox="0 0 488 512">
                    <path fill="#4285F4" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                  </svg>
                )}
                Continuar com Google
              </Button>

              {/* Benefícios */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-start gap-3 text-sm">
                  <Shield className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Seus dados protegidos</p>
                    <p className="text-muted-foreground text-xs">Usamos criptografia e seguimos a LGPD</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Users className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Múltiplas casas</p>
                    <p className="text-muted-foreground text-xs">Participe de várias casas com a mesma conta</p>
                  </div>
                </div>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Guardiões também entram por aqui. Após o login, o dono da casa pode promovê-lo.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Login Dono de Casa (Email/Senha) */}
        {authMode === 'house-login' && (
          <Card className="border-border/50 shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-xl">Área do Dono de Casa</CardTitle>
              <CardDescription>Entre com sua conta para gerenciar sua casa</CardDescription>
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

                <Button type="submit" className="w-full h-12" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar'}
                </Button>
              </form>

              <Button
                variant="link"
                className="w-full text-muted-foreground"
                onClick={() => navigate('/recuperar-senha')}
              >
                Esqueceu sua senha?
              </Button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-4 text-xs text-muted-foreground">Não tem conta?</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={() => setAuthMode('house-create')}
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                Criar minha casa
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Criar Casa - Wizard */}
        {authMode === 'house-create' && (
          <Card className="border-border/50 shadow-xl">
            {/* Progress indicator */}
            <div className="px-6 pt-6">
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
                  <CardTitle className="text-xl">Seus Dados</CardTitle>
                  <CardDescription>Informações do responsável pela casa</CardDescription>
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

                  <Button onClick={handleNextStep} className="w-full h-12" disabled={isLoading}>
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
                  <CardTitle className="text-xl">Sua Casa</CardTitle>
                  <CardDescription>Informações básicas da casa de consagração</CardDescription>
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
                    <Label htmlFor="house-cep">CEP <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                    <div className="relative">
                      <Input
                        id="house-cep"
                        placeholder="00000-000"
                        value={houseCep}
                        onChange={(e) => handleCepChange(e.target.value)}
                        disabled={isLoading || isLoadingCep}
                        maxLength={9}
                      />
                      {isLoadingCep && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Digite o CEP para preencher cidade/estado automaticamente</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="house-city">Cidade <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                      <Input
                        id="house-city"
                        placeholder="Sao Paulo"
                        value={houseCity}
                        onChange={(e) => setHouseCity(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="house-state">Estado <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                      <Select value={houseState} onValueChange={setHouseState} disabled={isLoading}>
                        <SelectTrigger>
                          <SelectValue placeholder="UF" />
                        </SelectTrigger>
                        <SelectContent>
                          {ESTADOS_BR.map((uf) => (
                            <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Voce pode completar os dados da sua casa depois em Configuracoes
                  </p>

                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm">
                    <Sparkles className="w-4 h-4 inline mr-2 text-green-600" />
                    <strong>14 dias gratis!</strong> Acesso completo a todas as funcionalidades.
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handlePrevStep} className="flex-1 h-12" disabled={isLoading}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar
                    </Button>
                    <Button 
                      onClick={handleCreateHouse} 
                      className="flex-1 h-12 bg-gradient-to-r from-primary to-amber-600 hover:from-primary/90 hover:to-amber-600/90" 
                      disabled={isLoading || isLoadingCep}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Comecar Teste
                          <Sparkles className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-center text-xs text-muted-foreground">
                    Ao criar sua conta, voce concorda com nossos termos de uso.
                  </p>
                </CardContent>
              </>
            )}
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          Ao continuar, você concorda com nossos termos de uso e política de privacidade.
        </p>
      </div>
    </div>
  );
};

export default Auth;

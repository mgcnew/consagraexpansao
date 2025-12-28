import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Mail, ArrowLeft, LogIn, UserPlus, TestTube, Check, Building2 } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

const signupSchema = z.object({
  nomeCompleto: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  nomeCasa: z.string().min(3, 'Nome da casa deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
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

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  // Signup form state
  const [signupNome, setSignupNome] = useState('');
  const [signupNomeCasa, setSignupNomeCasa] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

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

  // Selecionar primeiro plano por padrão
  useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans, selectedPlanId]);

  // Login com Google
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error('Erro no login com Google', {
        description: error.message,
      });
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
          toast.error('Erro ao entrar', {
            description: 'Email ou senha incorretos.',
          });
        } else {
          toast.error('Erro ao entrar', {
            description: error.message,
          });
        }
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            errors[e.path[0].toString()] = e.message;
          }
        });
        setLoginErrors(errors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupErrors({});

    if (!selectedPlanId) {
      toast.error('Selecione um plano');
      return;
    }

    try {
      const validatedData = signupSchema.parse({
        nomeCompleto: signupNome,
        nomeCasa: signupNomeCasa,
        email: signupEmail,
        password: signupPassword,
        confirmPassword: signupConfirmPassword,
      });

      setIsLoading(true);
      
      // TODO: Integrar com gateway de pagamento
      // Por enquanto, apenas cria a conta e a casa
      const { error } = await signUp(
        validatedData.email,
        validatedData.password,
        validatedData.nomeCompleto
      );

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Email já cadastrado', {
            description: 'Este email já está registrado. Tente fazer login.',
          });
        } else {
          toast.error('Erro ao criar conta', {
            description: error.message,
          });
        }
      } else {
        toast.success('Conta criada com sucesso!', {
          description: 'Verifique seu email para confirmar o cadastro. Após confirmar, sua casa será criada automaticamente.',
        });
        // Salvar dados da casa para criar após confirmação do email
        localStorage.setItem('pending_house', JSON.stringify({
          name: validatedData.nomeCasa,
          planId: selectedPlanId,
        }));
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            errors[e.path[0].toString()] = e.message;
          }
        });
        setSignupErrors(errors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail) {
      toast.error('Email necessário', {
        description: 'Por favor, digite seu email.',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await resetPassword(resetEmail);
    setIsLoading(false);

    if (error) {
      toast.error('Erro', {
        description: error.message,
      });
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
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Enviar Link de Recuperação'
                  )}
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
            <img 
              src="/logo-full.png" 
              alt="Ahoo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-medium text-foreground mb-1">
            Ahoo
          </h1>
          <p className="text-muted-foreground font-body text-sm">
            Plataforma para Casas de Consagração
          </p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                <CardDescription className="font-body">
                  Entre com sua conta para acessar o sistema.
                </CardDescription>
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
                    {loginErrors.email && (
                      <p className="text-xs text-red-500">{loginErrors.email}</p>
                    )}
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
                    {loginErrors.password && (
                      <p className="text-xs text-red-500">{loginErrors.password}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Entrar'
                    )}
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

            {/* Tab Criar Casa */}
            <TabsContent value="criar">
              <CardHeader className="text-center pb-4">
                <CardTitle className="font-display text-xl">Crie sua Casa</CardTitle>
                <CardDescription className="font-body">
                  Cadastre sua casa de consagração na plataforma.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-nome">Seu Nome Completo</Label>
                    <Input
                      id="signup-nome"
                      type="text"
                      placeholder="Seu nome"
                      value={signupNome}
                      onChange={(e) => setSignupNome(e.target.value)}
                      disabled={isLoading}
                      className={signupErrors.nomeCompleto ? 'border-red-500' : ''}
                    />
                    {signupErrors.nomeCompleto && (
                      <p className="text-xs text-red-500">{signupErrors.nomeCompleto}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-casa">Nome da Casa</Label>
                    <Input
                      id="signup-casa"
                      type="text"
                      placeholder="Ex: Casa do Sol"
                      value={signupNomeCasa}
                      onChange={(e) => setSignupNomeCasa(e.target.value)}
                      disabled={isLoading}
                      className={signupErrors.nomeCasa ? 'border-red-500' : ''}
                    />
                    {signupErrors.nomeCasa && (
                      <p className="text-xs text-red-500">{signupErrors.nomeCasa}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      disabled={isLoading}
                      className={signupErrors.email ? 'border-red-500' : ''}
                    />
                    {signupErrors.email && (
                      <p className="text-xs text-red-500">{signupErrors.email}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Senha</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        disabled={isLoading}
                        className={signupErrors.password ? 'border-red-500' : ''}
                      />
                      {signupErrors.password && (
                        <p className="text-xs text-red-500">{signupErrors.password}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm">Confirmar</Label>
                      <Input
                        id="signup-confirm"
                        type="password"
                        placeholder="••••••••"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        disabled={isLoading}
                        className={signupErrors.confirmPassword ? 'border-red-500' : ''}
                      />
                      {signupErrors.confirmPassword && (
                        <p className="text-xs text-red-500">{signupErrors.confirmPassword}</p>
                      )}
                    </div>
                  </div>

                  {/* Seleção de Plano */}
                  <div className="space-y-3">
                    <Label>Escolha seu Plano</Label>
                    <div className="space-y-2">
                      {plans.map((plan) => (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedPlanId === plan.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-5 h-5 text-primary" />
                              <span className="font-medium">{plan.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-bold text-primary">
                                {formatPrice(plan.price_cents)}
                              </span>
                              <span className="text-xs text-muted-foreground">/mês</span>
                            </div>
                          </div>
                          {plan.description && (
                            <p className="text-sm text-muted-foreground mb-2">{plan.description}</p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {plan.features?.slice(0, 3).map((feature, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-muted px-2 py-1 rounded flex items-center gap-1"
                              >
                                <Check className="w-3 h-3 text-green-500" />
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading || !selectedPlanId}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Criar Conta e Prosseguir para Pagamento'
                    )}
                  </Button>
                </form>

                <p className="text-center text-xs text-muted-foreground">
                  Ao criar sua conta, você concorda com nossos termos de uso.
                </p>
              </CardContent>
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
                    Em breve você poderá testar a plataforma gratuitamente.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Enquanto isso, entre em contato conosco para uma demonstração personalizada.
                  </p>
                </div>
                <Button variant="outline" className="w-full" disabled>
                  Em breve
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

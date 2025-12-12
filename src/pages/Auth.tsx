import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Mail, ArrowLeft, Quote, ClipboardList, Leaf, MessageCircleHeart } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

const signupSchema = z.object({
  nomeCompleto: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn, signUp, resetPassword, signInWithGoogle } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  // Signup form state
  const [signupNome, setSignupNome] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

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

    try {
      const validatedData = signupSchema.parse({
        nomeCompleto: signupNome,
        email: signupEmail,
        password: signupPassword,
        confirmPassword: signupConfirmPassword,
      });

      setIsLoading(true);
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
          description: 'Verifique seu email para confirmar o cadastro.',
        });
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
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-28 h-28 md:w-36 md:h-36 mx-auto mb-3">
            <img 
              src="/logo-full.png" 
              alt="Templo Xamânico Consciência Divinal" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-medium text-foreground mb-1">
            Consciência Divinal
          </h1>
          <p className="text-muted-foreground font-body text-sm">
            Portal de Medicinas e Cerimônias Sagradas
          </p>
        </div>

        {/* Frase do Líder */}
        <div className="relative mb-6 px-4">
          <Quote className="w-6 h-6 text-amber-500/40 absolute -top-2 -left-1" />
          <p className="text-center text-amber-200/80 italic font-light text-sm md:text-base leading-relaxed px-4">
            "Quem sabe o Criador não trouxe você aqui pra tomar uma xícara de chá conosco"
          </p>
          <Quote className="w-6 h-6 text-amber-500/40 absolute -bottom-2 -right-1 rotate-180" />
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="font-display text-xl">Bem-vindo ao Portal</CardTitle>
            <CardDescription className="font-body">
              Entre com sua conta Google para acessar o portal sagrado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              type="button"
              onClick={async () => {
                setIsLoading(true);
                const { error } = await signInWithGoogle();
                if (error) {
                  toast.error('Erro no login com Google', {
                    description: error.message,
                  });
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              className="w-full bg-white text-black hover:bg-gray-100 border-gray-200 h-12 text-base"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>
              )}
              Entrar com Google
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Novos usuários serão cadastrados automaticamente como consagradores.
            </p>
          </CardContent>
        </Card>

        {/* Informações para novos usuários */}
        <div className="mt-6 space-y-3">
          <p className="text-center text-xs text-muted-foreground mb-3">
            Ao entrar, você terá acesso a:
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-lg bg-card/50 border border-border/30 hover:border-amber-500/30 transition-colors">
              <ClipboardList className="w-5 h-5 mx-auto mb-1.5 text-amber-500" />
              <p className="text-[10px] text-muted-foreground leading-tight">Ficha de Anamnese</p>
            </div>
            <div className="p-3 rounded-lg bg-card/50 border border-border/30 hover:border-emerald-500/30 transition-colors">
              <Leaf className="w-5 h-5 mx-auto mb-1.5 text-emerald-500" />
              <p className="text-[10px] text-muted-foreground leading-tight">Medicinas Sagradas</p>
            </div>
            <div className="p-3 rounded-lg bg-card/50 border border-border/30 hover:border-rose-500/30 transition-colors">
              <MessageCircleHeart className="w-5 h-5 mx-auto mb-1.5 text-rose-500" />
              <p className="text-[10px] text-muted-foreground leading-tight">Partilhas</p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Ao continuar, você concorda com nossos termos de uso e política de privacidade.
        </p>
      </div>
    </div>
  );
};

export default Auth;

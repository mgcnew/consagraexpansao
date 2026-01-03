import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Loader2, Mail, ArrowLeft, CheckCircle, KeyRound, 
  Sparkles, Shield, Send
} from 'lucide-react';
import { z } from 'zod';
import { ROUTES } from '@/constants';
import { supabase } from '@/integrations/supabase/client';

type PageState = 'request' | 'sent' | 'reset' | 'success';

const RecuperarSenha = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { resetPassword, user } = useAuth();
  
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pageState, setPageState] = useState<PageState>('request');
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Verificar se veio do link de reset
  // O Supabase usa hash fragments (#access_token=...) ou query params (?type=recovery)
  useEffect(() => {
    const checkResetToken = async () => {
      // Verificar hash fragment (formato mais comum do Supabase)
      const hashParams = new URLSearchParams(location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type') || searchParams.get('type');
      
      // Se tem token de recovery no hash ou type=recovery nos params
      if (accessToken || type === 'recovery') {
        // Se tem access_token, o Supabase já processou e logou o usuário
        // Verificar se há sessão ativa
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Usuário está logado via link de recovery, mostrar tela de nova senha
          setPageState('reset');
        }
      }
      
      setIsCheckingSession(false);
    };

    checkResetToken();
  }, [location.hash, searchParams]);

  // Se usuário já está logado e veio do link de reset, mostrar tela de reset
  useEffect(() => {
    if (user && pageState === 'request' && !isCheckingSession) {
      // Verificar se veio de um link de recovery
      const hashParams = new URLSearchParams(location.hash.substring(1));
      const type = hashParams.get('type') || searchParams.get('type');
      
      if (type === 'recovery' || location.hash.includes('access_token')) {
        setPageState('reset');
      }
    }
  }, [user, pageState, isCheckingSession, location.hash, searchParams]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!email) {
      setErrors({ email: 'Digite seu email' });
      return;
    }

    if (!z.string().email().safeParse(email).success) {
      setErrors({ email: 'Email inválido' });
      return;
    }

    setIsLoading(true);
    const { error } = await resetPassword(email);
    setIsLoading(false);

    if (error) {
      toast.error('Erro ao enviar email', { description: error.message });
    } else {
      setPageState('sent');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!newPassword || newPassword.length < 6) {
      setErrors({ newPassword: 'A senha deve ter pelo menos 6 caracteres' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: 'As senhas não coincidem' });
      return;
    }

    setIsLoading(true);
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      setIsLoading(false);
      toast.error('Erro ao redefinir senha', { description: error.message });
    } else {
      // Fazer logout para forçar login com nova senha
      await supabase.auth.signOut();
      setIsLoading(false);
      setPageState('success');
      toast.success('Senha redefinida com sucesso!');
    }
  };

  // Loading enquanto verifica sessão
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background px-4 py-8">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="Ahoo" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Estado: Solicitar reset */}
        {pageState === 'request' && (
          <Card className="border-border/50 shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-primary/20 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
              <CardDescription className="text-base">
                Digite seu email e enviaremos um link para redefinir sua senha
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>

                <Button type="submit" className="w-full h-12 gap-2" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar Link de Recuperação
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-4 border-t">
                <Button
                  variant="ghost"
                  className="w-full gap-2 text-muted-foreground"
                  onClick={() => navigate(ROUTES.AUTH)}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar para o login
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estado: Email enviado */}
        {pageState === 'sent' && (
          <Card className="border-border/50 shadow-xl">
            <CardContent className="pt-8 pb-6 text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-300">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Email Enviado!</h2>
              <p className="text-muted-foreground mb-6">
                Enviamos um link de recuperação para <strong className="text-foreground">{email}</strong>
              </p>

              <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Próximos passos:
                </h3>
                <ol className="text-sm text-muted-foreground space-y-2">
                  <li>1. Abra seu email</li>
                  <li>2. Clique no link de recuperação</li>
                  <li>3. Crie uma nova senha</li>
                </ol>
              </div>

              <p className="text-xs text-muted-foreground mb-4">
                Não recebeu? Verifique a pasta de spam ou{' '}
                <button 
                  className="text-primary hover:underline"
                  onClick={() => setPageState('request')}
                >
                  tente novamente
                </button>
              </p>

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => navigate(ROUTES.AUTH)}
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para o login
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Estado: Redefinir senha */}
        {pageState === 'reset' && (
          <Card className="border-border/50 shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-primary/20 flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Nova Senha</CardTitle>
              <CardDescription className="text-base">
                Crie uma nova senha segura para sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                    className={errors.newPassword ? 'border-red-500' : ''}
                  />
                  {errors.newPassword && <p className="text-xs text-red-500">{errors.newPassword}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Senha</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className={errors.confirmPassword ? 'border-red-500' : ''}
                  />
                  {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
                </div>

                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <Shield className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Use pelo menos 6 caracteres, combinando letras e números para maior segurança.</span>
                </div>

                <Button type="submit" className="w-full h-12 gap-2" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      Redefinir Senha
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Estado: Sucesso */}
        {pageState === 'success' && (
          <Card className="border-border/50 shadow-xl">
            <CardContent className="pt-8 pb-6 text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-300">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              
              <h2 className="text-2xl font-bold mb-2 text-green-600 dark:text-green-400">
                Senha Redefinida!
              </h2>
              <p className="text-muted-foreground mb-6">
                Sua senha foi alterada com sucesso. Agora você pode fazer login com a nova senha.
              </p>

              <Button
                className="w-full h-12 gap-2 bg-gradient-to-r from-primary to-amber-600 hover:from-primary/90 hover:to-amber-600/90"
                onClick={() => navigate(ROUTES.AUTH)}
              >
                <Sparkles className="w-4 h-4" />
                Fazer Login
              </Button>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          Precisa de ajuda? Entre em contato com nosso suporte.
        </p>
      </div>
    </div>
  );
};

export default RecuperarSenha;

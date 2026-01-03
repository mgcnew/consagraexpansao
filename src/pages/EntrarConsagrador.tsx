import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Sparkles, Shield, Heart, ArrowLeft, Users } from 'lucide-react';
import { ROUTES } from '@/constants';

const EntrarConsagrador: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading, signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  // Pegar slug da casa se veio de uma página de casa
  const houseSlug = searchParams.get('casa');

  useEffect(() => {
    if (user && !authLoading) {
      // Usuário logado, redirecionar
      if (houseSlug) {
        // Se veio de uma casa, redirecionar para a área do consagrador
        navigate(`/casa/${houseSlug}`, { replace: true });
      } else {
        navigate('/app', { replace: true });
      }
    }
  }, [user, authLoading, navigate, houseSlug]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error('Erro no login com Google', { description: error.message });
      setIsLoading(false);
    }
    // Se sucesso, o useEffect vai redirecionar
  };

  if (authLoading) {
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
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-primary/5 via-background to-background px-4 py-8">
      {/* Botão voltar */}
      <div className="absolute top-4 left-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="Ahoo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Bem-vindo, Consagrador
          </h1>
          <p className="text-muted-foreground">
            Entre para participar de cerimônias e conectar-se com casas de consagração
          </p>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-primary/20 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-xl flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Entrar com Google
            </CardTitle>
            <CardDescription>
              Rápido, seguro e sem precisar criar senha
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

        {/* Link para donos de casa */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            É dono de uma casa de consagração?
          </p>
          <Button 
            variant="link" 
            className="text-primary"
            onClick={() => navigate(ROUTES.AUTH + '?demo=true')}
          >
            Cadastre sua casa aqui
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Ao continuar, você concorda com nossos termos de uso e política de privacidade.
        </p>
      </div>
    </div>
  );
};

export default EntrarConsagrador;

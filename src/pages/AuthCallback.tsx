import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle, Sparkles } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isRoleChecked, isLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'redirecting'>('loading');

  useEffect(() => {
    // Esperar user estar logado E role ter sido verificada
    if (!isLoading && user && isRoleChecked) {
      setStatus('success');
      
      // Pequeno delay para mostrar a animação de sucesso
      const timer = setTimeout(() => {
        setStatus('redirecting');
        
        // Redirecionar baseado no tipo de usuário
        if (isAdmin) {
          navigate('/portal', { replace: true });
        } else {
          navigate('/app', { replace: true });
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [user, isAdmin, isRoleChecked, isLoading, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background px-4">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center">
        {/* Logo */}
        <div className="w-20 h-20 mx-auto mb-8">
          <img src="/logo-full.png" alt="Ahoo" className="w-full h-full object-contain" />
        </div>

        {/* Status */}
        <div className="flex flex-col items-center gap-4">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1">Autenticando...</h2>
                <p className="text-muted-foreground text-sm">Verificando suas credenciais</p>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center animate-in zoom-in duration-300">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className="text-xl font-semibold mb-1 text-green-600 dark:text-green-400">
                  Login realizado!
                </h2>
                <p className="text-muted-foreground text-sm">Bem-vindo de volta</p>
              </div>
            </>
          )}

          {status === 'redirecting' && (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1">Preparando tudo...</h2>
                <p className="text-muted-foreground text-sm">Redirecionando você</p>
              </div>
            </>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-8 w-48 h-1 bg-muted rounded-full overflow-hidden mx-auto">
          <div 
            className={`h-full bg-gradient-to-r from-primary to-amber-500 transition-all duration-1000 ease-out ${
              status === 'loading' ? 'w-1/3' : status === 'success' ? 'w-2/3' : 'w-full'
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;

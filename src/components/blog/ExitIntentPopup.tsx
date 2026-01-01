import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Gift, Sparkles } from 'lucide-react';
import { ROUTES } from '@/constants';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const ExitIntentPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Verificar se ja mostrou nesta sessao
    const shown = sessionStorage.getItem('exitPopupShown');
    if (shown) {
      setHasShown(true);
      return;
    }

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasShown) {
        setIsVisible(true);
        setHasShown(true);
        sessionStorage.setItem('exitPopupShown', 'true');
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [hasShown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email, source: 'exit_popup' });

      if (error && error.code !== '23505') throw error;
      
      toast.success('Inscricao confirmada!');
      setIsVisible(false);
    } catch {
      toast.error('Erro ao se inscrever');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-background rounded-xl shadow-2xl max-w-md w-full relative overflow-hidden">
        {/* Decorative gradient */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500" />
        
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 pt-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="h-8 w-8 text-white" />
          </div>

          <h2 className="text-2xl font-bold mb-2">Espere!</h2>
          <p className="text-muted-foreground mb-6">
            Antes de ir, que tal experimentar o Ahoo gratuitamente por 7 dias?
          </p>

          <div className="space-y-4">
            <Link to={ROUTES.AUTH} onClick={() => setIsVisible(false)}>
              <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <Sparkles className="h-4 w-4 mr-2" />
                Comecar teste gratis
              </Button>
            </Link>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Receba conteudos sobre espiritualidade no seu email
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" variant="outline" disabled={isSubmitting}>
                  {isSubmitting ? '...' : 'Enviar'}
                </Button>
              </div>
            </form>
          </div>

          <button
            onClick={() => setIsVisible(false)}
            className="mt-4 text-sm text-muted-foreground hover:text-foreground"
          >
            Nao, obrigado
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExitIntentPopup;

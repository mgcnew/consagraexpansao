import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, Check, Sparkles, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { useAuth } from '@/contexts/AuthContext';

export function TrialExpiredModal() {
  const navigate = useNavigate();
  const { isExpired, isLoading: isLoadingTrial } = useTrialStatus();
  const { signOut } = useAuth();

  // Buscar planos
  const { data: plans } = useQuery({
    queryKey: ['plans-for-upgrade'],
    enabled: isExpired,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('house_plans')
        .select('*')
        .eq('active', true)
        .order('price_cents', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (isLoadingTrial || !isExpired) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Seu período de teste terminou
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Esperamos que tenha gostado! Para continuar usando todas as funcionalidades, 
            escolha um plano que se encaixe na sua necessidade.
          </p>
        </div>

        {/* Planos */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {plans?.map((plan, index) => {
            const isPopular = index === 1;
            return (
              <Card 
                key={plan.id}
                className={`relative ${
                  isPopular 
                    ? 'border-primary shadow-lg shadow-primary/10 md:scale-105' 
                    : 'border-border/50'
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-amber-600 text-white text-center text-xs py-1 font-medium rounded-t-lg">
                    ⭐ Recomendado
                  </div>
                )}
                <CardHeader className={`text-center ${isPopular ? 'pt-8' : 'pt-4'} pb-2`}>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{formatPrice(plan.price_cents)}</span>
                    <span className="text-muted-foreground text-sm">/mês</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {plan.features?.slice(0, 4).map((feature: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button 
                    className={`w-full ${isPopular ? 'bg-gradient-to-r from-primary to-amber-600' : ''}`}
                    variant={isPopular ? 'default' : 'outline'}
                    onClick={() => navigate(`/app/configuracoes?tab=assinatura&plan=${plan.id}`)}
                  >
                    Escolher Plano
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Ações secundárias */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="ghost" onClick={() => signOut()} className="gap-2 text-muted-foreground">
            <LogOut className="h-4 w-4" />
            Sair da conta
          </Button>
        </div>

        {/* Garantia */}
        <div className="mt-6 text-center">
          <Badge variant="outline" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            Seus dados estão salvos e serão mantidos ao assinar
          </Badge>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, differenceInDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CreditCard, 
  AlertTriangle, 
  Check, 
  ArrowUp, 
  ArrowDown, 
  Calendar,
  Loader2,
  Sparkles,
  Crown,
  Zap,
  XCircle,
  Clock,
  RefreshCw,
  Users,
  CalendarDays,
  BookOpen,
  ShoppingBag,
  GraduationCap,
  Image,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useActiveHouse } from '@/hooks/useActiveHouse';
import { cn } from '@/lib/utils';

// Componente para exibir estatística de uso
interface UsageCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  limit?: number;
}

const UsageCard: React.FC<UsageCardProps> = ({ icon: Icon, label, value, limit }) => {
  const percentage = limit ? (value / limit) * 100 : 0;
  const isNearLimit = limit && percentage >= 80;
  const isAtLimit = limit && percentage >= 100;
  
  return (
    <div className={cn(
      "p-3 rounded-lg border bg-card",
      isAtLimit && "border-destructive/50 bg-destructive/5",
      isNearLimit && !isAtLimit && "border-orange-500/50 bg-orange-50 dark:bg-orange-950/20"
    )}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn(
          "w-4 h-4",
          isAtLimit ? "text-destructive" : isNearLimit ? "text-orange-500" : "text-muted-foreground"
        )} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={cn(
          "text-xl font-bold",
          isAtLimit && "text-destructive",
          isNearLimit && !isAtLimit && "text-orange-600"
        )}>
          {value}
        </span>
        {limit && (
          <span className="text-sm text-muted-foreground">/ {limit}</span>
        )}
      </div>
      {limit && (
        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all",
              isAtLimit ? "bg-destructive" : isNearLimit ? "bg-orange-500" : "bg-primary"
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

interface HousePlan {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  billing_period: string;
  features: string[];
}

interface House {
  id: string;
  name: string;
  plan_id: string | null;
  subscription_status: string;
  trial_ends_at: string | null;
  subscription_started_at: string | null;
  subscription_ends_at: string | null;
  subscription_canceled_at: string | null;
  pending_plan_id: string | null;
  pending_plan_effective_at: string | null;
  house_plans: HousePlan | null;
  pending_plan: HousePlan | null;
}

const SubscriptionSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: activeHouse } = useActiveHouse();
  const { user } = useAuth();
  
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showChangePlanDialog, setShowChangePlanDialog] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Buscar dados da casa com plano
  const { data: house, isLoading: isLoadingHouse } = useQuery({
    queryKey: ['house-subscription', activeHouse?.id],
    queryFn: async () => {
      if (!activeHouse?.id) return null;
      
      const { data, error } = await supabase
        .from('houses')
        .select(`
          id,
          name,
          plan_id,
          subscription_status,
          trial_ends_at,
          subscription_started_at,
          subscription_ends_at,
          subscription_canceled_at,
          pending_plan_id,
          pending_plan_effective_at,
          house_plans!houses_plan_id_fkey(id, name, description, price_cents, billing_period, features)
        `)
        .eq('id', activeHouse.id)
        .single();
      
      if (error) throw error;
      
      // Buscar plano pendente se existir
      let pendingPlan = null;
      if (data.pending_plan_id) {
        const { data: pending } = await supabase
          .from('house_plans')
          .select('*')
          .eq('id', data.pending_plan_id)
          .single();
        pendingPlan = pending;
      }
      
      // Normalizar house_plans (pode vir como array ou objeto)
      const housePlan = Array.isArray(data.house_plans) 
        ? data.house_plans[0] 
        : data.house_plans;
      
      return { 
        ...data, 
        house_plans: housePlan || null,
        pending_plan: pendingPlan 
      } as House;
    },
    enabled: !!activeHouse?.id,
  });

  // Buscar todos os planos disponíveis
  const { data: plans = [] } = useQuery({
    queryKey: ['available-plans'],
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

  // Buscar estatísticas de uso da casa
  const { data: usageStats } = useQuery({
    queryKey: ['house-usage-stats', activeHouse?.id],
    queryFn: async () => {
      if (!activeHouse?.id) return null;
      
      // Buscar contagens em paralelo
      const [
        consagradoresResult,
        cerimoniasResult,
        materiaisResult,
        produtosResult,
        cursosResult,
        galeriaResult,
        membrosResult
      ] = await Promise.all([
        // Consagradores (usuários com inscrições na casa)
        supabase
          .from('inscricoes')
          .select('user_id', { count: 'exact', head: true })
          .eq('house_id', activeHouse.id),
        // Cerimônias do mês atual
        supabase
          .from('cerimonias')
          .select('id', { count: 'exact', head: true })
          .eq('house_id', activeHouse.id)
          .gte('data', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
        // Materiais/Estudos
        supabase
          .from('materiais')
          .select('id', { count: 'exact', head: true })
          .eq('house_id', activeHouse.id),
        // Produtos na loja
        supabase
          .from('produtos')
          .select('id', { count: 'exact', head: true })
          .eq('house_id', activeHouse.id)
          .eq('ativo', true),
        // Cursos/Eventos
        supabase
          .from('cursos_eventos')
          .select('id', { count: 'exact', head: true })
          .eq('house_id', activeHouse.id)
          .eq('ativo', true),
        // Itens na galeria
        supabase
          .from('galeria')
          .select('id', { count: 'exact', head: true })
          .eq('house_id', activeHouse.id),
        // Membros da equipe
        supabase
          .from('house_members')
          .select('id', { count: 'exact', head: true })
          .eq('house_id', activeHouse.id)
          .eq('active', true),
      ]);
      
      return {
        consagradores: consagradoresResult.count || 0,
        cerimoniasMes: cerimoniasResult.count || 0,
        materiais: materiaisResult.count || 0,
        produtos: produtosResult.count || 0,
        cursos: cursosResult.count || 0,
        galeria: galeriaResult.count || 0,
        membrosEquipe: membrosResult.count || 0,
      };
    },
    enabled: !!activeHouse?.id,
  });

  // Mutation para cancelar assinatura - Integrado com Mercado Pago
  const cancelSubscription = useMutation({
    mutationFn: async () => {
      if (!house?.id) throw new Error('Casa nao encontrada');
      
      // Obter token de autenticacao
      const { data: { session } } = await supabase.auth.getSession();
      
      // Tentar cancelar no Mercado Pago primeiro
      if (session?.access_token) {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-subscription`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                house_id: house.id,
              }),
            }
          );
          
          const result = await response.json();
          if (!response.ok) {
            console.warn('Erro ao cancelar no MP:', result.error);
          }
        } catch (err) {
          console.warn('Erro ao chamar cancel-subscription:', err);
        }
      }
      
      const now = new Date();
      // Calcular fim do periodo atual (30 dias apos inicio ou trial)
      const subscriptionEnd = house.subscription_started_at 
        ? addDays(new Date(house.subscription_started_at), 30)
        : house.trial_ends_at 
          ? new Date(house.trial_ends_at)
          : addDays(now, 30);
      
      const { error } = await supabase
        .from('houses')
        .update({
          subscription_canceled_at: now.toISOString(),
          subscription_ends_at: subscriptionEnd.toISOString(),
          subscription_status: 'cancelled',
        })
        .eq('id', house.id);
      
      if (error) throw error;
      
      // Registrar no historico
      await supabase.from('house_subscription_history').insert({
        house_id: house.id,
        plan_id: house.plan_id,
        action: 'canceled',
        notes: `Cancelamento solicitado. Acesso ate ${format(subscriptionEnd, 'dd/MM/yyyy')}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['house-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['active-house'] });
      toast.success('Assinatura cancelada', {
        description: 'Voce ainda tera acesso ate o fim do periodo pago.',
      });
      setShowCancelDialog(false);
    },
    onError: (error: any) => {
      toast.error('Erro ao cancelar', { description: error.message });
    },
  });

  // Mutation para mudar plano - Integrado com Mercado Pago
  const changePlan = useMutation({
    mutationFn: async (newPlanId: string) => {
      if (!house?.id) throw new Error('Casa nao encontrada');
      if (!user?.email) throw new Error('Email do usuario nao encontrado');
      
      const currentPlan = house.house_plans;
      const newPlan = plans.find(p => p.id === newPlanId);
      
      if (!newPlan) throw new Error('Plano nao encontrado');
      
      const isUpgrade = (newPlan.price_cents || 0) > (currentPlan?.price_cents || 0);
      const isDowngrade = (newPlan.price_cents || 0) < (currentPlan?.price_cents || 0);
      const now = new Date();
      
      // Se for upgrade ou primeira assinatura, chamar Mercado Pago
      if (isUpgrade || !currentPlan || house.subscription_status === 'trial') {
        // Obter token de autenticacao
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error('Sessao expirada');
        
        // Chamar edge function para criar assinatura no MP
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-subscription`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              house_id: house.id,
              plan_id: newPlanId,
              payer_email: user.email,
            }),
          }
        );
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Erro ao criar assinatura');
        }
        
        // Se tiver init_point (link de pagamento), redirecionar
        if (result.init_point) {
          window.location.href = result.init_point;
          return { isUpgrade: true, newPlan, redirected: true };
        }
        
        return { isUpgrade: true, newPlan, redirected: false };
      } else if (isDowngrade) {
        // Downgrade: agenda para o proximo ciclo (sem MP)
        const effectiveDate = house.subscription_started_at 
          ? addDays(new Date(house.subscription_started_at), 30)
          : addDays(now, 30);
        
        const { error } = await supabase
          .from('houses')
          .update({
            pending_plan_id: newPlanId,
            pending_plan_effective_at: effectiveDate.toISOString(),
          })
          .eq('id', house.id);
        
        if (error) throw error;
        
        // Registrar no historico
        await supabase.from('house_subscription_history').insert({
          house_id: house.id,
          plan_id: newPlanId,
          previous_plan_id: house.plan_id,
          action: 'downgraded',
          notes: `Downgrade agendado de ${currentPlan?.name} para ${newPlan.name}. Efetivo em ${format(effectiveDate, 'dd/MM/yyyy')}`,
        });
        
        return { isUpgrade: false, newPlan, redirected: false };
      }
      
      return { isUpgrade: false, newPlan, redirected: false };
    },
    onSuccess: ({ isUpgrade, newPlan, redirected }) => {
      if (redirected) {
        // Usuario foi redirecionado para o MP, nao fazer nada
        return;
      }
      
      queryClient.invalidateQueries({ queryKey: ['house-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['active-house'] });
      queryClient.invalidateQueries({ queryKey: ['house-plan'] });
      
      if (isUpgrade) {
        toast.success('Assinatura criada!', {
          description: `Voce agora esta no plano ${newPlan.name}.`,
        });
      } else {
        toast.success('Mudanca agendada', {
          description: `Seu plano sera alterado para ${newPlan.name} no proximo ciclo.`,
        });
      }
      setShowChangePlanDialog(false);
      setSelectedPlanId(null);
    },
    onError: (error: any) => {
      toast.error('Erro ao mudar plano', { description: error.message });
    },
  });

  // Mutation para reativar assinatura
  const reactivateSubscription = useMutation({
    mutationFn: async () => {
      if (!house?.id) throw new Error('Casa não encontrada');
      
      const { error } = await supabase
        .from('houses')
        .update({
          subscription_canceled_at: null,
          subscription_ends_at: null,
          subscription_status: 'active',
        })
        .eq('id', house.id);
      
      if (error) throw error;
      
      await supabase.from('house_subscription_history').insert({
        house_id: house.id,
        plan_id: house.plan_id,
        action: 'reactivated',
        notes: 'Assinatura reativada pelo usuário',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['house-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['active-house'] });
      toast.success('Assinatura reativada!');
    },
    onError: (error: any) => {
      toast.error('Erro ao reativar', { description: error.message });
    },
  });

  // Helpers
  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  const getPlanIcon = (index: number) => {
    if (index === 0) return <Zap className="w-5 h-5" />;
    if (index === 1) return <Sparkles className="w-5 h-5" />;
    return <Crown className="w-5 h-5" />;
  };

  const getPlanColor = (index: number) => {
    if (index === 0) return 'text-blue-500';
    if (index === 1) return 'text-purple-500';
    return 'text-amber-500';
  };

  const getStatusBadge = () => {
    if (!house) return null;
    
    switch (house.subscription_status) {
      case 'trial':
        const trialDays = house.trial_ends_at 
          ? differenceInDays(new Date(house.trial_ends_at), new Date())
          : 0;
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
            <Clock className="w-3 h-3 mr-1" />
            Trial - {trialDays > 0 ? `${trialDays} dias restantes` : 'Expirado'}
          </Badge>
        );
      case 'active':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            <Check className="w-3 h-3 mr-1" />
            Ativo
          </Badge>
        );
      case 'cancelled':
        const endDays = house.subscription_ends_at 
          ? differenceInDays(new Date(house.subscription_ends_at), new Date())
          : 0;
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelado - {endDays > 0 ? `${endDays} dias restantes` : 'Expirado'}
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Expirado
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoadingHouse) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const currentPlan = house?.house_plans;
  const isCanceled = house?.subscription_status === 'cancelled';
  const hasPendingChange = !!house?.pending_plan_id;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Assinatura
          </CardTitle>
          <CardDescription>Gerencie seu plano e assinatura.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plano Atual */}
          <div className="p-4 rounded-lg border bg-muted/30">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm text-muted-foreground">Plano atual</p>
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  {currentPlan?.name || 'Trial'}
                  {getStatusBadge()}
                </h3>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {currentPlan ? formatPrice(currentPlan.price_cents) : 'Grátis'}
                </p>
                <p className="text-sm text-muted-foreground">/mês</p>
              </div>
            </div>
            
            {currentPlan?.description && (
              <p className="text-sm text-muted-foreground mb-3">{currentPlan.description}</p>
            )}
            
            {/* Informações de período */}
            <div className="flex flex-wrap gap-4 text-sm">
              {house?.subscription_started_at && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Início: {format(new Date(house.subscription_started_at), 'dd/MM/yyyy', { locale: ptBR })}
                </div>
              )}
              {house?.trial_ends_at && house.subscription_status === 'trial' && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  Trial até: {format(new Date(house.trial_ends_at), 'dd/MM/yyyy', { locale: ptBR })}
                </div>
              )}
              {house?.subscription_ends_at && isCanceled && (
                <div className="flex items-center gap-1 text-orange-600">
                  <AlertTriangle className="w-4 h-4" />
                  Acesso até: {format(new Date(house.subscription_ends_at), 'dd/MM/yyyy', { locale: ptBR })}
                </div>
              )}
            </div>
          </div>

          {/* Mudança pendente */}
          {hasPendingChange && house?.pending_plan && (
            <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                <RefreshCw className="w-4 h-4" />
                <span className="font-medium">Mudança agendada</span>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Seu plano será alterado para <strong>{house.pending_plan.name}</strong> em{' '}
                {house.pending_plan_effective_at && format(new Date(house.pending_plan_effective_at), 'dd/MM/yyyy', { locale: ptBR })}.
              </p>
            </div>
          )}

          {/* Uso Atual */}
          {usageStats && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <h4 className="font-medium">Uso Atual</h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <UsageCard 
                  icon={Users} 
                  label="Consagradores" 
                  value={usageStats.consagradores}
                  limit={currentPlan?.name === 'Plano Básico' ? 50 : currentPlan?.name === 'Plano Intermediário' ? 200 : undefined}
                />
                <UsageCard 
                  icon={CalendarDays} 
                  label="Cerimônias/mês" 
                  value={usageStats.cerimoniasMes}
                  limit={currentPlan?.name === 'Plano Básico' ? 5 : undefined}
                />
                <UsageCard 
                  icon={BookOpen} 
                  label="Materiais" 
                  value={usageStats.materiais}
                />
                <UsageCard 
                  icon={ShoppingBag} 
                  label="Produtos" 
                  value={usageStats.produtos}
                />
                <UsageCard 
                  icon={GraduationCap} 
                  label="Cursos" 
                  value={usageStats.cursos}
                />
                <UsageCard 
                  icon={Image} 
                  label="Galeria" 
                  value={usageStats.galeria}
                />
                <UsageCard 
                  icon={Users} 
                  label="Equipe" 
                  value={usageStats.membrosEquipe}
                />
              </div>
            </div>
          )}

          <Separator />

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-3">
            {isCanceled ? (
              <Button 
                onClick={() => reactivateSubscription.mutate()}
                disabled={reactivateSubscription.isPending}
                className="flex-1"
              >
                {reactivateSubscription.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Reativar Assinatura
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setShowChangePlanDialog(true)}
                  className="flex-1"
                >
                  <ArrowUp className="w-4 h-4 mr-2" />
                  Mudar Plano
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCancelDialog(true)}
                  className="flex-1 text-destructive hover:text-destructive"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancelar Assinatura
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Cancelamento */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Cancelar Assinatura?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Ao cancelar, você ainda terá acesso a todas as funcionalidades até o fim do período atual.
              </p>
              {house?.subscription_started_at && (
                <p className="font-medium">
                  Seu acesso continuará até:{' '}
                  {format(addDays(new Date(house.subscription_started_at), 30), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Você pode reativar sua assinatura a qualquer momento antes do término.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelSubscription.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={cancelSubscription.isPending}
            >
              {cancelSubscription.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Mudança de Plano */}
      <Dialog open={showChangePlanDialog} onOpenChange={setShowChangePlanDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Escolher Plano</DialogTitle>
            <DialogDescription>
              Selecione o plano que melhor atende suas necessidades.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {plans.map((plan, index) => {
              const isCurrentPlan = plan.id === house?.plan_id;
              const isUpgrade = (plan.price_cents || 0) > (currentPlan?.price_cents || 0);
              const isDowngrade = (plan.price_cents || 0) < (currentPlan?.price_cents || 0);
              const isPending = plan.id === house?.pending_plan_id;
              
              return (
                <div
                  key={plan.id}
                  onClick={() => !isCurrentPlan && !isPending && setSelectedPlanId(plan.id)}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all",
                    isCurrentPlan 
                      ? "border-primary bg-primary/5 cursor-default"
                      : isPending
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 cursor-default"
                        : selectedPlanId === plan.id
                          ? "border-primary bg-primary/5 cursor-pointer"
                          : "border-border hover:border-primary/50 cursor-pointer"
                  )}
                >
                  {isCurrentPlan && (
                    <Badge className="absolute -top-2.5 right-4 bg-primary">
                      Plano Atual
                    </Badge>
                  )}
                  {isPending && (
                    <Badge className="absolute -top-2.5 right-4 bg-blue-500">
                      Agendado
                    </Badge>
                  )}
                  
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={getPlanColor(index)}>{getPlanIcon(index)}</span>
                      <span className="font-semibold">{plan.name}</span>
                      {!isCurrentPlan && !isPending && (
                        <Badge variant="outline" className={cn(
                          "text-xs",
                          isUpgrade ? "border-green-500 text-green-600" : "border-orange-500 text-orange-600"
                        )}>
                          {isUpgrade ? (
                            <><ArrowUp className="w-3 h-3 mr-1" />Upgrade</>
                          ) : isDowngrade ? (
                            <><ArrowDown className="w-3 h-3 mr-1" />Downgrade</>
                          ) : null}
                        </Badge>
                      )}
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
                    {(plan.features as string[])?.slice(0, 4).map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {!isCurrentPlan && !isPending && isDowngrade && (
                    <p className="text-xs text-orange-600 mt-3">
                      * Downgrade será aplicado no próximo ciclo de cobrança
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowChangePlanDialog(false);
                setSelectedPlanId(null);
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => selectedPlanId && changePlan.mutate(selectedPlanId)}
              disabled={!selectedPlanId || changePlan.isPending}
              className="flex-1"
            >
              {changePlan.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Confirmar Mudança
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SubscriptionSettings;

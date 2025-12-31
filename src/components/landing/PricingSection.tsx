import { memo, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Check, Shield } from 'lucide-react';
import { ROUTES } from '@/constants';

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatPrice = (cents: number) => currencyFormatter.format(cents / 100);

interface Plan {
  id: string;
  name: string;
  price_cents: number;
  description?: string;
  features?: string[];
  commission_ceremonies_percent: number;
  commission_products_percent: number;
  billing_period: string;
}

const PlanCard = memo(({ 
  plan, 
  isPopular, 
  billingPeriod,
  monthlyEquivalent,
  periodLabel,
  isLoggedIn,
  popularLabel,
  choosePlanLabel,
  ceremoniesFeeLabel,
  salesFeeLabel
}: { 
  plan: Plan;
  isPopular: boolean;
  billingPeriod: string;
  monthlyEquivalent: number;
  periodLabel: string;
  isLoggedIn: boolean;
  popularLabel: string;
  choosePlanLabel: string;
  ceremoniesFeeLabel: string;
  salesFeeLabel: string;
}) => (
  <Card 
    className={`relative flex flex-col h-full ${
      isPopular ? 'border-primary border-2 md:scale-105' : 'border-border/50'
    }`}
  >
    {isPopular && (
      <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center text-xs py-1.5 font-medium">
        ⭐ {popularLabel}
      </div>
    )}
    <CardHeader className={`text-center ${isPopular ? 'pt-10' : 'pt-6'}`}>
      <CardTitle className="text-xl">{plan.name}</CardTitle>
      <div className="mt-4">
        <span className="text-4xl font-bold">{formatPrice(plan.price_cents)}</span>
        <span className="text-muted-foreground">{periodLabel}</span>
      </div>
      {billingPeriod !== 'monthly' && (
        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
          ≈ {formatPrice(monthlyEquivalent)}/mes
        </p>
      )}
      {plan.description && (
        <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
      )}
    </CardHeader>
    <CardContent className="flex flex-col flex-1">
      <ul className="space-y-2.5 flex-1">
        {plan.features?.map((feature: string, i: number) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <div className="pt-4 border-t border-border/50 space-y-1 text-xs text-muted-foreground mt-4">
        <p>{ceremoniesFeeLabel}: {plan.commission_ceremonies_percent}%</p>
        <p>{salesFeeLabel}: {plan.commission_products_percent}%</p>
      </div>
      <Link to={isLoggedIn ? ROUTES.CONFIGURACOES + '?tab=assinatura' : ROUTES.AUTH + `?plan=${plan.id}`} className="block pt-4">
        <Button className="w-full" variant={isPopular ? 'default' : 'outline'}>
          {choosePlanLabel}
        </Button>
      </Link>
    </CardContent>
  </Card>
));
PlanCard.displayName = 'PlanCard';

const MobilePlanCard = memo(({ 
  plan, 
  isPopular, 
  billingPeriod,
  monthlyEquivalent,
  periodLabel,
  expandedPlanId,
  onToggleExpand,
  isLoggedIn,
  popularLabel,
  choosePlanLabel
}: { 
  plan: Plan;
  isPopular: boolean;
  billingPeriod: string;
  monthlyEquivalent: number;
  periodLabel: string;
  expandedPlanId: string | null;
  onToggleExpand: (id: string) => void;
  isLoggedIn: boolean;
  popularLabel: string;
  choosePlanLabel: string;
}) => {
  const isExpanded = expandedPlanId === plan.id;
  
  return (
    <Card className={`relative ${isPopular ? 'border-primary border-2 bg-primary/5' : 'border-border/50'}`}>
      {isPopular && (
        <div className="absolute -top-3 left-4">
          <Badge className="bg-primary text-primary-foreground text-xs">⭐ {popularLabel}</Badge>
        </div>
      )}
      <CardContent className={`p-4 ${isPopular ? 'pt-5' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg">{plan.name}</h3>
            {plan.description && <p className="text-xs text-muted-foreground">{plan.description}</p>}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{formatPrice(plan.price_cents)}</div>
            <div className="text-xs text-muted-foreground">{periodLabel}</div>
            {billingPeriod !== 'monthly' && (
              <div className="text-xs text-green-600">≈ {formatPrice(monthlyEquivalent)}/mes</div>
            )}
          </div>
        </div>
        <div className="space-y-1.5 mb-3">
          {(isExpanded ? plan.features : plan.features?.slice(0, 3))?.map((feature: string, i: number) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
              <span className="text-muted-foreground">{feature}</span>
            </div>
          ))}
          {plan.features && plan.features.length > 3 && (
            <button onClick={() => onToggleExpand(plan.id)} className="text-xs text-primary hover:underline">
              {isExpanded ? 'Ver menos' : `+${plan.features.length - 3} recursos`}
            </button>
          )}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="text-xs text-muted-foreground">
            <span>Taxa: {plan.commission_ceremonies_percent}%</span>
            <span className="mx-1">•</span>
            <span>{plan.commission_products_percent}%</span>
          </div>
          <Link to={isLoggedIn ? ROUTES.CONFIGURACOES + '?tab=assinatura' : ROUTES.AUTH + `?plan=${plan.id}`}>
            <Button size="sm" variant={isPopular ? 'default' : 'outline'} className="h-8">
              {choosePlanLabel}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
});
MobilePlanCard.displayName = 'MobilePlanCard';

interface PricingSectionProps {
  isLoggedIn: boolean;
}

export const PricingSection = memo(({ isLoggedIn }: PricingSectionProps) => {
  const { t } = useTranslation();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  const handleToggleExpand = useCallback((planId: string) => {
    setExpandedPlanId(prev => prev === planId ? null : planId);
  }, []);

  const { data: allPlans } = useQuery({
    queryKey: ['public-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('house_plans')
        .select('*')
        .eq('active', true)
        .order('price_cents', { ascending: true });
      if (error) throw error;
      return data as Plan[];
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  const plans = useMemo(() => 
    allPlans?.filter(plan => plan.billing_period === billingPeriod),
    [allPlans, billingPeriod]
  );

  const getMonthlyEquivalent = (cents: number, period: string) => {
    if (period === 'quarterly') return cents / 3;
    if (period === 'yearly') return cents / 12;
    return cents;
  };

  const getPeriodLabel = (period: string) => {
    return t(`landing.pricing.per${period.charAt(0).toUpperCase() + period.slice(1)}`);
  };

  return (
    <section id="precos" className="py-20 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            <Heart className="h-4 w-4 mr-2 text-red-500" />
            {t('landing.pricing.badge')}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('landing.pricing.title')}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{t('landing.pricing.description')}</p>
        </div>

        <Tabs value={billingPeriod} onValueChange={(v) => setBillingPeriod(v as 'monthly' | 'quarterly' | 'yearly')} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="monthly" className="text-sm">{t('landing.pricing.monthly')}</TabsTrigger>
              <TabsTrigger value="quarterly" className="text-sm relative">
                {t('landing.pricing.quarterly')}
                <Badge className="absolute -top-3 -right-1 bg-green-500 text-white text-[10px] px-1.5 py-0 h-4">-10%</Badge>
              </TabsTrigger>
              <TabsTrigger value="yearly" className="text-sm relative">
                {t('landing.pricing.yearly')}
                <Badge className="absolute -top-3 -right-1 bg-amber-500 text-white text-[10px] px-1.5 py-0 h-4">-20%</Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={billingPeriod} className="mt-0">
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans && plans.length > 0 ? (
                plans.map((plan, index) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    isPopular={index === 1}
                    billingPeriod={billingPeriod}
                    monthlyEquivalent={getMonthlyEquivalent(plan.price_cents, billingPeriod)}
                    periodLabel={getPeriodLabel(billingPeriod)}
                    isLoggedIn={isLoggedIn}
                    popularLabel={t('landing.pricing.popular')}
                    choosePlanLabel={t('landing.pricing.choosePlan')}
                    ceremoniesFeeLabel={t('landing.pricing.ceremoniesFee')}
                    salesFeeLabel={t('landing.pricing.salesFee')}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  {t('landing.pricing.loading')}
                </div>
              )}
            </div>

            <div className="md:hidden space-y-4">
              {plans && plans.length > 0 ? (
                plans.map((plan, index) => (
                  <MobilePlanCard
                    key={plan.id}
                    plan={plan}
                    isPopular={index === 1}
                    billingPeriod={billingPeriod}
                    monthlyEquivalent={getMonthlyEquivalent(plan.price_cents, billingPeriod)}
                    periodLabel={getPeriodLabel(billingPeriod)}
                    expandedPlanId={expandedPlanId}
                    onToggleExpand={handleToggleExpand}
                    isLoggedIn={isLoggedIn}
                    popularLabel={t('landing.pricing.popular')}
                    choosePlanLabel={t('landing.pricing.choosePlan')}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t('landing.pricing.loading')}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-sm">
            <Shield className="h-4 w-4" />
            <span>{t('landing.pricing.guarantee')}</span>
          </div>
        </div>
      </div>
    </section>
  );
});

PricingSection.displayName = 'PricingSection';

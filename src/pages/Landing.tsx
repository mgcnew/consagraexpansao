import { useState, useMemo, memo, lazy, Suspense, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Leaf, 
  Users, 
  Calendar, 
  ShoppingBag, 
  BookOpen, 
  Heart,
  Sparkles,
  Check,
  LogOut,
  LayoutDashboard,
  MessageSquareQuote,
  Image,
  CreditCard,
  BarChart3,
  Bell,
  MessageCircle,
  Shield,
  Clock,
  Zap,
  ChevronRight,
  Play,
  X,
  MapPin,
  Search
} from 'lucide-react';
import { ROUTES } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { ModeToggle } from '@/components/mode-toggle';

// Lazy load do ChatWidget (pesado) - carrega após 3s de idle
const ChatWidget = lazy(() => import('@/components/chat/ChatWidget').then(m => ({ default: m.ChatWidget })));

// Hook para carregar ChatWidget apenas após interação ou idle
const useDeferredChat = () => {
  const [shouldLoad, setShouldLoad] = useState(false);
  
  useEffect(() => {
    // Carrega após 3 segundos de idle ou na primeira interação
    const timer = setTimeout(() => setShouldLoad(true), 3000);
    
    const handleInteraction = () => {
      setShouldLoad(true);
      cleanup();
    };
    
    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
    
    window.addEventListener('scroll', handleInteraction, { once: true, passive: true });
    window.addEventListener('touchstart', handleInteraction, { once: true, passive: true });
    
    return cleanup;
  }, []);
  
  return shouldLoad;
};

// Memoizar formatador
const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatPrice = (cents: number) => currencyFormatter.format(cents / 100);

// Features memoizadas (constante, não muda)
const features = [
  {
    icon: Calendar,
    title: 'Cerimônias',
    description: 'Agende, controle vagas e receba inscrições online com pagamento integrado.',
    highlight: 'Automatize suas inscrições'
  },
  {
    icon: Users,
    title: 'Anamnese Digital',
    description: 'Fichas completas dos consagradores, seguras e acessíveis a qualquer momento.',
    highlight: 'Dados sempre à mão'
  },
  {
    icon: ShoppingBag,
    title: 'Loja Virtual',
    description: 'Venda rapés, medicinas e artesanatos com checkout Pix e cartão.',
    highlight: 'Venda 24h por dia'
  },
  {
    icon: BookOpen,
    title: 'Cursos e Eventos',
    description: 'Formações e workshops com inscrições e pagamentos automatizados.',
    highlight: 'Escale seu conhecimento'
  },
  {
    icon: CreditCard,
    title: 'Pagamentos',
    description: 'Pix instantâneo e cartão de crédito. Dinheiro direto na sua conta.',
    highlight: 'Receba na hora'
  },
  {
    icon: BarChart3,
    title: 'Relatórios',
    description: 'Controle financeiro completo: receitas, despesas e fluxo de caixa.',
    highlight: 'Visão clara do negócio'
  },
];

// FAQs memoizadas
const faqs = [
  {
    question: 'Preciso entender de tecnologia para usar?',
    answer: 'Não! O sistema foi pensado para ser simples e intuitivo. Se você sabe usar WhatsApp, consegue usar nossa plataforma. Além disso, oferecemos suporte humanizado para te ajudar sempre que precisar.'
  },
  {
    question: 'E se eu não gostar, posso cancelar?',
    answer: 'Claro! Você pode testar gratuitamente por 7 dias sem compromisso. Se não gostar, é só não continuar. Sem burocracia, sem perguntas.'
  },
  {
    question: 'Meus dados e dos consagradores estão seguros?',
    answer: 'Absolutamente. Usamos criptografia de ponta e servidores seguros. Seus dados são seus e nunca serão compartilhados com terceiros. Cumprimos todas as normas da LGPD.'
  },
  {
    question: 'Quanto tempo leva para configurar tudo?',
    answer: 'Em menos de 10 minutos você já pode criar sua primeira cerimônia. O sistema vem pré-configurado e você personaliza conforme sua necessidade.'
  },
  {
    question: 'Funciona no celular?',
    answer: 'Sim! O sistema é 100% responsivo e funciona perfeitamente em qualquer dispositivo. Você pode gerenciar sua casa de qualquer lugar.'
  },
  {
    question: 'E se eu precisar de ajuda?',
    answer: 'Nosso suporte é humanizado e rápido. Você pode nos chamar pelo WhatsApp a qualquer momento. Estamos aqui para ajudar sua casa a crescer.'
  },
];

// Componente de Feature Card memoizado - sem transições pesadas
const FeatureCard = memo(({ 
  feature, 
  isActive, 
  onClick 
}: { 
  feature: typeof features[0]; 
  isActive: boolean; 
  onClick: () => void;
}) => (
  <div
    className={`group p-5 rounded-xl border cursor-pointer ${
      isActive 
        ? 'bg-primary/5 border-primary/30 shadow-md' 
        : 'bg-card/50 border-border/50 hover:border-primary/20 hover:bg-card'
    }`}
    onClick={onClick}
  >
    <div className="flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
        isActive ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
      }`}>
        <feature.icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold">{feature.title}</h3>
          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-150 ${
            isActive ? 'rotate-90' : ''
          }`} />
        </div>
        <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
        {isActive && (
          <Badge variant="secondary" className="mt-3 text-xs">
            {feature.highlight}
          </Badge>
        )}
      </div>
    </div>
  </div>
));
FeatureCard.displayName = 'FeatureCard';

// Componente de Plan Card memoizado - otimizado para mobile
const PlanCard = memo(({ 
  plan, 
  isPopular, 
  billingPeriod,
  monthlyEquivalent,
  periodLabel,
  isLoggedIn
}: { 
  plan: { id: string; name: string; price_cents: number; description?: string; features?: string[]; commission_ceremonies_percent: number; commission_products_percent: number };
  isPopular: boolean;
  billingPeriod: string;
  monthlyEquivalent: number;
  periodLabel: string;
  isLoggedIn: boolean;
}) => (
  <Card 
    className={`relative flex flex-col h-full ${
      isPopular 
        ? 'border-primary border-2 md:scale-105' 
        : 'border-border/50'
    }`}
    style={{ contain: 'layout style paint', contentVisibility: 'auto' }}
  >
    {isPopular && (
      <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center text-xs py-1.5 font-medium">
        ⭐ Mais Escolhido
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
          ≈ {formatPrice(monthlyEquivalent)}/mês
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
        <p>Taxa cerimônias: {plan.commission_ceremonies_percent}%</p>
        <p>Taxa vendas: {plan.commission_products_percent}%</p>
      </div>

      <Link to={isLoggedIn ? ROUTES.CONFIGURACOES + '?tab=assinatura' : ROUTES.AUTH + `?plan=${plan.id}`} className="block pt-4">
        <Button 
          className="w-full"
          variant={isPopular ? 'default' : 'outline'}
        >
          Escolher Plano
        </Button>
      </Link>
    </CardContent>
  </Card>
));
PlanCard.displayName = 'PlanCard';

// Componente de Plan Card compacto para mobile - layout horizontal otimizado
const MobilePlanCard = memo(({ 
  plan, 
  isPopular, 
  billingPeriod,
  monthlyEquivalent,
  periodLabel,
  expandedPlanId,
  onToggleExpand,
  isLoggedIn
}: { 
  plan: { id: string; name: string; price_cents: number; description?: string; features?: string[]; commission_ceremonies_percent: number; commission_products_percent: number };
  isPopular: boolean;
  billingPeriod: string;
  monthlyEquivalent: number;
  periodLabel: string;
  expandedPlanId: string | null;
  onToggleExpand: (id: string) => void;
  isLoggedIn: boolean;
}) => {
  const isExpanded = expandedPlanId === plan.id;
  
  return (
    <Card 
      className={`relative ${
        isPopular 
          ? 'border-primary border-2 bg-primary/5' 
          : 'border-border/50'
      }`}
      style={{ contain: 'layout style paint', contentVisibility: 'auto' }}
    >
      {isPopular && (
        <div className="absolute -top-3 left-4">
          <Badge className="bg-primary text-primary-foreground text-xs">
            ⭐ Mais Escolhido
          </Badge>
        </div>
      )}
      
      <CardContent className={`p-4 ${isPopular ? 'pt-5' : ''}`}>
        {/* Header com nome e preço */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg">{plan.name}</h3>
            {plan.description && (
              <p className="text-xs text-muted-foreground">{plan.description}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{formatPrice(plan.price_cents)}</div>
            <div className="text-xs text-muted-foreground">{periodLabel}</div>
            {billingPeriod !== 'monthly' && (
              <div className="text-xs text-green-600">≈ {formatPrice(monthlyEquivalent)}/mês</div>
            )}
          </div>
        </div>

        {/* Features resumidas ou expandidas - sem animação para melhor performance */}
        <div className="space-y-1.5 mb-3">
          {(isExpanded ? plan.features : plan.features?.slice(0, 3))?.map((feature: string, i: number) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
              <span className="text-muted-foreground">{feature}</span>
            </div>
          ))}
          {plan.features && plan.features.length > 3 && (
            <button 
              onClick={() => onToggleExpand(plan.id)}
              className="text-xs text-primary hover:underline"
            >
              {isExpanded ? 'Ver menos' : `+${plan.features.length - 3} recursos`}
            </button>
          )}
        </div>

        {/* Taxas e botão */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="text-xs text-muted-foreground">
            <span>Taxa: {plan.commission_ceremonies_percent}% cerim.</span>
            <span className="mx-1">•</span>
            <span>{plan.commission_products_percent}% vendas</span>
          </div>
          <Link to={isLoggedIn ? ROUTES.CONFIGURACOES + '?tab=assinatura' : ROUTES.AUTH + `?plan=${plan.id}`}>
            <Button 
              size="sm"
              variant={isPopular ? 'default' : 'outline'}
              className="h-8"
            >
              Escolher
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
});
MobilePlanCard.displayName = 'MobilePlanCard';

const Landing = () => {
  const { user, isAdmin, signOut } = useAuth();
  const [activeFeature, setActiveFeature] = useState(0);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const shouldLoadChat = useDeferredChat();

  // Callback memoizado para toggle de plano expandido
  const handleToggleExpand = useCallback((planId: string) => {
    setExpandedPlanId(prev => prev === planId ? null : planId);
  }, []);

  // Buscar planos ativos com staleTime longo (dados raramente mudam)
  const { data: allPlans } = useQuery({
    queryKey: ['public-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('house_plans')
        .select('*')
        .eq('active', true)
        .order('price_cents', { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 30, // 30 minutos - planos não mudam frequentemente
    gcTime: 1000 * 60 * 60, // 1 hora em cache
  });

  // Filtrar planos pelo período selecionado - memoizado
  const plans = useMemo(() => 
    allPlans?.filter(plan => plan.billing_period === billingPeriod),
    [allPlans, billingPeriod]
  );

  // Calcular preço mensal equivalente para exibição
  const getMonthlyEquivalent = (cents: number, period: string) => {
    if (period === 'quarterly') return cents / 3;
    if (period === 'yearly') return cents / 12;
    return cents;
  };

  // Label do período
  const getPeriodLabel = (period: string) => {
    if (period === 'quarterly') return '/trimestre';
    if (period === 'yearly') return '/ano';
    return '/mês';
  };

  const whatsappNumber = '5511999999999';
  const whatsappMessage = encodeURIComponent('Olá! Tenho interesse em conhecer mais sobre a plataforma Consciência Divinal.');

  return (
    <div className="min-h-screen bg-background">
      {/* Header - sem backdrop-blur no mobile para melhor performance */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 md:bg-background/80 md:backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo-full.png" 
              alt="Consciência Divinal" 
              className="h-9 w-auto"
              loading="eager"
              onError={(e) => {
                e.currentTarget.src = '/logo-topbar.png';
              }}
            />
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#recursos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Recursos
            </a>
            <a href="#precos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Preços
            </a>
            <a href="#duvidas" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Dúvidas
            </a>
            <Link to={ROUTES.BUSCAR_CASAS} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Encontrar Casas
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ModeToggle />
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/portal">
                    <Button variant="ghost" size="sm" className="hidden sm:flex">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Portal
                    </Button>
                  </Link>
                )}
                <Link to="/app">
                  <Button size="sm">Acessar</Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => signOut()}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Link to={ROUTES.AUTH}>
                  <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Entrar</Button>
                  <Button size="sm" className="sm:hidden">Entrar</Button>
                </Link>
                <Link to={ROUTES.AUTH + '?demo=true'} className="hidden sm:block">
                  <Button size="sm" className="gap-2">
                    <Play className="h-3 w-3" />
                    Testar Grátis
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 relative overflow-hidden">
        {/* Background decorativo - gradiente simples, sem blur no mobile */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="hidden lg:block absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl opacity-50" />
        <div className="hidden lg:block absolute bottom-0 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl opacity-50" />
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge com gatilho de escassez sutil */}
            <Badge variant="outline" className="mb-6 px-4 py-2 text-sm border-primary/30">
              <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
              Vagas limitadas para novos cadastros
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Gerencie sua{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-500">
                Casa Xamânica
              </span>
              {' '}com sabedoria
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Plataforma completa para gestão de cerimônias, consagradores, loja virtual e muito mais. 
              Foque no que importa: <span className="text-foreground font-medium">a cura e expansão da consciência.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={ROUTES.AUTH + '?demo=true'}>
                <Button size="lg" className="gap-2 px-8">
                  <Play className="h-4 w-4" />
                  Testar Grátis por 7 Dias
                </Button>
              </Link>
              <a href="#recursos">
                <Button size="lg" variant="outline" className="px-8">
                  Conhecer Recursos
                </Button>
              </a>
            </div>

            {/* Gatilho de prova social */}
            <div className="mt-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-amber-500/20 border-2 border-background flex items-center justify-center">
                    <Users className="h-3 w-3 text-primary" />
                  </div>
                ))}
              </div>
              <span>Casas já estão transformando seu trabalho</span>
            </div>
          </div>
        </div>

        {/* Degradê de transição */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-muted/50 to-transparent" />
      </section>

      {/* Seção para Consagradores */}
      <section className="py-12 bg-primary/5 border-y border-primary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-xl md:text-2xl font-bold mb-2">
                Buscando uma cerimônia?
              </h2>
              <p className="text-muted-foreground">
                Encontre casas de consagração próximas a você e participe de cerimônias com medicinas sagradas.
              </p>
            </div>
            <Link to={ROUTES.BUSCAR_CASAS}>
              <Button size="lg" variant="outline" className="gap-2 whitespace-nowrap border-primary/30 hover:bg-primary/10">
                <Search className="h-4 w-4" />
                Encontrar Casas Próximas
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section - Formato mais leve */}
      <section id="recursos" className="py-20 bg-muted/30 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Zap className="h-4 w-4 mr-2 text-amber-500" />
              Tudo em um só lugar
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simplifique sua gestão
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Ferramentas pensadas para o trabalho sagrado. Menos tempo no computador, mais tempo com sua comunidade.
            </p>
          </div>

          {/* Features em formato de lista interativa */}
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <FeatureCard
                  key={index}
                  feature={feature}
                  isActive={activeFeature === index}
                  onClick={() => setActiveFeature(index)}
                />
              ))}
            </div>

            {/* Recursos adicionais em linha */}
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MessageSquareQuote className="h-4 w-4 text-primary" />
                <span>Depoimentos</span>
              </div>
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4 text-primary" />
                <span>Galeria de Fotos</span>
              </div>
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <span>Notificações</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>Dados Seguros</span>
              </div>
            </div>
          </div>
        </div>

        {/* Degradê de transição */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Pricing Section - Otimizado para mobile */}
      <section id="precos" className="py-20 relative" style={{ contain: 'layout style' }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Heart className="h-4 w-4 mr-2 text-red-500" />
              Investimento acessível
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Escolha seu plano
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Comece com 7 dias grátis. Sem cartão de crédito. Cancele quando quiser.
            </p>
          </div>

          {/* Tabs de período */}
          <Tabs value={billingPeriod} onValueChange={(v) => setBillingPeriod(v as 'monthly' | 'quarterly' | 'yearly')} className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid grid-cols-3 w-full max-w-md">
                <TabsTrigger value="monthly" className="text-sm">
                  Mensal
                </TabsTrigger>
                <TabsTrigger value="quarterly" className="text-sm relative">
                  Trimestral
                  <Badge className="absolute -top-3 -right-1 bg-green-500 text-white text-[10px] px-1.5 py-0 h-4">
                    -10%
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="yearly" className="text-sm relative">
                  Anual
                  <Badge className="absolute -top-3 -right-1 bg-amber-500 text-white text-[10px] px-1.5 py-0 h-4">
                    -20%
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={billingPeriod} className="mt-0">
              {/* Desktop: Grid normal */}
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
                      isLoggedIn={!!user}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    Carregando planos...
                  </div>
                )}
              </div>

              {/* Mobile: Cards empilhados verticalmente */}
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
                      isLoggedIn={!!user}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Carregando planos...
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Garantia */}
          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-sm">
              <Shield className="h-4 w-4" />
              <span>7 dias grátis • Sem compromisso • Cancele quando quiser</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section - Objeções */}
      <section id="duvidas" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <MessageCircle className="h-4 w-4 mr-2 text-primary" />
              Tire suas dúvidas
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Perguntas frequentes
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Respondemos as principais dúvidas para você decidir com tranquilidade.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-card border border-border/50 rounded-lg px-4 data-[state=open]:border-primary/30"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* CTA após FAQ */}
            <div className="mt-10 text-center">
              <p className="text-muted-foreground mb-4">Ainda tem dúvidas?</p>
              <a 
                href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Falar com a gente
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 relative overflow-hidden">
        {/* Background - gradiente simples, sem blur no mobile/tablet */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/10 to-background" />
        <div className="hidden lg:block absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50" />
        <div className="hidden lg:block absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl opacity-50" />
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-2xl mx-auto text-center">
            <Leaf className="h-12 w-12 text-primary mx-auto mb-6" />
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Pronto para transformar sua casa?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Comece agora mesmo. Em poucos minutos você terá sua casa configurada e pronta para receber inscrições.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={ROUTES.AUTH + '?demo=true'}>
                <Button size="lg" className="gap-2 px-8">
                  <Sparkles className="h-4 w-4" />
                  Começar Teste Grátis
                </Button>
              </Link>
            </div>

            {/* Gatilhos finais */}
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Configuração em 10 min</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <X className="h-4 w-4 text-primary" />
                <span>Cancele quando quiser</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <img 
                src="/logo-full.png" 
                alt="Consciência Divinal" 
                className="h-10 w-auto mb-4"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <p className="text-sm text-muted-foreground">
                Plataforma completa para gestão de casas xamânicas e cerimônias com medicinas sagradas.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Recursos</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Gestão de Cerimônias</li>
                <li>Loja Virtual</li>
                <li>Cursos e Eventos</li>
                <li>Relatórios Financeiros</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/termos" className="hover:text-foreground transition-colors">Termos de Uso</Link></li>
                <li><Link to="/privacidade" className="hover:text-foreground transition-colors">Privacidade</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              Feito com amor para a comunidade xamânica
            </p>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Consciência Divinal
            </p>
          </div>
        </div>
      </footer>


      {/* Chat Widget com IA - Lazy loaded após interação ou 3s */}
      {shouldLoadChat && (
        <Suspense fallback={null}>
          <ChatWidget />
        </Suspense>
      )}
    </div>
  );
};

export default Landing;

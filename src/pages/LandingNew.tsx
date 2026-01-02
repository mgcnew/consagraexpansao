import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Calendar, Users, ShoppingBag, BookOpen, CreditCard, BarChart3,
  MapPin, Play, Menu, Sparkles, Heart, Shield, Check, X,
  MessageCircle, Clock, Leaf, Search, Home
} from 'lucide-react';
import { ROUTES } from '@/constants';
import { ModeToggle } from '@/components/mode-toggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { SEOHead, OrganizationSchema, WebsiteSchema, SoftwareApplicationSchema, FAQSchema } from '@/components/seo';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ChatWidget } from '@/components/chat/ChatWidget';

// ============================================
// HEADER - Mobile First, SEM dependencia de auth
// Sempre mostra "Entrar" - sem piscadas
// ============================================
function Header() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b">
      <div className="container flex items-center justify-between h-16 px-4">
        {/* Logo - maior com margem negativa para não afetar altura do header */}
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
          className="flex items-center"
        >
          <img src="/logo.png" alt="Ahoo" className="h-16 w-auto -my-2" />
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <button onClick={() => scrollTo('recursos')} className="text-sm text-muted-foreground hover:text-foreground">
            {t('landing.nav.features')}
          </button>
          <button onClick={() => scrollTo('precos')} className="text-sm text-muted-foreground hover:text-foreground">
            {t('landing.nav.pricing')}
          </button>
          <button onClick={() => scrollTo('duvidas')} className="text-sm text-muted-foreground hover:text-foreground">
            {t('landing.nav.faq')}
          </button>
          <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground">Blog</Link>
          <Link to={ROUTES.BUSCAR_CASAS} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {t('landing.nav.findHouses')}
          </Link>
        </nav>

        {/* Actions - sempre o mesmo layout */}
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <ModeToggle />
          
          {/* Desktop - sempre mostra Entrar (redireciona para /app se logado) */}
          <Link to={ROUTES.AUTH} className="hidden md:block">
            <Button size="sm">{t('landing.nav.login')}</Button>
          </Link>

          {/* Mobile menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader><SheetTitle>Menu</SheetTitle></SheetHeader>
              <nav className="flex flex-col gap-4 mt-6">
                <button onClick={() => scrollTo('recursos')} className="text-left py-2 border-b">{t('landing.nav.features')}</button>
                <button onClick={() => scrollTo('precos')} className="text-left py-2 border-b">{t('landing.nav.pricing')}</button>
                <button onClick={() => scrollTo('duvidas')} className="text-left py-2 border-b">{t('landing.nav.faq')}</button>
                <Link to="/blog" onClick={() => setMenuOpen(false)} className="py-2 border-b">Blog</Link>
                <Link to={ROUTES.BUSCAR_CASAS} onClick={() => setMenuOpen(false)} className="py-2 border-b flex items-center gap-2">
                  <MapPin className="h-4 w-4" />{t('landing.nav.findHouses')}
                </Link>
                <div className="pt-4 space-y-3">
                  <Link to={ROUTES.AUTH} onClick={() => setMenuOpen(false)}>
                    <Button className="w-full">{t('landing.nav.login')}</Button>
                  </Link>
                  <Link to={ROUTES.AUTH + '?demo=true'} onClick={() => setMenuOpen(false)}>
                    <Button variant="outline" className="w-full">{t('landing.nav.tryFree')}</Button>
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

// ============================================
// SCROLL REVEAL - Animacao CSS pura ao rolar
// ============================================
function RevealOnScroll({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );
    
    observer.observe(element);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ============================================
// HERO - Dual CTA + Imagem - Centralizado
// ============================================
function Hero() {
  const { t } = useTranslation();

  return (
    <section className="py-12 md:py-20">
      <div className="container px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-5 gap-8 md:gap-12 items-center">
            {/* Texto - 3 colunas */}
            <div className="text-center md:text-left order-2 md:order-1 md:col-span-3">
              <Badge variant="outline" className="mb-4">
                <Sparkles className="h-3 w-3 mr-1 text-amber-500" />
                {t('landing.hero.badge')}
              </Badge>
              
              <h1 className="text-2xl md:text-4xl font-bold mb-4 font-display leading-tight">
                Transforme sua{' '}
                <span className="text-primary">Casa de Medicina</span>
                {' '}em um espaco organizado
              </h1>
              
              <p className="text-muted-foreground mb-6 text-sm md:text-base">
                Chega de planilhas e WhatsApp. Gerencie cerimonias, inscricoes e pagamentos em um so lugar.{' '}
                <span className="text-foreground font-semibold">Comece em 5 minutos.</span>
              </p>

              {/* Dual CTA */}
              <div className="space-y-3 max-w-md mx-auto md:mx-0">
                {/* Para Donos de Casa */}
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <Home className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-sm mb-1">Sou Guardiao / Dono de Casa</h3>
                        <p className="text-xs text-muted-foreground mb-2">Organize sua casa e receba pagamentos online</p>
                        <Link to={ROUTES.AUTH + '?demo=true'}>
                          <Button size="sm" className="gap-2 h-8 text-xs">
                            <Play className="h-3 w-3" />
                            Testar Gratis por 7 Dias
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Para Consagradores */}
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted shrink-0">
                        <Search className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-sm mb-1">Busco uma Cerimonia</h3>
                        <p className="text-xs text-muted-foreground mb-2">Encontre casas e cerimonias perto de voce</p>
                        <Link to={ROUTES.BUSCAR_CASAS}>
                          <Button size="sm" variant="outline" className="gap-2 h-8 text-xs">
                            <MapPin className="h-3 w-3" />
                            Ver Casas Proximas
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Imagem - 2 colunas */}
            <div className="order-1 md:order-2 md:col-span-2">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-amber-500/20 shadow-xl max-w-[320px] mx-auto">
                <img 
                  src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80" 
                  alt="Cerimonia sagrada"
                  className="w-full h-full object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="text-xs font-medium">+50 casas ja transformando seu trabalho</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


// ============================================
// FEATURES - Grid simples
// ============================================
const features = [
  { key: 'ceremonies', icon: Calendar },
  { key: 'anamnesis', icon: Users },
  { key: 'store', icon: ShoppingBag },
  { key: 'courses', icon: BookOpen },
  { key: 'payments', icon: CreditCard },
  { key: 'reports', icon: BarChart3 },
];

function Features() {
  const { t } = useTranslation();

  return (
    <section id="recursos" className="py-16 bg-muted/30">
      <div className="container px-4">
        <RevealOnScroll className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1 text-amber-500" />
            {t('landing.features.badge')}
          </Badge>
          <h2 className="text-2xl md:text-4xl font-bold mb-4 font-display">{t('landing.features.title')}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{t('landing.features.description')}</p>
        </RevealOnScroll>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {features.map(({ key, icon: Icon }, index) => (
            <RevealOnScroll key={key} delay={index * 100}>
              <Card className="hover:border-primary/30 transition-colors h-full">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{t(`landing.features.items.${key}.title`)}</h3>
                      <p className="text-sm text-muted-foreground">{t(`landing.features.items.${key}.description`)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// PRICING - Cards com planos do banco
// ============================================
const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatPrice = (cents: number) => currencyFormatter.format(cents / 100);

function Pricing() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  const { data: plans } = useQuery({
    queryKey: ['plans', period],
    queryFn: async () => {
      const { data } = await supabase
        .from('house_plans')
        .select('*')
        .eq('active', true)
        .eq('billing_period', period)
        .order('price_cents');
      return data || [];
    },
    staleTime: 1000 * 60 * 30,
  });

  return (
    <section id="precos" className="py-16">
      <div className="container px-4">
        <RevealOnScroll className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            <Heart className="h-3 w-3 mr-1 text-red-500" />
            {t('landing.pricing.badge')}
          </Badge>
          <h2 className="text-2xl md:text-4xl font-bold mb-4 font-display">{t('landing.pricing.title')}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{t('landing.pricing.description')}</p>
        </RevealOnScroll>

        {/* Period selector */}
        <RevealOnScroll delay={100} className="flex justify-center gap-2 mb-8">
          {(['monthly', 'quarterly', 'yearly'] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
              className="relative"
            >
              {t(`landing.pricing.${p}`)}
              {p === 'yearly' && <Badge className="absolute -top-2 -right-2 text-[10px] px-1 bg-green-500">-20%</Badge>}
            </Button>
          ))}
        </RevealOnScroll>

        {/* Plans grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans?.map((plan, i) => (
            <RevealOnScroll key={plan.id} delay={i * 150}>
              <Card className={`h-full ${i === 1 ? 'border-primary border-2 relative' : ''}`}>
                {i === 1 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">{t('landing.pricing.popular')}</Badge>
                  </div>
                )}
                <CardContent className={`p-6 ${i === 1 ? 'pt-8' : ''}`}>
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">{formatPrice(plan.price_cents)}</span>
                    <span className="text-muted-foreground">{t(`landing.pricing.per${period === 'monthly' ? 'Month' : period === 'quarterly' ? 'Quarter' : 'Year'}`)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                  
                  <div className="space-y-2 mb-6">
                    {(plan.allowed_features || []).slice(0, 6).map((f: string) => (
                      <div key={f} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>{t(`landing.pricing.appFeatures.${f}.name`)}</span>
                      </div>
                    ))}
                  </div>

                  <Link to={ROUTES.AUTH + `?plan=${plan.id}`}>
                    <Button className="w-full" variant={i === 1 ? 'default' : 'outline'}>
                      {t('landing.pricing.choosePlan')}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll delay={300}>
          <div className="text-center mt-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600 text-sm">
              <Shield className="h-4 w-4" />
              {t('landing.pricing.guarantee')}
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}


// ============================================
// FAQ - Accordion nativo
// ============================================
const faqKeys = ['tech', 'cancel', 'security', 'setup', 'mobile', 'help', 'payment', 'consagradores'];

function FAQ() {
  const { t } = useTranslation();
  
  const faqItems = faqKeys.map(key => ({
    question: t(`landing.faq.items.${key}.question`),
    answer: t(`landing.faq.items.${key}.answer`),
  }));

  return (
    <section id="duvidas" className="py-16 bg-muted/30">
      <FAQSchema items={faqItems} />
      <div className="container px-4">
        <RevealOnScroll className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            <MessageCircle className="h-3 w-3 mr-1 text-primary" />
            {t('landing.faq.badge')}
          </Badge>
          <h2 className="text-2xl md:text-4xl font-bold mb-4 font-display">{t('landing.faq.title')}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{t('landing.faq.description')}</p>
        </RevealOnScroll>

        <div className="max-w-2xl mx-auto">
          <RevealOnScroll delay={100}>
            <Accordion type="single" collapsible className="space-y-2">
              {faqKeys.map((key, i) => (
                <AccordionItem key={key} value={`item-${i}`} className="bg-card border rounded-lg px-4">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    {t(`landing.faq.items.${key}.question`)}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {t(`landing.faq.items.${key}.answer`)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </RevealOnScroll>

          <RevealOnScroll delay={200} className="text-center mt-8">
            <p className="text-muted-foreground mb-4">{t('landing.faq.stillQuestions')}</p>
            <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                {t('landing.faq.talkToUs')}
              </Button>
            </a>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}

// ============================================
// CTA Final
// ============================================
function CTA() {
  const { t } = useTranslation();

  return (
    <section className="py-16">
      <div className="container px-4">
        <RevealOnScroll className="max-w-2xl mx-auto text-center">
          <Leaf className="h-12 w-12 text-primary mx-auto mb-6" />
          <h2 className="text-2xl md:text-4xl font-bold mb-4 font-display">{t('landing.cta.title')}</h2>
          <p className="text-muted-foreground mb-8">{t('landing.cta.description')}</p>
          
          <Link to={ROUTES.AUTH + '?demo=true'}>
            <Button size="lg" className="gap-2">
              <Sparkles className="h-4 w-4" />
              {t('landing.cta.button')}
            </Button>
          </Link>

          <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" />{t('landing.cta.setup')}</span>
            <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />{t('landing.cta.noCard')}</span>
            <span className="flex items-center gap-2"><X className="h-4 w-4 text-primary" />{t('landing.cta.cancel')}</span>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

// ============================================
// FOOTER
// ============================================
function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="py-12 border-t bg-muted/30">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto text-center">
          <img src="/logo.png" alt="Ahoo" className="h-12 mx-auto mb-4" loading="lazy" />
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">{t('landing.footer.description')}</p>
          
          <div className="flex flex-wrap justify-center gap-6 mb-6 text-sm">
            <a href="#recursos" className="text-muted-foreground hover:text-foreground">{t('landing.nav.features')}</a>
            <a href="#precos" className="text-muted-foreground hover:text-foreground">{t('landing.nav.pricing')}</a>
            <a href="/termos" className="text-muted-foreground hover:text-foreground">{t('landing.footer.terms')}</a>
            <a href="/privacidade" className="text-muted-foreground hover:text-foreground">{t('landing.footer.privacy')}</a>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
            <Heart className="h-4 w-4 text-red-500 fill-red-500" />
            {t('landing.footer.madeWith')}
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Ahoo. {t('landing.footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}

// ============================================
// LANDING PAGE PRINCIPAL
// ============================================
export default function LandingNew() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Portal de Casas de Consagracao"
        description="Conecte-se com casas de consagracao, participe de cerimonias sagradas e expanda sua consciencia."
      />
      <OrganizationSchema />
      <WebsiteSchema />
      <SoftwareApplicationSchema />
      
      <Header />
      <main className="pt-16">
        <Hero />
        <Features />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
      
      {/* Chat IA */}
      <ChatWidget />
    </div>
  );
}

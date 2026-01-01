import { useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedSection } from '@/components/ui/animated-section';
import { useInView } from '@/hooks/useInView';
import { SEOHead, OrganizationSchema, WebsiteSchema, SoftwareApplicationSchema } from '@/components/seo';

// Componentes carregados imediatamente (above the fold)
import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroSection } from '@/components/landing/HeroSection';

// Componentes lazy loaded (below the fold)
const ConsagradoresSection = lazy(() => import('@/components/landing/ConsagradoresSection').then(m => ({ default: m.ConsagradoresSection })));
const FeaturesSection = lazy(() => import('@/components/landing/FeaturesSection').then(m => ({ default: m.FeaturesSection })));
const PricingSection = lazy(() => import('@/components/landing/PricingSection').then(m => ({ default: m.PricingSection })));
const FAQSection = lazy(() => import('@/components/landing/FAQSection').then(m => ({ default: m.FAQSection })));
const CTASection = lazy(() => import('@/components/landing/CTASection').then(m => ({ default: m.CTASection })));
const FooterSection = lazy(() => import('@/components/landing/FooterSection').then(m => ({ default: m.FooterSection })));
const ChatWidget = lazy(() => import('@/components/chat/ChatWidget').then(m => ({ default: m.ChatWidget })));

// Skeleton para secoes carregando
const SectionSkeleton = () => (
  <div className="py-20">
    <div className="container mx-auto px-4">
      <div className="h-8 w-48 bg-muted rounded-lg mx-auto mb-4 animate-pulse" />
      <div className="h-4 w-96 max-w-full bg-muted rounded mx-auto mb-8 animate-pulse" />
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  </div>
);

// Componente que carrega lazy quando visivel
const LazySection = ({ children, id }: { children: React.ReactNode; id?: string }) => {
  const { ref, inView } = useInView({ threshold: 0, rootMargin: '100px' });
  
  return (
    <div ref={ref} id={id}>
      {inView ? (
        <Suspense fallback={<SectionSkeleton />}>
          <AnimatedSection>{children}</AnimatedSection>
        </Suspense>
      ) : (
        <SectionSkeleton />
      )}
    </div>
  );
};

const Landing = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  // Redirecionar usuarios convidados para a pagina de convite
  useEffect(() => {
    const invitedHouseSlug = localStorage.getItem('invited_house_slug');
    if (invitedHouseSlug && !user) {
      navigate(`/convite/${invitedHouseSlug}`);
    }
  }, [navigate, user]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Portal de Casas de Consagracao"
        description="Conecte-se com casas de consagracao, participe de cerimonias sagradas e expanda sua consciencia. Encontre sua casa espiritual no Ahoo."
      />
      <OrganizationSchema />
      <WebsiteSchema />
      <SoftwareApplicationSchema />
      
      <LandingHeader user={user} isAdmin={isAdmin} signOut={signOut} />
      
      {/* Hero carrega imediatamente */}
      <HeroSection />
      
      {/* Secoes abaixo carregam sob demanda com animacao */}
      <LazySection>
        <ConsagradoresSection />
      </LazySection>
      
      <LazySection id="recursos">
        <FeaturesSection />
      </LazySection>
      
      <LazySection id="precos">
        <PricingSection isLoggedIn={!!user} />
      </LazySection>
      
      <LazySection id="duvidas">
        <FAQSection />
      </LazySection>
      
      <LazySection>
        <CTASection />
      </LazySection>
      
      <LazySection>
        <FooterSection />
      </LazySection>

      {/* Chat Widget lazy loaded */}
      <Suspense fallback={null}>
        <ChatWidget />
      </Suspense>
    </div>
  );
};

export default Landing;

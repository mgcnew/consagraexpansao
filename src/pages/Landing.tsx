import { useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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

const Landing = () => {
  const { user, isLoading, signOut } = useAuth();
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
      
      <LandingHeader user={user} isLoading={isLoading} signOut={signOut} />
      
      {/* Hero carrega imediatamente */}
      <HeroSection />
      
      {/* Secoes carregam sob demanda */}
      <Suspense fallback={null}>
        <ConsagradoresSection />
      </Suspense>
      
      <Suspense fallback={null}>
        <section id="recursos">
          <FeaturesSection />
        </section>
      </Suspense>
      
      <Suspense fallback={null}>
        <section id="precos">
          <PricingSection isLoggedIn={!!user} />
        </section>
      </Suspense>
      
      <Suspense fallback={null}>
        <section id="duvidas">
          <FAQSection />
        </section>
      </Suspense>
      
      <Suspense fallback={null}>
        <CTASection />
      </Suspense>
      
      <Suspense fallback={null}>
        <FooterSection />
      </Suspense>

      {/* Chat Widget lazy loaded */}
      <Suspense fallback={null}>
        <ChatWidget />
      </Suspense>
    </div>
  );
};

export default Landing;

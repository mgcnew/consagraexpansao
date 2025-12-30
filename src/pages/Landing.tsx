import { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Landing page components
import {
  LandingHeader,
  HeroSection,
  ConsagradoresSection,
  FeaturesSection,
  PricingSection,
  FAQSection,
  CTASection,
  FooterSection,
} from '@/components/landing';

// Lazy load do ChatWidget (pesado) - carrega após 3s de idle
const ChatWidget = lazy(() => import('@/components/chat/ChatWidget').then(m => ({ default: m.ChatWidget })));

// Hook para carregar ChatWidget apenas após interação ou idle
const useDeferredChat = () => {
  const [shouldLoad, setShouldLoad] = useState(false);
  
  useEffect(() => {
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

const Landing = () => {
  const { user, isAdmin, signOut } = useAuth();
  const shouldLoadChat = useDeferredChat();

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader user={user} isAdmin={isAdmin} signOut={signOut} />
      <HeroSection />
      <ConsagradoresSection />
      <FeaturesSection />
      <PricingSection isLoggedIn={!!user} />
      <FAQSection />
      <CTASection />
      <FooterSection />

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

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

// Chat Widget - carregado imediatamente
import { ChatWidget } from '@/components/chat/ChatWidget';

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
      <LandingHeader user={user} isAdmin={isAdmin} signOut={signOut} />
      <HeroSection />
      <ConsagradoresSection />
      <FeaturesSection />
      <PricingSection isLoggedIn={!!user} />
      <FAQSection />
      <CTASection />
      <FooterSection />

      {/* Chat Widget com IA */}
      <ChatWidget />
    </div>
  );
};

export default Landing;

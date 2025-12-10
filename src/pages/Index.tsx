import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, ChevronRight, Camera, CalendarDays, BookOpen, MessageSquare, Sparkles, ShoppingBag, Instagram, MessageCircle } from 'lucide-react';
import { ROUTES } from '@/constants';

// Dashboard components
import { PhotoCarousel } from '@/components/dashboard/PhotoCarousel';
import { EventsCarousel } from '@/components/dashboard/EventsCarousel';
import { UpcomingCeremoniesSection } from '@/components/dashboard/UpcomingCeremoniesSection';
import { MyInscriptionsSection } from '@/components/dashboard/MyInscriptionsSection';
import { MyTestimonialsSection } from '@/components/dashboard/MyTestimonialsSection';

// Shared components
import { SectionErrorBoundary } from '@/components/shared';

// Custom hooks
import { useLatestPhotos } from '@/hooks/queries/useLatestPhotos';
import { useUpcomingCeremonies } from '@/hooks/queries/useUpcomingCeremonies';
import { useMyInscriptions } from '@/hooks/queries/useMyInscriptions';
import { useMyTestimonials } from '@/hooks/queries/useMyTestimonials';
import { useCerimoniasFuturas } from '@/hooks/queries';

const Index: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasAnamnese, setHasAnamnese] = useState<boolean | null>(null);

  // Fetch data using custom hooks
  const { data: photos = [], isLoading: photosLoading, error: photosError } = useLatestPhotos(10);
  const { data: allEvents = [], isLoading: eventsLoading, error: eventsError } = useCerimoniasFuturas();
  const { data: ceremonies = [], isLoading: ceremoniesLoading, error: ceremoniesError } = useUpcomingCeremonies(3);
  const { data: inscriptions = [], isLoading: inscriptionsLoading, error: inscriptionsError } = useMyInscriptions(user?.id, 3);
  const { data: testimonials = [], isLoading: testimonialsLoading, error: testimonialsError } = useMyTestimonials(user?.id, 3);

  // Check if user has anamnese (Req 7.1, 7.4)
  useEffect(() => {
    const checkAnamnese = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('anamneses')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error) {
        setHasAnamnese(!!data);
      }
    };

    checkAnamnese();
  }, [user]);

  return (
    <div className="min-h-screen py-4 md:py-6">
      <div className="container max-w-6xl mx-auto">
        {/* Hero Section - Simplified (Req 6.3, 6.4) */}
        <div className="text-center mb-8 md:mb-12 animate-fade-in">
          <div className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-4 md:mb-6">
            <img 
              src="/logo-full.png" 
              alt="Templo Xamânico Consciência Divinal" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-medium text-foreground mb-3 md:mb-4">
            Bem-vindo ao Portal
          </h1>
          <p className="text-base md:text-lg text-muted-foreground font-body max-w-xl mx-auto">
            Este é seu espaço sagrado para acompanhar sua jornada com as medicinas ancestrais.
          </p>
        </div>

        {/* Anamnese Alert - Conditional (Req 7.1, 7.2, 7.3, 7.4) */}
        {hasAnamnese === false && (
          <Card className="mb-8 border-primary/30 bg-primary/5">
            <CardContent className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 md:p-6">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 md:hidden">
                  <h3 className="font-display text-lg font-medium text-foreground">
                    Complete sua Ficha
                  </h3>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="hidden md:block font-display text-lg font-medium text-foreground mb-1">
                  Complete sua Ficha de Anamnese
                </h3>
                <p className="text-sm text-muted-foreground font-body">
                  Para participar das cerimônias, você precisa preencher sua ficha de saúde.
                </p>
              </div>

              <Button onClick={() => navigate(ROUTES.ANAMNESE)} className="w-full md:w-auto flex-shrink-0">
                Preencher Agora
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Events Carousel Section */}
        {allEvents && allEvents.length > 0 && (
          <div className="mb-8">
            <SectionErrorBoundary sectionTitle="Próximos Eventos" sectionIcon={<Sparkles className="h-5 w-5" />}>
              <EventsCarousel
                events={allEvents}
                isLoading={eventsLoading}
                error={eventsError}
              />
            </SectionErrorBoundary>
          </div>
        )}

        {/* Photo Carousel Section (Req 1.1, 1.2, 1.3, 1.4, 1.5) */}
        <div className="mb-8">
          <SectionErrorBoundary sectionTitle="Últimas Fotos" sectionIcon={<Camera className="h-5 w-5" />}>
            <PhotoCarousel
              photos={photos}
              isLoading={photosLoading}
              error={photosError}
            />
          </SectionErrorBoundary>
        </div>

        {/* Grid Layout - Responsive (Req 6.1, 6.2) */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Upcoming Ceremonies Section (Req 2) */}
          <div>
            <SectionErrorBoundary sectionTitle="Próximas Cerimônias" sectionIcon={<CalendarDays className="h-5 w-5" />}>
              <UpcomingCeremoniesSection
                ceremonies={ceremonies}
                isLoading={ceremoniesLoading}
                error={ceremoniesError}
                hasAnamnese={hasAnamnese ?? true}
              />
            </SectionErrorBoundary>
          </div>

          {/* My Inscriptions Section (Req 3) */}
          <div>
            <SectionErrorBoundary sectionTitle="Minhas Consagrações" sectionIcon={<BookOpen className="h-5 w-5" />}>
              <MyInscriptionsSection
                inscriptions={inscriptions}
                isLoading={inscriptionsLoading}
                error={inscriptionsError}
              />
            </SectionErrorBoundary>
          </div>

          {/* My Testimonials Section (Req 4) - Full width on desktop */}
          <div className="md:col-span-2">
            <SectionErrorBoundary sectionTitle="Minhas Partilhas" sectionIcon={<MessageSquare className="h-5 w-5" />}>
              <MyTestimonialsSection
                testimonials={testimonials}
                isLoading={testimonialsLoading}
                error={testimonialsError}
              />
            </SectionErrorBoundary>
          </div>
        </div>

        {/* Shop CTA */}
        <Card 
          className="mt-8 overflow-hidden cursor-pointer border-secondary/30 bg-gradient-to-r from-secondary/10 via-primary/5 to-secondary/10"
          onClick={() => navigate(ROUTES.LOJA)}
        >
          <CardContent className="flex flex-col sm:flex-row items-center gap-4 p-6">
            <div className="w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-7 h-7 text-secondary" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                🛍️ Conheça Nossa Loja
              </h3>
              <p className="text-sm text-muted-foreground">
                Artesanatos sagrados, acessórios e itens especiais para sua jornada espiritual.
              </p>
            </div>
            <Button className="flex-shrink-0">
              Visitar Loja
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Quote Section */}
        <div className="mt-12 text-center">
          <blockquote className="font-display text-xl md:text-2xl italic text-muted-foreground max-w-2xl mx-auto">
            "A medicina não cura, ela revela. O caminho da cura está dentro de você."
          </blockquote>
        </div>

        {/* Social Links */}
        <div className="mt-8 flex justify-center gap-4">
          <a
            href="https://www.instagram.com/temploxamaniconscienciadivinal"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
          >
            <Instagram className="w-5 h-5" />
            <span className="text-sm font-medium">Instagram</span>
          </a>
          <a
            href="https://wa.me/5511963497405"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500 text-white hover:opacity-90"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Index;

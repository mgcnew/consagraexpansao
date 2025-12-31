import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Play, Users } from 'lucide-react';
import { ROUTES } from '@/constants';

export const HeroSection = () => {
  const { t } = useTranslation();
  
  return (
    <section className="pt-28 pb-16 md:pt-36 md:pb-24 relative">
      {/* Background decorativo - apenas no desktop */}
      <div className="hidden md:block absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="hidden lg:block absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl opacity-50" />
      <div className="hidden lg:block absolute bottom-0 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl opacity-50" />
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 px-4 py-2 text-sm border-primary/30">
            <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
            {t('landing.hero.badge')}
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            {t('landing.hero.title')}{' '}
            <span className="text-primary md:text-transparent md:bg-clip-text md:bg-gradient-to-r md:from-primary md:to-amber-500">
              {t('landing.hero.titleHighlight')}
            </span>
            {' '}{t('landing.hero.titleEnd')}
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            {t('landing.hero.description')} <span className="text-foreground font-medium">{t('landing.hero.descriptionHighlight')}</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={ROUTES.AUTH + '?demo=true'}>
              <Button size="lg" className="gap-2 px-8">
                <Play className="h-4 w-4" />
                {t('landing.hero.cta')}
              </Button>
            </Link>
            <a href="#recursos">
              <Button size="lg" variant="outline" className="px-8">
                {t('landing.hero.ctaSecondary')}
              </Button>
            </a>
          </div>

          <div className="mt-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="flex -space-x-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center">
                  <Users className="h-3 w-3 text-primary" />
                </div>
              ))}
            </div>
            <span>{t('landing.hero.socialProof')}</span>
          </div>
        </div>
      </div>

      {/* Gradiente de transicao apenas no desktop */}
      <div className="hidden md:block absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-muted/50 to-transparent" />
    </section>
  );
};

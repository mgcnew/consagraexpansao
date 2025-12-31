import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Leaf, Sparkles, Clock, Shield, X } from 'lucide-react';
import { ROUTES } from '@/constants';

export const CTASection = memo(() => {
  const { t } = useTranslation();
  
  return (
    <section className="py-20 relative">
      {/* Background apenas no desktop */}
      <div className="hidden md:block absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/10 to-background" />
      <div className="hidden lg:block absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50" />
      <div className="hidden lg:block absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl opacity-50" />
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-2xl mx-auto text-center">
          <Leaf className="h-12 w-12 text-primary mx-auto mb-6" />
          <h2 className="text-2xl md:text-4xl font-bold mb-4">
            {t('landing.cta.title')}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            {t('landing.cta.description')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={ROUTES.AUTH + '?demo=true'}>
              <Button size="lg" className="gap-2 px-8">
                <Sparkles className="h-4 w-4" />
                {t('landing.cta.button')}
              </Button>
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>{t('landing.cta.setup')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>{t('landing.cta.noCard')}</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-primary" />
              <span>{t('landing.cta.cancel')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

CTASection.displayName = 'CTASection';

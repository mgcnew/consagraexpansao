import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { ROUTES } from '@/constants';

export const ConsagradoresSection = memo(() => {
  const { t } = useTranslation();
  
  return (
    <section className="py-12 bg-primary/5 border-y border-primary/10">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-xl md:text-2xl font-bold mb-2">
              {t('landing.consagradores.title')}
            </h2>
            <p className="text-muted-foreground">
              {t('landing.consagradores.description')}
            </p>
          </div>
          <Link to={ROUTES.BUSCAR_CASAS}>
            <Button size="lg" variant="outline" className="gap-2 whitespace-nowrap border-primary/30 hover:bg-primary/10">
              <Search className="h-4 w-4" />
              {t('landing.consagradores.cta')}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
});

ConsagradoresSection.displayName = 'ConsagradoresSection';

import { memo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { useInView } from '@/hooks/useInView';
import {
  Calendar,
  Users,
  ShoppingBag,
  BookOpen,
  CreditCard,
  BarChart3,
  Zap,
  ChevronRight,
  MessageSquareQuote,
  Image,
  Bell,
  Shield,
} from 'lucide-react';

const featureKeys = [
  { key: 'ceremonies', icon: Calendar },
  { key: 'anamnesis', icon: Users },
  { key: 'store', icon: ShoppingBag },
  { key: 'courses', icon: BookOpen },
  { key: 'payments', icon: CreditCard },
  { key: 'reports', icon: BarChart3 },
];

interface FeatureCardProps {
  featureKey: string;
  Icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick: () => void;
}

const FeatureCard = memo(({ featureKey, Icon, isActive, onClick }: FeatureCardProps) => {
  const { t } = useTranslation();
  
  return (
    <div
      className={`group p-5 rounded-xl border cursor-pointer ${
        isActive 
          ? 'bg-primary/5 border-primary/30 md:shadow-md' 
          : 'bg-card border-border/50 md:hover:border-primary/20 md:hover:bg-card/80'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          isActive ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
        }`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">{t(`landing.features.items.${featureKey}.title`)}</h3>
            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-150 ${
              isActive ? 'rotate-90' : ''
            }`} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {t(`landing.features.items.${featureKey}.description`)}
          </p>
          {isActive && (
            <Badge variant="secondary" className="mt-3 text-xs">
              {t(`landing.features.items.${featureKey}.highlight`)}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
});
FeatureCard.displayName = 'FeatureCard';

export const FeaturesSection = memo(() => {
  const { t } = useTranslation();
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const { ref, inView } = useInView({ threshold: 0.1 });

  const handleFeatureClick = useCallback((index: number) => {
    setActiveFeature(prev => prev === index ? null : index);
  }, []);

  return (
    <section 
      ref={ref}
      className={`py-20 md:bg-muted/30 relative transition-opacity duration-700 ${
        inView ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            <Zap className="h-4 w-4 mr-2 text-amber-500" />
            {t('landing.features.badge')}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('landing.features.title')}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t('landing.features.description')}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-4">
            {featureKeys.map((feature, index) => (
              <FeatureCard
                key={feature.key}
                featureKey={feature.key}
                Icon={feature.icon}
                isActive={activeFeature === index}
                onClick={() => handleFeatureClick(index)}
              />
            ))}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MessageSquareQuote className="h-4 w-4 text-primary" />
              <span>{t('landing.features.extras.testimonials')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-primary" />
              <span>{t('landing.features.extras.gallery')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <span>{t('landing.features.extras.notifications')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>{t('landing.features.extras.security')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:block absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
});

FeaturesSection.displayName = 'FeaturesSection';

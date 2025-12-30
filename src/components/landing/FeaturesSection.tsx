import { memo, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
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

// Features data
const features = [
  {
    icon: Calendar,
    title: 'Cerimônias',
    description: 'Agende, controle vagas e receba inscrições online com pagamento integrado.',
    highlight: 'Automatize suas inscrições'
  },
  {
    icon: Users,
    title: 'Anamnese Digital',
    description: 'Fichas completas dos consagradores, seguras e acessíveis a qualquer momento.',
    highlight: 'Dados sempre à mão'
  },
  {
    icon: ShoppingBag,
    title: 'Loja Virtual',
    description: 'Venda rapés, medicinas e artesanatos com checkout Pix e cartão.',
    highlight: 'Venda 24h por dia'
  },
  {
    icon: BookOpen,
    title: 'Cursos e Eventos',
    description: 'Formações e workshops com inscrições e pagamentos automatizados.',
    highlight: 'Escale seu conhecimento'
  },
  {
    icon: CreditCard,
    title: 'Pagamentos',
    description: 'Pix instantâneo e cartão de crédito. Dinheiro direto na sua conta.',
    highlight: 'Receba na hora'
  },
  {
    icon: BarChart3,
    title: 'Relatórios',
    description: 'Controle financeiro completo: receitas, despesas e fluxo de caixa.',
    highlight: 'Visão clara do negócio'
  },
];

// Feature Card component - sem sombras no mobile para melhor performance
const FeatureCard = memo(({ 
  feature, 
  isActive, 
  onClick 
}: { 
  feature: typeof features[0]; 
  isActive: boolean; 
  onClick: () => void;
}) => (
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
        <feature.icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold">{feature.title}</h3>
          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-150 ${
            isActive ? 'rotate-90' : ''
          }`} />
        </div>
        <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
        {isActive && (
          <Badge variant="secondary" className="mt-3 text-xs">
            {feature.highlight}
          </Badge>
        )}
      </div>
    </div>
  </div>
));
FeatureCard.displayName = 'FeatureCard';

export const FeaturesSection = memo(() => {
  const [activeFeature, setActiveFeature] = useState<number | null>(null);

  const handleFeatureClick = useCallback((index: number) => {
    setActiveFeature(prev => prev === index ? null : index);
  }, []);

  return (
    <section id="recursos" className="py-20 md:bg-muted/30 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            <Zap className="h-4 w-4 mr-2 text-amber-500" />
            Tudo em um só lugar
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simplifique sua gestão
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Ferramentas pensadas para o trabalho sagrado. Menos tempo no computador, mais tempo com sua comunidade.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                feature={feature}
                isActive={activeFeature === index}
                onClick={() => handleFeatureClick(index)}
              />
            ))}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MessageSquareQuote className="h-4 w-4 text-primary" />
              <span>Depoimentos</span>
            </div>
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-primary" />
              <span>Galeria de Fotos</span>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <span>Notificações</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Dados Seguros</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gradiente apenas no desktop */}
      <div className="hidden md:block absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
});

FeaturesSection.displayName = 'FeaturesSection';

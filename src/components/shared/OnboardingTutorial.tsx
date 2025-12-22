import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  FileText,
  Calendar,
  GraduationCap,
  BookOpen,
  MessageSquareQuote,
  ShoppingBag,
  Heart,
  Shield,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Leaf,
  Library,
  BarChart3,
  Users,
} from 'lucide-react';

interface TutorialSlide {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: string;
}

interface OnboardingTutorialProps {
  isAdmin?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

// Slides para Consagradores
const consagradorSlides: TutorialSlide[] = [
  {
    icon: <Sparkles className="w-16 h-16 text-primary" />,
    title: 'Bem-vindo ao Portal',
    description: 'Este é o seu espaço sagrado para acompanhar sua jornada de consagração. Vamos conhecer as principais funcionalidades.',
    highlight: 'Consciência Divinal',
  },
  {
    icon: <FileText className="w-16 h-16 text-blue-500" />,
    title: 'Sua Ficha de Anamnese',
    description: 'Preencha sua ficha de saúde para participar das cerimônias. É importante manter seus dados atualizados para sua segurança.',
    highlight: 'Obrigatório para cerimônias',
  },
  {
    icon: <Calendar className="w-16 h-16 text-green-500" />,
    title: 'Cerimônias',
    description: 'Veja as próximas cerimônias disponíveis, inscreva-se e acompanhe suas participações. Você receberá lembretes antes de cada evento.',
  },
  {
    icon: <GraduationCap className="w-16 h-16 text-purple-500" />,
    title: 'Cursos e Formações',
    description: 'Participe de cursos e formações para aprofundar seu conhecimento sobre as medicinas ancestrais.',
  },
  {
    icon: <Leaf className="w-16 h-16 text-emerald-500" />,
    title: 'Estudos e Biblioteca',
    description: 'Acesse materiais de estudo, artigos e a biblioteca digital com conteúdos sobre as medicinas sagradas.',
  },
  {
    icon: <MessageSquareQuote className="w-16 h-16 text-amber-500" />,
    title: 'Comunidade',
    description: 'Compartilhe suas experiências nas Partilhas, converse com outros consagradores e explore nossa Loja sagrada.',
  },
  {
    icon: <Heart className="w-16 h-16 text-red-500" />,
    title: 'Emergência',
    description: 'Em caso de necessidade, acesse rapidamente o botão de Emergência no menu para contato imediato com nossa equipe de suporte.',
    highlight: 'Sempre disponível',
  },
];

// Slides adicionais para Admin/Guardião
const adminSlides: TutorialSlide[] = [
  {
    icon: <Shield className="w-16 h-16 text-indigo-500" />,
    title: 'Painel Administrativo',
    description: 'Como guardião, você tem acesso ao painel admin para gerenciar cerimônias, cursos, consagradores e muito mais.',
  },
  {
    icon: <Users className="w-16 h-16 text-cyan-500" />,
    title: 'Gestão de Consagradores',
    description: 'Visualize fichas de anamnese, gerencie permissões, bloqueios e acompanhe o histórico de cada consagrador.',
  },
  {
    icon: <BarChart3 className="w-16 h-16 text-orange-500" />,
    title: 'Fluxo de Caixa',
    description: 'Controle financeiro completo com entradas, saídas, metas e relatórios para uma gestão transparente.',
  },
];

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  isAdmin = false,
  isOpen,
  onClose,
  onComplete,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Combinar slides baseado no tipo de usuário
  const slides = isAdmin ? [...consagradorSlides, ...adminSlides] : consagradorSlides;
  const totalSlides = slides.length;

  // Reset ao abrir
  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  if (!isOpen) return null;

  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === totalSlides - 1;

  return (
    <div className="fixed inset-0 z-[100] bg-background">
      {/* Header com botão de pular */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {currentSlide + 1} / {totalSlides}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          className="text-muted-foreground hover:text-foreground"
        >
          Pular
          <X className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Conteúdo do Slide */}
      <div className="h-full flex flex-col items-center justify-center px-6 pb-32">
        <div className="max-w-md w-full text-center space-y-6">
          {/* Ícone */}
          <div className="flex justify-center mb-8">
            <div className="p-6 rounded-full bg-muted/50">
              {slide.icon}
            </div>
          </div>

          {/* Título */}
          <h2 className="text-2xl font-bold text-foreground">
            {slide.title}
          </h2>

          {/* Highlight badge */}
          {slide.highlight && (
            <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
              {slide.highlight}
            </span>
          )}

          {/* Descrição */}
          <p className="text-muted-foreground leading-relaxed">
            {slide.description}
          </p>
        </div>
      </div>

      {/* Footer com navegação */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
        {/* Indicadores de progresso */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentSlide
                  ? "w-6 bg-primary"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
              aria-label={`Ir para slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Botões de navegação */}
        <div className="flex gap-3 max-w-md mx-auto">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1"
          >
            {isLastSlide ? 'Começar' : 'Próximo'}
            {!isLastSlide && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTutorial;

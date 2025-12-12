import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  ClipboardList, 
  Leaf, 
  MessageCircleHeart,
  ArrowRight,
  Heart
} from 'lucide-react';
import { ROUTES } from '@/constants';

const WELCOME_SHOWN_KEY = 'welcome_modal_shown';

const WelcomeModal: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Verificar se já mostrou o modal para este usuário
    const shownUsers = JSON.parse(localStorage.getItem(WELCOME_SHOWN_KEY) || '[]');
    
    if (!shownUsers.includes(user.id)) {
      // Aguardar um pouco para não aparecer imediatamente
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleClose = () => {
    if (!user) return;
    
    // Marcar como mostrado para este usuário
    const shownUsers = JSON.parse(localStorage.getItem(WELCOME_SHOWN_KEY) || '[]');
    if (!shownUsers.includes(user.id)) {
      shownUsers.push(user.id);
      localStorage.setItem(WELCOME_SHOWN_KEY, JSON.stringify(shownUsers));
    }
    
    setIsOpen(false);
  };

  const handleNavigate = (route: string) => {
    handleClose();
    navigate(route);
  };

  const steps = [
    {
      icon: Sparkles,
      title: 'Bem-vindo(a) à Consciência Divinal! ✨',
      content: (
        <div className="space-y-4 text-center">
          <p className="text-muted-foreground">
            É uma alegria imensa ter você conosco nesta jornada de autoconhecimento e cura.
          </p>
          <p className="text-muted-foreground">
            Este é um espaço sagrado de acolhimento, onde cada passo é dado com respeito 
            ao seu tempo e à sua história.
          </p>
          <div className="flex justify-center pt-2">
            <Heart className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
      ),
    },
    {
      icon: ClipboardList,
      title: 'Sua Ficha de Anamnese',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground text-center">
            Para que possamos te acolher da melhor forma, é muito importante que você 
            preencha sua <strong className="text-foreground">Ficha de Anamnese</strong>.
          </p>
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <p className="text-sm text-foreground">
              📋 A ficha nos ajuda a entender sua história, condições de saúde e 
              expectativas, garantindo uma experiência segura e personalizada para você.
            </p>
          </div>
          <Button 
            className="w-full" 
            onClick={() => handleNavigate(ROUTES.ANAMNESE)}
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Preencher Minha Ficha
          </Button>
        </div>
      ),
    },
    {
      icon: Leaf,
      title: 'Conheça as Medicinas',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground text-center">
            Antes de participar de uma cerimônia, recomendamos que você conheça 
            as <strong className="text-foreground">Medicinas Sagradas</strong> que trabalhamos.
          </p>
          <p className="text-muted-foreground text-center text-sm">
            Entender sobre cada medicina te ajudará a se preparar melhor e 
            aproveitar ao máximo sua experiência.
          </p>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => handleNavigate(ROUTES.MEDICINAS)}
          >
            <Leaf className="w-4 h-4 mr-2" />
            Conhecer as Medicinas
          </Button>
        </div>
      ),
    },
    {
      icon: MessageCircleHeart,
      title: 'Partilhas da Comunidade',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground text-center">
            Se você está com dúvidas ou receios, saiba que isso é completamente normal. 
          </p>
          <p className="text-muted-foreground text-center">
            Convidamos você a ler as <strong className="text-foreground">Partilhas</strong> de 
            outros participantes. São relatos reais de pessoas que passaram por experiências 
            transformadoras conosco.
          </p>
          <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/20">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              💛 Você não está sozinho(a) nessa jornada. Estamos aqui para te apoiar 
              em cada passo.
            </p>
          </div>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => handleNavigate(ROUTES.PARTILHAS)}
          >
            <MessageCircleHeart className="w-4 h-4 mr-2" />
            Ver Partilhas
          </Button>
        </div>
      ),
    },
  ];

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;
  const Icon = currentStep.icon;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl font-display text-center">
            {currentStep.title}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {currentStep.content}
        </div>

        {/* Indicadores de progresso */}
        <div className="flex justify-center gap-1.5 py-2">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === step 
                  ? 'bg-primary w-6' 
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-between">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep(s => s - 1)}>
              Voltar
            </Button>
          ) : (
            <div />
          )}
          
          {isLastStep ? (
            <Button onClick={handleClose}>
              Começar Jornada
              <Sparkles className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={() => setStep(s => s + 1)}>
              Próximo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;

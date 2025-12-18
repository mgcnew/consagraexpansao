import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HelpCircle, AlertTriangle, Info, CheckCircle2, BookOpen, X } from 'lucide-react';
import { PageHeader, PageContainer } from '@/components/shared';
import { APP_CONFIG } from '@/config/app';
import { Button } from '@/components/ui/button';

const FAQ: React.FC = () => {
  const location = useLocation();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Verificar se veio da inscrição
    if (location.state?.fromInscription) {
      setShowWelcome(true);
      // Limpar o state para não mostrar novamente se recarregar
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  const faqCategories = [
    {
      title: "Sobre a Preparação",
      icon: Info,
      items: [
        {
          question: "Como devo me preparar fisicamente (Dieta)?",
          answer: "Recomendamos uma dieta leve 3 dias antes da cerimônia. Evite carnes vermelhas, alimentos processados, excesso de sal/açúcar, álcool e drogas recreativas. No dia da cerimônia, faça refeições leves e jejum de sólidos 4 horas antes do início."
        },
        {
          question: "O que devo levar para a cerimônia?",
          answer: "Traga roupas confortáveis e claras (se possível), agasalho (pode fazer frio), garrafa de água, repelente, colchonete ou tapete de yoga (se não fornecido), cobertor e travesseiro. Um caderno para anotações também é recomendado."
        },
        {
          question: "Qual a vestimenta adequada?",
          answer: "Pedimos roupas confortáveis, discretas e preferencialmente claras. Evite roupas muito curtas, decotadas ou com estampas agressivas. O ambiente é sagrado e o conforto auxilia no processo."
        }
      ]
    },
    {
      title: "Sobre a Cerimônia",
      icon: HelpCircle,
      items: [
        {
          question: "Quanto tempo dura uma cerimônia?",
          answer: "As cerimônias geralmente duram entre 4 a 6 horas, podendo se estender dependendo da energia do grupo e do trabalho realizado. Recomendamos não ter compromissos logo após."
        },
        {
          question: "O que acontece se eu passar mal?",
          answer: "O mal-estar físico (vômito ou diarreia) é chamado de 'purga' e é considerado parte do processo de limpeza. Temos uma equipe de guardiões treinados para lhe dar suporte, levar ao banheiro e cuidar de você com todo carinho e segurança."
        },
        {
          question: "Posso levar acompanhante?",
          answer: "Sim, mas o acompanhante também deve participar da cerimônia e passar pelo mesmo processo de inscrição e anamnese. Não permitimos observadores que não consagrem a medicina, para manter a egrégora protegida."
        }
      ]
    },
    {
      title: "Segurança e Contraindicações",
      icon: AlertTriangle,
      items: [
        {
          question: "Quem NÃO pode consagrar Ayahuasca?",
          answer: "Pessoas com histórico de esquizofrenia, transtorno bipolar, surtos psicóticos ou que façam uso de medicamentos controlados (antidepressivos ISRS, inibidores da MAO) devem passar por uma avaliação rigorosa. É OBRIGATÓRIO informar todos os medicamentos na ficha de anamnese."
        },
        {
          question: "A Ayahuasca vicia?",
          answer: "Não. Estudos científicos e a tradição mostram que a Ayahuasca não causa dependência química. Pelo contrário, é frequentemente utilizada no tratamento de dependências de álcool e outras drogas."
        },
        {
          question: "É seguro?",
          answer: "Sim, quando realizada em ambiente controlado, com condutores experientes e respeito às contraindicações. Nossa equipe é treinada para oferecer suporte físico, emocional e espiritual durante todo o processo."
        }
      ]
    },
    {
      title: "Pós-Cerimônia (Integração)",
      icon: CheckCircle2,
      items: [
        {
          question: "Como é o retorno para casa?",
          answer: "Recomendamos que você descanse após a cerimônia. Evite dirigir imediatamente se ainda sentir efeitos. Alimente-se de forma leve e beba bastante água."
        },
        {
          question: "O que é a integração?",
          answer: "É o processo de trazer os ensinamentos da cerimônia para o seu dia a dia. Recomendamos anotar seus insights, meditar, estar em contato com a natureza e, se necessário, conversar com nossos terapeutas para ajudar a assimilar a experiência."
        }
      ]
    }
  ];

  return (
    <PageContainer maxWidth="lg">
        {showWelcome && (
          <Alert className="mb-8 border-primary/30 bg-primary/5 animate-fade-in">
            <BookOpen className="h-5 w-5 text-primary" />
            <AlertTitle className="text-primary font-display text-lg">
              Bem-vindo às Orientações! 📖
            </AlertTitle>
            <AlertDescription className="text-foreground/80 mt-2">
              Aqui você encontra todas as informações importantes para se preparar para a cerimônia. 
              Leia com atenção as orientações sobre dieta, o que levar, vestimenta e cuidados. 
              Uma boa preparação é fundamental para uma experiência transformadora e segura.
            </AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setShowWelcome(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </Alert>
        )}

        <PageHeader
          icon={HelpCircle}
          title="Perguntas Frequentes"
          description="Tire suas dúvidas sobre o uso das medicinas sagradas, preparação e cuidados. Sua segurança e bem-estar são nossa prioridade."
          centered
          className="mb-12"
        />

        <div className="space-y-8">
          {faqCategories.map((category, index) => (
            <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <category.icon className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="font-display text-xl text-foreground">
                    {category.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {category.items.map((item, itemIndex) => (
                    <AccordionItem key={itemIndex} value={`item-${index}-${itemIndex}`}>
                      <AccordionTrigger className="text-left font-medium text-foreground/90 hover:text-primary transition-colors">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center animate-fade-in" style={{ animationDelay: '600ms' }}>
          <p className="text-muted-foreground mb-4">
            Ainda tem dúvidas? Entre em contato conosco.
          </p>
          <a
            href={`https://wa.me/${APP_CONFIG.contacts.whatsappLider}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Falar no WhatsApp
          </a>
        </div>
    </PageContainer>
  );
};

export default FAQ;

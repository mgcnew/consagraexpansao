import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { MessageCircle } from 'lucide-react';

// FAQs data
const faqs = [
  {
    question: 'Preciso entender de tecnologia para usar?',
    answer: 'Não! O sistema foi pensado para ser simples e intuitivo. Se você sabe usar WhatsApp, consegue usar nossa plataforma. Além disso, oferecemos suporte humanizado para te ajudar sempre que precisar.'
  },
  {
    question: 'E se eu não gostar, posso cancelar?',
    answer: 'Claro! Você pode testar gratuitamente por 7 dias sem compromisso. Se não gostar, é só não continuar. Sem burocracia, sem perguntas.'
  },
  {
    question: 'Meus dados e dos consagradores estão seguros?',
    answer: 'Absolutamente. Usamos criptografia de ponta e servidores seguros. Seus dados são seus e nunca serão compartilhados com terceiros. Cumprimos todas as normas da LGPD.'
  },
  {
    question: 'Quanto tempo leva para configurar tudo?',
    answer: 'Em menos de 10 minutos você já pode criar sua primeira cerimônia. O sistema vem pré-configurado e você personaliza conforme sua necessidade.'
  },
  {
    question: 'Funciona no celular?',
    answer: 'Sim! O sistema é 100% responsivo e funciona perfeitamente em qualquer dispositivo. Você pode gerenciar sua casa de qualquer lugar.'
  },
  {
    question: 'E se eu precisar de ajuda?',
    answer: 'Nosso suporte é humanizado e rápido. Você pode nos chamar pelo WhatsApp a qualquer momento. Estamos aqui para ajudar sua casa a crescer.'
  },
];

const whatsappNumber = '5511999999999';
const whatsappMessage = encodeURIComponent('Olá! Tenho interesse em conhecer mais sobre a plataforma Consciência Divinal.');

export const FAQSection = memo(() => (
  <section id="duvidas" className="py-20 bg-muted/30">
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <Badge variant="outline" className="mb-4">
          <MessageCircle className="h-4 w-4 mr-2 text-primary" />
          Tire suas dúvidas
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Perguntas frequentes
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Respondemos as principais dúvidas para você decidir com tranquilidade.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-card border border-border/50 rounded-lg px-4 data-[state=open]:border-primary/30"
            >
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="font-medium">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-10 text-center">
          <p className="text-muted-foreground mb-4">Ainda tem dúvidas?</p>
          <a 
            href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Falar com a gente
            </Button>
          </a>
        </div>
      </div>
    </div>
  </section>
));

FAQSection.displayName = 'FAQSection';

import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { MessageCircle } from 'lucide-react';
import { FAQSchema } from '@/components/seo';

const faqKeys = ['tech', 'cancel', 'security', 'setup', 'mobile', 'help', 'payment', 'consagradores', 'migrate'];

const whatsappNumber = '5511999999999';
const whatsappMessage = encodeURIComponent('Ola! Tenho interesse em conhecer mais sobre a plataforma Consciencia Divinal.');

export const FAQSection = memo(() => {
  const { t } = useTranslation();
  
  // Gerar items para o schema
  const faqItems = useMemo(() => 
    faqKeys.map((key) => ({
      question: t(`landing.faq.items.${key}.question`),
      answer: t(`landing.faq.items.${key}.answer`),
    })),
    [t]
  );
  
  return (
    <section className="py-20 md:bg-muted/30">
      <FAQSchema items={faqItems} />
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            <MessageCircle className="h-4 w-4 mr-2 text-primary" />
            {t('landing.faq.badge')}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('landing.faq.title')}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t('landing.faq.description')}
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqKeys.map((key, index) => (
              <AccordionItem 
                key={key} 
                value={`item-${index}`}
                className="bg-card border border-border/50 rounded-lg px-4 data-[state=open]:border-primary/30"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  <span className="font-medium">{t(`landing.faq.items.${key}.question`)}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {t(`landing.faq.items.${key}.answer`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-10 text-center">
            <p className="text-muted-foreground mb-4">{t('landing.faq.stillQuestions')}</p>
            <a 
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                {t('landing.faq.talkToUs')}
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
});

FAQSection.displayName = 'FAQSection';

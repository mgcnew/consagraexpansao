import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';

const FAQ: React.FC = () => {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-medium text-foreground mb-2">
            FAQ & Orientações
          </h1>
          <p className="text-muted-foreground font-body">
            Esta funcionalidade será implementada na Fase 2.
          </p>
        </div>

        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle className="font-display">Em breve</CardTitle>
            <CardDescription>
              Aqui você encontrará respostas para as dúvidas mais frequentes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Em breve você terá acesso a orientações sobre:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
              <li>O que levar para a cerimônia</li>
              <li>Como se preparar</li>
              <li>A dieta recomendada</li>
              <li>O que esperar da experiência</li>
              <li>Quando NÃO participar</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FAQ;

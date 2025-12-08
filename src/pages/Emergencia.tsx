import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart } from 'lucide-react';

const Emergencia: React.FC = () => {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-medium text-foreground mb-2">
            Emergência Pós-Cerimônia
          </h1>
          <p className="text-muted-foreground font-body">
            Esta funcionalidade será implementada na Fase 3.
          </p>
        </div>

        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle className="font-display">Em breve</CardTitle>
            <CardDescription>
              Aqui você terá acesso a suporte pós-cerimônia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Em breve você terá acesso a:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
              <li>Técnicas de respiração</li>
              <li>Orientações de grounding</li>
              <li>Informações sobre o que é normal</li>
              <li>Contato direto com o facilitador</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Emergencia;

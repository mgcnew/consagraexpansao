import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Leaf,
  FileText,
  Calendar,
  Heart,
  HelpCircle,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

const Index: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasAnamnese, setHasAnamnese] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAnamnese = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('anamneses')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error) {
        setHasAnamnese(!!data);
      }
    };

    checkAnamnese();
  }, [user]);

  const features = [
    {
      icon: FileText,
      title: 'Ficha de Anamnese',
      description: 'Preencha sua ficha de saúde para participar das cerimônias.',
      path: '/anamnese',
      highlight: !hasAnamnese,
    },
    {
      icon: Calendar,
      title: 'Cerimônias',
      description: 'Veja as próximas cerimônias e faça sua inscrição.',
      path: '/cerimonias',
    },
    {
      icon: Leaf,
      title: 'Medicinas Sagradas',
      description: 'Conheça as medicinas utilizadas em nosso templo.',
      path: '/medicinas',
    },
    {
      icon: HelpCircle,
      title: 'FAQ & Orientações',
      description: 'Tire suas dúvidas e prepare-se para a experiência.',
      path: '/faq',
    },
    {
      icon: Heart,
      title: 'Emergência',
      description: 'Acesso rápido a suporte pós-cerimônia.',
      path: '/emergencia',
    },
  ];

  return (
    <div className="min-h-screen py-8 md:py-12 px-4">
      <div className="container max-w-4xl mx-auto">
        {/* Welcome Section */}
        <div className="text-center mb-8 md:mb-12 animate-fade-in">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 md:mb-6">
            <Leaf className="w-10 h-10 md:w-12 md:h-12 text-primary" />
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-medium text-foreground mb-3 md:mb-4">
            Bem-vindo ao Portal
          </h1>
          <p className="text-base md:text-lg text-muted-foreground font-body max-w-xl mx-auto">
            Este é seu espaço sagrado para acompanhar sua jornada com as medicinas ancestrais.
          </p>
        </div>

        {/* Alert if no anamnese */}
        {hasAnamnese === false && (
          <Card className="mb-8 border-primary/30 bg-primary/5 animate-fade-in-up">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg font-medium text-foreground">
                  Complete sua Ficha de Anamnese
                </h3>
                <p className="text-sm text-muted-foreground font-body">
                  Para participar das cerimônias, você precisa preencher sua ficha de saúde.
                </p>
              </div>
              <Button onClick={() => navigate('/anamnese')} className="flex-shrink-0">
                Preencher Agora
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Features Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {features.map((feature, index) => (
            <Card
              key={feature.path}
              className={`cursor-pointer transition-all duration-300 hover:shadow-md hover:border-primary/30 group animate-fade-in-up ${feature.highlight ? 'ring-2 ring-primary/30' : ''
                }`}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => navigate(feature.path)}
            >
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <feature.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1">
                  <CardTitle className="font-display text-lg font-medium group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </CardHeader>
              <CardContent>
                <CardDescription className="font-body">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quote Section */}
        <div className="mt-16 text-center animate-fade-in" style={{ animationDelay: '500ms' }}>
          <blockquote className="font-display text-xl md:text-2xl italic text-muted-foreground max-w-2xl mx-auto">
            "A medicina não cura, ela revela. O caminho da cura está dentro de você."
          </blockquote>
        </div>
      </div>
    </div>
  );
};

export default Index;

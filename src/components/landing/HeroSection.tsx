import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Play, Users } from 'lucide-react';
import { ROUTES } from '@/constants';

export const HeroSection = () => (
  <section className="pt-28 pb-16 md:pt-36 md:pb-24 relative overflow-hidden">
    {/* Background decorativo - gradiente simples, sem blur no mobile */}
    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
    <div className="hidden lg:block absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl opacity-50" />
    <div className="hidden lg:block absolute bottom-0 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl opacity-50" />
    
    <div className="container mx-auto px-4 relative">
      <div className="max-w-4xl mx-auto text-center">
        <Badge variant="outline" className="mb-6 px-4 py-2 text-sm border-primary/30">
          <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
          Vagas limitadas para novos cadastros
        </Badge>
        
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          Gerencie sua{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-500">
            Casa Xamânica
          </span>
          {' '}com sabedoria
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
          Plataforma completa para gestão de cerimônias, consagradores, loja virtual e muito mais. 
          Foque no que importa: <span className="text-foreground font-medium">a cura e expansão da consciência.</span>
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to={ROUTES.AUTH + '?demo=true'}>
            <Button size="lg" className="gap-2 px-8">
              <Play className="h-4 w-4" />
              Testar Grátis por 7 Dias
            </Button>
          </Link>
          <a href="#recursos">
            <Button size="lg" variant="outline" className="px-8">
              Conhecer Recursos
            </Button>
          </a>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="flex -space-x-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-amber-500/20 border-2 border-background flex items-center justify-center">
                <Users className="h-3 w-3 text-primary" />
              </div>
            ))}
          </div>
          <span>Casas já estão transformando seu trabalho</span>
        </div>
      </div>
    </div>

    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-muted/50 to-transparent" />
  </section>
);

import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Star, 
  CheckCircle, 
  Sparkles,
  ArrowRight,
  Building2
} from 'lucide-react';
import { ROUTES } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';

const ConviteCasa = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Buscar dados da casa
  const { data: house, isLoading, error } = useQuery({
    queryKey: ['house-invite', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('houses')
        .select('id, name, slug, description, logo_url, banner_url, city, state, rating_avg, rating_count, verified')
        .eq('slug', slug)
        .eq('active', true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Se já estiver logado, redireciona para a casa
  useEffect(() => {
    if (user && house) {
      navigate(`/casa/${house.slug}`);
    }
  }, [user, house, navigate]);

  const handleEntrar = () => {
    // Salva o slug no localStorage para vincular após login
    if (house) {
      localStorage.setItem('invite_house_slug', house.slug);
      navigate(ROUTES.AUTH);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-violet-50/30 to-background dark:from-background dark:via-violet-950/10 dark:to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-0 shadow-lg">
          <Skeleton className="aspect-[21/9] w-full" />
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !house) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-violet-50/30 to-background dark:from-background dark:via-violet-950/10 dark:to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
              <Building2 className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold">Casa não encontrada</h1>
            <p className="text-muted-foreground">
              O convite que você está tentando acessar não existe ou foi removido.
            </p>
            <Link to={ROUTES.LANDING}>
              <Button className="w-full">Voltar para início</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-violet-50/30 to-background dark:from-background dark:via-violet-950/10 dark:to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-0 shadow-xl overflow-hidden">
        {/* Banner */}
        <div className="aspect-[21/9] bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 relative overflow-hidden">
          {house.banner_url ? (
            <img
              src={house.banner_url}
              alt={house.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-400/20 to-purple-400/20 flex items-center justify-center">
                <Sparkles className="h-12 w-12 text-violet-400/60" />
              </div>
            </div>
          )}
          
          {/* Badge verificada */}
          {house.verified && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-emerald-500/90 hover:bg-emerald-600 backdrop-blur-sm border-0 gap-1.5 shadow-lg">
                <CheckCircle className="h-3 w-3" />
                Verificada
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-8 space-y-6">
          {/* Logo + Nome */}
          <div className="flex items-start gap-4">
            {house.logo_url ? (
              <img
                src={house.logo_url}
                alt={house.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-background shadow-lg shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center shrink-0 shadow-lg border-4 border-background">
                <Building2 className="h-10 w-10 text-violet-600 dark:text-violet-400" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-violet-500 shrink-0" />
                <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                  Você foi convidado
                </span>
              </div>
              <h1 className="text-3xl font-bold mb-2 break-words">{house.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="text-sm">
                  {house.city}{house.state ? `, ${house.state}` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Descrição */}
          {house.description && (
            <p className="text-muted-foreground leading-relaxed">
              {house.description}
            </p>
          )}

          {/* Rating */}
          {house.rating_count && house.rating_count > 0 && (
            <div className="flex items-center gap-2 pt-4 border-t border-border/50">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              <span className="font-semibold">
                {house.rating_avg?.toFixed(1) || '0.0'}
              </span>
              <span className="text-muted-foreground text-sm">
                • {house.rating_count} avaliações
              </span>
            </div>
          )}

          {/* CTA */}
          <div className="space-y-3 pt-4">
            <Button 
              onClick={handleEntrar}
              className="w-full h-12 text-base bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 gap-2"
            >
              Entrar na Casa
              <ArrowRight className="h-5 w-5" />
            </Button>
            
            <p className="text-center text-xs text-muted-foreground">
              Ao entrar, você terá acesso a cerimônias, estudos, galeria e muito mais
            </p>
          </div>

          {/* Link alternativo */}
          <div className="text-center pt-4 border-t border-border/50">
            <Link 
              to={ROUTES.LANDING}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Voltar para página inicial
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConviteCasa;

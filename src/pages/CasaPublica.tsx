import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useHouseFromUrl } from '@/contexts/HouseContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { SEOHead, LocalBusinessSchema, BreadcrumbSchema } from '@/components/seo';
import {
  ArrowLeft,
  MapPin,
  Star,
  Phone,
  Mail,
  Instagram,
  Calendar,
  Clock,
  Users,
  Building2,
  CheckCircle,
  Heart,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ROUTES } from '@/constants';

const PENDING_JOIN_HOUSE_KEY = 'pending_join_house';

const CasaPublica = () => {
  const { house, isLoading, error } = useHouseFromUrl();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Buscar próximas cerimônias (apenas visualização)
  const { data: cerimonias, isLoading: loadingCerimonias } = useQuery({
    queryKey: ['cerimonias-publicas', house?.id],
    queryFn: async () => {
      if (!house) return [];
      const { data, error } = await supabase
        .from('cerimonias')
        .select('id, nome, medicina_principal, data, horario, local, vagas, banner_url')
        .eq('house_id', house.id)
        .gte('data', new Date().toISOString().split('T')[0])
        .order('data', { ascending: true })
        .limit(3);
      if (error) throw error;
      return data;
    },
    enabled: !!house,
  });

  // Buscar depoimentos aprovados
  const { data: depoimentos } = useQuery({
    queryKey: ['depoimentos-publicos', house?.id],
    queryFn: async () => {
      if (!house) return [];
      const { data, error } = await supabase
        .from('depoimentos')
        .select('id, texto, created_at, profiles:user_id(full_name)')
        .eq('house_id', house.id)
        .eq('aprovado', true)
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
    enabled: !!house,
  });

  // Buscar fotos da galeria
  const { data: galeria } = useQuery({
    queryKey: ['galeria-publica', house?.id],
    queryFn: async () => {
      if (!house) return [];
      const { data, error } = await supabase
        .from('galeria')
        .select('id, url, titulo')
        .eq('house_id', house.id)
        .eq('tipo', 'foto')
        .order('created_at', { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
    enabled: !!house,
  });

  // Handler para participar da casa
  const handleJoinHouse = () => {
    if (house) {
      // Salvar dados da casa no localStorage para vincular após login
      localStorage.setItem(PENDING_JOIN_HOUSE_KEY, JSON.stringify({
        slug: house.slug,
        houseId: house.id,
        houseName: house.name,
      }));
      // Redirecionar para página de login do consagrador
      navigate(`/entrar?casa=${house.slug}`);
    }
  };

  // Se usuário já está logado, ir para o app
  const handleEnterApp = () => {
    navigate('/app');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-64 w-full" />
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-48 mb-8" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !house) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-4">
          <Building2 className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Casa não encontrada</h1>
          <p className="text-muted-foreground mb-4">
            {error || 'A casa que você está procurando não existe ou não está disponível.'}
          </p>
          <Button onClick={() => navigate(ROUTES.BUSCAR_CASAS)}>
            Buscar outras casas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* SEO */}
      <SEOHead
        title={house.name}
        description={house.description || `${house.name} - Casa de consagracao em ${house.city}, ${house.state}. Participe de cerimonias sagradas e expanda sua consciencia.`}
        image={house.banner_url || house.logo_url || undefined}
        url={`/casa/${house.slug}`}
      />
      <BreadcrumbSchema items={[
        { name: 'Inicio', url: '/' },
        { name: 'Buscar Casas', url: '/buscar-casas' },
        { name: house.name, url: `/casa/${house.slug}` },
      ]} />
      {house.lat && house.lng && (
        <LocalBusinessSchema
          name={house.name}
          description={house.description || undefined}
          url={`${window.location.origin}/casa/${house.slug}`}
          image={house.banner_url || house.logo_url || undefined}
          address={{
            street: house.address || undefined,
            city: house.city || undefined,
            state: house.state || undefined,
            postalCode: house.cep || undefined,
          }}
          geo={{
            latitude: Number(house.lat),
            longitude: Number(house.lng),
          }}
          telephone={house.whatsapp || house.phone || undefined}
        />
      )}
      
      {/* Header com banner */}
      <div className="relative">
        {/* Banner */}
        <div className="h-56 md:h-72 bg-muted">
          {house.banner_url ? (
            <img
              src={house.banner_url}
              alt={house.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-amber-500/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        {/* Navegação */}
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <Button variant="secondary" size="icon" onClick={() => navigate(ROUTES.BUSCAR_CASAS)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        {/* Info da casa */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
          <div className="container mx-auto flex items-end gap-4">
            {/* Logo */}
            {house.logo_url ? (
              <img
                src={house.logo_url}
                alt=""
                className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover border-4 border-background shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-primary/10 border-4 border-background shadow-xl flex items-center justify-center">
                <Building2 className="h-12 w-12 text-primary" />
              </div>
            )}

            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {house.name}
                </h1>
                {house.verified && (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Verificada
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-muted-foreground mt-1 flex-wrap">
                {(house.city || house.state) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {house.city}{house.state ? `, ${house.state}` : ''}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {house.rating_avg?.toFixed(1) || '0.0'}
                  <span className="text-sm">({house.rating_count || 0})</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="container mx-auto px-4 py-6 space-y-8">
        
        {/* CTA Principal */}
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-amber-500/5">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h2 className="text-xl font-semibold mb-1">Quer participar das cerimônias?</h2>
                <p className="text-muted-foreground text-sm">
                  Entre para se inscrever e fazer parte desta comunidade
                </p>
              </div>
              {user ? (
                <Button size="lg" onClick={handleEnterApp} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Acessar Minha Área
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  onClick={handleJoinHouse}
                  className="gap-2 bg-gradient-to-r from-primary to-amber-600 hover:from-primary/90 hover:to-amber-600/90"
                >
                  <Heart className="h-4 w-4" />
                  Quero Participar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sobre a casa */}
        {(house.description || house.about) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Quem Somos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                {house.about || house.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Próximas Cerimônias */}
        <section>
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            Próximas Cerimônias
          </h2>

          {loadingCerimonias ? (
            <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : cerimonias && cerimonias.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-4">
              {cerimonias.map((cerimonia) => (
                <Card key={cerimonia.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {cerimonia.banner_url && (
                    <img
                      src={cerimonia.banner_url}
                      alt=""
                      className="h-32 w-full object-cover"
                    />
                  )}
                  <CardContent className={cerimonia.banner_url ? 'pt-4' : 'pt-6'}>
                    <h3 className="font-semibold mb-2">
                      {cerimonia.nome || cerimonia.medicina_principal || 'Cerimônia'}
                    </h3>
                    <div className="space-y-1.5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        {format(new Date(cerimonia.data), "dd 'de' MMMM, EEEE", { locale: ptBR })}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        {cerimonia.horario}
                      </div>
                      {cerimonia.vagas && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          {cerimonia.vagas} vagas disponíveis
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p>Nenhuma cerimônia agendada no momento.</p>
                <p className="text-sm mt-1">Entre para ser notificado quando houver novas datas.</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Galeria de fotos */}
        {galeria && galeria.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              Galeria
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {galeria.map((foto) => (
                <div key={foto.id} className="aspect-square rounded-lg overflow-hidden">
                  <img
                    src={foto.url}
                    alt={foto.titulo || ''}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Depoimentos */}
        {depoimentos && depoimentos.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <MessageCircle className="h-5 w-5 text-primary" />
              O que dizem sobre nós
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {depoimentos.map((depoimento: any) => (
                <Card key={depoimento.id}>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground italic line-clamp-4">
                      "{depoimento.texto}"
                    </p>
                    <p className="mt-3 text-sm font-medium">
                      — {depoimento.profiles?.full_name || 'Consagrador'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Contatos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {house.whatsapp && (
                <a 
                  href={`https://wa.me/${house.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="gap-2">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Button>
                </a>
              )}
              {house.phone && (
                <a href={`tel:${house.phone}`}>
                  <Button variant="outline" className="gap-2">
                    <Phone className="h-4 w-4" />
                    {house.phone}
                  </Button>
                </a>
              )}
              {house.email && (
                <a href={`mailto:${house.email}`}>
                  <Button variant="outline" className="gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                </a>
              )}
              {house.instagram && (
                <a 
                  href={`https://instagram.com/${house.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="gap-2">
                    <Instagram className="h-4 w-4" />
                    {house.instagram}
                  </Button>
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {/* CTA Final */}
        {!user && (
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold mb-2">Pronto para começar sua jornada?</h2>
            <p className="text-muted-foreground mb-6">
              Entre com sua conta Google e faça parte desta comunidade
            </p>
            <Button 
              size="lg" 
              onClick={handleJoinHouse}
              className="gap-2 bg-gradient-to-r from-primary to-amber-600 hover:from-primary/90 hover:to-amber-600/90"
            >
              <Heart className="h-5 w-5" />
              Quero Participar
            </Button>
          </div>
        )}
      </div>

      {/* Footer simples */}
      <footer className="border-t py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Plataforma Ahoo</p>
        </div>
      </footer>
    </div>
  );
};

export default CasaPublica;

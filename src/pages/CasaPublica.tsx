import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useHouseFromUrl } from '@/contexts/HouseContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  MapPin,
  Star,
  Phone,
  Mail,
  Globe,
  Instagram,
  Calendar,
  ShoppingBag,
  BookOpen,
  Image,
  HelpCircle,
  Info,
  Building2,
  CheckCircle,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { ROUTES, getHouseRoute } from '@/constants';

const PENDING_JOIN_HOUSE_KEY = 'pending_join_house';

const CasaPublica = () => {
  const { house, isLoading, error } = useHouseFromUrl();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Determinar tab ativa baseado na URL
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/cerimonias')) return 'cerimonias';
    if (path.includes('/loja')) return 'loja';
    if (path.includes('/cursos')) return 'cursos';
    if (path.includes('/materiais')) return 'materiais';
    if (path.includes('/galeria')) return 'galeria';
    if (path.includes('/faq')) return 'faq';
    if (path.includes('/sobre')) return 'sobre';
    return 'inicio';
  };

  // Handler para participar da casa
  const handleJoinHouse = () => {
    if (house) {
      // Salvar slug da casa no localStorage para vincular após login
      localStorage.setItem(PENDING_JOIN_HOUSE_KEY, JSON.stringify({
        slug: house.slug,
        houseId: house.id,
        houseName: house.name,
      }));
      // Redirecionar para auth com parâmetro indicando que veio de uma casa
      navigate(`${ROUTES.AUTH}?join=${house.slug}`);
    }
  };

  // Se usuário já está logado, redirecionar para o app
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
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (error || !house) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Casa não encontrada</h1>
          <p className="text-muted-foreground mb-4">
            {error || 'A casa que você está procurando não existe ou não está disponível.'}
          </p>
          <Link to={ROUTES.BUSCAR_CASAS}>
            <Button>Buscar outras casas</Button>
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'inicio', label: 'Início', path: '', icon: Info },
    { id: 'cerimonias', label: 'Cerimônias', path: '/cerimonias', icon: Calendar },
    { id: 'loja', label: 'Loja', path: '/loja', icon: ShoppingBag },
    { id: 'cursos', label: 'Cursos', path: '/cursos', icon: BookOpen },
    { id: 'galeria', label: 'Galeria', path: '/galeria', icon: Image },
    { id: 'faq', label: 'FAQ', path: '/faq', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header com banner */}
      <div className="relative">
        {/* Banner */}
        <div className="h-48 md:h-64 bg-muted">
          {house.banner_url ? (
            <img
              src={house.banner_url}
              alt={house.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>

        {/* Navegação */}
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <Link to={ROUTES.BUSCAR_CASAS}>
            <Button variant="secondary" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex gap-2">
            {user ? (
              <Button variant="secondary" onClick={handleEnterApp}>
                <LogIn className="h-4 w-4 mr-2" />
                Ir para o App
              </Button>
            ) : (
              <>
                <Button variant="outline" className="bg-background/80" onClick={() => navigate(ROUTES.AUTH)}>
                  <LogIn className="h-4 w-4 mr-2" />
                  Entrar
                </Button>
                <Button onClick={handleJoinHouse}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Participar
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Info da casa */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
          <div className="container mx-auto flex items-end gap-4">
            {/* Logo */}
            {house.logo_url ? (
              <img
                src={house.logo_url}
                alt=""
                className="w-20 h-20 md:w-24 md:h-24 rounded-xl object-cover border-4 border-background shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-primary/10 border-4 border-background shadow-lg flex items-center justify-center">
                <Building2 className="h-10 w-10 text-primary" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground truncate">
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

      {/* Contatos rápidos */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4 overflow-x-auto">
            {house.phone && (
              <a href={`tel:${house.phone}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground whitespace-nowrap">
                <Phone className="h-4 w-4" />
                {house.phone}
              </a>
            )}
            {house.email && (
              <a href={`mailto:${house.email}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground whitespace-nowrap">
                <Mail className="h-4 w-4" />
                {house.email}
              </a>
            )}
            {house.website && (
              <a href={house.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground whitespace-nowrap">
                <Globe className="h-4 w-4" />
                Site
              </a>
            )}
            {house.instagram && (
              <a href={`https://instagram.com/${house.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground whitespace-nowrap">
                <Instagram className="h-4 w-4" />
                {house.instagram}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tabs de navegação */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <Tabs value={getActiveTab()} className="w-full">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent overflow-x-auto">
              {tabs.map((tab) => (
                <Link key={tab.id} to={getHouseRoute(house.slug, tab.path)}>
                  <TabsTrigger
                    value={tab.id}
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3"
                  >
                    <tab.icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </TabsTrigger>
                </Link>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="container mx-auto px-4 py-6">
        <Outlet />
      </div>
    </div>
  );
};

export default CasaPublica;

import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { 
  Search, 
  MapPin, 
  Star, 
  ArrowLeft,
  Building2,
  Map,
  List,
  Loader2,
  Navigation,
  X,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ROUTES, getHouseRoute } from '@/constants';
import { HousesMap } from '@/components/map/HousesMap';
import { geocodeByCep, geocodeByCityState, calculateDistance, getCurrentLocation } from '@/lib/geocoding';
import { toast } from 'sonner';
import { ModeToggle } from '@/components/mode-toggle';

const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

interface House {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  city: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
  rating_avg: number | null;
  rating_count: number | null;
  verified: boolean | null;
}

interface HouseWithDistance extends House {
  distance_km?: number;
}


// Componente do Card da Casa - compacto e elegante
const HouseCard = ({ house }: { house: HouseWithDistance }) => (
  <Link to={getHouseRoute(house.slug)}>
    <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer h-full group bg-card">
      <div className="flex gap-3 p-3">
        {/* Imagem/Logo compacta */}
        <div className="relative shrink-0">
          {house.banner_url ? (
            <img
              src={house.banner_url}
              alt={house.name}
              className="w-20 h-20 rounded-lg object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : house.logo_url ? (
            <img
              src={house.logo_url}
              alt={house.name}
              className="w-20 h-20 rounded-lg object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-violet-500/60" />
            </div>
          )}
          {house.verified && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
              <CheckCircle className="h-3 w-3 text-white" />
            </div>
          )}
        </div>

        {/* Conteudo */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
              {house.name}
            </h3>
            <div className="flex items-center gap-1 text-muted-foreground text-xs mt-0.5">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {house.city}{house.state ? `, ${house.state}` : ''}
              </span>
            </div>
            {house.description && (
              <p className="text-xs text-muted-foreground/70 line-clamp-1 mt-1">
                {house.description}
              </p>
            )}
          </div>

          {/* Footer com rating e distancia */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="font-medium text-xs">
                {house.rating_avg?.toFixed(1) || '0.0'}
              </span>
              <span className="text-muted-foreground/50 text-xs">
                ({house.rating_count || 0})
              </span>
            </div>
            {house.distance_km !== undefined && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-muted/50">
                {house.distance_km < 1 
                  ? `${(house.distance_km * 1000).toFixed(0)}m`
                  : `${house.distance_km.toFixed(0)}km`
                }
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  </Link>
);


const BuscarCasas = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  // Busca por localização
  const [locationSearch, setLocationSearch] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(50);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Buscar casas públicas
  const { data: houses, isLoading } = useQuery({
    queryKey: ['houses', 'public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('houses')
        .select('id, name, slug, description, logo_url, banner_url, city, state, lat, lng, rating_avg, rating_count, verified')
        .eq('visibility', 'public')
        .eq('active', true)
        .order('rating_avg', { ascending: false });

      if (error) throw error;
      return data as House[];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Calcular distâncias e filtrar
  const housesWithDistance = useMemo(() => {
    if (!houses) return [];

    let result: HouseWithDistance[] = houses.map(house => {
      if (userLocation && house.lat && house.lng) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          house.lat,
          house.lng
        );
        return { ...house, distance_km: distance };
      }
      return house;
    });

    // Filtrar por estado
    if (selectedState && selectedState !== 'todos') {
      result = result.filter(h => h.state === selectedState);
    }

    // Filtrar por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(h => 
        h.name.toLowerCase().includes(term) ||
        h.city?.toLowerCase().includes(term) ||
        h.description?.toLowerCase().includes(term)
      );
    }

    // Filtrar por raio se tiver localização
    if (userLocation && searchRadius < 500) {
      result = result.filter(h => {
        if (!h.distance_km) return false;
        return h.distance_km <= searchRadius;
      });
    }

    // Ordenar por distância se tiver localização
    if (userLocation) {
      result.sort((a, b) => {
        if (!a.distance_km) return 1;
        if (!b.distance_km) return -1;
        return a.distance_km - b.distance_km;
      });
    }

    return result;
  }, [houses, userLocation, selectedState, searchTerm, searchRadius]);


  // Buscar localização por CEP ou cidade
  const handleLocationSearch = async () => {
    if (!locationSearch.trim()) return;

    setIsLoadingLocation(true);
    try {
      const cleanInput = locationSearch.trim();
      let result = null;

      const cepMatch = cleanInput.replace(/\D/g, '');
      if (cepMatch.length === 8) {
        result = await geocodeByCep(cepMatch);
      } else {
        result = await geocodeByCityState(cleanInput, '');
      }

      if (result) {
        setUserLocation({ lat: result.lat, lng: result.lng });
        toast.success('Localização encontrada!', {
          description: `Mostrando casas próximas a ${result.display_name.split(',')[0]}`,
        });
      } else {
        toast.error('Localização não encontrada', {
          description: 'Tente um CEP válido ou nome de cidade.',
        });
      }
    } catch (error) {
      toast.error('Erro ao buscar localização');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Usar GPS do dispositivo
  const handleUseGPS = async () => {
    setIsLoadingLocation(true);
    try {
      const location = await getCurrentLocation();
      if (location) {
        setUserLocation(location);
        setLocationSearch('');
        toast.success('Localização obtida via GPS!');
      } else {
        toast.error('Não foi possível obter sua localização', {
          description: 'Verifique as permissões do navegador.',
        });
      }
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleClearLocation = () => {
    setUserLocation(null);
    setLocationSearch('');
  };

  const handleHouseClick = (house: HouseWithDistance) => {
    navigate(getHouseRoute(house.slug));
  };

  // Label do slider de distância
  const getDistanceLabel = (value: number) => {
    if (value >= 500) return 'Qualquer distância';
    return `${value} km`;
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-violet-50/30 to-background dark:from-background dark:via-violet-950/10 dark:to-background">
      {/* Header minimalista */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to={ROUTES.LANDING}>
            <Button variant="ghost" size="icon" className="shrink-0 hover:bg-violet-100 dark:hover:bg-violet-900/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold truncate">Encontrar Casas</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Descubra espaços de medicina sagrada</p>
            </div>
          </div>
          
          <div className="ml-auto flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'map')} className="hidden sm:block">
              <TabsList className="h-9 bg-muted/50">
                <TabsTrigger value="list" className="px-4 data-[state=active]:bg-background">
                  <List className="h-4 w-4 mr-2" />
                  Lista
                </TabsTrigger>
                <TabsTrigger value="map" className="px-4 data-[state=active]:bg-background">
                  <Map className="h-4 w-4 mr-2" />
                  Mapa
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <ModeToggle />
            <Link to={ROUTES.AUTH} className="hidden md:block">
              <Button size="sm" className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                Entrar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-6 max-w-7xl">
        {/* Busca por localização - redesenhada */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-background to-violet-50/50 dark:to-violet-950/20">
          <CardContent className="pt-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <span className="font-semibold text-base">Buscar por localização</span>
                <p className="text-xs text-muted-foreground">Encontre casas próximas a você</p>
              </div>
              {userLocation && (
                <Badge className="gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-500/20">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Ativa
                </Badge>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Digite CEP ou cidade..."
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch()}
                  disabled={isLoadingLocation}
                  className="h-11 pr-10 border-border/50 focus-visible:ring-violet-500"
                />
                {userLocation && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-muted"
                    onClick={handleClearLocation}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button 
                onClick={handleLocationSearch} 
                disabled={isLoadingLocation || !locationSearch.trim()}
                className="h-11 px-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              >
                {isLoadingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Buscar
              </Button>
              <Button 
                variant="outline" 
                onClick={handleUseGPS}
                disabled={isLoadingLocation}
                className="h-11 px-6 border-border/50 hover:bg-violet-50 dark:hover:bg-violet-950/20"
                title="Usar minha localização"
              >
                <Navigation className="h-4 w-4 mr-2" />
                GPS
              </Button>
            </div>

            {/* Slider de distância */}
            {userLocation && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Raio de busca</span>
                  <span className="font-semibold text-sm text-violet-600 dark:text-violet-400">
                    {getDistanceLabel(searchRadius)}
                  </span>
                </div>
                <Slider
                  value={[searchRadius]}
                  onValueChange={(v) => setSearchRadius(v[0])}
                  min={5}
                  max={500}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground/60">
                  <span>5 km</span>
                  <span>100 km</span>
                  <span>250 km</span>
                  <span>Todos</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>


        {/* Filtros adicionais - minimalistas */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              placeholder="Buscar por nome ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 border-border/50 focus-visible:ring-violet-500"
            />
          </div>
          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger className="w-full sm:w-48 h-11 border-border/50">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os estados</SelectItem>
              {ESTADOS_BRASIL.map((estado) => (
                <SelectItem key={estado} value={estado}>
                  {estado}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Resultados */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="overflow-hidden border-0 shadow-sm">
                <div className="flex gap-3 p-3">
                  <Skeleton className="w-20 h-20 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : viewMode === 'map' ? (
          <div className="h-[600px] rounded-2xl overflow-hidden border-0 shadow-lg">
            <HousesMap
              houses={housesWithDistance}
              userLocation={userLocation}
              onHouseClick={handleHouseClick}
            />
          </div>
        ) : housesWithDistance.length > 0 ? (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
              <span>
                {housesWithDistance.length} casa{housesWithDistance.length !== 1 ? 's' : ''} encontrada{housesWithDistance.length !== 1 ? 's' : ''}
                {userLocation && ' • ordenadas por proximidade'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {housesWithDistance.map((house) => (
                <HouseCard key={house.id} house={house} />
              ))}
            </div>
          </>
        ) : (
          <Card className="py-20 border-0 shadow-sm bg-gradient-to-br from-background to-muted/20">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-10 w-10 text-violet-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Nenhuma casa encontrada</h2>
              <p className="text-muted-foreground text-sm mb-8 max-w-md mx-auto leading-relaxed">
                {userLocation 
                  ? `Não encontramos casas em um raio de ${searchRadius} km. Tente aumentar a distância de busca.`
                  : 'Tente ajustar os filtros ou buscar por outro termo.'}
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                {userLocation && searchRadius < 500 && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchRadius(500)}
                    className="border-border/50 hover:bg-violet-50 dark:hover:bg-violet-950/20"
                  >
                    Buscar em qualquer distância
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedState('todos');
                    handleClearLocation();
                  }}
                  className="border-border/50 hover:bg-violet-50 dark:hover:bg-violet-950/20"
                >
                  Limpar todos os filtros
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BuscarCasas;

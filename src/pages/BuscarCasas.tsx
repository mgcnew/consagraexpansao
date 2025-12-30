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
  Filter,
  Building2,
  Map,
  List,
  Loader2,
  Navigation,
  X,
  CheckCircle,
  Leaf
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


// Componente do Card da Casa - otimizado
const HouseCard = ({ house }: { house: HouseWithDistance }) => (
  <Link to={getHouseRoute(house.slug)}>
    <Card className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer h-full group">
      {/* Banner/Imagem */}
      <div className="aspect-[16/9] bg-muted relative overflow-hidden">
        {house.banner_url ? (
          <img
            src={house.banner_url}
            alt={house.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <Leaf className="h-12 w-12 text-primary/40 mb-2" />
            <span className="text-xs text-muted-foreground">Casa de Consagração</span>
          </div>
        )}
        
        {/* Badges no topo */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          <div className="flex gap-2">
            {house.verified && (
              <Badge className="bg-blue-500 hover:bg-blue-600 gap-1">
                <CheckCircle className="h-3 w-3" />
                Verificada
              </Badge>
            )}
          </div>
          {house.distance_km !== undefined && (
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
              <MapPin className="h-3 w-3 mr-1" />
              {house.distance_km < 1 
                ? `${(house.distance_km * 1000).toFixed(0)} m`
                : `${house.distance_km.toFixed(0)} km`
              }
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        {/* Logo + Nome */}
        <div className="flex items-start gap-3 mb-2">
          {house.logo_url ? (
            <img
              src={house.logo_url}
              alt=""
              className="w-10 h-10 rounded-full object-cover border-2 border-background shadow-sm shrink-0"
              loading="lazy"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
              {house.name}
            </h3>
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {house.city}{house.state ? `, ${house.state}` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Descrição */}
        {house.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {house.description}
          </p>
        )}

        {/* Rating */}
        <div className="flex items-center gap-1.5 pt-2 border-t">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span className="font-medium text-sm">
            {house.rating_avg?.toFixed(1) || '0.0'}
          </span>
          <span className="text-muted-foreground text-xs">
            ({house.rating_count || 0} avaliações)
          </span>
        </div>
      </CardContent>
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-20">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Link to={ROUTES.LANDING}>
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Leaf className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-lg font-semibold truncate">Encontrar Casas</h1>
          </div>
          
          <div className="ml-auto flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'map')}>
              <TabsList className="h-9">
                <TabsTrigger value="list" className="px-3">
                  <List className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="map" className="px-3">
                  <Map className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <ModeToggle />
            <Link to={ROUTES.AUTH} className="hidden sm:block">
              <Button size="sm">Entrar</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Busca por localização */}
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="font-medium">Buscar por localização</span>
              {userLocation && (
                <Badge variant="outline" className="ml-auto gap-1 text-green-600 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Ativa
                </Badge>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="CEP ou cidade..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch()}
                    disabled={isLoadingLocation}
                    className="pr-8"
                  />
                  {userLocation && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={handleClearLocation}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Button 
                  onClick={handleLocationSearch} 
                  disabled={isLoadingLocation || !locationSearch.trim()}
                  size="icon"
                >
                  {isLoadingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleUseGPS}
                  disabled={isLoadingLocation}
                  size="icon"
                  title="Usar minha localização"
                >
                  <Navigation className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Slider de distância estilo Facebook */}
            {userLocation && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Distância máxima</span>
                  <span className="font-medium text-primary">{getDistanceLabel(searchRadius)}</span>
                </div>
                <Slider
                  value={[searchRadius]}
                  onValueChange={(v) => setSearchRadius(v[0])}
                  min={5}
                  max={500}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5 km</span>
                  <span>100 km</span>
                  <span>250 km</span>
                  <span>Todos</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>


        {/* Filtros adicionais */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger className="w-full sm:w-44">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Estado" />
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[16/9] w-full" />
                <CardContent className="p-4 space-y-3">
                  <div className="flex gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : viewMode === 'map' ? (
          <div className="h-[500px] rounded-xl overflow-hidden border">
            <HousesMap
              houses={housesWithDistance}
              userLocation={userLocation}
              onHouseClick={handleHouseClick}
            />
          </div>
        ) : housesWithDistance.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground">
              {housesWithDistance.length} casa{housesWithDistance.length !== 1 ? 's' : ''} encontrada{housesWithDistance.length !== 1 ? 's' : ''}
              {userLocation && ' • ordenadas por proximidade'}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {housesWithDistance.map((house) => (
                <HouseCard key={house.id} house={house} />
              ))}
            </div>
          </>
        ) : (
          <Card className="py-16">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Nenhuma casa encontrada</h2>
              <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                {userLocation 
                  ? `Não encontramos casas em um raio de ${searchRadius} km. Tente aumentar a distância.`
                  : 'Tente ajustar os filtros ou buscar por outro termo.'
                }
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
                {userLocation && searchRadius < 500 && (
                  <Button variant="outline" size="sm" onClick={() => setSearchRadius(500)}>
                    Buscar em qualquer distância
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => {
                  setSearchTerm('');
                  setSelectedState('todos');
                  handleClearLocation();
                }}>
                  Limpar filtros
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

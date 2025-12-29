import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  X
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

const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const RAIOS_BUSCA = [
  { value: '25', label: '25 km' },
  { value: '50', label: '50 km' },
  { value: '100', label: '100 km' },
  { value: '200', label: '200 km' },
  { value: '500', label: '500 km' },
  { value: 'all', label: 'Qualquer distância' },
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

const BuscarCasas = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  // Busca por localização
  const [locationSearch, setLocationSearch] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState<string>('100');
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
    if (userLocation && searchRadius !== 'all') {
      const maxDistance = parseInt(searchRadius);
      result = result.filter(h => {
        if (!h.distance_km) return false;
        return h.distance_km <= maxDistance;
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

      // Verificar se é CEP (8 dígitos)
      const cepMatch = cleanInput.replace(/\D/g, '');
      if (cepMatch.length === 8) {
        result = await geocodeByCep(cepMatch);
      } else {
        // Tentar como cidade/estado
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

  // Limpar localização
  const handleClearLocation = () => {
    setUserLocation(null);
    setLocationSearch('');
  };

  const handleHouseClick = (house: HouseWithDistance) => {
    navigate(getHouseRoute(house.slug));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to={ROUTES.LANDING}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Encontrar Casas</h1>
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
            <Link to={ROUTES.AUTH}>
              <Button variant="outline" size="sm">Entrar</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Busca por localização */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="font-medium">Buscar casas próximas a você</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Digite seu CEP ou cidade..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch()}
                    disabled={isLoadingLocation}
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
                >
                  {isLoadingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleUseGPS}
                  disabled={isLoadingLocation}
                  className="gap-2"
                >
                  <Navigation className="h-4 w-4" />
                  <span className="hidden sm:inline">Usar GPS</span>
                </Button>
                
                <Select value={searchRadius} onValueChange={setSearchRadius}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RAIOS_BUSCA.map((raio) => (
                      <SelectItem key={raio.value} value={raio.value}>
                        {raio.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {userLocation && (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  Localização ativa
                </Badge>
                <span>Mostrando casas em até {searchRadius === 'all' ? 'qualquer distância' : `${searchRadius} km`}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filtros adicionais */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger className="w-full md:w-48">
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full rounded-t-lg" />
                <CardContent className="pt-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : viewMode === 'map' ? (
          /* Visualização em Mapa */
          <div className="h-[600px] rounded-lg overflow-hidden border">
            <HousesMap
              houses={housesWithDistance}
              userLocation={userLocation}
              onHouseClick={handleHouseClick}
            />
          </div>
        ) : housesWithDistance.length > 0 ? (
          /* Visualização em Lista */
          <>
            <p className="text-muted-foreground mb-4">
              {housesWithDistance.length} casa{housesWithDistance.length !== 1 ? 's' : ''} encontrada{housesWithDistance.length !== 1 ? 's' : ''}
              {userLocation && ' ordenadas por proximidade'}
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {housesWithDistance.map((house) => (
                <Link key={house.id} to={getHouseRoute(house.slug)}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                    {/* Banner */}
                    <div className="h-48 bg-muted relative">
                      {house.banner_url ? (
                        <img
                          src={house.banner_url}
                          alt={house.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="h-16 w-16 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-2">
                        {house.verified && (
                          <Badge variant="secondary">
                            Verificada
                          </Badge>
                        )}
                        {house.distance_km && (
                          <Badge className="bg-primary/90">
                            {house.distance_km < 1 
                              ? `${(house.distance_km * 1000).toFixed(0)} m`
                              : `${house.distance_km.toFixed(1)} km`
                            }
                          </Badge>
                        )}
                      </div>
                    </div>

                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg line-clamp-1">
                            {house.name}
                          </h3>
                          <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {house.city}{house.state ? `, ${house.state}` : ''}
                            </span>
                          </div>
                        </div>
                        {house.logo_url && (
                          <img
                            src={house.logo_url}
                            alt=""
                            className="w-12 h-12 rounded-full object-cover border"
                          />
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="pb-2">
                      {house.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {house.description}
                        </p>
                      )}
                    </CardContent>

                    <CardFooter className="pt-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">
                          {house.rating_avg?.toFixed(1) || '0.0'}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          ({house.rating_count || 0} avaliações)
                        </span>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <Building2 className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhuma casa encontrada</h2>
            <p className="text-muted-foreground mb-4">
              {userLocation 
                ? `Não encontramos casas em um raio de ${searchRadius} km. Tente aumentar a distância.`
                : 'Tente ajustar os filtros ou buscar por outro termo.'
              }
            </p>
            <div className="flex gap-2 justify-center">
              {userLocation && (
                <Button variant="outline" onClick={() => setSearchRadius('all')}>
                  Buscar em qualquer distância
                </Button>
              )}
              <Button variant="outline" onClick={() => {
                setSearchTerm('');
                setSelectedState('todos');
                handleClearLocation();
              }}>
                Limpar filtros
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuscarCasas;

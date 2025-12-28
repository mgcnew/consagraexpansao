import { useState } from 'react';
import { Link } from 'react-router-dom';
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
  Building2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROUTES, getHouseRoute } from '@/constants';

const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const BuscarCasas = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<string>('');

  // Buscar casas públicas
  const { data: houses, isLoading } = useQuery({
    queryKey: ['houses', 'public', searchTerm, selectedState],
    queryFn: async () => {
      let query = supabase
        .from('houses')
        .select('*')
        .eq('visibility', 'public')
        .eq('active', true)
        .order('rating_avg', { ascending: false });

      if (selectedState) {
        query = query.eq('state', selectedState);
      }

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
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
          <div className="ml-auto">
            <Link to={ROUTES.AUTH}>
              <Button variant="outline">Entrar</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
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
              <SelectItem value="">Todos os estados</SelectItem>
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
        ) : houses && houses.length > 0 ? (
          <>
            <p className="text-muted-foreground mb-4">
              {houses.length} casa{houses.length !== 1 ? 's' : ''} encontrada{houses.length !== 1 ? 's' : ''}
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {houses.map((house) => (
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
                      {house.verified && (
                        <Badge className="absolute top-2 right-2" variant="secondary">
                          Verificada
                        </Badge>
                      )}
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
              Tente ajustar os filtros ou buscar por outro termo.
            </p>
            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setSelectedState('');
            }}>
              Limpar filtros
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuscarCasas;

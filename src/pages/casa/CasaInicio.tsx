import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useHouse } from '@/contexts/HouseContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  ShoppingBag,
  BookOpen,
  ArrowRight,
  Clock,
  MapPin,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getHouseRoute } from '@/constants';

const CasaInicio = () => {
  const { house, getHouseUrl } = useHouse();

  // Buscar próximas cerimônias
  const { data: cerimonias, isLoading: loadingCerimonias } = useQuery({
    queryKey: ['cerimonias', house?.id, 'proximas'],
    queryFn: async () => {
      if (!house) return [];
      const { data, error } = await supabase
        .from('cerimonias')
        .select('*')
        .eq('house_id', house.id)
        .gte('data', new Date().toISOString().split('T')[0])
        .order('data', { ascending: true })
        .limit(3);
      if (error) throw error;
      return data;
    },
    enabled: !!house,
  });

  // Buscar produtos em destaque
  const { data: produtos, isLoading: loadingProdutos } = useQuery({
    queryKey: ['produtos', house?.id, 'destaque'],
    queryFn: async () => {
      if (!house) return [];
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('house_id', house.id)
        .eq('ativo', true)
        .eq('destaque', true)
        .limit(4);
      if (error) throw error;
      return data;
    },
    enabled: !!house,
  });

  // Buscar próximos cursos
  const { data: cursos, isLoading: loadingCursos } = useQuery({
    queryKey: ['cursos', house?.id, 'proximos'],
    queryFn: async () => {
      if (!house) return [];
      const { data, error } = await supabase
        .from('cursos_eventos')
        .select('*')
        .eq('house_id', house.id)
        .eq('ativo', true)
        .gte('data_inicio', new Date().toISOString().split('T')[0])
        .order('data_inicio', { ascending: true })
        .limit(2);
      if (error) throw error;
      return data;
    },
    enabled: !!house,
  });

  if (!house) return null;

  return (
    <div className="space-y-8">
      {/* Sobre a casa */}
      {(house.description || house.about) && (
        <Card>
          <CardHeader>
            <CardTitle>Sobre</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-line">
              {house.about || house.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Próximas Cerimônias */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Próximas Cerimônias
          </h2>
          <Link to={getHouseUrl('/cerimonias')}>
            <Button variant="ghost" size="sm">
              Ver todas <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>

        {loadingCerimonias ? (
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : cerimonias && cerimonias.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-4">
            {cerimonias.map((cerimonia) => (
              <Card key={cerimonia.id} className="overflow-hidden">
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
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(cerimonia.data), "dd 'de' MMMM", { locale: ptBR })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {cerimonia.horario}
                    </div>
                    {cerimonia.vagas && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {cerimonia.vagas} vagas
                      </div>
                    )}
                  </div>
                  {cerimonia.valor > 0 && (
                    <Badge className="mt-3">
                      R$ {(cerimonia.valor / 100).toFixed(2)}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma cerimônia agendada no momento.
            </CardContent>
          </Card>
        )}
      </section>

      {/* Produtos em Destaque */}
      {produtos && produtos.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Loja
            </h2>
            <Link to={getHouseUrl('/loja')}>
              <Button variant="ghost" size="sm">
                Ver todos <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {produtos.map((produto) => (
              <Card key={produto.id} className="overflow-hidden">
                {produto.imagem_url ? (
                  <img
                    src={produto.imagem_url}
                    alt={produto.nome}
                    className="h-32 w-full object-cover"
                  />
                ) : (
                  <div className="h-32 bg-muted flex items-center justify-center">
                    <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
                <CardContent className="pt-3">
                  <h3 className="font-medium text-sm line-clamp-1">{produto.nome}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {produto.preco_promocional ? (
                      <>
                        <span className="text-sm line-through text-muted-foreground">
                          R$ {(produto.preco / 100).toFixed(2)}
                        </span>
                        <span className="font-semibold text-primary">
                          R$ {(produto.preco_promocional / 100).toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="font-semibold">
                        R$ {(produto.preco / 100).toFixed(2)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Próximos Cursos */}
      {cursos && cursos.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Cursos e Eventos
            </h2>
            <Link to={getHouseUrl('/cursos')}>
              <Button variant="ghost" size="sm">
                Ver todos <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {cursos.map((curso) => (
              <Card key={curso.id} className="overflow-hidden">
                <div className="flex">
                  {curso.banner_url && (
                    <img
                      src={curso.banner_url}
                      alt=""
                      className="w-32 h-full object-cover"
                    />
                  )}
                  <CardContent className="flex-1 py-4">
                    <h3 className="font-semibold mb-2">{curso.nome}</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(curso.data_inicio), "dd 'de' MMMM", { locale: ptBR })}
                      </div>
                      {curso.local && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {curso.local}
                        </div>
                      )}
                    </div>
                    {curso.gratuito ? (
                      <Badge variant="secondary" className="mt-2">Gratuito</Badge>
                    ) : curso.valor > 0 && (
                      <Badge className="mt-2">
                        R$ {(curso.valor / 100).toFixed(2)}
                      </Badge>
                    )}
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Regras da casa */}
      {house.rules && (
        <Card>
          <CardHeader>
            <CardTitle>Regras e Orientações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-line">
              {house.rules}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CasaInicio;

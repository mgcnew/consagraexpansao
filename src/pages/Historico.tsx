import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Leaf, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { PageHeader, PageContainer } from '@/components/shared';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

interface Inscricao {
  id: string;
  user_id: string;
  cerimonia_id: string;
  data_inscricao: string;
  forma_pagamento: string | null;
  pago: boolean;
  cerimonias: {
    id: string;
    nome: string | null;
    data: string;
    horario: string;
    local: string;
    medicina_principal: string | null;
    banner_url: string | null;
  };
}

interface Depoimento {
  id: string;
  user_id: string;
  cerimonia_id: string | null;
  texto: string;
  aprovado: boolean;
  created_at: string;
}

const Historico: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();

  // Buscar inscrições passadas do usuário (Requirements: 4.1, 4.2)
  const { data: inscricoes, isLoading: inscricoesLoading } = useQuery({
    queryKey: ['historico-inscricoes', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inscricoes')
        .select(`
          *,
          cerimonias (
            id,
            nome,
            data,
            horario,
            local,
            medicina_principal,
            banner_url
          )
        `)
        .eq('user_id', user!.id)
        .order('cerimonias(data)', { ascending: false });

      if (error) throw error;
      return data as Inscricao[];
    },
  });

  // Buscar depoimentos aprovados do usuário (Requirements: 4.3)
  const { data: depoimentosAprovados } = useQuery({
    queryKey: ['meus-depoimentos-aprovados', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('depoimentos')
        .select('*')
        .eq('user_id', user!.id)
        .eq('aprovado', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Depoimento[];
    },
  });

  // Separar cerimônias passadas e futuras
  const { passadas, futuras } = useMemo(() => {
    if (!inscricoes) return { passadas: [], futuras: [] };

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return {
      passadas: inscricoes.filter(
        (i) => new Date(i.cerimonias.data) < hoje
      ),
      futuras: inscricoes.filter(
        (i) => new Date(i.cerimonias.data) >= hoje
      ),
    };
  }, [inscricoes]);

  // Criar mapa de cerimônias com depoimentos
  const cerimoniaComDepoimento = useMemo(() => {
    if (!depoimentosAprovados) return new Set();
    return new Set(
      depoimentosAprovados
        .filter((d) => d.cerimonia_id)
        .map((d) => d.cerimonia_id)
    );
  }, [depoimentosAprovados]);

  const isLoading = authLoading || inscricoesLoading;

  if (isLoading) {
    return (
      <PageContainer maxWidth="lg">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        icon={Calendar}
        title="Meu Histórico"
        description="Acompanhe sua jornada espiritual através das cerimônias."
      />

      <div className="space-y-8">
        {/* Próximas Cerimônias */}
        {futuras.length > 0 && (
          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              Próximas Participações
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {futuras.map((inscricao) => (
                <Card
                  key={inscricao.id}
                  className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 bg-card"
                >
                  {inscricao.cerimonias.banner_url && (
                    <div className="h-32 w-full overflow-hidden relative">
                      <img
                        src={inscricao.cerimonias.banner_url}
                        alt={inscricao.cerimonias.nome || 'Cerimônia'}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {inscricao.cerimonias.nome || 'Cerimônia'}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {inscricao.cerimonias.medicina_principal}
                        </CardDescription>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-200 shrink-0">
                        Próxima
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>
                        {format(
                          new Date(inscricao.cerimonias.data),
                          "dd 'de' MMMM 'de' yyyy",
                          { locale: ptBR }
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{inscricao.cerimonias.horario.slice(0, 5)}</span>
                    </div>

                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{inscricao.cerimonias.local}</span>
                    </div>

                    <div className="pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">
                        Forma de pagamento:{' '}
                        <span className="font-medium text-foreground">
                          {inscricao.forma_pagamento || 'Não especificado'}
                        </span>
                      </p>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <span>Status:</span>
                        <Badge
                          variant={inscricao.pago ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {inscricao.pago ? 'Pago' : 'Pendente'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Cerimônias Passadas */}
        <section>
          <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
            Cerimônias Realizadas
          </h2>

          {passadas.length === 0 ? (
            <Card className="text-center py-12 border-dashed border-2 bg-card/50">
              <CardContent>
                <Leaf className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-lg text-muted-foreground font-display">
                  Você ainda não participou de nenhuma cerimônia.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Explore as próximas cerimônias e comece sua jornada!
                </p>
                <Link to="/cerimonias">
                  <Button className="mt-4 bg-primary hover:bg-primary/90">
                    Ver Cerimônias Disponíveis
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {passadas.map((inscricao) => (
                <Card
                  key={inscricao.id}
                  className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 bg-card"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="font-display text-lg font-semibold text-foreground">
                            {inscricao.cerimonias.nome || 'Cerimônia'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {inscricao.cerimonias.medicina_principal}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span>
                              {format(
                                new Date(inscricao.cerimonias.data),
                                "dd 'de' MMMM 'de' yyyy",
                                { locale: ptBR }
                              )}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" />
                            <span>{inscricao.cerimonias.horario.slice(0, 5)}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span>{inscricao.cerimonias.local}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                          <Badge
                            variant={inscricao.pago ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {inscricao.pago ? '✓ Pago' : 'Pendente'}
                          </Badge>

                          {/* Link para depoimentos (Requirements: 4.3) */}
                          {cerimoniaComDepoimento.has(inscricao.cerimonia_id) && (
                            <Link to="/depoimentos">
                              <Badge
                                variant="outline"
                                className="text-xs cursor-pointer hover:bg-primary/10 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Ver meu depoimento
                              </Badge>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Depoimentos Aprovados */}
        {depoimentosAprovados && depoimentosAprovados.length > 0 && (
          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              Meus Depoimentos Publicados
            </h2>
            <div className="space-y-4">
              {depoimentosAprovados.map((depoimento) => (
                <Card
                  key={depoimento.id}
                  className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 bg-card"
                >
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <p className="text-foreground italic leading-relaxed">
                        "{depoimento.texto}"
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        <p className="text-xs text-muted-foreground">
                          Publicado em{' '}
                          <span className="font-medium">
                            {format(
                              new Date(depoimento.created_at),
                              "dd 'de' MMMM 'de' yyyy",
                              { locale: ptBR }
                            )}
                          </span>
                        </p>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200 text-xs">
                          ✓ Publicado
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </PageContainer>
  );
};

export default Historico;

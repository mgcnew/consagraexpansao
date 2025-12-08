import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, ChevronRight, Bell } from 'lucide-react';
import { useCerimoniasProximas } from '@/hooks/queries';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants';
import type { InscricaoComCerimonia } from '@/types';

/**
 * Componente de lembrete de cerimônias próximas (3 dias)
 * Requirements: 8.2
 */
const CeremonyReminder: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: cerimoniasProximas, isLoading } = useCerimoniasProximas(user?.id);

  // Função para formatar a data de forma amigável
  const formatarData = (dataStr: string): string => {
    const data = new Date(dataStr + 'T00:00:00');
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    
    const dataComparacao = new Date(data);
    dataComparacao.setHours(0, 0, 0, 0);

    if (dataComparacao.getTime() === hoje.getTime()) {
      return 'Hoje';
    }
    if (dataComparacao.getTime() === amanha.getTime()) {
      return 'Amanhã';
    }
    
    return data.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  // Função para calcular dias restantes
  const calcularDiasRestantes = (dataStr: string): number => {
    const data = new Date(dataStr + 'T00:00:00');
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    data.setHours(0, 0, 0, 0);
    
    const diffTime = data.getTime() - hoje.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Não renderizar se estiver carregando ou não houver cerimônias
  if (isLoading || !cerimoniasProximas || cerimoniasProximas.length === 0) {
    return null;
  }

  return (
    <Card className="mb-8 border-amber-500/30 bg-amber-500/5 animate-fade-in-up">
      <CardContent className="p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-display text-lg font-medium text-foreground">
              {cerimoniasProximas.length === 1 
                ? 'Cerimônia Próxima' 
                : 'Cerimônias Próximas'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {cerimoniasProximas.length === 1 
                ? 'Você tem uma cerimônia nos próximos dias' 
                : `Você tem ${cerimoniasProximas.length} cerimônias nos próximos dias`}
            </p>
          </div>
        </div>

        {/* Lista de cerimônias */}
        <div className="space-y-3">
          {cerimoniasProximas.map((inscricao: InscricaoComCerimonia) => {
            const diasRestantes = calcularDiasRestantes(inscricao.cerimonias.data);
            
            return (
              <div
                key={inscricao.id}
                className="flex flex-col md:flex-row md:items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">
                      {inscricao.cerimonias.nome || inscricao.cerimonias.medicina_principal}
                    </span>
                    {diasRestantes === 0 && (
                      <Badge variant="destructive" className="text-xs">
                        Hoje!
                      </Badge>
                    )}
                    {diasRestantes === 1 && (
                      <Badge variant="default" className="text-xs bg-amber-500">
                        Amanhã
                      </Badge>
                    )}
                    {diasRestantes > 1 && (
                      <Badge variant="secondary" className="text-xs">
                        Em {diasRestantes} dias
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatarData(inscricao.cerimonias.data)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {inscricao.cerimonias.horario}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {inscricao.cerimonias.local}
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(ROUTES.CERIMONIAS)}
                  className="w-full md:w-auto"
                >
                  Ver Detalhes
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CeremonyReminder;

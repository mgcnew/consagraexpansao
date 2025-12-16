import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Calendar, Clock, ChevronRight, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ROUTES } from '@/constants';
import { useCursosFuturos } from '@/hooks/queries';
import type { CursoEvento } from '@/types';

interface UpcomingCoursesSectionProps {
  limit?: number;
}

export const UpcomingCoursesSection: React.FC<UpcomingCoursesSectionProps> = ({ limit = 2 }) => {
  const navigate = useNavigate();
  const { data: cursos, isLoading } = useCursosFuturos();

  const cursosLimitados = cursos?.slice(0, limit) || [];

  const formatarValor = (valor: number) => {
    return (valor / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <GraduationCap className="w-5 h-5 text-primary" />
            Próximos Cursos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-muted rounded-lg" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!cursosLimitados.length) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <GraduationCap className="w-5 h-5 text-primary" />
            Próximos Cursos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhum curso agendado no momento</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <GraduationCap className="w-5 h-5 text-primary" />
            Próximos Cursos
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.CURSOS)}>
            Ver todos
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {cursosLimitados.map((curso) => (
          <div
            key={curso.id}
            className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors min-w-0"
            onClick={() => navigate(ROUTES.CURSOS)}
          >
            {curso.banner_url ? (
              <img
                src={curso.banner_url}
                alt={curso.nome}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-6 h-6 text-primary/50" />
              </div>
            )}
            
            <div className="flex-1 min-w-0 overflow-hidden">
              <h4 className="font-medium text-sm truncate">{curso.nome}</h4>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Calendar className="w-3 h-3 shrink-0" />
                <span>{format(new Date(curso.data_inicio), "dd/MM", { locale: ptBR })}</span>
                <Clock className="w-3 h-3 ml-2 shrink-0" />
                <span>{curso.horario_inicio.slice(0, 5)}</span>
              </div>
              
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                  <User className="w-3 h-3 shrink-0" />
                  <span className="truncate max-w-[100px]">{curso.responsavel}</span>
                </div>
                <Badge variant="secondary" className="text-xs px-1.5 py-0 shrink-0">
                  {curso.gratuito ? 'Gratuito' : formatarValor(curso.valor)}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default UpcomingCoursesSection;

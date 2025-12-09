import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, Clock, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ROUTES } from '@/constants';
import type { Cerimonia } from '@/types';

interface EventsCarouselProps {
  events: Cerimonia[];
  isLoading: boolean;
  error: Error | null;
}

export const EventsCarousel: React.FC<EventsCarouselProps> = ({
  events,
  isLoading,
  error,
}) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    if (events.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }
  }, [events.length]);

  const prevSlide = () => {
    if (events.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
    }
  };

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying || events.length <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, events.length, nextSlide]);

  // Pausar auto-play ao interagir
  const handleInteraction = () => {
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  // Formatar valor
  const formatPrice = (centavos: number | null): string => {
    if (!centavos) return '';
    return (centavos / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  if (isLoading) {
    return (
      <Card className="w-full overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-primary" />
            Próximos Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-primary" />
            Próximos Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Erro ao carregar eventos
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-primary" />
            Próximos Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum evento agendado no momento
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentEvent = events[currentIndex];

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-primary" />
            Próximos Eventos
          </CardTitle>
          {events.length > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  handleInteraction();
                  prevSlide();
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[40px] text-center">
                {currentIndex + 1} / {events.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  handleInteraction();
                  nextSlide();
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          {/* Event Card */}
          <div
            className="cursor-pointer transition-all duration-300"
            onClick={() => navigate(`${ROUTES.CERIMONIAS}#${currentEvent.id}`)}
          >
            {/* Banner */}
            {currentEvent.banner_url ? (
              <div className="relative h-40 md:h-48 overflow-hidden">
                <img
                  src={currentEvent.banner_url}
                  alt={currentEvent.nome || 'Evento'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <Badge className="mb-2 bg-primary/90 text-primary-foreground">
                    {currentEvent.medicina_principal}
                  </Badge>
                  <h3 className="text-white font-display text-xl font-semibold drop-shadow-md">
                    {currentEvent.nome || currentEvent.medicina_principal}
                  </h3>
                </div>
              </div>
            ) : (
              <div className="h-40 md:h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <div className="text-center p-4">
                  <Badge className="mb-2 bg-primary/90 text-primary-foreground">
                    {currentEvent.medicina_principal}
                  </Badge>
                  <h3 className="font-display text-xl font-semibold text-foreground">
                    {currentEvent.nome || currentEvent.medicina_principal}
                  </h3>
                </div>
              </div>
            )}

            {/* Info */}
            <div className="p-4 space-y-3">
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">
                    {format(new Date(currentEvent.data), "dd 'de' MMMM", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{currentEvent.horario.slice(0, 5)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="truncate max-w-[150px]">{currentEvent.local}</span>
                </div>
              </div>

              {currentEvent.descricao && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {currentEvent.descricao}
                </p>
              )}

              <div className="flex items-center justify-between pt-2">
                {currentEvent.valor ? (
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(currentEvent.valor)}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">Valor a consultar</span>
                )}
                <Button size="sm" onClick={(e) => {
                  e.stopPropagation();
                  navigate(ROUTES.CERIMONIAS);
                }}>
                  Ver Detalhes
                </Button>
              </div>
            </div>
          </div>

          {/* Dots indicator */}
          {events.length > 1 && (
            <div className="flex justify-center gap-1.5 pb-4">
              {events.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-primary w-4'
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                  onClick={() => {
                    handleInteraction();
                    setCurrentIndex(index);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventsCarousel;

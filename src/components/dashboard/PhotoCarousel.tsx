import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Camera, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PhotoCarouselSkeleton } from "./skeletons/PhotoCarouselSkeleton";
import type { GaleriaItemComCerimonia } from "@/types";

interface PhotoCarouselProps {
  photos: GaleriaItemComCerimonia[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Carrossel de fotos da galeria com lazy loading e navegação
 * Requirements: 1.2, 1.3, 1.4, 1.5
 */
export function PhotoCarousel({ photos, isLoading, error }: PhotoCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);
  const [selectedPhoto, setSelectedPhoto] = React.useState<GaleriaItemComCerimonia | null>(null);

  React.useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // Loading state (Req 5.3)
  if (isLoading) {
    return <PhotoCarouselSkeleton />;
  }

  // Error state (Req 5.4)
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Camera className="h-5 w-5" />
            Últimas Fotos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <ImageOff className="h-12 w-12 mb-2" />
            <p>Erro ao carregar fotos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state (Req 1.5)
  if (!photos || photos.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Camera className="h-5 w-5" />
            Últimas Fotos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Camera className="h-12 w-12 mb-2" />
            <p className="text-center">
              Ainda não há fotos na galeria.
              <br />
              <span className="text-sm">Participe das cerimônias para ver os momentos registrados!</span>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Camera className="h-5 w-5" />
            Últimas Fotos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Carousel (Req 1.3) */}
          <div className="relative">
            <Carousel setApi={setApi} className="w-full">
              <CarouselContent>
                {photos.map((photo, index) => (
                  <CarouselItem key={photo.id}>
                    <div
                      className="relative aspect-video w-full overflow-hidden rounded-lg cursor-pointer group"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      {/* Lazy loading image (Req 1.2) */}
                      <img
                        src={photo.url}
                        alt={photo.titulo || `Foto ${index + 1}`}
                        loading={index <= 1 ? "eager" : "lazy"}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {/* Overlay with ceremony info */}
                      {photo.cerimonias && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                          <p className="text-white text-sm font-medium">
                            {photo.cerimonias.nome}
                          </p>
                          <p className="text-white/80 text-xs">
                            {format(new Date(photo.cerimonias.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      )}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            {/* Navigation buttons (Req 1.3) */}
            {count > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                  onClick={() => api?.scrollPrev()}
                  disabled={current === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Foto anterior</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                  onClick={() => api?.scrollNext()}
                  disabled={current === count - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Próxima foto</span>
                </Button>
              </>
            )}
          </div>

          {/* Position indicators / dots (Req 1.3) */}
          {count > 1 && (
            <div className="flex justify-center gap-1.5">
              {Array.from({ length: count }).map((_, index) => (
                <button
                  key={index}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === current
                      ? "bg-primary"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                  onClick={() => api?.scrollTo(index)}
                  aria-label={`Ir para foto ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Photo counter */}
          <p className="text-center text-sm text-muted-foreground">
            {current + 1} de {count}
          </p>
        </CardContent>
      </Card>

      {/* Modal for enlarged view (Req 1.4) */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {selectedPhoto && (
            <>
              <div className="relative aspect-video w-full">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.titulo || "Foto ampliada"}
                  className="h-full w-full object-contain bg-black"
                />
              </div>
              <DialogHeader className="p-4">
                <DialogTitle>
                  {selectedPhoto.titulo || selectedPhoto.cerimonias?.nome || "Foto da Galeria"}
                </DialogTitle>
                <DialogDescription className="space-y-1">
                  {selectedPhoto.descricao && (
                    <p>{selectedPhoto.descricao}</p>
                  )}
                  {selectedPhoto.cerimonias && (
                    <p className="text-sm">
                      <span className="font-medium">{selectedPhoto.cerimonias.nome}</span>
                      {" • "}
                      {format(new Date(selectedPhoto.cerimonias.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      {selectedPhoto.cerimonias.medicina_principal && (
                        <> • {selectedPhoto.cerimonias.medicina_principal}</>
                      )}
                    </p>
                  )}
                </DialogDescription>
              </DialogHeader>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

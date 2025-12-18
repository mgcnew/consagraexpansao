import { useState, memo, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Leaf, BookOpen } from 'lucide-react';
import { PageHeader, PageContainer } from '@/components/shared';
import { MEDICINAS, Medicina } from '@/constants/medicinas';
import MedicinaModal from '@/components/medicinas/MedicinaModal';
import { cn } from '@/lib/utils';

// Componente de imagem com lazy loading
const LazyImage = memo<{ src: string; alt: string; className?: string }>(({ src, alt, className }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px', threshold: 0 }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={cn('relative overflow-hidden bg-muted', className)}>
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted-foreground/10 to-muted" />
      )}
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

// Card com lazy rendering
const MedicinaCard = memo<{ 
  medicina: Medicina; 
  onClick: () => void;
}>(({ medicina, onClick }) => {
  const [isInView, setIsInView] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const IconComponent = medicina.icone;

  useEffect(() => {
    if (!cardRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px', threshold: 0 }
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  // Placeholder enquanto não está visível
  if (!isInView) {
    return (
      <div ref={cardRef} className="h-[320px] rounded-lg bg-muted animate-pulse" />
    );
  }

  return (
    <Card 
      ref={cardRef}
      className="cursor-pointer border-border/50 bg-card overflow-hidden h-full flex flex-col"
      onClick={onClick}
    >
      <CardHeader className="pb-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
          <IconComponent className={`w-8 h-8 ${medicina.cor}`} />
        </div>
        <CardTitle className="font-display text-2xl">
          {medicina.nome}
        </CardTitle>
        <CardDescription className="text-sm font-medium text-primary/80">
          {medicina.origem}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground leading-relaxed line-clamp-3">
          {medicina.resumo}
        </p>
      </CardContent>
      <CardFooter className="pt-4 border-t border-border/30 bg-muted/20">
        <Button variant="ghost" className="w-full">
          <BookOpen className="w-4 h-4 mr-2" />
          Ler Estudo Completo
        </Button>
      </CardFooter>
    </Card>
  );
});

MedicinaCard.displayName = 'MedicinaCard';

const Medicinas = () => {
  const [selectedMedicina, setSelectedMedicina] = useState<Medicina | null>(null);

  const handleSelectMedicina = useCallback((medicina: Medicina) => {
    setSelectedMedicina(medicina);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedMedicina(null);
  }, []);

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        icon={Leaf}
        title="Estudo das Medicinas"
        description="Conheça as ferramentas sagradas que utilizamos em nosso templo para cura, expansão e reconexão."
        centered
        className="mb-8"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MEDICINAS.map((medicina) => (
          <MedicinaCard
            key={medicina.id}
            medicina={medicina}
            onClick={() => handleSelectMedicina(medicina)}
          />
        ))}
      </div>

      <MedicinaModal 
        medicina={selectedMedicina} 
        onClose={handleCloseModal} 
      />
    </PageContainer>
  );
};

export default Medicinas;

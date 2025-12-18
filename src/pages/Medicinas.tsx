import React, { useState, memo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Leaf, BookOpen } from 'lucide-react';
import { PageHeader, PageContainer } from '@/components/shared';
import { MEDICINAS, Medicina } from '@/constants/medicinas';
import MedicinaModal from '@/components/medicinas/MedicinaModal';

// Card memoizado para evitar re-renders
const MedicinaCard = memo<{ 
  medicina: Medicina; 
  onClick: () => void;
}>(({ medicina, onClick }) => {
  const IconComponent = medicina.icone;
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg border-border/50 bg-card overflow-hidden h-full flex flex-col transition-shadow duration-200"
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
        <p className="text-muted-foreground leading-relaxed">
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

const Medicinas: React.FC = () => {
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
        description="Conheça as ferramentas sagradas que utilizamos em nosso templo para cura, expansão e reconexão. Clique nos cards para aprofundar seu conhecimento."
        centered
        className="mb-12"
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

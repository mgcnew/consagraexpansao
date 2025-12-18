import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Leaf, BookOpen } from 'lucide-react';
import { PageHeader, PageContainer } from '@/components/shared';
import { MEDICINAS, Medicina } from '@/constants/medicinas';
import MedicinaModal from '@/components/medicinas/MedicinaModal';

const Medicinas = () => {
  const [selectedMedicina, setSelectedMedicina] = useState<Medicina | null>(null);

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
        {MEDICINAS.map((medicina) => {
          const IconComponent = medicina.icone;
          return (
            <Card 
              key={medicina.id}
              className="cursor-pointer overflow-hidden h-full flex flex-col hover:shadow-md"
              onClick={() => setSelectedMedicina(medicina)}
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
        })}
      </div>

      <MedicinaModal 
        medicina={selectedMedicina} 
        onClose={() => setSelectedMedicina(null)} 
      />
    </PageContainer>
  );
};

export default Medicinas;

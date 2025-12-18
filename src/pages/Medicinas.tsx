import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Leaf, BookOpen } from 'lucide-react';
import { PageHeader, PageContainer } from '@/components/shared';
import { MEDICINAS, Medicina } from '@/constants/medicinas';
import MedicinaModal from '@/components/medicinas/MedicinaModal';

const Medicinas: React.FC = () => {
  const [selectedMedicina, setSelectedMedicina] = useState<Medicina | null>(null);

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
          <Card 
            key={medicina.id}
            className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-border/50 bg-card hover:-translate-y-1 overflow-hidden h-full flex flex-col"
            onClick={() => setSelectedMedicina(medicina)}
          >
            <CardHeader className="pb-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center mb-4 transition-colors group-hover:bg-primary/10">
                <medicina.icone className={`w-8 h-8 ${medicina.cor}`} />
              </div>
              <CardTitle className="font-display text-2xl group-hover:text-primary transition-colors">
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
              <Button variant="ghost" className="w-full group-hover:text-primary group-hover:bg-primary/5">
                <BookOpen className="w-4 h-4 mr-2" />
                Ler Estudo Completo
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <MedicinaModal 
        medicina={selectedMedicina} 
        onClose={() => setSelectedMedicina(null)} 
      />
    </PageContainer>
  );
};

export default Medicinas;

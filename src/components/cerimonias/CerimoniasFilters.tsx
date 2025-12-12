import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X } from 'lucide-react';

interface CerimoniasFiltersProps {
  medicinas: string[];
  selectedMedicina: string;
  selectedMes: string;
  onMedicinaChange: (value: string) => void;
  onMesChange: (value: string) => void;
  onClearFilters: () => void;
}

const MESES = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

const CerimoniasFilters: React.FC<CerimoniasFiltersProps> = ({
  medicinas,
  selectedMedicina,
  selectedMes,
  onMedicinaChange,
  onMesChange,
  onClearFilters,
}) => {
  const hasFilters = selectedMedicina !== 'todas' || selectedMes !== 'todos';

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filtrar:</span>
      </div>

      <Select value={selectedMedicina} onValueChange={onMedicinaChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Medicina" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas medicinas</SelectItem>
          {medicinas.map((medicina) => (
            <SelectItem key={medicina} value={medicina}>
              {medicina}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedMes} onValueChange={onMesChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Mês" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos meses</SelectItem>
          {MESES.map((mes) => (
            <SelectItem key={mes.value} value={mes.value}>
              {mes.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-muted-foreground">
          <X className="w-4 h-4 mr-1" /> Limpar
        </Button>
      )}
    </div>
  );
};

export default CerimoniasFilters;

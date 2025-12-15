import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X } from 'lucide-react';

interface CerimoniasFiltersProps {
  consagracoes: string[];
  selectedConsagracao: string;
  selectedMes: string;
  totalResults: number;
  onConsagracaoChange: (value: string) => void;
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
  consagracoes,
  selectedConsagracao,
  selectedMes,
  totalResults,
  onConsagracaoChange,
  onMesChange,
  onClearFilters,
}) => {
  const hasFilters = selectedConsagracao !== 'todas' || selectedMes !== 'todos';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filtrar:</span>
        </div>

      <Select value={selectedConsagracao} onValueChange={onConsagracaoChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Consagração" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas consagrações</SelectItem>
          {consagracoes.map((consagracao) => (
            <SelectItem key={consagracao} value={consagracao}>
              {consagracao}
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

      <span className="text-sm text-muted-foreground">
        {totalResults === 0 
          ? 'Nenhuma cerimônia encontrada' 
          : totalResults === 1 
            ? '1 cerimônia' 
            : `${totalResults} cerimônias`}
      </span>
    </div>
  );
};

export default memo(CerimoniasFilters);

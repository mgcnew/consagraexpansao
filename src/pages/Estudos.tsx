import { useState, useMemo } from 'react';
import { BookOpen, Search, Filter, Sparkles } from 'lucide-react';
import { PageHeader, PageContainer } from '@/components/shared';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMateriais, CATEGORIAS_MATERIAIS } from '@/hooks/queries/useMateriais';
import MaterialCard from '@/components/estudos/MaterialCard';
import MaterialModal from '@/components/estudos/MaterialModal';
import type { MaterialComAutor } from '@/types';

const Estudos: React.FC = () => {
  const [selectedCategoria, setSelectedCategoria] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialComAutor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: materiais, isLoading } = useMateriais(selectedCategoria);

  // Filtrar por busca
  const materiaisFiltrados = useMemo(() => {
    if (!materiais) return [];
    if (!searchTerm.trim()) return materiais;

    const termo = searchTerm.toLowerCase();
    return materiais.filter(
      (m) =>
        m.titulo.toLowerCase().includes(termo) ||
        m.resumo.toLowerCase().includes(termo) ||
        m.categoria.toLowerCase().includes(termo)
    );
  }, [materiais, searchTerm]);

  // Separar destaques
  const destaques = materiaisFiltrados.filter((m) => m.destaque);
  const outros = materiaisFiltrados.filter((m) => !m.destaque);

  const handleOpenMaterial = (material: MaterialComAutor) => {
    setSelectedMaterial(material);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMaterial(null);
  };

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        icon={BookOpen}
        title="Estudos"
        description="Materiais para integração e aprofundamento pós-consagração."
      />

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar materiais..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            {CATEGORIAS_MATERIAIS.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Conteúdo */}
      {!isLoading && (
        <>
          {/* Destaques */}
          {destaques.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-semibold">Destaques</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {destaques.map((material) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    onClick={() => handleOpenMaterial(material)}
                    featured
                  />
                ))}
              </div>
            </div>
          )}

          {/* Outros materiais */}
          {outros.length > 0 && (
            <div>
              {destaques.length > 0 && (
                <h2 className="text-lg font-semibold mb-4">Todos os Materiais</h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {outros.map((material) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    onClick={() => handleOpenMaterial(material)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Estado vazio */}
          {materiaisFiltrados.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">
                Nenhum material encontrado
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm
                  ? 'Tente buscar por outros termos'
                  : 'Novos conteúdos serão adicionados em breve'}
              </p>
              {(searchTerm || selectedCategoria !== 'todas') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategoria('todas');
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal de leitura */}
      <MaterialModal
        material={selectedMaterial}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </PageContainer>
  );
};

export default Estudos;

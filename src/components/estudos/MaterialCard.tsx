import { memo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, User, ChevronRight, Pencil, Trash2, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { CATEGORIAS_MATERIAIS } from '@/hooks/queries/useMateriais';
import type { MaterialComAutor } from '@/types';

interface MaterialCardProps {
  material: MaterialComAutor;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  featured?: boolean;
}

const MaterialCard: React.FC<MaterialCardProps> = ({ material, onClick, onEdit, onDelete, featured }) => {
  const categoria = CATEGORIAS_MATERIAIS.find((c) => c.value === material.categoria);
  const isRascunho = !material.publicado;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <Card
      className={cn(
        'group cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:border-primary/30',
        featured && 'md:col-span-1',
        isRascunho && 'opacity-70 border-dashed'
      )}
      onClick={onClick}
    >
      {/* Imagem de capa */}
      {material.imagem_url ? (
        <div className="relative h-48 overflow-hidden">
          <img
            src={material.imagem_url}
            alt={material.titulo}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
              {categoria?.icon} {categoria?.label || material.categoria}
            </Badge>
            {isRascunho && (
              <Badge variant="outline" className="bg-background/90 backdrop-blur-sm">
                <EyeOff className="w-3 h-3 mr-1" />
                Rascunho
              </Badge>
            )}
          </div>
          {/* Botões de ação */}
          {(onEdit || onDelete) && (
            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <Button size="icon" variant="secondary" className="h-8 w-8" onClick={handleEdit}>
                  <Pencil className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button size="icon" variant="destructive" className="h-8 w-8" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="relative h-32 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          <span className="text-4xl">{categoria?.icon || '📄'}</span>
          {isRascunho && (
            <Badge variant="outline" className="absolute top-3 left-3">
              <EyeOff className="w-3 h-3 mr-1" />
              Rascunho
            </Badge>
          )}
          {/* Botões de ação */}
          {(onEdit || onDelete) && (
            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <Button size="icon" variant="secondary" className="h-8 w-8" onClick={handleEdit}>
                  <Pencil className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button size="icon" variant="destructive" className="h-8 w-8" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        {/* Título */}
        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
          {material.titulo}
        </h3>

        {/* Resumo */}
        <p className="text-sm text-muted-foreground line-clamp-3">{material.resumo}</p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {material.autor ? (
              <>
                <Avatar className="w-5 h-5">
                  <AvatarImage src={material.autor.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {material.autor.full_name?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate max-w-[100px]">
                  {material.autor.full_name || 'Admin'}
                </span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5" />
                <span>Admin</span>
              </>
            )}
            <span className="text-muted-foreground/50">•</span>
            <Calendar className="w-3.5 h-3.5" />
            <span>{format(new Date(material.created_at), 'dd/MM/yy', { locale: ptBR })}</span>
          </div>

          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(MaterialCard);

import { memo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, User, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { CATEGORIAS_MATERIAIS } from '@/hooks/queries/useMateriais';
import type { MaterialComAutor } from '@/types';

interface MaterialCardProps {
  material: MaterialComAutor;
  onClick: () => void;
  featured?: boolean;
}

const MaterialCard: React.FC<MaterialCardProps> = ({ material, onClick, featured }) => {
  const categoria = CATEGORIAS_MATERIAIS.find((c) => c.value === material.categoria);

  return (
    <Card
      className={cn(
        'group cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:border-primary/30',
        featured && 'md:col-span-1'
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
          <Badge
            variant="secondary"
            className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm"
          >
            {categoria?.icon} {categoria?.label || material.categoria}
          </Badge>
        </div>
      ) : (
        <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          <span className="text-4xl">{categoria?.icon || '📄'}</span>
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

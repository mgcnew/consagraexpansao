import { memo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, User, X, Share2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { CATEGORIAS_MATERIAIS } from '@/hooks/queries/useMateriais';
import { toast } from 'sonner';
import type { MaterialComAutor } from '@/types';

interface MaterialModalProps {
  material: MaterialComAutor | null;
  isOpen: boolean;
  onClose: () => void;
}

const MaterialModal: React.FC<MaterialModalProps> = ({ material, isOpen, onClose }) => {
  const isMobile = useIsMobile();

  if (!material) return null;

  const categoria = CATEGORIAS_MATERIAIS.find((c) => c.value === material.categoria);

  const handleShare = async () => {
    const url = `${window.location.origin}/estudos?id=${material.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: material.titulo,
          text: material.resumo,
          url,
        });
      } catch {
        // Usuário cancelou
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    }
  };

  const content = (
    <div className="space-y-4">
      {/* Imagem de capa */}
      {material.imagem_url && (
        <div className="relative -mx-4 -mt-4 sm:-mx-6 sm:-mt-6">
          <img
            src={material.imagem_url}
            alt={material.titulo}
            className="w-full h-48 sm:h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>
      )}

      {/* Categoria e ações */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary">
          {categoria?.icon} {categoria?.label || material.categoria}
        </Badge>
        <Button variant="ghost" size="sm" onClick={handleShare}>
          <Share2 className="w-4 h-4 mr-2" />
          Compartilhar
        </Button>
      </div>

      {/* Título */}
      <h2 className="text-xl sm:text-2xl font-bold">{material.titulo}</h2>

      {/* Meta info */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground pb-4 border-b">
        {material.autor ? (
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={material.autor.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {material.autor.full_name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <span>{material.autor.full_name || 'Admin'}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>Admin</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>
            {format(new Date(material.created_at), "dd 'de' MMMM 'de' yyyy", {
              locale: ptBR,
            })}
          </span>
        </div>
      </div>

      {/* Conteúdo */}
      <div
        className="prose prose-sm sm:prose max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary"
        dangerouslySetInnerHTML={{ __html: formatContent(material.conteudo) }}
      />
    </div>
  );

  // Mobile: Drawer full screen
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader className="border-b pb-2">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-base font-medium truncate pr-4">
                {material.titulo}
              </DrawerTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DrawerHeader>
          <ScrollArea className="flex-1 px-4 py-4">{content}</ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Dialog
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{material.titulo}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[90vh] p-6">{content}</ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Formata o conteúdo para exibição
 * Converte quebras de linha em parágrafos e links em âncoras
 */
function formatContent(content: string): string {
  // Escapar HTML básico
  let formatted = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Converter quebras de linha duplas em parágrafos
  formatted = formatted
    .split(/\n\n+/)
    .map((p) => `<p>${p.trim()}</p>`)
    .join('');

  // Converter quebras de linha simples em <br>
  formatted = formatted.replace(/\n/g, '<br>');

  // Converter URLs em links
  formatted = formatted.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Converter **texto** em negrito
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Converter *texto* em itálico
  formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  return formatted;
}

export default memo(MaterialModal);

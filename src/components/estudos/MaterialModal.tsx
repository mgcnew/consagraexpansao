import { useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, User, X, Share2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { CATEGORIAS_MATERIAIS } from '@/hooks/queries/useMateriais';
import { toast } from 'sonner';
import type { MaterialComAutor } from '@/types';

interface MaterialModalProps {
  material: MaterialComAutor | null;
  isOpen: boolean;
  onClose: () => void;
}

function formatContent(content: string): string {
  let formatted = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  formatted = formatted
    .split(/\n\n+/)
    .map((p) => `<p>${p.trim()}</p>`)
    .join('');

  formatted = formatted.replace(/\n/g, '<br>');
  formatted = formatted.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  return formatted;
}

const MaterialModal = ({ material, isOpen, onClose }: MaterialModalProps) => {
  const isMobile = useIsMobile();

  // Memoizar formatação do conteúdo
  const formattedContent = useMemo(() => {
    if (!material) return '';
    return formatContent(material.conteudo);
  }, [material?.conteudo]);

  // Não renderizar nada se não estiver aberto
  if (!isOpen || !material) return null;

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

      <div className="flex items-center justify-between">
        <Badge variant="secondary">
          {categoria?.icon} {categoria?.label || material.categoria}
        </Badge>
        <Button variant="ghost" size="sm" onClick={handleShare}>
          <Share2 className="w-4 h-4 mr-2" />
          Compartilhar
        </Button>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold">{material.titulo}</h2>

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
            {format(new Date(material.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </span>
        </div>
      </div>

      <div
        className="prose prose-sm sm:prose max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[95vh] flex flex-col">
          <DrawerHeader className="border-b pb-2 shrink-0">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-base font-medium truncate pr-4">
                {material.titulo}
              </DrawerTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{material.titulo}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[90vh] overflow-y-auto p-6">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialModal;

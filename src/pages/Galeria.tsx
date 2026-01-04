import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Image,
  Upload,
  X,
  Loader2,
  Calendar,
  Trash2,
  Edit2,
  Check,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { PageHeader, PageContainer } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveHouse } from '@/hooks/useActiveHouse';
import { useHousePermissions } from '@/hooks/useHousePermissions';
import { useCerimoniasSelect } from '@/hooks/queries';
import {
  useGaleria,
  useUploadGaleria,
  useUpdateGaleria,
  useDeleteGaleria,
} from '@/hooks/queries/useGaleria';
import { formatDateBR } from '@/lib/date-utils';
import type { GaleriaItemComCerimonia } from '@/types';


// Componente de Upload
function UploadDialog({
  isOpen,
  onClose,
  houseId,
}: {
  isOpen: boolean;
  onClose: () => void;
  houseId: string;
}) {
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [cerimoniaId, setCerimoniaId] = useState<string>('');

  const { data: cerimonias } = useCerimoniasSelect();
  const uploadMutation = useUploadGaleria();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Selecione um arquivo');
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        file,
        houseId,
        cerimoniaId: cerimoniaId && cerimoniaId !== 'nenhuma' ? cerimoniaId : null,
        titulo: titulo || undefined,
        descricao: descricao || undefined,
      });
      toast.success('Mídia enviada com sucesso!');
      handleClose();
    } catch {
      toast.error('Erro ao enviar mídia');
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setTitulo('');
    setDescricao('');
    setCerimoniaId('');
    onClose();
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* File Input */}
      <div className="space-y-2">
        <Label>Arquivo</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />
        {preview ? (
          <div className="relative">
            {file?.type.startsWith('video/') ? (
              <video
                src={preview}
                className="w-full h-48 object-cover rounded-lg"
                controls
              />
            ) : (
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
            )}
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => {
                setFile(null);
                setPreview(null);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full h-32 border-dashed"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Clique para selecionar
              </span>
            </div>
          </Button>
        )}
      </div>

      {/* Cerimônia */}
      <div className="space-y-2">
        <Label>Cerimônia (opcional)</Label>
        <Select value={cerimoniaId} onValueChange={setCerimoniaId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma cerimônia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nenhuma">Nenhuma</SelectItem>
            {cerimonias?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome || c.medicina_principal} -{' '}
                {formatDateBR(c.data)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Título */}
      <div className="space-y-2">
        <Label>Título (opcional)</Label>
        <Input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título da mídia"
        />
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label>Descrição (opcional)</Label>
        <Textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descrição da mídia"
          className="resize-none"
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!file || uploadMutation.isPending}
      >
        {uploadMutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Upload className="w-4 h-4 mr-2" />
        )}
        Enviar
      </Button>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleClose}>
        <DrawerContent className="max-h-[90vh]">
          <div className="mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/20 mb-2" />
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Adicionar Mídia
            </DrawerTitle>
            <DrawerDescription>
              Envie fotos ou vídeos para a galeria.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            {formContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Adicionar Mídia
          </DialogTitle>
          <DialogDescription>
            Envie fotos ou vídeos para a galeria.
          </DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}


// Componente de Lightbox
function Lightbox({
  item,
  isOpen,
  onClose,
  canEdit,
}: {
  item: GaleriaItemComCerimonia | null;
  isOpen: boolean;
  onClose: () => void;
  canEdit: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');

  const updateMutation = useUpdateGaleria();
  const deleteMutation = useDeleteGaleria();

  React.useEffect(() => {
    if (item) {
      setTitulo(item.titulo || '');
      setDescricao(item.descricao || '');
    }
  }, [item]);

  const handleSave = async () => {
    if (!item) return;
    try {
      await updateMutation.mutateAsync({
        id: item.id,
        titulo,
        descricao,
      });
      toast.success('Atualizado com sucesso!');
      setIsEditing(false);
    } catch {
      toast.error('Erro ao atualizar');
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    try {
      await deleteMutation.mutateAsync({ id: item.id, url: item.url });
      toast.success('Mídia removida!');
      onClose();
    } catch {
      toast.error('Erro ao remover');
    }
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden" aria-describedby={undefined}>
        <DialogHeader className="sr-only">
          <DialogTitle>{item.titulo || 'Visualizar mídia'}</DialogTitle>
        </DialogHeader>
        <div className="relative">
          {/* Mídia */}
          <div className="bg-black flex items-center justify-center min-h-[300px] max-h-[60vh]">
            {item.tipo === 'video' ? (
              <video
                src={item.url}
                className="max-w-full max-h-[60vh] object-contain"
                controls
                autoPlay
              />
            ) : (
              <img
                src={item.url}
                alt={item.titulo || 'Imagem da galeria'}
                className="max-w-full max-h-[60vh] object-contain"
              />
            )}
          </div>

          {/* Info */}
          <div className="p-4 space-y-3">
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Título"
                />
                <Textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descrição"
                  className="resize-none"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {item.titulo && (
                  <h3 className="text-lg font-medium">{item.titulo}</h3>
                )}
                {item.descricao && (
                  <p className="text-muted-foreground">{item.descricao}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(item.created_at), "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                  {item.cerimonias && (
                    <Badge variant="outline" className="ml-2">
                      {item.cerimonias.nome || item.cerimonias.medicina_principal}
                    </Badge>
                  )}
                </div>
              </>
            )}

            {/* Actions */}
            {canEdit && !isEditing && (
              <div className="flex gap-2 pt-2 border-t">
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-1" /> Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="w-4 h-4 mr-1" /> Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. A mídia será removida permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>
                        {deleteMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Excluir'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


// Componente principal
const Galeria: React.FC = () => {
  const { isGuardiao } = useAuth();
  const { data: house } = useActiveHouse();
  const { canManage } = useHousePermissions();
  
  // NOTA: super_admin do portal NAO tem permissoes automaticas nas casas
  const canEdit = isGuardiao || canManage;

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GaleriaItemComCerimonia | null>(null);

  const { data: galeria, isLoading } = useGaleria(house?.id);

  // Agrupar por data
  const groupedByDate = React.useMemo(() => {
    if (!galeria) return {};
    return galeria.reduce(
      (acc, item) => {
        const date = format(new Date(item.created_at), 'yyyy-MM-dd');
        if (!acc[date]) acc[date] = [];
        acc[date].push(item);
        return acc;
      },
      {} as Record<string, GaleriaItemComCerimonia[]>
    );
  }, [galeria]);

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        icon={Image}
        title="Galeria"
        description="Momentos especiais das nossas cerimônias."
      >
        {canEdit && (
          <Button onClick={() => setIsUploadOpen(true)}>
            <Upload className="w-4 h-4 mr-2" /> Adicionar
          </Button>
        )}
      </PageHeader>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : galeria && galeria.length > 0 ? (
        <div className="space-y-8">
          {sortedDates.map((date) => (
            <div key={date}>
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                {format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {groupedByDate[date].map((item) => (
                  <Card
                    key={item.id}
                    className="overflow-hidden cursor-pointer group hover:ring-2 hover:ring-primary/50 transition-all"
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="aspect-square relative bg-muted">
                      {item.tipo === 'video' ? (
                        <>
                          <video
                            src={item.url}
                            className="w-full h-full object-cover"
                            muted
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play className="w-12 h-12 text-white" />
                          </div>
                        </>
                      ) : (
                        <img
                          src={item.url}
                          alt={item.titulo || 'Imagem'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      {item.cerimonias && (
                        <Badge
                          variant="secondary"
                          className="absolute bottom-2 left-2 text-xs"
                        >
                          {item.cerimonias.nome || item.cerimonias.medicina_principal}
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12 border-dashed border-2">
          <CardContent>
            <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-xl text-muted-foreground font-display">
              Nenhuma mídia na galeria ainda.
            </p>
            {canEdit && (
              <Button className="mt-4" onClick={() => setIsUploadOpen(true)}>
                <Upload className="w-4 h-4 mr-2" /> Adicionar primeira mídia
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Dialog */}
      {house?.id && (
        <UploadDialog isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} houseId={house.id} />
      )}

      {/* Lightbox */}
      <Lightbox
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        canEdit={canEdit}
      />
    </PageContainer>
  );
};

export default Galeria;

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCheckPermissao } from '@/components/auth/PermissionGate';
import {
  MoreHorizontal,
  Edit,
  Ban,
  Unlock,
  Trash2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import type { Profile } from '@/types';

interface ConsagradorActionsProps {
  profile: Profile;
  onOpenHistorico?: () => void;
  onOpenDetalhes?: () => void;
}

export function ConsagradorActions({ profile }: ConsagradorActionsProps) {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { temPermissao, isSuperAdmin } = useCheckPermissao();
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [editForm, setEditForm] = useState({
    full_name: profile.full_name || '',
    birth_date: profile.birth_date || '',
    referral_source: profile.referral_source || '',
    referral_name: profile.referral_name || '',
  });
  
  const [motivoBloqueio, setMotivoBloqueio] = useState(profile.motivo_bloqueio || '');

  const podeEditar = isSuperAdmin() || temPermissao('editar_consagradores');
  const podeBloquear = isSuperAdmin() || temPermissao('bloquear_consagradores');
  const podeExcluir = isSuperAdmin() || temPermissao('excluir_consagradores');

  // Mutation para editar consagrador
  const editMutation = useMutation({
    mutationFn: async (data: typeof editForm) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name || null,
          birth_date: data.birth_date || null,
          referral_source: data.referral_source || null,
          referral_name: data.referral_name || null,
        })
        .eq('id', profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Consagrador atualizado');
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      setEditDialogOpen(false);
    },
    onError: () => {
      toast.error('Erro ao atualizar consagrador');
    },
  });

  // Mutation para bloquear/desbloquear
  const blockMutation = useMutation({
    mutationFn: async ({ block, motivo }: { block: boolean; motivo?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('profiles')
        .update({
          bloqueado: block,
          bloqueado_em: block ? new Date().toISOString() : null,
          bloqueado_por: block ? user?.id : null,
          motivo_bloqueio: block ? motivo : null,
        })
        .eq('id', profile.id);
      if (error) throw error;
    },
    onSuccess: (_, { block }) => {
      toast.success(block ? 'Consagrador bloqueado' : 'Consagrador desbloqueado');
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      setBlockDialogOpen(false);
      setMotivoBloqueio('');
    },
    onError: () => {
      toast.error('Erro ao alterar status de bloqueio');
    },
  });

  // Mutation para excluir (soft delete ou hard delete dependendo da necessidade)
  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Por segurança, vamos apenas desativar/bloquear permanentemente
      // Uma exclusão real precisaria remover dados de várias tabelas
      const { error } = await supabase
        .from('profiles')
        .update({
          bloqueado: true,
          motivo_bloqueio: 'Conta excluída pelo administrador',
          bloqueado_em: new Date().toISOString(),
        })
        .eq('id', profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Consagrador removido');
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      setDeleteDialogOpen(false);
    },
    onError: () => {
      toast.error('Erro ao remover consagrador');
    },
  });

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    editMutation.mutate(editForm);
  };

  const handleBlock = () => {
    blockMutation.mutate({ block: true, motivo: motivoBloqueio });
  };

  const handleUnblock = () => {
    blockMutation.mutate({ block: false });
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  // Se não tem nenhuma permissão especial, não mostra o menu
  if (!podeEditar && !podeBloquear && !podeExcluir) {
    return null;
  }

  const EditContent = (
    <form onSubmit={handleEdit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Nome Completo</Label>
        <Input
          id="full_name"
          value={editForm.full_name}
          onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="birth_date">Data de Nascimento</Label>
        <Input
          id="birth_date"
          type="date"
          value={editForm.birth_date}
          onChange={(e) => setEditForm(prev => ({ ...prev, birth_date: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="referral_source">Origem</Label>
        <Input
          id="referral_source"
          value={editForm.referral_source}
          onChange={(e) => setEditForm(prev => ({ ...prev, referral_source: e.target.value }))}
          placeholder="Como conheceu o templo"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="referral_name">Indicado por</Label>
        <Input
          id="referral_name"
          value={editForm.referral_name}
          onChange={(e) => setEditForm(prev => ({ ...prev, referral_name: e.target.value }))}
          placeholder="Nome de quem indicou"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={editMutation.isPending} className="flex-1">
          {editMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Salvar
        </Button>
      </div>
    </form>
  );

  const BlockContent = (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-destructive" />
        <p className="text-sm">
          Ao bloquear, <strong>{profile.full_name}</strong> não poderá se inscrever em cerimônias.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="motivo">Motivo do bloqueio</Label>
        <Textarea
          id="motivo"
          value={motivoBloqueio}
          onChange={(e) => setMotivoBloqueio(e.target.value)}
          placeholder="Descreva o motivo do bloqueio..."
          className="min-h-[100px]"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => setBlockDialogOpen(false)} className="flex-1">
          Cancelar
        </Button>
        <Button variant="destructive" onClick={handleBlock} disabled={blockMutation.isPending} className="flex-1">
          {blockMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Bloquear
        </Button>
      </div>
    </div>
  );

  const DeleteContent = (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-destructive" />
        <p className="text-sm">
          Esta ação irá remover <strong>{profile.full_name}</strong> do sistema. Esta ação não pode ser desfeita.
        </p>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)} className="flex-1">
          Cancelar
        </Button>
        <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending} className="flex-1">
          {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Excluir
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {podeEditar && (
            <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </DropdownMenuItem>
          )}
          {podeBloquear && (
            <>
              {profile.bloqueado ? (
                <DropdownMenuItem onClick={handleUnblock}>
                  <Unlock className="w-4 h-4 mr-2" />
                  Desbloquear
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => setBlockDialogOpen(true)}>
                  <Ban className="w-4 h-4 mr-2" />
                  Bloquear
                </DropdownMenuItem>
              )}
            </>
          )}
          {podeExcluir && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog/Drawer de Edição */}
      {isMobile ? (
        <Drawer open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DrawerContent className="h-[85vh] max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle>Editar Consagrador</DrawerTitle>
              <DrawerDescription>Altere os dados do consagrador</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4 overflow-y-auto flex-1">
              {EditContent}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Consagrador</DialogTitle>
              <DialogDescription>Altere os dados do consagrador</DialogDescription>
            </DialogHeader>
            {EditContent}
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog/Drawer de Bloqueio */}
      {isMobile ? (
        <Drawer open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
          <DrawerContent className="h-[60vh] max-h-[60vh]">
            <DrawerHeader>
              <DrawerTitle>Bloquear Consagrador</DrawerTitle>
              <DrawerDescription>Impedir participação em cerimônias</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4 overflow-y-auto flex-1">
              {BlockContent}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bloquear Consagrador</DialogTitle>
              <DialogDescription>Impedir participação em cerimônias</DialogDescription>
            </DialogHeader>
            {BlockContent}
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog/Drawer de Exclusão */}
      {isMobile ? (
        <Drawer open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Excluir Consagrador</DrawerTitle>
              <DrawerDescription>Esta ação é irreversível</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4">
              {DeleteContent}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Consagrador</DialogTitle>
              <DialogDescription>Esta ação é irreversível</DialogDescription>
            </DialogHeader>
            {DeleteContent}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// Badge de status de bloqueio
export function BloqueadoBadge({ profile }: { profile: Profile }) {
  if (!profile.bloqueado) return null;
  
  return (
    <Badge variant="destructive" className="text-xs">
      <Ban className="w-3 h-3 mr-1" />
      Bloqueado
    </Badge>
  );
}

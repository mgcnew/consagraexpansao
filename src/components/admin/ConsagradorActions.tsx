import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
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
  Calendar,
  GraduationCap,
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
  const [bloquearCerimonias, setBloquearCerimonias] = useState(profile.bloqueado_cerimonias ?? true);
  const [bloquearCursos, setBloquearCursos] = useState(profile.bloqueado_cursos ?? true);
  
  // Estado local para rastrear bloqueio (atualizado após mutation)
  const [isBloqueado, setIsBloqueado] = useState(profile.bloqueado ?? false);
  
  // Sincronizar com prop quando profile mudar
  useEffect(() => {
    setIsBloqueado(profile.bloqueado ?? false);
  }, [profile.bloqueado]);

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
    mutationFn: async ({ block, motivo, cerimonias, cursos }: { 
      block: boolean; 
      motivo?: string;
      cerimonias?: boolean;
      cursos?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('profiles')
        .update({
          bloqueado: block,
          bloqueado_em: block ? new Date().toISOString() : null,
          bloqueado_por: block ? user?.id : null,
          motivo_bloqueio: block ? motivo : null,
          bloqueado_cerimonias: block ? cerimonias : false,
          bloqueado_cursos: block ? cursos : false,
        })
        .eq('id', profile.id);
      if (error) throw error;
    },
    onSuccess: (_, { block }) => {
      toast.success(block ? 'Consagrador bloqueado' : 'Consagrador desbloqueado');
      setIsBloqueado(block); // Atualiza estado local imediatamente
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      setBlockDialogOpen(false);
      setMotivoBloqueio('');
      setBloquearCerimonias(true);
      setBloquearCursos(true);
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

  const handleEdit = () => {
    editMutation.mutate(editForm);
  };

  const handleBlock = () => {
    if (!bloquearCerimonias && !bloquearCursos) {
      toast.error('Selecione pelo menos uma opção de bloqueio');
      return;
    }
    blockMutation.mutate({ 
      block: true, 
      motivo: motivoBloqueio,
      cerimonias: bloquearCerimonias,
      cursos: bloquearCursos,
    });
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
    <div className="space-y-4">
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
        <Button type="button" onClick={handleEdit} disabled={editMutation.isPending} className="flex-1">
          {editMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Salvar
        </Button>
      </div>
    </div>
  );

  const BlockContent = (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
        <p className="text-sm">
          Selecione onde <strong>{profile.full_name}</strong> será bloqueado(a).
        </p>
      </div>
      
      <div className="space-y-3">
        <Label>Bloquear em:</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-3 p-3 border rounded-lg">
            <Checkbox 
              id="bloquear-cerimonias" 
              checked={bloquearCerimonias}
              onCheckedChange={(checked) => setBloquearCerimonias(checked === true)}
            />
            <div className="flex items-center gap-2 flex-1">
              <Calendar className="w-4 h-4 text-primary" />
              <Label htmlFor="bloquear-cerimonias" className="cursor-pointer font-normal">
                Cerimônias
              </Label>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 border rounded-lg">
            <Checkbox 
              id="bloquear-cursos" 
              checked={bloquearCursos}
              onCheckedChange={(checked) => setBloquearCursos(checked === true)}
            />
            <div className="flex items-center gap-2 flex-1">
              <GraduationCap className="w-4 h-4 text-primary" />
              <Label htmlFor="bloquear-cursos" className="cursor-pointer font-normal">
                Cursos e Eventos
              </Label>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="motivo">Motivo do bloqueio</Label>
        <Textarea
          id="motivo"
          value={motivoBloqueio}
          onChange={(e) => setMotivoBloqueio(e.target.value)}
          placeholder="Descreva o motivo do bloqueio..."
          className="min-h-[80px]"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => setBlockDialogOpen(false)} className="flex-1">
          Cancelar
        </Button>
        <Button 
          variant="destructive" 
          onClick={handleBlock} 
          disabled={blockMutation.isPending || (!bloquearCerimonias && !bloquearCursos)} 
          className="flex-1"
        >
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
              {isBloqueado ? (
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
  
  const tipos: string[] = [];
  if (profile.bloqueado_cerimonias) tipos.push('Cerimônias');
  if (profile.bloqueado_cursos) tipos.push('Cursos');
  
  const label = tipos.length > 0 ? tipos.join(' e ') : 'Bloqueado';
  
  return (
    <Badge variant="destructive" className="text-xs" title={`Bloqueado em: ${label}`}>
      <Ban className="w-3 h-3 mr-1" />
      {tipos.length === 2 ? 'Bloqueado' : label}
    </Badge>
  );
}

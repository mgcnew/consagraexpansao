import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Users, Leaf, CheckCircle2, Plus, XCircle, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import PaymentModal from '@/components/cerimonias/PaymentModal';
import CreateCeremonyDialog from '@/components/cerimonias/CreateCeremonyDialog';
import EditCeremonyDialog from '@/components/cerimonias/EditCeremonyDialog';
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
} from "@/components/ui/alert-dialog";

interface Cerimonia {
  id: string;
  nome: string | null;
  data: string;
  horario: string;
  local: string;
  descricao: string | null;
  medicina_principal: string | null;
  vagas: number | null;
  observacoes: string | null;
  banner_url: string | null;
}

const Cerimonias: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [selectedCeremony, setSelectedCeremony] = useState<Cerimonia | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [ceremonyToEdit, setCeremonyToEdit] = useState<Cerimonia | null>(null);

  // Buscar cerimônias futuras
  const { data: cerimonias, isLoading } = useQuery({
    queryKey: ['cerimonias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cerimonias')
        .select('*')
        .gte('data', new Date().toISOString().split('T')[0])
        .order('data', { ascending: true });

      if (error) throw error;
      return data as Cerimonia[];
    },
  });

  // Buscar inscrições do usuário
  const { data: minhasInscricoes } = useQuery({
    queryKey: ['minhas-inscricoes', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inscricoes')
        .select('cerimonia_id')
        .eq('user_id', user!.id);

      if (error) throw error;
      return data.map((i) => i.cerimonia_id);
    },
  });

  // Mutation para se inscrever
  const inscreverMutation = useMutation({
    mutationFn: async ({ cerimoniaId, formaPagamento }: { cerimoniaId: string, formaPagamento: string }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('inscricoes')
        .insert({
          user_id: user.id,
          cerimonia_id: cerimoniaId,
          forma_pagamento: formaPagamento
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Inscrição realizada com sucesso! Gratidão.');
      queryClient.invalidateQueries({ queryKey: ['minhas-inscricoes'] });
      setIsPaymentModalOpen(false);
      setSelectedCeremony(null);
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao realizar inscrição. Tente novamente.');
    }
  });

  // Mutation para cancelar inscrição
  const cancelarMutation = useMutation({
    mutationFn: async (cerimoniaId: string) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('inscricoes')
        .delete()
        .eq('user_id', user.id)
        .eq('cerimonia_id', cerimoniaId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.info('Inscrição cancelada.');
      queryClient.invalidateQueries({ queryKey: ['minhas-inscricoes'] });
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao cancelar inscrição.');
    }
  });

  // Mutation para excluir cerimônia (Admin)
  const deleteCeremonyMutation = useMutation({
    mutationFn: async (cerimoniaId: string) => {
      const { error } = await supabase
        .from('cerimonias')
        .delete()
        .eq('id', cerimoniaId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Cerimônia excluída com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['cerimonias'] });
      queryClient.invalidateQueries({ queryKey: ['admin-cerimonias'] });
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao excluir cerimônia.');
    }
  });

  const handleOpenPayment = (cerimonia: Cerimonia) => {
    setSelectedCeremony(cerimonia);
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = (paymentMethod: string) => {
    if (selectedCeremony) {
      inscreverMutation.mutate({
        cerimoniaId: selectedCeremony.id,
        formaPagamento: paymentMethod
      });
    }
  };

  const handleEditCeremony = (cerimonia: Cerimonia) => {
    setCeremonyToEdit(cerimonia);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setCeremonyToEdit(null);
  };

  const isUserInscrito = (cerimoniaId: string) => {
    return minhasInscricoes?.includes(cerimoniaId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-background/50 pb-24">
      <div className="container max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 animate-fade-in">
          <div className="text-center md:text-left">
            <h1 className="font-display text-3xl md:text-4xl font-medium text-foreground mb-2">
              Próximas Cerimônias
            </h1>
            <p className="text-muted-foreground font-body">
              Agenda sagrada de cura e expansão.
            </p>
          </div>

          {isAdmin && (
            <Button onClick={() => setIsCreateModalOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg">
              <Plus className="w-4 h-4 mr-2" /> Nova Cerimônia
            </Button>
          )}
        </div>

        {!cerimonias || cerimonias.length === 0 ? (
          <Card className="text-center py-12 border-dashed border-2 bg-card/50">
            <CardContent>
              <Leaf className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-xl text-muted-foreground font-display">
                Nenhuma cerimônia agendada para os próximos dias.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cerimonias.map((cerimonia) => (
              <Card
                key={cerimonia.id}
                className="group hover:shadow-xl transition-all duration-300 border-border/50 bg-card hover:-translate-y-1 overflow-hidden flex flex-col h-full"
              >
                {cerimonia.banner_url && (
                  <div className="h-48 w-full overflow-hidden relative">
                    <img
                      src={cerimonia.banner_url}
                      alt={cerimonia.nome || cerimonia.medicina_principal || 'Cerimônia'}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-display text-lg font-semibold drop-shadow-md leading-tight mb-1">
                        {cerimonia.nome}
                      </h3>
                      <Badge className="bg-primary/90 text-primary-foreground border-none font-medium text-xs backdrop-blur-sm">
                        {cerimonia.medicina_principal}
                      </Badge>
                    </div>
                  </div>
                )}

                <CardHeader className="pb-2 pt-4">
                  {!cerimonia.banner_url && (
                    <div className="mb-2">
                      <h3 className="font-display text-xl font-semibold text-foreground leading-tight mb-2">
                        {cerimonia.nome || 'Cerimônia Sem Nome'}
                      </h3>
                      <div className="flex justify-between items-start">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-medium px-3 py-1">
                          {cerimonia.medicina_principal || 'Medicina'}
                        </Badge>
                        {isUserInscrito(cerimonia.id) && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200 flex gap-1 items-center">
                            <CheckCircle2 className="w-3 h-3" /> Inscrito
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  {cerimonia.banner_url && isUserInscrito(cerimonia.id) && (
                    <div className="mb-2">
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200 flex gap-1 items-center w-fit">
                        <CheckCircle2 className="w-3 h-3" /> Inscrito
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-foreground font-medium mt-1">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>{format(new Date(cerimonia.data), "dd 'de' MMMM", { locale: ptBR })}</span>
                  </div>
                  <CardDescription className="flex items-center gap-2 text-base text-muted-foreground">
                    <Clock className="w-4 h-4 text-primary" />
                    {cerimonia.horario.slice(0, 5)}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 flex-grow">
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm leading-tight">{cerimonia.local}</span>
                  </div>

                  {cerimonia.descricao && (
                    <p className="text-sm text-muted-foreground line-clamp-3 italic border-l-2 border-primary/20 pl-3">
                      "{cerimonia.descricao}"
                    </p>
                  )}

                  {cerimonia.vagas && (
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground bg-secondary/10 p-2 rounded-lg">
                      <Users className="w-4 h-4 text-primary" />
                      <span>{cerimonia.vagas} vagas totais</span>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-4 border-t border-border/50 bg-muted/30 flex flex-col gap-2">
                  {isUserInscrito(cerimonia.id) ? (
                    <div className="w-full flex flex-col gap-2">
                      <Button className="w-full bg-green-600 hover:bg-green-700 text-white shadow-md cursor-default opacity-90">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Vaga Garantida
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" className="w-full text-destructive hover:text-destructive/90 hover:bg-destructive/10">
                            <XCircle className="w-4 h-4 mr-2" /> Cancelar Inscrição
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancelar Inscrição?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja cancelar sua participação nesta cerimônia? Sua vaga será liberada para outra pessoa.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Voltar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => cancelarMutation.mutate(cerimonia.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Sim, Cancelar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ) : (
                    <Button
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-md hover:shadow-lg transition-all"
                      onClick={() => handleOpenPayment(cerimonia)}
                    >
                      Confirmar Presença
                    </Button>
                  )}

                  {/* Admin Actions */}
                  {isAdmin && (
                    <div className="w-full flex gap-2 mt-2 pt-2 border-t border-border/30">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditCeremony(cerimonia)}
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1.5" /> Editar
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10">
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Excluir
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Cerimônia?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Todas as inscrições associadas a esta cerimônia também serão removidas.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteCeremonyMutation.mutate(cerimonia.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Sim, Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onConfirm={handleConfirmPayment}
          ceremonyTitle={selectedCeremony?.medicina_principal || 'Cerimônia'}
          isPending={inscreverMutation.isPending}
        />

        <CreateCeremonyDialog
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />

        <EditCeremonyDialog
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          ceremony={ceremonyToEdit}
        />
      </div>
    </div>
  );
};

export default Cerimonias;


import React, { useState, useMemo, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Users, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PageHeader, PageContainer } from '@/components/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { TOAST_MESSAGES, ROUTES } from '@/constants';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PaymentModal from '@/components/cerimonias/PaymentModal';
import SuccessModal from '@/components/cerimonias/SuccessModal';
import CeremonyFormDialog from '@/components/cerimonias/CeremonyFormDialog';
import CerimoniasLista from '@/components/cerimonias/CerimoniasLista';
import CerimoniasHistorico from '@/components/cerimonias/CerimoniasHistorico';
import CerimoniasFilters from '@/components/cerimonias/CerimoniasFilters';
import { useCerimoniasFuturas, useVagasPorCerimonia, useMinhasInscricoes, useMinhaListaEspera, useEntrarListaEspera, useSairListaEspera } from '@/hooks/queries';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Cerimonia } from '@/types';

const Cerimonias: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab ativa (pode vir da URL)
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl === 'historico' ? 'historico' : 'proximas');

  // Limpar parâmetro tab da URL após ler
  useEffect(() => {
    if (tabFromUrl) {
      searchParams.delete('tab');
      setSearchParams(searchParams, { replace: true });
    }
  }, [tabFromUrl, searchParams, setSearchParams]);

  // Tratar retorno do Mercado Pago
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus) {
      searchParams.delete('payment');
      setSearchParams(searchParams, { replace: true });
      queryClient.invalidateQueries({ queryKey: ['minhas-inscricoes'] });
      queryClient.invalidateQueries({ queryKey: ['vagas-cerimonias'] });

      if (paymentStatus === 'success') {
        toast.success('Pagamento realizado com sucesso!', {
          description: 'Sua inscrição foi confirmada. Você receberá um email com os detalhes.',
          duration: 6000,
        });
      } else if (paymentStatus === 'pending') {
        toast.info('Pagamento em processamento', {
          description: 'Seu pagamento está sendo processado. Você será notificado quando for confirmado.',
          duration: 6000,
        });
      } else if (paymentStatus === 'failure') {
        toast.error('Pagamento não aprovado', {
          description: 'Houve um problema com seu pagamento. Tente novamente ou escolha outra forma de pagamento.',
          duration: 6000,
        });
      }
    }
  }, [searchParams, setSearchParams, queryClient]);

  const [selectedCeremony, setSelectedCeremony] = useState<Cerimonia | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [confirmedCeremonyName, setConfirmedCeremonyName] = useState('');
  const [ceremonyToEdit, setCeremonyToEdit] = useState<Cerimonia | null>(null);
  const [ceremonyToView, setCeremonyToView] = useState<Cerimonia | null>(null);

  // Filtros
  const [selectedConsagracao, setSelectedConsagracao] = useState('todas');
  const [selectedMes, setSelectedMes] = useState('todos');

  const { data: cerimonias, isLoading } = useCerimoniasFuturas();

  // Lista de espera
  const { data: minhaListaEspera } = useMinhaListaEspera(user?.id);
  const entrarListaEspera = useEntrarListaEspera();
  const sairListaEspera = useSairListaEspera();

  const { data: userAnamnese } = useQuery({
    queryKey: ['user-anamnese', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('anamneses')
        .select('id, nome_completo')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const hasAnamnese = !!userAnamnese;
  const cerimoniaIds = useMemo(() => cerimonias?.map(c => c.id) || [], [cerimonias]);
  const { data: vagasInfo } = useVagasPorCerimonia(cerimoniaIds);
  const { data: minhasInscricoes } = useMinhasInscricoes(user?.id);

  // Extrair nomes de consagrações únicos para o filtro
  const consagracoesUnicas = useMemo(() => {
    if (!cerimonias) return [];
    const nomes = cerimonias
      .map(c => c.nome)
      .filter((n): n is string => !!n);
    return [...new Set(nomes)].sort();
  }, [cerimonias]);

  // Aplicar filtros
  const cerimoniasFiltradas = useMemo(() => {
    if (!cerimonias) return [];
    return cerimonias.filter(c => {
      // Filtro por nome da consagração
      if (selectedConsagracao !== 'todas' && c.nome !== selectedConsagracao) {
        return false;
      }
      // Filtro por mês
      if (selectedMes !== 'todos') {
        const mesCerimonia = new Date(c.data).getMonth() + 1;
        if (mesCerimonia !== parseInt(selectedMes)) {
          return false;
        }
      }
      return true;
    });
  }, [cerimonias, selectedConsagracao, selectedMes]);

  // Mapear lista de espera para formato esperado pelo componente
  const listaEsperaFormatada = useMemo(() => {
    if (!minhaListaEspera) return [];
    return minhaListaEspera.map(le => ({
      cerimoniaId: le.cerimonia_id,
      posicao: le.posicao,
    }));
  }, [minhaListaEspera]);

  // Mutations
  const inscreverMutation = useMutation({
    mutationFn: async ({ cerimoniaId, formaPagamento }: { cerimoniaId: string, formaPagamento: string }) => {
      if (!user) throw new Error('Usuário não autenticado');
      const { data, error } = await supabase
        .from('inscricoes')
        .insert({ user_id: user.id, cerimonia_id: cerimoniaId, forma_pagamento: formaPagamento })
        .select('id')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minhas-inscricoes'] });
      queryClient.invalidateQueries({ queryKey: ['vagas-cerimonias'] });
      queryClient.invalidateQueries({ queryKey: ['historico-inscricoes'] });
      const ceremonyName = selectedCeremony?.nome || selectedCeremony?.medicina_principal || 'Cerimônia';
      setIsPaymentModalOpen(false);
      setSelectedCeremony(null);
      setConfirmedCeremonyName(ceremonyName);
      setIsSuccessModalOpen(true);
    },
    onError: (error) => {
      console.error(error);
      toast.error(TOAST_MESSAGES.inscricao.erro.title, { description: TOAST_MESSAGES.inscricao.erro.description });
    }
  });

  const cancelarMutation = useMutation({
    mutationFn: async (cerimoniaId: string) => {
      if (!user) throw new Error('Usuário não autenticado');
      const { error } = await supabase.from('inscricoes').delete().eq('user_id', user.id).eq('cerimonia_id', cerimoniaId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(TOAST_MESSAGES.inscricao.cancelada.title, { description: TOAST_MESSAGES.inscricao.cancelada.description });
      queryClient.invalidateQueries({ queryKey: ['minhas-inscricoes'] });
      queryClient.invalidateQueries({ queryKey: ['vagas-cerimonias'] });
      queryClient.invalidateQueries({ queryKey: ['historico-inscricoes'] });
    },
    onError: (error) => {
      console.error(error);
      toast.error(TOAST_MESSAGES.inscricao.erro.title, { description: 'Não foi possível cancelar sua inscrição. Tente novamente.' });
    }
  });

  const deleteCeremonyMutation = useMutation({
    mutationFn: async (cerimoniaId: string) => {
      const { error } = await supabase.from('cerimonias').delete().eq('id', cerimoniaId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(TOAST_MESSAGES.cerimonia.removida.title, { description: TOAST_MESSAGES.cerimonia.removida.description });
      queryClient.invalidateQueries({ queryKey: ['cerimonias'] });
      queryClient.invalidateQueries({ queryKey: ['admin-cerimonias'] });
    },
    onError: (error) => {
      console.error(error);
      toast.error(TOAST_MESSAGES.cerimonia.erro.title, { description: 'Não foi possível excluir a cerimônia. Tente novamente.' });
    }
  });

  const handleOpenPayment = (cerimonia: Cerimonia) => {
    if (!hasAnamnese) {
      toast.error('Ficha de Anamnese Pendente', {
        description: 'Você precisa preencher sua ficha de anamnese antes de participar das cerimônias.',
        action: { label: 'Preencher Ficha', onClick: () => navigate(ROUTES.ANAMNESE) },
      });
      return;
    }
    setSelectedCeremony(cerimonia);
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = (paymentMethod: string) => {
    if (selectedCeremony) {
      inscreverMutation.mutate({ cerimoniaId: selectedCeremony.id, formaPagamento: paymentMethod });
    }
  };

  const handleEditCeremony = (cerimonia: Cerimonia) => {
    setCeremonyToEdit(cerimonia);
    setIsEditModalOpen(true);
  };

  const handleViewInfo = (cerimonia: Cerimonia) => {
    setCeremonyToView(cerimonia);
    setIsInfoModalOpen(true);
  };

  const handleEntrarListaEspera = (cerimoniaId: string) => {
    if (!user?.id) return;
    entrarListaEspera.mutate({ userId: user.id, cerimoniaId });
  };

  const handleSairListaEspera = (cerimoniaId: string) => {
    if (!user?.id) return;
    sairListaEspera.mutate({ userId: user.id, cerimoniaId });
  };

  const handleClearFilters = () => {
    setSelectedConsagracao('todas');
    setSelectedMes('todos');
  };

  const isCerimoniaEsgotada = (cerimoniaId: string) => vagasInfo?.[cerimoniaId]?.esgotado ?? false;
  const getVagasDisponiveis = (cerimoniaId: string) => {
    const info = vagasInfo?.[cerimoniaId];
    if (!info || info.total_vagas === null) return null;
    return info.vagas_disponiveis;
  };
  const isUserInscrito = (cerimoniaId: string) => minhasInscricoes?.includes(cerimoniaId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        icon={Calendar}
        title="Cerimônias"
        description="Agenda sagrada de cura e expansão."
      >
        {isAdmin && (
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg">
            <Plus className="w-4 h-4 mr-2" /> Nova Cerimônia
          </Button>
        )}
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="proximas">Próximas</TabsTrigger>
          <TabsTrigger value="historico">Meu Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="proximas">
          <CerimoniasFilters
            consagracoes={consagracoesUnicas}
            selectedConsagracao={selectedConsagracao}
            selectedMes={selectedMes}
            onConsagracaoChange={setSelectedConsagracao}
            onMesChange={setSelectedMes}
            onClearFilters={handleClearFilters}
          />
          <CerimoniasLista
            cerimonias={cerimoniasFiltradas}
            minhasInscricoes={minhasInscricoes}
            minhaListaEspera={listaEsperaFormatada}
            vagasInfo={vagasInfo}
            hasAnamnese={hasAnamnese}
            isAdmin={isAdmin}
            onOpenPayment={handleOpenPayment}
            onCancelarInscricao={(id) => cancelarMutation.mutate(id)}
            onEntrarListaEspera={handleEntrarListaEspera}
            onSairListaEspera={handleSairListaEspera}
            onEditCeremony={handleEditCeremony}
            onDeleteCeremony={(id) => deleteCeremonyMutation.mutate(id)}
            onViewInfo={handleViewInfo}
          />
        </TabsContent>

        <TabsContent value="historico">
          <CerimoniasHistorico userId={user?.id} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirm={handleConfirmPayment}
        ceremonyTitle={selectedCeremony?.nome || selectedCeremony?.medicina_principal || 'Cerimônia'}
        ceremonyValue={selectedCeremony?.valor ?? null}
        ceremonyId={selectedCeremony?.id || ''}
        userId={user?.id || ''}
        userEmail={user?.email || ''}
        userName={userAnamnese?.nome_completo || user?.email || ''}
        isPending={inscreverMutation.isPending}
      />

      <CeremonyFormDialog isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} mode="create" />
      <CeremonyFormDialog isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setCeremonyToEdit(null); }} mode="edit" ceremony={ceremonyToEdit} />

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onComplete={() => { setIsSuccessModalOpen(false); navigate(ROUTES.FAQ, { state: { fromInscription: true } }); }}
        ceremonyName={confirmedCeremonyName}
      />

      {/* Modal de Informações */}
      <Dialog open={isInfoModalOpen} onOpenChange={setIsInfoModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-primary">
              {ceremonyToView?.nome || ceremonyToView?.medicina_principal || 'Cerimônia'}
            </DialogTitle>
          </DialogHeader>
          
          {ceremonyToView && (
            <div className="space-y-4">
              {ceremonyToView.banner_url && (
                <div className="rounded-lg overflow-hidden">
                  <img src={ceremonyToView.banner_url} alt={ceremonyToView.nome || 'Cerimônia'} className="w-full h-56 object-cover" />
                </div>
              )}

              <Badge variant="outline" className="bg-primary/10 text-primary">{ceremonyToView.medicina_principal}</Badge>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-foreground">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-medium">{format(new Date(ceremonyToView.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="font-medium">{ceremonyToView.horario.slice(0, 5)}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{ceremonyToView.local}</span>
              </div>

              {ceremonyToView.descricao && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Sobre a Cerimônia</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{ceremonyToView.descricao}</p>
                </div>
              )}

              {ceremonyToView.vagas && (
                <div className={`flex items-center gap-2 text-sm font-medium p-3 rounded-lg ${
                  isCerimoniaEsgotada(ceremonyToView.id) ? 'bg-destructive/10 text-destructive' : 'bg-secondary/10 text-foreground'
                }`}>
                  {isCerimoniaEsgotada(ceremonyToView.id) ? (
                    <><AlertCircle className="w-4 h-4" /><span>Vagas Esgotadas</span></>
                  ) : (
                    <>
                      <Users className="w-4 h-4 text-primary" />
                      <span>
                        {getVagasDisponiveis(ceremonyToView.id) !== null 
                          ? `${getVagasDisponiveis(ceremonyToView.id)} vagas disponíveis de ${ceremonyToView.vagas}`
                          : `${ceremonyToView.vagas} vagas totais`}
                      </span>
                    </>
                  )}
                </div>
              )}

              {ceremonyToView.valor && (
                <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Contribuição:</span>
                    <span className="text-2xl font-bold text-primary">
                      {(ceremonyToView.valor / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                disabled={isCerimoniaEsgotada(ceremonyToView.id) || isUserInscrito(ceremonyToView.id)}
                onClick={() => { setIsInfoModalOpen(false); handleOpenPayment(ceremonyToView); }}
              >
                {isUserInscrito(ceremonyToView.id) ? (
                  <><CheckCircle2 className="w-4 h-4 mr-2" />Você já está inscrito</>
                ) : isCerimoniaEsgotada(ceremonyToView.id) ? 'Vagas Esgotadas' : 'Confirmar Presença'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default Cerimonias;

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useActiveHouse } from '@/hooks/useActiveHouse';
import { useHousePermissions } from '@/hooks/useHousePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Wallet, 
  Link2, 
  Unlink, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  ExternalLink,
  RefreshCw,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MPStatus {
  connected: boolean;
  mp_email?: string;
  mp_nickname?: string;
  mp_user_id?: string;
  connected_at?: string;
  token_expired?: boolean;
}

const MercadoPagoConnect: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: activeHouse } = useActiveHouse();
  const { isDono } = useHousePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);

  // Buscar status da conexao MP
  const { data: mpStatus, isLoading, refetch } = useQuery({
    queryKey: ['mp-connection-status', activeHouse?.id],
    queryFn: async (): Promise<MPStatus> => {
      if (!activeHouse?.id) return { connected: false };

      const { data, error } = await supabase.functions.invoke('mp-oauth-connect', {
        body: {
          action: 'status',
          house_id: activeHouse.id,
        },
      });

      if (error) {
        console.error('Erro ao verificar status MP:', error);
        return { connected: false };
      }

      return data as MPStatus;
    },
    enabled: !!activeHouse?.id && isDono,
  });

  // Processar callback do OAuth
  useEffect(() => {
    const mpCallback = searchParams.get('mp_callback');
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (mpCallback && code && activeHouse?.id && !isProcessingCallback) {
      setIsProcessingCallback(true);
      
      // Limpar params da URL
      searchParams.delete('mp_callback');
      searchParams.delete('code');
      searchParams.delete('state');
      setSearchParams(searchParams, { replace: true });

      // Processar callback
      processCallback(code, state);
    }
  }, [searchParams, activeHouse?.id, isProcessingCallback]);

  const processCallback = async (code: string, state: string | null) => {
    try {
      const { data, error } = await supabase.functions.invoke('mp-oauth-connect', {
        body: {
          action: 'callback',
          house_id: activeHouse?.id,
          code,
          state,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Erro ao conectar conta');
      }

      toast.success('Conta conectada!', {
        description: `Mercado Pago conectado: ${data.mp_email || data.mp_nickname}`,
      });

      refetch();
    } catch (err: any) {
      console.error('Erro no callback:', err);
      toast.error('Erro ao conectar', {
        description: err.message || 'Tente novamente',
      });
    } finally {
      setIsProcessingCallback(false);
    }
  };

  // Mutation para iniciar conexao
  const connectMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('mp-oauth-connect', {
        body: {
          action: 'authorize',
          house_id: activeHouse?.id,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Erro ao gerar link de autorizacao');
      }

      return data.auth_url;
    },
    onSuccess: (authUrl) => {
      // Redirecionar para o Mercado Pago
      window.location.href = authUrl;
    },
    onError: (error: any) => {
      toast.error('Erro ao conectar', {
        description: error.message,
      });
    },
  });

  // Mutation para desconectar
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('mp-oauth-connect', {
        body: {
          action: 'disconnect',
          house_id: activeHouse?.id,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Erro ao desconectar');
      }
    },
    onSuccess: () => {
      toast.success('Conta desconectada');
      queryClient.invalidateQueries({ queryKey: ['mp-connection-status'] });
      setShowDisconnectDialog(false);
    },
    onError: (error: any) => {
      toast.error('Erro ao desconectar', {
        description: error.message,
      });
    },
  });

  // Nao mostrar se nao for dono
  if (!isDono) {
    return null;
  }

  if (isLoading || isProcessingCallback) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          {isProcessingCallback && (
            <span className="ml-2 text-muted-foreground">Conectando conta...</span>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#009ee3]" />
            Mercado Pago - Recebimentos
          </CardTitle>
          <CardDescription>
            Conecte sua conta do Mercado Pago para receber pagamentos diretamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mpStatus?.connected ? (
            // Estado: Conectado
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Conta conectada
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {mpStatus.mp_email || mpStatus.mp_nickname || `ID: ${mpStatus.mp_user_id}`}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Ativo
                </Badge>
              </div>

              {mpStatus.token_expired && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-amber-700 dark:text-amber-300">
                    Token expirado. Reconecte sua conta para continuar recebendo.
                  </span>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                {mpStatus.connected_at && (
                  <p>
                    Conectado em: {format(new Date(mpStatus.connected_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                )}
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row gap-3">
                {mpStatus.token_expired ? (
                  <Button 
                    onClick={() => connectMutation.mutate()}
                    disabled={connectMutation.isPending}
                    className="flex-1"
                  >
                    {connectMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Reconectar
                  </Button>
                ) : (
                  <Button 
                    variant="outline"
                    onClick={() => setShowDisconnectDialog(true)}
                    className="flex-1 text-destructive hover:text-destructive"
                  >
                    <Unlink className="w-4 h-4 mr-2" />
                    Desconectar
                  </Button>
                )}
              </div>
            </div>
          ) : (
            // Estado: Nao conectado
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
                <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm">
                    Ao conectar sua conta do Mercado Pago, voce podera:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Receber pagamentos de cerimonias, cursos e produtos</li>
                    <li>• Ter repasses automaticos para sua conta</li>
                    <li>• Acompanhar vendas diretamente no seu painel MP</li>
                  </ul>
                </div>
              </div>

              <Button 
                onClick={() => connectMutation.mutate()}
                disabled={connectMutation.isPending}
                className="w-full bg-[#009ee3] hover:bg-[#008bcf]"
              >
                {connectMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4 mr-2" />
                )}
                Conectar Mercado Pago
                <ExternalLink className="w-3 h-3 ml-2" />
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Voce sera redirecionado para o Mercado Pago para autorizar a conexao.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmacao para desconectar */}
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Desconectar Mercado Pago?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Ao desconectar, os pagamentos da sua casa nao serao mais direcionados 
                para sua conta do Mercado Pago.
              </p>
              <p className="font-medium">
                Os pagamentos pendentes continuarao sendo processados normalmente.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => disconnectMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={disconnectMutation.isPending}
            >
              {disconnectMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Sim, Desconectar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MercadoPagoConnect;

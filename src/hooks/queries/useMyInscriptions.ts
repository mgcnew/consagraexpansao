import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Dados da cerimônia na inscrição
 */
interface CerimoniaData {
  id: string;
  nome: string | null;
  data: string;
  horario: string;
  local: string;
  medicina_principal: string | null;
}

/**
 * Inscrição do usuário com dados da cerimônia
 */
export interface MyInscription {
  id: string;
  status: 'confirmada' | 'pendente' | 'cancelada';
  pago: boolean;
  data_inscricao: string;
  presenca_confirmada: boolean;
  confirmado_em: string | null;
  cerimonia: CerimoniaData;
}

/**
 * Hook para buscar últimas inscrições do usuário
 * Requirements: 3.1 - Seção Minhas Consagrações
 * 
 * Retorna as últimas inscrições do usuário ordenadas por data da cerimônia
 * (mais recente primeiro) com join em cerimonias.
 */
export const useMyInscriptions = (userId: string | undefined, limit = 3) => {
  return useQuery({
    queryKey: ['my-inscriptions', userId, limit],
    enabled: !!userId,
    queryFn: async (): Promise<MyInscription[]> => {
      const { data, error } = await supabase
        .from('inscricoes')
        .select(`
          id,
          pago,
          data_inscricao,
          presenca_confirmada,
          confirmado_em,
          cerimonias (
            id,
            nome,
            data,
            horario,
            local,
            medicina_principal
          )
        `)
        .eq('user_id', userId!)
        .or('cancelada.is.null,cancelada.eq.false')
        .order('data_inscricao', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Mapear para o formato esperado e determinar status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inscriptions: MyInscription[] = (data || [])
        .filter((item: { cerimonias: unknown }) => item.cerimonias !== null)
        .map((item: { id: string; pago: boolean; data_inscricao: string; presenca_confirmada: boolean; confirmado_em: string | null; cerimonias: unknown }) => {
          // Determinar status baseado no pagamento
          const status: 'confirmada' | 'pendente' | 'cancelada' = item.pago 
            ? 'confirmada' 
            : 'pendente';

          return {
            id: item.id,
            status,
            pago: item.pago,
            data_inscricao: item.data_inscricao,
            presenca_confirmada: item.presenca_confirmada ?? false,
            confirmado_em: item.confirmado_em,
            cerimonia: item.cerimonias as CerimoniaData,
          };
        })
        // Ordenar por data da cerimônia (mais recente primeiro)
        .sort((a: MyInscription, b: MyInscription) => 
          new Date(b.cerimonia.data).getTime() - new Date(a.cerimonia.data).getTime()
        );

      return inscriptions;
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

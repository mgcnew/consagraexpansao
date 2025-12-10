import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Pagamento {
  id: string;
  user_id: string;
  inscricao_id?: string;
  produto_id?: string;
  tipo: 'cerimonia' | 'produto';
  valor_centavos: number;
  descricao: string;
  mp_preference_id?: string;
  mp_payment_id?: string;
  mp_external_reference?: string;
  mp_status?: string;
  mp_status_detail?: string;
  mp_payment_method?: string;
  paid_at?: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

export const usePagamentosAdmin = () => {
  return useQuery({
    queryKey: ['admin-pagamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pagamentos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Buscar profiles separadamente
      const userIds = [...new Set(data?.map(p => p.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return data?.map(p => ({
        ...p,
        profiles: profilesMap.get(p.user_id) || null
      })) as Pagamento[];
    },
  });
};

export const usePagamentosProdutos = () => {
  return useQuery({
    queryKey: ['admin-pagamentos-produtos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pagamentos')
        .select('*')
        .eq('tipo', 'produto')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Buscar profiles separadamente
      const userIds = [...new Set(data?.map(p => p.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return data?.map(p => ({
        ...p,
        profiles: profilesMap.get(p.user_id) || null
      })) as Pagamento[];
    },
  });
};

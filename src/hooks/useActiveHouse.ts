import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ActiveHouse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  about: string | null;
  rules: string | null;
  logo_url: string | null;
  banner_url: string | null;
  banner_dark_url: string | null;
  banner_light_url: string | null;
  tagline: string | null;
  primary_color: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  pix_key: string | null;
  pix_key_type: string | null;
  pix_holder_name: string | null;
  owner_id: string;
  subscription_status: string;
  active: boolean;
}

/**
 * Hook para buscar a casa ativa do usuário logado
 * Busca primeiro como owner, depois como membro
 */
export function useActiveHouse() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['active-house', user?.id],
    queryFn: async (): Promise<ActiveHouse | null> => {
      if (!user?.id) return null;

      // Primeiro, tentar buscar casa onde o usuário é owner
      const { data: ownedHouse } = await supabase
        .from('houses')
        .select('*')
        .eq('owner_id', user.id)
        .eq('active', true)
        .maybeSingle();

      if (ownedHouse) {
        return ownedHouse as ActiveHouse;
      }

      // Se não é owner, buscar como membro
      const { data: membership } = await supabase
        .from('house_members')
        .select(`
          house_id,
          houses (*)
        `)
        .eq('user_id', user.id)
        .eq('active', true)
        .maybeSingle();

      if (membership?.houses) {
        return membership.houses as unknown as ActiveHouse;
      }

      // Se não encontrou nenhuma casa, retorna null
      return null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para atualizar dados da casa
 */
export function useUpdateHouse() {
  const updateHouse = async (houseId: string, data: Partial<ActiveHouse>) => {
    const { error } = await supabase
      .from('houses')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', houseId);

    if (error) throw error;
  };

  return { updateHouse };
}

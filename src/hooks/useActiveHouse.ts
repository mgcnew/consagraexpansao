import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getLastAccessedHouse, setLastAccessedHouse } from './useUserHouses';

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
  trial_ends_at: string | null;
  active: boolean;
}

/**
 * Hook para buscar a casa ativa do usuário logado
 * Respeita a escolha do usuário (localStorage), mas se não tiver escolha, prioriza casa onde é owner
 */
export function useActiveHouse() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['active-house', user?.id],
    queryFn: async (): Promise<ActiveHouse | null> => {
      if (!user?.id) return null;

      // 1. Verificar se há uma casa salva no localStorage (escolha do usuário)
      const lastHouseId = getLastAccessedHouse();

      if (lastHouseId) {
        // Verificar se usuário tem acesso a essa casa
        const { data: savedHouse } = await supabase
          .from('houses')
          .select('*')
          .eq('id', lastHouseId)
          .eq('active', true)
          .maybeSingle();

        if (savedHouse) {
          // Verificar se é owner
          if (savedHouse.owner_id === user.id) {
            return savedHouse as ActiveHouse;
          }

          // Verificar se é membro da equipe
          const { data: membership } = await supabase
            .from('house_members')
            .select('id')
            .eq('house_id', lastHouseId)
            .eq('user_id', user.id)
            .eq('active', true)
            .maybeSingle();

          if (membership) {
            return savedHouse as ActiveHouse;
          }

          // Verificar se é consagrador
          const { data: userHouseLink } = await supabase
            .from('user_houses')
            .select('id')
            .eq('house_id', lastHouseId)
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle();

          if (userHouseLink) {
            return savedHouse as ActiveHouse;
          }
        }
      }

      // 2. Se não tem casa salva ou não tem acesso, buscar casa onde é owner
      const { data: ownedHouse } = await supabase
        .from('houses')
        .select('*')
        .eq('owner_id', user.id)
        .eq('active', true)
        .maybeSingle();

      if (ownedHouse) {
        setLastAccessedHouse(ownedHouse.id);
        return ownedHouse as ActiveHouse;
      }

      // 3. Se não é owner, buscar como membro da equipe
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
        const house = membership.houses as unknown as ActiveHouse;
        setLastAccessedHouse(house.id);
        return house;
      }

      // 4. Se não é membro da equipe, buscar como consagrador
      const { data: userHouse } = await supabase
        .from('user_houses')
        .select(`
          house_id,
          houses (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('joined_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (userHouse?.houses) {
        const house = userHouse.houses as unknown as ActiveHouse;
        setLastAccessedHouse(house.id);
        return house;
      }

      return null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para verificar se o usuário é admin da casa ativa
 * Retorna true se é owner ou tem role admin/facilitator na casa
 */
export function useIsHouseAdmin() {
  const { user } = useAuth();
  const { data: activeHouse } = useActiveHouse();

  return useQuery({
    queryKey: ['is-house-admin', user?.id, activeHouse?.id],
    queryFn: async (): Promise<boolean> => {
      if (!user?.id || !activeHouse?.id) return false;

      // Se é owner, é admin
      if (activeHouse.owner_id === user.id) {
        return true;
      }

      // Verificar role na house_members
      const { data: membership } = await supabase
        .from('house_members')
        .select('role')
        .eq('house_id', activeHouse.id)
        .eq('user_id', user.id)
        .eq('active', true)
        .maybeSingle();

      if (membership?.role) {
        return ['owner', 'admin', 'facilitator'].includes(membership.role);
      }

      return false;
    },
    enabled: !!user?.id && !!activeHouse?.id,
    staleTime: 1000 * 60 * 5,
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

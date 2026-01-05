import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveHouse } from '@/hooks/useActiveHouse';

export interface HouseMember {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  last_seen_at: string | null;
  role?: string;
}

/**
 * Hook para buscar membros da casa atual (para chat)
 * Inclui: dono, equipe e consagradores ativos
 */
export const useHouseMembers = () => {
  const { user } = useAuth();
  const { data: house } = useActiveHouse();

  return useQuery({
    queryKey: ['house-members', house?.id],
    queryFn: async (): Promise<HouseMember[]> => {
      if (!house?.id || !user?.id) return [];

      const members: HouseMember[] = [];
      const addedIds = new Set<string>();

      // 1. Buscar dono da casa
      if (house.owner_id && house.owner_id !== user.id) {
        const { data: owner } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, last_seen_at')
          .eq('id', house.owner_id)
          .single();

        if (owner) {
          members.push({ ...owner, role: 'Dono' });
          addedIds.add(owner.id);
        }
      }

      // 2. Buscar equipe da casa (house_team)
      const { data: team } = await supabase
        .from('house_team')
        .select(`
          user_id,
          role,
          profiles:user_id(id, full_name, avatar_url, last_seen_at)
        `)
        .eq('house_id', house.id);

      if (team) {
        for (const member of team) {
          const profile = member.profiles as unknown as HouseMember;
          if (profile && profile.id !== user.id && !addedIds.has(profile.id)) {
            members.push({
              ...profile,
              role: member.role === 'admin' ? 'Admin' : 'Guardião',
            });
            addedIds.add(profile.id);
          }
        }
      }

      // 3. Buscar consagradores ativos (user_houses)
      const { data: consagradores } = await supabase
        .from('user_houses')
        .select(`
          user_id,
          profiles:user_id(id, full_name, avatar_url, last_seen_at)
        `)
        .eq('house_id', house.id)
        .eq('status', 'active');

      if (consagradores) {
        for (const c of consagradores) {
          const profile = c.profiles as unknown as HouseMember;
          if (profile && profile.id !== user.id && !addedIds.has(profile.id)) {
            members.push({
              ...profile,
              role: 'Consagrador',
            });
            addedIds.add(profile.id);
          }
        }
      }

      // Ordenar: online primeiro, depois por nome
      return members.sort((a, b) => {
        const aOnline = isRecentlyActive(a.last_seen_at);
        const bOnline = isRecentlyActive(b.last_seen_at);
        if (aOnline && !bOnline) return -1;
        if (!aOnline && bOnline) return 1;
        return (a.full_name || '').localeCompare(b.full_name || '');
      });
    },
    enabled: !!house?.id && !!user?.id,
  });
};

function isRecentlyActive(lastSeenAt: string | null): boolean {
  if (!lastSeenAt) return false;
  const diffMinutes = (Date.now() - new Date(lastSeenAt).getTime()) / (1000 * 60);
  return diffMinutes < 5;
}

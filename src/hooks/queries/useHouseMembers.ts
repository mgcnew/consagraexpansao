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

      // 2. Buscar equipe da casa (house_members)
      const { data: team } = await supabase
        .from('house_members')
        .select(`
          user_id,
          role,
          profiles:user_id(id, full_name, avatar_url, last_seen_at)
        `)
        .eq('house_id', house.id)
        .eq('active', true);

      if (team) {
        for (const member of team) {
          // profiles pode vir como objeto ou array dependendo da relação
          const profileData = member.profiles;
          const profile = Array.isArray(profileData) ? profileData[0] : profileData;
          if (profile && profile.id && profile.id !== user.id && !addedIds.has(profile.id)) {
            const roleLabel = 
              member.role === 'owner' ? 'Dono' :
              member.role === 'admin' ? 'Admin' :
              member.role === 'facilitator' ? 'Facilitador' : 'Colaborador';
            members.push({
              id: profile.id,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
              last_seen_at: profile.last_seen_at,
              role: roleLabel,
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
          // profiles pode vir como objeto ou array dependendo da relação
          const profileData = c.profiles;
          const profile = Array.isArray(profileData) ? profileData[0] : profileData;
          if (profile && profile.id && profile.id !== user.id && !addedIds.has(profile.id)) {
            members.push({
              id: profile.id,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
              last_seen_at: profile.last_seen_at,
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

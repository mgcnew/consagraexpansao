import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const LAST_HOUSE_KEY = 'last_accessed_house';

export interface UserHouseInfo {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  role: 'owner' | 'admin' | 'facilitator' | 'collaborator' | 'consagrador';
  source: 'owned' | 'member' | 'consagrador';
}

/**
 * Hook para buscar todas as casas que o usuário tem acesso
 * Inclui casas onde é owner, membro da equipe ou consagrador
 */
export function useUserHouses() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-all-houses', user?.id],
    queryFn: async (): Promise<UserHouseInfo[]> => {
      if (!user?.id) return [];

      const houses: UserHouseInfo[] = [];

      // 1. Casas onde é owner
      const { data: ownedHouses } = await supabase
        .from('houses')
        .select('id, name, slug, logo_url')
        .eq('owner_id', user.id)
        .eq('active', true);

      if (ownedHouses) {
        houses.push(...ownedHouses.map(h => ({
          ...h,
          role: 'owner' as const,
          source: 'owned' as const,
        })));
      }

      // 2. Casas onde é membro da equipe (não owner)
      const { data: memberHouses } = await supabase
        .from('house_members')
        .select(`
          role,
          houses:house_id (id, name, slug, logo_url)
        `)
        .eq('user_id', user.id)
        .eq('active', true)
        .neq('role', 'owner'); // Evitar duplicatas com owned

      if (memberHouses) {
        memberHouses.forEach((m: any) => {
          if (m.houses && !houses.find(h => h.id === m.houses.id)) {
            houses.push({
              id: m.houses.id,
              name: m.houses.name,
              slug: m.houses.slug,
              logo_url: m.houses.logo_url,
              role: m.role,
              source: 'member' as const,
            });
          }
        });
      }

      // 3. Casas onde é consagrador
      const { data: consagradorHouses } = await supabase
        .from('user_houses')
        .select(`
          houses:house_id (id, name, slug, logo_url)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (consagradorHouses) {
        consagradorHouses.forEach((c: any) => {
          if (c.houses && !houses.find(h => h.id === c.houses.id)) {
            houses.push({
              id: c.houses.id,
              name: c.houses.name,
              slug: c.houses.slug,
              logo_url: c.houses.logo_url,
              role: 'consagrador',
              source: 'consagrador' as const,
            });
          }
        });
      }

      return houses;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Salvar última casa acessada
 */
export function setLastAccessedHouse(houseId: string) {
  localStorage.setItem(LAST_HOUSE_KEY, houseId);
}

/**
 * Obter última casa acessada
 */
export function getLastAccessedHouse(): string | null {
  return localStorage.getItem(LAST_HOUSE_KEY);
}

/**
 * Traduzir role para português
 */
export function getRoleLabel(role: UserHouseInfo['role']): string {
  const labels: Record<UserHouseInfo['role'], string> = {
    owner: 'Dono',
    admin: 'Administrador',
    facilitator: 'Facilitador',
    collaborator: 'Colaborador',
    consagrador: 'Consagrador',
  };
  return labels[role] || role;
}

/**
 * Cor do badge por role
 */
export function getRoleBadgeColor(role: UserHouseInfo['role']): string {
  const colors: Record<UserHouseInfo['role'], string> = {
    owner: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    facilitator: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    collaborator: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    consagrador: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  };
  return colors[role] || colors.consagrador;
}

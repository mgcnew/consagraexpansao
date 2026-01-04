import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export interface House {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  about: string | null;
  rules: string | null;
  logo_url: string | null;
  banner_url: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  cep: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  owner_id: string;
  plan_id: string | null;
  subscription_status: string;
  visibility: string;
  verified: boolean;
  rating_avg: number;
  rating_count: number;
  active: boolean;
  // Dados PIX
  pix_key: string | null;
  pix_key_type: string | null;
  pix_holder_name: string | null;
}

export type HouseRole = 'owner' | 'admin' | 'facilitator' | 'collaborator' | 'member' | null;

interface HouseContextType {
  // Casa atual
  house: House | null;
  isLoading: boolean;
  error: string | null;
  
  // Papel do usuário na casa
  userHouseRole: HouseRole;
  isHouseOwner: boolean;
  isHouseAdmin: boolean;
  isHouseMember: boolean;
  
  // Ações
  setHouseBySlug: (slug: string) => Promise<void>;
  clearHouse: () => void;
  refreshHouse: () => Promise<void>;
  
  // Helpers
  getHouseUrl: (path?: string) => string;
}

const HouseContext = createContext<HouseContextType | undefined>(undefined);

export const HouseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [house, setHouse] = useState<House | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userHouseRole, setUserHouseRole] = useState<HouseRole>(null);

  // Buscar casa pelo slug
  const setHouseBySlug = useCallback(async (slug: string) => {
    if (!slug) {
      setHouse(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('houses')
        .select('*')
        .eq('slug', slug)
        .eq('active', true)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError('Casa não encontrada');
        } else {
          setError('Erro ao carregar casa');
        }
        setHouse(null);
        return;
      }

      setHouse(data as House);
    } catch (err) {
      setError('Erro ao carregar casa');
      setHouse(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Verificar papel do usuário na casa
  const checkUserRole = useCallback(async () => {
    if (!user || !house) {
      setUserHouseRole(null);
      return;
    }

    try {
      // Verificar se é owner
      if (house.owner_id === user.id) {
        setUserHouseRole('owner');
        return;
      }

      // Verificar se é membro da equipe
      const { data: memberData } = await supabase
        .from('house_members')
        .select('role')
        .eq('house_id', house.id)
        .eq('user_id', user.id)
        .eq('active', true)
        .single();

      if (memberData) {
        setUserHouseRole(memberData.role as HouseRole);
        return;
      }

      // Verificar se é membro (consagrador vinculado)
      const { data: userHouseData } = await supabase
        .from('user_houses')
        .select('status')
        .eq('house_id', house.id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (userHouseData) {
        setUserHouseRole('member');
        return;
      }

      setUserHouseRole(null);
    } catch (err) {
      setUserHouseRole(null);
    }
  }, [user, house]);

  // Atualizar papel quando user ou house mudar
  useEffect(() => {
    checkUserRole();
  }, [checkUserRole]);

  // Limpar casa
  const clearHouse = useCallback(() => {
    setHouse(null);
    setError(null);
    setUserHouseRole(null);
  }, []);

  // Recarregar dados da casa
  const refreshHouse = useCallback(async () => {
    if (house?.slug) {
      await setHouseBySlug(house.slug);
    }
  }, [house?.slug, setHouseBySlug]);

  // Helper para gerar URLs da casa
  const getHouseUrl = useCallback((path?: string) => {
    if (!house) return '/';
    const basePath = `/casa/${house.slug}`;
    return path ? `${basePath}${path}` : basePath;
  }, [house]);

  // Computed values
  const isHouseOwner = userHouseRole === 'owner';
  const isHouseAdmin = userHouseRole === 'owner' || userHouseRole === 'admin';
  const isHouseMember = userHouseRole !== null;

  return (
    <HouseContext.Provider
      value={{
        house,
        isLoading,
        error,
        userHouseRole,
        isHouseOwner,
        isHouseAdmin,
        isHouseMember,
        setHouseBySlug,
        clearHouse,
        refreshHouse,
        getHouseUrl,
      }}
    >
      {children}
    </HouseContext.Provider>
  );
};

export const useHouse = () => {
  const context = useContext(HouseContext);
  if (context === undefined) {
    throw new Error('useHouse must be used within a HouseProvider');
  }
  return context;
};

// Hook para sincronizar com a URL
export const useHouseFromUrl = () => {
  const { slug } = useParams<{ slug: string }>();
  const { house, setHouseBySlug, isLoading, error } = useHouse();

  useEffect(() => {
    if (slug && slug !== house?.slug) {
      setHouseBySlug(slug);
    }
  }, [slug, house?.slug, setHouseBySlug]);

  return { house, isLoading, error, slug };
};

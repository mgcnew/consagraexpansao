import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Profile, Anamnese } from '@/types';

/**
 * Hook para buscar todos os perfis (Admin)
 * Requirements: 6.2
 */
export const useProfiles = () => {
  return useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

/**
 * Hook para buscar todas as anamneses (Admin)
 * Requirements: 6.2
 */
export const useAnamneses = () => {
  return useQuery({
    queryKey: ['admin-anamneses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('anamneses')
        .select('*');
      if (error) throw error;
      return data as Anamnese[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

/**
 * Hook para buscar anamnese de um usuário específico
 * Requirements: 6.2
 */
export const useUserAnamnese = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['anamnese', userId],
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutos
    queryFn: async () => {
      const { data, error } = await supabase
        .from('anamneses')
        .select('*')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data as Anamnese | null;
    },
  });
};

/**
 * Hook para buscar perfil do usuário atual
 */
export const useMeuPerfil = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['meu-perfil', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as Profile | null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isRoleChecked: boolean;
  isAdmin: boolean;
  isGuardiao: boolean;
  userRole: string;
  signUp: (email: string, password: string, nomeCompleto: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRoleChecked, setIsRoleChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGuardiao, setIsGuardiao] = useState(false);
  const [userRole, setUserRole] = useState('consagrador');

  const checkUserRole = async (userId: string) => {
    try {
      // Check for super_admin (portal admin)
      const { data: isSuperAdminData } = await supabase.rpc('is_super_admin', {
        check_user_id: userId,
      });

      // Check for guardiao in any house
      const { data: isGuardiaoData } = await supabase.rpc('has_role', {
        required_role: 'guardiao',
      });

      const adminRole = isSuperAdminData ?? false;
      const guardiaoRole = isGuardiaoData ?? false;

      setIsAdmin(adminRole);
      setIsGuardiao(guardiaoRole);

      let role = 'consagrador';
      if (adminRole) {
        role = 'admin';
      } else if (guardiaoRole) {
        role = 'guardiao';
      }
      setUserRole(role);
    } catch (error) {
      console.error('Error checking user role:', error);
      setIsAdmin(false);
      setIsGuardiao(false);
      setUserRole('consagrador');
    } finally {
      setIsRoleChecked(true);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        if (session?.user) {
          setIsRoleChecked(false);
          setTimeout(() => {
            checkUserRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsGuardiao(false);
          setUserRole('consagrador');
          setIsRoleChecked(true);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      if (session?.user) {
        checkUserRole(session.user.id);
      } else {
        setIsRoleChecked(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Lidar com convites pendentes após login
  useEffect(() => {
    const handlePendingInvite = async () => {
      if (!user?.id) return;

      const inviteSlug = localStorage.getItem('invite_house_slug');
      if (!inviteSlug) return;

      try {
        // Buscar a casa pelo slug
        const { data: house, error: houseError } = await supabase
          .from('houses')
          .select('id, name, slug')
          .eq('slug', inviteSlug)
          .eq('active', true)
          .single();

        if (houseError || !house) {
          localStorage.removeItem('invite_house_slug');
          return;
        }

        // Verificar se já é membro
        const { data: existingMember } = await supabase
          .from('house_members')
          .select('id')
          .eq('house_id', house.id)
          .eq('user_id', user.id)
          .single();

        if (existingMember) {
          localStorage.removeItem('invite_house_slug');
          toast.success('Bem-vindo de volta!', {
            description: `Redirecionando para ${house.name}...`,
          });
          setTimeout(() => {
            window.location.href = `/casa/${house.slug}`;
          }, 1000);
          return;
        }

        // Adicionar como membro da casa
        const { error: memberError } = await supabase
          .from('house_members')
          .insert({
            house_id: house.id,
            user_id: user.id,
            role: 'member',
            status: 'active',
          });

        if (memberError) {
          console.error('Erro ao vincular usuário:', memberError);
          return;
        }

        localStorage.removeItem('invite_house_slug');
        
        toast.success('Bem-vindo!', {
          description: `Você agora faz parte de ${house.name}`,
        });

        setTimeout(() => {
          window.location.href = `/casa/${house.slug}`;
        }, 1000);

      } catch (error) {
        console.error('Erro ao processar convite:', error);
        localStorage.removeItem('invite_house_slug');
      }
    };

    handlePendingInvite();
  }, [user?.id]);

  const signUp = async (email: string, password: string, nomeCompleto: string) => {
    const redirectUrl = `${import.meta.env.VITE_APP_URL || window.location.origin}/app`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          nome_completo: nomeCompleto,
        },
      },
    });

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${import.meta.env.VITE_APP_URL || window.location.origin}/auth/callback`,
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    // Limpar cache de role
    if (user?.id) {
      localStorage.removeItem(`user_role_${user.id}`);
    }
    
    // Limpar estado local primeiro
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setIsGuardiao(false);
    setUserRole('consagrador');
    
    // Fazer logout no Supabase
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isRoleChecked,
        isAdmin,
        isGuardiao,
        userRole,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook para lidar com convites pendentes após login
 * Verifica se há um slug de casa salvo no localStorage e vincula o usuário
 */
export const useInviteHandler = (userId: string | undefined) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handlePendingInvite = async () => {
      if (!userId) return;

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
          toast.error('Casa não encontrada', {
            description: 'O convite pode ter expirado ou a casa foi removida.',
          });
          localStorage.removeItem('invite_house_slug');
          return;
        }

        // Verificar se já é membro
        const { data: existingMember } = await supabase
          .from('house_members')
          .select('id')
          .eq('house_id', house.id)
          .eq('user_id', userId)
          .single();

        if (existingMember) {
          // Já é membro, apenas redireciona
          localStorage.removeItem('invite_house_slug');
          toast.success('Bem-vindo de volta!', {
            description: `Redirecionando para ${house.name}...`,
          });
          navigate(`/casa/${house.slug}`);
          return;
        }

        // Adicionar como membro da casa
        const { error: memberError } = await supabase
          .from('house_members')
          .insert({
            house_id: house.id,
            user_id: userId,
            role: 'member',
            status: 'active',
          });

        if (memberError) {
          console.error('Erro ao vincular usuário:', memberError);
          toast.error('Erro ao entrar na casa', {
            description: 'Tente novamente mais tarde.',
          });
          return;
        }

        // Limpar o localStorage e redirecionar
        localStorage.removeItem('invite_house_slug');
        
        toast.success('Bem-vindo!', {
          description: `Você agora faz parte de ${house.name}`,
        });

        // Redirecionar para a casa
        setTimeout(() => {
          navigate(`/casa/${house.slug}`);
        }, 1000);

      } catch (error) {
        console.error('Erro ao processar convite:', error);
        localStorage.removeItem('invite_house_slug');
      }
    };

    handlePendingInvite();
  }, [userId, navigate]);
};

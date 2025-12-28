-- Drop the old FK pointing to auth.users
ALTER TABLE public.inscricoes_cursos
DROP CONSTRAINT IF EXISTS inscricoes_cursos_user_id_fkey;

-- Create new FK pointing to profiles
ALTER TABLE public.inscricoes_cursos
ADD CONSTRAINT inscricoes_cursos_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;;

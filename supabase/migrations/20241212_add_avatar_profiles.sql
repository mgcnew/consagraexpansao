-- Adicionar campo de avatar/foto no profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Criar bucket para avatares se não existir (executar no Storage do Supabase)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

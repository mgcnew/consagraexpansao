-- Remover FK antiga que aponta para auth.users
ALTER TABLE materiais DROP CONSTRAINT IF EXISTS materiais_autor_id_fkey;

-- Criar FK nova apontando para profiles
ALTER TABLE materiais
ADD CONSTRAINT materiais_autor_id_fkey
FOREIGN KEY (autor_id) REFERENCES profiles(id) ON DELETE SET NULL;;

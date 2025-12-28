-- Adicionar campos para especificar tipo de bloqueio
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bloqueado_cerimonias boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bloqueado_cursos boolean DEFAULT false;

-- Migrar dados existentes: se bloqueado=true, bloquear em ambos
UPDATE profiles
SET bloqueado_cerimonias = true, bloqueado_cursos = true
WHERE bloqueado = true;;

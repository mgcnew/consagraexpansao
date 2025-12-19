-- Adicionar campos de bloqueio na tabela profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bloqueado boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bloqueado_em timestamp with time zone,
ADD COLUMN IF NOT EXISTS bloqueado_por uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS motivo_bloqueio text;

-- Adicionar novas permissões
INSERT INTO permissoes (nome, descricao, categoria) VALUES
('bloquear_consagradores', 'Bloquear e desbloquear consagradores de participar de cerimônias', 'consagradores'),
('excluir_consagradores', 'Excluir consagradores do sistema', 'consagradores')
ON CONFLICT (nome) DO NOTHING;

-- Comentários para documentação
COMMENT ON COLUMN profiles.bloqueado IS 'Se o consagrador está bloqueado de participar de cerimônias';
COMMENT ON COLUMN profiles.bloqueado_em IS 'Data/hora do bloqueio';
COMMENT ON COLUMN profiles.bloqueado_por IS 'ID do admin que bloqueou';
COMMENT ON COLUMN profiles.motivo_bloqueio IS 'Motivo do bloqueio informado pelo admin';

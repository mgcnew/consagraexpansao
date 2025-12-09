-- Migration: add_observacoes_admin_to_inscricoes
-- Adiciona coluna para observações do administrador sobre cada consagração
-- Requirements: 2.2

ALTER TABLE inscricoes 
ADD COLUMN IF NOT EXISTS observacoes_admin TEXT;

-- Comentário na coluna para documentação
COMMENT ON COLUMN inscricoes.observacoes_admin IS 'Observações do administrador sobre a consagração do participante';

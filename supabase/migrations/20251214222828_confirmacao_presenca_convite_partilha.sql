-- =====================================================
-- Confirmação de Presença e Convite para Partilhar
-- =====================================================

-- Adicionar campos de confirmação de presença na tabela inscricoes
ALTER TABLE inscricoes 
ADD COLUMN IF NOT EXISTS presenca_confirmada BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS confirmado_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS compareceu BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS convite_partilha_enviado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS convite_partilha_enviado_em TIMESTAMP WITH TIME ZONE;

-- Comentários
COMMENT ON COLUMN inscricoes.presenca_confirmada IS 'Se o usuário confirmou que vai comparecer';
COMMENT ON COLUMN inscricoes.confirmado_em IS 'Data/hora da confirmação de presença';
COMMENT ON COLUMN inscricoes.compareceu IS 'Se o usuário realmente compareceu (NULL=pendente, TRUE=compareceu, FALSE=faltou)';
COMMENT ON COLUMN inscricoes.convite_partilha_enviado IS 'Se já foi enviado convite para partilhar';
COMMENT ON COLUMN inscricoes.convite_partilha_enviado_em IS 'Quando o convite foi enviado';;

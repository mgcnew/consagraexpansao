-- Adicionar campos para cancelamento de inscrição pelo admin
ALTER TABLE inscricoes
ADD COLUMN IF NOT EXISTS cancelada boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS cancelada_em timestamp with time zone,
ADD COLUMN IF NOT EXISTS cancelada_por uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS motivo_cancelamento text;

-- Comentários
COMMENT ON COLUMN inscricoes.cancelada IS 'Se a inscrição foi cancelada';
COMMENT ON COLUMN inscricoes.cancelada_em IS 'Data/hora do cancelamento';
COMMENT ON COLUMN inscricoes.cancelada_por IS 'ID do admin que cancelou';
COMMENT ON COLUMN inscricoes.motivo_cancelamento IS 'Motivo do cancelamento informado pelo admin';

-- Índice para filtrar inscrições ativas
CREATE INDEX IF NOT EXISTS idx_inscricoes_cancelada ON inscricoes(cancelada) WHERE cancelada = false;;

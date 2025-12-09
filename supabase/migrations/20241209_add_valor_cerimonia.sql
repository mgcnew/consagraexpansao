-- Adicionar coluna valor na tabela cerimonias
-- Armazena o valor em centavos para evitar problemas com decimais

ALTER TABLE cerimonias 
ADD COLUMN IF NOT EXISTS valor INTEGER DEFAULT 0;

-- Comentário explicativo
COMMENT ON COLUMN cerimonias.valor IS 'Valor da cerimônia em centavos (ex: 15000 = R$ 150,00)';

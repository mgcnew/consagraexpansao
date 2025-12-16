-- Tabela de configuração de taxas do Mercado Pago
-- Esta tabela foi criada via MCP e já existe no banco

-- Estrutura da tabela:
-- CREATE TABLE IF NOT EXISTS config_taxas_mp (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   forma_pagamento TEXT UNIQUE NOT NULL,
--   nome_exibicao TEXT NOT NULL,
--   taxa_percentual NUMERIC DEFAULT 0,
--   parcelas INTEGER DEFAULT 1,
--   ativo BOOLEAN DEFAULT true,
--   ordem INTEGER DEFAULT 0,
--   created_at TIMESTAMPTZ DEFAULT now(),
--   updated_at TIMESTAMPTZ DEFAULT now()
-- );

-- Dados padrão inseridos:
-- PIX: 1%
-- Débito: 3%
-- Crédito à vista: 9%
-- Crédito 2x: 13%
-- Crédito 3x: 16%

-- Atualização da constraint de tipo de pagamento para incluir 'curso'
-- ALTER TABLE pagamentos DROP CONSTRAINT IF EXISTS pagamentos_tipo_check;
-- ALTER TABLE pagamentos ADD CONSTRAINT pagamentos_tipo_check CHECK (tipo IN ('cerimonia', 'produto', 'curso'));

-- RLS para config_taxas_mp
ALTER TABLE config_taxas_mp ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (todos podem ver as taxas)
DROP POLICY IF EXISTS "Taxas MP são públicas para leitura" ON config_taxas_mp;
CREATE POLICY "Taxas MP são públicas para leitura" ON config_taxas_mp
  FOR SELECT USING (true);

-- Política de escrita apenas para admins
DROP POLICY IF EXISTS "Apenas admins podem modificar taxas MP" ON config_taxas_mp;
CREATE POLICY "Apenas admins podem modificar taxas MP" ON config_taxas_mp
  FOR ALL USING (is_admin());

-- Tabela para configurar taxas do Mercado Pago
CREATE TABLE IF NOT EXISTS config_taxas_mp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forma_pagamento TEXT NOT NULL UNIQUE,
  nome_exibicao TEXT NOT NULL,
  taxa_percentual DECIMAL(5,2) NOT NULL DEFAULT 0,
  parcelas INTEGER DEFAULT 1,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir taxas padrão
INSERT INTO config_taxas_mp (forma_pagamento, nome_exibicao, taxa_percentual, parcelas, ativo, ordem) VALUES
  ('pix', 'PIX', 1.00, 1, true, 1),
  ('debito', 'Débito', 3.00, 1, true, 2),
  ('credito_vista', 'Crédito à vista', 9.00, 1, true, 3),
  ('credito_2x', 'Crédito 2x', 13.00, 2, true, 4),
  ('credito_3x', 'Crédito 3x', 16.00, 3, true, 5)
ON CONFLICT (forma_pagamento) DO NOTHING;

-- RLS
ALTER TABLE config_taxas_mp ENABLE ROW LEVEL SECURITY;

-- Todos podem ler (para exibir no checkout)
CREATE POLICY "config_taxas_mp_select" ON config_taxas_mp
  FOR SELECT USING (true);

-- Apenas admins podem modificar
CREATE POLICY "config_taxas_mp_admin" ON config_taxas_mp
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_permissoes up
      JOIN permissoes p ON up.permissao_id = p.id
      WHERE up.user_id = auth.uid() AND p.nome = 'admin'
    )
  );;

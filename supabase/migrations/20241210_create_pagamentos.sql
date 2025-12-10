-- =====================================================
-- Tabela de Pagamentos - Integração Mercado Pago
-- =====================================================

CREATE TABLE IF NOT EXISTS pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referência ao que está sendo pago
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inscricao_id UUID REFERENCES inscricoes(id) ON DELETE SET NULL,
  produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
  
  -- Dados do pagamento
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('cerimonia', 'produto')),
  valor_centavos INTEGER NOT NULL,
  descricao TEXT,
  
  -- Dados do Mercado Pago
  mp_preference_id VARCHAR(100),
  mp_payment_id VARCHAR(100),
  mp_status VARCHAR(50) DEFAULT 'pending',
  mp_status_detail VARCHAR(100),
  mp_payment_method VARCHAR(50),
  mp_external_reference VARCHAR(100),
  
  -- Metadados
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pagamentos_user_id ON pagamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_inscricao_id ON pagamentos(inscricao_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_mp_preference_id ON pagamentos(mp_preference_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_mp_payment_id ON pagamentos(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_mp_external_reference ON pagamentos(mp_external_reference);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(mp_status);

-- RLS
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;

-- Usuário pode ver seus próprios pagamentos
CREATE POLICY "Users can read own pagamentos" ON pagamentos
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Usuário pode criar seus próprios pagamentos
CREATE POLICY "Users can create own pagamentos" ON pagamentos
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Apenas sistema (service_role) pode atualizar pagamentos (via webhook)
-- Admins podem ver todos
CREATE POLICY "Admins can read all pagamentos" ON pagamentos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissoes up
      JOIN permissoes p ON up.permissao_id = p.id
      WHERE up.user_id = auth.uid() 
      AND p.nome IN ('super_admin', 'ver_financeiro')
    )
  );

-- Grants
GRANT SELECT, INSERT ON pagamentos TO authenticated;
GRANT ALL ON pagamentos TO service_role;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_pagamentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pagamentos_updated_at ON pagamentos;
CREATE TRIGGER trigger_pagamentos_updated_at
  BEFORE UPDATE ON pagamentos
  FOR EACH ROW
  EXECUTE FUNCTION update_pagamentos_updated_at();

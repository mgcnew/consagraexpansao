-- Adicionar campos de reconciliação às transações financeiras
ALTER TABLE transacoes_financeiras 
ADD COLUMN IF NOT EXISTS reconciliada BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reconciliada_em TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reconciliada_por UUID REFERENCES auth.users(id);

-- Índice para filtrar transações reconciliadas
CREATE INDEX IF NOT EXISTS idx_transacoes_reconciliada ON transacoes_financeiras(reconciliada);

-- Tabela de fechamentos mensais
CREATE TABLE IF NOT EXISTS fechamentos_mensais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL,
  total_entradas INTEGER NOT NULL DEFAULT 0, -- em centavos
  total_saidas INTEGER NOT NULL DEFAULT 0, -- em centavos
  saldo INTEGER NOT NULL DEFAULT 0, -- em centavos
  total_transacoes INTEGER NOT NULL DEFAULT 0,
  transacoes_reconciliadas INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_revisao', 'fechado')),
  observacoes TEXT,
  fechado_em TIMESTAMPTZ,
  fechado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mes, ano)
);

-- RLS
ALTER TABLE fechamentos_mensais ENABLE ROW LEVEL SECURITY;

-- Apenas super_admin pode gerenciar fechamentos
CREATE POLICY "Super admin gerencia fechamentos mensais"
  ON fechamentos_mensais FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissoes up
      JOIN permissoes p ON up.permissao_id = p.id
      WHERE up.user_id = auth.uid() AND p.nome = 'super_admin'
    )
  );

-- Índices
CREATE INDEX IF NOT EXISTS idx_fechamentos_periodo ON fechamentos_mensais(ano, mes);
CREATE INDEX IF NOT EXISTS idx_fechamentos_status ON fechamentos_mensais(status);

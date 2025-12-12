-- Metas Financeiras (para acompanhamento de objetivos)
CREATE TABLE IF NOT EXISTS metas_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'economia', 'reducao_despesa')),
  valor_meta INTEGER NOT NULL, -- em centavos
  valor_atual INTEGER DEFAULT 0, -- em centavos (calculado)
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL,
  categoria_id UUID REFERENCES categorias_financeiras(id),
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(nome, mes, ano)
);

-- RLS
ALTER TABLE metas_financeiras ENABLE ROW LEVEL SECURITY;

-- Apenas super_admin pode gerenciar metas
CREATE POLICY "Super admin gerencia metas financeiras"
  ON metas_financeiras FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissoes up
      JOIN permissoes p ON up.permissao_id = p.id
      WHERE up.user_id = auth.uid() AND p.nome = 'super_admin'
    )
  );

-- Índices
CREATE INDEX IF NOT EXISTS idx_metas_financeiras_periodo ON metas_financeiras(ano, mes);
CREATE INDEX IF NOT EXISTS idx_metas_financeiras_ativo ON metas_financeiras(ativo);

-- Configurações de alertas financeiros
CREATE TABLE IF NOT EXISTS config_alertas_financeiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('saldo_baixo', 'meta_atingida', 'despesa_alta')),
  valor_limite INTEGER, -- em centavos
  percentual_limite INTEGER, -- para metas (ex: 80% = alerta quando atingir 80%)
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE config_alertas_financeiros ENABLE ROW LEVEL SECURITY;

-- Apenas super_admin pode gerenciar alertas
CREATE POLICY "Super admin gerencia config alertas"
  ON config_alertas_financeiros FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissoes up
      JOIN permissoes p ON up.permissao_id = p.id
      WHERE up.user_id = auth.uid() AND p.nome = 'super_admin'
    )
  );

-- Inserir configuração padrão de alerta de saldo baixo
INSERT INTO config_alertas_financeiros (tipo, valor_limite, ativo)
VALUES ('saldo_baixo', 100000, true) -- R$ 1.000,00
ON CONFLICT DO NOTHING;

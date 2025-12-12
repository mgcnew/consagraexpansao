-- Despesas Recorrentes (para projeção de gastos)
CREATE TABLE IF NOT EXISTS despesas_recorrentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria_id UUID REFERENCES categorias_financeiras(id),
  valor INTEGER NOT NULL, -- em centavos
  dia_vencimento INTEGER CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
  ativo BOOLEAN DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE despesas_recorrentes ENABLE ROW LEVEL SECURITY;

-- Apenas super_admin pode gerenciar
CREATE POLICY "Super admin gerencia despesas recorrentes"
  ON despesas_recorrentes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissoes up
      JOIN permissoes p ON up.permissao_id = p.id
      WHERE up.user_id = auth.uid() AND p.nome = 'super_admin'
    )
  );

-- Índice
CREATE INDEX IF NOT EXISTS idx_despesas_recorrentes_ativo ON despesas_recorrentes(ativo);

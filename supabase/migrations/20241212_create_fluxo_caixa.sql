-- Categorias de transações financeiras
CREATE TABLE IF NOT EXISTS categorias_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  cor TEXT DEFAULT '#6b7280',
  icone TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transações financeiras (entradas e saídas)
CREATE TABLE IF NOT EXISTS transacoes_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  categoria_id UUID REFERENCES categorias_financeiras(id),
  descricao TEXT NOT NULL,
  valor INTEGER NOT NULL, -- em centavos
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  forma_pagamento TEXT,
  referencia_tipo TEXT, -- 'inscricao', 'produto', 'curso', 'manual'
  referencia_id UUID,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_transacoes_data ON transacoes_financeiras(data);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON transacoes_financeiras(tipo);
CREATE INDEX IF NOT EXISTS idx_transacoes_categoria ON transacoes_financeiras(categoria_id);
CREATE INDEX IF NOT EXISTS idx_categorias_tipo ON categorias_financeiras(tipo);

-- RLS
ALTER TABLE categorias_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes_financeiras ENABLE ROW LEVEL SECURITY;

-- Apenas super_admin pode ver/gerenciar categorias
CREATE POLICY "Super admin gerencia categorias financeiras"
  ON categorias_financeiras FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissoes up
      JOIN permissoes p ON up.permissao_id = p.id
      WHERE up.user_id = auth.uid() AND p.nome = 'super_admin'
    )
  );

-- Apenas super_admin pode ver/gerenciar transações
CREATE POLICY "Super admin gerencia transacoes"
  ON transacoes_financeiras FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissoes up
      JOIN permissoes p ON up.permissao_id = p.id
      WHERE up.user_id = auth.uid() AND p.nome = 'super_admin'
    )
  );

-- Inserir categorias padrão
INSERT INTO categorias_financeiras (nome, tipo, cor, icone) VALUES
  ('Cerimônias', 'entrada', '#22c55e', 'calendar'),
  ('Cursos/Eventos', 'entrada', '#3b82f6', 'graduation-cap'),
  ('Loja', 'entrada', '#f59e0b', 'shopping-bag'),
  ('Doações', 'entrada', '#ec4899', 'heart'),
  ('Outros (Entrada)', 'entrada', '#6b7280', 'plus-circle'),
  ('Aluguel', 'saida', '#ef4444', 'home'),
  ('Energia', 'saida', '#f97316', 'zap'),
  ('Água', 'saida', '#06b6d4', 'droplet'),
  ('Internet', 'saida', '#8b5cf6', 'wifi'),
  ('Materiais', 'saida', '#84cc16', 'package'),
  ('Alimentação', 'saida', '#f59e0b', 'utensils'),
  ('Transporte', 'saida', '#6366f1', 'car'),
  ('Manutenção', 'saida', '#78716c', 'wrench'),
  ('Outros (Saída)', 'saida', '#6b7280', 'minus-circle')
ON CONFLICT DO NOTHING;

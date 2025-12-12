-- Anexos de Transações Financeiras (comprovantes, notas fiscais, recibos)
CREATE TABLE IF NOT EXISTS anexos_transacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transacao_id UUID NOT NULL REFERENCES transacoes_financeiras(id) ON DELETE CASCADE,
  nome_arquivo TEXT NOT NULL,
  url TEXT NOT NULL,
  tipo_arquivo TEXT, -- 'image/jpeg', 'application/pdf', etc
  tamanho INTEGER, -- em bytes
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- RLS
ALTER TABLE anexos_transacoes ENABLE ROW LEVEL SECURITY;

-- Apenas super_admin pode gerenciar anexos
CREATE POLICY "Super admin gerencia anexos transacoes"
  ON anexos_transacoes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissoes up
      JOIN permissoes p ON up.permissao_id = p.id
      WHERE up.user_id = auth.uid() AND p.nome = 'super_admin'
    )
  );

-- Índice
CREATE INDEX IF NOT EXISTS idx_anexos_transacoes_transacao ON anexos_transacoes(transacao_id);

-- Storage bucket para comprovantes financeiros
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprovantes', 'comprovantes', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para comprovantes
CREATE POLICY "Comprovantes são públicos para leitura"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'comprovantes');

CREATE POLICY "Super admin pode fazer upload de comprovantes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'comprovantes' AND
    EXISTS (
      SELECT 1 FROM user_permissoes up
      JOIN permissoes p ON up.permissao_id = p.id
      WHERE up.user_id = auth.uid() AND p.nome = 'super_admin'
    )
  );

CREATE POLICY "Super admin pode deletar comprovantes"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'comprovantes' AND
    EXISTS (
      SELECT 1 FROM user_permissoes up
      JOIN permissoes p ON up.permissao_id = p.id
      WHERE up.user_id = auth.uid() AND p.nome = 'super_admin'
    )
  );

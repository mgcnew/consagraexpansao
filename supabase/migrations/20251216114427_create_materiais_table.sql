-- Tabela de materiais/estudos pós-consagração
CREATE TABLE IF NOT EXISTS materiais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  resumo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  imagem_url TEXT,
  categoria TEXT NOT NULL DEFAULT 'geral',
  publicado BOOLEAN DEFAULT false,
  destaque BOOLEAN DEFAULT false,
  autor_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_materiais_publicado ON materiais(publicado);
CREATE INDEX IF NOT EXISTS idx_materiais_categoria ON materiais(categoria);
CREATE INDEX IF NOT EXISTS idx_materiais_destaque ON materiais(destaque);
CREATE INDEX IF NOT EXISTS idx_materiais_created_at ON materiais(created_at DESC);

-- RLS
ALTER TABLE materiais ENABLE ROW LEVEL SECURITY;

-- Políticas: todos podem ler materiais publicados
CREATE POLICY "materiais_select_publicados" ON materiais
  FOR SELECT USING (publicado = true);

-- Admins podem ver todos (incluindo rascunhos)
CREATE POLICY "materiais_select_admin" ON materiais
  FOR SELECT USING (is_admin());

-- Admins podem inserir/atualizar/deletar
CREATE POLICY "materiais_insert_admin" ON materiais
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "materiais_update_admin" ON materiais
  FOR UPDATE USING (is_admin());

CREATE POLICY "materiais_delete_admin" ON materiais
  FOR DELETE USING (is_admin());

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_materiais_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_materiais_updated_at
  BEFORE UPDATE ON materiais
  FOR EACH ROW
  EXECUTE FUNCTION update_materiais_updated_at();

-- Criar bucket de storage para imagens dos materiais
INSERT INTO storage.buckets (id, name, public)
VALUES ('materiais', 'materiais', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
CREATE POLICY "materiais_storage_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'materiais');

CREATE POLICY "materiais_storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'materiais' AND (SELECT is_admin()));

CREATE POLICY "materiais_storage_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'materiais' AND (SELECT is_admin()));;

-- Tabela de ebooks pessoais do usuário (uploads próprios)
CREATE TABLE IF NOT EXISTS ebooks_pessoais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  autor VARCHAR(255),
  capa_url TEXT,
  arquivo_url TEXT NOT NULL,
  tipo_arquivo VARCHAR(20) NOT NULL, -- pdf, docx, doc
  tamanho_bytes BIGINT,
  pagina_atual INTEGER DEFAULT 1,
  progresso DECIMAL(5,2) DEFAULT 0,
  ultima_leitura TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ebooks_pessoais_user ON ebooks_pessoais(user_id);

-- RLS
ALTER TABLE ebooks_pessoais ENABLE ROW LEVEL SECURITY;

-- Políticas - usuário só vê e gerencia seus próprios ebooks
CREATE POLICY "Usuarios veem seus ebooks pessoais" ON ebooks_pessoais
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Usuarios podem inserir ebooks pessoais" ON ebooks_pessoais
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios podem atualizar seus ebooks pessoais" ON ebooks_pessoais
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Usuarios podem deletar seus ebooks pessoais" ON ebooks_pessoais
  FOR DELETE USING (user_id = auth.uid());

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_ebooks_pessoais_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ebooks_pessoais_updated_at
  BEFORE UPDATE ON ebooks_pessoais
  FOR EACH ROW
  EXECUTE FUNCTION update_ebooks_pessoais_updated_at();

-- Melhorias na Biblioteca de Ebooks

-- Adicionar campo de capa_url na tabela ebooks_pessoais (se não existir)
-- O campo já existe, então vamos criar as tabelas de anotações e favoritos

-- Tabela de Favoritos/Marcadores de páginas
CREATE TABLE IF NOT EXISTS ebook_marcadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ebook_pessoal_id UUID REFERENCES ebooks_pessoais(id) ON DELETE CASCADE,
  biblioteca_id UUID REFERENCES biblioteca_usuario(id) ON DELETE CASCADE,
  pagina INTEGER NOT NULL,
  titulo TEXT, -- título opcional do marcador
  cor TEXT DEFAULT '#fbbf24', -- cor do marcador (amarelo padrão)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT ebook_marcador_check CHECK (
    (ebook_pessoal_id IS NOT NULL AND biblioteca_id IS NULL) OR
    (ebook_pessoal_id IS NULL AND biblioteca_id IS NOT NULL)
  )
);

-- Tabela de Anotações
CREATE TABLE IF NOT EXISTS ebook_anotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ebook_pessoal_id UUID REFERENCES ebooks_pessoais(id) ON DELETE CASCADE,
  biblioteca_id UUID REFERENCES biblioteca_usuario(id) ON DELETE CASCADE,
  pagina INTEGER,
  texto TEXT NOT NULL,
  trecho_selecionado TEXT, -- texto que foi selecionado (se houver)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT ebook_anotacao_check CHECK (
    (ebook_pessoal_id IS NOT NULL AND biblioteca_id IS NULL) OR
    (ebook_pessoal_id IS NULL AND biblioteca_id IS NOT NULL)
  )
);

-- Tabela de Configurações de Leitura do Usuário
CREATE TABLE IF NOT EXISTS ebook_config_leitura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tema TEXT DEFAULT 'sepia' CHECK (tema IN ('light', 'sepia', 'dark')),
  tamanho_fonte INTEGER DEFAULT 18 CHECK (tamanho_fonte >= 12 AND tamanho_fonte <= 32),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para marcadores
ALTER TABLE ebook_marcadores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário gerencia próprios marcadores"
  ON ebook_marcadores FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- RLS para anotações
ALTER TABLE ebook_anotacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário gerencia próprias anotações"
  ON ebook_anotacoes FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- RLS para config de leitura
ALTER TABLE ebook_config_leitura ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário gerencia própria config de leitura"
  ON ebook_config_leitura FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Índices
CREATE INDEX IF NOT EXISTS idx_ebook_marcadores_user ON ebook_marcadores(user_id);
CREATE INDEX IF NOT EXISTS idx_ebook_marcadores_pessoal ON ebook_marcadores(ebook_pessoal_id);
CREATE INDEX IF NOT EXISTS idx_ebook_marcadores_biblioteca ON ebook_marcadores(biblioteca_id);

CREATE INDEX IF NOT EXISTS idx_ebook_anotacoes_user ON ebook_anotacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_ebook_anotacoes_pessoal ON ebook_anotacoes(ebook_pessoal_id);
CREATE INDEX IF NOT EXISTS idx_ebook_anotacoes_biblioteca ON ebook_anotacoes(biblioteca_id);

-- Storage bucket para capas de ebooks (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('ebook-capas', 'ebook-capas', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para capas
CREATE POLICY "Capas de ebooks são públicas"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'ebook-capas');

CREATE POLICY "Usuário pode fazer upload de capas"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ebook-capas');

CREATE POLICY "Usuário pode deletar próprias capas"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'ebook-capas');

-- Migration: create_galeria
-- Cria tabela e storage para galeria de fotos e vídeos
-- Permissões: todos podem ver, apenas admin e guardião podem editar

-- Tabela de mídias da galeria
CREATE TABLE IF NOT EXISTS galeria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cerimonia_id UUID REFERENCES cerimonias(id) ON DELETE SET NULL,
  titulo TEXT,
  descricao TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('foto', 'video')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_galeria_cerimonia ON galeria(cerimonia_id);
CREATE INDEX IF NOT EXISTS idx_galeria_created_at ON galeria(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_galeria_tipo ON galeria(tipo);

-- Comentários
COMMENT ON TABLE galeria IS 'Galeria de fotos e vídeos das cerimônias';
COMMENT ON COLUMN galeria.tipo IS 'Tipo de mídia: foto ou video';
COMMENT ON COLUMN galeria.url IS 'URL do arquivo no Supabase Storage';
COMMENT ON COLUMN galeria.thumbnail_url IS 'URL da miniatura (para vídeos)';

-- Habilitar RLS
ALTER TABLE galeria ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para verificar se usuário é admin ou guardião
CREATE OR REPLACE FUNCTION is_admin_or_guardiao()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.role IN ('admin', 'guardiao')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas RLS para galeria

-- SELECT: Todos os usuários autenticados podem ver
CREATE POLICY "galeria_select_authenticated"
  ON galeria FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Apenas admin e guardião podem inserir
CREATE POLICY "galeria_insert_admin_guardiao"
  ON galeria FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_guardiao());

-- UPDATE: Apenas admin e guardião podem atualizar
CREATE POLICY "galeria_update_admin_guardiao"
  ON galeria FOR UPDATE
  TO authenticated
  USING (is_admin_or_guardiao())
  WITH CHECK (is_admin_or_guardiao());

-- DELETE: Apenas admin e guardião podem deletar
CREATE POLICY "galeria_delete_admin_guardiao"
  ON galeria FOR DELETE
  TO authenticated
  USING (is_admin_or_guardiao());

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_galeria_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER galeria_updated_at
  BEFORE UPDATE ON galeria
  FOR EACH ROW
  EXECUTE FUNCTION update_galeria_updated_at();

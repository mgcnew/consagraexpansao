-- Tabela de curtidas em materiais
CREATE TABLE materiais_curtidas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES materiais(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(material_id, user_id)
);

-- Tabela de comentários em materiais
CREATE TABLE materiais_comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES materiais(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  texto text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_materiais_curtidas_material ON materiais_curtidas(material_id);
CREATE INDEX idx_materiais_curtidas_user ON materiais_curtidas(user_id);
CREATE INDEX idx_materiais_comentarios_material ON materiais_comentarios(material_id);
CREATE INDEX idx_materiais_comentarios_created ON materiais_comentarios(created_at DESC);

-- RLS para curtidas
ALTER TABLE materiais_curtidas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver todas as curtidas"
  ON materiais_curtidas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem curtir materiais"
  ON materiais_curtidas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover própria curtida"
  ON materiais_curtidas FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS para comentários
ALTER TABLE materiais_comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver todos os comentários"
  ON materiais_comentarios FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem criar comentários"
  ON materiais_comentarios FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar próprios comentários"
  ON materiais_comentarios FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar próprios comentários"
  ON materiais_comentarios FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins podem deletar qualquer comentário
CREATE POLICY "Admins podem deletar comentários"
  ON materiais_comentarios FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.role IN ('admin', 'guardiao')
    )
    OR
    EXISTS (
      SELECT 1 FROM user_permissoes up
      JOIN permissoes p ON up.permissao_id = p.id
      WHERE up.user_id = auth.uid()
      AND p.nome = 'super_admin'
    )
  );;

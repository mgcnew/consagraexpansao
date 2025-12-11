-- Tabela de ebooks
CREATE TABLE IF NOT EXISTS ebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  autor VARCHAR(255),
  descricao TEXT,
  capa_url TEXT,
  arquivo_url TEXT NOT NULL,
  preco INTEGER NOT NULL DEFAULT 0, -- em centavos
  preco_promocional INTEGER,
  paginas INTEGER,
  categoria VARCHAR(100),
  ativo BOOLEAN DEFAULT true,
  destaque BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de compras de ebooks (biblioteca do usuário)
CREATE TABLE IF NOT EXISTS ebooks_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ebook_id UUID NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
  pagamento_id UUID REFERENCES pagamentos(id),
  pagina_atual INTEGER DEFAULT 1,
  progresso DECIMAL(5,2) DEFAULT 0,
  ultima_leitura TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ebook_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ebooks_ativo ON ebooks(ativo);
CREATE INDEX IF NOT EXISTS idx_ebooks_destaque ON ebooks(destaque);
CREATE INDEX IF NOT EXISTS idx_ebooks_usuarios_user ON ebooks_usuarios(user_id);
CREATE INDEX IF NOT EXISTS idx_ebooks_usuarios_ebook ON ebooks_usuarios(ebook_id);

-- RLS
ALTER TABLE ebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ebooks_usuarios ENABLE ROW LEVEL SECURITY;

-- Políticas para ebooks (todos podem ver ativos)
CREATE POLICY "Ebooks ativos são públicos" ON ebooks
  FOR SELECT USING (ativo = true);

CREATE POLICY "Admins podem gerenciar ebooks" ON ebooks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.role IN ('admin', 'super_admin')
    )
  );

-- Políticas para ebooks_usuarios (usuário vê apenas seus)
CREATE POLICY "Usuários veem seus ebooks" ON ebooks_usuarios
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Usuários podem atualizar progresso" ON ebooks_usuarios
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Sistema pode inserir compras" ON ebooks_usuarios
  FOR INSERT WITH CHECK (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_ebooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ebooks_updated_at
  BEFORE UPDATE ON ebooks
  FOR EACH ROW
  EXECUTE FUNCTION update_ebooks_updated_at();

-- Adicionar campos de ebook na tabela produtos
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS arquivo_url TEXT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS paginas INTEGER;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS is_ebook BOOLEAN DEFAULT false;

-- Criar tabela de biblioteca do usuário (produtos digitais comprados)
CREATE TABLE IF NOT EXISTS biblioteca_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  pagamento_id UUID REFERENCES pagamentos(id),
  pagina_atual INTEGER DEFAULT 1,
  progresso DECIMAL(5,2) DEFAULT 0,
  ultima_leitura TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, produto_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_biblioteca_usuario_user ON biblioteca_usuario(user_id);
CREATE INDEX IF NOT EXISTS idx_biblioteca_usuario_produto ON biblioteca_usuario(produto_id);
CREATE INDEX IF NOT EXISTS idx_produtos_is_ebook ON produtos(is_ebook);

-- RLS
ALTER TABLE biblioteca_usuario ENABLE ROW LEVEL SECURITY;

-- Políticas para biblioteca_usuario
CREATE POLICY "Usuarios veem sua biblioteca" ON biblioteca_usuario
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Usuarios podem atualizar progresso" ON biblioteca_usuario
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Sistema pode inserir na biblioteca" ON biblioteca_usuario
  FOR INSERT WITH CHECK (true);

-- Remover tabelas antigas de ebooks se existirem (vamos usar produtos)
DROP TABLE IF EXISTS ebooks_usuarios CASCADE;
DROP TABLE IF EXISTS ebooks CASCADE;

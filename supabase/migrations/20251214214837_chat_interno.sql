-- =============================================
-- CHAT INTERNO - Tabelas e Políticas
-- =============================================

-- Tabela de conversas
CREATE TABLE IF NOT EXISTS conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participante_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participante_2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ultima_mensagem_at TIMESTAMPTZ DEFAULT now(),
  ultima_mensagem_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(participante_1, participante_2)
);

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id UUID NOT NULL REFERENCES conversas(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_conversas_participante_1 ON conversas(participante_1);
CREATE INDEX IF NOT EXISTS idx_conversas_participante_2 ON conversas(participante_2);
CREATE INDEX IF NOT EXISTS idx_conversas_ultima_mensagem ON conversas(ultima_mensagem_at DESC);
CREATE INDEX IF NOT EXISTS idx_mensagens_conversa ON mensagens(conversa_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_created ON mensagens(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mensagens_nao_lidas ON mensagens(conversa_id, lida) WHERE lida = false;

-- Habilitar RLS
ALTER TABLE conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;

-- Políticas para conversas
CREATE POLICY "Usuarios veem suas conversas"
  ON conversas FOR SELECT
  USING (auth.uid() = participante_1 OR auth.uid() = participante_2);

CREATE POLICY "Usuarios podem criar conversas"
  ON conversas FOR INSERT
  WITH CHECK (auth.uid() = participante_1 OR auth.uid() = participante_2);

CREATE POLICY "Usuarios podem atualizar suas conversas"
  ON conversas FOR UPDATE
  USING (auth.uid() = participante_1 OR auth.uid() = participante_2);

-- Políticas para mensagens
CREATE POLICY "Usuarios veem mensagens de suas conversas"
  ON mensagens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversas
      WHERE conversas.id = mensagens.conversa_id
      AND (conversas.participante_1 = auth.uid() OR conversas.participante_2 = auth.uid())
    )
  );

CREATE POLICY "Usuarios podem enviar mensagens em suas conversas"
  ON mensagens FOR INSERT
  WITH CHECK (
    auth.uid() = autor_id
    AND EXISTS (
      SELECT 1 FROM conversas
      WHERE conversas.id = conversa_id
      AND (conversas.participante_1 = auth.uid() OR conversas.participante_2 = auth.uid())
    )
  );

CREATE POLICY "Usuarios podem marcar mensagens como lidas"
  ON mensagens FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversas
      WHERE conversas.id = mensagens.conversa_id
      AND (conversas.participante_1 = auth.uid() OR conversas.participante_2 = auth.uid())
    )
  );

-- Habilitar Realtime para as tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE conversas;
ALTER PUBLICATION supabase_realtime ADD TABLE mensagens;

-- Função para atualizar ultima_mensagem_at na conversa
CREATE OR REPLACE FUNCTION update_conversa_ultima_mensagem()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversas
  SET 
    ultima_mensagem_at = NEW.created_at,
    ultima_mensagem_preview = LEFT(NEW.conteudo, 100)
  WHERE id = NEW.conversa_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar conversa quando nova mensagem é enviada
DROP TRIGGER IF EXISTS on_new_message ON mensagens;
CREATE TRIGGER on_new_message
  AFTER INSERT ON mensagens
  FOR EACH ROW
  EXECUTE FUNCTION update_conversa_ultima_mensagem();

-- Função para obter ou criar conversa entre dois usuários
CREATE OR REPLACE FUNCTION get_or_create_conversa(user_1 UUID, user_2 UUID)
RETURNS UUID AS $$
DECLARE
  conversa_id UUID;
  p1 UUID;
  p2 UUID;
BEGIN
  -- Ordenar IDs para garantir consistência
  IF user_1 < user_2 THEN
    p1 := user_1;
    p2 := user_2;
  ELSE
    p1 := user_2;
    p2 := user_1;
  END IF;
  
  -- Tentar encontrar conversa existente
  SELECT id INTO conversa_id
  FROM conversas
  WHERE (participante_1 = p1 AND participante_2 = p2)
     OR (participante_1 = p2 AND participante_2 = p1);
  
  -- Se não existe, criar
  IF conversa_id IS NULL THEN
    INSERT INTO conversas (participante_1, participante_2)
    VALUES (p1, p2)
    RETURNING id INTO conversa_id;
  END IF;
  
  RETURN conversa_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;;

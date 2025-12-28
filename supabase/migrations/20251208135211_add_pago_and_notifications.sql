-- Adicionar coluna 'pago' na tabela inscricoes
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS pago boolean DEFAULT false;

-- Criar tabela de notificações para admins
CREATE TABLE IF NOT EXISTS notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  titulo text NOT NULL,
  mensagem text NOT NULL,
  dados jsonb,
  lida boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS na tabela de notificações
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Política para admins lerem notificações
CREATE POLICY "Admins can read notificacoes" ON notificacoes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.role = 'admin'
  )
);

-- Política para admins atualizarem notificações (marcar como lida)
CREATE POLICY "Admins can update notificacoes" ON notificacoes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.role = 'admin'
  )
);

-- Permitir inserção de notificações (sistema)
CREATE POLICY "System can insert notificacoes" ON notificacoes
FOR INSERT
WITH CHECK (true);

-- Função para criar notificação quando nova inscrição é feita
CREATE OR REPLACE FUNCTION notify_new_inscricao()
RETURNS TRIGGER AS $$
DECLARE
  user_name text;
  ceremony_name text;
BEGIN
  -- Buscar nome do usuário
  SELECT full_name INTO user_name FROM profiles WHERE id = NEW.user_id;
  
  -- Buscar nome da cerimônia
  SELECT COALESCE(nome, medicina_principal, 'Cerimônia') INTO ceremony_name FROM cerimonias WHERE id = NEW.cerimonia_id;
  
  -- Inserir notificação
  INSERT INTO notificacoes (tipo, titulo, mensagem, dados)
  VALUES (
    'nova_inscricao',
    'Nova Inscrição',
    COALESCE(user_name, 'Usuário') || ' se inscreveu em ' || ceremony_name,
    jsonb_build_object(
      'user_id', NEW.user_id,
      'cerimonia_id', NEW.cerimonia_id,
      'inscricao_id', NEW.id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para disparar notificação em nova inscrição
DROP TRIGGER IF EXISTS on_new_inscricao ON inscricoes;
CREATE TRIGGER on_new_inscricao
AFTER INSERT ON inscricoes
FOR EACH ROW
EXECUTE FUNCTION notify_new_inscricao();

-- Política para admin atualizar status de pagamento
CREATE POLICY "Admins can update inscricoes" ON inscricoes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.role = 'admin'
  )
);;

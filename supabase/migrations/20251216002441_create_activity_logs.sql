-- Tabela de logs de atividades do sistema
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver logs
CREATE POLICY "Admins can view all logs" ON activity_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.role = 'admin'
    )
  );

-- Sistema pode inserir logs (via service role)
CREATE POLICY "System can insert logs" ON activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Função para registrar log automaticamente
CREATE OR REPLACE FUNCTION log_activity(
  p_user_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT '{}'
) RETURNS uuid AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_user_id, p_action, p_entity_type, p_entity_id, p_details)
  RETURNING id INTO v_log_id;
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers para log automático de ações importantes

-- Log de inscrições em cerimônias
CREATE OR REPLACE FUNCTION log_inscricao_cerimonia() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      NEW.user_id,
      'inscricao_cerimonia',
      'inscricoes',
      NEW.id,
      jsonb_build_object('cerimonia_id', NEW.cerimonia_id, 'forma_pagamento', NEW.forma_pagamento)
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_activity(
      OLD.user_id,
      'cancelamento_inscricao',
      'inscricoes',
      OLD.id,
      jsonb_build_object('cerimonia_id', OLD.cerimonia_id)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_inscricao ON inscricoes;
CREATE TRIGGER trigger_log_inscricao
  AFTER INSERT OR DELETE ON inscricoes
  FOR EACH ROW EXECUTE FUNCTION log_inscricao_cerimonia();

-- Log de pagamentos
CREATE OR REPLACE FUNCTION log_pagamento() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      NEW.user_id,
      'pagamento_criado',
      'pagamentos',
      NEW.id,
      jsonb_build_object('tipo', NEW.tipo, 'valor', NEW.valor_centavos, 'status', NEW.mp_status)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.mp_status IS DISTINCT FROM NEW.mp_status THEN
    PERFORM log_activity(
      NEW.user_id,
      'pagamento_atualizado',
      'pagamentos',
      NEW.id,
      jsonb_build_object('status_anterior', OLD.mp_status, 'status_novo', NEW.mp_status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_pagamento ON pagamentos;
CREATE TRIGGER trigger_log_pagamento
  AFTER INSERT OR UPDATE ON pagamentos
  FOR EACH ROW EXECUTE FUNCTION log_pagamento();

-- Log de cerimônias
CREATE OR REPLACE FUNCTION log_cerimonia() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      auth.uid(),
      'cerimonia_criada',
      'cerimonias',
      NEW.id,
      jsonb_build_object('nome', NEW.nome, 'data', NEW.data)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_activity(
      auth.uid(),
      'cerimonia_atualizada',
      'cerimonias',
      NEW.id,
      jsonb_build_object('nome', NEW.nome, 'data', NEW.data)
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_activity(
      auth.uid(),
      'cerimonia_excluida',
      'cerimonias',
      OLD.id,
      jsonb_build_object('nome', OLD.nome)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_cerimonia ON cerimonias;
CREATE TRIGGER trigger_log_cerimonia
  AFTER INSERT OR UPDATE OR DELETE ON cerimonias
  FOR EACH ROW EXECUTE FUNCTION log_cerimonia();

-- Log de depoimentos
CREATE OR REPLACE FUNCTION log_depoimento() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      NEW.user_id,
      'depoimento_criado',
      'depoimentos',
      NEW.id,
      jsonb_build_object('cerimonia_id', NEW.cerimonia_id)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.aprovado IS DISTINCT FROM NEW.aprovado AND NEW.aprovado = true THEN
    PERFORM log_activity(
      NEW.approved_by,
      'depoimento_aprovado',
      'depoimentos',
      NEW.id,
      jsonb_build_object('user_id', NEW.user_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_depoimento ON depoimentos;
CREATE TRIGGER trigger_log_depoimento
  AFTER INSERT OR UPDATE ON depoimentos
  FOR EACH ROW EXECUTE FUNCTION log_depoimento();

-- Log de anamneses
CREATE OR REPLACE FUNCTION log_anamnese() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      NEW.user_id,
      'anamnese_preenchida',
      'anamneses',
      NEW.id,
      jsonb_build_object('nome', NEW.nome_completo)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_activity(
      NEW.user_id,
      'anamnese_atualizada',
      'anamneses',
      NEW.id,
      jsonb_build_object('nome', NEW.nome_completo)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_anamnese ON anamneses;
CREATE TRIGGER trigger_log_anamnese
  AFTER INSERT OR UPDATE ON anamneses
  FOR EACH ROW EXECUTE FUNCTION log_anamnese();

-- Log de produtos
CREATE OR REPLACE FUNCTION log_produto() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      auth.uid(),
      'produto_criado',
      'produtos',
      NEW.id,
      jsonb_build_object('nome', NEW.nome, 'preco', NEW.preco)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_activity(
      auth.uid(),
      'produto_atualizado',
      'produtos',
      NEW.id,
      jsonb_build_object('nome', NEW.nome)
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_activity(
      auth.uid(),
      'produto_excluido',
      'produtos',
      OLD.id,
      jsonb_build_object('nome', OLD.nome)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_produto ON produtos;
CREATE TRIGGER trigger_log_produto
  AFTER INSERT OR UPDATE OR DELETE ON produtos
  FOR EACH ROW EXECUTE FUNCTION log_produto();;

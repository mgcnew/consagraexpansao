-- Função genérica para log de atividades
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
  v_user_id UUID;
  v_entity_id UUID;
  v_details JSONB;
BEGIN
  -- Determinar ação
  IF TG_OP = 'INSERT' THEN
    v_action := TG_ARGV[0] || '_criado';
    v_entity_id := NEW.id;
    v_user_id := COALESCE(NEW.user_id, auth.uid());
    v_details := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := TG_ARGV[0] || '_atualizado';
    v_entity_id := NEW.id;
    v_user_id := COALESCE(NEW.user_id, auth.uid());
    v_details := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    v_action := TG_ARGV[0] || '_excluido';
    v_entity_id := OLD.id;
    v_user_id := COALESCE(OLD.user_id, auth.uid());
    v_details := to_jsonb(OLD);
  END IF;

  -- Inserir log
  INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
  VALUES (v_user_id, v_action, TG_TABLE_NAME, v_entity_id, v_details);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para inscrições em cerimônias
DROP TRIGGER IF EXISTS log_inscricoes_activity ON inscricoes;
CREATE TRIGGER log_inscricoes_activity
  AFTER INSERT OR DELETE ON inscricoes
  FOR EACH ROW EXECUTE FUNCTION log_activity('inscricao_cerimonia');

-- Trigger para pagamentos
DROP TRIGGER IF EXISTS log_pagamentos_activity ON pagamentos;
CREATE TRIGGER log_pagamentos_activity
  AFTER INSERT OR UPDATE ON pagamentos
  FOR EACH ROW EXECUTE FUNCTION log_activity('pagamento');

-- Trigger para cerimônias
DROP TRIGGER IF EXISTS log_cerimonias_activity ON cerimonias;
CREATE TRIGGER log_cerimonias_activity
  AFTER INSERT OR UPDATE OR DELETE ON cerimonias
  FOR EACH ROW EXECUTE FUNCTION log_activity('cerimonia');

-- Trigger para depoimentos/partilhas
DROP TRIGGER IF EXISTS log_depoimentos_activity ON depoimentos;
CREATE TRIGGER log_depoimentos_activity
  AFTER INSERT OR UPDATE ON depoimentos
  FOR EACH ROW EXECUTE FUNCTION log_activity('depoimento');

-- Trigger para anamneses
DROP TRIGGER IF EXISTS log_anamneses_activity ON anamneses;
CREATE TRIGGER log_anamneses_activity
  AFTER INSERT OR UPDATE ON anamneses
  FOR EACH ROW EXECUTE FUNCTION log_activity('anamnese');

-- Trigger para produtos
DROP TRIGGER IF EXISTS log_produtos_activity ON produtos;
CREATE TRIGGER log_produtos_activity
  AFTER INSERT OR UPDATE OR DELETE ON produtos
  FOR EACH ROW EXECUTE FUNCTION log_activity('produto');

-- Trigger para cursos/eventos
DROP TRIGGER IF EXISTS log_cursos_activity ON cursos_eventos;
CREATE TRIGGER log_cursos_activity
  AFTER INSERT OR UPDATE OR DELETE ON cursos_eventos
  FOR EACH ROW EXECUTE FUNCTION log_activity('curso');

-- Trigger para inscrições em cursos
DROP TRIGGER IF EXISTS log_inscricoes_cursos_activity ON inscricoes_cursos;
CREATE TRIGGER log_inscricoes_cursos_activity
  AFTER INSERT OR DELETE ON inscricoes_cursos
  FOR EACH ROW EXECUTE FUNCTION log_activity('inscricao_curso');

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);;

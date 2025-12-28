-- Corrigir trigger para anamneses (usar nome_completo da própria tabela)
CREATE OR REPLACE FUNCTION log_anamnese()
RETURNS TRIGGER AS $$
DECLARE
  v_details JSONB;
  v_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'anamnese_criado';
    v_details := jsonb_build_object(
      'nome_completo', COALESCE(NEW.nome_completo, get_user_name(NEW.user_id))
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.user_id, v_action, 'anamneses', NEW.id, v_details);
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'anamnese_atualizado';
    v_details := jsonb_build_object(
      'nome_completo', COALESCE(NEW.nome_completo, get_user_name(NEW.user_id))
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.user_id, v_action, 'anamneses', NEW.id, v_details);
    
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar trigger
DROP TRIGGER IF EXISTS trigger_log_anamnese ON anamneses;
CREATE TRIGGER trigger_log_anamnese
  AFTER INSERT OR UPDATE ON anamneses
  FOR EACH ROW EXECUTE FUNCTION log_anamnese();;

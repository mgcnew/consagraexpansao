-- Corrigir trigger para pagamentos (usar valor_centavos e mp_status)
CREATE OR REPLACE FUNCTION log_pagamento()
RETURNS TRIGGER AS $$
DECLARE
  v_details JSONB;
  v_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'pagamento_criado';
    v_details := jsonb_build_object(
      'nome_completo', get_user_name(NEW.user_id),
      'valor', ROUND(NEW.valor_centavos / 100.0, 2),
      'status', NEW.mp_status
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.user_id, v_action, 'pagamentos', NEW.id, v_details);
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.mp_status IS DISTINCT FROM NEW.mp_status THEN
      v_action := 'pagamento_atualizado';
      v_details := jsonb_build_object(
        'nome_completo', get_user_name(NEW.user_id),
        'valor', ROUND(NEW.valor_centavos / 100.0, 2),
        'status', NEW.mp_status,
        'status_anterior', OLD.mp_status
      );
      
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
      VALUES (NEW.user_id, v_action, 'pagamentos', NEW.id, v_details);
    END IF;
    
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar trigger de pagamentos
DROP TRIGGER IF EXISTS trigger_log_pagamento ON pagamentos;
CREATE TRIGGER trigger_log_pagamento
  AFTER INSERT OR UPDATE ON pagamentos
  FOR EACH ROW EXECUTE FUNCTION log_pagamento();

-- Corrigir trigger para depoimentos (usar 'aprovado' boolean)
CREATE OR REPLACE FUNCTION log_depoimento()
RETURNS TRIGGER AS $$
DECLARE
  v_details JSONB;
  v_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'depoimento_criado';
    v_details := jsonb_build_object(
      'nome_completo', get_user_name(NEW.user_id),
      'texto', LEFT(NEW.texto, 100)
    ) || get_cerimonia_info(NEW.cerimonia_id);
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.user_id, v_action, 'depoimentos', NEW.id, v_details);
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'depoimento_atualizado';
    v_details := jsonb_build_object(
      'nome_completo', get_user_name(NEW.user_id),
      'aprovado', NEW.aprovado
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.user_id, v_action, 'depoimentos', NEW.id, v_details);
    
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar trigger de depoimentos
DROP TRIGGER IF EXISTS trigger_log_depoimento ON depoimentos;
CREATE TRIGGER trigger_log_depoimento
  AFTER INSERT OR UPDATE ON depoimentos
  FOR EACH ROW EXECUTE FUNCTION log_depoimento();;

-- Corrigir função auxiliar para obter dados da cerimônia (usar 'nome' ao invés de 'titulo')
CREATE OR REPLACE FUNCTION get_cerimonia_info(p_cerimonia_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_info JSONB;
BEGIN
  SELECT jsonb_build_object(
    'cerimonia_titulo', nome,
    'cerimonia_data', data
  ) INTO v_info
  FROM cerimonias
  WHERE id = p_cerimonia_id;
  RETURN COALESCE(v_info, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Corrigir trigger para cerimônias (usar 'nome' ao invés de 'titulo')
CREATE OR REPLACE FUNCTION log_cerimonia()
RETURNS TRIGGER AS $$
DECLARE
  v_details JSONB;
  v_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'cerimonia_criado';
    v_details := jsonb_build_object(
      'cerimonia_titulo', NEW.nome,
      'cerimonia_data', NEW.data
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), v_action, 'cerimonias', NEW.id, v_details);
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'cerimonia_atualizado';
    v_details := jsonb_build_object(
      'cerimonia_titulo', NEW.nome,
      'cerimonia_data', NEW.data
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), v_action, 'cerimonias', NEW.id, v_details);
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'cerimonia_excluido';
    v_details := jsonb_build_object(
      'cerimonia_titulo', OLD.nome,
      'cerimonia_data', OLD.data
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), v_action, 'cerimonias', OLD.id, v_details);
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar o trigger
DROP TRIGGER IF EXISTS trigger_log_cerimonia ON cerimonias;
CREATE TRIGGER trigger_log_cerimonia
  AFTER INSERT OR UPDATE OR DELETE ON cerimonias
  FOR EACH ROW EXECUTE FUNCTION log_cerimonia();;

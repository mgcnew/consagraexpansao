-- Corrigir função auxiliar para obter dados do curso (usar 'nome' ao invés de 'titulo')
CREATE OR REPLACE FUNCTION get_curso_info(p_curso_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_info JSONB;
BEGIN
  SELECT jsonb_build_object(
    'curso_titulo', nome,
    'curso_data', data_inicio
  ) INTO v_info
  FROM cursos_eventos
  WHERE id = p_curso_id;
  RETURN COALESCE(v_info, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Corrigir trigger para cursos (usar 'nome' ao invés de 'titulo')
CREATE OR REPLACE FUNCTION log_curso()
RETURNS TRIGGER AS $$
DECLARE
  v_details JSONB;
  v_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'curso_criado';
    v_details := jsonb_build_object(
      'curso_titulo', NEW.nome,
      'curso_data', NEW.data_inicio
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), v_action, 'cursos', NEW.id, v_details);
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'curso_atualizado';
    v_details := jsonb_build_object(
      'curso_titulo', NEW.nome,
      'curso_data', NEW.data_inicio
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), v_action, 'cursos', NEW.id, v_details);
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'curso_excluido';
    v_details := jsonb_build_object(
      'curso_titulo', OLD.nome,
      'curso_data', OLD.data_inicio
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), v_action, 'cursos', OLD.id, v_details);
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar o trigger
DROP TRIGGER IF EXISTS trigger_log_curso ON cursos_eventos;
CREATE TRIGGER trigger_log_curso
  AFTER INSERT OR UPDATE OR DELETE ON cursos_eventos
  FOR EACH ROW EXECUTE FUNCTION log_curso();;

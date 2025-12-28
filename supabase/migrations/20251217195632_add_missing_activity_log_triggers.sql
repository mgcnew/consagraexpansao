-- Trigger para materiais (estudos)
CREATE OR REPLACE FUNCTION log_material()
RETURNS TRIGGER AS $$
DECLARE
  v_details JSONB;
  v_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'material_criado';
    v_details := jsonb_build_object(
      'titulo', NEW.titulo,
      'categoria', NEW.categoria
    );
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.autor_id, v_action, 'materiais', NEW.id, v_details);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'material_atualizado';
    v_details := jsonb_build_object(
      'titulo', NEW.titulo,
      'categoria', NEW.categoria
    );
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.autor_id, v_action, 'materiais', NEW.id, v_details);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'material_excluido';
    v_details := jsonb_build_object(
      'titulo', OLD.titulo,
      'categoria', OLD.categoria
    );
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (OLD.autor_id, v_action, 'materiais', OLD.id, v_details);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_material ON materiais;
CREATE TRIGGER trigger_log_material
  AFTER INSERT OR UPDATE OR DELETE ON materiais
  FOR EACH ROW EXECUTE FUNCTION log_material();

-- Trigger para user_roles (mudanças de permissão)
CREATE OR REPLACE FUNCTION log_user_role()
RETURNS TRIGGER AS $$
DECLARE
  v_details JSONB;
  v_action TEXT;
  v_role_name TEXT;
  v_user_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT role INTO v_role_name FROM roles WHERE id = NEW.role_id;
    SELECT full_name INTO v_user_name FROM profiles WHERE id = NEW.user_id;
    v_action := 'role_atribuido';
    v_details := jsonb_build_object(
      'nome_completo', COALESCE(v_user_name, 'Usuário'),
      'role', COALESCE(v_role_name, 'desconhecido')
    );
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), v_action, 'user_roles', NEW.id, v_details);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT role INTO v_role_name FROM roles WHERE id = OLD.role_id;
    SELECT full_name INTO v_user_name FROM profiles WHERE id = OLD.user_id;
    v_action := 'role_removido';
    v_details := jsonb_build_object(
      'nome_completo', COALESCE(v_user_name, 'Usuário'),
      'role', COALESCE(v_role_name, 'desconhecido')
    );
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), v_action, 'user_roles', OLD.id, v_details);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_user_role ON user_roles;
CREATE TRIGGER trigger_log_user_role
  AFTER INSERT OR DELETE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION log_user_role();

-- Trigger para diário
CREATE OR REPLACE FUNCTION log_diario()
RETURNS TRIGGER AS $$
DECLARE
  v_details JSONB;
  v_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'diario_criado';
    v_details := jsonb_build_object(
      'nome_completo', get_user_name(NEW.user_id),
      'data', NEW.data
    );
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.user_id, v_action, 'diario', NEW.id, v_details);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_diario ON diario;
CREATE TRIGGER trigger_log_diario
  AFTER INSERT ON diario
  FOR EACH ROW EXECUTE FUNCTION log_diario();

-- Trigger para biblioteca_usuario (compras de ebooks)
CREATE OR REPLACE FUNCTION log_biblioteca()
RETURNS TRIGGER AS $$
DECLARE
  v_details JSONB;
  v_action TEXT;
  v_produto_nome TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT nome INTO v_produto_nome FROM produtos WHERE id = NEW.produto_id;
    v_action := 'ebook_adquirido';
    v_details := jsonb_build_object(
      'nome_completo', get_user_name(NEW.user_id),
      'produto_nome', COALESCE(v_produto_nome, 'Ebook')
    );
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.user_id, v_action, 'biblioteca_usuario', NEW.id, v_details);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_biblioteca ON biblioteca_usuario;
CREATE TRIGGER trigger_log_biblioteca
  AFTER INSERT ON biblioteca_usuario
  FOR EACH ROW EXECUTE FUNCTION log_biblioteca();;

-- Trigger para profiles (novos usuários e atualizações)
CREATE OR REPLACE FUNCTION log_profile()
RETURNS TRIGGER AS $$
DECLARE
  v_details JSONB;
  v_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'usuario_criado';
    v_details := jsonb_build_object(
      'nome_completo', NEW.full_name
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.id, v_action, 'profiles', NEW.id, v_details);
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'usuario_atualizado';
    v_details := jsonb_build_object(
      'nome_completo', NEW.full_name
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.id, v_action, 'profiles', NEW.id, v_details);
    
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_profile ON profiles;
CREATE TRIGGER trigger_log_profile
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION log_profile();

-- Trigger para lista de espera
CREATE OR REPLACE FUNCTION log_lista_espera()
RETURNS TRIGGER AS $$
DECLARE
  v_details JSONB;
  v_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'lista_espera_criado';
    v_details := jsonb_build_object(
      'nome_completo', get_user_name(NEW.user_id),
      'posicao', NEW.posicao
    ) || get_cerimonia_info(NEW.cerimonia_id);
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.user_id, v_action, 'lista_espera', NEW.id, v_details);
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'lista_espera_excluido';
    v_details := jsonb_build_object(
      'nome_completo', get_user_name(OLD.user_id)
    ) || get_cerimonia_info(OLD.cerimonia_id);
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (OLD.user_id, v_action, 'lista_espera', OLD.id, v_details);
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_lista_espera ON lista_espera_cerimonias;
CREATE TRIGGER trigger_log_lista_espera
  AFTER INSERT OR DELETE ON lista_espera_cerimonias
  FOR EACH ROW EXECUTE FUNCTION log_lista_espera();

-- Trigger para galeria
CREATE OR REPLACE FUNCTION log_galeria()
RETURNS TRIGGER AS $$
DECLARE
  v_details JSONB;
  v_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'galeria_criado';
    v_details := jsonb_build_object(
      'nome_completo', get_user_name(NEW.uploaded_by),
      'titulo', NEW.titulo,
      'tipo', NEW.tipo
    ) || get_cerimonia_info(NEW.cerimonia_id);
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.uploaded_by, v_action, 'galeria', NEW.id, v_details);
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'galeria_excluido';
    v_details := jsonb_build_object(
      'nome_completo', get_user_name(OLD.uploaded_by),
      'titulo', OLD.titulo
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (OLD.uploaded_by, v_action, 'galeria', OLD.id, v_details);
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_galeria ON galeria;
CREATE TRIGGER trigger_log_galeria
  AFTER INSERT OR DELETE ON galeria
  FOR EACH ROW EXECUTE FUNCTION log_galeria();

-- Trigger para permissões de usuário
CREATE OR REPLACE FUNCTION log_user_permissao()
RETURNS TRIGGER AS $$
DECLARE
  v_details JSONB;
  v_action TEXT;
  v_permissao_nome TEXT;
BEGIN
  -- Buscar nome da permissão
  SELECT nome INTO v_permissao_nome FROM permissoes WHERE id = COALESCE(NEW.permissao_id, OLD.permissao_id);
  
  IF TG_OP = 'INSERT' THEN
    v_action := 'permissao_concedida';
    v_details := jsonb_build_object(
      'nome_completo', get_user_name(NEW.user_id),
      'permissao', v_permissao_nome,
      'concedido_por', get_user_name(NEW.concedido_por)
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.concedido_por, v_action, 'permissoes', NEW.id, v_details);
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'permissao_revogada';
    v_details := jsonb_build_object(
      'nome_completo', get_user_name(OLD.user_id),
      'permissao', v_permissao_nome
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), v_action, 'permissoes', OLD.id, v_details);
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_user_permissao ON user_permissoes;
CREATE TRIGGER trigger_log_user_permissao
  AFTER INSERT OR DELETE ON user_permissoes
  FOR EACH ROW EXECUTE FUNCTION log_user_permissao();

-- Trigger para transações financeiras
CREATE OR REPLACE FUNCTION log_transacao_financeira()
RETURNS TRIGGER AS $$
DECLARE
  v_details JSONB;
  v_action TEXT;
  v_categoria_nome TEXT;
BEGIN
  -- Buscar nome da categoria
  SELECT nome INTO v_categoria_nome FROM categorias_financeiras WHERE id = COALESCE(NEW.categoria_id, OLD.categoria_id);
  
  IF TG_OP = 'INSERT' THEN
    v_action := 'transacao_criada';
    v_details := jsonb_build_object(
      'nome_completo', get_user_name(NEW.created_by),
      'tipo', NEW.tipo,
      'valor', NEW.valor,
      'categoria', v_categoria_nome,
      'descricao', NEW.descricao
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.created_by, v_action, 'transacoes', NEW.id, v_details);
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'transacao_atualizada';
    v_details := jsonb_build_object(
      'nome_completo', get_user_name(NEW.created_by),
      'tipo', NEW.tipo,
      'valor', NEW.valor,
      'categoria', v_categoria_nome
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.created_by, v_action, 'transacoes', NEW.id, v_details);
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'transacao_excluida';
    v_details := jsonb_build_object(
      'nome_completo', get_user_name(OLD.created_by),
      'tipo', OLD.tipo,
      'valor', OLD.valor
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), v_action, 'transacoes', OLD.id, v_details);
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_transacao ON transacoes_financeiras;
CREATE TRIGGER trigger_log_transacao
  AFTER INSERT OR UPDATE OR DELETE ON transacoes_financeiras
  FOR EACH ROW EXECUTE FUNCTION log_transacao_financeira();;

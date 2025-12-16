-- Migration para melhorar os triggers de activity_logs com informações mais amigáveis
-- Os triggers agora incluem nomes, títulos e datas nos details para exibição amigável

-- Função auxiliar para obter nome do usuário
CREATE OR REPLACE FUNCTION get_user_name(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_name TEXT;
BEGIN
  SELECT COALESCE(full_name, 'Usuário') INTO v_name
  FROM profiles
  WHERE id = p_user_id;
  RETURN COALESCE(v_name, 'Usuário');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para obter dados da cerimônia
CREATE OR REPLACE FUNCTION get_cerimonia_info(p_cerimonia_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_info JSONB;
BEGIN
  SELECT jsonb_build_object(
    'cerimonia_titulo', titulo,
    'cerimonia_data', data
  ) INTO v_info
  FROM cerimonias
  WHERE id = p_cerimonia_id;
  RETURN COALESCE(v_info, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para obter dados do curso
CREATE OR REPLACE FUNCTION get_curso_info(p_curso_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_info JSONB;
BEGIN
  SELECT jsonb_build_object(
    'curso_titulo', titulo,
    'curso_data', data_inicio
  ) INTO v_info
  FROM cursos_eventos
  WHERE id = p_curso_id;
  RETURN COALESCE(v_info, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para obter dados do produto
CREATE OR REPLACE FUNCTION get_produto_info(p_produto_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_info JSONB;
BEGIN
  SELECT jsonb_build_object(
    'produto_nome', nome,
    'valor', preco
  ) INTO v_info
  FROM produtos
  WHERE id = p_produto_id;
  RETURN COALESCE(v_info, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Trigger para inscrições em cerimônias
CREATE OR REPLACE FUNCTION log_inscricao_cerimonia()
RETURNS TRIGGER AS $$
DECLARE
  v_details JSONB;
  v_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'inscricao_cerimonia_criado';
    v_details := jsonb_build_object(
      'nome_completo', get_user_name(NEW.user_id)
    ) || get_cerimonia_info(NEW.cerimonia_id);
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.user_id, v_action, 'inscricoes', NEW.id, v_details);
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'inscricao_cerimonia_excluido';
    v_details := jsonb_build_object(
      'nome_completo', get_user_name(OLD.user_id)
    ) || get_cerimonia_info(OLD.cerimonia_id);
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (OLD.user_id, v_action, 'inscricoes', OLD.id, v_details);
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para pagamentos
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
      'valor', NEW.valor,
      'status', NEW.status
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.user_id, v_action, 'pagamentos', NEW.id, v_details);
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_action := 'pagamento_atualizado';
      v_details := jsonb_build_object(
        'nome_completo', get_user_name(NEW.user_id),
        'valor', NEW.valor,
        'status', NEW.status,
        'status_anterior', OLD.status
      );
      
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
      VALUES (NEW.user_id, v_action, 'pagamentos', NEW.id, v_details);
    END IF;
    
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para depoimentos/partilhas
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
      'nome_completo', get_user_name(NEW.user_id)
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.user_id, v_action, 'depoimentos', NEW.id, v_details);
    
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para cerimônias
CREATE OR REPLACE FUNCTION log_cerimonia()
RETURNS TRIGGER AS $$
DECLARE
  v_details JSONB;
  v_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'cerimonia_criado';
    v_details := jsonb_build_object(
      'cerimonia_titulo', NEW.titulo,
      'cerimonia_data', NEW.data
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), v_action, 'cerimonias', NEW.id, v_details);
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'cerimonia_atualizado';
    v_details := jsonb_build_object(
      'cerimonia_titulo', NEW.titulo,
      'cerimonia_data', NEW.data
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), v_action, 'cerimonias', NEW.id, v_details);
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'cerimonia_excluido';
    v_details := jsonb_build_object(
      'cerimonia_titulo', OLD.titulo,
      'cerimonia_data', OLD.data
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), v_action, 'cerimonias', OLD.id, v_details);
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para anamneses
CREATE OR REPLACE FUNCTION log_anamnese()
RETURNS TRIGGER AS $$
DECLARE
  v_details JSONB;
  v_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'anamnese_criado';
    v_details := jsonb_build_object(
      'nome_completo', get_user_name(NEW.user_id)
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.user_id, v_action, 'anamneses', NEW.id, v_details);
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'anamnese_atualizado';
    v_details := jsonb_build_object(
      'nome_completo', get_user_name(NEW.user_id)
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.user_id, v_action, 'anamneses', NEW.id, v_details);
    
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para cursos
CREATE OR REPLACE FUNCTION log_curso()
RETURNS TRIGGER AS $$
DECLARE
  v_details JSONB;
  v_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'curso_criado';
    v_details := jsonb_build_object(
      'curso_titulo', NEW.titulo,
      'curso_data', NEW.data_inicio
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), v_action, 'cursos', NEW.id, v_details);
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'curso_atualizado';
    v_details := jsonb_build_object(
      'curso_titulo', NEW.titulo,
      'curso_data', NEW.data_inicio
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), v_action, 'cursos', NEW.id, v_details);
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'curso_excluido';
    v_details := jsonb_build_object(
      'curso_titulo', OLD.titulo,
      'curso_data', OLD.data_inicio
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), v_action, 'cursos', OLD.id, v_details);
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para inscrições em cursos
CREATE OR REPLACE FUNCTION log_inscricao_curso()
RETURNS TRIGGER AS $$
DECLARE
  v_details JSONB;
  v_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'inscricao_curso_criado';
    v_details := jsonb_build_object(
      'nome_completo', get_user_name(NEW.user_id)
    ) || get_curso_info(NEW.curso_id);
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.user_id, v_action, 'inscricoes_cursos', NEW.id, v_details);
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'inscricao_curso_excluido';
    v_details := jsonb_build_object(
      'nome_completo', get_user_name(OLD.user_id)
    ) || get_curso_info(OLD.curso_id);
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (OLD.user_id, v_action, 'inscricoes_cursos', OLD.id, v_details);
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para produtos
CREATE OR REPLACE FUNCTION log_produto()
RETURNS TRIGGER AS $$
DECLARE
  v_details JSONB;
  v_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'produto_criado';
    v_details := jsonb_build_object(
      'produto_nome', NEW.nome,
      'valor', NEW.preco
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), v_action, 'produtos', NEW.id, v_details);
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'produto_atualizado';
    v_details := jsonb_build_object(
      'produto_nome', NEW.nome,
      'valor', NEW.preco
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), v_action, 'produtos', NEW.id, v_details);
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'produto_excluido';
    v_details := jsonb_build_object(
      'produto_nome', OLD.nome,
      'valor', OLD.preco
    );
    
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), v_action, 'produtos', OLD.id, v_details);
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar os triggers (drop se existirem e criar novos)
DROP TRIGGER IF EXISTS trigger_log_inscricao_cerimonia ON inscricoes;
CREATE TRIGGER trigger_log_inscricao_cerimonia
  AFTER INSERT OR DELETE ON inscricoes
  FOR EACH ROW EXECUTE FUNCTION log_inscricao_cerimonia();

DROP TRIGGER IF EXISTS trigger_log_pagamento ON pagamentos;
CREATE TRIGGER trigger_log_pagamento
  AFTER INSERT OR UPDATE ON pagamentos
  FOR EACH ROW EXECUTE FUNCTION log_pagamento();

DROP TRIGGER IF EXISTS trigger_log_depoimento ON depoimentos;
CREATE TRIGGER trigger_log_depoimento
  AFTER INSERT OR UPDATE ON depoimentos
  FOR EACH ROW EXECUTE FUNCTION log_depoimento();

DROP TRIGGER IF EXISTS trigger_log_cerimonia ON cerimonias;
CREATE TRIGGER trigger_log_cerimonia
  AFTER INSERT OR UPDATE OR DELETE ON cerimonias
  FOR EACH ROW EXECUTE FUNCTION log_cerimonia();

DROP TRIGGER IF EXISTS trigger_log_anamnese ON anamneses;
CREATE TRIGGER trigger_log_anamnese
  AFTER INSERT OR UPDATE ON anamneses
  FOR EACH ROW EXECUTE FUNCTION log_anamnese();

DROP TRIGGER IF EXISTS trigger_log_curso ON cursos_eventos;
CREATE TRIGGER trigger_log_curso
  AFTER INSERT OR UPDATE OR DELETE ON cursos_eventos
  FOR EACH ROW EXECUTE FUNCTION log_curso();

DROP TRIGGER IF EXISTS trigger_log_inscricao_curso ON inscricoes_cursos;
CREATE TRIGGER trigger_log_inscricao_curso
  AFTER INSERT OR DELETE ON inscricoes_cursos
  FOR EACH ROW EXECUTE FUNCTION log_inscricao_curso();

DROP TRIGGER IF EXISTS trigger_log_produto ON produtos;
CREATE TRIGGER trigger_log_produto
  AFTER INSERT OR UPDATE OR DELETE ON produtos
  FOR EACH ROW EXECUTE FUNCTION log_produto();

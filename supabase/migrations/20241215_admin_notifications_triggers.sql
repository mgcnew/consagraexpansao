-- =====================================================
-- Triggers de Notificação por Role
-- Consagrador: loja, cursos, cerimônias, chat
-- Guardião: tudo do consagrador + anamneses + novos usuários
-- Admin/SuperAdmin: tudo
-- =====================================================

-- =====================================================
-- HELPER: Função para buscar usuários por permissão
-- =====================================================
CREATE OR REPLACE FUNCTION get_users_with_permission(permission_name TEXT)
RETURNS TABLE(user_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT up.user_id 
  FROM user_permissoes up
  JOIN permissoes p ON up.permissao_id = p.id
  WHERE p.nome = permission_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 1. NOVO PRODUTO NA LOJA
-- Notifica: Consagrador, Guardião, Admin, SuperAdmin
-- =====================================================
CREATE OR REPLACE FUNCTION notify_new_produto()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Notificar consagradores, guardiões e admins
  FOR target_user_id IN 
    SELECT DISTINCT up.user_id 
    FROM user_permissoes up
    JOIN permissoes p ON up.permissao_id = p.id
    WHERE p.nome IN ('ver_cerimonias', 'ver_consagradores', 'super_admin')
  LOOP
    INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, url)
    VALUES (
      target_user_id,
      'novo_produto',
      'Novo Produto na Loja',
      'O produto "' || NEW.nome || '" foi adicionado à loja.',
      '/loja'
    );
  END LOOP;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao notificar novo produto: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_new_produto ON produtos;
CREATE TRIGGER trigger_notify_new_produto
  AFTER INSERT ON produtos
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_produto();

-- =====================================================
-- 2. NOVO CURSO/EVENTO
-- Notifica: Consagrador, Guardião, Admin, SuperAdmin
-- =====================================================
CREATE OR REPLACE FUNCTION notify_new_curso()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
BEGIN
  FOR target_user_id IN 
    SELECT DISTINCT up.user_id 
    FROM user_permissoes up
    JOIN permissoes p ON up.permissao_id = p.id
    WHERE p.nome IN ('ver_cerimonias', 'ver_consagradores', 'super_admin')
  LOOP
    INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, url)
    VALUES (
      target_user_id,
      'novo_curso',
      'Novo Curso/Evento',
      'O curso "' || NEW.nome || '" foi criado.',
      '/cursos'
    );
  END LOOP;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao notificar novo curso: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_new_curso ON cursos_eventos;
CREATE TRIGGER trigger_notify_new_curso
  AFTER INSERT ON cursos_eventos
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_curso();

-- =====================================================
-- 3. NOVA CERIMÔNIA
-- Notifica: Consagrador, Guardião, Admin, SuperAdmin
-- =====================================================
CREATE OR REPLACE FUNCTION notify_new_cerimonia()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
BEGIN
  FOR target_user_id IN 
    SELECT DISTINCT up.user_id 
    FROM user_permissoes up
    JOIN permissoes p ON up.permissao_id = p.id
    WHERE p.nome IN ('ver_cerimonias', 'ver_consagradores', 'super_admin')
  LOOP
    INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, url)
    VALUES (
      target_user_id,
      'nova_cerimonia',
      'Nova Cerimônia Criada',
      'A cerimônia "' || NEW.nome || '" foi criada para ' || TO_CHAR(NEW.data, 'DD/MM/YYYY') || '.',
      '/cerimonias'
    );
  END LOOP;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao notificar nova cerimônia: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_new_cerimonia ON cerimonias;
CREATE TRIGGER trigger_notify_new_cerimonia
  AFTER INSERT ON cerimonias
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_cerimonia();

-- =====================================================
-- 4. ANAMNESE PREENCHIDA
-- Notifica: Guardião, Admin, SuperAdmin (NÃO consagrador)
-- =====================================================
CREATE OR REPLACE FUNCTION notify_anamnese_preenchida()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  user_name TEXT;
  cerimonia_nome TEXT;
BEGIN
  -- Buscar nome do usuário
  SELECT nome INTO user_name FROM profiles WHERE id = NEW.user_id;
  
  -- Buscar nome da cerimônia
  SELECT c.nome INTO cerimonia_nome 
  FROM cerimonias c 
  JOIN inscricoes i ON i.cerimonia_id = c.id 
  WHERE i.id = NEW.inscricao_id;
  
  -- Notificar guardiões e admins (ver_consagradores = guardião)
  FOR target_user_id IN 
    SELECT DISTINCT up.user_id 
    FROM user_permissoes up
    JOIN permissoes p ON up.permissao_id = p.id
    WHERE p.nome IN ('ver_consagradores', 'super_admin')
  LOOP
    INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, url)
    VALUES (
      target_user_id,
      'anamnese_preenchida',
      'Ficha de Anamnese Preenchida',
      COALESCE(user_name, 'Um usuário') || ' preencheu a ficha de anamnese' ||
        CASE WHEN cerimonia_nome IS NOT NULL THEN ' para ' || cerimonia_nome ELSE '' END || '.',
      '/admin/anamneses'
    );
  END LOOP;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao notificar anamnese: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_anamnese ON anamneses;
CREATE TRIGGER trigger_notify_anamnese
  AFTER INSERT ON anamneses
  FOR EACH ROW
  EXECUTE FUNCTION notify_anamnese_preenchida();

-- =====================================================
-- 5. NOVO USUÁRIO CADASTRADO
-- Notifica: Guardião, Admin, SuperAdmin (NÃO consagrador)
-- Atualiza a função existente
-- =====================================================
CREATE OR REPLACE FUNCTION notify_new_user()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  user_name TEXT;
  user_email TEXT;
BEGIN
  user_name := COALESCE(NEW.nome, 'Usuário');
  
  -- Buscar email do auth.users
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;
  
  -- Notificar guardiões e admins (ver_consagradores = guardião)
  FOR target_user_id IN 
    SELECT DISTINCT up.user_id 
    FROM user_permissoes up
    JOIN permissoes p ON up.permissao_id = p.id
    WHERE p.nome IN ('ver_consagradores', 'super_admin')
  LOOP
    INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, url)
    VALUES (
      target_user_id,
      'novo_usuario',
      'Novo Usuário Cadastrado',
      user_name || CASE WHEN user_email IS NOT NULL THEN ' (' || user_email || ')' ELSE '' END || ' se cadastrou no sistema.',
      '/admin/consagradores'
    );
  END LOOP;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao notificar novo usuário: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. NOVA VENDA NA LOJA
-- Notifica: APENAS Admin, SuperAdmin
-- =====================================================
CREATE OR REPLACE FUNCTION notify_new_venda()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  buyer_name TEXT;
BEGIN
  SELECT nome INTO buyer_name FROM profiles WHERE id = NEW.user_id;
  
  -- Notificar apenas super_admin
  FOR target_user_id IN 
    SELECT DISTINCT up.user_id 
    FROM user_permissoes up
    JOIN permissoes p ON up.permissao_id = p.id
    WHERE p.nome = 'super_admin'
  LOOP
    INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, url)
    VALUES (
      target_user_id,
      'nova_venda',
      'Nova Venda Realizada',
      COALESCE(buyer_name, 'Um usuário') || ' realizou uma compra na loja.',
      '/admin/vendas'
    );
  END LOOP;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao notificar nova venda: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger se tabela pedidos existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pedidos') THEN
    DROP TRIGGER IF EXISTS trigger_notify_new_venda ON pedidos;
    CREATE TRIGGER trigger_notify_new_venda
      AFTER INSERT ON pedidos
      FOR EACH ROW
      EXECUTE FUNCTION notify_new_venda();
  END IF;
END $$;

-- =====================================================
-- 7. NOVO PAGAMENTO DE CERIMÔNIA
-- Notifica: APENAS Admin, SuperAdmin
-- =====================================================
CREATE OR REPLACE FUNCTION notify_new_pagamento()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  payer_name TEXT;
  cerimonia_nome TEXT;
BEGIN
  SELECT nome INTO payer_name FROM profiles WHERE id = NEW.user_id;
  
  IF NEW.cerimonia_id IS NOT NULL THEN
    SELECT nome INTO cerimonia_nome FROM cerimonias WHERE id = NEW.cerimonia_id;
  END IF;
  
  -- Notificar apenas super_admin
  FOR target_user_id IN 
    SELECT DISTINCT up.user_id 
    FROM user_permissoes up
    JOIN permissoes p ON up.permissao_id = p.id
    WHERE p.nome = 'super_admin'
  LOOP
    INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, url)
    VALUES (
      target_user_id,
      'novo_pagamento',
      'Novo Pagamento Registrado',
      COALESCE(payer_name, 'Um usuário') || ' registrou um pagamento' || 
        CASE WHEN cerimonia_nome IS NOT NULL THEN ' para ' || cerimonia_nome ELSE '' END || 
        ' no valor de R$ ' || COALESCE(NEW.valor::TEXT, '0') || '.',
      '/admin/financeiro'
    );
  END LOOP;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao notificar novo pagamento: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_new_pagamento ON pagamentos;
CREATE TRIGGER trigger_notify_new_pagamento
  AFTER INSERT ON pagamentos
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_pagamento();

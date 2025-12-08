-- Migration: Complete RLS Audit and Fix
-- Descrição: Script completo para garantir que todas as tabelas tenham políticas RLS corretas
-- Requisito: 7.1 - Garantir que admins possam ler todos os registros necessários
-- 
-- INSTRUÇÕES:
-- 1. Execute este script no Supabase SQL Editor
-- 2. Verifique se não há erros
-- 3. Teste as permissões com diferentes usuários

-- =====================================================
-- FUNÇÃO AUXILIAR: Verificar se usuário é admin
-- =====================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 1. ROLES TABLE
-- =====================================================
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read roles" ON roles;
CREATE POLICY "Authenticated can read roles"
ON roles FOR SELECT
TO authenticated
USING (true);

-- =====================================================
-- 2. USER_ROLES TABLE
-- =====================================================
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read user_roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert user_roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update user_roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete user_roles" ON user_roles;

CREATE POLICY "Authenticated can read user_roles"
ON user_roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert user_roles"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admins can update user_roles"
ON user_roles FOR UPDATE
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can delete user_roles"
ON user_roles FOR DELETE
TO authenticated
USING (is_admin());

-- =====================================================
-- 3. PROFILES TABLE
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Authenticated users can read all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- =====================================================
-- 4. ANAMNESES TABLE
-- =====================================================
ALTER TABLE anamneses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own anamnese" ON anamneses;
DROP POLICY IF EXISTS "Admins can read all anamneses" ON anamneses;
DROP POLICY IF EXISTS "Users can insert own anamnese" ON anamneses;
DROP POLICY IF EXISTS "Users can update own anamnese" ON anamneses;

-- Usuários podem ler própria anamnese
CREATE POLICY "Users can read own anamnese"
ON anamneses FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins podem ler todas as anamneses
CREATE POLICY "Admins can read all anamneses"
ON anamneses FOR SELECT
TO authenticated
USING (is_admin());

-- Usuários podem inserir própria anamnese
CREATE POLICY "Users can insert own anamnese"
ON anamneses FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar própria anamnese
CREATE POLICY "Users can update own anamnese"
ON anamneses FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- =====================================================
-- 5. CERIMONIAS TABLE
-- =====================================================
ALTER TABLE cerimonias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read cerimonias" ON cerimonias;
DROP POLICY IF EXISTS "Admins can insert cerimonias" ON cerimonias;
DROP POLICY IF EXISTS "Admins can update cerimonias" ON cerimonias;
DROP POLICY IF EXISTS "Admins can delete cerimonias" ON cerimonias;

-- Todos podem ler cerimônias (são públicas)
CREATE POLICY "Anyone can read cerimonias"
ON cerimonias FOR SELECT
TO authenticated
USING (true);

-- Apenas admins podem criar cerimônias
CREATE POLICY "Admins can insert cerimonias"
ON cerimonias FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Apenas admins podem atualizar cerimônias
CREATE POLICY "Admins can update cerimonias"
ON cerimonias FOR UPDATE
TO authenticated
USING (is_admin());

-- Apenas admins podem deletar cerimônias
CREATE POLICY "Admins can delete cerimonias"
ON cerimonias FOR DELETE
TO authenticated
USING (is_admin());

-- =====================================================
-- 6. INSCRICOES TABLE
-- =====================================================
ALTER TABLE inscricoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own inscricoes" ON inscricoes;
DROP POLICY IF EXISTS "Admins can read all inscricoes" ON inscricoes;
DROP POLICY IF EXISTS "Users can insert own inscricoes" ON inscricoes;
DROP POLICY IF EXISTS "Users can update own inscricoes" ON inscricoes;
DROP POLICY IF EXISTS "Admins can update inscricoes" ON inscricoes;
DROP POLICY IF EXISTS "Users can delete own inscricoes" ON inscricoes;

-- Usuários podem ler próprias inscrições
CREATE POLICY "Users can read own inscricoes"
ON inscricoes FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins podem ler todas as inscrições
CREATE POLICY "Admins can read all inscricoes"
ON inscricoes FOR SELECT
TO authenticated
USING (is_admin());

-- Usuários podem criar próprias inscrições
CREATE POLICY "Users can insert own inscricoes"
ON inscricoes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar próprias inscrições
CREATE POLICY "Users can update own inscricoes"
ON inscricoes FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Admins podem atualizar qualquer inscrição (ex: marcar como pago)
CREATE POLICY "Admins can update inscricoes"
ON inscricoes FOR UPDATE
TO authenticated
USING (is_admin());

-- Usuários podem cancelar próprias inscrições
CREATE POLICY "Users can delete own inscricoes"
ON inscricoes FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =====================================================
-- 7. DEPOIMENTOS TABLE
-- =====================================================
ALTER TABLE depoimentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own depoimentos" ON depoimentos;
DROP POLICY IF EXISTS "Anyone can read approved depoimentos" ON depoimentos;
DROP POLICY IF EXISTS "Admins can read all depoimentos" ON depoimentos;
DROP POLICY IF EXISTS "Users can insert own depoimentos" ON depoimentos;
DROP POLICY IF EXISTS "Admins can update depoimentos" ON depoimentos;
DROP POLICY IF EXISTS "Admins can delete depoimentos" ON depoimentos;

-- Usuários podem ler próprios depoimentos
CREATE POLICY "Users can read own depoimentos"
ON depoimentos FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Qualquer usuário pode ler depoimentos aprovados
CREATE POLICY "Anyone can read approved depoimentos"
ON depoimentos FOR SELECT
TO authenticated
USING (aprovado = true);

-- Admins podem ler TODOS os depoimentos (aprovados e pendentes)
CREATE POLICY "Admins can read all depoimentos"
ON depoimentos FOR SELECT
TO authenticated
USING (is_admin());

-- Usuários podem criar próprios depoimentos
CREATE POLICY "Users can insert own depoimentos"
ON depoimentos FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admins podem atualizar qualquer depoimento (aprovar/rejeitar)
CREATE POLICY "Admins can update depoimentos"
ON depoimentos FOR UPDATE
TO authenticated
USING (is_admin());

-- Admins podem deletar qualquer depoimento
CREATE POLICY "Admins can delete depoimentos"
ON depoimentos FOR DELETE
TO authenticated
USING (is_admin());

-- =====================================================
-- 8. NOTIFICACOES TABLE
-- =====================================================
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read notificacoes" ON notificacoes;
DROP POLICY IF EXISTS "Admins can update notificacoes" ON notificacoes;
DROP POLICY IF EXISTS "System can insert notificacoes" ON notificacoes;

-- Admins podem ler notificações
CREATE POLICY "Admins can read notificacoes"
ON notificacoes FOR SELECT
TO authenticated
USING (is_admin());

-- Admins podem atualizar notificações (marcar como lida)
CREATE POLICY "Admins can update notificacoes"
ON notificacoes FOR UPDATE
TO authenticated
USING (is_admin());

-- Sistema pode inserir notificações (via service role ou triggers)
-- Nota: INSERT geralmente é feito via triggers ou service role key

-- =====================================================
-- GRANTS - Permissões de tabela
-- =====================================================
GRANT SELECT ON roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON anamneses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON cerimonias TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON inscricoes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON depoimentos TO authenticated;
GRANT SELECT, UPDATE ON notificacoes TO authenticated;

-- =====================================================
-- VERIFICAÇÃO: Query para testar políticas
-- =====================================================
-- Execute estas queries para verificar se as políticas estão funcionando:
--
-- 1. Verificar se RLS está habilitado em todas as tabelas:
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('roles', 'user_roles', 'profiles', 'anamneses', 
--                   'cerimonias', 'inscricoes', 'depoimentos', 'notificacoes');
--
-- 2. Listar todas as políticas:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;


-- Migration: Fix ALL RLS policies for admin panel
-- Execute este script COMPLETO no Supabase SQL Editor

-- =====================================================
-- PRIMEIRO: Verificar se o usuário é admin
-- Execute esta query para verificar:
-- =====================================================
-- SELECT 
--   p.id,
--   p.full_name,
--   au.email,
--   r.role
-- FROM profiles p
-- JOIN auth.users au ON p.id = au.id
-- LEFT JOIN user_roles ur ON p.id = ur.user_id
-- LEFT JOIN roles r ON ur.role_id = r.id
-- WHERE au.email = 'mgc.info.new@gmail.com';

-- =====================================================
-- ROLES TABLE - RLS Policies
-- =====================================================
DROP POLICY IF EXISTS "Anyone can read roles" ON roles;
DROP POLICY IF EXISTS "Authenticated can read roles" ON roles;

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Todos os usuários autenticados podem ler roles
CREATE POLICY "Authenticated can read roles"
ON roles FOR SELECT
TO authenticated
USING (true);

-- =====================================================
-- USER_ROLES TABLE - RLS Policies
-- =====================================================
DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can read all user_roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage user_roles" ON user_roles;
DROP POLICY IF EXISTS "Authenticated can read user_roles" ON user_roles;

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Todos os usuários autenticados podem ler user_roles (necessário para o admin panel)
CREATE POLICY "Authenticated can read user_roles"
ON user_roles FOR SELECT
TO authenticated
USING (true);

-- Admins podem inserir/atualizar/deletar user_roles
CREATE POLICY "Admins can insert user_roles"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.role = 'admin'
  )
);

CREATE POLICY "Admins can update user_roles"
ON user_roles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.role = 'admin'
  )
);

CREATE POLICY "Admins can delete user_roles"
ON user_roles FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.role = 'admin'
  )
);

-- =====================================================
-- PROFILES TABLE - RLS Policies
-- =====================================================
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can read profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON profiles;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Todos os usuários autenticados podem ler todos os perfis
CREATE POLICY "Authenticated users can read all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- Usuários podem inserir seu próprio perfil
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- =====================================================
-- DEPOIMENTOS TABLE - RLS Policies
-- =====================================================
DROP POLICY IF EXISTS "Users can read own depoimentos" ON depoimentos;
DROP POLICY IF EXISTS "Users can read approved depoimentos" ON depoimentos;
DROP POLICY IF EXISTS "Anyone can read approved depoimentos" ON depoimentos;
DROP POLICY IF EXISTS "Admins can read all depoimentos" ON depoimentos;
DROP POLICY IF EXISTS "Users can insert own depoimentos" ON depoimentos;
DROP POLICY IF EXISTS "Admins can update depoimentos" ON depoimentos;
DROP POLICY IF EXISTS "Admins can delete depoimentos" ON depoimentos;

ALTER TABLE depoimentos ENABLE ROW LEVEL SECURITY;

-- Usuários podem ler seus próprios depoimentos
CREATE POLICY "Users can read own depoimentos"
ON depoimentos FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Qualquer usuário autenticado pode ler depoimentos aprovados
CREATE POLICY "Anyone can read approved depoimentos"
ON depoimentos FOR SELECT
TO authenticated
USING (aprovado = true);

-- Admins podem ler TODOS os depoimentos
CREATE POLICY "Admins can read all depoimentos"
ON depoimentos FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.role = 'admin'
  )
);

-- Usuários podem inserir seus próprios depoimentos
CREATE POLICY "Users can insert own depoimentos"
ON depoimentos FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admins podem atualizar qualquer depoimento
CREATE POLICY "Admins can update depoimentos"
ON depoimentos FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.role = 'admin'
  )
);

-- Admins podem deletar qualquer depoimento
CREATE POLICY "Admins can delete depoimentos"
ON depoimentos FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.role = 'admin'
  )
);

-- =====================================================
-- GRANTS
-- =====================================================
GRANT SELECT ON roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON depoimentos TO authenticated;

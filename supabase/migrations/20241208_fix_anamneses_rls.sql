-- Fix RLS policies for anamneses table
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- Primeiro, remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can read own anamnese" ON anamneses;
DROP POLICY IF EXISTS "Admins can read all anamneses" ON anamneses;
DROP POLICY IF EXISTS "Users can insert own anamnese" ON anamneses;
DROP POLICY IF EXISTS "Users can update own anamnese" ON anamneses;

-- Garantir que RLS está habilitado
ALTER TABLE anamneses ENABLE ROW LEVEL SECURITY;

-- Política para SELECT - usuários podem ler própria anamnese
CREATE POLICY "Users can read own anamnese"
ON anamneses FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Política para SELECT - admins podem ler todas (usando a coluna 'role' correta)
CREATE POLICY "Admins can read all anamneses"
ON anamneses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.role = 'admin'
  )
);

-- Política para INSERT - usuários podem inserir própria anamnese
CREATE POLICY "Users can insert own anamnese"
ON anamneses FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Política para UPDATE - usuários podem atualizar própria anamnese
CREATE POLICY "Users can update own anamnese"
ON anamneses FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Garantir permissões na tabela
GRANT SELECT, INSERT, UPDATE ON anamneses TO authenticated;

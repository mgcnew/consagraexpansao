-- =====================================================
-- FIX: Corrigir RLS recursiva em user_permissoes
-- =====================================================

-- Primeiro, criar uma função SECURITY DEFINER que não é afetada por RLS
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_permissoes up
    JOIN permissoes p ON up.permissao_id = p.id
    WHERE up.user_id = auth.uid() AND p.nome = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can read own permissoes" ON user_permissoes;
DROP POLICY IF EXISTS "Super admin can read all permissoes" ON user_permissoes;
DROP POLICY IF EXISTS "Super admin can manage permissoes" ON user_permissoes;

-- Nova política: usuário pode ver suas próprias OU super_admin vê todas
CREATE POLICY "Users can read permissoes" ON user_permissoes
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR is_super_admin()
  );

-- Nova política: super_admin pode inserir
CREATE POLICY "Super admin can insert permissoes" ON user_permissoes
  FOR INSERT TO authenticated
  WITH CHECK (is_super_admin());

-- Nova política: super_admin pode deletar
CREATE POLICY "Super admin can delete permissoes" ON user_permissoes
  FOR DELETE TO authenticated
  USING (is_super_admin());

-- Nova política: super_admin pode atualizar
CREATE POLICY "Super admin can update permissoes" ON user_permissoes
  FOR UPDATE TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- RLS para tabela pagamentos
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver seus próprios pagamentos
DROP POLICY IF EXISTS "Users can view own payments" ON pagamentos;
CREATE POLICY "Users can view own payments" ON pagamentos
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins podem ver todos os pagamentos
DROP POLICY IF EXISTS "Admins can view all payments" ON pagamentos;
CREATE POLICY "Admins can view all payments" ON pagamentos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.role IN ('admin', 'super_admin')
    )
    OR
    is_super_admin()
  );

-- Permitir insert via Edge Functions (service role)
DROP POLICY IF EXISTS "Service can insert payments" ON pagamentos;
CREATE POLICY "Service can insert payments" ON pagamentos
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Permitir update via Edge Functions
DROP POLICY IF EXISTS "Service can update payments" ON pagamentos;
CREATE POLICY "Service can update payments" ON pagamentos
  FOR UPDATE TO authenticated
  USING (true);

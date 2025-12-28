-- Política para INSERT (criar cerimônias) - apenas admins
CREATE POLICY "Admins can insert cerimonias" ON cerimonias
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.role = 'admin'
  )
);

-- Política para UPDATE (editar cerimônias) - apenas admins
CREATE POLICY "Admins can update cerimonias" ON cerimonias
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.role = 'admin'
  )
);

-- Política para DELETE (excluir cerimônias) - apenas admins
CREATE POLICY "Admins can delete cerimonias" ON cerimonias
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.role = 'admin'
  )
);;

-- Remover política conflitante
DROP POLICY IF EXISTS "Admins can read all depoimentos" ON depoimentos;

-- Recriar política com uma condição mais permissiva
CREATE POLICY "Admins can read all depoimentos" ON depoimentos
FOR SELECT
TO authenticated
USING (
  (SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.role = 'admin'
  ))
);;

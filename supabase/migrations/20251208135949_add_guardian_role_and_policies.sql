-- Adicionar role de guardião
INSERT INTO roles (id, role) VALUES 
  (gen_random_uuid(), 'guardiao')
ON CONFLICT DO NOTHING;

-- Política para admins gerenciarem roles de usuários
CREATE POLICY "Admins can manage user_roles" ON user_roles
FOR ALL
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

-- Política para leitura de roles (admins podem ver)
CREATE POLICY "Admins can read roles" ON roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.role = 'admin'
  )
);

-- Habilitar RLS nas tabelas de roles se não estiver
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;;

-- Tabela de depoimentos
CREATE TABLE IF NOT EXISTS depoimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cerimonia_id uuid REFERENCES cerimonias(id) ON DELETE SET NULL,
  texto text NOT NULL,
  aprovado boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  approved_at timestamp with time zone,
  approved_by uuid REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE depoimentos ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública (apenas aprovados)
CREATE POLICY "Public can read approved depoimentos" ON depoimentos
FOR SELECT
USING (aprovado = true);

-- Política para admin ler todos (incluindo pendentes)
CREATE POLICY "Admins can read all depoimentos" ON depoimentos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.role = 'admin'
  )
);

-- Política para usuário ver seus próprios depoimentos
CREATE POLICY "Users can read own depoimentos" ON depoimentos
FOR SELECT
USING (user_id = auth.uid());

-- Política para usuário criar depoimento
CREATE POLICY "Users can create depoimentos" ON depoimentos
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Política para admin aprovar/reprovar depoimentos
CREATE POLICY "Admins can update depoimentos" ON depoimentos
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.role = 'admin'
  )
);

-- Política para admin deletar depoimentos
CREATE POLICY "Admins can delete depoimentos" ON depoimentos
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.role = 'admin'
  )
);

-- Política para usuário deletar próprio depoimento (se não aprovado)
CREATE POLICY "Users can delete own pending depoimentos" ON depoimentos
FOR DELETE
USING (user_id = auth.uid() AND aprovado = false);;

-- Criar bucket para banners de cursos
INSERT INTO storage.buckets (id, name, public)
VALUES ('cursos', 'cursos', true)
ON CONFLICT (id) DO NOTHING;

-- Política: qualquer um pode ver
CREATE POLICY "Cursos banners são públicos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'cursos');

-- Política: super_admin pode fazer upload
CREATE POLICY "Super admin faz upload de banners cursos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cursos' AND
  EXISTS (
    SELECT 1 FROM user_permissoes up
    JOIN permissoes p ON up.permissao_id = p.id
    WHERE up.user_id = auth.uid() AND p.nome = 'super_admin'
  )
);

-- Política: super_admin pode deletar
CREATE POLICY "Super admin deleta banners cursos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'cursos' AND
  EXISTS (
    SELECT 1 FROM user_permissoes up
    JOIN permissoes p ON up.permissao_id = p.id
    WHERE up.user_id = auth.uid() AND p.nome = 'super_admin'
  )
);
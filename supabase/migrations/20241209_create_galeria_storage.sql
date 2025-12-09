-- Migration: create_galeria_storage
-- Cria bucket de storage para galeria
-- NOTA: Execute este SQL no Supabase Dashboard > SQL Editor

-- Criar bucket para galeria (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'galeria',
  'galeria',
  true,
  52428800, -- 50MB limite
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para o bucket galeria

-- SELECT: Todos podem ver (bucket público)
CREATE POLICY "galeria_storage_select_public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'galeria');

-- INSERT: Apenas admin e guardião podem fazer upload
CREATE POLICY "galeria_storage_insert_admin_guardiao"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'galeria' 
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.role IN ('admin', 'guardiao')
    )
  );

-- UPDATE: Apenas admin e guardião podem atualizar
CREATE POLICY "galeria_storage_update_admin_guardiao"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'galeria'
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.role IN ('admin', 'guardiao')
    )
  );

-- DELETE: Apenas admin e guardião podem deletar
CREATE POLICY "galeria_storage_delete_admin_guardiao"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'galeria'
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.role IN ('admin', 'guardiao')
    )
  );

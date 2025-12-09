-- Migration: Create storage bucket for ceremony banners
-- Date: 2024-12-09
-- Purpose: Allow local image uploads for ceremony banners
-- NOTE: RLS is already enabled on storage.objects by default in Supabase

-- Step 1: Create the storage bucket for ceremony images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cerimonias',
  'cerimonias',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Drop existing policies if they exist (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Public can view ceremony images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload ceremony images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update ceremony images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete ceremony images" ON storage.objects;

-- Step 3: Create RLS policies for the cerimonias bucket

-- Anyone can view ceremony images (public bucket)
CREATE POLICY "Public can view ceremony images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'cerimonias');

-- Only admins can upload ceremony images
CREATE POLICY "Admins can upload ceremony images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cerimonias'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.role = 'admin'
  )
);

-- Only admins can update ceremony images
CREATE POLICY "Admins can update ceremony images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'cerimonias'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.role = 'admin'
  )
);

-- Only admins can delete ceremony images
CREATE POLICY "Admins can delete ceremony images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'cerimonias'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.role = 'admin'
  )
);

-- Step 4: Verify bucket was created (run separately if needed)
-- SELECT * FROM storage.buckets WHERE id = 'cerimonias';

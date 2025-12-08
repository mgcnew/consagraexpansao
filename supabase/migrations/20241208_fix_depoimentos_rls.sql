-- Migration: Fix RLS policies for depoimentos and profiles tables
-- This migration ensures admins can read all depoimentos (approved and pending)
-- and all profiles for the admin panel
-- Requirements: 1.2 - WHEN um administrador acessa a aba de depoimentos no painel admin 
--                     THEN o Portal SHALL exibir todos os depoimentos pendentes de todos os usuários

-- =====================================================
-- PROFILES TABLE - RLS Policies
-- =====================================================

-- Drop existing policies on profiles table
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can read profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read all profiles
-- This is needed for the admin panel and for displaying user names in depoimentos
CREATE POLICY "Authenticated users can read all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- Policy: Users can insert their own profile (for new registrations)
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- =====================================================
-- DEPOIMENTOS TABLE - RLS Policies
-- =====================================================

-- Drop existing policies on depoimentos table
DROP POLICY IF EXISTS "Users can read own depoimentos" ON depoimentos;
DROP POLICY IF EXISTS "Users can read approved depoimentos" ON depoimentos;
DROP POLICY IF EXISTS "Anyone can read approved depoimentos" ON depoimentos;
DROP POLICY IF EXISTS "Admins can read all depoimentos" ON depoimentos;
DROP POLICY IF EXISTS "Users can insert own depoimentos" ON depoimentos;
DROP POLICY IF EXISTS "Admins can update depoimentos" ON depoimentos;
DROP POLICY IF EXISTS "Admins can delete depoimentos" ON depoimentos;

-- Enable RLS on depoimentos table
ALTER TABLE depoimentos ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read their own depoimentos
CREATE POLICY "Users can read own depoimentos"
ON depoimentos FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 2: Anyone authenticated can read approved depoimentos (for public display)
CREATE POLICY "Anyone can read approved depoimentos"
ON depoimentos FOR SELECT
TO authenticated
USING (aprovado = true);

-- Policy 3: Admins can read ALL depoimentos (approved and pending)
-- This is the key policy that fixes the bug
CREATE POLICY "Admins can read all depoimentos"
ON depoimentos FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.role = 'admin'
  )
);

-- Policy 4: Users can insert their own depoimentos
CREATE POLICY "Users can insert own depoimentos"
ON depoimentos FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy 5: Admins can update any depoimento (for approval)
CREATE POLICY "Admins can update depoimentos"
ON depoimentos FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.role = 'admin'
  )
);

-- Policy 6: Admins can delete any depoimento (for rejection)
CREATE POLICY "Admins can delete depoimentos"
ON depoimentos FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.role = 'admin'
  )
);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON depoimentos TO authenticated;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;

-- Migration: Ensure notification preference columns exist in profiles
-- Date: 2024-12-09
-- Purpose: Ensure email_notifications and whatsapp_notifications columns exist
-- and are properly configured with RLS

-- Step 1: Add columns if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS whatsapp_notifications BOOLEAN DEFAULT true;

-- Step 2: Add comments for documentation
COMMENT ON COLUMN profiles.email_notifications IS 'Preferência do usuário para receber notificações por email';
COMMENT ON COLUMN profiles.whatsapp_notifications IS 'Preferência do usuário para receber lembretes via WhatsApp';

-- Step 3: Ensure RLS is enabled on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Step 5: Recreate RLS policies
-- All authenticated users can read all profiles (needed for displaying names in testimonials, etc)
CREATE POLICY "Authenticated users can read all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Step 6: Ensure proper grants
GRANT SELECT ON profiles TO authenticated;
GRANT INSERT, UPDATE ON profiles TO authenticated;

-- Step 7: Verify the columns exist
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- AND column_name IN ('email_notifications', 'whatsapp_notifications');

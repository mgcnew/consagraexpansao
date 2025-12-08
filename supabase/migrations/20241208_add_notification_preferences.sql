-- Migration: Add notification preferences to profiles table
-- Requirements: 8.1 - Persistir preferências de notificação
-- Date: 2024-12-08

-- Add notification preference columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS whatsapp_notifications BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN profiles.email_notifications IS 'Preferência do usuário para receber notificações por email';
COMMENT ON COLUMN profiles.whatsapp_notifications IS 'Preferência do usuário para receber lembretes via WhatsApp';

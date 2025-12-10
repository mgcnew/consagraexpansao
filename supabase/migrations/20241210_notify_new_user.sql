-- =====================================================
-- 7. NOTIFICAÇÃO: Novo Usuário Cadastrado (para admins)
-- =====================================================
CREATE OR REPLACE FUNCTION notify_new_user()
RETURNS TRIGGER AS $$
DECLARE
  admin_id UUID;
  user_name TEXT;
  user_email TEXT;
BEGIN
  -- Buscar nome e email do novo usuário
  user_name := COALESCE(NEW.full_name, 'Novo usuário');
  user_email := COALESCE(NEW.email, '');
  
  -- Notificar cada admin
  FOR admin_id IN SELECT * FROM get_admin_user_ids()
  LOOP
    INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, url)
    VALUES (
      admin_id,
      'novo_usuario',
      'Novo Usuário Cadastrado',
      user_name || ' (' || user_email || ') se cadastrou no sistema.',
      '/admin'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_new_user ON profiles;
CREATE TRIGGER trigger_notify_new_user
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_user();

-- =====================================================
-- FIX: Corrige trigger notify_new_user
-- O campo email não existe em profiles, está em auth.users
-- + Adiciona role 'consagrador' automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION notify_new_user()
RETURNS TRIGGER AS $$
DECLARE
  admin_id UUID;
  user_name TEXT;
  user_email TEXT;
  consagrador_role_id UUID;
BEGIN
  -- Buscar nome do novo usuário (da tabela profiles)
  user_name := COALESCE(NEW.full_name, 'Novo usuário');
  
  -- Buscar email do auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.id;
  
  user_email := COALESCE(user_email, '');
  
  -- Atribuir role 'consagrador' automaticamente
  SELECT id INTO consagrador_role_id FROM roles WHERE role = 'consagrador';
  IF consagrador_role_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id)
    VALUES (NEW.id, consagrador_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
  
  -- Notificar cada admin
  FOR admin_id IN SELECT * FROM get_admin_user_ids()
  LOOP
    INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, url)
    VALUES (
      admin_id,
      'novo_usuario',
      'Novo Usuário Cadastrado',
      user_name || CASE WHEN user_email != '' THEN ' (' || user_email || ')' ELSE '' END || ' se cadastrou no sistema.',
      '/admin'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

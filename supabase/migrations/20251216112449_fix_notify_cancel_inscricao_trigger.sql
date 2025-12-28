-- Corrigir trigger para lidar com deleção em cascata
CREATE OR REPLACE FUNCTION notify_cancel_inscricao()
RETURNS TRIGGER AS $$
DECLARE
  admin_id UUID;
  cerimonia_nome TEXT;
  user_name TEXT;
  mensagem_final TEXT;
BEGIN
  -- Buscar nome da cerimônia (pode ser NULL se deletada em cascata)
  SELECT COALESCE(nome, medicina_principal, 'Cerimônia') INTO cerimonia_nome
  FROM cerimonias WHERE id = OLD.cerimonia_id;
  
  -- Se cerimônia não existe mais (deletada em cascata), não notificar
  IF cerimonia_nome IS NULL THEN
    RETURN OLD;
  END IF;
  
  -- Buscar nome do usuário
  SELECT COALESCE(full_name, 'Usuário') INTO user_name
  FROM profiles WHERE id = OLD.user_id;
  
  -- Garantir que user_name não é NULL
  IF user_name IS NULL THEN
    user_name := 'Usuário';
  END IF;
  
  -- Montar mensagem
  mensagem_final := user_name || ' cancelou inscrição em "' || cerimonia_nome || '".';
  
  -- Notificar cada admin
  FOR admin_id IN SELECT * FROM get_admin_user_ids()
  LOOP
    INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, url)
    VALUES (
      admin_id,
      'cancelamento',
      'Inscrição Cancelada',
      mensagem_final,
      '/admin'
    );
  END LOOP;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;;

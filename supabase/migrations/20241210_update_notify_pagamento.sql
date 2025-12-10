-- Atualiza trigger para notificar pagamento aprovado OU recusado
CREATE OR REPLACE FUNCTION notify_pagamento_confirmado()
RETURNS TRIGGER AS $$
DECLARE
  admin_id UUID;
  user_name TEXT;
  notif_titulo TEXT;
  notif_mensagem TEXT;
BEGIN
  -- Notificar se mudou para aprovado
  IF (OLD.mp_status IS DISTINCT FROM 'approved') AND NEW.mp_status = 'approved' THEN
    -- Buscar nome do usuário
    SELECT COALESCE(full_name, 'Usuário') INTO user_name
    FROM profiles WHERE id = NEW.user_id;
    
    -- Notificar o usuário
    INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, url)
    VALUES (
      NEW.user_id,
      'pagamento',
      'Pagamento Confirmado!',
      'Seu pagamento de ' || NEW.descricao || ' foi aprovado.',
      CASE WHEN NEW.tipo = 'produto' THEN '/loja' ELSE '/cerimonias' END
    );
    
    -- Notificar admins
    FOR admin_id IN SELECT * FROM get_admin_user_ids()
    LOOP
      IF admin_id != NEW.user_id THEN
        INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, url)
        VALUES (
          admin_id,
          'pagamento',
          'Pagamento Recebido',
          user_name || ' - ' || NEW.descricao,
          '/admin'
        );
      END IF;
    END LOOP;
  END IF;

  -- Notificar se mudou para recusado/rejeitado
  IF (OLD.mp_status IS DISTINCT FROM 'rejected') AND NEW.mp_status = 'rejected' THEN
    -- Notificar o usuário
    INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, url)
    VALUES (
      NEW.user_id,
      'pagamento_recusado',
      'Pagamento Recusado',
      'Seu pagamento de ' || NEW.descricao || ' foi recusado. Tente novamente.',
      CASE WHEN NEW.tipo = 'produto' THEN '/loja' ELSE '/cerimonias' END
    );
  END IF;

  -- Notificar se mudou para cancelled
  IF (OLD.mp_status IS DISTINCT FROM 'cancelled') AND NEW.mp_status = 'cancelled' THEN
    -- Notificar o usuário
    INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, url)
    VALUES (
      NEW.user_id,
      'pagamento_cancelado',
      'Pagamento Cancelado',
      'Seu pagamento de ' || NEW.descricao || ' foi cancelado.',
      CASE WHEN NEW.tipo = 'produto' THEN '/loja' ELSE '/cerimonias' END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

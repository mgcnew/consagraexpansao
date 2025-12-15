-- =====================================================
-- Corrige a URL da Edge Function de push notification
-- =====================================================

-- Atualizar a função para usar a URL correta do projeto
CREATE OR REPLACE FUNCTION send_onesignal_push()
RETURNS TRIGGER AS $$
BEGIN
  -- Fazer request assíncrono para a Edge Function
  PERFORM net.http_post(
    url := 'https://llwtmvpcrnjxmruxzzgb.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'userId', NEW.user_id::text,
      'title', NEW.titulo,
      'message', NEW.mensagem,
      'url', COALESCE(NEW.url, '/')
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro mas não falha a transação
    RAISE WARNING 'Erro ao enviar push notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

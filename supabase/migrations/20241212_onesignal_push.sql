-- =====================================================
-- Função para enviar push notification via OneSignal
-- Chamada pelos triggers quando notificações são criadas
-- =====================================================

-- Função que será chamada por um trigger para enviar push
-- Nota: Esta função usa pg_net para fazer HTTP request assíncrono
-- Você precisa habilitar a extensão pg_net no Supabase

-- Habilitar extensão pg_net (se não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Função para enviar push notification
CREATE OR REPLACE FUNCTION send_onesignal_push()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Buscar URL do projeto (você pode hardcodar ou usar variável de ambiente)
  -- Esta função faz uma chamada HTTP para a Edge Function
  
  -- Fazer request assíncrono para a Edge Function
  PERFORM net.http_post(
    url := 'https://xjrtfnlsxwdcvmvzyxao.supabase.co/functions/v1/send-push-notification',
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

-- Trigger para enviar push quando notificação é criada
DROP TRIGGER IF EXISTS trigger_send_push_on_notification ON notificacoes;
CREATE TRIGGER trigger_send_push_on_notification
  AFTER INSERT ON notificacoes
  FOR EACH ROW
  EXECUTE FUNCTION send_onesignal_push();

-- Nota: Para este trigger funcionar, você precisa:
-- 1. Habilitar pg_net no Supabase Dashboard (Database > Extensions)
-- 2. Configurar o service_role_key como variável de ambiente
-- 3. Fazer deploy da Edge Function send-push-notification

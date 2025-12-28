-- Atualiza função com chave correta
CREATE OR REPLACE FUNCTION send_chat_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  destinatario_id UUID;
  autor_nome TEXT;
  conversa_record RECORD;
BEGIN
  -- Buscar dados da conversa
  SELECT * INTO conversa_record
  FROM conversas
  WHERE id = NEW.conversa_id;
  
  -- Determinar quem é o destinatário (o outro participante)
  IF conversa_record.participante_1 = NEW.autor_id THEN
    destinatario_id := conversa_record.participante_2;
  ELSE
    destinatario_id := conversa_record.participante_1;
  END IF;
  
  -- Buscar nome do autor
  SELECT full_name INTO autor_nome
  FROM profiles
  WHERE id = NEW.autor_id;
  
  -- Enviar push notification via Edge Function
  PERFORM net.http_post(
    url := 'https://llwtmvpcrnjxmruxzzgb.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsd3RtdnBjcm5qeG1ydXh6emdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNDUzNTIsImV4cCI6MjA4MDcyMTM1Mn0.lKuVg8Yj4cmRz3PJMprtCvLjHJ5HksV7XaXXzXXcl-w'
    ),
    body := jsonb_build_object(
      'userId', destinatario_id::text,
      'title', COALESCE(autor_nome, 'Nova mensagem'),
      'message', LEFT(NEW.conteudo, 100),
      'url', '/chat',
      'data', jsonb_build_object(
        'type', 'chat_message',
        'conversa_id', NEW.conversa_id::text,
        'autor_id', NEW.autor_id::text
      )
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao enviar push de chat: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;;

-- Função para enviar convite de partilha às 22h do dia da cerimônia
CREATE OR REPLACE FUNCTION enviar_convites_partilha()
RETURNS void AS $$
DECLARE
  inscricao RECORD;
BEGIN
  -- Buscar inscrições de cerimônias que aconteceram hoje e ainda não receberam convite
  FOR inscricao IN 
    SELECT i.id, i.user_id, i.cerimonia_id, c.nome as cerimonia_nome
    FROM inscricoes i
    JOIN cerimonias c ON c.id = i.cerimonia_id
    WHERE c.data = CURRENT_DATE
      AND i.convite_partilha_enviado = FALSE
      AND i.pago = TRUE
  LOOP
    -- Criar notificação convidando a partilhar
    INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, url, dados)
    VALUES (
      inscricao.user_id,
      'convite_partilha',
      'Como foi sua experiência?',
      'Gostaríamos de saber como foi sua consagração. Compartilhe sua partilha com a comunidade.',
      '/partilhas',
      jsonb_build_object(
        'cerimonia_id', inscricao.cerimonia_id,
        'cerimonia_nome', inscricao.cerimonia_nome,
        'inscricao_id', inscricao.id
      )
    );
    
    -- Marcar convite como enviado
    UPDATE inscricoes
    SET convite_partilha_enviado = TRUE,
        convite_partilha_enviado_em = NOW()
    WHERE id = inscricao.id;
    
    -- Enviar push notification
    PERFORM net.http_post(
      url := 'https://llwtmvpcrnjxmruxzzgb.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsd3RtdnBjcm5qeG1ydXh6emdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNDUzNTIsImV4cCI6MjA4MDcyMTM1Mn0.lKuVg8Yj4cmRz3PJMprtCvLjHJ5HksV7XaXXzXXcl-w'
      ),
      body := jsonb_build_object(
        'userId', inscricao.user_id::text,
        'title', 'Como foi sua experiência?',
        'message', 'Compartilhe sua partilha com a comunidade',
        'url', '/partilhas'
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;;

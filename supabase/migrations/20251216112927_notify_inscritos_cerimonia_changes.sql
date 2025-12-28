-- Trigger para notificar inscritos quando cerimônia for DELETADA
CREATE OR REPLACE FUNCTION notify_inscritos_cerimonia_deletada()
RETURNS TRIGGER AS $$
DECLARE
  inscrito RECORD;
  cerimonia_nome TEXT;
  cerimonia_data TEXT;
BEGIN
  -- Montar nome da cerimônia
  cerimonia_nome := COALESCE(OLD.nome, OLD.medicina_principal, 'Cerimônia');
  cerimonia_data := TO_CHAR(OLD.data, 'DD/MM/YYYY');
  
  -- Notificar cada inscrito ativo (não cancelado)
  FOR inscrito IN 
    SELECT i.user_id 
    FROM inscricoes i 
    WHERE i.cerimonia_id = OLD.id 
    AND (i.cancelada IS NULL OR i.cancelada = false)
  LOOP
    INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, url)
    VALUES (
      inscrito.user_id,
      'alerta',
      'Cerimônia Cancelada',
      'A cerimônia "' || cerimonia_nome || '" do dia ' || cerimonia_data || ' foi cancelada. Entre em contato com a administração para mais informações.',
      '/cerimonias'
    );
  END LOOP;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger BEFORE DELETE para notificar antes da deleção em cascata
DROP TRIGGER IF EXISTS trigger_notify_inscritos_cerimonia_deletada ON cerimonias;
CREATE TRIGGER trigger_notify_inscritos_cerimonia_deletada
  BEFORE DELETE ON cerimonias
  FOR EACH ROW
  EXECUTE FUNCTION notify_inscritos_cerimonia_deletada();

-- Trigger para notificar inscritos quando cerimônia for EDITADA (data, horário ou local)
CREATE OR REPLACE FUNCTION notify_inscritos_cerimonia_editada()
RETURNS TRIGGER AS $$
DECLARE
  inscrito RECORD;
  cerimonia_nome TEXT;
  mudancas TEXT := '';
  data_antiga TEXT;
  data_nova TEXT;
BEGIN
  -- Verificar se houve mudança em campos importantes
  IF OLD.data = NEW.data AND OLD.horario = NEW.horario AND OLD.local = NEW.local THEN
    -- Nenhuma mudança relevante, não notificar
    RETURN NEW;
  END IF;
  
  -- Montar nome da cerimônia
  cerimonia_nome := COALESCE(NEW.nome, NEW.medicina_principal, 'Cerimônia');
  
  -- Montar lista de mudanças
  IF OLD.data <> NEW.data THEN
    data_antiga := TO_CHAR(OLD.data, 'DD/MM/YYYY');
    data_nova := TO_CHAR(NEW.data, 'DD/MM/YYYY');
    mudancas := mudancas || 'Data: ' || data_antiga || ' → ' || data_nova || '. ';
  END IF;
  
  IF OLD.horario <> NEW.horario THEN
    mudancas := mudancas || 'Horário: ' || OLD.horario || ' → ' || NEW.horario || '. ';
  END IF;
  
  IF OLD.local <> NEW.local THEN
    mudancas := mudancas || 'Local: ' || OLD.local || ' → ' || NEW.local || '. ';
  END IF;
  
  -- Notificar cada inscrito ativo (não cancelado)
  FOR inscrito IN 
    SELECT i.user_id 
    FROM inscricoes i 
    WHERE i.cerimonia_id = NEW.id 
    AND (i.cancelada IS NULL OR i.cancelada = false)
  LOOP
    INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, url)
    VALUES (
      inscrito.user_id,
      'alerta',
      'Cerimônia Alterada',
      'A cerimônia "' || cerimonia_nome || '" teve alterações: ' || mudancas,
      '/cerimonias'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger AFTER UPDATE para notificar após edição
DROP TRIGGER IF EXISTS trigger_notify_inscritos_cerimonia_editada ON cerimonias;
CREATE TRIGGER trigger_notify_inscritos_cerimonia_editada
  AFTER UPDATE ON cerimonias
  FOR EACH ROW
  EXECUTE FUNCTION notify_inscritos_cerimonia_editada();;

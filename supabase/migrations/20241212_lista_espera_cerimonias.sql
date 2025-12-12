-- Lista de espera para cerimônias esgotadas
-- Permite que usuários entrem na fila quando não há vagas

CREATE TABLE IF NOT EXISTS lista_espera_cerimonias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cerimonia_id UUID NOT NULL REFERENCES cerimonias(id) ON DELETE CASCADE,
  posicao INTEGER NOT NULL DEFAULT 1,
  notificado BOOLEAN DEFAULT FALSE,
  notificado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Cada usuário só pode estar uma vez na lista de espera de cada cerimônia
  UNIQUE(user_id, cerimonia_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_lista_espera_cerimonia ON lista_espera_cerimonias(cerimonia_id);
CREATE INDEX IF NOT EXISTS idx_lista_espera_user ON lista_espera_cerimonias(user_id);
CREATE INDEX IF NOT EXISTS idx_lista_espera_posicao ON lista_espera_cerimonias(cerimonia_id, posicao);

-- RLS
ALTER TABLE lista_espera_cerimonias ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver sua própria posição na lista
CREATE POLICY "Usuários podem ver sua lista de espera"
  ON lista_espera_cerimonias FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Usuários podem entrar na lista de espera
CREATE POLICY "Usuários podem entrar na lista de espera"
  ON lista_espera_cerimonias FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem sair da lista de espera
CREATE POLICY "Usuários podem sair da lista de espera"
  ON lista_espera_cerimonias FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins podem ver e gerenciar toda a lista
CREATE POLICY "Admins podem gerenciar lista de espera"
  ON lista_espera_cerimonias FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.role = 'admin'
    )
  );

-- Função para calcular próxima posição na fila
CREATE OR REPLACE FUNCTION get_proxima_posicao_lista_espera(p_cerimonia_id UUID)
RETURNS INTEGER AS $$
DECLARE
  max_posicao INTEGER;
BEGIN
  SELECT COALESCE(MAX(posicao), 0) INTO max_posicao
  FROM lista_espera_cerimonias
  WHERE cerimonia_id = p_cerimonia_id;
  
  RETURN max_posicao + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para definir posição automaticamente
CREATE OR REPLACE FUNCTION set_posicao_lista_espera()
RETURNS TRIGGER AS $$
BEGIN
  NEW.posicao := get_proxima_posicao_lista_espera(NEW.cerimonia_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_posicao_lista_espera ON lista_espera_cerimonias;
CREATE TRIGGER trigger_set_posicao_lista_espera
  BEFORE INSERT ON lista_espera_cerimonias
  FOR EACH ROW
  EXECUTE FUNCTION set_posicao_lista_espera();

-- Função para notificar próximo da fila quando vaga abrir
CREATE OR REPLACE FUNCTION notificar_proximo_lista_espera()
RETURNS TRIGGER AS $$
DECLARE
  proximo_user_id UUID;
  cerimonia_nome TEXT;
BEGIN
  -- Quando uma inscrição é cancelada, notificar próximo da fila
  IF TG_OP = 'DELETE' THEN
    -- Buscar próximo não notificado na fila
    SELECT le.user_id INTO proximo_user_id
    FROM lista_espera_cerimonias le
    WHERE le.cerimonia_id = OLD.cerimonia_id
      AND le.notificado = FALSE
    ORDER BY le.posicao ASC
    LIMIT 1;
    
    IF proximo_user_id IS NOT NULL THEN
      -- Buscar nome da cerimônia
      SELECT COALESCE(nome, medicina_principal, 'Cerimônia') INTO cerimonia_nome
      FROM cerimonias WHERE id = OLD.cerimonia_id;
      
      -- Criar notificação
      INSERT INTO notificacoes (user_id, tipo, titulo, mensagem)
      VALUES (
        proximo_user_id,
        'lista_espera',
        'Vaga disponível! 🎉',
        'Uma vaga abriu na cerimônia "' || cerimonia_nome || '". Corra para garantir seu lugar!'
      );
      
      -- Marcar como notificado
      UPDATE lista_espera_cerimonias
      SET notificado = TRUE, notificado_em = NOW()
      WHERE user_id = proximo_user_id AND cerimonia_id = OLD.cerimonia_id;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notificar_lista_espera ON inscricoes;
CREATE TRIGGER trigger_notificar_lista_espera
  AFTER DELETE ON inscricoes
  FOR EACH ROW
  EXECUTE FUNCTION notificar_proximo_lista_espera();

-- Tabela de Cursos e Eventos
CREATE TABLE IF NOT EXISTS cursos_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  horario_inicio TIME NOT NULL,
  horario_fim TIME,
  responsavel TEXT NOT NULL,
  valor INTEGER DEFAULT 0, -- em centavos, 0 = gratuito
  gratuito BOOLEAN DEFAULT true,
  vagas INTEGER,
  local TEXT,
  observacoes TEXT,
  banner_url TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabela de Inscrições em Cursos/Eventos
CREATE TABLE IF NOT EXISTS inscricoes_cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  curso_id UUID NOT NULL REFERENCES cursos_eventos(id) ON DELETE CASCADE,
  data_inscricao TIMESTAMPTZ DEFAULT NOW(),
  forma_pagamento TEXT,
  pago BOOLEAN DEFAULT false,
  observacoes TEXT,
  UNIQUE(user_id, curso_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cursos_eventos_data ON cursos_eventos(data_inicio);
CREATE INDEX IF NOT EXISTS idx_cursos_eventos_ativo ON cursos_eventos(ativo);
CREATE INDEX IF NOT EXISTS idx_inscricoes_cursos_user ON inscricoes_cursos(user_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_cursos_curso ON inscricoes_cursos(curso_id);

-- RLS Policies
ALTER TABLE cursos_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscricoes_cursos ENABLE ROW LEVEL SECURITY;

-- Cursos: todos autenticados podem ver cursos ativos
CREATE POLICY "Cursos visíveis para autenticados"
  ON cursos_eventos FOR SELECT
  TO authenticated
  USING (ativo = true);

-- Cursos: super_admin pode fazer tudo
CREATE POLICY "Super admin gerencia cursos"
  ON cursos_eventos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissoes up
      JOIN permissoes p ON up.permissao_id = p.id
      WHERE up.user_id = auth.uid() AND p.nome = 'super_admin'
    )
  );

-- Inscrições: usuário vê suas próprias inscrições
CREATE POLICY "Usuário vê próprias inscrições cursos"
  ON inscricoes_cursos FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Inscrições: usuário pode se inscrever
CREATE POLICY "Usuário pode se inscrever em cursos"
  ON inscricoes_cursos FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Inscrições: usuário pode cancelar própria inscrição
CREATE POLICY "Usuário pode cancelar inscrição curso"
  ON inscricoes_cursos FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Inscrições: super_admin vê todas
CREATE POLICY "Super admin vê todas inscrições cursos"
  ON inscricoes_cursos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissoes up
      JOIN permissoes p ON up.permissao_id = p.id
      WHERE up.user_id = auth.uid() AND p.nome = 'super_admin'
    )
  );

-- Inscrições: super_admin pode atualizar (marcar pago)
CREATE POLICY "Super admin atualiza inscrições cursos"
  ON inscricoes_cursos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissoes up
      JOIN permissoes p ON up.permissao_id = p.id
      WHERE up.user_id = auth.uid() AND p.nome = 'super_admin'
    )
  );

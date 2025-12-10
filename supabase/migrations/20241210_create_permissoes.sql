-- =====================================================
-- Sistema de Permissões Granulares
-- =====================================================

-- Tabela de permissões disponíveis
CREATE TABLE IF NOT EXISTS permissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(50) UNIQUE NOT NULL,
  descricao TEXT,
  categoria VARCHAR(30) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de permissões por usuário
CREATE TABLE IF NOT EXISTS user_permissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permissao_id UUID NOT NULL REFERENCES permissoes(id) ON DELETE CASCADE,
  concedido_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, permissao_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_permissoes_user_id ON user_permissoes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissoes_permissao_id ON user_permissoes(permissao_id);
CREATE INDEX IF NOT EXISTS idx_permissoes_categoria ON permissoes(categoria);

-- =====================================================
-- Inserir permissões padrão
-- =====================================================

INSERT INTO permissoes (nome, descricao, categoria) VALUES
  -- Consagradores
  ('ver_consagradores', 'Visualizar lista de consagradores e suas fichas', 'consagradores'),
  ('editar_consagradores', 'Alterar roles e dados dos consagradores', 'consagradores'),
  
  -- Cerimônias
  ('ver_cerimonias', 'Visualizar cerimônias e lista de inscritos', 'cerimonias'),
  ('gerenciar_cerimonias', 'Criar, editar e excluir cerimônias', 'cerimonias'),
  
  -- Financeiro
  ('ver_financeiro', 'Visualizar relatórios e dados financeiros', 'financeiro'),
  ('gerenciar_pagamentos', 'Marcar pagamentos como pago/pendente', 'financeiro'),
  
  -- Depoimentos
  ('aprovar_depoimentos', 'Aprovar ou rejeitar depoimentos pendentes', 'depoimentos'),
  
  -- Loja
  ('ver_loja_admin', 'Visualizar painel administrativo da loja', 'loja'),
  ('gerenciar_produtos', 'Criar, editar e excluir produtos da loja', 'loja'),
  
  -- Sistema
  ('super_admin', 'Acesso total ao sistema e gerenciamento de permissões', 'sistema')
ON CONFLICT (nome) DO NOTHING;

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE permissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissoes ENABLE ROW LEVEL SECURITY;

-- Permissões: todos autenticados podem ler (para verificar suas próprias)
DROP POLICY IF EXISTS "Authenticated can read permissoes" ON permissoes;
CREATE POLICY "Authenticated can read permissoes" ON permissoes
  FOR SELECT TO authenticated USING (true);

-- User_permissoes: usuário pode ver suas próprias permissões
DROP POLICY IF EXISTS "Users can read own permissoes" ON user_permissoes;
CREATE POLICY "Users can read own permissoes" ON user_permissoes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- User_permissoes: super_admin pode ver todas
DROP POLICY IF EXISTS "Super admin can read all permissoes" ON user_permissoes;
CREATE POLICY "Super admin can read all permissoes" ON user_permissoes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissoes up
      JOIN permissoes p ON up.permissao_id = p.id
      WHERE up.user_id = auth.uid() AND p.nome = 'super_admin'
    )
  );

-- User_permissoes: super_admin pode inserir/atualizar/deletar
DROP POLICY IF EXISTS "Super admin can manage permissoes" ON user_permissoes;
CREATE POLICY "Super admin can manage permissoes" ON user_permissoes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissoes up
      JOIN permissoes p ON up.permissao_id = p.id
      WHERE up.user_id = auth.uid() AND p.nome = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissoes up
      JOIN permissoes p ON up.permissao_id = p.id
      WHERE up.user_id = auth.uid() AND p.nome = 'super_admin'
    )
  );

-- =====================================================
-- Função helper para verificar permissão
-- =====================================================

CREATE OR REPLACE FUNCTION has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_permissoes up
    JOIN permissoes p ON up.permissao_id = p.id
    WHERE up.user_id = auth.uid() 
    AND (p.nome = permission_name OR p.nome = 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Grants
-- =====================================================

GRANT SELECT ON permissoes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_permissoes TO authenticated;

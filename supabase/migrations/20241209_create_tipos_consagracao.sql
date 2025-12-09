-- Tabela para armazenar os tipos de consagração/cerimônia
-- Permite que admins cadastrem novos tipos que aparecem no dropdown

CREATE TABLE IF NOT EXISTS tipos_consagracao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL UNIQUE,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca por nome
CREATE INDEX IF NOT EXISTS idx_tipos_consagracao_nome ON tipos_consagracao(nome);

-- Índice para filtrar ativos
CREATE INDEX IF NOT EXISTS idx_tipos_consagracao_ativo ON tipos_consagracao(ativo);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_tipos_consagracao_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tipos_consagracao_updated_at ON tipos_consagracao;
CREATE TRIGGER trigger_update_tipos_consagracao_updated_at
    BEFORE UPDATE ON tipos_consagracao
    FOR EACH ROW
    EXECUTE FUNCTION update_tipos_consagracao_updated_at();

-- Inserir alguns tipos padrão
INSERT INTO tipos_consagracao (nome, descricao) VALUES
    ('Ayahuasca', 'Cerimônia tradicional com a medicina sagrada Ayahuasca'),
    ('Rapé', 'Roda de cura com Rapé'),
    ('Sananga', 'Aplicação de Sananga para limpeza e clareza'),
    ('Kambo', 'Cerimônia de purificação com Kambo'),
    ('Jurema', 'Cerimônia com Jurema Sagrada'),
    ('Cacau', 'Cerimônia do Cacau Sagrado'),
    ('Temazcal', 'Cerimônia de purificação na tenda do suor')
ON CONFLICT (nome) DO NOTHING;

-- RLS Policies
ALTER TABLE tipos_consagracao ENABLE ROW LEVEL SECURITY;

-- Todos usuários autenticados podem ver tipos ativos
CREATE POLICY "Usuários podem ver tipos ativos"
    ON tipos_consagracao
    FOR SELECT
    TO authenticated
    USING (ativo = true);

-- Apenas admins podem inserir novos tipos (usando função is_admin existente)
CREATE POLICY "Admins podem inserir tipos"
    ON tipos_consagracao
    FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

-- Apenas admins podem atualizar tipos
CREATE POLICY "Admins podem atualizar tipos"
    ON tipos_consagracao
    FOR UPDATE
    TO authenticated
    USING (is_admin());

-- Apenas admins podem deletar tipos
CREATE POLICY "Admins podem deletar tipos"
    ON tipos_consagracao
    FOR DELETE
    TO authenticated
    USING (is_admin());

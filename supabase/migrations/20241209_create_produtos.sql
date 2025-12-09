-- Tabela de produtos para a loja
CREATE TABLE IF NOT EXISTS produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco INTEGER NOT NULL, -- Valor em centavos (ex: 5000 = R$ 50,00)
    preco_promocional INTEGER, -- Valor promocional em centavos (opcional)
    categoria VARCHAR(100),
    imagem_url TEXT,
    estoque INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    destaque BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_destaque ON produtos(destaque);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_produtos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_produtos_updated_at ON produtos;
CREATE TRIGGER trigger_update_produtos_updated_at
    BEFORE UPDATE ON produtos
    FOR EACH ROW
    EXECUTE FUNCTION update_produtos_updated_at();

-- Storage bucket para imagens de produtos
INSERT INTO storage.buckets (id, name, public)
VALUES ('produtos', 'produtos', true)
ON CONFLICT (id) DO NOTHING;

-- Política de storage: qualquer um pode ver
CREATE POLICY "Imagens de produtos são públicas"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'produtos');

-- Política de storage: apenas admins podem fazer upload
CREATE POLICY "Admins podem fazer upload de imagens de produtos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'produtos' AND
    is_admin()
);

-- Política de storage: apenas admins podem deletar
CREATE POLICY "Admins podem deletar imagens de produtos"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'produtos' AND
    is_admin()
);

-- RLS para tabela produtos
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

-- Todos podem ver produtos ativos
CREATE POLICY "Todos podem ver produtos ativos"
ON produtos FOR SELECT
TO authenticated
USING (ativo = true);

-- Admins podem ver todos os produtos
CREATE POLICY "Admins podem ver todos produtos"
ON produtos FOR SELECT
TO authenticated
USING (is_admin());

-- Apenas admins podem inserir
CREATE POLICY "Admins podem inserir produtos"
ON produtos FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Apenas admins podem atualizar
CREATE POLICY "Admins podem atualizar produtos"
ON produtos FOR UPDATE
TO authenticated
USING (is_admin());

-- Apenas admins podem deletar
CREATE POLICY "Admins podem deletar produtos"
ON produtos FOR DELETE
TO authenticated
USING (is_admin());

-- Categorias padrão (opcional - pode ser expandido)
CREATE TABLE IF NOT EXISTS categorias_produto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    icone VARCHAR(50),
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true
);

INSERT INTO categorias_produto (nome, icone, ordem) VALUES
    ('Artesanato', 'palette', 1),
    ('Vestuário', 'shirt', 2),
    ('Acessórios', 'gem', 3),
    ('Livros', 'book-open', 4),
    ('Outros', 'package', 99)
ON CONFLICT (nome) DO NOTHING;

-- RLS para categorias
ALTER TABLE categorias_produto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver categorias ativas"
ON categorias_produto FOR SELECT
TO authenticated
USING (ativo = true);

CREATE POLICY "Admins podem gerenciar categorias"
ON categorias_produto FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

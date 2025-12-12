-- Adicionar campo tipo_produto na tabela produtos
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS tipo_produto TEXT DEFAULT 'produto' 
  CHECK (tipo_produto IN ('produto', 'livro', 'ebook'));

-- Atualizar produtos existentes baseado no is_ebook
UPDATE produtos SET tipo_produto = 'ebook' WHERE is_ebook = true;
UPDATE produtos SET tipo_produto = 'livro' WHERE categoria = 'Livros' AND is_ebook = false;

-- Índice para tipo_produto
CREATE INDEX IF NOT EXISTS idx_produtos_tipo ON produtos(tipo_produto);

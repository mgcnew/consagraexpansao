-- Atualizar constraint de tipo para incluir 'curso'
ALTER TABLE pagamentos DROP CONSTRAINT IF EXISTS pagamentos_tipo_check;
ALTER TABLE pagamentos ADD CONSTRAINT pagamentos_tipo_check CHECK (tipo IN ('cerimonia', 'produto', 'curso'));;

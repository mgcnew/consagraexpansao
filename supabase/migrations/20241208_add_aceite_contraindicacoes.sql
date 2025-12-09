-- Migration: Adicionar coluna aceite_contraindicacoes na tabela anamneses
-- Esta coluna é necessária para o formulário de anamnese

-- Adicionar a coluna aceite_contraindicacoes se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anamneses' 
        AND column_name = 'aceite_contraindicacoes'
    ) THEN
        ALTER TABLE anamneses ADD COLUMN aceite_contraindicacoes BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Atualizar registros existentes para ter o valor padrão
UPDATE anamneses SET aceite_contraindicacoes = true WHERE aceite_contraindicacoes IS NULL;

-- Tornar a coluna NOT NULL após atualizar os registros existentes
ALTER TABLE anamneses ALTER COLUMN aceite_contraindicacoes SET NOT NULL;

-- Adicionar campo de autorização de uso de imagem na tabela anamneses
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS aceite_uso_imagem BOOLEAN DEFAULT false;

-- Comentário explicativo
COMMENT ON COLUMN anamneses.aceite_uso_imagem IS 'Autorização para uso de imagem em redes sociais e materiais de divulgação';

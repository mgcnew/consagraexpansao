-- Adicionar campo de aceite de permanência no templo
ALTER TABLE anamneses 
ADD COLUMN IF NOT EXISTS aceite_permanencia BOOLEAN DEFAULT false;

COMMENT ON COLUMN anamneses.aceite_permanencia IS 'Se o usuário aceita permanecer no templo até estar bem para sair após a cerimônia';;

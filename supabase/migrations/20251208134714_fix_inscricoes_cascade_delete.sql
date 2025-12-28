-- Remover a constraint antiga
ALTER TABLE inscricoes DROP CONSTRAINT inscricoes_cerimonia_id_fkey;

-- Recriar com CASCADE DELETE
ALTER TABLE inscricoes 
ADD CONSTRAINT inscricoes_cerimonia_id_fkey 
FOREIGN KEY (cerimonia_id) 
REFERENCES cerimonias(id) 
ON DELETE CASCADE;;

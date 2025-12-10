-- Adiciona coluna para autorização de compartilhamento no Instagram
ALTER TABLE depoimentos ADD COLUMN IF NOT EXISTS autoriza_instagram BOOLEAN DEFAULT false;

-- Comentário explicativo
COMMENT ON COLUMN depoimentos.autoriza_instagram IS 'Indica se o usuário autoriza compartilhar a partilha no Instagram do templo';

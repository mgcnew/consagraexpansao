-- RLS para config_taxas_mp
ALTER TABLE config_taxas_mp ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (todos podem ver as taxas)
DROP POLICY IF EXISTS "Taxas MP são públicas para leitura" ON config_taxas_mp;
CREATE POLICY "Taxas MP são públicas para leitura" ON config_taxas_mp
  FOR SELECT USING (true);

-- Política de escrita apenas para admins
DROP POLICY IF EXISTS "Apenas admins podem modificar taxas MP" ON config_taxas_mp;
CREATE POLICY "Apenas admins podem modificar taxas MP" ON config_taxas_mp
  FOR ALL USING (is_admin());;

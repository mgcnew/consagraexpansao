-- Habilitar pg_cron se não estiver
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar job para rodar às 22h todos os dias (horário de Brasília = UTC-3, então 22h BR = 01h UTC do dia seguinte)
-- Mas como Supabase usa UTC, vamos usar 01:00 UTC = 22:00 BRT
SELECT cron.schedule(
  'enviar-convites-partilha',
  '0 1 * * *',
  'SELECT enviar_convites_partilha()'
);;

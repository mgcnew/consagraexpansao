-- Remover triggers antigos duplicados (manter apenas os novos trigger_log_*)
DROP TRIGGER IF EXISTS log_anamneses_activity ON anamneses;
DROP TRIGGER IF EXISTS log_cerimonias_activity ON cerimonias;
DROP TRIGGER IF EXISTS log_cursos_activity ON cursos_eventos;
DROP TRIGGER IF EXISTS log_depoimentos_activity ON depoimentos;
DROP TRIGGER IF EXISTS log_inscricoes_activity ON inscricoes;
DROP TRIGGER IF EXISTS log_inscricoes_cursos_activity ON inscricoes_cursos;
DROP TRIGGER IF EXISTS log_pagamentos_activity ON pagamentos;
DROP TRIGGER IF EXISTS log_produtos_activity ON produtos;
DROP TRIGGER IF EXISTS trigger_log_inscricao ON inscricoes;;

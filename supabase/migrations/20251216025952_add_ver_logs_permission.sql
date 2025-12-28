-- Adicionar permissão para visualizar logs
INSERT INTO permissoes (nome, descricao, categoria)
VALUES ('ver_logs', 'Visualizar logs de atividades do sistema', 'sistema')
ON CONFLICT (nome) DO NOTHING;;

-- Adicionar permissão para gerenciar materiais
INSERT INTO permissoes (nome, descricao, categoria)
VALUES ('gerenciar_materiais', 'Pode criar, editar e excluir materiais de estudo', 'sistema')
ON CONFLICT (nome) DO NOTHING;;

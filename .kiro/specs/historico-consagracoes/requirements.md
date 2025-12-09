# Requirements Document

## Introduction

Este documento define os requisitos para o Histórico de Consagrações no Painel Administrativo do Portal Consciência Divinal. A funcionalidade permite que administradores visualizem o histórico completo de participações de cada consagrador, incluindo a capacidade de adicionar observações sobre cada trabalho específico.

## Glossary

- **Portal**: Sistema web Consciência Divinal
- **Consagrador**: Usuário que participa das cerimônias
- **Admin**: Administrador com acesso total ao sistema
- **Consagração**: Participação confirmada (pago = true) em uma cerimônia
- **Histórico**: Lista de todas as consagrações de um usuário específico
- **Observação**: Nota do administrador sobre uma consagração específica

---

## Requirements

### Requirement 1 - Visualização do Histórico por Consagrador

**User Story:** Como administrador, quero acessar o histórico de consagrações de cada consagrador, para que eu possa acompanhar a jornada de cada participante.

#### Acceptance Criteria

1. WHEN um administrador visualiza a lista de consagradores THEN o Portal SHALL exibir um botão ou link para acessar o histórico de cada um
2. WHEN um administrador acessa o histórico de um consagrador THEN o Portal SHALL exibir todas as inscrições com pagamento confirmado (pago = true)
3. WHEN o histórico é exibido THEN o Portal SHALL mostrar data da cerimônia, medicina utilizada, local e observações existentes
4. WHEN um consagrador não possui consagrações THEN o Portal SHALL exibir mensagem informativa "Nenhuma consagração registrada"

---

### Requirement 2 - Observações por Consagração

**User Story:** Como administrador, quero adicionar observações sobre cada consagração, para que eu possa registrar informações relevantes sobre a experiência do participante.

#### Acceptance Criteria

1. WHEN um administrador visualiza uma consagração no histórico THEN o Portal SHALL exibir campo para adicionar ou editar observação
2. WHEN um administrador salva uma observação THEN o Portal SHALL persistir o texto no banco de dados vinculado à inscrição
3. WHEN uma observação é salva com sucesso THEN o Portal SHALL exibir feedback visual de confirmação
4. WHEN uma observação já existe THEN o Portal SHALL permitir edição do texto existente

---

### Requirement 3 - Interface do Histórico

**User Story:** Como administrador, quero uma interface clara e organizada para o histórico, para que eu possa encontrar informações rapidamente.

#### Acceptance Criteria

1. WHEN o histórico é exibido THEN o Portal SHALL ordenar as consagrações por data decrescente (mais recente primeiro)
2. WHEN o histórico possui muitos registros THEN o Portal SHALL paginar os resultados
3. WHEN o administrador está em dispositivo móvel THEN o Portal SHALL exibir layout responsivo em formato de cards
4. WHEN o histórico é carregado THEN o Portal SHALL exibir skeleton loading durante o carregamento

---

### Requirement 4 - Contagem e Estatísticas

**User Story:** Como administrador, quero ver estatísticas básicas do consagrador, para que eu tenha uma visão geral da participação.

#### Acceptance Criteria

1. WHEN o histórico é exibido THEN o Portal SHALL mostrar o total de consagrações do usuário
2. WHEN o histórico é exibido THEN o Portal SHALL mostrar a data da primeira e última consagração
3. WHEN o histórico é exibido THEN o Portal SHALL listar as medicinas já consagradas pelo usuário

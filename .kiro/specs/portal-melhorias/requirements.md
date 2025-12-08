# Requirements Document

## Introduction

Este documento define os requisitos para melhorias do Portal Consciência Divinal, um sistema de gestão de cerimônias com medicinas sagradas. O plano abrange correções de bugs, refinamentos visuais, melhorias de UX e novas funcionalidades para tornar o portal mais robusto e profissional.

## Glossary

- **Portal**: Sistema web Consciência Divinal
- **Consagrador**: Usuário comum que participa das cerimônias
- **Guardião**: Usuário com permissões intermediárias de suporte
- **Admin**: Administrador com acesso total ao sistema
- **Anamnese**: Ficha de saúde obrigatória para participação
- **Cerimônia**: Evento sagrado com medicinas ancestrais
- **Depoimento**: Relato de experiência de um participante
- **RLS**: Row Level Security (políticas de segurança do Supabase)

---

## Requirements

### Requirement 1 - Correção de Bugs Críticos

**User Story:** Como administrador, quero visualizar os depoimentos pendentes de aprovação, para que eu possa moderar o conteúdo antes de publicar.

#### Acceptance Criteria

1. WHEN um consagrador envia um depoimento THEN o Portal SHALL armazenar o depoimento com status `aprovado = false`
2. WHEN um administrador acessa a aba de depoimentos no painel admin THEN o Portal SHALL exibir todos os depoimentos pendentes de todos os usuários
3. WHEN um administrador aprova um depoimento THEN o Portal SHALL atualizar o status para `aprovado = true` e exibir na página pública
4. WHEN um administrador rejeita um depoimento THEN o Portal SHALL remover o depoimento do banco de dados

---

### Requirement 2 - Refinamento Visual e UX

**User Story:** Como usuário, quero uma interface visual mais polida e consistente, para que minha experiência no portal seja agradável e profissional.

#### Acceptance Criteria

1. WHEN um usuário acessa a página 404 THEN o Portal SHALL exibir a mensagem em português com design consistente
2. WHEN um usuário navega pelo portal THEN o Portal SHALL manter consistência visual em todas as páginas
3. WHEN um usuário interage com formulários THEN o Portal SHALL fornecer feedback visual claro de loading e sucesso/erro
4. WHEN um usuário preenche a anamnese em múltiplos steps THEN o Portal SHALL salvar o progresso parcial automaticamente
5. WHEN um usuário acessa o portal em dispositivo móvel THEN o Portal SHALL exibir layout responsivo otimizado

---

### Requirement 3 - Gestão de Vagas em Cerimônias

**User Story:** Como consagrador, quero ver quantas vagas restam em uma cerimônia, para que eu saiba se ainda posso me inscrever.

#### Acceptance Criteria

1. WHEN um usuário visualiza uma cerimônia THEN o Portal SHALL exibir o número de vagas disponíveis (total - inscritos)
2. WHEN todas as vagas de uma cerimônia estiverem preenchidas THEN o Portal SHALL desabilitar o botão de inscrição e exibir "Esgotado"
3. WHEN um usuário cancela sua inscrição THEN o Portal SHALL incrementar o número de vagas disponíveis

---

### Requirement 4 - Histórico de Participações

**User Story:** Como consagrador, quero ver meu histórico de cerimônias, para que eu possa acompanhar minha jornada espiritual.

#### Acceptance Criteria

1. WHEN um usuário acessa seu perfil ou página dedicada THEN o Portal SHALL exibir lista de cerimônias que participou
2. WHEN um usuário visualiza seu histórico THEN o Portal SHALL mostrar data, medicina e status de pagamento de cada participação
3. WHEN um usuário tem depoimentos aprovados THEN o Portal SHALL exibir link para seus depoimentos no histórico

---

### Requirement 5 - Melhorias no Painel Administrativo

**User Story:** Como administrador, quero ferramentas avançadas de gestão, para que eu possa gerenciar o portal de forma eficiente.

#### Acceptance Criteria

1. WHEN um administrador acessa tabelas com muitos registros THEN o Portal SHALL paginar os resultados com 20 itens por página
2. WHEN um administrador precisa exportar dados THEN o Portal SHALL oferecer opção de exportar para CSV
3. WHEN um administrador busca um consagrador THEN o Portal SHALL permitir busca por nome, email ou data de cadastro
4. WHEN um administrador visualiza uma cerimônia THEN o Portal SHALL exibir lista de inscritos com status de pagamento

---

### Requirement 6 - Organização de Código e Arquitetura

**User Story:** Como desenvolvedor, quero um código bem organizado e tipado, para que a manutenção seja mais fácil e segura.

#### Acceptance Criteria

1. WHEN o código é analisado THEN o Portal SHALL ter tipos centralizados em arquivo dedicado
2. WHEN queries são executadas THEN o Portal SHALL usar hooks customizados para encapsular lógica
3. WHEN constantes são usadas THEN o Portal SHALL ter arquivo centralizado de constantes (rotas, mensagens)
4. WHEN componentes similares existem THEN o Portal SHALL reutilizar código através de componentes genéricos

---

### Requirement 7 - Melhorias de Segurança

**User Story:** Como administrador, quero garantir que o sistema seja seguro, para que dados sensíveis dos consagradores estejam protegidos.

#### Acceptance Criteria

1. WHEN políticas RLS são configuradas THEN o Portal SHALL garantir que admins possam ler todos os registros necessários
2. WHEN dados sensíveis são exibidos THEN o Portal SHALL mascarar informações como telefone e email parcialmente
3. WHEN um usuário tenta acessar rota protegida THEN o Portal SHALL validar permissões no backend via RLS

---

### Requirement 8 - Notificações e Comunicação

**User Story:** Como consagrador, quero receber lembretes sobre cerimônias, para que eu não esqueça de comparecer.

#### Acceptance Criteria

1. WHEN um usuário configura preferências de notificação THEN o Portal SHALL persistir as preferências no banco de dados
2. WHEN uma cerimônia está próxima (3 dias) THEN o Portal SHALL exibir lembrete no dashboard do usuário
3. WHEN um depoimento é aprovado THEN o Portal SHALL notificar o autor da aprovação

---

### Requirement 9 - Performance e Otimização

**User Story:** Como usuário, quero que o portal carregue rapidamente, para que minha experiência seja fluida.

#### Acceptance Criteria

1. WHEN rotas são carregadas THEN o Portal SHALL usar lazy loading para otimizar bundle inicial
2. WHEN imagens são exibidas THEN o Portal SHALL usar carregamento otimizado com placeholder
3. WHEN queries são executadas THEN o Portal SHALL implementar cache adequado com React Query

---

### Requirement 10 - Integração de Pagamento (Futuro)

**User Story:** Como consagrador, quero pagar minha inscrição online, para que o processo seja mais conveniente.

#### Acceptance Criteria

1. WHEN um usuário escolhe pagar via PIX THEN o Portal SHALL gerar QR Code dinâmico para pagamento
2. WHEN um pagamento é confirmado THEN o Portal SHALL atualizar automaticamente o status da inscrição
3. WHEN um usuário visualiza sua inscrição THEN o Portal SHALL exibir status do pagamento em tempo real

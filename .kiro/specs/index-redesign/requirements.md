# Requirements Document

## Introduction

Este documento define os requisitos para o redesign da página Index (Home) do Portal Consciência Divinal. O objetivo é transformar a página atual - que duplica os botões do menu - em uma experiência dinâmica e personalizada, mostrando conteúdo relevante para cada usuário: últimas fotos em carrossel, últimas consagrações, minhas consagrações e minhas partilhas.

## Glossary

- **Portal**: Sistema web Consciência Divinal
- **Index**: Página inicial/dashboard do portal após login
- **Carrossel**: Componente de exibição de imagens com navegação horizontal e lazy loading
- **Consagração**: Cerimônia realizada no templo (tabela `cerimonias`)
- **Inscrição**: Participação do usuário em uma cerimônia (tabela `inscricoes`)
- **Partilha**: Depoimento/relato de experiência do usuário (tabela `depoimentos`)
- **Galeria**: Fotos e vídeos das cerimônias (tabela `galeria`)
- **Lazy Loading**: Técnica de carregamento sob demanda para otimizar performance

---

## Requirements

### Requirement 1 - Carrossel de Últimas Fotos

**User Story:** Como usuário, quero ver as últimas fotos das cerimônias em um carrossel na página inicial, para que eu possa relembrar momentos e me conectar com a comunidade.

#### Acceptance Criteria

1. WHEN o usuário acessa a página Index THEN o Portal SHALL exibir um carrossel com as últimas 10 fotos da galeria ordenadas por data de criação
2. WHEN o carrossel é renderizado THEN o Portal SHALL carregar apenas a imagem visível e pré-carregar a próxima (lazy loading)
3. WHEN o usuário navega pelo carrossel THEN o Portal SHALL exibir indicadores de posição e botões de navegação
4. WHEN uma foto é clicada THEN o Portal SHALL abrir a imagem em tamanho maior com informações da cerimônia associada
5. WHEN não existem fotos na galeria THEN o Portal SHALL exibir uma mensagem amigável convidando a participar das cerimônias

---

### Requirement 2 - Seção de Últimas Consagrações

**User Story:** Como usuário, quero ver as próximas cerimônias disponíveis na página inicial, para que eu possa me inscrever rapidamente.

#### Acceptance Criteria

1. WHEN o usuário acessa a página Index THEN o Portal SHALL exibir as próximas 3 cerimônias com inscrições abertas ordenadas por data
2. WHEN uma cerimônia é exibida THEN o Portal SHALL mostrar título, data, local e número de vagas disponíveis
3. WHEN o usuário clica em uma cerimônia THEN o Portal SHALL navegar para a página de detalhes da cerimônia
4. WHEN não existem cerimônias futuras THEN o Portal SHALL exibir mensagem informando que novas datas serão anunciadas em breve
5. WHEN o usuário não possui anamnese THEN o Portal SHALL exibir indicador visual de que precisa preencher a ficha antes de se inscrever

---

### Requirement 3 - Seção Minhas Consagrações

**User Story:** Como usuário, quero ver minhas inscrições em cerimônias na página inicial, para que eu possa acompanhar minha participação.

#### Acceptance Criteria

1. WHEN o usuário acessa a página Index THEN o Portal SHALL exibir as últimas 3 inscrições do usuário ordenadas por data da cerimônia
2. WHEN uma inscrição é exibida THEN o Portal SHALL mostrar nome da cerimônia, data, status da inscrição (confirmada, pendente, cancelada)
3. WHEN o usuário clica em uma inscrição THEN o Portal SHALL navegar para a página de detalhes da cerimônia
4. WHEN o usuário não possui inscrições THEN o Portal SHALL exibir mensagem convidando a participar da primeira cerimônia
5. WHEN existe uma cerimônia nos próximos 7 dias THEN o Portal SHALL destacar visualmente como lembrete

---

### Requirement 4 - Seção Minhas Partilhas

**User Story:** Como usuário, quero ver meus depoimentos na página inicial, para que eu possa acompanhar minhas partilhas e seu status de aprovação.

#### Acceptance Criteria

1. WHEN o usuário acessa a página Index THEN o Portal SHALL exibir os últimos 3 depoimentos do usuário ordenados por data de criação
2. WHEN um depoimento é exibido THEN o Portal SHALL mostrar trecho do texto, data e status (aprovado, pendente)
3. WHEN o usuário clica em um depoimento THEN o Portal SHALL navegar para a página de depoimentos
4. WHEN o usuário não possui depoimentos THEN o Portal SHALL exibir mensagem convidando a compartilhar sua experiência
5. WHEN um depoimento está pendente THEN o Portal SHALL exibir indicador visual de "aguardando aprovação"

---

### Requirement 5 - Performance e Otimização

**User Story:** Como usuário, quero que a página inicial carregue rapidamente, para que eu tenha uma experiência fluida mesmo em conexões lentas.

#### Acceptance Criteria

1. WHEN a página Index é carregada THEN o Portal SHALL carregar dados de forma assíncrona sem bloquear a renderização inicial
2. WHEN imagens são carregadas THEN o Portal SHALL usar lazy loading para carregar apenas o conteúdo visível
3. WHEN os dados estão sendo carregados THEN o Portal SHALL exibir skeletons/placeholders nas seções
4. WHEN ocorre erro ao carregar uma seção THEN o Portal SHALL exibir mensagem de erro apenas na seção afetada sem quebrar a página
5. WHEN o usuário retorna à página THEN o Portal SHALL usar cache local para exibir dados imediatamente enquanto atualiza em background

---

### Requirement 6 - Layout Responsivo e Visual

**User Story:** Como usuário, quero uma página inicial visualmente agradável e funcional em qualquer dispositivo, para que eu possa acessar de onde estiver.

#### Acceptance Criteria

1. WHEN a página é exibida em mobile THEN o Portal SHALL adaptar o layout para uma coluna com seções empilhadas
2. WHEN a página é exibida em desktop THEN o Portal SHALL organizar as seções em grid de duas colunas
3. WHEN o usuário interage com elementos THEN o Portal SHALL aplicar transições suaves e feedback visual
4. WHEN a página é carregada THEN o Portal SHALL manter a paleta de cores sagrada definida (Verde Floresta, Âmbar, Creme)
5. WHEN o tema dark mode está ativo THEN o Portal SHALL adaptar as cores mantendo legibilidade e harmonia

---

### Requirement 7 - Alerta de Anamnese (Mantido)

**User Story:** Como usuário sem anamnese, quero um alerta claro na página inicial, para que eu entenda a importância de preencher minha ficha.

#### Acceptance Criteria

1. WHEN o usuário não possui anamnese THEN o Portal SHALL exibir card de alerta destacado no topo da página
2. WHEN o alerta é exibido THEN o Portal SHALL apresentar ícone, título e descrição com hierarquia visual clara
3. WHEN o botão de ação é clicado THEN o Portal SHALL navegar para a página de anamnese
4. WHEN o usuário possui anamnese THEN o Portal SHALL ocultar o alerta completamente


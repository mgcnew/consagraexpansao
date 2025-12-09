# Requirements Document

## Introduction

Este documento define os requisitos para o redesign visual da página Index (Home) do Portal Consciência Divinal. O objetivo é transformar a página atual em uma experiência visual profissional, com hierarquia de cores clara, consistência visual e uma estética que transmita seriedade e espiritualidade sem exageros.

## Glossary

- **Portal**: Sistema web Consciência Divinal
- **Index**: Página inicial/dashboard do portal após login
- **Paleta Sagrada**: Conjunto de cores definidas para o redesign
- **Verde Floresta (#1F4A43)**: Cor primária - cura, natureza, estabilidade
- **Âmbar Dourado (#E39B30)**: Cor de destaque - energia, luz
- **Terracota (#C25B33)**: Cor de força - aterramento
- **Carvão Esverdeado (#1A2120)**: Cor de texto - contraste, leitura
- **Creme Suave (#F7F5F0)**: Cor de fundo - limpeza, paz
- **Card**: Componente de navegação para seções do portal
- **Hero Section**: Área principal de boas-vindas com logo e título

---

## Requirements

### Requirement 1 - Sistema de Cores Profissional

**User Story:** Como usuário, quero uma paleta de cores harmoniosa e profissional, para que o portal transmita credibilidade e serenidade.

#### Acceptance Criteria

1. WHEN o usuário acessa a página Index THEN o Portal SHALL exibir fundo na cor Creme Suave (#F7F5F0) como background principal
2. WHEN elementos de texto principal são renderizados THEN o Portal SHALL usar Carvão Esverdeado (#1A2120) para máximo contraste e legibilidade
3. WHEN elementos interativos primários são exibidos THEN o Portal SHALL usar Verde Floresta (#1F4A43) como cor principal
4. WHEN elementos de destaque ou ação são necessários THEN o Portal SHALL usar Âmbar Dourado (#E39B30) com moderação
5. WHEN estados de alerta ou urgência são exibidos THEN o Portal SHALL usar Terracota (#C25B33) para chamar atenção

---

### Requirement 2 - Hero Section Impactante

**User Story:** Como usuário, quero uma seção de boas-vindas visualmente impressionante, para que eu me sinta acolhido ao entrar no portal.

#### Acceptance Criteria

1. WHEN o usuário acessa a página Index THEN o Portal SHALL exibir o logo com tamanho adequado e espaçamento generoso
2. WHEN o título de boas-vindas é renderizado THEN o Portal SHALL usar tipografia elegante com peso visual apropriado
3. WHEN a descrição é exibida THEN o Portal SHALL apresentar texto secundário com contraste adequado e espaçamento confortável
4. WHEN a hero section é carregada THEN o Portal SHALL aplicar animação suave de entrada sem exageros

---

### Requirement 3 - Cards de Navegação Refinados

**User Story:** Como usuário, quero cards de navegação elegantes e funcionais, para que eu possa acessar as seções do portal de forma intuitiva.

#### Acceptance Criteria

1. WHEN cards de navegação são exibidos THEN o Portal SHALL apresentar ícones com cor Verde Floresta e fundo sutil
2. WHEN o usuário passa o mouse sobre um card THEN o Portal SHALL aplicar transição suave com elevação e destaque na borda
3. WHEN um card requer atenção especial THEN o Portal SHALL destacar com borda ou fundo usando Âmbar Dourado
4. WHEN cards são renderizados THEN o Portal SHALL manter espaçamento consistente e alinhamento visual perfeito
5. WHEN o layout é exibido em mobile THEN o Portal SHALL adaptar cards para ocupar largura total com espaçamento adequado

---

### Requirement 4 - Alerta de Anamnese Destacado

**User Story:** Como usuário sem anamnese, quero um alerta visualmente claro mas não agressivo, para que eu entenda a importância de preencher minha ficha.

#### Acceptance Criteria

1. WHEN o usuário não possui anamnese THEN o Portal SHALL exibir card de alerta com fundo sutil usando Âmbar Dourado
2. WHEN o alerta é exibido THEN o Portal SHALL apresentar ícone, título e descrição com hierarquia visual clara
3. WHEN o botão de ação é renderizado THEN o Portal SHALL usar Verde Floresta como cor primária do botão
4. WHEN o alerta é visualizado em mobile THEN o Portal SHALL adaptar layout para empilhamento vertical

---

### Requirement 5 - Citação e Footer Elegantes

**User Story:** Como usuário, quero uma citação inspiradora apresentada de forma elegante, para que a experiência seja completa e memorável.

#### Acceptance Criteria

1. WHEN a citação é exibida THEN o Portal SHALL usar tipografia display em itálico com cor Verde Floresta
2. WHEN a citação é renderizada THEN o Portal SHALL aplicar espaçamento generoso acima e abaixo
3. WHEN o footer é exibido THEN o Portal SHALL manter consistência visual com o resto da página

---

### Requirement 6 - Consistência e Boas Práticas

**User Story:** Como desenvolvedor, quero código limpo e reutilizável, para que futuras páginas sigam o mesmo padrão visual.

#### Acceptance Criteria

1. WHEN as cores são definidas THEN o Portal SHALL usar variáveis CSS centralizadas no index.css
2. WHEN componentes são estilizados THEN o Portal SHALL usar classes Tailwind consistentes sem duplicação
3. WHEN animações são aplicadas THEN o Portal SHALL manter performance suave sem jank visual
4. WHEN o tema dark mode é considerado THEN o Portal SHALL manter variantes apropriadas das cores da paleta

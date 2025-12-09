# Implementation Plan - Index Page Redesign

## Fase 1: Sistema de Cores

- [ ] 1. Atualizar variáveis CSS com a Paleta Sagrada
  - [ ] 1.1 Definir novas variáveis CSS no index.css (light mode)
    - Adicionar --forest, --amber, --terracotta, --charcoal, --cream
    - Mapear para --primary, --background, --foreground, --accent, --destructive
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1_
  - [ ] 1.2 Definir variáveis CSS para dark mode
    - Ajustar luminosidade das cores para contraste adequado no tema escuro
    - _Requirements: 6.4_
  - [ ] 1.3 Atualizar tailwind.config.ts com novas cores
    - Adicionar forest, amber, terracotta, charcoal, cream ao extend.colors
    - _Requirements: 6.1_

---

## Fase 2: Redesign da Página Index

- [ ] 2. Redesenhar Hero Section
  - [ ] 2.1 Atualizar estrutura e estilos da hero section
    - Aplicar fundo cream, espaçamento generoso
    - Logo com tamanho adequado e animação suave
    - Título com tipografia Cinzel e cor charcoal
    - Subtítulo com cor muted apropriada
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 3. Redesenhar Alert de Anamnese
  - [ ] 3.1 Atualizar estilos do card de alerta
    - Fundo amber-light com borda amber sutil
    - Ícone com cor amber
    - Botão CTA com cor forest (primary)
    - Layout responsivo para mobile
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ]* 3.2 Escrever property test para alerta condicional
    - **Property 1: Alerta de Anamnese Condicional**
    - **Validates: Requirements 4.1**

- [ ] 4. Redesenhar Feature Cards
  - [ ] 4.1 Atualizar estilos dos cards de navegação
    - Ícones com cor forest e fundo forest-light
    - Hover com elevação, borda forest e transição suave
    - Card destacado (anamnese) com ring amber
    - Espaçamento consistente entre cards
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 5. Redesenhar Quote Section
  - [ ] 5.1 Atualizar estilos da citação
    - Tipografia display (Cinzel) em itálico
    - Cor forest com opacidade adequada
    - Espaçamento generoso acima e abaixo
    - _Requirements: 5.1, 5.2_

---

## Fase 3: Ajustes Finais

- [ ] 6. Revisar consistência e responsividade
  - [ ] 6.1 Testar layout em diferentes tamanhos de tela
    - Verificar cards em mobile (largura total)
    - Verificar alerta em mobile (empilhamento)
    - _Requirements: 3.5, 4.4_
  - [ ] 6.2 Verificar dark mode
    - Testar todas as cores no tema escuro
    - Ajustar se necessário para contraste adequado
    - _Requirements: 6.4_

- [ ] 7. Checkpoint Final
  - Verificar visualmente que todas as cores estão aplicadas corretamente
  - Confirmar que não há código duplicado ou classes desnecessárias
  - Ensure all tests pass, ask the user if questions arise.

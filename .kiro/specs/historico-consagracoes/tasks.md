# Implementation Plan - Histórico de Consagrações

## Fase 1: Banco de Dados

- [x] 1. Adicionar coluna de observações na tabela inscricoes





  - [x] 1.1 Criar migration para adicionar coluna observacoes_admin


    - Adicionar coluna TEXT nullable na tabela inscricoes
    - Executar migration no Supabase
    - _Requirements: 2.2_

  - [x] 1.2 Atualizar tipo Inscricao no TypeScript

    - Adicionar campo observacoes_admin: string | null
    - _Requirements: 2.2_

---

## Fase 2: Hooks e Lógica

- [x] 2. Criar hooks para histórico de consagrações






  - [x] 2.1 Criar hook useHistoricoConsagracoes

    - Buscar inscrições com pago = true para um userId
    - Join com cerimonias para dados completos
    - Ordenar por data decrescente
    - _Requirements: 1.2, 3.1_
  - [x] 2.2 Escrever property test para filtragem de histórico






    - **Property 1: Histórico contém apenas consagrações pagas**
    - **Validates: Requirements 1.2**
  - [x] 2.3 Escrever property test para ordenação






    - **Property 3: Ordenação decrescente por data**
    - **Validates: Requirements 3.1**
  - [x] 2.4 Criar hook useUpdateObservacao


    - Mutation para atualizar observacoes_admin
    - Invalidar cache do histórico após sucesso
    - _Requirements: 2.2_
  - [x] 2.5 Escrever property test para round-trip de observações






    - **Property 2: Round-trip de observações**
    - **Validates: Requirements 2.2**

- [x] 3. Criar função de cálculo de estatísticas






  - [x] 3.1 Implementar calcularStats

    - Calcular total, primeira/última data, medicinas distintas
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 3.2 Escrever property test para estatísticas






    - **Property 4: Estatísticas corretas**
    - **Validates: Requirements 4.1, 4.2, 4.3**

---

## Fase 3: Componente de Histórico

- [x] 4. Criar componente HistoricoConsagracoesDialog





  - [x] 4.1 Criar estrutura base do dialog


    - Dialog com header mostrando nome do consagrador
    - Área de estatísticas no topo
    - Lista de consagrações
    - _Requirements: 1.3, 4.1, 4.2, 4.3_

  - [x] 4.2 Implementar lista de consagrações

    - Card para cada consagração com data, medicina, local
    - Campo de texto para observação
    - Botão para salvar observação
    - _Requirements: 1.3, 2.1, 2.4_

  - [x] 4.3 Implementar estados de loading e vazio

    - Skeleton loading durante carregamento
    - Mensagem "Nenhuma consagração registrada" quando vazio
    - _Requirements: 1.4, 3.4_


  - [x] 4.4 Implementar responsividade mobile





    - Layout em cards para telas pequenas
    - _Requirements: 3.3_

---

## Fase 4: Integração no Admin

- [x] 5. Integrar histórico na página Admin





  - [x] 5.1 Adicionar botão "Ver Histórico" na lista de consagradores


    - Botão em cada linha da tabela desktop
    - Botão em cada card mobile
    - _Requirements: 1.1_

  - [x] 5.2 Adicionar state e handlers para o dialog

    - State para userId selecionado
    - Handler para abrir/fechar dialog
    - _Requirements: 1.1_

  - [x] 5.3 Implementar feedback de salvamento





    - Toast de sucesso ao salvar observação
    - Toast de erro em caso de falha
    - _Requirements: 2.3_

---

## Fase 5: Paginação (se necessário)

- [x] 6. Implementar paginação no histórico






  - [x] 6.1 Adicionar paginação na query

    - Limitar resultados por página
    - Controles de navegação
    - _Requirements: 3.2_

---

## Checkpoint Final

- [x] 7. Checkpoint - Verificar funcionalidade completa





  - Testar visualização de histórico de diferentes consagradores
  - Testar adição e edição de observações
  - Verificar estatísticas calculadas corretamente
  - Testar em mobile
  - Ensure all tests pass, ask the user if questions arise.

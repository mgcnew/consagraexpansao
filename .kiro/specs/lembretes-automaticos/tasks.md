# Implementation Plan - Lembretes Automáticos de Cerimônia

- [ ] 1. Criar migration para campos de controle de lembretes
  - [ ] 1.1 Adicionar campos na tabela inscricoes
    - Adicionar `lembrete_24h_enviado` (BOOLEAN DEFAULT FALSE)
    - Adicionar `lembrete_24h_enviado_em` (TIMESTAMPTZ)
    - Adicionar `lembrete_2h_enviado` (BOOLEAN DEFAULT FALSE)
    - Adicionar `lembrete_2h_enviado_em` (TIMESTAMPTZ)
    - Adicionar comentários explicativos nos campos
    - _Requirements: 3.1, 3.2_

- [ ] 2. Implementar função de lembretes de 24 horas
  - [ ] 2.1 Criar função SQL `enviar_lembretes_24h()`
    - Selecionar inscrições confirmadas (pago=true) de cerimônias entre 23-25h no futuro
    - Filtrar inscrições que ainda não receberam lembrete de 24h
    - Para cada inscrição: criar notificação in-app, atualizar flags, enviar push
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1_
  - [ ]* 2.2 Write property test para janela de tempo 24h
    - **Property 1: Janela de tempo 24h**
    - **Validates: Requirements 1.1**
  - [ ]* 2.3 Write property test para conteúdo do lembrete 24h
    - **Property 3: Conteúdo do lembrete 24h**
    - **Validates: Requirements 1.2**

- [ ] 3. Implementar função de lembretes de 2 horas
  - [ ] 3.1 Criar função SQL `enviar_lembretes_2h()`
    - Selecionar inscrições confirmadas de cerimônias entre 1.5-2.5h no futuro
    - Filtrar inscrições que ainda não receberam lembrete de 2h
    - Incluir mensagem de urgência e local na notificação
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.1_
  - [ ]* 3.2 Write property test para janela de tempo 2h
    - **Property 2: Janela de tempo 2h**
    - **Validates: Requirements 2.1**
  - [ ]* 3.3 Write property test para conteúdo do lembrete 2h
    - **Property 4: Conteúdo do lembrete 2h**
    - **Validates: Requirements 2.2**

- [ ] 4. Checkpoint - Verificar funções SQL
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implementar controles de envio e idempotência
  - [ ] 5.1 Adicionar verificações de flags antes do envio nas funções
    - Garantir que inscrições com flag=true são ignoradas
    - Garantir que inscrições canceladas são ignoradas
    - _Requirements: 3.3, 3.4_
  - [ ]* 5.2 Write property test para persistência de flags
    - **Property 5: Persistência de flags de envio**
    - **Validates: Requirements 1.3, 2.3, 3.1, 3.2**
  - [ ]* 5.3 Write property test para idempotência
    - **Property 6: Idempotência de envio**
    - **Validates: Requirements 1.4, 2.4, 3.3**
  - [ ]* 5.4 Write property test para filtragem de inscrições
    - **Property 7: Filtragem de inscrições não confirmadas**
    - **Validates: Requirements 3.4**

- [ ] 6. Configurar jobs pg_cron
  - [ ] 6.1 Criar job para lembretes de 24h
    - Schedule: `0 * * * *` (a cada hora)
    - Chamar função `enviar_lembretes_24h()`
    - _Requirements: 4.1_
  - [ ] 6.2 Criar job para lembretes de 2h
    - Schedule: `*/30 * * * *` (a cada 30 minutos)
    - Chamar função `enviar_lembretes_2h()`
    - _Requirements: 4.2_
  - [ ]* 6.3 Write property test para completude de processamento
    - **Property 8: Completude de processamento**
    - **Validates: Requirements 4.3**

- [ ] 7. Implementar notificações in-app
  - [ ] 7.1 Garantir criação de registro em notificacoes
    - Tipo: 'lembrete_cerimonia_24h' ou 'lembrete_cerimonia_2h'
    - URL apontando para detalhes da cerimônia
    - Dados JSON com cerimonia_id, nome e inscricao_id
    - _Requirements: 5.1, 5.3_
  - [ ]* 7.2 Write property test para notificação in-app
    - **Property 9: Notificação in-app criada**
    - **Validates: Requirements 5.1**
  - [ ]* 7.3 Write property test para URL de redirecionamento
    - **Property 10: URL de redirecionamento**
    - **Validates: Requirements 5.3**

- [ ] 8. Atualizar tipos TypeScript
  - [ ] 8.1 Adicionar campos de lembrete no tipo Inscricao
    - Atualizar `src/types/index.ts` com novos campos
    - _Requirements: 3.1, 3.2_

- [ ] 9. Checkpoint Final
  - Ensure all tests pass, ask the user if questions arise.

# Requirements Document

## Introduction

Este documento define os requisitos para implementação de Lembretes Automáticos de Cerimônia no Portal Consciência Divinal. O sistema enviará notificações push automáticas para lembrar os consagradores sobre cerimônias próximas, melhorando a taxa de comparecimento e a experiência do usuário.

## Glossary

- **Lembrete**: Notificação push enviada automaticamente antes de uma cerimônia
- **Consagrador**: Usuário inscrito em uma cerimônia
- **Push Notification**: Notificação enviada via OneSignal para dispositivos móveis/desktop
- **pg_cron**: Extensão do PostgreSQL para agendamento de jobs
- **Inscrição confirmada**: Inscrição com `pago = true` e `status = 'confirmada'`

---

## Requirements

### Requirement 1 - Lembrete 24 horas antes

**User Story:** Como consagrador, quero receber um lembrete 24 horas antes da cerimônia, para que eu possa me preparar adequadamente.

#### Acceptance Criteria

1. WHEN faltam 24 horas para uma cerimônia THEN o Portal SHALL enviar push notification para todos os inscritos confirmados
2. WHEN o lembrete é enviado THEN o Portal SHALL incluir nome da cerimônia, data e horário
3. WHEN o lembrete é enviado THEN o Portal SHALL registrar na tabela `inscricoes` que o lembrete foi enviado
4. WHEN um usuário já recebeu o lembrete de 24h THEN o Portal SHALL NOT enviar novamente

---

### Requirement 2 - Lembrete 2 horas antes

**User Story:** Como consagrador, quero receber um lembrete 2 horas antes da cerimônia, para que eu não esqueça de comparecer.

#### Acceptance Criteria

1. WHEN faltam 2 horas para uma cerimônia THEN o Portal SHALL enviar push notification para todos os inscritos confirmados
2. WHEN o lembrete é enviado THEN o Portal SHALL incluir mensagem de urgência e local da cerimônia
3. WHEN o lembrete é enviado THEN o Portal SHALL registrar na tabela `inscricoes` que o lembrete foi enviado
4. WHEN um usuário já recebeu o lembrete de 2h THEN o Portal SHALL NOT enviar novamente

---

### Requirement 3 - Controle de envio de lembretes

**User Story:** Como sistema, quero controlar quais lembretes já foram enviados, para evitar spam e duplicações.

#### Acceptance Criteria

1. WHEN um lembrete é enviado THEN o Portal SHALL atualizar campo `lembrete_24h_enviado` ou `lembrete_2h_enviado` para TRUE
2. WHEN um lembrete é enviado THEN o Portal SHALL registrar timestamp em `lembrete_24h_enviado_em` ou `lembrete_2h_enviado_em`
3. WHEN o job de lembretes executa THEN o Portal SHALL verificar os campos de controle antes de enviar
4. WHEN uma inscrição é cancelada THEN o Portal SHALL NOT enviar lembretes para ela

---

### Requirement 4 - Agendamento automático via pg_cron

**User Story:** Como administrador, quero que os lembretes sejam enviados automaticamente, sem intervenção manual.

#### Acceptance Criteria

1. WHEN o sistema é configurado THEN o Portal SHALL criar job pg_cron para verificar lembretes de 24h a cada hora
2. WHEN o sistema é configurado THEN o Portal SHALL criar job pg_cron para verificar lembretes de 2h a cada 30 minutos
3. WHEN o job executa THEN o Portal SHALL processar todas as cerimônias elegíveis
4. WHEN ocorre erro no envio THEN o Portal SHALL registrar log para debugging

---

### Requirement 5 - Notificação in-app

**User Story:** Como consagrador, quero ver os lembretes também dentro do app, caso eu não tenha recebido o push.

#### Acceptance Criteria

1. WHEN um lembrete é enviado THEN o Portal SHALL criar registro na tabela `notificacoes`
2. WHEN o usuário acessa o portal THEN o Portal SHALL exibir notificações não lidas
3. WHEN o usuário clica na notificação THEN o Portal SHALL redirecionar para detalhes da cerimônia

---

## Technical Notes

### Campos a adicionar na tabela `inscricoes`:
- `lembrete_24h_enviado` (BOOLEAN DEFAULT FALSE)
- `lembrete_24h_enviado_em` (TIMESTAMP WITH TIME ZONE)
- `lembrete_2h_enviado` (BOOLEAN DEFAULT FALSE)
- `lembrete_2h_enviado_em` (TIMESTAMP WITH TIME ZONE)

### Jobs pg_cron:
- `enviar-lembretes-24h`: Executa a cada hora (0 * * * *)
- `enviar-lembretes-2h`: Executa a cada 30 minutos (*/30 * * * *)

### Integração existente:
- OneSignal já configurado (#[[file:src/lib/onesignal.ts]])
- Edge Function `send-push-notification` já existe (#[[file:supabase/functions/send-push-notification/index.ts]])
- Padrão de jobs pg_cron já estabelecido (#[[file:supabase/migrations/20241214_confirmacao_presenca_convite_partilha.sql]])

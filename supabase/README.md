# Supabase Migrations

Este diretório contém scripts SQL para serem executados no Supabase.

## Documentação

- **[RLS_POLICIES.md](./RLS_POLICIES.md)** - Documentação completa das políticas de Row Level Security

## Como aplicar as migrações

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Copie o conteúdo do arquivo de migração desejado
5. Cole no editor SQL e clique em **Run**

### Opção 2: Via Supabase CLI

Se você tiver o Supabase CLI instalado e configurado:

```bash
supabase db push
```

## Migrações Disponíveis

### 20241208_complete_rls_audit.sql (RECOMENDADO)

**Descrição:** Script completo que configura todas as políticas RLS para todas as tabelas do sistema.

**Tabelas cobertas:**
- `roles` - Definição de papéis
- `user_roles` - Associação usuário-papel
- `profiles` - Perfis de usuários
- `anamneses` - Fichas de saúde
- `cerimonias` - Cerimônias/eventos
- `inscricoes` - Inscrições em cerimônias
- `depoimentos` - Depoimentos dos participantes
- `notificacoes` - Notificações do sistema

**Requisito:** 7.1 - Garantir que admins possam ler todos os registros necessários

### 20241208_fix_all_rls.sql

**Descrição:** Correção das políticas RLS para roles, user_roles, profiles e depoimentos.

### 20241208_fix_depoimentos_rls.sql

**Descrição:** Corrige as políticas RLS da tabela `depoimentos` para permitir que administradores visualizem todos os depoimentos (aprovados e pendentes).

**Problema resolvido:** Bug onde depoimentos pendentes não apareciam no painel administrativo.

**Requisito:** 1.2 - WHEN um administrador acessa a aba de depoimentos no painel admin THEN o Portal SHALL exibir todos os depoimentos pendentes de todos os usuários.

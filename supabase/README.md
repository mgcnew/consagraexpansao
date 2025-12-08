# Supabase Migrations

Este diretório contém scripts SQL para serem executados no Supabase.

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

### 20241208_fix_depoimentos_rls.sql

**Descrição:** Corrige as políticas RLS da tabela `depoimentos` para permitir que administradores visualizem todos os depoimentos (aprovados e pendentes).

**Problema resolvido:** Bug onde depoimentos pendentes não apareciam no painel administrativo.

**Requisito:** 1.2 - WHEN um administrador acessa a aba de depoimentos no painel admin THEN o Portal SHALL exibir todos os depoimentos pendentes de todos os usuários.

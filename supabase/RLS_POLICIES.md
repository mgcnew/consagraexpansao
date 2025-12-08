# Documentação de Políticas RLS - Portal Consciência Divinal

## Visão Geral

Este documento descreve todas as políticas de Row Level Security (RLS) configuradas no Supabase para o Portal Consciência Divinal. As políticas garantem que cada usuário só possa acessar os dados apropriados ao seu papel.

**Última atualização:** Dezembro 2024  
**Requisito:** 7.1 - Garantir que admins possam ler todos os registros necessários

---

## Papéis do Sistema

| Papel | Descrição | Permissões Gerais |
|-------|-----------|-------------------|
| `admin` | Administrador do sistema | Acesso total a todas as tabelas |
| `guardiao` | Usuário com permissões intermediárias | Leitura ampliada, escrita limitada |
| `consagrador` | Usuário comum/participante | Acesso apenas aos próprios dados |

---

## Tabelas e Políticas

### 1. `roles` - Definição de Papéis

**Descrição:** Tabela que define os papéis disponíveis no sistema.

| Operação | Política | Quem pode | Condição |
|----------|----------|-----------|----------|
| SELECT | `Authenticated can read roles` | Todos autenticados | `true` |
| INSERT | - | Ninguém via app | Gerenciado via SQL |
| UPDATE | - | Ninguém via app | Gerenciado via SQL |
| DELETE | - | Ninguém via app | Gerenciado via SQL |

**Justificativa:** Todos os usuários autenticados precisam ler os papéis para verificar permissões.

---

### 2. `user_roles` - Associação Usuário-Papel

**Descrição:** Tabela que associa usuários aos seus papéis.

| Operação | Política | Quem pode | Condição |
|----------|----------|-----------|----------|
| SELECT | `Authenticated can read user_roles` | Todos autenticados | `true` |
| INSERT | `Admins can insert user_roles` | Apenas admins | Verificação de role admin |
| UPDATE | `Admins can update user_roles` | Apenas admins | Verificação de role admin |
| DELETE | `Admins can delete user_roles` | Apenas admins | Verificação de role admin |

**Justificativa:** Leitura aberta para verificação de permissões; escrita restrita a admins.

---

### 3. `profiles` - Perfis de Usuários

**Descrição:** Informações básicas dos usuários (nome, data nascimento, preferências de notificação, etc).

**Colunas:**
- `id` - UUID do usuário
- `full_name` - Nome completo
- `birth_date` - Data de nascimento
- `referral_source` - Fonte de indicação
- `referral_name` - Nome de quem indicou
- `created_at` - Data de criação
- `email_notifications` - Preferência de notificações por email (boolean, default: true)
- `whatsapp_notifications` - Preferência de lembretes via WhatsApp (boolean, default: true)

| Operação | Política | Quem pode | Condição |
|----------|----------|-----------|----------|
| SELECT | `Authenticated users can read all profiles` | Todos autenticados | `true` |
| INSERT | `Users can insert own profile` | Próprio usuário | `id = auth.uid()` |
| UPDATE | `Users can update own profile` | Próprio usuário | `id = auth.uid()` |
| DELETE | - | Ninguém via app | Gerenciado via SQL |

**Justificativa:** Perfis são públicos para exibir nomes em depoimentos e listas; cada usuário só edita o próprio perfil.

---

### 4. `anamneses` - Fichas de Saúde

**Descrição:** Informações médicas sensíveis dos participantes.

| Operação | Política | Quem pode | Condição |
|----------|----------|-----------|----------|
| SELECT | `Users can read own anamnese` | Próprio usuário | `user_id = auth.uid()` |
| SELECT | `Admins can read all anamneses` | Admins | Verificação de role admin |
| INSERT | `Users can insert own anamnese` | Próprio usuário | `user_id = auth.uid()` |
| UPDATE | `Users can update own anamnese` | Próprio usuário | `user_id = auth.uid()` |
| DELETE | - | Ninguém via app | Dados médicos preservados |

**Justificativa:** Dados médicos são sensíveis; apenas o próprio usuário e admins podem acessar.

**⚠️ AÇÃO NECESSÁRIA:** Verificar se estas políticas estão implementadas no Supabase.

---

### 5. `cerimonias` - Cerimônias/Eventos

**Descrição:** Informações sobre as cerimônias disponíveis.

| Operação | Política | Quem pode | Condição |
|----------|----------|-----------|----------|
| SELECT | `Anyone can read cerimonias` | Todos autenticados | `true` |
| INSERT | `Admins can insert cerimonias` | Apenas admins | Verificação de role admin |
| UPDATE | `Admins can update cerimonias` | Apenas admins | Verificação de role admin |
| DELETE | `Admins can delete cerimonias` | Apenas admins | Verificação de role admin |

**Justificativa:** Cerimônias são públicas para visualização; apenas admins gerenciam.

**⚠️ AÇÃO NECESSÁRIA:** Verificar se estas políticas estão implementadas no Supabase.

---

### 6. `inscricoes` - Inscrições em Cerimônias

**Descrição:** Registro de inscrições dos usuários em cerimônias.

| Operação | Política | Quem pode | Condição |
|----------|----------|-----------|----------|
| SELECT | `Users can read own inscricoes` | Próprio usuário | `user_id = auth.uid()` |
| SELECT | `Admins can read all inscricoes` | Admins | Verificação de role admin |
| INSERT | `Users can insert own inscricoes` | Próprio usuário | `user_id = auth.uid()` |
| UPDATE | `Users can update own inscricoes` | Próprio usuário | `user_id = auth.uid()` |
| UPDATE | `Admins can update inscricoes` | Admins | Verificação de role admin |
| DELETE | `Users can delete own inscricoes` | Próprio usuário | `user_id = auth.uid()` |

**Justificativa:** Usuários gerenciam suas próprias inscrições; admins têm visão completa.

**⚠️ AÇÃO NECESSÁRIA:** Verificar se estas políticas estão implementadas no Supabase.

---

### 7. `depoimentos` - Depoimentos dos Participantes

**Descrição:** Relatos de experiência dos participantes.

| Operação | Política | Quem pode | Condição |
|----------|----------|-----------|----------|
| SELECT | `Users can read own depoimentos` | Próprio usuário | `user_id = auth.uid()` |
| SELECT | `Anyone can read approved depoimentos` | Todos autenticados | `aprovado = true` |
| SELECT | `Admins can read all depoimentos` | Admins | Verificação de role admin |
| INSERT | `Users can insert own depoimentos` | Próprio usuário | `user_id = auth.uid()` |
| UPDATE | `Admins can update depoimentos` | Apenas admins | Verificação de role admin |
| DELETE | `Admins can delete depoimentos` | Apenas admins | Verificação de role admin |

**Justificativa:** Depoimentos aprovados são públicos; pendentes visíveis apenas para autor e admins.

**✅ IMPLEMENTADO:** Políticas corrigidas em `20241208_fix_all_rls.sql`

---

### 8. `notificacoes` - Notificações do Sistema

**Descrição:** Notificações e alertas do sistema.

| Operação | Política | Quem pode | Condição |
|----------|----------|-----------|----------|
| SELECT | `Admins can read notificacoes` | Admins | Verificação de role admin |
| INSERT | `System can insert notificacoes` | Sistema/Triggers | Via funções do banco |
| UPDATE | `Admins can update notificacoes` | Admins | Verificação de role admin |
| DELETE | - | Ninguém via app | Histórico preservado |

**Justificativa:** Notificações são gerenciadas pelo sistema e visualizadas por admins.

**⚠️ AÇÃO NECESSÁRIA:** Verificar se estas políticas estão implementadas no Supabase.

---

## Padrão de Verificação de Admin

Todas as políticas que verificam se o usuário é admin usam o seguinte padrão:

```sql
EXISTS (
  SELECT 1 FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = auth.uid()
  AND r.role = 'admin'
)
```

---

## Grants Necessários

```sql
-- Permissões básicas para usuários autenticados
GRANT SELECT ON roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON depoimentos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON inscricoes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON anamneses TO authenticated;
GRANT SELECT ON cerimonias TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON cerimonias TO authenticated; -- Para admins
GRANT SELECT, UPDATE ON notificacoes TO authenticated;
```

---

## Checklist de Auditoria

### Tabelas com RLS Confirmado ✅
- [x] `roles` - Políticas implementadas
- [x] `user_roles` - Políticas implementadas
- [x] `profiles` - Políticas implementadas
- [x] `depoimentos` - Políticas implementadas e corrigidas

### Tabelas que Precisam Verificação ⚠️
- [ ] `anamneses` - Verificar políticas no Supabase Dashboard
- [ ] `cerimonias` - Verificar políticas no Supabase Dashboard
- [ ] `inscricoes` - Verificar políticas no Supabase Dashboard
- [ ] `notificacoes` - Verificar políticas no Supabase Dashboard

---

## Como Verificar Políticas no Supabase

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Authentication** > **Policies**
4. Selecione cada tabela e verifique as políticas configuradas
5. Compare com este documento

---

## Como Aplicar Políticas Faltantes

Se alguma política estiver faltando, use o SQL Editor do Supabase para aplicar.

### Exemplo para `anamneses`:

```sql
-- Habilitar RLS
ALTER TABLE anamneses ENABLE ROW LEVEL SECURITY;

-- Usuários podem ler própria anamnese
CREATE POLICY "Users can read own anamnese"
ON anamneses FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins podem ler todas as anamneses
CREATE POLICY "Admins can read all anamneses"
ON anamneses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.role = 'admin'
  )
);

-- Usuários podem inserir própria anamnese
CREATE POLICY "Users can insert own anamnese"
ON anamneses FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar própria anamnese
CREATE POLICY "Users can update own anamnese"
ON anamneses FOR UPDATE
TO authenticated
USING (user_id = auth.uid());
```

---

## Histórico de Alterações

| Data | Alteração | Arquivo de Migração |
|------|-----------|---------------------|
| 2024-12-08 | Correção RLS depoimentos | `20241208_fix_depoimentos_rls.sql` |
| 2024-12-08 | Correção RLS completa | `20241208_fix_all_rls.sql` |



---

## Matriz de Permissões por Papel

### Legenda
- ✅ Permitido
- ❌ Não permitido
- 🔒 Apenas próprios dados
- 📋 Apenas aprovados

### Tabela: `profiles`

| Operação | Admin | Guardião | Consagrador |
|----------|-------|----------|-------------|
| SELECT | ✅ Todos | ✅ Todos | ✅ Todos |
| INSERT | 🔒 Próprio | 🔒 Próprio | 🔒 Próprio |
| UPDATE | 🔒 Próprio | 🔒 Próprio | 🔒 Próprio |
| DELETE | ❌ | ❌ | ❌ |

### Tabela: `anamneses`

| Operação | Admin | Guardião | Consagrador |
|----------|-------|----------|-------------|
| SELECT | ✅ Todos | 🔒 Próprio | 🔒 Próprio |
| INSERT | 🔒 Próprio | 🔒 Próprio | 🔒 Próprio |
| UPDATE | 🔒 Próprio | 🔒 Próprio | 🔒 Próprio |
| DELETE | ❌ | ❌ | ❌ |

### Tabela: `cerimonias`

| Operação | Admin | Guardião | Consagrador |
|----------|-------|----------|-------------|
| SELECT | ✅ Todos | ✅ Todos | ✅ Todos |
| INSERT | ✅ | ❌ | ❌ |
| UPDATE | ✅ | ❌ | ❌ |
| DELETE | ✅ | ❌ | ❌ |

### Tabela: `inscricoes`

| Operação | Admin | Guardião | Consagrador |
|----------|-------|----------|-------------|
| SELECT | ✅ Todos | 🔒 Próprio | 🔒 Próprio |
| INSERT | 🔒 Próprio | 🔒 Próprio | 🔒 Próprio |
| UPDATE | ✅ Todos | 🔒 Próprio | 🔒 Próprio |
| DELETE | 🔒 Próprio | 🔒 Próprio | 🔒 Próprio |

### Tabela: `depoimentos`

| Operação | Admin | Guardião | Consagrador |
|----------|-------|----------|-------------|
| SELECT | ✅ Todos | 🔒 Próprio + 📋 | 🔒 Próprio + 📋 |
| INSERT | 🔒 Próprio | 🔒 Próprio | 🔒 Próprio |
| UPDATE | ✅ Todos | ❌ | ❌ |
| DELETE | ✅ Todos | ❌ | ❌ |

### Tabela: `notificacoes`

| Operação | Admin | Guardião | Consagrador |
|----------|-------|----------|-------------|
| SELECT | ✅ Todos | ❌ | ❌ |
| INSERT | ❌ (Sistema) | ❌ | ❌ |
| UPDATE | ✅ Todos | ❌ | ❌ |
| DELETE | ❌ | ❌ | ❌ |

### Tabela: `roles`

| Operação | Admin | Guardião | Consagrador |
|----------|-------|----------|-------------|
| SELECT | ✅ Todos | ✅ Todos | ✅ Todos |
| INSERT | ❌ (SQL) | ❌ | ❌ |
| UPDATE | ❌ (SQL) | ❌ | ❌ |
| DELETE | ❌ (SQL) | ❌ | ❌ |

### Tabela: `user_roles`

| Operação | Admin | Guardião | Consagrador |
|----------|-------|----------|-------------|
| SELECT | ✅ Todos | ✅ Todos | ✅ Todos |
| INSERT | ✅ | ❌ | ❌ |
| UPDATE | ✅ | ❌ | ❌ |
| DELETE | ✅ | ❌ | ❌ |

---

## Considerações de Segurança

### Dados Sensíveis

1. **Anamneses**: Contém informações médicas sensíveis. Acesso restrito ao próprio usuário e admins.
2. **Profiles**: Dados pessoais básicos. Leitura pública para exibir nomes, mas edição restrita.
3. **Depoimentos pendentes**: Visíveis apenas para autor e admins até aprovação.

### Boas Práticas Implementadas

1. **Princípio do menor privilégio**: Usuários só acessam o necessário
2. **Separação de responsabilidades**: Admins gerenciam, usuários participam
3. **Proteção de dados médicos**: Anamneses com acesso restrito
4. **Moderação de conteúdo**: Depoimentos passam por aprovação

### Recomendações Futuras

1. **Logs de auditoria**: Implementar logging de ações administrativas
2. **Rate limiting**: Adicionar limites de requisições por usuário
3. **Backup de dados**: Configurar backups automáticos no Supabase
4. **Monitoramento**: Configurar alertas para atividades suspeitas

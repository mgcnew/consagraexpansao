# Design Document - Portal Consciência Divinal Melhorias

## Overview

Este documento descreve a arquitetura e design das melhorias planejadas para o Portal Consciência Divinal. As melhorias estão organizadas em fases incrementais, priorizando correções críticas, refinamentos visuais e novas funcionalidades.

## Architecture

### Estrutura Atual
```
src/
├── components/
│   ├── auth/           # Autenticação
│   ├── cerimonias/     # Componentes de cerimônias
│   ├── layout/         # Layout principal
│   └── ui/             # Componentes shadcn/ui
├── contexts/           # Context API (Auth)
├── hooks/              # Hooks customizados
├── integrations/       # Supabase client
├── lib/                # Utilitários
└── pages/              # Páginas da aplicação
```

### Estrutura Proposta (Melhorada)
```
src/
├── components/
│   ├── auth/
│   ├── cerimonias/
│   ├── depoimentos/    # NOVO: Componentes de depoimentos
│   ├── layout/
│   ├── shared/         # NOVO: Componentes reutilizáveis
│   └── ui/
├── contexts/
├── hooks/
│   ├── queries/        # NOVO: Hooks de React Query
│   └── mutations/      # NOVO: Hooks de mutations
├── integrations/
├── lib/
├── pages/
├── types/              # NOVO: Tipos centralizados
└── constants/          # NOVO: Constantes
```

## Components and Interfaces

### Novos Tipos Centralizados (`src/types/index.ts`)

```typescript
// Entidades do banco
export interface Profile {
  id: string;
  full_name: string | null;
  birth_date: string | null;
  referral_source: string | null;
  referral_name: string | null;
  created_at: string;
  email?: string;
}

export interface Cerimonia {
  id: string;
  nome: string | null;
  data: string;
  horario: string;
  local: string;
  descricao: string | null;
  medicina_principal: string | null;
  vagas: number | null;
  observacoes: string | null;
  banner_url: string | null;
}

export interface Inscricao {
  id: string;
  user_id: string;
  cerimonia_id: string;
  data_inscricao: string;
  forma_pagamento: string | null;
  pago: boolean;
}

export interface Depoimento {
  id: string;
  user_id: string;
  cerimonia_id: string | null;
  texto: string;
  aprovado: boolean;
  created_at: string;
  approved_at: string | null;
}

export interface Anamnese {
  id: string;
  user_id: string;
  nome_completo: string;
  // ... demais campos
}

// Tipos com relacionamentos
export interface InscricaoComRelacionamentos extends Inscricao {
  profiles: Profile;
  cerimonias: Cerimonia;
}

export interface DepoimentoComRelacionamentos extends Depoimento {
  profiles: Pick<Profile, 'full_name'>;
  cerimonias: Pick<Cerimonia, 'nome' | 'medicina_principal' | 'data'> | null;
}

// Roles
export type UserRole = 'admin' | 'guardiao' | 'consagrador';
```

### Hooks de Query Customizados

```typescript
// src/hooks/queries/useDepoimentos.ts
export const useDepoimentosPendentes = () => {
  return useQuery({
    queryKey: ['depoimentos', 'pendentes'],
    queryFn: fetchDepoimentosPendentes,
  });
};

// src/hooks/queries/useCerimonias.ts
export const useCerimoniasComVagas = () => {
  return useQuery({
    queryKey: ['cerimonias', 'com-vagas'],
    queryFn: fetchCerimoniasComVagasDisponiveis,
  });
};
```

## Data Models

### Cálculo de Vagas Disponíveis

```sql
-- View ou função para calcular vagas disponíveis
CREATE OR REPLACE FUNCTION get_vagas_disponiveis(cerimonia_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_vagas INTEGER;
  inscritos INTEGER;
BEGIN
  SELECT vagas INTO total_vagas FROM cerimonias WHERE id = cerimonia_uuid;
  SELECT COUNT(*) INTO inscritos FROM inscricoes WHERE cerimonia_id = cerimonia_uuid;
  RETURN COALESCE(total_vagas, 999) - inscritos;
END;
$$ LANGUAGE plpgsql;
```

### Políticas RLS para Depoimentos (Correção do Bug)

```sql
-- Política para admins lerem todos os depoimentos
CREATE POLICY "Admins podem ler todos os depoimentos"
ON depoimentos FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.role = 'admin'
  )
  OR user_id = auth.uid()
  OR aprovado = true
);
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Depoimentos pendentes visíveis para admin
*For any* depoimento com `aprovado = false`, quando um usuário admin consulta a lista de pendentes, o depoimento deve aparecer na lista
**Validates: Requirements 1.2**

### Property 2: Vagas disponíveis sempre não-negativas
*For any* cerimônia, o número de vagas disponíveis (total - inscritos) deve ser sempre >= 0
**Validates: Requirements 3.1**

### Property 3: Inscrição bloqueada quando esgotado
*For any* cerimônia com vagas disponíveis = 0, tentativas de nova inscrição devem ser rejeitadas
**Validates: Requirements 3.2**

### Property 4: Histórico contém apenas participações do usuário
*For any* usuário, o histórico de participações deve conter apenas inscrições onde `user_id` = id do usuário logado
**Validates: Requirements 4.1**

### Property 5: Paginação mantém total de registros
*For any* consulta paginada, a soma de registros de todas as páginas deve ser igual ao total de registros
**Validates: Requirements 5.1**

## Error Handling

### Estratégia de Tratamento de Erros

1. **Erros de Rede**: Exibir toast com opção de retry
2. **Erros de Validação**: Destacar campos com erro inline
3. **Erros de Permissão**: Redirecionar para página apropriada
4. **Erros Inesperados**: Log no console + toast genérico

```typescript
// src/lib/error-handler.ts
export const handleSupabaseError = (error: PostgrestError) => {
  if (error.code === 'PGRST301') {
    toast.error('Sessão expirada. Faça login novamente.');
    return;
  }
  if (error.code === '42501') {
    toast.error('Você não tem permissão para esta ação.');
    return;
  }
  toast.error('Ocorreu um erro. Tente novamente.');
  console.error('Supabase error:', error);
};
```

## Testing Strategy

### Testes Manuais Prioritários

1. **Bug Depoimentos**: Criar depoimento como consagrador → Verificar no admin
2. **Vagas**: Inscrever até esgotar → Verificar bloqueio
3. **Responsividade**: Testar todas as páginas em mobile
4. **Fluxo Completo**: Cadastro → Anamnese → Inscrição → Depoimento

### Testes Automatizados (Futuro)

- Testes de integração com Supabase local
- Testes de componentes com React Testing Library
- Testes E2E com Playwright

## Fases de Implementação

### Fase 1: Correções Críticas (Prioridade Alta)
- Corrigir bug de depoimentos (RLS)
- Traduzir página 404
- Remover código não utilizado (App.css)

### Fase 2: Refinamento Visual (Prioridade Alta)
- Melhorar feedback de loading
- Consistência visual
- Responsividade mobile

### Fase 3: Funcionalidades Core (Prioridade Média)
- Vagas disponíveis em cerimônias
- Histórico de participações
- Salvar progresso da anamnese

### Fase 4: Admin Avançado (Prioridade Média)
- Paginação nas tabelas
- Exportação CSV
- Busca avançada

### Fase 5: Arquitetura (Prioridade Baixa)
- Centralizar tipos
- Criar hooks customizados
- Refatorar componentes duplicados

### Fase 6: Features Futuras (Backlog)
- Integração PIX
- Notificações push
- PWA

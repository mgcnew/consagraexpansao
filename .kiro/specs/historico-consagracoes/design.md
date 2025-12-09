# Design Document - Histórico de Consagrações

## Overview

Este documento descreve o design técnico para a funcionalidade de Histórico de Consagrações no Painel Administrativo. A feature permite que administradores visualizem todas as participações confirmadas de cada consagrador e adicionem observações sobre cada trabalho.

A implementação envolve:
- Adicionar coluna `observacoes_admin` na tabela `inscricoes`
- Criar componente de diálogo para exibir histórico
- Criar hook para buscar histórico de um usuário
- Integrar na aba de Consagradores do Admin

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  inscricoes                                          │   │
│  │  + observacoes_admin: text (NEW)                    │   │
│  │  - id, user_id, cerimonia_id, pago, ...             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   src/hooks/queries/                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  useHistoricoConsagracoes(userId)                   │   │
│  │  - Busca inscrições com pago = true                 │   │
│  │  - Join com cerimonias para dados completos         │   │
│  │  - Ordenação por data decrescente                   │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  useUpdateObservacao()                              │   │
│  │  - Mutation para salvar observação                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              src/components/admin/                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  HistoricoConsagracoesDialog                        │   │
│  │  - Props: userId, userName, isOpen, onClose         │   │
│  │  - Exibe estatísticas no header                     │   │
│  │  - Lista de consagrações com observações            │   │
│  │  - Campo editável para cada observação              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   src/pages/Admin.tsx                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Tab Consagradores                                   │   │
│  │  + Botão "Ver Histórico" em cada linha              │   │
│  │  + State para controlar dialog aberto               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Database Schema Update

```sql
-- Migration: add_observacoes_admin_to_inscricoes
ALTER TABLE inscricoes 
ADD COLUMN observacoes_admin TEXT;

-- RLS: Admins podem ler e escrever observacoes_admin
-- (já coberto pelas políticas existentes de admin)
```

### TypeScript Types

```typescript
// Adicionar ao src/types/index.ts
export interface Inscricao {
  id: string;
  user_id: string;
  cerimonia_id: string;
  data_inscricao: string;
  forma_pagamento: string | null;
  pago: boolean;
  observacoes_admin: string | null;  // NEW
}

export interface ConsagracaoHistorico {
  id: string;
  data_inscricao: string;
  observacoes_admin: string | null;
  cerimonia: {
    id: string;
    nome: string | null;
    data: string;
    local: string;
    medicina_principal: string | null;
  };
}

export interface HistoricoStats {
  total: number;
  primeiraConsagracao: string | null;
  ultimaConsagracao: string | null;
  medicinas: string[];
}
```

### Hook Interface

```typescript
// src/hooks/queries/useHistoricoConsagracoes.ts
export function useHistoricoConsagracoes(userId: string | null) {
  return useQuery({
    queryKey: ['historico-consagracoes', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inscricoes')
        .select(`
          id,
          data_inscricao,
          observacoes_admin,
          cerimonias (
            id, nome, data, local, medicina_principal
          )
        `)
        .eq('user_id', userId)
        .eq('pago', true)
        .order('data_inscricao', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useUpdateObservacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ inscricaoId, observacao }: { 
      inscricaoId: string; 
      observacao: string 
    }) => {
      const { error } = await supabase
        .from('inscricoes')
        .update({ observacoes_admin: observacao })
        .eq('id', inscricaoId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historico-consagracoes'] });
    },
  });
}
```

### Component Interface

```typescript
// src/components/admin/HistoricoConsagracoesDialog.tsx
interface HistoricoConsagracoesDialogProps {
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}
```

## Data Models

### Fluxo de Dados

1. Admin clica em "Ver Histórico" na lista de consagradores
2. Dialog abre com `userId` do consagrador selecionado
3. Hook `useHistoricoConsagracoes` busca inscrições com `pago = true`
4. Componente calcula estatísticas (total, datas, medicinas)
5. Lista renderiza cada consagração com campo de observação
6. Ao editar observação, `useUpdateObservacao` persiste no banco

### Cálculo de Estatísticas

```typescript
function calcularStats(consagracoes: ConsagracaoHistorico[]): HistoricoStats {
  if (consagracoes.length === 0) {
    return { total: 0, primeiraConsagracao: null, ultimaConsagracao: null, medicinas: [] };
  }
  
  const datas = consagracoes.map(c => c.cerimonia.data).sort();
  const medicinas = [...new Set(
    consagracoes
      .map(c => c.cerimonia.medicina_principal)
      .filter(Boolean)
  )];
  
  return {
    total: consagracoes.length,
    primeiraConsagracao: datas[0],
    ultimaConsagracao: datas[datas.length - 1],
    medicinas,
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

Após análise do prework, identifiquei as seguintes propriedades testáveis:
- 1.2: Filtragem por pago = true (property)
- 2.2: Round-trip de observações (property)
- 3.1: Ordenação decrescente (property)
- 4.1: Total correto (property)
- 4.2: Datas min/max corretas (property)
- 4.3: Medicinas distintas corretas (property)

Consolidando propriedades relacionadas:

### Property 1: Histórico contém apenas consagrações pagas

*For any* usuário e conjunto de inscrições, o histórico retornado DEVE conter apenas inscrições onde `pago === true`.

**Validates: Requirements 1.2**

### Property 2: Round-trip de observações

*For any* observação salva em uma inscrição, ao recarregar o histórico, a observação DEVE estar presente e igual ao valor salvo.

**Validates: Requirements 2.2**

### Property 3: Ordenação decrescente por data

*For any* histórico com múltiplas consagrações, a lista DEVE estar ordenada por data da cerimônia em ordem decrescente (mais recente primeiro).

**Validates: Requirements 3.1**

### Property 4: Estatísticas corretas

*For any* histórico de consagrações:
- O total exibido DEVE ser igual ao count de itens no histórico
- A primeira consagração DEVE ser a data mínima do conjunto
- A última consagração DEVE ser a data máxima do conjunto
- As medicinas listadas DEVEM ser o conjunto distinto de medicinas das consagrações

**Validates: Requirements 4.1, 4.2, 4.3**

## Error Handling

### Cenários de Erro

1. **Falha ao buscar histórico**
   - Exibir mensagem de erro no dialog
   - Permitir retry

2. **Falha ao salvar observação**
   - Exibir toast de erro
   - Manter texto no campo para retry
   - Não fechar modo de edição

3. **Usuário sem permissão**
   - RLS bloqueia a query
   - Exibir mensagem de acesso negado

## Testing Strategy

### Abordagem Dual: Unit Tests + Property-Based Tests

#### Unit Tests (Vitest + React Testing Library)

```typescript
describe('HistoricoConsagracoesDialog', () => {
  it('renders empty state when no consagracoes', () => {});
  it('renders list of consagracoes', () => {});
  it('shows stats header with correct values', () => {});
  it('allows editing observacao', () => {});
  it('saves observacao on blur or button click', () => {});
});

describe('useHistoricoConsagracoes', () => {
  it('fetches only paid inscricoes', () => {});
  it('orders by date descending', () => {});
});
```

#### Property-Based Tests (fast-check)

Biblioteca: fast-check

```typescript
// Feature: historico-consagracoes, Property 1: Histórico contém apenas consagrações pagas
// Validates: Requirements 1.2
describe('Historico filtering', () => {
  it('should only include paid inscricoes', () => {
    fc.assert(
      fc.property(
        fc.array(inscricaoArbitrary),
        (inscricoes) => {
          const historico = filterHistorico(inscricoes);
          return historico.every(i => i.pago === true);
        }
      )
    );
  });
});

// Feature: historico-consagracoes, Property 3: Ordenação decrescente
// Validates: Requirements 3.1
describe('Historico ordering', () => {
  it('should be ordered by date descending', () => {
    fc.assert(
      fc.property(
        fc.array(consagracaoArbitrary),
        (consagracoes) => {
          const sorted = sortHistorico(consagracoes);
          for (let i = 1; i < sorted.length; i++) {
            if (sorted[i-1].cerimonia.data < sorted[i].cerimonia.data) {
              return false;
            }
          }
          return true;
        }
      )
    );
  });
});

// Feature: historico-consagracoes, Property 4: Estatísticas corretas
// Validates: Requirements 4.1, 4.2, 4.3
describe('Historico stats', () => {
  it('should calculate correct stats', () => {
    fc.assert(
      fc.property(
        fc.array(consagracaoArbitrary),
        (consagracoes) => {
          const stats = calcularStats(consagracoes);
          
          // Total
          if (stats.total !== consagracoes.length) return false;
          
          // Datas
          if (consagracoes.length > 0) {
            const datas = consagracoes.map(c => c.cerimonia.data).sort();
            if (stats.primeiraConsagracao !== datas[0]) return false;
            if (stats.ultimaConsagracao !== datas[datas.length - 1]) return false;
          }
          
          // Medicinas
          const expectedMedicinas = [...new Set(
            consagracoes.map(c => c.cerimonia.medicina_principal).filter(Boolean)
          )];
          if (stats.medicinas.length !== expectedMedicinas.length) return false;
          
          return true;
        }
      )
    );
  });
});
```

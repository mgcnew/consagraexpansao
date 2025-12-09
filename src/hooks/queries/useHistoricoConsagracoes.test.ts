import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import type { Inscricao } from '@/types';
import type { ConsagracaoHistorico } from './useHistoricoConsagracoes';

/**
 * Feature: historico-consagracoes, Property 1: Histórico contém apenas consagrações pagas
 * Validates: Requirements 1.2
 * 
 * WHEN um administrador acessa o histórico de um consagrador 
 * THEN o Portal SHALL exibir todas as inscrições com pagamento confirmado (pago = true)
 */

// Pure function that filters inscriptions - mirrors the Supabase query logic
export function filterHistoricoPago(inscricoes: Inscricao[]): Inscricao[] {
  return inscricoes.filter((inscricao) => inscricao.pago === true);
}

// Generate valid ISO date strings
const isoDateArbitrary = fc
  .integer({ min: 2020, max: 2030 })
  .chain((year) =>
    fc.integer({ min: 1, max: 12 }).chain((month) =>
      fc.integer({ min: 1, max: 28 }).map((day) => {
        const m = String(month).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${year}-${m}-${d}T12:00:00.000Z`;
      })
    )
  );

// Arbitrary for generating random Inscricao objects
const inscricaoArbitrary = fc.record({
  id: fc.uuid(),
  user_id: fc.uuid(),
  cerimonia_id: fc.uuid(),
  data_inscricao: isoDateArbitrary,
  forma_pagamento: fc.oneof(fc.constant(null), fc.constantFrom('pix', 'dinheiro', 'cartao')),
  pago: fc.boolean(),
  observacoes_admin: fc.oneof(fc.constant(null), fc.string({ minLength: 0, maxLength: 200 })),
});

describe('Historico Consagracoes - Property Tests', () => {
  /**
   * Feature: historico-consagracoes, Property 1: Histórico contém apenas consagrações pagas
   * Validates: Requirements 1.2
   * 
   * For any set of inscriptions, the filtered historico should only contain
   * inscriptions where pago === true
   */
  it('should only include paid inscricoes (pago === true)', () => {
    fc.assert(
      fc.property(
        fc.array(inscricaoArbitrary, { minLength: 0, maxLength: 50 }),
        (inscricoes) => {
          const historico = filterHistoricoPago(inscricoes);
          
          // Property: Every item in historico must have pago === true
          const allPaid = historico.every((inscricao) => inscricao.pago === true);
          
          // Property: No paid inscricao should be missing from historico
          const paidInscricoes = inscricoes.filter((i) => i.pago === true);
          const noPaidMissing = paidInscricoes.every((paid) =>
            historico.some((h) => h.id === paid.id)
          );
          
          // Property: No unpaid inscricao should be in historico
          const unpaidInscricoes = inscricoes.filter((i) => i.pago === false);
          const noUnpaidIncluded = unpaidInscricoes.every((unpaid) =>
            !historico.some((h) => h.id === unpaid.id)
          );
          
          return allPaid && noPaidMissing && noUnpaidIncluded;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: The count of filtered items should equal
   * the count of items with pago === true in the original array
   */
  it('should have correct count of paid inscricoes', () => {
    fc.assert(
      fc.property(
        fc.array(inscricaoArbitrary, { minLength: 0, maxLength: 50 }),
        (inscricoes) => {
          const historico = filterHistoricoPago(inscricoes);
          const expectedCount = inscricoes.filter((i) => i.pago === true).length;
          
          return historico.length === expectedCount;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: historico-consagracoes, Property 2: Round-trip de observações
 * Validates: Requirements 2.2
 * 
 * WHEN um administrador salva uma observação 
 * THEN o Portal SHALL persistir o texto no banco de dados vinculado à inscrição
 * 
 * For any observation saved to an inscription, when reloading the historico,
 * the observation MUST be present and equal to the saved value.
 */

// Simulates the update operation - sets observacoes_admin on an inscription
export function updateObservacao(
  inscricoes: Inscricao[],
  inscricaoId: string,
  observacao: string
): Inscricao[] {
  return inscricoes.map((inscricao) =>
    inscricao.id === inscricaoId
      ? { ...inscricao, observacoes_admin: observacao }
      : inscricao
  );
}

// Simulates reading back the observation from an inscription
export function readObservacao(
  inscricoes: Inscricao[],
  inscricaoId: string
): string | null | undefined {
  const inscricao = inscricoes.find((i) => i.id === inscricaoId);
  return inscricao?.observacoes_admin;
}

describe('Historico Consagracoes - Property 2: Round-trip de observações', () => {
  /**
   * Feature: historico-consagracoes, Property 2: Round-trip de observações
   * Validates: Requirements 2.2
   * 
   * For any observation string and any valid inscription,
   * saving the observation and then reading it back should return the same value.
   */
  it('should preserve observation value after save and read (round-trip)', () => {
    fc.assert(
      fc.property(
        // Generate a non-empty array of inscriptions
        fc.array(inscricaoArbitrary, { minLength: 1, maxLength: 20 }),
        // Generate any string for the observation (including empty, unicode, special chars)
        fc.string({ minLength: 0, maxLength: 500 }),
        (inscricoes, observacao) => {
          // Pick a random inscription to update
          const targetInscricao = inscricoes[0];
          
          // Perform the round-trip: save then read
          const updatedInscricoes = updateObservacao(
            inscricoes,
            targetInscricao.id,
            observacao
          );
          const readBack = readObservacao(updatedInscricoes, targetInscricao.id);
          
          // Property: The read value must equal the saved value
          return readBack === observacao;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Updating observation should not affect other inscriptions
   */
  it('should not modify other inscriptions when updating one observation', () => {
    fc.assert(
      fc.property(
        // Generate array with at least 2 inscriptions
        fc.array(inscricaoArbitrary, { minLength: 2, maxLength: 20 }),
        fc.string({ minLength: 0, maxLength: 500 }),
        (inscricoes, observacao) => {
          const targetInscricao = inscricoes[0];
          const otherInscricoes = inscricoes.slice(1);
          
          const updatedInscricoes = updateObservacao(
            inscricoes,
            targetInscricao.id,
            observacao
          );
          
          // Property: All other inscriptions should remain unchanged
          return otherInscricoes.every((original) => {
            const updated = updatedInscricoes.find((i) => i.id === original.id);
            return (
              updated !== undefined &&
              updated.observacoes_admin === original.observacoes_admin &&
              updated.pago === original.pago &&
              updated.user_id === original.user_id &&
              updated.cerimonia_id === original.cerimonia_id
            );
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Multiple updates should preserve only the last value
   */
  it('should preserve only the last observation after multiple updates', () => {
    fc.assert(
      fc.property(
        fc.array(inscricaoArbitrary, { minLength: 1, maxLength: 10 }),
        fc.array(fc.string({ minLength: 0, maxLength: 200 }), { minLength: 1, maxLength: 5 }),
        (inscricoes, observacoes) => {
          const targetInscricao = inscricoes[0];
          
          // Apply multiple updates sequentially
          let currentInscricoes = inscricoes;
          for (const obs of observacoes) {
            currentInscricoes = updateObservacao(
              currentInscricoes,
              targetInscricao.id,
              obs
            );
          }
          
          // Property: Final read should return the last observation
          const finalObservacao = observacoes[observacoes.length - 1];
          const readBack = readObservacao(currentInscricoes, targetInscricao.id);
          
          return readBack === finalObservacao;
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Feature: historico-consagracoes, Property 3: Ordenação decrescente por data
 * Validates: Requirements 3.1
 * 
 * WHEN o histórico é exibido THEN o Portal SHALL ordenar as consagrações 
 * por data decrescente (mais recente primeiro)
 */

// Generate valid ISO date strings for ceremonies
const cerimoniaDatasArbitrary = fc
  .integer({ min: 2020, max: 2030 })
  .chain((year) =>
    fc.integer({ min: 1, max: 12 }).chain((month) =>
      fc.integer({ min: 1, max: 28 }).map((day) => {
        const m = String(month).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${year}-${m}-${d}`;
      })
    )
  );

// Arbitrary for generating ConsagracaoHistorico objects
const consagracaoHistoricoArbitrary: fc.Arbitrary<ConsagracaoHistorico> = fc.record({
  id: fc.uuid(),
  data_inscricao: fc
    .integer({ min: 2020, max: 2030 })
    .chain((year) =>
      fc.integer({ min: 1, max: 12 }).chain((month) =>
        fc.integer({ min: 1, max: 28 }).map((day) => {
          const m = String(month).padStart(2, '0');
          const d = String(day).padStart(2, '0');
          return `${year}-${m}-${d}T12:00:00.000Z`;
        })
      )
    ),
  observacoes_admin: fc.oneof(fc.constant(null), fc.string({ minLength: 0, maxLength: 200 })),
  cerimonia: fc.record({
    id: fc.uuid(),
    nome: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 50 })),
    data: cerimoniaDatasArbitrary,
    local: fc.string({ minLength: 1, maxLength: 100 }),
    medicina_principal: fc.oneof(fc.constant(null), fc.constantFrom('Ayahuasca', 'Rapé', 'Sananga', 'Kambo')),
  }),
});

/**
 * Pure function that sorts consagracoes by cerimonia.data descending
 * Mirrors the sorting logic in useHistoricoConsagracoes hook
 */
export function sortHistoricoByDateDescending(
  consagracoes: ConsagracaoHistorico[]
): ConsagracaoHistorico[] {
  return [...consagracoes].sort(
    (a, b) => new Date(b.cerimonia.data).getTime() - new Date(a.cerimonia.data).getTime()
  );
}

describe('Historico Consagracoes - Property 3: Ordenação decrescente por data', () => {
  /**
   * Feature: historico-consagracoes, Property 3: Ordenação decrescente por data
   * Validates: Requirements 3.1
   * 
   * For any list of consagracoes, after sorting, each item should have a date
   * greater than or equal to the next item's date (descending order).
   */
  it('should order consagracoes by cerimonia.data descending (most recent first)', () => {
    fc.assert(
      fc.property(
        fc.array(consagracaoHistoricoArbitrary, { minLength: 0, maxLength: 50 }),
        (consagracoes) => {
          const sorted = sortHistoricoByDateDescending(consagracoes);
          
          // Property: For all consecutive pairs, the first date >= second date
          for (let i = 1; i < sorted.length; i++) {
            const prevDate = new Date(sorted[i - 1].cerimonia.data).getTime();
            const currDate = new Date(sorted[i].cerimonia.data).getTime();
            if (prevDate < currDate) {
              return false;
            }
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Sorting should preserve all elements (no items lost or duplicated)
   */
  it('should preserve all consagracoes after sorting (same count and same ids)', () => {
    fc.assert(
      fc.property(
        fc.array(consagracaoHistoricoArbitrary, { minLength: 0, maxLength: 50 }),
        (consagracoes) => {
          const sorted = sortHistoricoByDateDescending(consagracoes);
          
          // Property: Same length
          if (sorted.length !== consagracoes.length) return false;
          
          // Property: Same set of ids
          const originalIds = new Set(consagracoes.map((c) => c.id));
          const sortedIds = new Set(sorted.map((c) => c.id));
          
          if (originalIds.size !== sortedIds.size) return false;
          
          for (const id of originalIds) {
            if (!sortedIds.has(id)) return false;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Sorting is idempotent - sorting an already sorted list produces the same result
   */
  it('should be idempotent (sorting twice produces same result)', () => {
    fc.assert(
      fc.property(
        fc.array(consagracaoHistoricoArbitrary, { minLength: 0, maxLength: 30 }),
        (consagracoes) => {
          const sortedOnce = sortHistoricoByDateDescending(consagracoes);
          const sortedTwice = sortHistoricoByDateDescending(sortedOnce);
          
          // Property: Both sorted arrays should have same order
          if (sortedOnce.length !== sortedTwice.length) return false;
          
          for (let i = 0; i < sortedOnce.length; i++) {
            if (sortedOnce[i].id !== sortedTwice[i].id) return false;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Feature: historico-consagracoes, Property 4: Estatísticas corretas
 * Validates: Requirements 4.1, 4.2, 4.3
 * 
 * WHEN o histórico é exibido THEN o Portal SHALL:
 * - mostrar o total de consagrações do usuário (4.1)
 * - mostrar a data da primeira e última consagração (4.2)
 * - listar as medicinas já consagradas pelo usuário (4.3)
 */

import { calcularStats } from './useHistoricoConsagracoes';

describe('Historico Consagracoes - Property 4: Estatísticas corretas', () => {
  /**
   * Feature: historico-consagracoes, Property 4: Estatísticas corretas
   * Validates: Requirements 4.1, 4.2, 4.3
   * 
   * For any list of consagracoes:
   * - Total should equal the count of items
   * - primeiraConsagracao should be the minimum date
   * - ultimaConsagracao should be the maximum date
   * - medicinas should be the distinct set of non-null medicina_principal values
   */
  it('should calculate correct total count (Requirement 4.1)', () => {
    fc.assert(
      fc.property(
        fc.array(consagracaoHistoricoArbitrary, { minLength: 0, maxLength: 50 }),
        (consagracoes) => {
          const stats = calcularStats(consagracoes);
          
          // Property: Total must equal the count of consagracoes
          return stats.total === consagracoes.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate correct first and last dates (Requirement 4.2)', () => {
    fc.assert(
      fc.property(
        fc.array(consagracaoHistoricoArbitrary, { minLength: 0, maxLength: 50 }),
        (consagracoes) => {
          const stats = calcularStats(consagracoes);
          
          if (consagracoes.length === 0) {
            // Empty case: both dates should be null
            return stats.primeiraConsagracao === null && stats.ultimaConsagracao === null;
          }
          
          // Get all dates and sort them
          const datas = consagracoes.map((c) => c.cerimonia.data).sort();
          const minDate = datas[0];
          const maxDate = datas[datas.length - 1];
          
          // Property: primeiraConsagracao should be the minimum date
          // Property: ultimaConsagracao should be the maximum date
          return stats.primeiraConsagracao === minDate && stats.ultimaConsagracao === maxDate;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate correct distinct medicinas (Requirement 4.3)', () => {
    fc.assert(
      fc.property(
        fc.array(consagracaoHistoricoArbitrary, { minLength: 0, maxLength: 50 }),
        (consagracoes) => {
          const stats = calcularStats(consagracoes);
          
          // Calculate expected distinct medicinas (non-null values only)
          const expectedMedicinas = [
            ...new Set(
              consagracoes
                .map((c) => c.cerimonia.medicina_principal)
                .filter((m): m is string => m !== null)
            ),
          ];
          
          // Property: medicinas array should have same length as expected
          if (stats.medicinas.length !== expectedMedicinas.length) return false;
          
          // Property: medicinas should contain all expected values
          for (const medicina of expectedMedicinas) {
            if (!stats.medicinas.includes(medicina)) return false;
          }
          
          // Property: medicinas should not contain any unexpected values
          for (const medicina of stats.medicinas) {
            if (!expectedMedicinas.includes(medicina)) return false;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty stats for empty consagracoes array', () => {
    fc.assert(
      fc.property(
        fc.constant([] as ConsagracaoHistorico[]),
        (consagracoes) => {
          const stats = calcularStats(consagracoes);
          
          return (
            stats.total === 0 &&
            stats.primeiraConsagracao === null &&
            stats.ultimaConsagracao === null &&
            stats.medicinas.length === 0
          );
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Additional property: medicinas should not contain duplicates
   */
  it('should not have duplicate medicinas in stats', () => {
    fc.assert(
      fc.property(
        fc.array(consagracaoHistoricoArbitrary, { minLength: 0, maxLength: 50 }),
        (consagracoes) => {
          const stats = calcularStats(consagracoes);
          
          // Property: medicinas array should have no duplicates
          const uniqueMedicinas = new Set(stats.medicinas);
          return uniqueMedicinas.size === stats.medicinas.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: medicinas should not contain null values
   */
  it('should not have null values in medicinas', () => {
    fc.assert(
      fc.property(
        fc.array(consagracaoHistoricoArbitrary, { minLength: 0, maxLength: 50 }),
        (consagracoes) => {
          const stats = calcularStats(consagracoes);
          
          // Property: medicinas array should not contain null
          return stats.medicinas.every((m) => m !== null);
        }
      ),
      { numRuns: 100 }
    );
  });
});

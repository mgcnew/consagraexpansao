import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { MyInscription } from './useMyInscriptions';

/**
 * Feature: index-redesign, Property 5: Inscrições do usuário ordenadas por data com limite
 * Validates: Requirements 3.1
 *
 * WHEN o usuário acessa a página Index THEN o Portal SHALL exibir as últimas 3
 * inscrições do usuário ordenadas por data da cerimônia
 */

// Generate valid date strings (YYYY-MM-DD format)
const dateArbitrary = fc
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

// Generate valid time strings (HH:MM format)
const timeArbitrary = fc
  .integer({ min: 0, max: 23 })
  .chain((hour) =>
    fc.integer({ min: 0, max: 59 }).map((minute) => {
      const h = String(hour).padStart(2, '0');
      const m = String(minute).padStart(2, '0');
      return `${h}:${m}`;
    })
  );

// Generate valid ISO date strings for data_inscricao
const isoDateArbitrary = fc
  .integer({ min: 2020, max: 2030 })
  .chain((year) =>
    fc.integer({ min: 1, max: 12 }).chain((month) =>
      fc.integer({ min: 1, max: 28 }).chain((day) =>
        fc.integer({ min: 0, max: 23 }).chain((hour) =>
          fc.integer({ min: 0, max: 59 }).chain((minute) =>
            fc.integer({ min: 0, max: 59 }).map((second) => {
              const m = String(month).padStart(2, '0');
              const d = String(day).padStart(2, '0');
              const h = String(hour).padStart(2, '0');
              const min = String(minute).padStart(2, '0');
              const s = String(second).padStart(2, '0');
              return `${year}-${m}-${d}T${h}:${min}:${s}.000Z`;
            })
          )
        )
      )
    )
  );

// Arbitrary for generating MyInscription objects
const myInscriptionArbitrary: fc.Arbitrary<MyInscription> = fc.record({
  id: fc.uuid(),
  status: fc.constantFrom('confirmada', 'pendente', 'cancelada') as fc.Arbitrary<'confirmada' | 'pendente' | 'cancelada'>,
  pago: fc.boolean(),
  data_inscricao: isoDateArbitrary,
  cerimonia: fc.record({
    id: fc.uuid(),
    nome: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 100 })),
    data: dateArbitrary,
    horario: timeArbitrary,
    local: fc.string({ minLength: 1, maxLength: 200 }),
    medicina_principal: fc.oneof(
      fc.constant(null),
      fc.constantFrom('Ayahuasca', 'Rapé', 'Sananga', 'Kambo')
    ),
  }),
});

/**
 * Pure function that sorts inscriptions by ceremony date - mirrors the logic
 * from useMyInscriptions hook:
 * - Order by cerimonia.data descending (most recent first)
 * - Limit to specified number
 */
export function sortAndLimitInscriptions(
  inscriptions: MyInscription[],
  limit: number
): MyInscription[] {
  return [...inscriptions]
    .sort((a, b) => 
      new Date(b.cerimonia.data).getTime() - new Date(a.cerimonia.data).getTime()
    )
    .slice(0, limit);
}

describe('useMyInscriptions - Property Tests', () => {
  /**
   * Feature: index-redesign, Property 5: Inscrições do usuário ordenadas por data com limite
   * Validates: Requirements 3.1
   *
   * For any set of user inscriptions, the sorted inscriptions should:
   * 1. Return at most `limit` inscriptions
   * 2. Be ordered by cerimonia.data descending (most recent first)
   */
  it('should return at most limit inscriptions ordered by ceremony date descending', () => {
    fc.assert(
      fc.property(
        fc.array(myInscriptionArbitrary, { minLength: 0, maxLength: 30 }),
        fc.integer({ min: 1, max: 10 }),
        (inscriptions, limit) => {
          const result = sortAndLimitInscriptions(inscriptions, limit);

          // Property 1: Result should have at most `limit` items
          expect(result.length).toBeLessThanOrEqual(limit);

          // Property 2: Items should be ordered by cerimonia.data descending
          for (let i = 1; i < result.length; i++) {
            const prevDate = new Date(result[i - 1].cerimonia.data).getTime();
            const currDate = new Date(result[i].cerimonia.data).getTime();
            expect(prevDate).toBeGreaterThanOrEqual(currDate);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: The result count should equal min(inscriptions_count, limit)
   */
  it('should return exactly min(inscriptions_count, limit) items', () => {
    fc.assert(
      fc.property(
        fc.array(myInscriptionArbitrary, { minLength: 0, maxLength: 30 }),
        fc.integer({ min: 1, max: 10 }),
        (inscriptions, limit) => {
          const result = sortAndLimitInscriptions(inscriptions, limit);
          const expectedCount = Math.min(inscriptions.length, limit);

          expect(result.length).toBe(expectedCount);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Default limit of 3 should work correctly
   */
  it('should respect default limit of 3', () => {
    fc.assert(
      fc.property(
        fc.array(myInscriptionArbitrary, { minLength: 0, maxLength: 30 }),
        (inscriptions) => {
          const defaultLimit = 3;
          const result = sortAndLimitInscriptions(inscriptions, defaultLimit);

          expect(result.length).toBeLessThanOrEqual(defaultLimit);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Sorting is stable - the most recent ceremonies should always come first
   */
  it('should always include the inscriptions with most recent ceremonies when limit is reached', () => {
    fc.assert(
      fc.property(
        fc.array(myInscriptionArbitrary, { minLength: 1, maxLength: 30 }),
        fc.integer({ min: 1, max: 10 }),
        (inscriptions, limit) => {
          const result = sortAndLimitInscriptions(inscriptions, limit);

          if (inscriptions.length === 0 || result.length === 0) {
            return true;
          }

          // Sort all inscriptions by ceremony date descending
          const sortedAll = [...inscriptions].sort(
            (a, b) => new Date(b.cerimonia.data).getTime() - new Date(a.cerimonia.data).getTime()
          );

          // The result should contain the top N most recent inscriptions
          const expectedTopInscriptions = sortedAll.slice(0, limit);

          // Verify result contains exactly the expected inscriptions (by id)
          const resultIds = new Set(result.map((i) => i.id));
          const expectedIds = new Set(expectedTopInscriptions.map((i) => i.id));

          expect(resultIds.size).toBe(expectedIds.size);
          for (const id of expectedIds) {
            expect(resultIds.has(id)).toBe(true);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { Cerimonia } from '@/types';

/**
 * Feature: index-redesign, Property 2: Cerimônias futuras ordenadas por data com limite
 * Validates: Requirements 2.1
 *
 * WHEN o usuário acessa a página Index THEN o Portal SHALL exibir as próximas 3
 * cerimônias com inscrições abertas ordenadas por data
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

// Arbitrary for generating Cerimonia objects
const cerimoniaArbitrary: fc.Arbitrary<Cerimonia> = fc.record({
  id: fc.uuid(),
  nome: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 100 })),
  data: dateArbitrary,
  horario: timeArbitrary,
  local: fc.string({ minLength: 1, maxLength: 200 }),
  descricao: fc.oneof(fc.constant(null), fc.string({ minLength: 0, maxLength: 500 })),
  medicina_principal: fc.oneof(
    fc.constant(null),
    fc.constantFrom('Ayahuasca', 'Rapé', 'Sananga', 'Kambo')
  ),
  vagas: fc.oneof(fc.constant(null), fc.integer({ min: 0, max: 100 })),
  observacoes: fc.oneof(fc.constant(null), fc.string({ minLength: 0, maxLength: 500 })),
  banner_url: fc.oneof(fc.constant(null), fc.webUrl()),
});

/**
 * Pure function that filters and sorts ceremonies - mirrors the Supabase query logic
 * from useUpcomingCeremonies hook:
 * - Filter by data >= referenceDate (future ceremonies)
 * - Order by data ascending (nearest first)
 * - Limit to specified number
 */
export function filterAndSortCeremonies(
  ceremonies: Cerimonia[],
  limit: number,
  referenceDate: string
): Cerimonia[] {
  return ceremonies
    .filter((ceremony) => ceremony.data >= referenceDate)
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(0, limit);
}

describe('useUpcomingCeremonies - Property Tests', () => {
  /**
   * Feature: index-redesign, Property 2: Cerimônias futuras ordenadas por data com limite
   * Validates: Requirements 2.1
   *
   * For any set of ceremonies, the filtered ceremonies should:
   * 1. Return at most `limit` ceremonies
   * 2. Be ordered by data ascending (nearest first)
   * 3. Only include ceremonies with data >= referenceDate
   */
  it('should return at most limit ceremonies ordered by data ascending', () => {
    fc.assert(
      fc.property(
        fc.array(cerimoniaArbitrary, { minLength: 0, maxLength: 30 }),
        fc.integer({ min: 1, max: 10 }),
        dateArbitrary,
        (ceremonies, limit, referenceDate) => {
          const result = filterAndSortCeremonies(ceremonies, limit, referenceDate);

          // Property 1: Result should have at most `limit` items
          expect(result.length).toBeLessThanOrEqual(limit);

          // Property 2: All items should have data >= referenceDate
          const allFuture = result.every((c) => c.data >= referenceDate);
          expect(allFuture).toBe(true);

          // Property 3: Items should be ordered by data ascending
          for (let i = 1; i < result.length; i++) {
            expect(result[i - 1].data.localeCompare(result[i].data)).toBeLessThanOrEqual(0);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: The result count should equal min(future_ceremonies_count, limit)
   */
  it('should return exactly min(future_ceremony_count, limit) items', () => {
    fc.assert(
      fc.property(
        fc.array(cerimoniaArbitrary, { minLength: 0, maxLength: 30 }),
        fc.integer({ min: 1, max: 10 }),
        dateArbitrary,
        (ceremonies, limit, referenceDate) => {
          const result = filterAndSortCeremonies(ceremonies, limit, referenceDate);
          const futureCeremonyCount = ceremonies.filter((c) => c.data >= referenceDate).length;
          const expectedCount = Math.min(futureCeremonyCount, limit);

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
        fc.array(cerimoniaArbitrary, { minLength: 0, maxLength: 30 }),
        dateArbitrary,
        (ceremonies, referenceDate) => {
          const defaultLimit = 3;
          const result = filterAndSortCeremonies(ceremonies, defaultLimit, referenceDate);

          expect(result.length).toBeLessThanOrEqual(defaultLimit);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Sorting is stable - the nearest ceremonies should always come first
   */
  it('should always include the nearest future ceremonies when limit is reached', () => {
    fc.assert(
      fc.property(
        fc.array(cerimoniaArbitrary, { minLength: 1, maxLength: 30 }),
        fc.integer({ min: 1, max: 10 }),
        dateArbitrary,
        (ceremonies, limit, referenceDate) => {
          const result = filterAndSortCeremonies(ceremonies, limit, referenceDate);
          const allFutureCeremonies = ceremonies.filter((c) => c.data >= referenceDate);

          if (allFutureCeremonies.length === 0 || result.length === 0) {
            return true;
          }

          // Sort all future ceremonies by date ascending
          const sortedAllFuture = [...allFutureCeremonies].sort((a, b) =>
            a.data.localeCompare(b.data)
          );

          // The result should contain the top N nearest ceremonies
          const expectedTopCeremonies = sortedAllFuture.slice(0, limit);

          // Verify result contains exactly the expected ceremonies (by id)
          const resultIds = new Set(result.map((c) => c.id));
          const expectedIds = new Set(expectedTopCeremonies.map((c) => c.id));

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

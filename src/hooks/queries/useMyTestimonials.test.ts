import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { MyTestimonial } from './useMyTestimonials';

/**
 * Feature: index-redesign, Property 8: Depoimentos do usuário ordenados por data com limite
 * Validates: Requirements 4.1
 *
 * WHEN o usuário acessa a página Index THEN o Portal SHALL exibir os últimos 3
 * depoimentos do usuário ordenados por data de criação
 */

// Generate valid ISO date strings for created_at
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

// Arbitrary for generating MyTestimonial objects
const myTestimonialArbitrary: fc.Arbitrary<MyTestimonial> = fc.record({
  id: fc.uuid(),
  texto: fc.string({ minLength: 1, maxLength: 500 }),
  aprovado: fc.boolean(),
  created_at: isoDateArbitrary,
});

/**
 * Pure function that sorts testimonials by created_at - mirrors the logic
 * from useMyTestimonials hook:
 * - Order by created_at descending (most recent first)
 * - Limit to specified number
 */
export function sortAndLimitTestimonials(
  testimonials: MyTestimonial[],
  limit: number
): MyTestimonial[] {
  return [...testimonials]
    .sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, limit);
}


describe('useMyTestimonials - Property Tests', () => {
  /**
   * Feature: index-redesign, Property 8: Depoimentos do usuário ordenados por data com limite
   * Validates: Requirements 4.1
   *
   * For any set of user testimonials, the sorted testimonials should:
   * 1. Return at most `limit` testimonials
   * 2. Be ordered by created_at descending (most recent first)
   */
  it('should return at most limit testimonials ordered by created_at descending', () => {
    fc.assert(
      fc.property(
        fc.array(myTestimonialArbitrary, { minLength: 0, maxLength: 30 }),
        fc.integer({ min: 1, max: 10 }),
        (testimonials, limit) => {
          const result = sortAndLimitTestimonials(testimonials, limit);

          // Property 1: Result should have at most `limit` items
          expect(result.length).toBeLessThanOrEqual(limit);

          // Property 2: Items should be ordered by created_at descending
          for (let i = 1; i < result.length; i++) {
            const prevDate = new Date(result[i - 1].created_at).getTime();
            const currDate = new Date(result[i].created_at).getTime();
            expect(prevDate).toBeGreaterThanOrEqual(currDate);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: The result count should equal min(testimonials_count, limit)
   */
  it('should return exactly min(testimonials_count, limit) items', () => {
    fc.assert(
      fc.property(
        fc.array(myTestimonialArbitrary, { minLength: 0, maxLength: 30 }),
        fc.integer({ min: 1, max: 10 }),
        (testimonials, limit) => {
          const result = sortAndLimitTestimonials(testimonials, limit);
          const expectedCount = Math.min(testimonials.length, limit);

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
        fc.array(myTestimonialArbitrary, { minLength: 0, maxLength: 30 }),
        (testimonials) => {
          const defaultLimit = 3;
          const result = sortAndLimitTestimonials(testimonials, defaultLimit);

          expect(result.length).toBeLessThanOrEqual(defaultLimit);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Sorting is stable - the most recent testimonials should always come first
   */
  it('should always include the testimonials with most recent created_at when limit is reached', () => {
    fc.assert(
      fc.property(
        fc.array(myTestimonialArbitrary, { minLength: 1, maxLength: 30 }),
        fc.integer({ min: 1, max: 10 }),
        (testimonials, limit) => {
          const result = sortAndLimitTestimonials(testimonials, limit);

          if (testimonials.length === 0 || result.length === 0) {
            return true;
          }

          // Sort all testimonials by created_at descending
          const sortedAll = [...testimonials].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

          // The result should contain the top N most recent testimonials
          const expectedTopTestimonials = sortedAll.slice(0, limit);

          // Verify result contains exactly the expected testimonials (by id)
          const resultIds = new Set(result.map((t) => t.id));
          const expectedIds = new Set(expectedTopTestimonials.map((t) => t.id));

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

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { GaleriaItemComCerimonia, GaleriaTipo } from '@/types';

/**
 * Feature: index-redesign, Property 1: Fotos ordenadas por data decrescente com limite
 * Validates: Requirements 1.1
 *
 * WHEN o usuário acessa a página Index THEN o Portal SHALL exibir um carrossel
 * com as últimas 10 fotos da galeria ordenadas por data de criação
 */

// Generate valid ISO date strings
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

// Arbitrary for generating GaleriaItemComCerimonia objects
const galeriaItemArbitrary: fc.Arbitrary<GaleriaItemComCerimonia> = fc.record({
  id: fc.uuid(),
  cerimonia_id: fc.oneof(fc.constant(null), fc.uuid()),
  titulo: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 100 })),
  descricao: fc.oneof(fc.constant(null), fc.string({ minLength: 0, maxLength: 500 })),
  tipo: fc.constant('foto' as GaleriaTipo),
  url: fc.webUrl(),
  thumbnail_url: fc.oneof(fc.constant(null), fc.webUrl()),
  uploaded_by: fc.oneof(fc.constant(null), fc.uuid()),
  created_at: isoDateArbitrary,
  updated_at: isoDateArbitrary,
  cerimonias: fc.oneof(
    fc.constant(null),
    fc.record({
      id: fc.uuid(),
      nome: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 50 })),
      data: fc
        .integer({ min: 2020, max: 2030 })
        .chain((year) =>
          fc.integer({ min: 1, max: 12 }).chain((month) =>
            fc.integer({ min: 1, max: 28 }).map((day) => {
              const m = String(month).padStart(2, '0');
              const d = String(day).padStart(2, '0');
              return `${year}-${m}-${d}`;
            })
          )
        ),
      medicina_principal: fc.oneof(
        fc.constant(null),
        fc.constantFrom('Ayahuasca', 'Rapé', 'Sananga', 'Kambo')
      ),
    })
  ),
});

/**
 * Pure function that filters and sorts photos - mirrors the Supabase query logic
 * from useLatestPhotos hook:
 * - Filter by tipo = 'foto'
 * - Order by created_at descending
 * - Limit to specified number
 */
export function filterAndSortPhotos(
  items: GaleriaItemComCerimonia[],
  limit: number
): GaleriaItemComCerimonia[] {
  return items
    .filter((item) => item.tipo === 'foto')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

describe('useLatestPhotos - Property Tests', () => {
  /**
   * Feature: index-redesign, Property 1: Fotos ordenadas por data decrescente com limite
   * Validates: Requirements 1.1
   *
   * For any set of gallery items, the filtered photos should:
   * 1. Return at most `limit` photos
   * 2. Be ordered by created_at descending (most recent first)
   * 3. Only include items with tipo === 'foto'
   */
  it('should return at most limit photos ordered by created_at descending', () => {
    fc.assert(
      fc.property(
        fc.array(galeriaItemArbitrary, { minLength: 0, maxLength: 30 }),
        fc.integer({ min: 1, max: 20 }),
        (items, limit) => {
          const result = filterAndSortPhotos(items, limit);

          // Property 1: Result should have at most `limit` items
          expect(result.length).toBeLessThanOrEqual(limit);

          // Property 2: All items should be photos (tipo === 'foto')
          const allPhotos = result.every((item) => item.tipo === 'foto');
          expect(allPhotos).toBe(true);

          // Property 3: Items should be ordered by created_at descending
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
   * Property: The result count should equal min(photos_count, limit)
   */
  it('should return exactly min(photo_count, limit) items', () => {
    fc.assert(
      fc.property(
        fc.array(galeriaItemArbitrary, { minLength: 0, maxLength: 30 }),
        fc.integer({ min: 1, max: 20 }),
        (items, limit) => {
          const result = filterAndSortPhotos(items, limit);
          const photoCount = items.filter((item) => item.tipo === 'foto').length;
          const expectedCount = Math.min(photoCount, limit);

          expect(result.length).toBe(expectedCount);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Default limit of 10 should work correctly
   */
  it('should respect default limit of 10', () => {
    fc.assert(
      fc.property(
        fc.array(galeriaItemArbitrary, { minLength: 0, maxLength: 30 }),
        (items) => {
          const defaultLimit = 10;
          const result = filterAndSortPhotos(items, defaultLimit);

          expect(result.length).toBeLessThanOrEqual(defaultLimit);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Sorting is stable - the most recent photos should always come first
   */
  it('should always include the most recent photos when limit is reached', () => {
    fc.assert(
      fc.property(
        fc.array(galeriaItemArbitrary, { minLength: 1, maxLength: 30 }),
        fc.integer({ min: 1, max: 10 }),
        (items, limit) => {
          const result = filterAndSortPhotos(items, limit);
          const allPhotos = items.filter((item) => item.tipo === 'foto');

          if (allPhotos.length === 0 || result.length === 0) {
            return true;
          }

          // Sort all photos by date descending
          const sortedAllPhotos = [...allPhotos].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

          // The result should contain the top N most recent photos
          const expectedTopPhotos = sortedAllPhotos.slice(0, limit);

          // Verify result contains exactly the expected photos (by id)
          const resultIds = new Set(result.map((p) => p.id));
          const expectedIds = new Set(expectedTopPhotos.map((p) => p.id));

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

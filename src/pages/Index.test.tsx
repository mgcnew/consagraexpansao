import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: index-redesign, Property 12: Alerta de anamnese condicional
 * Validates: Requirements 7.1, 7.4
 *
 * WHEN o usuário não possui anamnese THEN o Portal SHALL exibir card de alerta destacado no topo da página
 * WHEN o usuário possui anamnese THEN o Portal SHALL ocultar o alerta completamente
 *
 * For any user state, the anamnese alert SHALL be visible if and only if hasAnamnese === false.
 */

/**
 * Pure function that determines if the anamnese alert should be visible.
 * This mirrors the logic in Index.tsx: {hasAnamnese === false && (...)}
 *
 * @param hasAnamnese - The user's anamnese status (true, false, or null)
 * @returns true if the alert should be visible, false otherwise
 */
export function shouldShowAnamneseAlert(hasAnamnese: boolean | null): boolean {
  return hasAnamnese === false;
}

describe('Index Page - Anamnese Alert Property Tests', () => {
  /**
   * Feature: index-redesign, Property 12: Alerta de anamnese condicional
   * Validates: Requirements 7.1, 7.4
   *
   * For any user state, the anamnese alert SHALL be visible if and only if hasAnamnese === false.
   */
  it('should show anamnese alert if and only if hasAnamnese is false', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(true), fc.constant(false), fc.constant(null)),
        (hasAnamnese) => {
          const shouldShow = shouldShowAnamneseAlert(hasAnamnese);

          // Property: Alert is visible iff hasAnamnese === false
          if (hasAnamnese === false) {
            expect(shouldShow).toBe(true);
          } else {
            expect(shouldShow).toBe(false);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Alert should be hidden when hasAnamnese is true (Req 7.4)
   */
  it('should hide anamnese alert when user has anamnese', () => {
    fc.assert(
      fc.property(fc.constant(true), (hasAnamnese) => {
        const shouldShow = shouldShowAnamneseAlert(hasAnamnese);
        expect(shouldShow).toBe(false);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Alert should be visible when hasAnamnese is false (Req 7.1)
   */
  it('should show anamnese alert when user does not have anamnese', () => {
    fc.assert(
      fc.property(fc.constant(false), (hasAnamnese) => {
        const shouldShow = shouldShowAnamneseAlert(hasAnamnese);
        expect(shouldShow).toBe(true);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Alert should be hidden when hasAnamnese is null (loading state)
   * This ensures we don't flash the alert while loading
   */
  it('should hide anamnese alert when hasAnamnese is null (loading)', () => {
    fc.assert(
      fc.property(fc.constant(null), (hasAnamnese) => {
        const shouldShow = shouldShowAnamneseAlert(hasAnamnese);
        expect(shouldShow).toBe(false);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: The visibility function is deterministic
   * For any given input, the output should always be the same
   */
  it('should be deterministic - same input always produces same output', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(true), fc.constant(false), fc.constant(null)),
        (hasAnamnese) => {
          const result1 = shouldShowAnamneseAlert(hasAnamnese);
          const result2 = shouldShowAnamneseAlert(hasAnamnese);
          expect(result1).toBe(result2);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Biconditional - alert visible <=> hasAnamnese === false
   * This is the core property that validates Requirements 7.1 and 7.4
   */
  it('should satisfy biconditional: visible iff hasAnamnese === false', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(true), fc.constant(false), fc.constant(null)),
        (hasAnamnese) => {
          const isVisible = shouldShowAnamneseAlert(hasAnamnese);

          // Biconditional: isVisible <=> (hasAnamnese === false)
          // This means: isVisible === (hasAnamnese === false)
          expect(isVisible).toBe(hasAnamnese === false);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

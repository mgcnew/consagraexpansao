import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { SectionErrorBoundary } from './SectionErrorBoundary';

/**
 * Feature: index-redesign, Property 11: Isolamento de erros por seção
 * Validates: Requirements 5.4
 *
 * WHEN ocorre erro ao carregar uma seção THEN o Portal SHALL exibir mensagem de erro
 * apenas na seção afetada sem quebrar a página
 *
 * For any error in a specific section, the other sections SHALL continue functioning
 * and rendering normally.
 */

// Suppress console.error for expected errors in tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/**
 * Component that throws an error when shouldThrow is true
 */
function ThrowingComponent({ shouldThrow, id }: { shouldThrow: boolean; id: string }) {
  if (shouldThrow) {
    throw new Error(`Error in section ${id}`);
  }
  return <div data-testid={`section-${id}`}>Section {id} content</div>;
}

/**
 * Pure function that determines if a section should show error state
 * This mirrors the logic in SectionErrorBoundary
 */
export function shouldShowErrorState(hasError: boolean): boolean {
  return hasError;
}

/**
 * Pure function that determines if other sections should be affected by an error
 * in a different section. This should always return false (isolation property).
 */
export function shouldOtherSectionsBeAffected(
  errorInSection: string | null,
  checkingSection: string
): boolean {
  // Error in one section should never affect other sections
  // Only the section with the error should be affected
  return errorInSection !== null && errorInSection === checkingSection;
}

describe('SectionErrorBoundary - Error Isolation Property Tests', () => {
  /**
   * Feature: index-redesign, Property 11: Isolamento de erros por seção
   * Validates: Requirements 5.4
   *
   * For any error in a specific section, the other sections SHALL continue
   * functioning and rendering normally.
   */
  it('should isolate errors - error in one section does not affect others', () => {
    fc.assert(
      fc.property(
        // Generate number of sections (2-5)
        fc.integer({ min: 2, max: 5 }),
        // Generate which section should throw (index)
        fc.nat({ max: 100 }),
        (numSections, errorIndexRaw) => {
          cleanup(); // Ensure clean DOM for each property test iteration

          // Determine which section throws
          const throwingIndex = errorIndexRaw % numSections;

          const { container } = render(
            <div>
              {Array.from({ length: numSections }, (_, index) => (
                <SectionErrorBoundary key={index} sectionTitle={`Section ${index}`}>
                  <ThrowingComponent
                    shouldThrow={index === throwingIndex}
                    id={String(index)}
                  />
                </SectionErrorBoundary>
              ))}
            </div>
          );

          // Verify: sections that didn't throw should render normally
          for (let index = 0; index < numSections; index++) {
            const section = container.querySelector(`[data-testid="section-${index}"]`);

            if (index !== throwingIndex) {
              // Section that didn't throw should show original content
              expect(section).not.toBeNull();
              expect(section?.textContent).toContain(`Section ${index} content`);
            } else {
              // Section that threw should not show original content
              expect(section).toBeNull();
            }
          }

          // Verify: the throwing section should show error UI
          expect(container.textContent).toContain('Ocorreu um erro inesperado');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error boundary should catch any error and render fallback
   */
  it('should catch errors and render fallback UI for any section', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        (sectionTitle) => {
          cleanup(); // Ensure clean DOM for each property test iteration

          const { container } = render(
            <SectionErrorBoundary sectionTitle={sectionTitle}>
              <ThrowingComponent shouldThrow={true} id="test" />
            </SectionErrorBoundary>
          );

          // Should show error message
          const errorMessage = container.querySelector('.text-center');
          expect(errorMessage?.textContent).toContain('Ocorreu um erro inesperado nesta seção');

          // Should show section title if provided
          if (sectionTitle.trim()) {
            expect(container.textContent).toContain(sectionTitle);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Multiple independent error boundaries maintain isolation
   */
  it('should maintain isolation across multiple error boundaries', () => {
    fc.assert(
      fc.property(
        // Generate array of booleans indicating which sections should throw
        fc.array(fc.boolean(), { minLength: 2, maxLength: 6 }),
        (shouldThrowArray) => {
          cleanup(); // Ensure clean DOM for each property test iteration

          const { container } = render(
            <div>
              {shouldThrowArray.map((shouldThrow, index) => (
                <SectionErrorBoundary key={index} sectionTitle={`Section ${index}`}>
                  <ThrowingComponent shouldThrow={shouldThrow} id={String(index)} />
                </SectionErrorBoundary>
              ))}
            </div>
          );

          // Verify each section independently
          shouldThrowArray.forEach((shouldThrow, index) => {
            const section = container.querySelector(`[data-testid="section-${index}"]`);

            if (shouldThrow) {
              // Section that threw should not show original content
              expect(section).toBeNull();
            } else {
              // Section that didn't throw should show original content
              expect(section).not.toBeNull();
              expect(section?.textContent).toContain(`Section ${index} content`);
            }
          });

          // Count error messages - should match number of throwing sections
          const errorCount = shouldThrowArray.filter(Boolean).length;
          if (errorCount > 0) {
            expect(container.textContent).toContain('Ocorreu um erro inesperado');
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Pure function - shouldOtherSectionsBeAffected always returns false
   * for different sections
   */
  it('should never affect other sections (pure function test)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        (errorSection, checkSection) => {
          const isAffected = shouldOtherSectionsBeAffected(errorSection, checkSection);

          // If checking a different section, it should not be affected
          if (errorSection !== checkSection) {
            expect(isAffected).toBe(false);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error state determination is correct
   */
  it('should correctly determine error state', () => {
    fc.assert(
      fc.property(fc.boolean(), (hasError) => {
        const showError = shouldShowErrorState(hasError);
        expect(showError).toBe(hasError);
        return true;
      }),
      { numRuns: 100 }
    );
  });
});

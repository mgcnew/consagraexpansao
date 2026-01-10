export async function tryCatch<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<[T | null, Error | null]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`[${context || 'Async Error'}]`, err);
    return [null, err];
  }
}

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
} as const;
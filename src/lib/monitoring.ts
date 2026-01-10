// Placeholder for Sentry integration
// Install: npm install @sentry/react

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    console.log(`[INFO] ${message}`, context);
  },
  error: (message: string, error?: Error, context?: Record<string, unknown>) => {
    console.error(`[ERROR] ${message}`, error, context);
    // TODO: Send to Sentry when configured
    // Sentry.captureException(error, { extra: context });
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(`[WARN] ${message}`, context);
  },
};

export function measurePerformance(name: string, fn: () => void) {
  const start = performance.now();
  fn();
  const duration = performance.now() - start;
  console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
}

// TODO: Initialize Sentry
// export function initSentry() {
//   Sentry.init({
//     dsn: import.meta.env.VITE_SENTRY_DSN,
//     environment: import.meta.env.MODE,
//     tracesSampleRate: 0.1,
//   });
// }
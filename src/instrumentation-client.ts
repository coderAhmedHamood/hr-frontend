/**
 * Next.js / React-Turbopack bug (dev only): when a route aborts via
 * notFound() or redirect() before children finish, performance.measure()
 * is called with childrenEndTime = -Infinity.
 * Chrome: "cannot have a negative time stamp"
 * Firefox: "Given attribute end cannot be negative"
 * Production builds are unaffected.
 * @see https://github.com/vercel/next.js/issues/86060
 */
if (process.env.NODE_ENV === 'development') {
  const originalMeasure = performance.measure.bind(performance);
  performance.measure = ((...args: Parameters<typeof performance.measure>) => {
    try {
      return originalMeasure(...args);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (
        message.includes('negative time stamp')
        || message.includes('end cannot be negative')
      ) {
        return undefined as unknown as PerformanceMeasure;
      }
      throw error;
    }
  }) as typeof performance.measure;
}

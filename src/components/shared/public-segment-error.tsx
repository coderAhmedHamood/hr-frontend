'use client';

import * as React from 'react';
import { ErrorFallback } from '@/components/shared/error-fallback';
import { reportError } from '@/shared/errors/report-error';

/** Shared body for every unauthenticated-route error.tsx (login, careers, jobs, apply, f). */
export function PublicSegmentError({
  error,
  reset,
  context,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  context: string;
}) {
  const { normalized, logEntry } = React.useMemo(
    () => reportError(error, context, error.digest),
    [error, context],
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <ErrorFallback
        error={normalized}
        correlationId={logEntry.correlationId}
        onRetry={reset}
        onReload={() => window.location.reload()}
        onGoBack={() => { window.location.href = '/'; }}
        goBackLabel="الصفحة الرئيسية"
      />
    </div>
  );
}

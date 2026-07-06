'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ErrorFallback } from '@/components/shared/error-fallback';
import { reportError } from '@/shared/errors/report-error';

/**
 * Route-level boundary for the whole authenticated app segment. Catches failures the
 * component-level AppErrorBoundary can't — e.g. a Server Component throwing during
 * render, before the client tree (and AppErrorBoundary) even mounts. Next.js renders
 * this in place of the failing segment while keeping the root layout (and, for nested
 * segments, ancestor layouts) intact.
 */
export default function AppSegmentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  const { normalized, logEntry } = React.useMemo(
    () => reportError(error, 'app-segment', error.digest),
    [error],
  );

  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center">
      <ErrorFallback
        error={normalized}
        correlationId={logEntry.correlationId}
        onRetry={reset}
        onReload={() => window.location.reload()}
        onGoBack={() => router.push('/')}
        goBackLabel="العودة للتطبيقات"
      />
    </div>
  );
}

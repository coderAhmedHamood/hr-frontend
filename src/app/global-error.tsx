'use client';

import * as React from 'react';
import './globals.css';
import { ErrorFallback } from '@/components/shared/error-fallback';
import { reportError } from '@/shared/errors/report-error';

/**
 * Next.js requires `global-error.tsx` to render its own <html>/<body> — it replaces
 * the ROOT layout entirely, which means Providers, fonts, and theme boot scripts may
 * not be mounted. Keep this file minimal and dependency-light on purpose: it is the
 * fallback for when everything else — including `(app)/error.tsx` — has failed to
 * catch the crash (e.g. the root layout or a Provider itself threw).
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  const { normalized, logEntry } = React.useMemo(
    () => reportError(error, 'global-crash', error.digest),
    [error],
  );

  return (
    <html lang="ar" dir="rtl">
      <body className="flex min-h-screen items-center justify-center bg-background p-4 font-sans antialiased">
        <ErrorFallback
          error={normalized}
          correlationId={logEntry.correlationId}
          title="تعذّر تشغيل التطبيق"
          onReload={() => window.location.reload()}
        />
      </body>
    </html>
  );
}

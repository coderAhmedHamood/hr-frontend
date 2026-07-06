'use client';

import { Component, ReactNode } from 'react';
import { ErrorFallback } from '@/components/shared/error-fallback';
import { reportError } from '@/shared/errors/report-error';
import type { NormalizedError } from '@/shared/errors/normalize-error';

interface Props {
  children: ReactNode;
  /** Logged alongside the error (e.g. 'app-shell', 'employee-detail') to tell boundaries apart in logs. */
  context?: string;
}

interface State {
  hasError: boolean;
  normalized: NormalizedError | null;
  correlationId: string | null;
}

/**
 * `notFound()` and `redirect()` (from `next/navigation`) work by throwing an error
 * with a special `digest` that Next's own routing layer is supposed to intercept.
 * A plain React error boundary can't tell that apart from a real crash — it would
 * swallow the digest and render our fallback UI instead of the real 404/redirect.
 * Must rethrow these so they keep propagating to Next's internal boundary.
 */
function isNextRoutingError(error: unknown): boolean {
  const digest = (error as { digest?: unknown })?.digest;
  return typeof digest === 'string' && (digest === 'NEXT_NOT_FOUND' || digest.startsWith('NEXT_HTTP_ERROR_FALLBACK') || digest.startsWith('NEXT_REDIRECT'));
}

/**
 * Component-level Error Boundary — isolates a crash to the subtree it wraps so the
 * rest of the app (Topbar, Sidebar, other pages) keeps working. Wrapped around the
 * authenticated page content in `(app)/layout.tsx`; also suitable around any other
 * complex, independently-crashable widget (a heavy data table, a dialog body).
 */
export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, normalized: null, correlationId: null };
  }

  static getDerivedStateFromError(error: unknown): Partial<State> {
    if (isNextRoutingError(error)) throw error;
    return { hasError: true };
  }

  override componentDidCatch(error: unknown) {
    if (isNextRoutingError(error)) return;
    const { normalized, logEntry } = reportError(error, this.props.context ?? 'component-boundary');
    this.setState({ normalized, correlationId: logEntry.correlationId });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, normalized: null, correlationId: null });
  };

  override render() {
    if (this.state.hasError && this.state.normalized) {
      return (
        <ErrorFallback
          error={this.state.normalized}
          correlationId={this.state.correlationId ?? undefined}
          onRetry={this.handleRetry}
          onReload={() => window.location.reload()}
        />
      );
    }
    return this.props.children;
  }
}

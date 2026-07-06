'use client';

import { AlertTriangle, ArrowRight, LifeBuoy, RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { NormalizedError } from '@/shared/errors/normalize-error';
import { isChunkLoadCode, isRetryableCode } from '@/shared/errors/error-codes';

export type ErrorFallbackProps = {
  error: NormalizedError;
  correlationId?: string;
  /** Re-attempt rendering the same subtree/segment (Error Boundary reset / route error.tsx `reset()`). */
  onRetry?: () => void;
  /** Hard browser reload — the only reliable recovery for a stale bundle or a broken root layout. */
  onReload?: () => void;
  /** Navigate back to a known-good screen (e.g. the app launcher). Omit on the global crash screen. */
  onGoBack?: () => void;
  goBackLabel?: string;
  title?: string;
  className?: string;
};

const SUPPORT_HREF = '/support';

/** Arabic RTL fallback UI shared by AppErrorBoundary, every route error.tsx, and global-error.tsx. */
export function ErrorFallback({
  error,
  correlationId,
  onRetry,
  onReload,
  onGoBack,
  goBackLabel = 'العودة',
  title,
  className,
}: ErrorFallbackProps) {
  const isDev = process.env.NODE_ENV === 'development';
  const preferReload = isChunkLoadCode(error.code);
  const canRetry = !!onRetry && isRetryableCode(error.code) && !preferReload;

  return (
    <div className={`flex min-h-[40vh] w-full items-center justify-center p-4 ${className ?? ''}`} dir="rtl">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>{title ?? 'حدث خطأ غير متوقع'}</CardTitle>
          <CardDescription>{error.message || 'يرجى المحاولة مرة أخرى، أو التواصل مع الدعم الفني إذا استمرت المشكلة.'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {canRetry && (
              <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                إعادة المحاولة
              </Button>
            )}
            {onReload && (
              <Button variant={preferReload ? 'luxe' : 'default'} size="sm" onClick={onReload} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                إعادة تحميل التطبيق
              </Button>
            )}
            {onGoBack && (
              <Button variant="ghost" size="sm" onClick={onGoBack} className="gap-1.5">
                <ArrowRight className="h-3.5 w-3.5" />
                {goBackLabel}
              </Button>
            )}
          </div>

          <a
            href={SUPPORT_HREF}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <LifeBuoy className="h-3.5 w-3.5" />
            التواصل مع الدعم الفني
          </a>

          {correlationId && (
            <p className="font-mono text-[10px] text-muted-foreground/60" dir="ltr">
              #{correlationId}
            </p>
          )}

          {isDev && (
            <details className="rounded-md border border-border bg-muted/30 p-2 text-right text-[11px] text-muted-foreground">
              <summary className="cursor-pointer select-none font-medium">تفاصيل تقنية (تظهر فقط في بيئة التطوير)</summary>
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all" dir="ltr">
                {error.status != null ? `status: ${error.status}\n` : ''}
                {error.code}
                {error.cause instanceof Error && error.cause.stack ? `\n\n${error.cause.stack}` : ''}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

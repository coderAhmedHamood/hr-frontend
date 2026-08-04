'use client';

export function StoreCsrLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      …
    </div>
  );
}

export function StoreCsrError({ message }: { message?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-sm text-destructive">
      <p>{message || 'Failed to load store data.'}</p>
    </div>
  );
}

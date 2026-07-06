'use client';

import { cn, formatNumber } from '@/shared/utils';

/** Hours/minutes with Western digits and Arabic unit suffixes (number then س/د). */
export function DurationMinutesDisplay({
  minutes,
  className,
}: {
  minutes: number | null | undefined;
  className?: string;
}) {
  if (minutes == null || !Number.isFinite(minutes) || minutes < 0) {
    return <span className={className}>—</span>;
  }

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  return (
    <span
      className={cn('inline-flex flex-wrap items-baseline gap-x-1 tabular-nums whitespace-nowrap', className)}
    >
      {h > 0 ? (
        <span className="inline-flex items-baseline">
          <span>{formatNumber(h)}</span>
          <span>س</span>
        </span>
      ) : null}
      {m > 0 || h <= 0 ? (
        <span className="inline-flex items-baseline">
          <span>{formatNumber(m)}</span>
          <span>د</span>
        </span>
      ) : null}
    </span>
  );
}

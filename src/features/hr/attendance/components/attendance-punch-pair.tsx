'use client';

import { ArrowLeft, LogIn, LogOut } from 'lucide-react';
import { cn } from '@/shared/utils';

export const ATTENDANCE_SOURCE_LABEL: Record<string, string> = {
  mobile_app: 'تطبيق',
  web_portal: 'بوابة',
  kiosk: 'كشك',
  manual_hr: 'يدوي',
  biometric: 'بصمة',
  system: 'نظام',
};

export function formatIsoTimeAr(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const period = h < 12 ? 'ص' : 'م';
  h = h % 12 === 0 ? 12 : h % 12;
  return `${h}:${m} ${period}`;
}

export function durationBetweenIso(fromIso?: string | null, toIso?: string | null): string | null {
  if (!fromIso || !toIso) return null;
  const mins = (new Date(toIso).getTime() - new Date(fromIso).getTime()) / 60000;
  if (!Number.isFinite(mins) || mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}س${m > 0 ? ` ${m}د` : ''}` : `${m}د`;
}

export function formatMinutesAr(m: number): string | null {
  if (!Number.isFinite(m) || m <= 0) return null;
  const h = Math.floor(m / 60);
  const mins = Math.round(m % 60);
  return h > 0 ? `${h}س${mins > 0 ? ` ${mins}د` : ''}` : `${mins}د`;
}

type PunchCellProps = {
  kind: 'in' | 'out';
  time: string;
  source?: string | null;
  missing?: boolean;
};

function PunchCell({ kind, time, source, missing }: PunchCellProps) {
  const isIn = kind === 'in';
  const Icon = isIn ? LogIn : LogOut;
  const hasTime = time !== '—';

  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col gap-1 rounded-xl border px-3 py-2.5',
        isIn
          ? 'border-success/30 bg-success/5'
          : 'border-amber-500/30 bg-amber-500/5 dark:border-amber-400/25 dark:bg-amber-400/5',
        missing && 'border-dashed border-muted-foreground/25 bg-muted/20',
      )}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-md',
            isIn ? 'bg-success/15 text-success' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
            missing && 'bg-muted text-muted-foreground',
          )}
        >
          <Icon className="h-3 w-3" />
        </span>
        <span className="text-[10px] font-semibold text-muted-foreground">{isIn ? 'دخول' : 'خروج'}</span>
      </div>
      <p
        className={cn(
          'font-mono text-base font-bold tabular-nums leading-none',
          isIn ? 'text-success' : 'text-amber-600 dark:text-amber-400',
          !hasTime && 'text-muted-foreground/50',
        )}
        dir="ltr"
      >
        {time}
      </p>
      {source ? (
        <span className="text-[10px] text-muted-foreground">{source}</span>
      ) : hasTime ? (
        <span className="h-[14px]" aria-hidden />
      ) : null}
    </div>
  );
}

export type AttendancePunchPairProps = {
  checkInTime: string;
  checkOutTime: string;
  checkInSource?: string | null;
  checkOutSource?: string | null;
  duration?: string | null;
  className?: string;
};

export function AttendancePunchPair({
  checkInTime,
  checkOutTime,
  checkInSource,
  checkOutSource,
  duration,
  className,
}: AttendancePunchPairProps) {
  const missingIn = checkInTime === '—';
  const missingOut = checkOutTime === '—';

  return (
    <div className={cn('flex min-w-0 items-stretch gap-2', className)}>
      <PunchCell kind="in" time={checkInTime} source={checkInSource} missing={missingIn} />

      <div className="flex w-10 shrink-0 flex-col items-center justify-center gap-1 self-center">
        <div className="h-px w-full bg-gradient-to-l from-border via-border/60 to-transparent" />
        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground shadow-sm">
          {duration ? (
            <span className="text-[9px] font-bold tabular-nums text-primary">{duration}</span>
          ) : (
            <ArrowLeft className="h-3 w-3 rotate-180" aria-hidden />
          )}
        </div>
        <div className="h-px w-full bg-gradient-to-r from-border via-border/60 to-transparent" />
      </div>

      <PunchCell kind="out" time={checkOutTime} source={checkOutSource} missing={missingOut} />
    </div>
  );
}

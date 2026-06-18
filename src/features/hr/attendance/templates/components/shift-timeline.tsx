'use client';

import type { ShiftPeriod } from '@/features/hr/attendance/lib/types';
import { durationLabel, fmtMin, toMinutes } from '@/features/hr/attendance/templates/utils/shift-template-helpers';

export function ShiftTimeline({ period, showWindows }: { period: ShiftPeriod; showWindows: boolean }) {
  const startMin = toMinutes(period.startTime);
  const endMin = toMinutes(period.endTime);
  const workDur = endMin - startMin;
  if (workDur <= 0) return null;

  const preWin = showWindows ? period.checkIn.beforeStartMinutes : 0;
  const postWin = showWindows ? period.checkOut.afterEndMinutes : 0;
  const grace = showWindows ? period.checkIn.graceMinutes : 0;
  const early = showWindows ? period.checkOut.beforeEndMinutes : 0;
  const total = preWin + workDur + postWin || 1;

  const prePct = (preWin / total) * 100;
  const workPct = (workDur / total) * 100;
  const postPct = (postWin / total) * 100;

  const bStart = toMinutes(period.breakStart);
  const bEnd = toMinutes(period.breakEnd);
  const breakOk = period.breakEnabled && bEnd > bStart && bStart >= startMin && bEnd <= endMin;
  const breakLeft = breakOk ? ((bStart - startMin) / workDur) * 100 : 0;
  const breakWidth = breakOk ? ((bEnd - bStart) / workDur) * 100 : 0;

  const graceWidth = showWindows && grace > 0 ? (grace / workDur) * 100 : 0;
  const earlyLeft = showWindows && early > 0 ? ((workDur - early) / workDur) * 100 : 0;
  const earlyWidth = showWindows && early > 0 ? (early / workDur) * 100 : 0;

  const dur = durationLabel(period.startTime, period.endTime);

  return (
    <div className="space-y-1.5 select-none" dir="rtl">
      <div className="flex h-9 overflow-hidden rounded-xl text-[9px] font-semibold ring-1 ring-border/40">
        {preWin > 0 && (
          <div
            style={{ width: `${prePct}%` }}
            className="flex shrink-0 items-center justify-center border-e border-primary/20 bg-primary/10 text-primary/70"
            title={`نافذة الدخول المبكر: ${preWin}د`}
          >
            {prePct > 6 && `${preWin}د`}
          </div>
        )}

        <div
          dir="ltr"
          style={{ width: `${workPct}%` }}
          className="relative flex shrink-0 items-center justify-center overflow-hidden bg-primary/15 text-primary"
        >
          {graceWidth > 0 && (
            <div
              style={{ left: 0, width: `${graceWidth}%` }}
              className="absolute inset-y-0 border-e border-success/30 bg-success/20"
              title={`سماحية: ${grace}د`}
            />
          )}
          {earlyWidth > 0 && (
            <div
              style={{ left: `${earlyLeft}%`, width: `${earlyWidth}%` }}
              className="absolute inset-y-0 border-s border-warning/30 bg-warning/20"
              title={`خروج مبكر مسموح: ${early}د`}
            />
          )}
          {breakWidth > 0 && (
            <div
              style={{ left: `${breakLeft}%`, width: `${breakWidth}%` }}
              className="absolute inset-y-0 border-x border-warning/40 bg-warning/30"
              title="استراحة"
            />
          )}
          <span className="relative z-10 text-[10px] font-bold">{dur}</span>
        </div>

        {postWin > 0 && (
          <div
            style={{ width: `${postPct}%` }}
            className="flex shrink-0 items-center justify-center border-s border-success/20 bg-success/10 text-success/70"
            title={`نافذة الخروج المتأخر: ${postWin}د`}
          >
            {postPct > 6 && `${postWin}د`}
          </div>
        )}
      </div>

      <div
        className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-1 px-0.5 text-[9px] text-muted-foreground/50"
        dir="rtl"
      >
        <span className="shrink-0 font-mono tabular-nums">
          {showWindows && preWin > 0 ? fmtMin(startMin - preWin) : period.startTime}
        </span>
        <div className="grid min-w-0 grid-cols-3 items-center gap-x-2 gap-y-1">
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-0.5">
            {showWindows && preWin > 0 && (
              <span className="text-primary/60">دخول ±{preWin}د</span>
            )}
            {showWindows && grace > 0 && (
              <span className="text-success/60">سماحية {grace}د</span>
            )}
          </div>
          <div className="flex justify-center px-1">
            <span className="whitespace-nowrap text-center font-semibold text-primary/60">ساعات العمل: {dur}</span>
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-start gap-x-2 gap-y-0.5">
            {showWindows && early > 0 && (
              <span className="text-warning/60">خروج مبكر {early}د</span>
            )}
            {showWindows && postWin > 0 && (
              <span className="text-success/60">خروج ±{postWin}د</span>
            )}
          </div>
        </div>
        <span className="shrink-0 text-end font-mono tabular-nums">
          {showWindows && postWin > 0 ? fmtMin(endMin + postWin) : period.endTime}
        </span>
      </div>
    </div>
  );
}

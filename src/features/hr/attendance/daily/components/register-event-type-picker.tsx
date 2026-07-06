'use client';

import * as React from 'react';
import { Loader2, LogIn, LogOut } from 'lucide-react';
import { cn, formatDisplayDateTime } from '@/shared/utils';
import { Label } from '@/components/ui/label';
import type { NextEventTypeResponseDto } from '@/features/hr/attendance/types/api/attendance-events';

export const REGISTERABLE_EVENT_TYPES = ['check_in', 'check_out'] as const;
export type RegisterableEventType = (typeof REGISTERABLE_EVENT_TYPES)[number];

const REGISTER_EVENT_TYPE_META: Record<RegisterableEventType, { labelAr: string; icon: React.ElementType }> = {
  check_in: { labelAr: 'تسجيل حضور', icon: LogIn },
  check_out: { labelAr: 'تسجيل انصراف', icon: LogOut },
};

const LAST_PUNCH_LABEL: Record<RegisterableEventType, string> = {
  check_in: 'دخول',
  check_out: 'خروج',
};

type Props = {
  value: RegisterableEventType;
  onChange: (value: RegisterableEventType) => void;
  nextEventType: RegisterableEventType;
  loading?: boolean;
  message?: string | null;
  nextEventData?: NextEventTypeResponseDto | null;
};

export function RegisterEventTypePicker({
  value,
  onChange,
  nextEventType,
  loading = false,
  message,
  nextEventData,
}: Props) {
  const lastPunch = nextEventData?.lastPunch ?? null;

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">نوع الحدث</Label>
      {loading ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          جاري تحديد نوع الحدث القادم…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            {REGISTERABLE_EVENT_TYPES.map((t) => {
              const meta = REGISTER_EVENT_TYPE_META[t];
              const Icon = meta.icon;
              const isSelected = value === t;
              const isRecommended = t === nextEventType;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onChange(t)}
                  className={cn(
                    'relative flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all',
                    isSelected
                      ? 'border-primary bg-primary/8 text-primary shadow-sm ring-1 ring-primary/30'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted/30',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {meta.labelAr}
                  </span>
                  {isRecommended ? (
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[10px] font-normal leading-none',
                        isSelected
                          ? 'bg-primary/15 text-primary'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      الافتراضي
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          {lastPunch ? (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              آخر بصمة:{' '}
              <span className="font-medium text-foreground">
                {LAST_PUNCH_LABEL[lastPunch.eventType as RegisterableEventType] ?? lastPunch.eventType}
              </span>
              {' · '}
              <span dir="ltr">{formatDisplayDateTime(lastPunch.occurredAt)}</span>
            </p>
          ) : null}
          {message ? (
            <p className="text-[11px] leading-relaxed text-muted-foreground">{message}</p>
          ) : null}
        </>
      )}
    </div>
  );
}

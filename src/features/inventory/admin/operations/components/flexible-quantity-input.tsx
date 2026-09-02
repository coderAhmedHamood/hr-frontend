'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { cn } from '@/shared/utils';

type Props = {
  value: number;
  onChange: (value: number) => void;
  max?: number | null;
  min?: number;
  disabled?: boolean;
  className?: string;
  id?: string;
  'aria-label'?: string;
  /** Show toast when blur clamps to max (default true). */
  notifyOnClamp?: boolean;
};

function formatDraft(value: number): string {
  return value > 0 ? String(value) : '';
}

function parseDraft(raw: string, min: number): number {
  const trimmed = raw.trim();
  if (!trimmed) return 0;
  const parsed = Number.parseInt(trimmed, 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(min, parsed);
}

export function FlexibleQuantityInput({
  value,
  onChange,
  max = null,
  min = 0,
  disabled,
  className,
  id,
  'aria-label': ariaLabel,
  notifyOnClamp = true,
}: Props) {
  const [draft, setDraft] = React.useState(() => formatDraft(value));
  const focusedRef = React.useRef(false);

  React.useEffect(() => {
    if (!focusedRef.current) {
      setDraft(formatDraft(value));
    }
  }, [value]);

  function commitDraft(raw: string) {
    let next = parseDraft(raw, min);
    if (max != null && next > max) {
      if (notifyOnClamp) {
        toast.error(`الكمية المتاحة في الموقع ${max} — لا يمكن الصرف بالسالب.`);
      }
      next = max;
    }
    setDraft(formatDraft(next));
    if (next !== value) onChange(next);
  }

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      dir="ltr"
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn('h-9 w-28 tabular-nums', className)}
      value={draft}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onChange={(event) => {
        setDraft(event.target.value.replace(/[^\d]/g, ''));
      }}
      onBlur={() => {
        focusedRef.current = false;
        commitDraft(draft);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.currentTarget.blur();
        }
      }}
    />
  );
}

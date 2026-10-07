'use client';

import * as React from 'react';
import { Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
  /**
   * Big − / + buttons around the field (phones): one tap per unit, the same
   * limits as typing.
   */
  stepper?: boolean;
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
  stepper = false,
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

  function step(delta: number) {
    commitDraft(String(Math.max(min, value + delta)));
  }

  const input = (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      dir="ltr"
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn('h-9 min-w-[5rem] tabular-nums', className)}
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

  if (!stepper) return input;
  const atMax = max != null && value >= max;
  return (
    <div className="flex items-center gap-1.5" dir="ltr">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-11 w-11 shrink-0 rounded-xl"
        disabled={disabled || value <= min}
        aria-label="إنقاص"
        onClick={() => step(-1)}
      >
        <Minus className="h-4 w-4" />
      </Button>
      {input}
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-11 w-11 shrink-0 rounded-xl"
        disabled={disabled || atMax}
        aria-label="زيادة"
        onClick={() => step(1)}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

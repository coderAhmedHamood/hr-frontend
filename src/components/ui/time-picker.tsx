'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '@/shared/utils';

function pad(n: number) { return String(n).padStart(2, '0'); }

function parseTime(value: string): { h: number; m: number } {
  const [h = 0, m = 0] = value.split(':').map(Number);
  return { h: Math.min(23, Math.max(0, h)), m: Math.min(59, Math.max(0, m)) };
}

const HOURS   = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

const ITEM_H  = 34;
const VISIBLE = 5;
const DRUM_H  = ITEM_H * VISIBLE;
const PADDING = ITEM_H * Math.floor(VISIBLE / 2);
const WHEEL_THROTTLE_MS = 160; // slow down scroll

// ─── Drum column ──────────────────────────────────────────────────────────────

function DrumColumn({ items, selected, onSelect, label, inputMax }: {
  items: number[];
  selected: number;
  onSelect: (v: number) => void;
  label: string;
  inputMax: number;
}) {
  const listRef      = React.useRef<HTMLDivElement>(null);
  const initRef      = React.useRef(false);
  const timerRef     = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastWheelRef = React.useRef(0);
  const [draft, setDraft]     = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [editVal, setEditVal] = React.useState('');
  const editInputRef = React.useRef<HTMLInputElement>(null);

  // Scroll to selected on mount / external change (skip while user is typing a partial draft)
  React.useEffect(() => {
    const el = listRef.current;
    if (!el || draft !== null) return;
    const desired = selected * ITEM_H;
    if (!initRef.current) { el.scrollTop = desired; initRef.current = true; }
    else if (Math.abs(el.scrollTop - desired) > ITEM_H / 2) {
      el.scrollTo({ top: desired, behavior: 'smooth' });
    }
  }, [selected, draft]);

  React.useEffect(() => {
    if (editing && editInputRef.current) editInputRef.current.focus();
  }, [editing]);

  // Snap on scroll-end (disabled while typing digits so scroll-end does not overwrite partial input)
  const handleScroll = () => {
    if (draft !== null) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const el = listRef.current;
      if (!el || draft !== null) return;
      const idx = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / ITEM_H)));
      if (items[idx] !== selected) onSelect(items[idx]);
    }, 80);
  };

  // Mouse wheel — throttled to one step per WHEEL_THROTTLE_MS
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (draft !== null) setDraft(null);
    const now = Date.now();
    if (now - lastWheelRef.current < WHEEL_THROTTLE_MS) return;
    lastWheelRef.current = now;
    const dir = e.deltaY > 0 ? 1 : -1;
    const next = Math.max(0, Math.min(items.length - 1, selected + dir));
    onSelect(items[next]);
    listRef.current?.scrollTo({ top: next * ITEM_H, behavior: 'smooth' });
  };

  const commitEdit = (raw: string) => {
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num >= 0 && num <= inputMax) {
      onSelect(num);
      listRef.current?.scrollTo({ top: num * ITEM_H, behavior: 'smooth' });
    }
    setEditing(false);
    setEditVal('');
  };

  const commitNumeric = (n: number) => {
    const clamped = Math.min(inputMax, Math.max(0, n));
    onSelect(clamped);
    listRef.current?.scrollTo({ top: clamped * ITEM_H, behavior: 'smooth' });
    setDraft(null);
  };

  // Keyboard: arrows/wheel move immediately; digits accumulate and only commit when unambiguous
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setDraft(null);
      return;
    }
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (draft !== null && draft.length > 0) {
        const shorter = draft.slice(0, -1);
        setDraft(shorter.length > 0 ? shorter : null);
      }
      return;
    }
    if (e.key === 'Enter' && draft !== null && draft.length > 0) {
      e.preventDefault();
      commitNumeric(parseInt(draft, 10));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setDraft(null);
      const n = Math.max(0, selected - 1);
      onSelect(n);
      listRef.current?.scrollTo({ top: n * ITEM_H, behavior: 'smooth' });
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setDraft(null);
      const n = Math.min(items.length - 1, selected + 1);
      onSelect(n);
      listRef.current?.scrollTo({ top: n * ITEM_H, behavior: 'smooth' });
      return;
    }
    if (!/^\d$/.test(e.key)) return;
    e.preventDefault();

    const next = draft === null ? e.key : draft + e.key;
    if (next.length > 2) {
      commitNumeric(parseInt(e.key, 10));
      return;
    }

    const num = parseInt(next, 10);
    if (Number.isNaN(num)) return;

    if (next.length === 2) {
      commitNumeric(num);
      return;
    }

    // Single digit: commit only if no valid two-digit number can start with this digit
    if (num * 10 > inputMax) {
      commitNumeric(num);
      return;
    }

    setDraft(next);
    const el = listRef.current;
    if (el) el.scrollTop = num * ITEM_H;
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/40">{label}</span>

      <div
        tabIndex={0}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
        className="relative cursor-ns-resize rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ width: '3rem', height: `${DRUM_H}px` }}
      >
        {/* Selection highlight */}
        <div
          className="pointer-events-none absolute inset-x-0 z-10 rounded-lg bg-primary/10 ring-1 ring-primary/25"
          style={{ top: `${PADDING}px`, height: `${ITEM_H}px` }}
        />
        {/* Top cylinder fade */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10"
          style={{ height: `${PADDING}px`, background: 'linear-gradient(to bottom, var(--popover) 10%, transparent 100%)' }}
        />
        {/* Bottom cylinder fade */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10"
          style={{ height: `${PADDING}px`, background: 'linear-gradient(to top, var(--popover) 10%, transparent 100%)' }}
        />

        {/* Scroll list */}
        <div
          ref={listRef}
          onScroll={handleScroll}
          style={{
            height: `${DRUM_H}px`,
            scrollSnapType: 'y mandatory',
            overflowY: 'scroll',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          } as React.CSSProperties}
          className="[&::-webkit-scrollbar]:hidden"
        >
          <div style={{ height: `${PADDING}px` }} />

          {items.map((v) => {
            const dist    = Math.abs(v - selected);
            const opacity = dist === 0 ? 1 : dist === 1 ? 0.5 : dist === 2 ? 0.2 : 0.08;
            const scale   = dist === 0 ? 1 : dist === 1 ? 0.88 : 0.76;
            const isSelected = v === selected;

            return (
              <div
                key={v}
                onClick={() => {
                  if (isSelected) {
                    // Click on already-selected → open inline edit
                    setEditing(true);
                    setEditVal(pad(v));
                  } else {
                    onSelect(v);
                    listRef.current?.scrollTo({ top: v * ITEM_H, behavior: 'smooth' });
                  }
                }}
                style={{ height: `${ITEM_H}px`, scrollSnapAlign: 'center', opacity, transform: `scale(${scale})`, transition: 'opacity .12s, transform .12s' }}
                className={cn(
                  'flex cursor-pointer items-center justify-center font-mono text-sm font-bold select-none',
                  isSelected ? 'text-primary' : 'text-foreground',
                )}
              >
                {isSelected && editing ? (
                  <input
                    ref={editInputRef}
                    className="w-9 bg-transparent text-center font-mono text-sm font-bold text-primary outline-none"
                    value={editVal}
                    maxLength={2}
                    onChange={(e) => setEditVal(e.target.value.replace(/\D/g, ''))}
                    onBlur={() => commitEdit(editVal)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); commitEdit(editVal); }
                      if (e.key === 'Escape') { setEditing(false); setEditVal(''); }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  isSelected && draft !== null ? draft : pad(v)
                )}
              </div>
            );
          })}

          <div style={{ height: `${PADDING}px` }} />
        </div>
      </div>
    </div>
  );
}

// ─── TimePicker ───────────────────────────────────────────────────────────────

interface TimePickerProps {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function TimePicker({ value, onChange, className, placeholder = '--:--', disabled }: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const { h, m } = parseTime(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-11 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2',
            'font-mono text-base font-semibold tracking-widest',
            'transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <span>{value || placeholder}</span>
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground/50" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto overflow-hidden rounded-2xl border border-border bg-popover p-0 shadow-elevated"
        align="start"
        side="bottom"
        sideOffset={4}
      >
        {/* Live display */}
        <div className="border-b border-border/40 py-2.5 text-center font-mono text-lg font-bold tracking-widest text-foreground">
          {pad(h)}<span className="mx-0.5 text-primary/50">:</span>{pad(m)}
        </div>

        {/* Drums */}
        <div className="flex items-center gap-1 px-3 py-2">
          <DrumColumn
            items={HOURS}
            selected={h}
            onSelect={(v) => onChange(`${pad(v)}:${pad(m)}`)}
            label="ساعة"
            inputMax={23}
          />
          <div className="self-center pb-4 px-0.5 text-base font-bold text-muted-foreground/25">:</div>
          <DrumColumn
            items={MINUTES}
            selected={m}
            onSelect={(v) => onChange(`${pad(h)}:${pad(v)}`)}
            label="دقيقة"
            inputMax={59}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

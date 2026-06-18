import { cn } from '@/shared/utils';

/** Design-token status / badge pill classes — use instead of raw Tailwind palette colors. */
export const STATUS_PILL = {
  pending: 'border-gold/30 bg-gold/10 text-gold',
  approved: 'border-success/30 bg-success/10 text-success',
  rejected: 'border-destructive/30 bg-destructive/10 text-destructive',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  info: 'border-primary/30 bg-primary/10 text-primary',
  muted: 'border-border bg-muted/40 text-muted-foreground',
  active: 'border-success/30 bg-success/10 text-success',
  inactive: 'border-border bg-muted text-muted-foreground',
  calculated: 'border-primary/25 bg-primary/5 text-primary',
  cancelled: 'border-border bg-muted/30 text-muted-foreground',
  gold: 'border-gold/30 bg-gold/10 text-gold',
} as const;

export type StatusPillTone = keyof typeof STATUS_PILL;

export function statusPillClass(tone: StatusPillTone, className?: string) {
  return cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium', STATUS_PILL[tone], className);
}

export function statusDotClass(tone: StatusPillTone) {
  const dots: Record<StatusPillTone, string> = {
    pending: 'bg-gold',
    approved: 'bg-success',
    rejected: 'bg-destructive',
    warning: 'bg-warning',
    info: 'bg-primary',
    muted: 'bg-muted-foreground',
    active: 'bg-success',
    inactive: 'bg-muted-foreground',
    calculated: 'bg-primary',
    cancelled: 'bg-muted-foreground',
    gold: 'bg-gold',
  };
  return dots[tone];
}

const TAB_SHELL =
  'discipline-tab-trigger shrink-0 gap-1 px-3 text-[11px] transition-all duration-150 border border-transparent';

const TAB_ACTIVE =
  'data-[state=active]:!font-semibold data-[state=active]:!shadow-md data-[state=active]:ring-2 data-[state=active]:ring-offset-2 data-[state=active]:ring-offset-background data-[state=active]:border data-[state=active]:z-[1]';

type FilterTabTone = 'muted' | 'primary' | 'accent' | 'success' | 'gold' | 'warning' | 'destructive';

export type { FilterTabTone };

const FILTER_TAB_IDLE: Record<FilterTabTone, string> = {
  muted: 'bg-muted/70 text-muted-foreground',
  primary: 'bg-primary/8 text-primary',
  accent: 'bg-accent/50 text-accent-foreground',
  success: 'bg-success/8 text-success',
  gold: 'bg-gold/10 text-gold',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/8 text-destructive',
};

const FILTER_TAB_ACTIVE: Record<FilterTabTone, string> = {
  muted:
    'data-[state=active]:!bg-card data-[state=active]:!text-foreground data-[state=active]:border-border data-[state=active]:ring-muted/40',
  primary:
    'data-[state=active]:!bg-primary/15 data-[state=active]:!text-primary data-[state=active]:border-primary/40 data-[state=active]:ring-primary/35',
  accent:
    'data-[state=active]:!bg-accent data-[state=active]:!text-accent-foreground data-[state=active]:border-border data-[state=active]:ring-primary/25',
  success:
    'data-[state=active]:!bg-success/15 data-[state=active]:!text-success data-[state=active]:border-success/40 data-[state=active]:ring-success/35',
  gold:
    'data-[state=active]:!bg-gold/15 data-[state=active]:!text-gold data-[state=active]:border-gold/40 data-[state=active]:ring-gold/35',
  warning:
    'data-[state=active]:!bg-warning/15 data-[state=active]:!text-warning data-[state=active]:border-warning/40 data-[state=active]:ring-warning/35',
  destructive:
    'data-[state=active]:!bg-destructive/12 data-[state=active]:!text-destructive data-[state=active]:border-destructive/35 data-[state=active]:ring-destructive/30',
};

export function filterTabTriggerClass(tone: FilterTabTone) {
  return cn(TAB_SHELL, FILTER_TAB_IDLE[tone], TAB_ACTIVE, FILTER_TAB_ACTIVE[tone]);
}

/** Rotating token tones for status filter pills (distinct but on-brand). */
export const STATUS_FILTER_TAB_TONES: FilterTabTone[] = [
  'primary',
  'success',
  'gold',
  'warning',
  'destructive',
  'accent',
  'primary',
  'muted',
];

export const STATUS_COUNT_BADGE =
  'me-1.5 rounded-md bg-background/80 px-1.5 py-0.5 font-mono text-[10px] tabular-nums group-data-[state=active]:bg-background group-data-[state=active]:shadow-sm';

import type { WeekDayIndex } from '@/features/hr/attendance/lib/types';

export const DAY_LABELS: Record<WeekDayIndex, string> = {
  0: 'الأحد',
  1: 'الإثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت',
};

export const WEEK_ORDER: WeekDayIndex[] = [6, 0, 1, 2, 3, 4, 5];

export const DEFAULT_REST: WeekDayIndex[] = [5, 6];

export const GROUP_COLORS = [
  {
    pill: 'bg-primary/10 text-primary border-primary/30',
    header: 'text-primary/80',
    add: 'text-primary hover:bg-primary/10',
    accent: 'border-s-primary/40',
    periodBg: ['bg-card', 'bg-primary/[0.03]'],
  },
  {
    pill: 'bg-accent/15 text-accent-foreground border-accent/30',
    header: 'text-accent-foreground/80',
    add: 'text-accent-foreground hover:bg-accent/20',
    accent: 'border-s-accent/50',
    periodBg: ['bg-card', 'bg-accent/[0.04]'],
  },
  {
    pill: 'bg-gold/10 text-gold border-gold/30',
    header: 'text-gold/90',
    add: 'text-gold hover:bg-gold/10',
    accent: 'border-s-gold/40',
    periodBg: ['bg-card', 'bg-gold/[0.04]'],
  },
] as const;

export const GROUP_LABELS = ['الجدول الأول', 'الجدول الثاني', 'الجدول الثالث'];

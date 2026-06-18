'use client';

import { Clock, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ShiftTemplate } from '@/features/hr/attendance/lib/types';
import { cn } from '@/shared/utils';
import { DAY_LABELS, WEEK_ORDER } from '@/features/hr/attendance/templates/constants/shift-templates-ui';
import { summarizeTemplate } from '@/features/hr/attendance/templates/utils/shift-template-helpers';

export function ShiftTemplateCard({
  t,
  onEdit,
  onDelete,
}: {
  t: ShiftTemplate;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated"
      onClick={onEdit}
    >
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Clock className="h-5 w-5" />
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
              t.isActive
                ? 'border-success/30 bg-success/10 text-success'
                : 'border-border bg-muted text-muted-foreground',
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', t.isActive ? 'bg-success' : 'bg-muted-foreground')} />
            {t.isActive ? 'نشط' : 'موقوف'}
          </span>
        </div>

        <h3 className="mb-1 font-display text-base font-bold leading-snug transition-colors group-hover:text-primary">
          {t.nameAr}
        </h3>
        <p className="mb-4 text-xs text-muted-foreground">{summarizeTemplate(t)}</p>

        <div className="mb-4 flex gap-1" dir="rtl">
          {WEEK_ORDER.map((day) => {
            const wd = t.weekDays.find((w) => w.day === day);
            return (
              <div
                key={day}
                title={DAY_LABELS[day]}
                className={cn(
                  'flex h-7 flex-1 items-center justify-center rounded px-0.5 text-[8px] font-bold leading-tight',
                  wd?.isRest ? 'bg-muted text-muted-foreground/40' : 'bg-primary/15 text-primary',
                )}
              >
                <span className="line-clamp-2 text-center">{DAY_LABELS[day]}</span>
              </div>
            );
          })}
        </div>

        <div
          className="flex items-center justify-end border-t border-border/60 pt-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" type="button" className="h-7 gap-1 px-2 text-xs" onClick={onEdit}>
              <Pencil className="h-3 w-3" /> تعديل
            </Button>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" /> حذف
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

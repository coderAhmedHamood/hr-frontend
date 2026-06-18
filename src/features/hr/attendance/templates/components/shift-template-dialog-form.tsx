'use client';

import * as React from 'react';
import { Plus, X, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { defaultShiftPeriod } from '@/features/hr/attendance/lib/defaults';
import type { ShiftPeriod, ShiftTemplate, WeekDayIndex } from '@/features/hr/attendance/lib/types';
import { genId } from '@/features/hr/attendance/lib/utils';
import { cn } from '@/shared/utils';
import {
  DAY_LABELS,
  GROUP_COLORS,
  GROUP_LABELS,
  WEEK_ORDER,
} from '@/features/hr/attendance/templates/constants/shift-templates-ui';
import { ShiftDayPill } from '@/features/hr/attendance/templates/components/shift-day-pill';
import { ShiftPeriodRow } from '@/features/hr/attendance/templates/components/shift-period-row';
import type { ShiftGroup } from '@/features/hr/attendance/templates/types/shift-template-editor';
import { initGroups } from '@/features/hr/attendance/templates/utils/shift-template-groups';
import { toMinutes } from '@/features/hr/attendance/templates/utils/shift-template-helpers';

export function ShiftTemplateDialogForm({
  draft,
  setDraft,
}: {
  draft: ShiftTemplate;
  setDraft: React.Dispatch<React.SetStateAction<ShiftTemplate | null>>;
}) {
  const [groups, setGroups] = React.useState<ShiftGroup[]>(() => initGroups(draft));
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(new Set());

  const workDays = WEEK_ORDER.filter((d) => !draft.weekDays.find((w) => w.day === d)?.isRest);

  const dayOwnerGroupId = React.useCallback(
    (day: WeekDayIndex) => groups.find((g) => g.days.includes(day))?.id ?? null,
    [groups],
  );

  const toggleDayInGroup = (day: WeekDayIndex, groupId: string) => {
    const ownerId = dayOwnerGroupId(day);
    if (ownerId === groupId) {
      setGroups((gs) =>
        gs.map((g) => (g.id === groupId ? { ...g, days: g.days.filter((d) => d !== day) } : g)),
      );
      return;
    }
    if (ownerId !== null) return;
    setGroups((gs) =>
      gs.map((g) => (g.id === groupId ? { ...g, days: [...g.days, day] } : g)),
    );
  };

  const toggleGroupCollapse = (id: string) =>
    setCollapsedGroups((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });

  React.useEffect(() => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        weekDays: prev.weekDays.map((wd) => {
          if (wd.isRest) return wd;
          const grp = groups.find((g) => g.days.includes(wd.day));
          if (!grp) return wd;
          return { ...wd, periods: grp.periods.map((p, i) => ({ ...p, id: wd.periods[i]?.id ?? genId('per') })) };
        }),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  const toggleDay = (day: WeekDayIndex) => {
    const currentlyRest = draft.weekDays.find((w) => w.day === day)?.isRest ?? true;
    if (!currentlyRest) {
      setGroups((gs) => gs.map((g) => ({ ...g, days: g.days.filter((d) => d !== day) })));
    } else {
      setGroups((gs) => (gs.length > 0 ? gs.map((g, i) => (i === 0 ? { ...g, days: [...g.days, day] } : g)) : gs));
    }
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        weekDays: prev.weekDays.map((w) => {
          if (w.day !== day) return w;
          const toRest = !w.isRest;
          const basePeriods = groups[0]?.periods ?? [defaultShiftPeriod(genId('per'))];
          return toRest
            ? { ...w, isRest: true, periods: [] }
            : { ...w, isRest: false, periods: basePeriods.map((p) => ({ ...p, id: genId('per') })) };
        }),
      };
    });
  };

  const updateGroupPeriod = (groupId: string, periodIdx: number, p: ShiftPeriod) =>
    setGroups((gs) =>
      gs.map((g) =>
        g.id === groupId ? { ...g, periods: g.periods.map((ex, i) => (i === periodIdx ? p : ex)) } : g,
      ),
    );

  const addPeriodToGroup = (groupId: string) =>
    setGroups((gs) =>
      gs.map((g) =>
        g.id === groupId ? { ...g, periods: [...g.periods, defaultShiftPeriod(genId('per'))] } : g,
      ),
    );

  const removePeriodFromGroup = (groupId: string, periodIdx: number) =>
    setGroups((gs) =>
      gs.map((g) =>
        g.id === groupId && g.periods.length > 1
          ? { ...g, periods: g.periods.filter((_, i) => i !== periodIdx) }
          : g,
      ),
    );

  const addGroup = () => {
    const newGrp: ShiftGroup = { id: genId('grp'), days: [], periods: [defaultShiftPeriod(genId('per'))] };
    setGroups((gs) => [...gs, newGrp]);
  };

  const removeGroup = (groupId: string) => {
    setGroups((gs) => {
      const removing = gs.find((g) => g.id === groupId);
      if (!removing) return gs;
      const remaining = gs.filter((g) => g.id !== groupId);
      if (remaining.length > 0 && removing.days.length > 0) {
        remaining[0] = { ...remaining[0], days: [...remaining[0].days, ...removing.days] };
      }
      return remaining;
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-1.5">
          <Label>اسم القالب</Label>
          <Input
            placeholder="مثال: دوام صباحي، دوام مسائي…"
            value={draft.nameAr}
            onChange={(e) => setDraft((d) => (d ? { ...d, nameAr: e.target.value } : d))}
          />
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border-2 border-border/60 px-3 py-2.5 transition-all hover:bg-muted/20">
          <span className="text-sm font-medium">نشط</span>
          <Switch checked={draft.isActive} onCheckedChange={(v) => setDraft((d) => (d ? { ...d, isActive: v } : d))} />
        </label>
      </div>

      <Separator />

      <div className="space-y-3">
        <p className="text-sm font-semibold">أيام العمل</p>
        <div className="flex gap-1.5" dir="rtl">
          {WEEK_ORDER.map((day) => {
            const wd = draft.weekDays.find((w) => w.day === day)!;
            return <ShiftDayPill key={day} day={day} isRest={wd.isRest} onClick={() => toggleDay(day)} />;
          })}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">جداول الدوام</p>
            <p className="text-[11px] text-muted-foreground">
              اختر الأيام لكل جدول — اليوم المحدّد في جدول يُعطَّل في الجداول الأخرى حتى تلغيه من جدوله
            </p>
          </div>
          {groups.length < 3 && (
            <button
              type="button"
              onClick={addGroup}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              إضافة جدول مختلف
            </button>
          )}
        </div>

        {groups.map((group, gi) => {
          const color = GROUP_COLORS[gi % GROUP_COLORS.length];
          const collapsed = collapsedGroups.has(group.id);
          const groupDur = group.periods.reduce((acc, p) => {
            const d = toMinutes(p.endTime) - toMinutes(p.startTime);
            return acc + (d > 0 ? d : 0);
          }, 0);
          const groupDurLabel =
            groupDur > 0 ? `${Math.floor(groupDur / 60)}س${groupDur % 60 > 0 ? ` ${groupDur % 60}د` : ''}` : '';

          return (
            <div key={group.id} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="flex w-full items-start gap-1 border-b border-border/60 bg-muted/20 pe-2">
                <button
                  type="button"
                  className="shrink-0 px-2 py-3 text-muted-foreground/60 transition-colors hover:text-muted-foreground"
                  onClick={() => toggleGroupCollapse(group.id)}
                  aria-label={collapsed ? 'توسيع الجدول' : 'طي الجدول'}
                >
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 transition-transform duration-200',
                      collapsed && '-rotate-90',
                    )}
                  />
                </button>
                <div className="flex min-w-0 flex-1 flex-col gap-2 py-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn('text-[11px] font-semibold uppercase tracking-wide shrink-0', color.header)}>
                      {GROUP_LABELS[gi] ?? `الجدول ${gi + 1}`}
                    </span>
                    {groupDurLabel && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {groupDurLabel} إجمالي
                      </span>
                    )}
                    {group.days.length > 0 && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {group.days.length} {group.days.length === 1 ? 'يوم' : 'أيام'}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {workDays.map((d) => {
                      const ownerId = dayOwnerGroupId(d);
                      const isSelectedHere = ownerId === group.id;
                      const isTakenElsewhere = ownerId !== null && ownerId !== group.id;

                      return (
                        <button
                          key={d}
                          type="button"
                          disabled={isTakenElsewhere}
                          className={cn(
                            'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors',
                            isSelectedHere && color.pill,
                            !isSelectedHere &&
                              !isTakenElsewhere &&
                              'border-dashed border-border/50 bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-primary',
                            isTakenElsewhere &&
                              'cursor-not-allowed border-border/30 bg-muted/15 text-muted-foreground/35 opacity-60',
                          )}
                          title={
                            isSelectedHere
                              ? 'انقر لإلغاء تحديد هذا اليوم'
                              : isTakenElsewhere
                                ? `محدّد في ${GROUP_LABELS[groups.findIndex((g) => g.id === ownerId)] ?? 'جدول آخر'}`
                                : 'انقر لإضافة هذا اليوم لهذا الجدول'
                          }
                          onClick={() => toggleDayInGroup(d, group.id)}
                        >
                          {DAY_LABELS[d]}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {groups.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeGroup(group.id);
                    }}
                    className="shrink-0 rounded-full p-1 text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label="حذف الجدول"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {!collapsed && (
                <div>
                  <div className="divide-y divide-border/40">
                    {group.periods.map((period, pi) => (
                      <ShiftPeriodRow
                        key={period.id}
                        period={period}
                        index={pi}
                        total={group.periods.length}
                        accentClass={color.accent}
                        periodBgClass={color.periodBg[pi % color.periodBg.length]}
                        onRemove={() => removePeriodFromGroup(group.id, pi)}
                        onChange={(p) => updateGroupPeriod(group.id, pi, p)}
                      />
                    ))}
                  </div>

                  <div className="border-t border-border/40 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => addPeriodToGroup(group.id)}
                      className={cn(
                        'flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2 text-xs font-medium transition-colors',
                        'border-border/60 text-muted-foreground hover:border-border',
                        color.add,
                      )}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      إضافة فترة دوام أخرى
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

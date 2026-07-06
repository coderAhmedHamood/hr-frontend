'use client';

import * as React from 'react';
import {
  LogIn, LogOut, Coffee, AlertTriangle, Plus, Loader2,
  MapPin, Clock, Smartphone, Monitor, Fingerprint, Bot, Globe, Pencil, Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatTime } from '@/shared/utils';
import { STATUS_PILL, statusDotClass } from '@/shared/status-pill-classes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import ModernTimePicker from '@/components/ui/modern-time-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  dialogFormFooterClass,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ForbiddenState } from '@/components/shared/forbidden-state';
import { EmptyStateCard } from '@/components/shared/empty-state-card';
import { useAttendanceEventsModel } from '@/features/hr/attendance/events/hooks/useAttendanceEventsModel';
import { DirectoryPagedViews } from '@/components/ui/paged-list';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { attendanceEventsApi, type AttendanceEventResponseDto, type AttendanceEventType } from '@/features/hr/attendance/lib/api/attendance-events';

// ── helpers ───────────────────────────────────────────────────────────────────

const EVENT_TYPE_META: Record<AttendanceEventType, { label: string; icon: React.ElementType; color: string; dot: string }> = {
  check_in:    { label: 'دخول',           icon: LogIn,   color: STATUS_PILL.approved, dot: statusDotClass('approved') },
  check_out:   { label: 'خروج',           icon: LogOut,  color: STATUS_PILL.info,     dot: statusDotClass('info') },
  break_start: { label: 'بداية استراحة',  icon: Coffee,  color: STATUS_PILL.gold,     dot: statusDotClass('gold') },
  break_end:   { label: 'نهاية استراحة',  icon: Coffee,  color: STATUS_PILL.warning, dot: statusDotClass('warning') },
};

const SOURCE_META: Record<string, { label: string; icon: React.ElementType }> = {
  mobile_app:  { label: 'تطبيق الجوال', icon: Smartphone },
  web_portal:  { label: 'بوابة الويب',  icon: Globe      },
  kiosk:       { label: 'كشك',          icon: Monitor    },
  manual_hr:   { label: 'يدوي — HR',    icon: Pencil     },
  biometric:   { label: 'بصمة',         icon: Fingerprint},
  system:      { label: 'النظام',       icon: Bot        },
};

function fmtTime(iso: string) {
  return formatTime(iso);
}
function nowTimeLocal() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ── create dialog ──────────────────────────────────────────────────────────────

function CreateEventDialog({
  open, onOpenChange, employees, checkpoints, companyId, workDate, onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employees: { id: string; nameAr: string }[];
  checkpoints: { id: string; nameAr: string }[];
  companyId: string;
  workDate: string;
  onCreate: (p: Parameters<typeof attendanceEventsApi.create>[0]) => Promise<void>;
}) {
  const [employeeId, setEmployeeId] = React.useState('');
  const [eventType, setEventType] = React.useState<AttendanceEventType>('check_in');
  const [time, setTime] = React.useState(nowTimeLocal);
  const [date, setDate] = React.useState(workDate);
  const [checkInPointId, setCheckInPointId] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setEmployeeId(''); setEventType('check_in'); setTime(nowTimeLocal());
      setDate(workDate); setCheckInPointId(''); setNotes(''); setError(null);
    }
  }, [open, workDate]);

  const handleSave = async () => {
    if (!employeeId) { setError('اختر الموظف'); return; }
    if (!time) { setError('الوقت مطلوب'); return; }
    setSaving(true); setError(null);
    try {
      const [hh, mm] = time.split(':');
      const occurredAt = new Date(`${date}T${hh}:${mm}:00`).toISOString();
      await onCreate({
        companyId, employeeId, eventType, occurredAt, workDate: date,
        source: 'manual_hr',
        checkInPointId: checkInPointId || null,
        notes: notes.trim() || null,
      });
    } catch { setError('فشل تسجيل الحدث'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right font-display text-base">تسجيل حدث جديد</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">الموظف <span className="text-destructive">*</span></Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger className="h-10"><SelectValue placeholder="اختر موظفاً…" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.nameAr}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">تاريخ العمل <span className="text-destructive">*</span></Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10" dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">الوقت <span className="text-destructive">*</span></Label>
              <ModernTimePicker value={time} onChange={setTime} placeholder="اختر الوقت" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">نوع الحدث</Label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(EVENT_TYPE_META) as AttendanceEventType[]).map((t) => {
                const meta = EVENT_TYPE_META[t];
                const Icon = meta.icon;
                return (
                  <button key={t} type="button" onClick={() => setEventType(t)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all',
                      eventType === t
                        ? 'border-primary bg-primary/8 text-primary ring-1 ring-primary/30'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted/40',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />{meta.label}
                  </button>
                );
              })}
            </div>
          </div>
          {checkpoints.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">نقطة التسجيل (اختياري)</Label>
              <Select value={checkInPointId || '__none'} onValueChange={(v) => setCheckInPointId(v === '__none' ? '' : v)}>
                <SelectTrigger className="h-10"><SelectValue placeholder="بدون نقطة" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">بدون نقطة</SelectItem>
                  {checkpoints.map((c) => <SelectItem key={c.id} value={c.id}>{c.nameAr}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">ملاحظة (اختياري)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="سبب التسجيل اليدوي…" className="min-h-[56px] resize-none text-sm" />
          </div>
          {error && <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter className={dialogFormFooterClass}>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            تسجيل
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function useEventColumns(onDetail: (e: AttendanceEventResponseDto) => void) {
  return React.useMemo((): ColumnDef<AttendanceEventResponseDto>[] => [
    {
      key: 'employee',
      title: 'الموظف',
      render: (event) => (
        <div className={cn('flex items-center gap-2', event.isVoided && 'opacity-60')}>
          <span className="font-medium">{event.employeeNameAr}</span>
          {event.isVoided && <Badge variant="secondary" className="shrink-0 text-[9px]">ملغى</Badge>}
        </div>
      ),
    },
    {
      key: 'type',
      title: 'نوع الحدث',
      render: (event) => {
        const meta = EVENT_TYPE_META[event.eventType];
        const Icon = meta.icon;
        return (
          <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium', meta.color)}>
            <Icon className="h-3 w-3" />
            {meta.label}
          </span>
        );
      },
    },
    {
      key: 'time',
      title: 'الوقت',
      className: 'font-mono text-xs tabular-nums whitespace-nowrap',
      render: (event) => <span dir="ltr">{fmtTime(event.occurredAt)}</span>,
    },
    {
      key: 'source',
      title: 'المصدر',
      hideOnMobile: true,
      className: 'text-xs text-muted-foreground',
      render: (event) => {
        const srcMeta = SOURCE_META[event.source ?? ''] ?? { label: event.source ?? '—', icon: Clock };
        const SrcIcon = srcMeta.icon;
        return (
          <span className="inline-flex items-center gap-1">
            <SrcIcon className="h-3 w-3" />
            {srcMeta.label}
          </span>
        );
      },
    },
    {
      key: 'checkpoint',
      title: 'نقطة التسجيل',
      hideOnMobile: true,
      className: 'text-xs text-muted-foreground',
      render: (event) => event.checkInPointNameAr ? (
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3 shrink-0" />
          {event.checkInPointNameAr}
        </span>
      ) : '—',
    },
    {
      key: 'radius',
      title: 'النطاق',
      hideOnMobile: true,
      className: 'text-xs',
      render: (event) => event.withinRadius === null ? '—' : (
        <span className={event.withinRadius ? 'text-success' : 'text-destructive'}>
          {event.withinRadius ? '✓ داخل النطاق' : '✗ خارج النطاق'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'إجراءات',
      isActions: true,
      headerClassName: 'w-16',
      render: (event) => (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => onDetail(event)}
          title="تفاصيل"
        >
          <Eye className="h-3.5 w-3.5" />
          <span className="sr-only">تفاصيل</span>
        </Button>
      ),
    },
  ], [onDetail]);
}

// ── detail dialog ──────────────────────────────────────────────────────────────

function EventDetailDialog({
  event, onClose,
}: { event: AttendanceEventResponseDto | null; onClose: () => void }) {
  if (!event) return null;
  const meta = EVENT_TYPE_META[event.eventType];
  const Icon = meta.icon;
  const srcMeta = SOURCE_META[event.source ?? ''] ?? { label: event.source ?? '—', icon: Clock };

  const rows: [string, React.ReactNode][] = [
    ['نوع الحدث',     <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium', meta.color)}><Icon className="h-3 w-3" />{meta.label}</span>],
    ['تاريخ العمل',   <span dir="ltr">{event.workDate}</span>],
    ['الوقت الفعلي',  <span dir="ltr">{fmtTime(event.occurredAt)}</span>],
    ['المصدر',        (() => { const SrcIcon2 = srcMeta.icon; return <span className="flex items-center gap-1.5"><SrcIcon2 className="h-3.5 w-3.5 text-muted-foreground" />{srcMeta.label}</span>; })()],
    ['نقطة التسجيل',  event.checkInPointNameAr ?? '—'],
    ['داخل النطاق',   event.withinRadius === null ? '—' : event.withinRadius ? 'نعم ✓' : 'لا ✗'],
    ['الإحداثيات',    event.latitude && event.longitude ? <span dir="ltr">{parseFloat(event.latitude).toFixed(6)}, {parseFloat(event.longitude).toFixed(6)}</span> : '—'],
    ['المسافة',       event.distanceMeters !== null ? `${event.distanceMeters} م` : '—'],
    ['ملاحظة',        event.notes ?? '—'],
    ['الحالة',        event.isVoided ? <Badge variant="secondary">ملغى — {event.voidReason ?? ''}</Badge> : <Badge variant="success">نشط</Badge>],
  ];

  return (
    <Dialog open={!!event} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm border-border" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-base">تفاصيل الحدث</DialogTitle>
          <p className="text-xs text-muted-foreground">{event.employeeNameAr}</p>
        </DialogHeader>
        <div className="divide-y divide-border/50 py-1">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-3 py-2 text-sm">
              <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
              <span className="text-right text-xs font-medium">{value}</span>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── main panel ─────────────────────────────────────────────────────────────────

export function AttendanceEventsPanel() {
  const m = useAttendanceEventsModel();
  const openDetail = React.useCallback((event: AttendanceEventResponseDto) => {
    m.setDetailTarget(event);
  }, [m.setDetailTarget]);
  const columns = useEventColumns(openDetail);

  const groupEvents = React.useCallback((events: AttendanceEventResponseDto[]) => {
    const map = new Map<string, AttendanceEventResponseDto[]>();
    for (const e of events) {
      const k = e.workDate;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(e);
    }
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, []);

  if (m.accessDenied) {
    return <ForbiddenState title="لا تملك صلاحية الوصول لأحداث الحضور" />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {m.listError ? (
        <EmptyStateCard icon={AlertTriangle} title="تعذر التحميل" description={m.listError} />
      ) : (
        <DirectoryPagedViews
          items={m.events}
          serverPagination={m.pagination}
          loading={m.loading}
          resetDeps={[m.includeVoided]}
          empty={(
            <EmptyStateCard
              icon={Clock}
              title="لا توجد أحداث"
              description="لا توجد أحداث حضور في النطاق الزمني المحدد."
            >
              <Button variant="outline" size="sm" onClick={() => m.setCreateOpen(true)}>
                <Plus className="h-3.5 w-3.5 ml-1" /> تسجيل حدث
              </Button>
            </EmptyStateCard>
          )}
        >
          {(pageItems) => (
            <div className="space-y-4">
              {groupEvents(pageItems).map(([date, dayEvents]) => (
                <div key={date} className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
                  <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold" dir="ltr">{date}</span>
                      <Badge variant="subtle" className="number-ar text-[10px]">{dayEvents.length} حدث</Badge>
                    </div>
                    <div className="flex gap-2 text-[11px] text-muted-foreground">
                      {(Object.keys(EVENT_TYPE_META) as AttendanceEventType[]).map((t) => {
                        const count = dayEvents.filter((e) => e.eventType === t && !e.isVoided).length;
                        if (count === 0) return null;
                        const meta = EVENT_TYPE_META[t];
                        return (
                          <span key={t} className={cn('flex items-center gap-1 rounded-full border px-1.5 py-px text-[9px] font-medium', meta.color)}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
                            {meta.label} {count}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <DataTable
                    variant="directory"
                    alwaysShowTable
                    tableClassName="min-w-[720px]"
                    columns={columns}
                    data={dayEvents}
                    keyExtractor={(e) => e.id}
                    className="rounded-none border-0 shadow-none"
                    onRowClick={openDetail}
                  />
                </div>
              ))}
            </div>
          )}
        </DirectoryPagedViews>
      )}

      <CreateEventDialog
        open={m.createOpen}
        onOpenChange={m.setCreateOpen}
        employees={m.employees}
        checkpoints={m.checkpoints}
        companyId={m.companyId}
        workDate={m.from}
        onCreate={m.handleCreate}
      />

      <EventDetailDialog event={m.detailTarget} onClose={() => m.setDetailTarget(null)} />
    </div>
  );
}

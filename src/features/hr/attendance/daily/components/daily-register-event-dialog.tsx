'use client';

import * as React from 'react';
import { Plus, Loader2, LogIn, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, dialogFormFooterClass } from '@/components/ui/dialog';
import { attendanceEventsApi, type AttendanceEventResponseDto } from '@/features/hr/attendance/lib/api/attendance-events';

const REGISTERABLE_EVENT_TYPES = ['check_in', 'check_out'] as const;
type RegisterableEventType = (typeof REGISTERABLE_EVENT_TYPES)[number];

const REGISTER_EVENT_TYPE_META: Record<RegisterableEventType, { labelAr: string; icon: React.ElementType; color: string }> = {
  check_in:  { labelAr: 'تسجيل حضور',   icon: LogIn,  color: 'text-emerald-700 bg-emerald-500/15 border-emerald-500/30' },
  check_out: { labelAr: 'تسجيل انصراف', icon: LogOut, color: 'text-sky-700 bg-sky-500/15 border-sky-500/30' },
};

const REGISTER_SUCCESS_MSG: Record<RegisterableEventType, string> = {
  check_in:  'تم تسجيل الحضور بنجاح',
  check_out: 'تم تسجيل الانصراف بنجاح',
};

function nowTimeLocal() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employeeId: string;
  employeeName: string;
  workDate: string;
  companyId: string;
  onCreated?: (evt: AttendanceEventResponseDto) => void;
};

export function DailyRegisterEventDialog({ open, onOpenChange, employeeId, employeeName, workDate, companyId, onCreated }: Props) {
  const [eventType, setEventType] = React.useState<RegisterableEventType>('check_in');
  const [time, setTime] = React.useState(nowTimeLocal());
  const [notes, setNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) { setEventType('check_in'); setTime(nowTimeLocal()); setNotes(''); }
  }, [open]);

  const handleSave = async () => {
    if (!time) { toast.error('الوقت مطلوب'); return; }
    setSaving(true);
    try {
      const [hh, mm] = time.split(':');
      const occurredAt = new Date(`${workDate}T${hh}:${mm}:00`).toISOString();
      const res = await attendanceEventsApi.create({
        companyId,
        employeeId,
        eventType,
        occurredAt,
        workDate,
        source: 'manual_hr',
        notes: notes.trim() || null,
      });
      toast.success(REGISTER_SUCCESS_MSG[eventType]);
      onCreated?.(res);
      onOpenChange(false);
    } catch {
      toast.error('فشل تسجيل الحدث — تحقق من البيانات وأعد المحاولة');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-border" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right font-display text-base">تسجيل حدث حضور</DialogTitle>
          <p className="text-xs text-muted-foreground text-right">
            {employeeName} · <span dir="ltr">{workDate}</span>
          </p>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">نوع الحدث</Label>
            <div className="grid grid-cols-2 gap-2">
              {REGISTERABLE_EVENT_TYPES.map((t) => {
                const m = REGISTER_EVENT_TYPE_META[t];
                const Icon = m.icon;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEventType(t)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all',
                      eventType === t
                        ? 'border-primary bg-primary/8 text-primary shadow-sm ring-1 ring-primary/30'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted/40',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {m.labelAr}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              الوقت <span className="text-destructive">*</span>
            </Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-10 font-mono" dir="ltr" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">ملاحظة (اختياري)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="سبب التعديل اليدوي…"
              className="min-h-[56px] resize-none text-sm"
            />
          </div>
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

'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { EmployeePicker } from '@/components/ui/employee-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogFormFooterClass,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { attendanceDaySummariesApi } from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { useAuthStore } from '@/features/auth/lib/auth-store';

type EmployeeScope = 'all' | 'selected';

export type RecomputeDaySummariesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  defaultFrom: string;
  defaultTo: string;
  filterEmployeeIds: Set<string>;
  allEmployees: { id: string; name: string }[];
  onSuccess: () => void;
};

function defaultTimezoneOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

export function RecomputeDaySummariesDialog({
  open,
  onOpenChange,
  companyId,
  defaultFrom,
  defaultTo,
  filterEmployeeIds,
  allEmployees,
  onSuccess,
}: RecomputeDaySummariesDialogProps) {
  const [from, setFrom] = React.useState(defaultFrom);
  const [to, setTo] = React.useState(defaultTo);
  const [scope, setScope] = React.useState<EmployeeScope>('all');
  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());
  const [overwriteManualOverrides, setOverwriteManualOverrides] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const filterEmpKey = React.useMemo(
    () => [...filterEmployeeIds].sort().join(','),
    [filterEmployeeIds],
  );
  const initialEmpIds = React.useMemo(
    () => new Set(filterEmpKey ? filterEmpKey.split(',') : []),
    [filterEmpKey],
  );

  React.useEffect(() => {
    if (!open) return;
    setFrom(defaultFrom);
    setTo(defaultTo);
    setScope(initialEmpIds.size > 0 ? 'selected' : 'all');
    setSelectedEmpIds(new Set(initialEmpIds));
    setOverwriteManualOverrides(false);
  }, [open, defaultFrom, defaultTo, initialEmpIds]);

  const applyPageFilter = () => {
    if (filterEmployeeIds.size === 0) {
      toast.message('لا يوجد موظفون محددون في فلتر الصفحة.');
      return;
    }
    setScope('selected');
    setSelectedEmpIds(new Set(filterEmployeeIds));
  };

  const handleSubmit = async () => {
    if (!companyId) {
      toast.error('لم يتم تحديد الشركة.');
      return;
    }
    if (!from || !to) {
      toast.error('يرجى تحديد تاريخ البداية والنهاية.');
      return;
    }
    if (from > to) {
      toast.error('تاريخ البداية يجب أن يكون قبل تاريخ النهاية.');
      return;
    }
    if (scope === 'selected' && selectedEmpIds.size === 0) {
      toast.error('يرجى اختيار موظف واحد على الأقل، أو اختر «جميع الموظفين».');
      return;
    }

    const user = useAuthStore.getState().user;
    const computedBy = user?.email ?? user?.id ?? null;

    setSubmitting(true);
    try {
      const result = await attendanceDaySummariesApi.recompute({
        companyId,
        from,
        to,
        ...(scope === 'selected' ? { employeeIds: [...selectedEmpIds] } : {}),
        timezoneOffsetMinutes: defaultTimezoneOffsetMinutes(),
        overwriteManualOverrides,
        computedBy,
      });

      toast.success(
        `تمت إعادة الحساب: ${result.created} جديد، ${result.updated} محدّث، ${result.skipped} متخطّى — ${result.employees} موظف، ${result.totalDays} يوم.`,
      );
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      handleApiError(err, 'attendance/day-summaries/recompute');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden border-border p-0 sm:max-w-md">
        <div className="space-y-2 border-b border-border px-6 pb-4 pt-6">
          <DialogHeader className="space-y-2 text-right">
            <DialogTitle className="font-display text-lg">إعادة حساب ملخصات الحضور</DialogTitle>
            <DialogDescription>
              إعادة بناء ملخصات الأيام من أحداث الحضور والورديات ضمن النطاق الزمني المحدد.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-6 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="recompute-from">من</Label>
              <DatePickerInput id="recompute-from" value={from} onChange={setFrom} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recompute-to">إلى</Label>
              <DatePickerInput id="recompute-to" value={to} onChange={setTo} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>نطاق الموظفين</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as EmployeeScope)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الموظفين النشطين</SelectItem>
                <SelectItem value="selected">موظفون محددون</SelectItem>
              </SelectContent>
            </Select>
            {scope === 'selected' ? (
              <div className="space-y-2 pt-1">
                <EmployeePicker
                  variant="form"
                  selectionMode="target"
                  employees={allEmployees}
                  selected={selectedEmpIds}
                  onChange={setSelectedEmpIds}
                />
                {filterEmployeeIds.size > 0 ? (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs text-primary"
                    onClick={applyPageFilter}
                  >
                    استخدام فلتر الصفحة الحالي ({filterEmployeeIds.size})
                  </Button>
                ) : null}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                عند عدم تحديد موظفين، تُعاد حسابات كل موظف لديه تعيين وردية نشط في الشركة.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <div className="space-y-0.5 text-right">
              <Label htmlFor="recompute-overwrite" className="text-sm font-medium">
                استبدال التعديلات اليدوية
              </Label>
              <p className="text-xs text-muted-foreground">
                إعادة الكتابة فوق الملخصات التي تم تعديلها يدوياً.
              </p>
            </div>
            <Switch
              id="recompute-overwrite"
              checked={overwriteManualOverrides}
              onCheckedChange={setOverwriteManualOverrides}
            />
          </div>
        </div>

        <DialogFooter className={dialogFormFooterClass}>
          <Button type="button" onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            إعادة الحساب
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

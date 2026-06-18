'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { SingleDatePicker } from '@/components/ui/single-date-picker';
import type { LeaveTypeResponseDto } from '@/features/hr/leaves/lib/api/leave-types';
import type { ApiRequestType } from '@/features/hr/requests/lib/api/request-types';
import { leaveRequestsNewApi } from '@/features/hr/requests/lib/api/correction-requests';
import {
  loadLeaveRequestTypes,
  pickDefaultLeaveRequestTypeId,
} from '@/features/hr/requests/lib/load-leave-request-types';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';

function workingDaysBetween(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (!Number.isFinite(s) || !Number.isFinite(e) || e < s) return 0;
  return Math.max(1, Math.round((e - s) / 86400000) + 1);
}

export type EmployeeLeaveRequestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  employeeId: string;
  employeeName: string;
  leaveTypes: LeaveTypeResponseDto[];
  leaveRequestTypes: ApiRequestType[];
  presetLeaveTypeId?: string | null;
  onSuccess: () => void;
};

export function EmployeeLeaveRequestDialog({
  open,
  onOpenChange,
  companyId,
  employeeId,
  employeeName,
  leaveTypes,
  leaveRequestTypes,
  presetLeaveTypeId,
  onSuccess,
}: EmployeeLeaveRequestDialogProps) {
  const [requestTypeId, setRequestTypeId] = React.useState('');
  const [leaveTypeId, setLeaveTypeId] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [reasonAr, setReasonAr] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [resolvedRequestTypes, setResolvedRequestTypes] = React.useState<ApiRequestType[]>(leaveRequestTypes);

  const defaultLeaveTypeId = presetLeaveTypeId ?? leaveTypes[0]?.id ?? '';
  const resolvedRequestTypeId = requestTypeId || pickDefaultLeaveRequestTypeId(resolvedRequestTypes);

  React.useEffect(() => {
    setResolvedRequestTypes(leaveRequestTypes);
  }, [leaveRequestTypes]);

  React.useEffect(() => {
    if (!open || !companyId) return;
    let cancelled = false;
    void loadLeaveRequestTypes(companyId)
      .then((items) => {
        if (cancelled) return;
        setResolvedRequestTypes(items.length > 0 ? items : leaveRequestTypes);
      });
    return () => {
      cancelled = true;
    };
  }, [open, companyId, leaveRequestTypes]);

  React.useEffect(() => {
    if (!open) return;
    setLeaveTypeId(defaultLeaveTypeId);
    setStartDate('');
    setEndDate('');
    setReasonAr('');
    setError(null);
  }, [open, defaultLeaveTypeId]);

  React.useEffect(() => {
    if (!open) return;
    const next = pickDefaultLeaveRequestTypeId(resolvedRequestTypes);
    if (next) setRequestTypeId(next);
  }, [open, resolvedRequestTypes]);

  const submit = async () => {
    const userId = useAuthStore.getState().user?.id ?? '';
    setSubmitting(true);
    setError(null);
    try {
      await leaveRequestsNewApi.create({
        companyId,
        employeeId,
        requestTypeId: resolvedRequestTypeId,
        leaveTypeId,
        startDate,
        endDate,
        workingDays:
          startDate && endDate && startDate <= endDate
            ? workingDaysBetween(startDate, endDate)
            : undefined,
        reasonAr: reasonAr.trim(),
        createdBy: userId,
      });
      toast.success('تم تقديم طلب الإجازة');
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'employee-leave-request.create');
      setError(displayMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden border-border p-0">
        <div className="shrink-0 border-b border-border px-6 py-5">
          <DialogHeader className="text-right">
            <DialogTitle className="font-display text-xl">طلب إجازة</DialogTitle>
            <DialogDescription>
              تقديم طلب إجازة للموظف {employeeName}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="space-y-2">
            <Label>
              نوع الإجازة <span className="text-destructive">*</span>
            </Label>
            <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع الإجازة" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    لا توجد أنواع إجازة فعّالة
                  </SelectItem>
                ) : (
                  leaveTypes.map((lt) => (
                    <SelectItem key={lt.id} value={lt.id}>
                      {lt.nameAr}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>من</Label>
              <SingleDatePicker
                value={startDate || undefined}
                onChange={setStartDate}
                placeholder="تاريخ البداية"
              />
            </div>
            <div className="space-y-2">
              <Label>إلى</Label>
              <SingleDatePicker
                value={endDate || undefined}
                onChange={setEndDate}
                placeholder="تاريخ النهاية"
                min={startDate || undefined}
              />
            </div>
          </div>

          {startDate && endDate && startDate <= endDate ? (
            <p className="text-xs text-muted-foreground">
              المدة التقريبية: {workingDaysBetween(startDate, endDate)} يوم
            </p>
          ) : null}

          <div className="space-y-2">
            <Label>
              السبب <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={reasonAr}
              onChange={(e) => setReasonAr(e.target.value)}
              placeholder="سبب طلب الإجازة…"
              className="min-h-[72px] resize-none text-sm"
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter className={dialogFormFooterClass}>
          <Button type="button" onClick={() => void submit()} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            تقديم الطلب
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

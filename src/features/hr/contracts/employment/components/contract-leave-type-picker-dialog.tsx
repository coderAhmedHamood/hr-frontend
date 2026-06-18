'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import type { LeaveTypeResponseDto } from '@/features/hr/leaves/leave-types/lib/api/leave-types';
import { loadCompanyLeaveTypes } from '@/features/hr/leaves/lib/leave-types-utils';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { cn } from '@/shared/utils';

export type ContractLeaveTypePickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string | null;
  title: string;
  description: string;
  annualLeaveDays?: number | null;
  confirmLabel: string;
  onConfirm: (leaveTypeId: string) => Promise<void>;
};

export function ContractLeaveTypePickerDialog({
  open,
  onOpenChange,
  companyId,
  title,
  description,
  annualLeaveDays,
  confirmLabel,
  onConfirm,
}: ContractLeaveTypePickerDialogProps) {
  const [leaveTypes, setLeaveTypes] = React.useState<LeaveTypeResponseDto[]>([]);
  const [leaveTypeId, setLeaveTypeId] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !companyId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void loadCompanyLeaveTypes({ companyId, limit: 200, isActive: true })
      .then(({ items, defaultLeaveTypeId }) => {
        if (cancelled) return;
        setLeaveTypes(items);
        setLeaveTypeId(defaultLeaveTypeId ?? items[0]?.id ?? '');
      })
      .catch((err) => {
        if (cancelled) return;
        const { displayMessage } = handleApiError(err, 'contract-leave-type.load');
        setError(displayMessage);
        setLeaveTypes([]);
        setLeaveTypeId('');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, companyId]);

  const submit = async () => {
    if (!leaveTypeId) {
      setError('اختر نوع الإجازة');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(leaveTypeId);
      onOpenChange(false);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'contract-leave-type.confirm');
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
            <DialogTitle className="font-display text-xl">{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {annualLeaveDays != null && annualLeaveDays > 0 ? (
            <p className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              سيتم إضافة{' '}
              <span className="font-bold text-foreground">{annualLeaveDays}</span>{' '}
              يوم إلى رصيد نوع الإجازة المحدد.
            </p>
          ) : null}

          <div className="space-y-2">
            <Label>نوع الإجازة السنوية</Label>
            {loading ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري تحميل أنواع الإجازة…
              </p>
            ) : leaveTypes.length > 0 ? (
              <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الإجازة" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((lt) => (
                    <SelectItem key={lt.id} value={lt.id}>
                      {lt.nameAr}
                      {lt.code ? ` (${lt.code})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-destructive">
                لا توجد أنواع إجازة فعّالة — أضف نوعاً من إعدادات الإجازات أولاً.
              </p>
            )}
          </div>

          {error ? (
            <p className={cn('rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive')}>
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter className={dialogFormFooterClass}>
          <Button
            type="button"
            variant="luxe"
            disabled={submitting || loading || leaveTypes.length === 0}
            onClick={() => void submit()}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
          <Button type="button" variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

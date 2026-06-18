'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { TableRowActions } from '@/components/ui/table-cells';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import {
  buildPayslipDecisionNote,
  canSubmitPayslipEmployeeDecision,
  payslipsApi,
  type PayslipDecisionChannel,
  type PayslipResponseDto,
} from '@/features/hr/payroll/lib/api/payslips';

export type PayslipDecisionActor = {
  name: string;
  email?: string | null;
};

export function usePayslipEmployeeDecision(options: {
  channel: PayslipDecisionChannel;
  getActor: () => PayslipDecisionActor;
  onSuccess?: () => void | Promise<void>;
}) {
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectTarget, setRejectTarget] = React.useState<PayslipResponseDto | null>(null);
  const [rejectNote, setRejectNote] = React.useState('');

  const submit = React.useCallback(async (
    row: PayslipResponseDto,
    decision: 'accepted' | 'rejected',
    extraNote?: string,
  ) => {
    const actor = options.getActor();
    const note = buildPayslipDecisionNote(decision, {
      channel: options.channel,
      actorName: actor.name,
      actorEmail: actor.email,
      extraNote,
    });
    setBusyId(row.id);
    try {
      await payslipsApi.employeeDecision(row.id, {
        employeeId: row.employeeId,
        decision,
        note,
      });
      await options.onSuccess?.();
      toast.success(
        decision === 'accepted'
          ? 'تم تسجيل موافقة الموظف على القسيمة.'
          : 'تم تسجيل رفض الموظف للقسيمة.',
      );
    } catch (err) {
      handleApiError(err, 'payslips.employeeDecision');
    } finally {
      setBusyId(null);
    }
  }, [options]);

  const accept = React.useCallback((row: PayslipResponseDto) => {
    void submit(row, 'accepted');
  }, [submit]);

  const openReject = React.useCallback((row: PayslipResponseDto) => {
    setRejectTarget(row);
    setRejectNote('');
    setRejectOpen(true);
  }, []);

  const confirmReject = React.useCallback(async () => {
    if (!rejectTarget) return;
    await submit(rejectTarget, 'rejected', rejectNote.trim() || undefined);
    setRejectOpen(false);
    setRejectTarget(null);
  }, [rejectTarget, rejectNote, submit]);

  const rejectDialog = (
    <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>رفض القسيمة</DialogTitle>
          <DialogDescription>
            {rejectTarget
              ? `رفض مستحقات قسيمة ${rejectTarget.employeeNameAr} — يمكنك إضافة سبب اختياري.`
              : 'رفض مستحقات القسيمة'}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          placeholder="سبب الرفض (اختياري)"
          rows={3}
          className="resize-none"
        />
        <DialogFooter>
          <Button variant="destructive" disabled={busyId !== null} onClick={() => void confirmReject()}>
            تأكيد الرفض
          </Button>
          <Button variant="outline" onClick={() => setRejectOpen(false)}>إلغاء</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return {
    busyId,
    accept,
    openReject,
    rejectDialog,
    canDecide: canSubmitPayslipEmployeeDecision,
  };
}

export function PayslipRowDecisionActions({
  row,
  busy,
  onAccept,
  onReject,
}: {
  row: PayslipResponseDto;
  busy: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  if (!canSubmitPayslipEmployeeDecision(row)) return null;

  return (
    <TableRowActions
      primaryActions={[
        { label: 'موافقة', variant: 'success', onClick: onAccept, disabled: busy },
        { label: 'رفض', variant: 'destructive', onClick: onReject, disabled: busy },
      ]}
      menuItems={[]}
    />
  );
}

export function PayslipDetailDecisionFooter({
  payslip,
  busy,
  onAccept,
  onReject,
}: {
  payslip: PayslipResponseDto;
  busy: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  if (!canSubmitPayslipEmployeeDecision(payslip)) return null;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-4">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 border-destructive/40 text-destructive hover:bg-destructive/10"
        disabled={busy}
        onClick={onReject}
      >
        رفض المستحقات
      </Button>
      <Button
        type="button"
        size="sm"
        className="h-8 bg-success text-success-foreground hover:bg-success/90"
        disabled={busy}
        onClick={onAccept}
      >
        الموافقة على المستحقات
      </Button>
    </div>
  );
}

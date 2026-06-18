'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function EmploymentContractTerminateModal({
  open,
  reason,
  onReasonChange,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  reason: string;
  onReasonChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onCancel();
      }}
    >
      <DialogContent className="border-border sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>إنهاء العقد</DialogTitle>
          <DialogDescription>أدخل سبب الإنهاء المبكر ثم أكّد الإجراء.</DialogDescription>
        </DialogHeader>
        <Input value={reason} onChange={(e) => onReasonChange(e.target.value)} placeholder="سبب الإنهاء…" />
        <DialogFooter>
          <Button variant="destructive" onClick={onConfirm}>
            إنهاء العقد
          </Button>
          <Button variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import * as React from 'react';
import type { Employee } from '@/features/hr/organization/employees/types';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  rosePrepDialogBodyClass,
  rosePrepDialogContentClass,
  rosePrepDialogFooterClass,
  rosePrepDialogHeaderClass,
} from '@/features/hr/organization/employees/components/dialogs/rose-document-prep-shared';
import { todayIsoDate } from '@/features/hr/organization/employees/lib/rose-document-templates/format-document-dates';

export type SimpleClearanceWizardPayload = {
  reasonLines: string[];
  footerDateIso: string;
};

type Props = {
  open: boolean;
  employee: Employee;
  onCancel: () => void;
  onApply: (wizard: SimpleClearanceWizardPayload) => void;
};

export function EmployeeClearancePdfPrepDialog({
  open,
  employee,
  onCancel,
  onApply,
}: Props) {
  const [reasonText, setReasonText] = React.useState('');
  const [footerDateIso, setFooterDateIso] = React.useState(todayIsoDate);

  React.useEffect(() => {
    if (!open) return;
    setReasonText('');
    setFooterDateIso(todayIsoDate());
  }, [open, employee.id]);

  if (!open) return null;

  const handleApply = () => {
    const lines = reasonText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    onApply({
      reasonLines: lines.length > 0 ? lines : ['', '', ''],
      footerDateIso,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className={rosePrepDialogContentClass}>
        <DialogHeader className={rosePrepDialogHeaderClass}>
          <DialogTitle className="font-display">نموذج إخلاء طرف</DialogTitle>
          <DialogDescription className="sr-only">أدخل الأسباب ثم أنشئ المعاينة</DialogDescription>
          <p className="text-xs text-muted-foreground">
            الموظف: <span className="font-medium text-foreground">{employee.name}</span>
            {employee.nationalId ? (
              <>
                {' · '}
                هوية: <span className="font-mono text-foreground" dir="ltr">{employee.nationalId}</span>
              </>
            ) : null}
          </p>
        </DialogHeader>

        <div className={rosePrepDialogBodyClass}>
          <div className="space-y-1.5">
            <Label htmlFor="clr-reasons">الأسباب (سطر لكل سبب — اختياري)</Label>
            <Textarea
              id="clr-reasons"
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              rows={4}
              placeholder={'استقالة\nانتهاء العقد\n…'}
              className="resize-y text-right text-sm"
              dir="rtl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="clr-foot-date">التاريخ</Label>
            <DatePickerInput
              id="clr-foot-date"
              value={footerDateIso}
              onChange={(v) => setFooterDateIso(v || todayIsoDate())}
            />
          </div>
        </div>

        <DialogFooter className={rosePrepDialogFooterClass}>
          <Button type="button" variant="luxe" onClick={handleApply}>إنشاء معاينة PDF</Button>
          <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

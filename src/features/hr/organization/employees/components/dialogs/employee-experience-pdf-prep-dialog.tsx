'use client';

import * as React from 'react';
import type { Employee } from '@/features/hr/organization/employees/types';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export type ExperiencePdfMode = 'filled' | 'blank';

type Props = {
  open: boolean;
  employee: Employee;
  onCancel: () => void;
  onApply: (mode: ExperiencePdfMode) => void;
};

export function EmployeeExperiencePdfPrepDialog({ open, employee, onCancel, onApply }: Props) {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="space-y-1 border-b px-5 py-4 text-right">
          <DialogTitle className="font-display">بيانات شهادة الخبرة</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            الموظف: <span className="font-medium text-foreground">{employee.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-5 py-5 text-right">
          <p className="text-sm text-muted-foreground">
            اختر طريقة إنشاء الشهادة:
          </p>
          <Button
            type="button"
            variant="luxe"
            className="h-auto w-full justify-start whitespace-normal py-3 text-right"
            onClick={() => onApply('filled')}
          >
            <span className="flex w-full flex-col items-stretch gap-0.5 text-right">
              <span className="font-medium">تعبئة ببيانات الموظف</span>
              <span className="text-xs font-normal opacity-80">
                الاسم، الشركة، القسم، المنصب، وتواريخ الخدمة تُملأ تلقائياً
              </span>
            </span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-auto w-full justify-start whitespace-normal py-3 text-right"
            onClick={() => onApply('blank')}
          >
            <span className="flex w-full flex-col items-stretch gap-0.5 text-right">
              <span className="font-medium">نموذج فارغ للكتابة اليدوية</span>
              <span className="text-xs font-normal text-muted-foreground">
                بدون بيانات — حقول منقطة للتعبئة يدوياً بعد الطباعة
              </span>
            </span>
          </Button>
        </div>

        <DialogFooter className="border-t px-5 py-3 sm:justify-start">
          <Button type="button" variant="ghost" onClick={onCancel}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

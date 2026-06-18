'use client';

import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogFormFooterClass,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import type { AssignmentsPanelModel } from '@/features/hr/attendance/assignment/hooks/useAssignmentsPanelModel';

export function AssignmentsBatchDialog({ model }: { model: AssignmentsPanelModel }) {
  const {
    open,
    setOpen,
    dialogContentEl,
    setDialogContentEl,
    templateId,
    setTemplateId,
    effectiveFrom,
    setEffectiveFrom,
    selectedIds,
    setSelectedIds,
    activeTemplates,
    multiOptions,
    loadingUnassigned,
    submit,
  } = model;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        ref={setDialogContentEl}
        className="flex max-h-[92vh] flex-col gap-0  border-border p-0 sm:max-w-3xl"
      >
        <div className="shrink-0 space-y-2 border-b border-border px-6 pb-4 pt-6">
          <DialogHeader className="space-y-2 text-right">
            <DialogTitle className="font-display text-lg">ربط قالب بالموظفين</DialogTitle>
            <DialogDescription>
              اختر قالب الحضور وتاريخ التطبيق، ثم حدّد الموظفين غير المرتبطين بدوام في هذا التاريخ.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            <Label>قالب الحضور</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="قالب" />
              </SelectTrigger>
              <SelectContent>
                {activeTemplates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nameAr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignment-effective-from">تاريخ التطبيق</Label>
            <DatePickerInput
              id="assignment-effective-from"
              value={effectiveFrom}
              onChange={setEffectiveFrom}
            />
          </div>
          <div className="flex gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
            <p>
              يظهر هنا الموظفون غير المرتبطين بأي دوام فعّال في تاريخ التطبيق فقط.
              الموظفون المرتبطون مسبقاً بشيفت لن يظهروا في القائمة — ألغِ ربطهم من شاشة التعديل إن أردت نقلهم إلى هذا القالب.
            </p>
          </div>
          <MultiSelect
            label="الموظفون"
            options={multiOptions}
            value={[...selectedIds]}
            onChange={(ids) => setSelectedIds(new Set(ids))}
            placeholder={loadingUnassigned ? 'جاري تحميل الموظفين…' : 'اختر موظفين…'}
            searchPlaceholder="بحث بالاسم أو الرقم…"
            emptyMessage={loadingUnassigned ? 'جاري التحميل…' : 'لا يوجد موظف غير مرتبط بدوام في هذا التاريخ'}
            selectAllLabel="تحديد الكل"
            deselectAllLabel="إلغاء التحديد"
            listMaxHeight="min(220px,36vh)"
            popoverPortalContainer={dialogContentEl}
          />
        </div>
        <DialogFooter className={dialogFormFooterClass}>
          <Button variant="luxe" type="button" onClick={submit} disabled={!templateId || selectedIds.size === 0}>
            تأكيد الربط
          </Button>
          <Button variant="outline" type="button" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

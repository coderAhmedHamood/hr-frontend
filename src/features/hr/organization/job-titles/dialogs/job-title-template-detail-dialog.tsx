'use client';

import { Briefcase, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { DetailField } from '@/components/shared/detail-field';
import type { JobTitleTemplateRecord } from '@/features/hr/organization/job-titles/services/job-titles.service';

type Props = {
  row: JobTitleTemplateRecord | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (row: JobTitleTemplateRecord) => void;
};

export function JobTitleTemplateDetailDialog({ row, onOpenChange, onEdit }: Props) {
  return (
    <Dialog open={!!row} onOpenChange={(v) => !v && onOpenChange(false)}>
      <DialogContent className="border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            {row?.titleAr}
          </DialogTitle>
        </DialogHeader>
        {row && (
          <div className="space-y-1 rounded-xl border border-border bg-muted/20 p-4 text-sm">
            {row.isActive ? (
              <Badge variant="outline" className="mb-2 text-[10px] border-success/40 text-success">نشط</Badge>
            ) : (
              <Badge variant="outline" className="mb-2 text-[10px] border-destructive/40 text-destructive">غير نشط</Badge>
            )}
            <DetailField label="الرمز" value={row.code} dir="ltr" />
            <DetailField label="الوصف" value={row.descriptionAr} />
            <DetailField label="ملاحظات" value={row.notes} />
            <DetailField label="آخر تحديث" value={new Date(row.updatedAt).toLocaleString('ar-SA')} dir="ltr" />
          </div>
        )}
        <DialogFooter>
          <Button
            onClick={() => {
              if (row) {
                const r = row;
                onOpenChange(false);
                onEdit(r);
              }
            }}
            className="gap-1.5"
          >
            <Pencil className="h-3.5 w-3.5" />
            تعديل
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

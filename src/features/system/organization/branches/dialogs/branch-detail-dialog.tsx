'use client';

import { Building2, Pencil } from 'lucide-react';
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
import type { BranchRow } from '@/features/system/organization/branches/constants/branches-directory';

type Props = {
  branch: BranchRow | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (b: BranchRow) => void;
};

export function BranchDetailDialog({ branch, onOpenChange, onEdit }: Props) {
  return (
    <Dialog open={!!branch} onOpenChange={(v) => !v && onOpenChange(false)}>
      <DialogContent className="sm:max-w-lg border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {branch?.name}
          </DialogTitle>
        </DialogHeader>
        {branch && (
          <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex flex-wrap gap-1 pb-1">
              {branch.isActive ? (
                <Badge variant="outline" className="text-[10px] border-success/40 text-success">نشط</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">غير نشط</Badge>
              )}
              {branch.isHeadquarters ? <Badge variant="secondary" className="text-[10px]">المقر الرئيسي</Badge> : null}
            </div>
            <DetailField label="الرمز" value={branch.code} dir="ltr" />
            <DetailField label="المدينة" value={branch.city} />
            <DetailField label="الحي" value={branch.district} />
            <DetailField label="العنوان" value={branch.address} />
            <DetailField label="الرمز البريدي" value={branch.postalCode} dir="ltr" />
            <DetailField label="المدير" value={branch.manager} />
            <DetailField label="البريد" value={branch.email} dir="ltr" />
            <DetailField label="الهاتف" value={branch.phone} dir="ltr" />
            <DetailField label="الجوال" value={branch.mobile} dir="ltr" />
            {(branch.latitude ?? branch.longitude) ? (
              <DetailField
                label="الإحداثيات"
                value={`${branch.latitude ?? '—'}, ${branch.longitude ?? '—'}`}
                dir="ltr"
              />
            ) : null}
            <DetailField label="ملاحظات" value={branch.notes} />
          </div>
        )}
        <DialogFooter>
          <Button
            onClick={() => {
              if (branch) {
                const b = branch;
                onOpenChange(false);
                onEdit(b);
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

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
import type { CompanyRow } from '@/features/hr/organization/companies/constants/companies-directory';
import type { CompaniesDirectoryModel } from '@/features/hr/organization/companies/hooks/useCompaniesDirectoryModel';

type Props = {
  row: CompanyRow | null;
  formatDate: CompaniesDirectoryModel['formatDate'];
  onOpenChange: (open: boolean) => void;
  onEdit: (row: CompanyRow) => void;
};

export function CompanyDetailDialog({ row, formatDate, onOpenChange, onEdit }: Props) {
  return (
    <Dialog open={!!row} onOpenChange={(v) => !v && onOpenChange(false)}>
      <DialogContent className="border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {row?.nameAr}
          </DialogTitle>
        </DialogHeader>
        {row && (
          <div className="max-h-[60vh] space-y-1 overflow-y-auto rounded-xl border border-border bg-muted/20 p-4 text-sm">
            {row.isActive ? (
              <Badge variant="outline" className="mb-2 text-[10px] border-success/40 text-success">نشط</Badge>
            ) : (
              <Badge variant="outline" className="mb-2 text-[10px] border-destructive/40 text-destructive">غير نشط</Badge>
            )}
            <DetailField label="الرمز" value={row.code} dir="ltr" />
            <DetailField label="السجل التجاري" value={row.commercialRegistrationNo} dir="ltr" />
            <DetailField label="الرقم الضريبي" value={row.taxNumber} dir="ltr" />
            <DetailField label="البريد" value={row.email} dir="ltr" />
            <DetailField label="الهاتف" value={row.phone} dir="ltr" />
            <DetailField label="الجوال" value={row.mobile} dir="ltr" />
            <DetailField label="الموقع" value={row.website} dir="ltr" />
            <DetailField label="الدولة" value={row.country} dir="ltr" />
            <DetailField label="المدينة" value={row.city} />
            <DetailField label="الحي" value={row.district} />
            <DetailField label="العنوان" value={row.address} />
            <DetailField label="الرمز البريدي" value={row.postalCode} dir="ltr" />
            <DetailField label="المنطقة الزمنية" value={row.timezone} dir="ltr" />
            <DetailField label="العملة" value={row.currencyCode} dir="ltr" />
            <DetailField label="اللغة" value={row.languageCode} dir="ltr" />
            <DetailField label="تاريخ الإنشاء" value={formatDate(row.createdAt)} dir="ltr" />
            <DetailField label="آخر تحديث" value={formatDate(row.updatedAt)} dir="ltr" />
            <DetailField label="ملاحظات" value={row.notes} />
          </div>
        )}
        <DialogFooter>
          <Button
            onClick={() => {
              if (row) {
                onOpenChange(false);
                onEdit(row);
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

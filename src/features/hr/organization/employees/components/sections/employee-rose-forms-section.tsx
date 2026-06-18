'use client';

import { Banknote, Eye, FileStack, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/features/hr/organization/employees/components/EmployeeProfilePrimitives';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';

export function EmployeeRoseFormsSection({ model }: { model: EmployeeProfileModel }) {
  const { openHrPdfPrep, openRoseTemplateSettings } = model;

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="absolute inset-0 bg-linear-to-bl from-primary/5 via-transparent to-gold/5" />
        <div className="relative p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 min-w-0">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <FileStack className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">نماذج روز للتجارة</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  معاينة وتحميل نماذج الموارد البشرية الرسمية للموظف
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 gap-1.5 text-xs"
              onClick={() => openRoseTemplateSettings('resignation')}
            >
              <Settings2 className="h-3.5 w-3.5" />
              إعدادات القوالب
            </Button>
          </div>
        </div>
      </div>

      <FieldGroup title="النماذج المتاحة" hint="معاينة ثم تحميل PDF">
        <div className="col-span-full grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button type="button" variant="outline" size="sm" className="h-9 w-full justify-center gap-2 text-xs" onClick={() => openHrPdfPrep('resignation')}>
            <Eye className="h-3.5 w-3.5 shrink-0" />
            نموذج استقالة
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-9 w-full justify-center gap-2 text-xs" onClick={() => openHrPdfPrep('clearance')}>
            <Eye className="h-3.5 w-3.5 shrink-0" />
            نموذج إخلاء طرف
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-9 w-full justify-center gap-2 text-xs" onClick={() => openHrPdfPrep('settlement')}>
            <Eye className="h-3.5 w-3.5 shrink-0" />
            مخالصة نهائية
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-9 w-full justify-center gap-2 text-xs" onClick={() => openHrPdfPrep('experience')}>
            <Eye className="h-3.5 w-3.5 shrink-0" />
            شهادة خبرة
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-9 w-full justify-center gap-2 text-xs sm:col-span-2" onClick={() => openHrPdfPrep('cash-receipt')}>
            <Banknote className="h-3.5 w-3.5 shrink-0" />
            سند استلام نقدي للراتب
          </Button>
        </div>
      </FieldGroup>
    </section>
  );
}

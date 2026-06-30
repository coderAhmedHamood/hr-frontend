'use client';

import { Banknote, Eye, FileStack, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/utils';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';

const FORM_ACTIONS = [
  { key: 'resignation' as const, label: 'نموذج استقالة', icon: Eye },
  { key: 'clearance' as const, label: 'نموذج إخلاء طرف', icon: Eye },
  { key: 'settlement' as const, label: 'مخالصة نهائية', icon: Eye },
  { key: 'experience' as const, label: 'شهادة خبرة', icon: Eye },
  { key: 'cash-receipt' as const, label: 'سند استلام نقدي للراتب', icon: Banknote, wide: true },
] satisfies Array<{
  key: 'resignation' | 'clearance' | 'settlement' | 'experience' | 'cash-receipt';
  label: string;
  icon: typeof Eye;
  wide?: boolean;
}>;

export function EmployeeRoseFormsSection({ model }: { model: EmployeeProfileModel }) {
  const { openHrPdfPrep, openRoseTemplateSettings } = model;

  return (
    <section className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft">
        <div className="pointer-events-none absolute inset-0 dotted-bg opacity-25" aria-hidden />
        <div className="relative p-5 sm:p-6 space-y-5">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <FileStack className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  النماذج الرسمية
                </h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-2xl">
                  معاينة وتحميل نماذج الموارد البشرية المعتمدة للموظف — استقالة، إخلاء طرف، مخالصة،
                  شهادة خبرة، وسند استلام الراتب.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 w-full shrink-0 gap-2 text-xs sm:w-auto sm:self-start"
              onClick={() => openRoseTemplateSettings('resignation')}
            >
              <Settings2 className="h-4 w-4 shrink-0" />
              إعدادات القوالب
            </Button>
          </div>

          <div className="h-px bg-border/70" />

          {/* Forms grid */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3">النماذج المتاحة</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {FORM_ACTIONS.map(({ key, label, icon: Icon, wide }) => (
                <Button
                  key={key}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-10 w-full justify-start gap-2.5 px-3 text-xs font-medium',
                    wide && 'sm:col-span-2',
                  )}
                  onClick={() => openHrPdfPrep(key)}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/40">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </span>
                  <span className="truncate">{label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

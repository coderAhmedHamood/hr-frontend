'use client';

import * as React from 'react';
import {
  Award,
  Banknote,
  ClipboardCheck,
  FileSignature,
  FileStack,
  LogOut,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/shared/utils';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';
import { EmployeeExperienceCertificatesPanel } from '@/features/hr/organization/employees/components/sections/employee-experience-certificates-panel';
import { EmployeeClearancesPanel } from '@/features/hr/organization/employees/components/sections/employee-clearances-panel';
import { EmployeeResignationsPanel } from '@/features/hr/organization/employees/components/sections/employee-resignations-panel';
import { EmployeeCashReceiptVouchersPanel } from '@/features/hr/organization/employees/components/sections/employee-cash-receipt-vouchers-panel';
import { EmployeeSettlementsPanel } from '@/features/hr/organization/employees/components/sections/employee-settlements-panel';
import { EmployeeMobileCircularPanel } from '@/features/hr/organization/employees/components/sections/employee-mobile-circular-panel';

type FormTabKey =
  | 'resignation'
  | 'clearance'
  | 'settlement'
  | 'experience'
  | 'cash-receipt'
  | 'mobile-circular';

const FORM_TABS = [
  {
    key: 'resignation' as const,
    shortLabel: 'استقالة',
    label: 'نموذج استقالة',
    description: 'طلب استقالة الموظف من العمل',
    icon: LogOut,
  },
  {
    key: 'clearance' as const,
    shortLabel: 'إخلاء طرف',
    label: 'نموذج إخلاء طرف',
    description: 'تأكيد عدم وجود التزامات متبادلة',
    icon: ClipboardCheck,
  },
  {
    key: 'settlement' as const,
    shortLabel: 'مخالصة',
    label: 'مخالصة نهائية',
    description: 'تسوية المستحقات المالية النهائية',
    icon: FileSignature,
  },
  {
    key: 'experience' as const,
    shortLabel: 'شهادة خبرة',
    label: 'شهادة خبرة',
    description: 'إثبات مدة وطبيعة الخبرة العملية',
    icon: Award,
  },
  {
    key: 'cash-receipt' as const,
    shortLabel: 'سند راتب',
    label: 'سند راتب',
    description: 'تأكيد راتب الشهر قبل الصرف',
    icon: Banknote,
  },
  {
    key: 'mobile-circular' as const,
    shortLabel: 'تعميم جوال',
    label: 'تعميم استخدام الجوال',
    description: 'سياسة استخدام الجوال والعقوبات مع تعهد الموظف',
    icon: Smartphone,
  },
] satisfies Array<{
  key: FormTabKey;
  shortLabel: string;
  label: string;
  description: string;
  icon: typeof Award;
}>;

export function EmployeeRoseFormsSection({ model }: { model: EmployeeProfileModel }) {
  const { employee, openHrPdfPrep } = model;
  const [activeTab, setActiveTab] = React.useState<FormTabKey>('resignation');

  return (
    <section className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft">
        <div className="pointer-events-none absolute inset-0 dotted-bg opacity-20" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px gold-accent-line" aria-hidden />
        <div className="relative p-5 sm:p-6 space-y-5">
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
                شهادة خبرة، سند الراتب، وتعميم استخدام الجوال.
              </p>
            </div>
          </div>

          <div
            className="grid grid-cols-2 gap-2.5 sm:grid-cols-3"
            role="tablist"
            aria-label="أنواع النماذج الرسمية"
          >
            {FORM_TABS.map((tab) => {
              const selected = activeTab === tab.key;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'group relative flex items-start gap-2.5 rounded-xl border p-3 text-start transition-all',
                    selected
                      ? 'border-primary/30 bg-primary/6 shadow-sm ring-1 ring-primary/15'
                      : 'border-border/70 bg-background hover:border-primary/20 hover:bg-muted/40',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors',
                      selected
                        ? 'border-primary/30 bg-primary text-primary-foreground'
                        : 'border-primary/15 bg-primary/10 text-primary group-hover:border-primary/25',
                    )}
                  >
                    <TabIcon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 pt-0.5">
                    <span
                      className={cn(
                        'block truncate text-xs font-semibold',
                        selected ? 'text-primary' : 'text-foreground/85',
                      )}
                    >
                      {tab.shortLabel}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] leading-relaxed text-muted-foreground">
                      {tab.description}
                    </span>
                  </span>
                  {selected ? (
                    <span
                      className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary"
                      aria-hidden
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            className="rounded-xl border border-border/70 bg-background/80 p-4 sm:p-5"
          >
            {activeTab === 'experience' ? (
              <EmployeeExperienceCertificatesPanel
                employee={employee}
                onOpenPdfPrep={() => openHrPdfPrep('experience')}
              />
            ) : activeTab === 'clearance' ? (
              <EmployeeClearancesPanel
                employee={employee}
                onOpenPdfPrep={() => openHrPdfPrep('clearance')}
              />
            ) : activeTab === 'resignation' ? (
              <EmployeeResignationsPanel
                employee={employee}
                onOpenPdfPrep={() => openHrPdfPrep('resignation')}
              />
            ) : activeTab === 'cash-receipt' ? (
              <EmployeeCashReceiptVouchersPanel employee={employee} />
            ) : activeTab === 'settlement' ? (
              <EmployeeSettlementsPanel
                employee={employee}
                onOpenPdfPrep={() => openHrPdfPrep('settlement')}
              />
            ) : (
              <EmployeeMobileCircularPanel
                employee={employee}
                onOpenPdfPrep={() => openHrPdfPrep('mobile-circular')}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

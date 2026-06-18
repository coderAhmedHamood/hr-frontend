'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle, Info } from 'lucide-react';
import { useHRConfigurationStore } from '@/features/hr/requests/lib/configuration-store';
import { hrRequestPath, HR_REQUEST_TYPE_ALL_DEPARTMENTS_ID } from '@/features/hr/requests/lib/types';

interface Props {
  params: Promise<{ department: string; requestType: string }>;
}

export default function DepartmentRequestTypePage({ params }: Props) {
  const { department, requestType } = React.use(params);
  const { getRequestTypeBySlugs } = useHRConfigurationStore();
  const result = getRequestTypeBySlugs(department, requestType);

  if (!result) {
    return (
      <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-destructive/50" />
        <p className="font-semibold text-destructive">نوع الطلب غير موجود</p>
        <p className="text-sm text-muted-foreground">
          لم يُعثر على نوع طلب بالمسار:{' '}
          <span dir="ltr" className="font-mono text-xs">
            {department}/{requestType}
          </span>
        </p>
        <Link href="/hr/requests/request-types" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          إدارة أنواع الطلبات →
        </Link>
      </div>
    );
  }

  const { dept, type: rt } = result;
  const activeSubtypes = rt.subtypes.filter((s) => s.isActive);

  return (
    <div className="space-y-6">
      <div className="space-y-2 rounded-xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
          {rt.departmentId === HR_REQUEST_TYPE_ALL_DEPARTMENTS_ID ? 'جميع الأقسام' : dept?.nameAr ?? department}
          <span className="text-muted-foreground/40">/</span>
          {rt.nameAr}
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight">{rt.nameAr}</h2>
      </div>

      <div className="flex gap-3 rounded-xl border border-primary/20 bg-primary/5 p-5">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="space-y-1">
          <p className="text-sm font-semibold">قائمة الطلبات قيد التطوير</p>
          <p className="text-sm text-muted-foreground">
            ستظهر هنا قائمة الطلبات المرتبطة بهذا النوع عند ربط النظام بواجهة برمجية (API).
          </p>
        </div>
      </div>

      {activeSubtypes.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold">الأنواع الفرعية المتاحة</p>
          <div className="flex flex-wrap gap-2">
            {activeSubtypes.map((sub) => (
              <span
                key={sub.id}
                title={hrRequestPath(department, sub.slug)}
                className="inline-flex cursor-default items-center rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium shadow-soft transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                {sub.nameAr}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { SetPageTitle } from '@/components/layouts/set-page-title';

const EMPLOYEE_DETAIL_PATH = /^\/hr\/organization\/employees\/[^/]+$/;

export default function OrganizationModuleLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEmployeeDetail = EMPLOYEE_DETAIL_PATH.test(pathname ?? '');

  if (isEmployeeDetail) {
    return (
      <div className="-m-4 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 animate-fade-in">
      <SetPageTitle
        titleAr="الهيكل الإداري"
        descriptionAr="سجل الموظفين"
        iconName="Users"
      />
      {children}
    </div>
  );
}

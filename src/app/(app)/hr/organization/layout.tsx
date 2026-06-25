'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { SetPageTitle } from '@/components/layouts/set-page-title';

const EMPLOYEE_DETAIL_PATH = /^\/hr\/organization\/employees\/[^/]+$/;
const ORGANIZATION_PAGES_PATH = /^\/hr\/organization\/pages(?:\/|$)/;

export default function OrganizationModuleLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEmployeeDetail = EMPLOYEE_DETAIL_PATH.test(pathname ?? '');
  const isPagesSection = ORGANIZATION_PAGES_PATH.test(pathname ?? '');

  if (isEmployeeDetail) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    );
  }

  if (isPagesSection) {
    return <>{children}</>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <SetPageTitle
        titleAr="الهيكل الإداري"
        descriptionAr="الموظفون، جهات الاتصال، المسميات، الفروع، الأقسام، والهيكل التنظيمي"
        iconName="Users"
      />
      {children}
    </div>
  );
}

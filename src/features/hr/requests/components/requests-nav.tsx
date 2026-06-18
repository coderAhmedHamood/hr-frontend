'use client';

import { ListChecks, ShieldCheck, CalendarClock, LayoutList, Banknote } from 'lucide-react';
import { SegmentedLinkTabs, type SegmentedLinkTab } from '@/components/shared/segmented-link-tabs';

const TABS: SegmentedLinkTab[] = [
  { href: '/hr/requests/attendance-corrections', label: 'تصحيح الحضور', icon: CalendarClock },
  { href: '/hr/requests/unified-management', label: 'إدارة طلبات الإجازات', icon: LayoutList, activeExact: true },
  { href: '/hr/requests/employee-advances', label: 'إدارة سلف الموظفين', icon: Banknote },
  { href: '/hr/requests/request-types', label: 'أنواع الطلبات', icon: ListChecks },
  { href: '/hr/requests/approval-assignment', label: 'إسناد الموافقة', icon: ShieldCheck },
];

export function RequestsNav() {
  return <SegmentedLinkTabs tabs={TABS} />;
}

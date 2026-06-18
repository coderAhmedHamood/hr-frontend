'use client';

import { ListChecks, CalendarDays, BarChart3, CirclePlus } from 'lucide-react';
import { SegmentedLinkTabs, type SegmentedLinkTab } from '@/components/shared/segmented-link-tabs';

const TABS: SegmentedLinkTab[] = [
  { href: '/hr/leaves/analytics', label: 'التحليلات', icon: BarChart3 },
  { href: '/hr/leaves/balance-credit', label: 'إضافة رصيد إجازات', icon: CirclePlus },
  { href: '/hr/leaves/leave-types', label: 'أنواع الإجازات', icon: ListChecks },
  { href: '/hr/leaves/public-holidays', label: 'العطل الرسمية', icon: CalendarDays },
];

export function LeavesNav() {
  return <SegmentedLinkTabs tabs={TABS} />;
}

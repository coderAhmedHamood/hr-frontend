import { notFound } from 'next/navigation';
import * as React from 'react';
import { LeaveTypesPanel } from '@/features/hr/leaves/leave-types/components/leave-types-panel';
import { PublicHolidaysPanel } from '@/features/hr/leaves/public-holidays/components/public-holidays-panel';
import { LEAVE_TYPES_SECTION_SLUG } from '@/features/hr/leaves/leave-types/constants/section-slug';
import { PUBLIC_HOLIDAYS_SECTION_SLUG } from '@/features/hr/leaves/public-holidays/constants/section-slug';

const LEAVE_APP_SECTION_SLUGS = [LEAVE_TYPES_SECTION_SLUG, PUBLIC_HOLIDAYS_SECTION_SLUG] as const;

const SECTIONS: Record<
  string,
  { title: string; description: string; Component: React.ComponentType }
> = {
  [LEAVE_TYPES_SECTION_SLUG]: {
    title: 'أنواع الإجازات',
    description: 'تعريف وإدارة أنواع الإجازات المتاحة في المنظمة.',
    Component: LeaveTypesPanel,
  },
  [PUBLIC_HOLIDAYS_SECTION_SLUG]: {
    title: 'العطل الرسمية',
    description: 'إدارة قائمة العطل الرسمية السنوية.',
    Component: PublicHolidaysPanel,
  },
};

interface Props {
  params: Promise<{ section: string }>;
}

export default async function LeaveSectionPage({ params }: Props) {
  const { section } = await params;
  const def = SECTIONS[section];
  if (!def) notFound();
  const { Component } = def;
  return <Component />;
}

export function generateStaticParams() {
  return LEAVE_APP_SECTION_SLUGS.map((section) => ({ section }));
}

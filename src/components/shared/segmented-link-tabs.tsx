'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/utils';

export type SegmentedLinkTab = {
  href: string;
  label: string;
  icon?: React.ElementType;
  /** عند التفعيل: يطابق المسار بالكامل فقط (مثل تجنّب تفعيل «إدارة الإجازات» عند فتح مسار فرعي). */
  activeExact?: boolean;
};

export function isSegmentedTabActive(pathname: string, tab: SegmentedLinkTab): boolean {
  if (tab.activeExact) return pathname === tab.href;
  return pathname === tab.href || pathname.startsWith(`${tab.href}/`);
}

export type SegmentedLinkTabsProps = {
  tabs: SegmentedLinkTab[];
  /** يُدمج مع غلاف التمرير الافتراضي */
  className?: string;
};

/**
 * شريط تبويبات أفقي موحّد (إجازات، طلبات، …) — نفس الشكل البصري في كل الوحدة.
 */
export function SegmentedLinkTabs({ tabs, className }: SegmentedLinkTabsProps) {
  const pathname = usePathname();
  return (
    <div
      className={cn(
        'flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/30 p-1',
        className,
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isSegmentedTabActive(pathname, tab);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex flex-1 min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
              active ? 'bg-background text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

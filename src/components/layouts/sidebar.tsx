'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard, Users, Clock, CalendarDays, ClipboardList,
  ShieldAlert, Wallet, BarChart3, Building2, Shield,
  LayoutGrid, MapPin, Link2, CalendarRange, Activity,
  ListChecks, ShieldCheck, LayoutList, CirclePlus, CalendarClock,
  ChevronDown, X, LifeBuoy, FileSpreadsheet, FileSignature,
  UserCircle, Briefcase, UserPlus, Bell, Send, Inbox, KeyRound,
} from 'lucide-react';
import { cn } from '@/shared/utils';
import { Logo } from '@/components/layouts/logo';
import { useSidebar } from '@/components/layouts/sidebar-context';
import { hrDisciplineNavGroups } from '@/features/hr/discipline/lib/types';
import { hrNotificationsNavGroups } from '@/features/hr/notifications/constants/nav';
import { hrPayrollNavGroups } from '@/features/hr/payroll/constants/nav';
import { hrContractsOnlyNavGroups } from '@/features/hr/contracts/constants/nav';
import { hrPayrollSectionHref } from '@/features/hr/payroll/constants/routes';
import { hrContractsSectionHref } from '@/features/hr/contracts/constants/routes';
import { hrPermissionsNavGroups } from '@/features/hr/permissions/constants/nav';

type MobileNavChild =
  | { label: string; href: string; icon?: React.ElementType; match?: 'exact' | 'prefix' }
  | { separator: true };

type MobileNavItem = {
  key: string;
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: MobileNavChild[];
};

const mobileNav: MobileNavItem[] = [
  { key: 'dashboard', label: 'الرئيسية', href: '/hr/dashboard', icon: LayoutDashboard },
  {
    key: 'employees', label: 'الهيكل الإداري', href: '/hr/organization/employees', icon: Users,
    children: [
      { label: 'سجل الموظفين', href: '/hr/organization/employees', icon: Users },
      { label: 'المستخدمين', href: '/hr/organization/contacts', icon: UserCircle },
      { label: 'المسميات الوظيفية', href: '/hr/organization/job-titles', icon: Briefcase },
      { label: 'الفروع', href: '/hr/organization/branches', icon: Building2 },
      { label: 'الأقسام', href: '/hr/organization/departments', icon: Building2 },
      { label: 'الهيكل التنظيمي', href: '/hr/organization/chart', icon: Building2 },
    ],
  },
  {
    key: 'recruitment', label: 'التوظيف', icon: UserPlus,
    children: [
      { label: 'إدارة الوظائف', href: '/hr/recruitment/ats-admin', icon: LayoutDashboard },
      { label: 'المتقدمون', href: '/hr/recruitment/ats-applicants', icon: Users },
      { label: 'مسار التوظيف', href: '/hr/recruitment/ats-pipeline', icon: ClipboardList },
    ],
  },
  {
    key: 'attendance', label: 'الحضور', icon: Clock,
    children: [
      { label: 'إدارة الحضور', href: '/hr/attendance/daily', icon: CalendarRange },
      { label: 'كشف الحضور ', href: '/hr/attendance/day-summaries', icon: ListChecks },
      { label: 'الأحداث', href: '/hr/attendance/events', icon: Activity },
      { separator: true },
      { label: 'ربط الشيفتات بالموظفين', href: '/hr/attendance/assignment', icon: ClipboardList },
      { label: 'ربط النقاط بالموظفين  ', href: '/hr/attendance/checkpoint-links', icon: Link2 },
      { separator: true },
      { label: 'قوالب الشفت', href: '/hr/attendance/templates', icon: LayoutGrid },
      { label: 'نقاط التسجيل', href: '/hr/attendance/checkpoints', icon: MapPin },
    ],
  },
  {
    key: 'leaves', label: 'الإجازات', icon: CalendarDays,
    children: [
      { label: 'التحليلات', href: '/hr/leaves/analytics', icon: BarChart3 },
      { label: 'إدارة طلبات الإجازات', href: '/hr/requests/unified-management', icon: LayoutList, match: 'exact' },
      { label: 'إضافة رصيد إجازات', href: '/hr/leaves/balance-credit', icon: CirclePlus },
      { label: 'أنواع الإجازات', href: '/hr/leaves/leave-types', icon: ListChecks },
      { label: 'العطل الرسمية', href: '/hr/leaves/public-holidays', icon: CalendarDays },
    ],
  },
  {
    key: 'requests', label: 'الطلبات', icon: ClipboardList,
    children: [
      { label: 'تصحيح الحضور', href: '/hr/requests/attendance-corrections', icon: CalendarClock },
      { label: 'إدارة طلبات الإجازات', href: '/hr/requests/unified-management', icon: LayoutList, match: 'exact' },
      { label: 'أنواع الطلبات', href: '/hr/requests/request-types', icon: ListChecks },
      { label: 'قوالب الموافقة', href: '/hr/requests/approval-assignment', icon: ShieldCheck },
    ],
  },
  {
    key: 'discipline', label: 'الانضباط الوظيفي', icon: ShieldAlert,
    children: hrDisciplineNavGroups.flatMap(g =>
      g.items.map(item => ({
        label: item.labelAr,
        href: `/hr/discipline/${item.slug}`,
      }))
    ),
  },
  {
    key: 'notifications',
    label: 'الإشعارات',
    icon: Bell,
    children: hrNotificationsNavGroups.flatMap((g) =>
      g.items.map((item) => ({
        label: item.labelAr,
        href: item.href,
        icon: item.icon,
      })),
    ),
  },
  {
    key: 'payroll', label: 'الرواتب', icon: Wallet,
    children: hrPayrollNavGroups.flatMap((g) =>
      g.items.map((item) => ({
        label: item.labelAr,
        href: hrPayrollSectionHref(item.slug),
        icon: item.icon,
      })),
    ),
  },
  {
    key: 'contracts', label: 'العقود', icon: FileSignature,
    children: hrContractsOnlyNavGroups.flatMap((g) =>
      g.items.map((item) => ({
        label: item.labelAr,
        href: hrContractsSectionHref(item.slug),
        icon: item.icon,
      })),
    ),
  },
  {
    key: 'permissions',
    label: 'الصلاحيات',
    icon: Shield,
    children: hrPermissionsNavGroups.flatMap((g) =>
      g.items.map((item) => ({
        label: item.labelAr,
        href: item.href,
        icon: item.icon,
      })),
    ),
  },
];

function MobileDrawer({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  // Auto-close on navigation
  const prevPath = React.useRef(pathname);
  React.useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  const toggle = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  function isChildMatch(href: string, match: 'exact' | 'prefix' = 'prefix') {
    const [base, qs] = href.split('?');
    if (qs) {
      const childParams = new URLSearchParams(qs);
      const currentParams = searchParams;
      for (const [k, v] of childParams.entries()) {
        if (currentParams.get(k) !== v) return false;
      }
      return pathname === base;
    }
    if (match === 'exact') return pathname === base;
    return pathname === base || pathname.startsWith(`${base}/`);
  }

  const isParentActive = (item: MobileNavItem) => {
    if (item.href) return pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (item.children) {
      return item.children.some((c) => {
        if ('separator' in c) return false;
        return isChildMatch(c.href, c.match ?? 'prefix');
      });
    }
    return false;
  };

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-sidebar-border/50 p-4">
        <div className="flex items-center gap-2.5">
          <Logo size={30} />
          <div className="flex flex-col leading-none">
            <span className="font-display text-base font-bold tracking-tight">روز</span>
            <span className="text-[9px] text-sidebar-foreground/60 tracking-[0.2em] uppercase">rose HR</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-colors hover:bg-sidebar-border/40 hover:text-sidebar-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {mobileNav.map(item => {
          const parentActive = isParentActive(item);
          const isExpanded = expanded.has(item.key) || parentActive;

          if (!item.children) {
            return (
              <Link
                key={item.key}
                href={item.href!}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  parentActive
                    ? 'bg-gold/15 text-gold'
                    : 'text-sidebar-foreground/75 hover:bg-sidebar-border/40 hover:text-sidebar-foreground',
                )}
              >
                {parentActive && (
                  <span className="absolute right-3 h-5 w-[3px] rounded-l-full bg-gold" />
                )}
                <item.icon className={cn('h-4 w-4 shrink-0', parentActive ? 'text-gold' : 'text-sidebar-foreground/50')} />
                {item.label}
              </Link>
            );
          }

          return (
            <div key={item.key}>
              <button
                type="button"
                onClick={() => toggle(item.key)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  parentActive
                    ? 'text-gold'
                    : 'text-sidebar-foreground/75 hover:bg-sidebar-border/40 hover:text-sidebar-foreground',
                )}
              >
                <item.icon className={cn('h-4 w-4 shrink-0', parentActive ? 'text-gold' : 'text-sidebar-foreground/50')} />
                <span className="flex-1 text-right">{item.label}</span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 opacity-50 transition-transform duration-150',
                    isExpanded && 'rotate-180',
                  )}
                />
              </button>

              {isExpanded && (
                <div className="mt-0.5 mb-1 space-y-0.5 pe-2 ps-6">
                  {item.children.map((child, idx) => {
                    if ('separator' in child) {
                      return <div key={`sep-${idx}`} className="my-1 border-t border-sidebar-border/30" />;
                    }
                    const ChildIcon = child.icon;
                    const childActive = isChildMatch(child.href, child.match ?? 'prefix');
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                          childActive
                            ? 'bg-gold/10 text-gold font-medium'
                            : 'text-sidebar-foreground/65 hover:bg-sidebar-border/30 hover:text-sidebar-foreground',
                        )}
                      >
                        {ChildIcon && <ChildIcon className="h-3.5 w-3.5 shrink-0 opacity-75" />}
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border/50 p-3">
        <Link
          href="/support"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 transition-colors hover:bg-sidebar-border/40 hover:text-sidebar-foreground"
        >
          <LifeBuoy className="h-4 w-4" />
          <span>الدعم الفني</span>
        </Link>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { open, setOpen } = useSidebar();
  const close = React.useCallback(() => setOpen(false), [setOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={close}
        aria-hidden="true"
      />

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-72 flex-col shadow-luxe transition-transform duration-300 ease-in-out lg:hidden',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <React.Suspense fallback={null}>
          <MobileDrawer onClose={close} />
        </React.Suspense>
      </aside>
    </>
  );
}

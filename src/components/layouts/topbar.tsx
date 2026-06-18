'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Bell, Moon, Sun, LogOut, Shield, Menu,
  LayoutDashboard, Users, Clock, CalendarDays, ClipboardList,
  ShieldAlert, Wallet, BarChart3, Building2, ChevronDown,
  LayoutGrid, MapPin, Link2, CalendarRange, Activity,
  ListChecks, ShieldCheck, LayoutList, CirclePlus, CalendarClock,
  Banknote, FileSignature, BookOpen, FileSpreadsheet, UserCircle, Briefcase, UserCheck, UserPlus,
  Coins, FileStack, Receipt, KeyRound, Settings,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSidebar } from '@/components/layouts/sidebar-context';
import { usePageTitle } from '@/components/layouts/page-title-context';
import { usePageHeaderActionsRegion } from '@/components/layouts/page-header-actions-context';
import { FilterTrigger } from '@/components/layouts/filter-panel';
import { Logo } from '@/components/layouts/logo';
import { NotificationBellPopover } from '@/features/hr/notifications/components/notification-bell-popover';
import { cn } from '@/shared/utils';
import { hrDisciplineNavGroups } from '@/features/hr/discipline/lib/types';
import { hrNotificationsNavGroups, isHrNotificationsNavPath } from '@/features/hr/notifications/constants/nav';
import { hrPayrollNavGroups, isHrPayrollNavPath } from '@/features/hr/payroll/constants/nav';
import { hrContractsOnlyNavGroups, isHrContractsOnlyNavPath } from '@/features/hr/contracts/constants/nav';
import { hrPayrollSectionHref } from '@/features/hr/payroll/constants/routes';
import { hrContractsSectionHref } from '@/features/hr/contracts/constants/routes';
import { hrPermissionsNavGroups, isHrPermissionsNavPath } from '@/features/hr/permissions/constants/nav';
import { useLogout } from '@/features/auth/hooks/use-logout';
import { useAuthUserDisplay } from '@/features/auth/hooks/use-auth-user-display';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getBranchAccessLabel } from '@/features/auth/types/access-profile';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';

/* ── Icon registry ────────────────────────────────────────────────────── */
export const PAGE_ICONS: Record<string, React.ElementType> = {
  LayoutDashboard, Users, Clock, CalendarDays, ClipboardList,
  ShieldAlert, Wallet, BarChart3, Building2, Settings,
  CalendarRange, Banknote, FileSignature, BookOpen, FileSpreadsheet, Bell,
  UserCircle, Briefcase, UserCheck, UserPlus,
  CalendarClock, LayoutList, ListChecks, ShieldCheck,
  Coins, FileStack, Receipt, KeyRound,
};

/* ── Nav data ──────────────────────────────────────────────────────────── */
type SubItem  = { label: string; href: string; icon?: React.ElementType };
type NavGroup = { labelAr?: string; items: SubItem[] };
type NavItem  = {
  key: string; label: string; href?: string;
  icon: React.ElementType; groups?: NavGroup[];
  /** Override active detection (e.g. split payroll vs contracts under same URL base). */
  isActive?: (pathname: string) => boolean;
};

function mapPayrollNavGroups(groups: typeof hrPayrollNavGroups): NavGroup[] {
  return groups.map((g) => ({
    labelAr: g.labelAr,
    items: g.items.map((item) => ({
      label: item.labelAr,
      href: hrPayrollSectionHref(item.slug),
      icon: item.icon,
    })),
  }));
}

function mapContractsOnlyNavGroups(groups: typeof hrContractsOnlyNavGroups): NavGroup[] {
  return groups.map((g) => ({
    labelAr: g.labelAr,
    items: g.items.map((item) => ({
      label: item.labelAr,
      href: hrContractsSectionHref(item.slug),
      icon: item.icon,
    })),
  }));
}

export const navConfig: NavItem[] = [
  { key: 'dashboard', label: 'الرئيسية', href: '/hr/dashboard', icon: LayoutDashboard },
  {
    key: 'employees', label: 'الهيكل الإداري', icon: Users,
    groups: [{ items: [
      { label: 'سجل الموظفين',     href: '/hr/organization/employees',  icon: Users },
      { label: 'المستخدمين', href: '/hr/organization/contacts',    icon: UserCircle },
      { label: 'المسميات الوظيفية', href: '/hr/organization/job-titles', icon: Briefcase },
      { label: 'الفروع',           href: '/hr/organization/branches',   icon: Building2 },
      { label: 'الأقسام',          href: '/hr/organization/departments', icon: Building2 },
      { label: 'الهيكل التنظيمي', href: '/hr/organization/chart',       icon: Building2 },
    ]}],
  },
  {
    key: 'recruitment', label: 'التوظيف', icon: UserPlus,
    groups: [
      { items: [
        { label: 'إدارة الوظائف', href: '/hr/recruitment/ats-admin', icon: LayoutDashboard },
        { label: 'المتقدمون', href: '/hr/recruitment/ats-applicants', icon: Users },
        { label: 'مسار التوظيف', href: '/hr/recruitment/ats-pipeline', icon: ClipboardList },
      ]},
    ],
  },
  {
    key: 'attendance', label: 'الحضور', icon: Clock,
    groups: [
      { labelAr: 'المتابعة', items: [
        { label: 'إدارة الحضور', href: '/hr/attendance/daily', icon: CalendarRange },
        { label: 'كشف الحضور ', href: '/hr/attendance/day-summaries', icon: ListChecks },
        { label: 'الأحداث',      href: '/hr/attendance/events', icon: Activity },
      ]},
      { labelAr: 'الإسناد', items: [
        { label: 'ربط الشيفتات بالموظفين',        href: '/hr/attendance/assignment',       icon: ClipboardList },
        { label: 'ربط النقاط بالموظفين  ', href: '/hr/attendance/checkpoint-links', icon: Link2 },
      ]},
      { labelAr: 'الإعداد', items: [
        { label: 'قوالب الشفت',  href: '/hr/attendance/templates',   icon: LayoutGrid },
        { label: 'نقاط التسجيل', href: '/hr/attendance/checkpoints', icon: MapPin },
      ]},
    ],
  },
  {
    key: 'leaves', label: 'الإجازات', icon: CalendarDays,
    groups: [
      { labelAr: 'المتابعة', items: [
        { label: 'ارصدة الموظفين',     href: '/hr/leaves/analytics',         icon: BarChart3 },
        { label: 'إضافة رصيد إجازات', href: '/hr/leaves/balance-credit', icon: CirclePlus },
      ]},
      { labelAr: 'الإعداد', items: [
        { label: 'أنواع الإجازات', href: '/hr/leaves/leave-types',     icon: ListChecks },
        { label: 'العطل الرسمية',  href: '/hr/leaves/public-holidays', icon: CalendarDays },
      ]},
    ],
  },
  {
    key: 'requests', label: 'الطلبات', icon: ClipboardList,
    groups: [
      { labelAr: 'الطلبات', items: [
        { label: 'إدارة طلبات الحضور', href: '/hr/requests/attendance-corrections', icon: CalendarClock },
        { label: 'إدارة طلبات الإجازات', href: '/hr/requests/unified-management', icon: LayoutList },
        { label: 'إدارة سلف الموظفين', href: '/hr/requests/employee-advances', icon: Banknote },
      ] },
      { labelAr: 'الإعداد', items: [
        { label: 'أنواع الطلبات', href: '/hr/requests/request-types',   icon: ListChecks },
      ]},
      { labelAr: 'الموافقات', items: [{ label: 'إسناد الموافقة', href: '/hr/requests/approval-assignment', icon: ShieldCheck }] },
    ],
  },
  {
    key: 'discipline', label: 'الانضباط الوظيفي', icon: ShieldAlert,
    groups: hrDisciplineNavGroups.map(g => ({
      labelAr: g.labelAr,
      items: g.items.map(item => ({ label: item.labelAr, href: `/hr/discipline/${item.slug}` })),
    })),
  },
  {
    key: 'notifications',
    label: 'الإشعارات',
    icon: Bell,
    isActive: isHrNotificationsNavPath,
    groups: hrNotificationsNavGroups.map((g) => ({
      labelAr: g.labelAr,
      items: g.items.map((item) => ({
        label: item.labelAr,
        href: item.href,
        icon: item.icon,
      })),
    })),
  },
  {
    key: 'payroll',
    label: 'الرواتب',
    icon: Wallet,
    isActive: isHrPayrollNavPath,
    groups: mapPayrollNavGroups(hrPayrollNavGroups),
  },
  {
    key: 'contracts',
    label: 'العقود',
    icon: FileSignature,
    isActive: isHrContractsOnlyNavPath,
    groups: mapContractsOnlyNavGroups(hrContractsOnlyNavGroups),
  },
  {
    key: 'permissions',
    label: 'الصلاحيات',
    icon: Shield,
    isActive: isHrPermissionsNavPath,
    groups: hrPermissionsNavGroups.map((g) => ({
      labelAr: g.labelAr,
      items: g.items.map((item) => ({
        label: item.labelAr,
        href: item.href,
        icon: item.icon,
      })),
    })),
  },
];

/* ── Helpers ─────────────────────────────────────────────────────────── */
function parentIsActive(pathname: string, item: NavItem) {
  if (item.isActive) return item.isActive(pathname);
  if (item.href) return pathname === item.href || pathname.startsWith(item.href + '/');
  return item.groups?.some(g =>
    g.items.some(s => {
      const base = s.href.split('?')[0];
      return pathname === base || pathname.startsWith(base + '/');
    }),
  ) ?? false;
}

/* ── NavDropdown — needs useSearchParams for query-aware active state ── */
function NavDropdownContent({
  groups, itemKey, onOpen, onClose,
}: {
  groups: NavGroup[];
  itemKey: string;
  onOpen: () => void;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const multiGroup = groups.length > 1;

  function subIsActive(href: string) {
    const [hrefPath, hrefQuery] = href.split('?');
    const base = hrefPath;
    if (pathname !== base && !pathname.startsWith(base + '/')) return false;
    if (!hrefQuery) return true;
    const params = new URLSearchParams(hrefQuery);
    for (const [k, v] of params) {
      if (searchParams.get(k) !== v) return false;
    }
    return true;
  }

  return (
    <div
      className={cn(
        'nav-dropdown absolute right-0 top-[calc(100%+6px)] z-50 rounded-2xl border border-border/60 bg-popover/95 p-2 shadow-elevated backdrop-blur-xl min-w-[220px]',
      )}
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      {groups.map((group, gi) => (
        <div key={gi} className="flex flex-col gap-0.5">
          {gi > 0 && <div className="my-1 border-t border-border/40" />}
          {group.labelAr && (
            <p className="mb-1 px-3 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50">
              {group.labelAr}
            </p>
          )}
          {group.items.map(sub => {
            const SubIcon = sub.icon;
            const active  = subIsActive(sub.href);
            return (
              <Link
                key={sub.href}
                href={sub.href}
                className={cn(
                  'group/sub relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150',
                  active
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-foreground/70 hover:bg-muted/70 hover:text-foreground',
                )}
              >
                {active && (
                  <span className="absolute inset-e-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                )}
                {SubIcon && (
                  <span className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors',
                    active
                      ? 'bg-primary/15 text-primary'
                      : 'bg-muted/60 text-muted-foreground group-hover/sub:bg-primary/10 group-hover/sub:text-primary',
                  )}>
                    <SubIcon className="h-3.5 w-3.5" />
                  </span>
                )}
                <span className="flex-1 leading-tight">{sub.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ── Main Topbar ─────────────────────────────────────────────────────── */
export function Topbar() {
  const [dark, setDark] = React.useState(false);
  const { logout, loading: logoutLoading } = useLogout();
  const {
    displayName,
    subtitle,
    avatarFallback,
    avatarUrl,
    email,
    phone,
    roleLabel,
    accessProfile,
    activeBranchId,
  } = useAuthUserDisplay();
  const defaultCompanyId = useDefaultCompanyId();
  const setActiveContext = useAuthStore((s) => s.setActiveContext);
  const { toggle } = useSidebar();
  const { meta } = usePageTitle();
  const pathname = usePathname();

  const { slot: headerActionsSlot } = usePageHeaderActionsRegion();
  const [activeMenu, setActiveMenu] = React.useState<string | null>(null);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const openMenu   = (key: string) => { if (closeTimer.current) clearTimeout(closeTimer.current); setActiveMenu(key); };
  const delayClose = () => { closeTimer.current = setTimeout(() => setActiveMenu(null), 150); };

  React.useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);
  React.useEffect(() => { setActiveMenu(null); }, [pathname]);

  const PageIcon = meta.iconName ? PAGE_ICONS[meta.iconName] : null;

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex flex-col border-b backdrop-blur-xl',
        'border-border/60',
        /* Light: crisp glass bar — cool white → parchment → whisper of primary teal */
        'bg-linear-to-b from-card via-background to-primary-50/35',
        'shadow-[inset_0_1px_0_0_rgb(255_255_255_/0.92),0_10px_40px_-18px_hsl(var(--primary)/0.09)]',
        /* Dark: flat frosted surface (unchanged character) */
        'dark:bg-none dark:bg-background/95 dark:shadow-none dark:backdrop-blur-2xl',
      )}
    >

      {/* ── Row 1: logo + nav + actions ── */}
      <div className="flex h-[54px] items-center gap-2 px-4 sm:px-5">

        {/* Logo */}
        <Link href="/hr/dashboard" className="flex shrink-0 items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-muted/50">
          <Logo size={28} />
          <div className="hidden flex-col leading-none sm:flex">
            <span className="font-display text-[15px] font-bold tracking-tight">روز</span>
            <span className="text-[9px] font-medium tracking-[0.22em] text-muted-foreground uppercase">rose HR</span>
          </div>
        </Link>

        <div className="mx-0.5 hidden h-5 w-px bg-border/70 lg:block" />

        {/* Desktop nav */}
        <nav className="hidden flex-1 items-center gap-0.5 lg:flex" aria-label="التنقل الرئيسي">
          {navConfig.map(item => {
            const active  = parentIsActive(pathname, item);
            const isOpen  = activeMenu === item.key;
            const hasDrop = !!item.groups;

            const btnClass = cn(
              'relative flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[13px] font-medium outline-none',
              'transition-all duration-200 ease-out',
              active  ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground/65 hover:bg-muted/70 hover:text-foreground',
              isOpen && !active && 'bg-muted/70 text-foreground',
            );

            return (
              <div
                key={item.key}
                className="relative"
                onMouseEnter={() => { if (hasDrop) openMenu(item.key); }}
                onMouseLeave={() => { if (hasDrop) delayClose(); }}
              >
                {item.href && !hasDrop ? (
                  <Link href={item.href} className={btnClass}>
                    <item.icon className="h-[14px] w-[14px] shrink-0" />
                    {item.label}
                  </Link>
                ) : (
                  <button type="button" className={btnClass}>
                    <item.icon className="h-[14px] w-[14px] shrink-0" />
                    {item.label}
                    <ChevronDown className={cn(
                      'h-3 w-3 opacity-60 transition-transform duration-200',
                      isOpen && 'rotate-180',
                    )} />
                  </button>
                )}

                {/* Dropdown — wrapped in Suspense so useSearchParams is safe */}
                {isOpen && hasDrop && (
                  <React.Suspense fallback={null}>
                    <NavDropdownContent
                      groups={item.groups!}
                      itemKey={item.key}
                      onOpen={() => openMenu(item.key)}
                      onClose={delayClose}
                    />
                  </React.Suspense>
                )}
              </div>
            );
          })}
        </nav>

        <div className="flex-1 lg:hidden" />

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">

          {/* Filter trigger */}
          <FilterTrigger />

          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setDark(d => !d)}>
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <NotificationBellPopover />

          <div className="mx-1 h-5 w-px bg-border/70" />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-xl px-1.5 py-1 transition-colors hover:bg-muted/60">
                <Avatar className="h-7 w-7 ring-2 ring-gold/40">
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
                  <AvatarFallback>{avatarFallback}</AvatarFallback>
                </Avatar>
                <div className="hidden flex-col text-right leading-tight md:flex">
                  <span className="text-[12px] font-semibold">{displayName}</span>
                  {subtitle ? (
                    <span className="text-[10px] text-muted-foreground">{subtitle}</span>
                  ) : null}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">{displayName}</span>
                  {email ? (
                    <span className="text-xs font-normal text-muted-foreground" dir="ltr">
                      {email}
                    </span>
                  ) : null}
                  {phone ? (
                    <span className="text-xs font-normal text-muted-foreground" dir="ltr">
                      {phone}
                    </span>
                  ) : null}
                  {roleLabel ? (
                    <span className="text-xs font-normal text-primary">{roleLabel}</span>
                  ) : null}
                </div>
              </DropdownMenuLabel>

              {(accessProfile?.companies.find((c) => c.companyId === defaultCompanyId)?.branches.length ?? 0) > 1 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    الفرع النشط
                  </DropdownMenuLabel>
                  {accessProfile!.companies
                    .find((c) => c.companyId === defaultCompanyId)
                    ?.branches.map((branch) => (
                      <DropdownMenuItem
                        key={branch.branchId}
                        onSelect={() => {
                          if (defaultCompanyId) setActiveContext(defaultCompanyId, branch.branchId);
                        }}
                        className={branch.branchId === activeBranchId ? 'bg-primary/10 font-medium' : undefined}
                      >
                        {branch.branchId === activeBranchId ? '● ' : ''}
                        {getBranchAccessLabel(branch)}
                      </DropdownMenuItem>
                    ))}
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                disabled={logoutLoading}
                onSelect={(e) => {
                  e.preventDefault();
                  void logout();
                }}
              >
                <LogOut className="h-4 w-4" />
                <span>{logoutLoading ? 'جاري الخروج…' : 'تسجيل الخروج'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile hamburger */}
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl lg:hidden" onClick={toggle} aria-label="القائمة">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Row 2: page title + page-level actions ── */}
      <div
        className={cn(
          'flex items-center justify-between gap-3 border-t px-4 py-2 sm:px-5 sm:py-2.5',
          'border-border/25 bg-white/55 backdrop-blur-sm dark:border-border/30 dark:bg-muted/15',
        )}
      >
        {/* Title + subtitle */}
        {meta.titleAr ? (
          <div className="flex min-w-0 items-start gap-2.5">
            {PageIcon && <PageIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold leading-tight tracking-tight text-foreground sm:text-[17px]">
                {meta.titleAr}
              </h1>
              {meta.descriptionAr && (
                <p className="mt-0.5 truncate text-[11px] leading-snug text-muted-foreground sm:text-xs">
                  {meta.descriptionAr}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="h-4 w-4 shrink-0 rounded bg-muted" />
            <div className="h-3 w-40 animate-pulse rounded-full bg-muted" />
          </div>
        )}

        {/* Per-page actions (filter toggle, add button, …) */}
        {headerActionsSlot ? (
          <div className="flex shrink-0 items-center gap-2">
            {headerActionsSlot}
          </div>
        ) : null}
      </div>
    </header>
  );
}

'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Bell, Shield, Menu,
  LayoutDashboard, Users, Clock, CalendarDays, ClipboardList,
  ShieldAlert, Wallet, BarChart3, Building2, ChevronDown,
  LayoutGrid, MapPin, Link2, CalendarRange, Activity,
  ListChecks, ShieldCheck, LayoutList, CirclePlus, CalendarClock,
  Banknote, FileSignature, BookOpen, FileSpreadsheet, UserCircle, Briefcase, UserCheck, UserPlus,
  Coins, FileStack, Receipt, KeyRound, Settings, Timer,
  LayoutTemplate, Navigation, PanelBottom, PanelTop, Image, FileText, Newspaper,
  CircleHelp, Search, ShoppingCart, Package, FolderTree, Tag, Globe, Megaphone,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/layouts/sidebar-context';
import { usePageTitle } from '@/components/layouts/page-title-context';
import { usePageHeaderActionsSlotRegion } from '@/components/layouts/page-header-actions-context';
import { PageHeaderActionsRow } from '@/components/layouts/page-header-actions-row';
import { FilterTrigger } from '@/components/layouts/filter-panel';
import { Logo } from '@/components/layouts/logo';
import { useDefaultCompanyBranding } from '@/features/auth/hooks/use-default-company-branding';
import { NotificationBellPopover } from '@/features/hr/notifications/components/notification-bell-popover';
import { cn } from '@/shared/utils';
import { hrDisciplineNavGroups } from '@/features/hr/discipline/lib/types';
import { hrNotificationsNavGroups, isHrNotificationsNavPath } from '@/features/hr/notifications/constants/nav';
import { hrPayrollNavGroups, isHrPayrollNavPath } from '@/features/hr/payroll/constants/nav';
import { hrContractsOnlyNavGroups, isHrContractsOnlyNavPath } from '@/features/hr/contracts/constants/nav';
import { hrPayrollSectionHref } from '@/features/hr/payroll/constants/routes';
import { hrContractsSectionHref } from '@/features/hr/contracts/constants/routes';
import { isHrOrganizationNavPath } from '@/features/hr/organization/constants/nav';
import { hrOrganizationRoutes } from '@/features/hr/organization/constants/routes';
import { systemPermissionsNavGroups, isSystemPermissionsNavPath } from '@/features/system/permissions/constants/nav';
import {
  systemOrganizationSettingsNavItems,
  systemOrganizationStructureNavItems,
  isSystemOrganizationStructureNavPath,
  isSystemOrganizationSettingsNavPath,
} from '@/features/system/organization/constants/nav';
import {
  ecommerceAdminNavGroups,
  ecommerceAdminOverviewItem,
  flattenEcommerceNavItems,
} from '@/features/ecommerce/admin/constants/nav';
import {
  inventoryAdminNavGroups,
  inventoryAdminOverviewItem,
  flattenInventoryNavItems,
} from '@/features/inventory/admin/constants/nav';
import { UserMenuDropdown } from '@/components/layouts/user-menu-dropdown';
import { AppsLauncherButton } from '@/components/layouts/apps-launcher-button';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import {
  isHrAppPath,
  isSystemAppPath,
  isEcommerceAppPath,
  isInventoryAppPath,
  isLauncherPath,
} from '@/shared/app-paths';
import { isModuleEnabledFor } from '@/shared/modules/registry';

/* ── Icon registry ────────────────────────────────────────────────────── */
export const PAGE_ICONS: Record<string, React.ElementType> = {
  LayoutDashboard, LayoutGrid, Users, Clock, CalendarDays, ClipboardList,
  ShieldAlert, Wallet, BarChart3, Building2, Settings,
  CalendarRange, Banknote, FileSignature, BookOpen, FileSpreadsheet, Bell,
  UserCircle, Briefcase, UserCheck, UserPlus,
  CalendarClock, LayoutList, ListChecks, ShieldCheck,
  Coins, FileStack, Receipt, KeyRound,
  LayoutTemplate, Navigation, PanelBottom, PanelTop, Image, FileText, Newspaper,
  CircleHelp, Search, ShoppingCart, Package, FolderTree, Tag, Globe, Megaphone,
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
  {
    key: 'employees', label: 'سجل الموظفين', icon: Users,
    href: hrOrganizationRoutes.employees,
    isActive: isHrOrganizationNavPath,
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
        { label: 'طلبات العمل الإضافي', href: '/hr/requests/overtime-requests', icon: Timer },
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
];

export const systemNavConfig: NavItem[] = [
  {
    key: 'system-organization-structure', label: 'الهيكل التنظيمي', icon: Building2,
    isActive: isSystemOrganizationStructureNavPath,
    groups: [
      {
        items: systemOrganizationStructureNavItems.map((item) => ({
          label: item.labelAr,
          href: item.href,
          icon: item.icon,
        })),
      },
    ],
  },
  {
    key: 'system-organization-settings', label: 'الإعدادات', icon: Settings,
    isActive: isSystemOrganizationSettingsNavPath,
    groups: [
      {
        items: systemOrganizationSettingsNavItems.map((item) => ({
          label: item.labelAr,
          href: item.href,
          icon: item.icon,
        })),
      },
    ],
  },
  {
    key: 'system-permissions',
    label: 'الصلاحيات',
    icon: Shield,
    isActive: isSystemPermissionsNavPath,
    groups: systemPermissionsNavGroups.map((g) => ({
      labelAr: g.labelAr,
      items: g.items.map((item) => ({
        label: item.labelAr,
        href: item.href,
        icon: item.icon,
      })),
    })),
  },
];

/**
 * Overview link + Website dropdown + business-domain dropdowns (skip empty domains).
 */
function buildEcommerceNavConfig(tNav: (key: string) => string): NavItem[] {
  const items: NavItem[] = [
    {
      key: 'ecommerce-overview',
      label: tNav(ecommerceAdminOverviewItem.labelKey),
      href: ecommerceAdminOverviewItem.href,
      icon: ecommerceAdminOverviewItem.icon,
    },
  ];

  for (const group of ecommerceAdminNavGroups) {
    const flat = flattenEcommerceNavItems(group);
    if (flat.length === 0) continue;

    items.push({
      key: group.key,
      label: tNav(group.labelKey),
      icon: group.icon,
      isActive: (pathname) =>
        flat.some((item) => {
          const base = item.href.split('?')[0]!;
          return pathname === base || pathname.startsWith(`${base}/`);
        }),
      groups: group.sections
        .filter((section) => section.items.length > 0)
        .map((section) => ({
          labelAr: section.sectionKey ? tNav(`sections.${section.sectionKey}`) : undefined,
          items: section.items.map((item) => ({
            label: tNav(item.labelKey),
            href: item.href,
            icon: item.icon,
          })),
        })),
    });
  }

  return items;
}

/** نظرة عامة | العمليات | المنتجات | إعداد التقارير | التهيئة */
function buildInventoryNavConfig(): NavItem[] {
  const items: NavItem[] = [
    {
      key: 'inventory-overview',
      label: inventoryAdminOverviewItem.labelAr,
      href: inventoryAdminOverviewItem.href,
      icon: inventoryAdminOverviewItem.icon,
    },
  ];

  for (const group of inventoryAdminNavGroups) {
    const flat = flattenInventoryNavItems(group);
    if (flat.length === 0) continue;

    items.push({
      key: group.key,
      label: group.labelAr,
      icon: group.icon,
      isActive: (pathname) =>
        flat.some((item) => {
          const base = item.href.split('?')[0]!;
          return pathname === base || pathname.startsWith(`${base}/`);
        }),
      groups: group.sections
        .filter((section) => section.items.length > 0)
        .map((section) => ({
          labelAr: section.labelAr,
          items: section.items.map((item) => ({
            label: item.labelAr,
            href: item.href,
            icon: item.icon,
          })),
        })),
    });
  }

  return items;
}

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
  groups,
  onOpen,
  onClose,
}: {
  groups: NavGroup[];
  onOpen: () => void;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
        'nav-dropdown absolute right-0 top-[calc(100%+6px)] z-[200] min-w-[220px] rounded-2xl border border-border/60 bg-popover/95 p-2 shadow-elevated backdrop-blur-xl',
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

function TopbarNavItem({
  item,
  pathname,
  activeMenu,
  openMenu,
  delayClose,
}: {
  item: NavItem;
  pathname: string;
  activeMenu: string | null;
  openMenu: (key: string) => void;
  delayClose: () => void;
}) {
  const active = parentIsActive(pathname, item);
  const isOpen = activeMenu === item.key;
  const hasDrop = !!item.groups;

  const btnClass = cn(
    'relative flex shrink-0 items-center gap-1 whitespace-nowrap rounded-xl px-2 py-1.5 text-[12px] font-medium outline-none',
    'min-[1400px]:gap-1.5 min-[1400px]:px-2.5 min-[1400px]:py-2 min-[1400px]:text-[13px]',
    'transition-all duration-200 ease-out',
    active ? 'bg-primary text-primary-foreground shadow-sm'
           : 'text-foreground/65 hover:bg-muted/70 hover:text-foreground',
    isOpen && !active && 'bg-muted/70 text-foreground',
  );

  return (
    <div
      className="relative shrink-0"
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

      {isOpen && hasDrop && (
        <React.Suspense fallback={null}>
          <NavDropdownContent
            groups={item.groups!}
            onOpen={() => openMenu(item.key)}
            onClose={delayClose}
          />
        </React.Suspense>
      )}
    </div>
  );
}

/* ── Main Topbar ─────────────────────────────────────────────────────── */
export function Topbar() {
  const { logoUrl, logoAlt } = useDefaultCompanyBranding();
  const { toggle } = useSidebar();
  const { meta } = usePageTitle();
  const pathname = usePathname();

  const { renderFnRef, reRenderSlotRef } = usePageHeaderActionsSlotRegion();
  const [, forceHeaderActionsUpdate] = React.useReducer((n: number) => n + 1, 0);

  React.useLayoutEffect(() => {
    reRenderSlotRef.current = forceHeaderActionsUpdate;
    return () => {
      reRenderSlotRef.current = null;
    };
  }, [reRenderSlotRef]);

  // Re-read header slot after route changes (Topbar renders before page children).
  React.useLayoutEffect(() => {
    forceHeaderActionsUpdate();
  }, [pathname]);

  const headerActionsSlot = renderFnRef.current?.() ?? null;
  const [activeMenu, setActiveMenu] = React.useState<string | null>(null);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const openMenu   = (key: string) => { if (closeTimer.current) clearTimeout(closeTimer.current); setActiveMenu(key); };
  const delayClose = () => { closeTimer.current = setTimeout(() => setActiveMenu(null), 150); };

  React.useEffect(() => { setActiveMenu(null); }, [pathname]);

  const inHrApp = isHrAppPath(pathname);
  const inSystemApp = isSystemAppPath(pathname);
  const activeCompanyId = useAuthStore((s) => s.activeCompanyId);
  const ecommerceEnabled = isModuleEnabledFor('ecommerce', activeCompanyId);
  const inventoryEnabled = isModuleEnabledFor('inventory', activeCompanyId);
  const inEcommerceApp = ecommerceEnabled && isEcommerceAppPath(pathname);
  const inInventoryApp = inventoryEnabled && isInventoryAppPath(pathname);
  const inAppShell = inHrApp || inSystemApp || inEcommerceApp || inInventoryApp;
  const tEcommerceNav = useTranslations('ecommerceAdmin.nav');
  const ecommerceNavConfig = React.useMemo(
    () => buildEcommerceNavConfig((key) => tEcommerceNav(key as 'overview')),
    [tEcommerceNav],
  );
  const inventoryNavConfig = React.useMemo(() => buildInventoryNavConfig(), []);
  const activeNavConfig = inSystemApp
    ? systemNavConfig
    : inInventoryApp
      ? inventoryNavConfig
      : inEcommerceApp
        ? ecommerceNavConfig
        : navConfig;
  const onLauncher = isLauncherPath(pathname);
  const PageIcon = meta.iconName ? PAGE_ICONS[meta.iconName] : null;

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex flex-col overflow-visible border-b backdrop-blur-xl',
        'border-border/60',
        /* Light: crisp glass bar — cool white → parchment → whisper of primary teal */
        'bg-linear-to-b from-card via-background to-primary-50/35',
        'topbar-shell-shadow',
        /* Dark: flat frosted surface (unchanged character) */
        'dark:bg-none dark:bg-background/95 dark:shadow-none dark:backdrop-blur-2xl',
      )}
    >

      {/* ── Row 1: logo + nav + actions ── */}
      <div className="relative z-50 flex h-[54px] items-center gap-2 overflow-visible px-4 sm:px-5">

        {/* App switcher (RTL right) — separated from in-app navigation */}
        <div className="flex shrink-0 items-center gap-2">
          {!onLauncher && (
            <>
              <AppsLauncherButton />
              {inAppShell && (
                <div className="hidden h-5 w-px bg-border/70 lg:block" aria-hidden />
              )}
            </>
          )}
          {onLauncher && logoUrl ? (
            <Link
              href="/"
              className="flex items-center rounded-xl p-1.5 transition-colors hover:bg-muted/50"
              title={logoAlt}
              aria-label={logoAlt}
            >
              <Logo size={28} src={logoUrl} alt={logoAlt} />
            </Link>
          ) : null}
        </div>

        {/* Desktop nav — app shell only (HR, System, or Ecommerce) */}
        {inAppShell && (
        <nav className="hidden min-w-0 flex-1 flex-nowrap items-center gap-0.5 overflow-visible min-[1400px]:gap-1 lg:flex" aria-label="التنقل الرئيسي">
          {activeNavConfig.map(item => (
            <TopbarNavItem
              key={item.key}
              item={item}
              pathname={pathname}
              activeMenu={activeMenu}
              openMenu={openMenu}
              delayClose={delayClose}
            />
          ))}
        </nav>
        )}

        <div className={cn('flex-1', inAppShell && 'lg:hidden')} />

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">

          {inAppShell && <FilterTrigger />}

          {inHrApp && <NotificationBellPopover />}

          <div className="mx-1 h-5 w-px bg-border/70" />

          <UserMenuDropdown />

          {inAppShell && (
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl lg:hidden" onClick={toggle} aria-label="القائمة">
              <Menu className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* ── Row 2: page title + page-level actions (hidden on apps launcher) ── */}
      {!onLauncher && (
        <div
          className={cn(
            'flex flex-row flex-nowrap items-center justify-between gap-2 border-t px-3 py-2 sm:gap-3 sm:px-5 sm:py-2.5',
            'border-border/25 bg-white/55 backdrop-blur-sm dark:border-border/30 dark:bg-muted/15',
          )}
        >
          {meta.titleAr ? (
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden sm:items-start sm:gap-2.5">
              {PageIcon && <PageIcon className="h-4 w-4 shrink-0 text-primary sm:mt-0.5" />}
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-sm font-bold leading-tight tracking-tight text-foreground sm:text-[17px]">
                  {meta.titleAr}
                </h1>
                {meta.descriptionAr && (
                  <p className="mt-0.5 hidden truncate text-[11px] leading-snug text-muted-foreground sm:block sm:text-xs">
                    {meta.descriptionAr}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <div className="h-4 w-4 shrink-0 rounded bg-muted" />
              <div className="h-3 w-40 animate-pulse rounded-full bg-muted" />
            </div>
          )}

          {headerActionsSlot ? (
            <PageHeaderActionsRow>{headerActionsSlot}</PageHeaderActionsRow>
          ) : null}
        </div>
      )}
    </header>
  );
}

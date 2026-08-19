'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, LayoutDashboard, MoreHorizontal, Package, Settings, Shield } from 'lucide-react';
import { cn } from '@/shared/utils';
import { useSidebar } from '@/components/layouts/sidebar-context';
import { isInventoryAppPath, isSystemAppPath } from '@/shared/app-paths';
import { useModuleEnablementContext } from '@/features/auth/hooks/use-system-owner';
import { isModuleEnabledFor } from '@/shared/modules/registry';
import {
  inventoryAdminNavGroups,
  inventoryAdminOverviewItem,
  flattenInventoryNavItems,
  type InventoryAdminNavGroup,
} from '@/features/inventory/admin/constants/nav';
import { systemOverviewItem } from '@/features/system/constants/nav';
import {
  systemOrganizationStructureNavItems,
  systemOrganizationSettingsNavItems,
  isSystemOrganizationStructureNavPath,
  isSystemOrganizationSettingsNavPath,
} from '@/features/system/organization/constants/nav';
import { systemPermissionsNavGroups, isSystemPermissionsNavPath } from '@/features/system/permissions/constants/nav';

type TabItem = {
  key: string;
  label: string;
  icon: React.ElementType;
  href: string;
  isActive: (pathname: string) => boolean;
};

function groupTab(group: InventoryAdminNavGroup | undefined, label: string, fallbackIcon: React.ElementType): TabItem | null {
  if (!group) return null;
  const flat = flattenInventoryNavItems(group);
  const first = flat[0];
  if (!first) return null;
  const hrefs = flat.map((item) => item.href.split('?')[0]!);
  return {
    key: group.key,
    label,
    icon: group.icon ?? fallbackIcon,
    href: first.href,
    isActive: (pathname) => hrefs.some((base) => pathname === base || pathname.startsWith(`${base}/`)),
  };
}

function buildInventoryTabs(): TabItem[] {
  const byKey = (key: InventoryAdminNavGroup['key']) => inventoryAdminNavGroups.find((g) => g.key === key);

  const overview: TabItem = {
    key: 'overview',
    label: inventoryAdminOverviewItem.labelAr,
    icon: inventoryAdminOverviewItem.icon,
    href: inventoryAdminOverviewItem.href,
    isActive: (pathname) => pathname === inventoryAdminOverviewItem.href,
  };

  return [
    overview,
    groupTab(byKey('operations'), 'العمليات', Package),
    groupTab(byKey('products'), 'المنتجات', Package),
    groupTab(byKey('reports'), 'التقارير', Package),
  ].filter((tab): tab is TabItem => tab !== null);
}

function buildSystemTabs(): TabItem[] {
  const structureHref = systemOrganizationStructureNavItems[0]?.href;
  const settingsHref = systemOrganizationSettingsNavItems[0]?.href;
  const permissionsHref = systemPermissionsNavGroups[0]?.items[0]?.href;

  const tabs: TabItem[] = [
    {
      key: 'overview',
      label: systemOverviewItem.labelAr,
      icon: systemOverviewItem.icon,
      href: systemOverviewItem.href,
      isActive: (pathname) => pathname === systemOverviewItem.href,
    },
  ];

  if (structureHref) {
    tabs.push({
      key: 'structure',
      label: 'الهيكل التنظيمي',
      icon: Building2,
      href: structureHref,
      isActive: isSystemOrganizationStructureNavPath,
    });
  }
  if (settingsHref) {
    tabs.push({
      key: 'settings',
      label: 'الإعدادات',
      icon: Settings,
      href: settingsHref,
      isActive: isSystemOrganizationSettingsNavPath,
    });
  }
  if (permissionsHref) {
    tabs.push({
      key: 'permissions',
      label: 'الصلاحيات',
      icon: Shield,
      href: permissionsHref,
      isActive: isSystemPermissionsNavPath,
    });
  }

  return tabs;
}

/**
 * Native-app-style bottom tab bar shown on phone/tablet widths for the System
 * and Inventory apps — the primary sections stay one tap away instead of
 * living only behind the hamburger menu. Pairs with the bottom-sheet variant
 * of `Sidebar` (opened here from the "المزيد" tab) for everything else.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const { toggle } = useSidebar();
  const { companyId: activeCompanyId, ...moduleContext } = useModuleEnablementContext();
  const inventoryEnabled = isModuleEnabledFor('inventory', activeCompanyId, moduleContext);

  const inInventoryApp = inventoryEnabled && isInventoryAppPath(pathname);
  const inSystemApp = isSystemAppPath(pathname);

  const tabs = React.useMemo(() => {
    if (inSystemApp) return buildSystemTabs();
    if (inInventoryApp) return buildInventoryTabs();
    return [];
  }, [inInventoryApp, inSystemApp]);

  if (!inInventoryApp && !inSystemApp) return null;
  if (tabs.length === 0) return null;

  // Inventory has more sections than fit the bar — the rest live in "المزيد".
  // System's four sections all fit, so no extra tab is needed there.
  const showMore = inInventoryApp;

  return (
    <nav
      className="app-mobile-tab-bar fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-border/70 bg-card/95 pt-1.5 backdrop-blur-lg lg:hidden"
      aria-label="التنقل السفلي"
    >
      {tabs.map((tab) => {
        const active = tab.isActive(pathname);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className="flex flex-1 flex-col items-center gap-1 px-1 py-1"
            aria-current={active ? 'page' : undefined}
          >
            <span
              className={cn(
                'flex h-[26px] w-11 items-center justify-center rounded-full transition-colors',
                active ? 'bg-primary-100 text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <span
              className={cn(
                'text-[10.5px] leading-none',
                active ? 'font-bold text-primary' : 'font-medium text-muted-foreground',
              )}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}

      {showMore && (
        <button
          type="button"
          onClick={toggle}
          className="flex flex-1 flex-col items-center gap-1 px-1 py-1"
        >
          <span className="flex h-[26px] w-11 items-center justify-center rounded-full text-muted-foreground">
            <MoreHorizontal className="h-[18px] w-[18px]" />
          </span>
          <span className="text-[10.5px] font-medium leading-none text-muted-foreground">المزيد</span>
        </button>
      )}
    </nav>
  );
}

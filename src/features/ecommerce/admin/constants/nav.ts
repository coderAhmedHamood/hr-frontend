import type { LucideIcon } from 'lucide-react';
import {
  Package,
  FolderTree,
  Tag,
  ShoppingCart,
  LayoutTemplate,
  FileText,
  Settings,
  Megaphone,
  SlidersHorizontal,
  Library,
  Image,
  Mail,
} from 'lucide-react';
import {
  ecommerceAdminRoutes,
  ecommerceContentHref,
  ecommerceNavigationHref,
} from '@/features/ecommerce/admin/constants/routes';

export type EcommerceAdminNavItem = {
  /** next-intl key under `ecommerceAdmin.nav.*` */
  labelKey: string;
  href: string;
  icon: LucideIcon;
  /**
   * Optional mid-column section label (under `ecommerceAdmin.nav.sections.*`)
   * rendered above this item — keeps related links in the same dropdown column.
   */
  precedingSectionKey?: 'content' | 'appearance' | 'catalogSetup';
};

export type EcommerceAdminNavSection = {
  /** Optional section label key under `ecommerceAdmin.nav.sections.*` */
  sectionKey?: 'content' | 'appearance' | 'catalogSetup';
  items: EcommerceAdminNavItem[];
};

export type EcommerceAdminNavGroup = {
  key: 'products' | 'catalogSetup' | 'storeSettings';
  labelKey: string;
  icon: LucideIcon;
  sections: EcommerceAdminNavSection[];
};

/** Primary home for store admin — orders Kanban. */
export const ecommerceAdminOverviewItem: EcommerceAdminNavItem = {
  labelKey: 'orders',
  href: ecommerceAdminRoutes.orders,
  icon: ShoppingCart,
};

/** Ecommerce-only nav — inventory lives in the standalone Inventory app. */
export const ecommerceAdminNavGroups: EcommerceAdminNavGroup[] = [
  {
    key: 'products',
    labelKey: 'groups.products',
    icon: Package,
    sections: [
      {
        items: [{ labelKey: 'products', href: ecommerceAdminRoutes.products, icon: Package }],
      },
    ],
  },
  {
    key: 'catalogSetup',
    labelKey: 'groups.catalogSetup',
    icon: Library,
    sections: [
      {
        sectionKey: 'catalogSetup',
        items: [
          { labelKey: 'categories', href: ecommerceAdminRoutes.categories, icon: FolderTree },
          { labelKey: 'attributes', href: ecommerceAdminRoutes.attributes, icon: SlidersHorizontal },
          { labelKey: 'brands', href: ecommerceAdminRoutes.brands, icon: Tag },
        ],
      },
    ],
  },
  {
    key: 'storeSettings',
    labelKey: 'groups.storeSettings',
    icon: Settings,
    sections: [
      {
        items: [
          { labelKey: 'banners', href: ecommerceAdminRoutes.banners, icon: Image },
          { labelKey: 'homepageSections', href: ecommerceAdminRoutes.storeSettings, icon: LayoutTemplate },
          {
            labelKey: 'appearanceAnnouncement',
            href: ecommerceNavigationHref('announcement'),
            icon: Megaphone,
            precedingSectionKey: 'appearance',
          },
        ],
      },
      {
        sectionKey: 'content',
        items: [
          { labelKey: 'contentPages', href: ecommerceContentHref('pages'), icon: FileText },
          {
            labelKey: 'contactMessages',
            href: ecommerceAdminRoutes.contactMessages,
            icon: Mail,
          },
          { labelKey: 'websiteSettings', href: ecommerceAdminRoutes.settings, icon: Settings },
        ],
      },
    ],
  },
];

function collectHrefs(group: EcommerceAdminNavGroup): string[] {
  return group.sections.flatMap((section) => section.items.map((item) => item.href.split('?')[0]!));
}

const ECOMMERCE_ADMIN_PATHS: string[] = [
  ecommerceAdminOverviewItem.href,
  ...ecommerceAdminNavGroups.flatMap(collectHrefs),
];

export function isEcommerceAdminNavPath(pathname: string): boolean {
  return ECOMMERCE_ADMIN_PATHS.some((base) => pathname === base || pathname.startsWith(`${base}/`));
}

export function flattenEcommerceNavItems(group: EcommerceAdminNavGroup): EcommerceAdminNavItem[] {
  return group.sections.flatMap((section) => section.items);
}

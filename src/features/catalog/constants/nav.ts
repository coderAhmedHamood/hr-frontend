import type { LucideIcon } from 'lucide-react';
import { FolderTree, Package, Ruler, SlidersHorizontal, Tag } from 'lucide-react';
import { catalogAdminRoutes } from '@/features/catalog/constants/routes';

export type CatalogNavItem = {
  key: string;
  labelAr: string;
  href: string;
  icon: LucideIcon;
};

/** Top tabs of the standalone products app. */
export const catalogNavItems: CatalogNavItem[] = [
  { key: 'products', labelAr: 'المنتجات', href: catalogAdminRoutes.products, icon: Package },
  { key: 'categories', labelAr: 'الفئات', href: catalogAdminRoutes.categories, icon: FolderTree },
  { key: 'attributes', labelAr: 'الخصائص', href: catalogAdminRoutes.attributes, icon: SlidersHorizontal },
  { key: 'brands', labelAr: 'العلامات', href: catalogAdminRoutes.brands, icon: Tag },
  { key: 'uoms', labelAr: 'وحدات القياس', href: catalogAdminRoutes.uoms, icon: Ruler },
];

export function isCatalogAdminNavPath(pathname: string): boolean {
  return pathname === '/catalog' || pathname.startsWith('/catalog/');
}

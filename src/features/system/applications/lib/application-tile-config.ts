import type { LucideIcon } from 'lucide-react';
import {
  Calculator,
  ContactRound,
  LayoutGrid,
  Package,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Store,
  Users,
} from 'lucide-react';
import type { ApplicationResponseDto } from '@/features/system/applications/lib/api/applications';

const ICON_BY_KEY: Record<string, LucideIcon> = {
  users: Users,
  calculator: Calculator,
  settings: Settings,
  'layout-grid': LayoutGrid,
  'shopping-cart': ShoppingCart,
  'store-admin': Store,
  storefront: ShoppingBag,
  store: Store,
  package: Package,
  contact: ContactRound,
  contacts: ContactRound,
  warehouse: Package,
};

/** Design-token icon surfaces — no hardcoded palette colors. */
const TILE_BY_CODE: Record<string, { tileClass: string }> = {
  hr: { tileClass: 'bg-primary text-primary-foreground shadow-soft' },
  accounting: { tileClass: 'bg-primary-700 text-primary-foreground shadow-soft' },
  system: { tileClass: 'bg-gold text-gold-foreground shadow-soft' },
  'store-admin': { tileClass: 'bg-gold text-gold-foreground shadow-soft' },
  ecommerce: { tileClass: 'bg-gold text-gold-foreground shadow-soft' },
  storefront: { tileClass: 'bg-success text-success-foreground shadow-soft' },
  inventory: { tileClass: 'bg-accent text-accent-foreground shadow-soft' },
  contacts: { tileClass: 'bg-primary text-primary-foreground shadow-soft' },
};

const FALLBACK_TILES = [
  'bg-primary text-primary-foreground shadow-soft',
  'bg-gold text-gold-foreground shadow-soft',
  'bg-success text-success-foreground shadow-soft',
  'bg-accent text-accent-foreground shadow-soft',
];

/** Card gradient accents aligned with global tokens. */
export const TILE_SURFACE_ACCENT = [
  'from-primary/12 via-card to-card group-hover:border-primary/30',
  'from-gold/12 via-card to-card group-hover:border-gold/40',
  'from-accent via-card to-card group-hover:border-primary/20',
] as const;

export function resolveApplicationIcon(app: ApplicationResponseDto): LucideIcon {
  const key = app.icon?.trim().toLowerCase();
  if (key && ICON_BY_KEY[key]) return ICON_BY_KEY[key]!;
  if (app.code === 'store-admin' || app.code === 'ecommerce') return Store;
  if (app.code === 'storefront') return ShoppingBag;
  if (app.code === 'inventory') return Package;
  if (app.code === 'contacts') return ContactRound;
  return LayoutGrid;
}

export function resolveApplicationTileClass(
  app: ApplicationResponseDto,
  index: number,
): string {
  const preset = TILE_BY_CODE[app.code];
  if (preset) return preset.tileClass;
  return FALLBACK_TILES[index % FALLBACK_TILES.length]!;
}

export function resolveApplicationSurfaceAccent(index: number): string {
  return TILE_SURFACE_ACCENT[index % TILE_SURFACE_ACCENT.length]!;
}

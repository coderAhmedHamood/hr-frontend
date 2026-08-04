'use client';

import type { ComponentType } from 'react';
import { Grid2X2, Home, ShoppingCart, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useCartItemCount } from '@/features/ecommerce/storefront/hooks/use-storefront-cart-ui';
import { cn } from '@/shared/utils';

type TabDef = {
  id: 'home' | 'categories' | 'account' | 'cart';
  href: string;
  labelKey: 'home' | 'categories' | 'account' | 'cart';
  match: (pathname: string) => boolean;
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
};

const TABS: TabDef[] = [
  {
    id: 'home',
    href: '/store',
    labelKey: 'home',
    match: (pathname) => pathname === '/store' || pathname === '/store/',
    icon: Home,
  },
  {
    id: 'categories',
    href: '/store/categories',
    labelKey: 'categories',
    match: (pathname) => pathname.startsWith('/store/categories'),
    icon: Grid2X2,
  },
  {
    id: 'account',
    href: '/login',
    labelKey: 'account',
    match: (pathname) => pathname.startsWith('/login'),
    icon: User,
  },
  {
    id: 'cart',
    href: '/store/cart',
    labelKey: 'cart',
    match: (pathname) => pathname.startsWith('/store/cart'),
    icon: ShoppingCart,
  },
];

export function StoreMobileTabBar() {
  const t = useTranslations('storefront.mobileTab');
  const tA11y = useTranslations('storefront.a11y');
  const pathname = usePathname();
  const cartCount = useCartItemCount();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label={tA11y('mobileNav')}
    >
      <ul className="mx-auto grid h-14 max-w-[1400px] grid-cols-4">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.id} className="min-w-0">
              <Link
                href={tab.href}
                prefetch={false}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex h-full flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span className="relative inline-flex">
                  <Icon
                    className={cn('h-5 w-5', active && 'stroke-[2.25]')}
                    aria-hidden
                  />
                  {tab.id === 'cart' && cartCount > 0 ? (
                    <span className="absolute -end-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  ) : null}
                </span>
                <span className="truncate">{t(tab.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

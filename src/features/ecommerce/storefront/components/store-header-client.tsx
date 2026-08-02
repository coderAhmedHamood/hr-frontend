'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { Heart, Menu, Search, ShoppingCart, User, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type {
  StorefrontBrand,
  StorefrontCategory,
  StorefrontCompanyConfig,
} from '@/features/ecommerce/storefront/domain/storefront-models';
import { StoreLocaleSwitcher } from '@/features/ecommerce/storefront/components/store-locale-switcher';
import { StoreCategoryNavBar, StoreMobileCategoryNav } from '@/features/ecommerce/storefront/components/store-mega-menu';
import { useWishlistBadgeCount } from '@/features/ecommerce/storefront/hooks/use-storefront-badges';
import { useCartItemCount } from '@/features/ecommerce/storefront/hooks/use-storefront-cart-ui';
import { useStorefrontCustomerUi } from '@/features/ecommerce/storefront/hooks/use-storefront-customer-ui';
import { Link } from '@/i18n/navigation';
import { isRtlLocale, type StorefrontLocale } from '@/i18n/routing';
import { cn } from '@/shared/utils';

type StoreHeaderInteractiveProps = {
  config: StorefrontCompanyConfig;
  categories: StorefrontCategory[];
  brands: StorefrontBrand[];
  logo: React.ReactNode;
};

function BadgeIcon({ count, children }: { count: number; children: React.ReactNode }) {
  return (
    <span className="relative inline-flex">
      {children}
      {count > 0 ? (
        <span className="absolute -end-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </span>
  );
}

function HeaderIconLink({
  href,
  label,
  children,
}: {
  href: '/store/cart' | '/store/wishlist' | '/store/search' | '/store/login' | '/store/account';
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
      aria-label={label}
    >
      {children}
    </Link>
  );
}

function StoreMobileDrawer({
  open,
  onClose,
  rtl,
  config,
  categories,
  brands,
}: {
  open: boolean;
  onClose: () => void;
  rtl: boolean;
  config: StorefrontCompanyConfig;
  categories: StorefrontCategory[];
  brands: StorefrontBrand[];
}) {
  const t = useTranslations('storefront');
  const customer = useStorefrontCustomerUi((s) => s.customer);
  const [mounted, setMounted] = React.useState(false);
  const [entered, setEntered] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="lg:hidden" dir={rtl ? 'rtl' : 'ltr'}>
      <button
        type="button"
        aria-label={t('a11y.closeMenu')}
        className={cn(
          'fixed inset-0 z-[60] bg-foreground/50 backdrop-blur-sm transition-opacity duration-300 ease-out',
          entered ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
      />

      <nav
        id="store-mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label={t('a11y.mobileNav')}
        className={cn(
          'fixed top-0 z-[70] flex h-dvh max-h-dvh w-[min(100vw-3rem,20rem)] max-w-[85vw] flex-col',
          'border-border bg-background text-foreground shadow-luxe',
          'transition-transform duration-300 ease-out will-change-transform',
          rtl ? 'right-0 border-s' : 'left-0 border-e',
          entered ? 'translate-x-0' : rtl ? 'translate-x-full' : '-translate-x-full',
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <p className="truncate font-display text-sm font-semibold text-foreground">{config.name}</p>
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t('a11y.closeMenu')}
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain overflow-touch px-3 py-3">
          <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
            <span className="text-xs font-medium text-muted-foreground">{t('a11y.languageSwitcher')}</span>
            <StoreLocaleSwitcher tone="panel" />
          </div>

          <div className="flex flex-col gap-0.5">
            {config.navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                onClick={onClose}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mt-3 border-t border-border pt-3 pb-2">
            <StoreMobileCategoryNav
              categories={categories}
              brands={brands}
              onNavigate={onClose}
            />
          </div>
        </div>

        <div className="store-drawer-safe-pb shrink-0 border-t border-border bg-background px-3 py-3">
          <Link
            href={customer ? '/store/account' : '/store/login'}
            prefetch={false}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            onClick={onClose}
          > 
            <User className="h-4 w-4" aria-hidden />
            {customer ? t('account.title') : t('nav.login')}
          </Link>
        </div>
      </nav>
    </div>,
    document.body,
  );
}

export function StoreHeaderInteractive({ config, categories, brands, logo }: StoreHeaderInteractiveProps) {
  const t = useTranslations('storefront');
  const locale = useLocale() as StorefrontLocale;
  const rtl = isRtlLocale(locale);
  const customer = useStorefrontCustomerUi((s) => s.customer);
  const wishlistCount = useWishlistBadgeCount();
  /** cartCount from badges API is always null — sum quantities from localStorage. */
  const cartCount = useCartItemCount();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const closeMobile = React.useCallback(() => setMobileOpen(false), []);
  const accountHref = customer ? '/store/account' : '/store/login';

  return (
    <>
      {/* Mobile — menu · logo · cart · search · wishlist */}
      <div className="border-b border-border bg-background lg:hidden" dir={rtl ? 'rtl' : 'ltr'}>
        <div className="mx-auto flex max-w-[1400px] items-center gap-1 px-3 py-2">
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
            aria-expanded={mobileOpen}
            aria-controls="store-mobile-nav"
            aria-label={mobileOpen ? t('a11y.closeMenu') : t('a11y.openMenu')}
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>

          <div className="min-w-0 shrink-0">{logo}</div>

          <div className="ms-auto flex shrink-0 items-center gap-0.5">
            <HeaderIconLink href="/store/cart" label={t('nav.cart')}>
              <BadgeIcon count={cartCount}>
                <ShoppingCart className="h-5 w-5" aria-hidden />
              </BadgeIcon>
            </HeaderIconLink>
            <HeaderIconLink href="/store/search" label={t('nav.search')}>
              <Search className="h-5 w-5" aria-hidden />
            </HeaderIconLink>
            <HeaderIconLink href="/store/wishlist" label={t('nav.wishlist')}>
              <BadgeIcon count={wishlistCount}>
                <Heart className="h-5 w-5" aria-hidden />
              </BadgeIcon>
            </HeaderIconLink>
          </div>
        </div>
      </div>

      {/* Desktop — brand bar then dedicated category strip (avoids one overcrowded row) */}
      <div className="hidden lg:block" dir={rtl ? 'rtl' : 'ltr'}>
        <div className="border-b border-border bg-background">
          <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-4 py-3 sm:px-6">
            <div className="shrink-0">{logo}</div>

            <div className="ms-auto flex shrink-0 items-center gap-1">
              <HeaderIconLink href={accountHref} label={t('nav.login')}>
                <User className="h-5 w-5" aria-hidden />
              </HeaderIconLink>
              <HeaderIconLink href="/store/cart" label={t('nav.cart')}>
                <BadgeIcon count={cartCount}>
                  <ShoppingCart className="h-5 w-5" aria-hidden />
                </BadgeIcon>
              </HeaderIconLink>
              <HeaderIconLink href="/store/search" label={t('nav.search')}>
                <Search className="h-5 w-5" aria-hidden />
              </HeaderIconLink>
              <HeaderIconLink href="/store/wishlist" label={t('nav.wishlist')}>
                <BadgeIcon count={wishlistCount}>
                  <Heart className="h-5 w-5" aria-hidden />
                </BadgeIcon>
              </HeaderIconLink>
              <div className="ms-1 border-s border-border ps-2">
                <StoreLocaleSwitcher tone="panel" />
              </div>
            </div>
          </div>
        </div>

        <StoreCategoryNavBar
          categories={categories}
          brands={brands}
          promoLinks={
            config.secondaryNavigation.length > 0
              ? config.secondaryNavigation
              : [
                  ...(config.storePages.offers
                    ? [{ label: t('nav.offersZone'), href: '/store/offers' as const, highlight: true }]
                    : []),
                  ...(config.storePages.wholesale
                    ? [{ label: t('nav.wholesale'), href: '/store/wholesale' as const }]
                    : []),
                ]
          }
        />
      </div>

      <StoreMobileDrawer
        open={mobileOpen}
        onClose={closeMobile}
        rtl={rtl}
        config={config}
        categories={categories}
        brands={brands}
      />
    </>
  );
}

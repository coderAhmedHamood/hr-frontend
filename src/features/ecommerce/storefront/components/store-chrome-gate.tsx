'use client';

import { usePathname } from '@/i18n/navigation';

/** Hides chrome (footer / optional tabs) on focused flows like checkout. */
export function StoreChromeGate({
  children,
  match,
}: {
  children: React.ReactNode;
  match: (pathname: string) => boolean;
}) {
  const pathname = usePathname();
  if (match(pathname)) return null;
  return children;
}

export function isCheckoutPath(pathname: string): boolean {
  return pathname.includes('/store/checkout') || pathname.endsWith('/checkout');
}

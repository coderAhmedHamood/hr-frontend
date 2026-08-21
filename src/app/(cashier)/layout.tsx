import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Toaster } from 'sonner';
import { AppShellProviders } from '@/components/layouts/app-shell-providers';
import { AuthenticatedShell } from '@/components/layouts/authenticated-shell';
import { AppErrorBoundary } from '@/components/layouts/app-error-boundary';
import { isRtlLocale } from '@/i18n/routing';

/**
 * Full-screen store stock sync shell (`/pos`) — no ERP topbar/sidebar.
 * Auth still required (same cookie / session as the rest of the admin apps).
 */
export default async function CashierLayout({ children }: { children: ReactNode }) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);
  const dir = isRtlLocale(locale) ? 'rtl' : 'ltr';

  return (
    <AppShellProviders>
      <NextIntlClientProvider messages={messages}>
        <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#eef1f4]" dir={dir}>
          <AppErrorBoundary context="pos-cashier">
            <AuthenticatedShell>{children}</AuthenticatedShell>
          </AppErrorBoundary>
          <Toaster richColors position="top-center" dir={dir} closeButton />
        </div>
      </NextIntlClientProvider>
    </AppShellProviders>
  );
}

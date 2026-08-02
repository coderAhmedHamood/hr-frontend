'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  ChevronRight,
  ClipboardList,
  Globe,
  Languages,
  Pencil,
  Power,
  RefreshCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStorefrontCustomerUi } from '@/features/ecommerce/storefront/hooks/use-storefront-customer-ui';
import { logoutPartner } from '@/features/ecommerce/storefront/lib/api/partner-auth-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import type { StorefrontLocale } from '@/i18n/routing';
function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 1);
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`;
}

export function StoreAccountClient() {
  const t = useTranslations('storefront');
  const locale = useLocale() as StorefrontLocale;
  const router = useRouter();
  const pathname = usePathname();
  const customer = useStorefrontCustomerUi((s) => s.customer);
  const accessToken = useStorefrontCustomerUi((s) => s.accessToken);
  const updateProfile = useStorefrontCustomerUi((s) => s.updateProfile);
  const clearSession = useStorefrontCustomerUi((s) => s.clearSession);
  const [hydrated, setHydrated] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editName, setEditName] = React.useState('');
  const [editPhone, setEditPhone] = React.useState('');
  const [editEmail, setEditEmail] = React.useState('');
  const [loggingOut, setLoggingOut] = React.useState(false);
  const [localePending, startLocaleTransition] = React.useTransition();

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (hydrated && !customer) {
      router.replace('/store/login');
    }
  }, [hydrated, customer, router]);

  React.useEffect(() => {
    if (customer) {
      setEditName(customer.name);
      setEditPhone(customer.phone);
      setEditEmail(customer.email);
    }
  }, [customer]);

  if (!hydrated || !customer) {
    return <div className="h-64 animate-pulse rounded-2xl bg-muted/40" />;
  }

  function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!editName.trim() || !editPhone.trim() || !editEmail.trim()) {
      toast.error(t('register.errors.emailMobileRequired'));
      return;
    }
    updateProfile({ name: editName, phone: editPhone, email: editEmail });
    setEditOpen(false);
    toast.success(t('account.profileSaved'));
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      if (accessToken) {
        await logoutPartner(accessToken);
      }
    } catch {
      /* still clear local session */
    } finally {
      clearSession();
      toast.success(t('account.logout'));
      router.push('/store/login');
      setLoggingOut(false);
    }
  }

  function switchLocale() {
    const next = locale === 'ar' ? 'en' : 'ar';
    startLocaleTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  const kindLabel =
    customer.accountKind === 'vendor'
      ? t('account.accountKindVendor')
      : customer.accountKind === 'visitor'
        ? t('account.accountKindVisitor')
        : t('account.accountKindCustomer');

  const quickLinks = [
    {
      href: '/store/orders' as const,
      title: t('account.quick.orders'),
      subtitle: t('account.quick.ordersHint'),
      icon: ClipboardList,
      meta: undefined,
    },
    {
      href: '/store/legal/returns' as const,
      title: t('account.quick.returns'),
      subtitle: t('account.quick.returnsHint'),
      icon: RefreshCcw,
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-4">
      <section className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
            {initialsFromName(customer.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate font-arabic-display text-lg font-bold text-foreground sm:text-xl">
                {t('account.hello', { name: customer.name })}
              </h1>
              <Badge variant="subtle">{kindLabel}</Badge>
            </div>
            <p className="mt-0.5 truncate text-sm text-muted-foreground" dir="ltr">
              {customer.email}
            </p>
            <p className="truncate text-sm text-muted-foreground" dir="ltr">
              {customer.phone}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0 rounded-full px-3"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="me-1 h-3.5 w-3.5" />
            {t('account.edit')}
          </Button>
        </div>

        <dl className="mt-4 grid gap-2 border-t border-border pt-4 text-sm sm:grid-cols-2">
          <div className="rounded-xl bg-muted/40 px-3 py-2">
            <dt className="text-xs text-muted-foreground">{t('account.email')}</dt>
            <dd className="mt-0.5 font-medium text-foreground" dir="ltr">
              {customer.email || '—'}
            </dd>
          </div>
          <div className="rounded-xl bg-muted/40 px-3 py-2">
            <dt className="text-xs text-muted-foreground">{t('account.mobile')}</dt>
            <dd className="mt-0.5 font-medium text-foreground" dir="ltr">
              {customer.phone || '—'}
            </dd>
          </div>
          <div className="rounded-xl bg-muted/40 px-3 py-2 sm:col-span-2">
            <dt className="text-xs text-muted-foreground">{t('account.accountKind')}</dt>
            <dd className="mt-0.5 font-medium text-foreground">{kindLabel}</dd>
          </div>
        </dl>
      </section>

      <Link
        href="/store/offers"
        prefetch={false}
        className="flex items-center justify-between gap-3 rounded-2xl border border-secondary/25 bg-secondary/10 px-4 py-3 text-sm transition-colors hover:bg-secondary/15"
      >
        <span className="font-medium text-foreground">{t('account.promoTitle')}</span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary">
          {t('account.promoCta')}
          <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        </span>
      </Link>

      <section className="grid grid-cols-2 gap-3">
        {quickLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.href}
              prefetch={false}
              className="relative rounded-2xl border border-border bg-card p-4 shadow-soft transition-colors hover:border-primary/30 hover:bg-muted/20"
            >
              <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.subtitle}</p>
              {item.meta ? (
                <span className="absolute end-3 top-3 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                  {item.meta}
                </span>
              ) : null}
            </Link>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
          {t('account.sectionSettings')}
        </h2>
        <ul>
          <li className="border-b border-border">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-primary">
                <Globe className="h-4 w-4" />
              </span>
              <span className="flex-1 text-sm font-medium text-foreground">
                {t('account.menu.country')}
              </span>
              <span className="text-sm text-muted-foreground">{t('account.countryYemen')}</span>
            </div>
          </li>
          <li>
            <button
              type="button"
              disabled={localePending}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-start transition-colors hover:bg-muted/30 disabled:opacity-70"
              onClick={switchLocale}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-primary">
                <Languages className="h-4 w-4" />
              </span>
              <span className="flex-1 text-sm font-medium text-foreground">
                {t('account.menu.language')}
              </span>
              <span className="text-sm text-muted-foreground">
                {locale === 'ar' ? t('locale.ar') : t('locale.en')}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
            </button>
          </li>
        </ul>
      </section>

      <Button
        type="button"
        variant="outline"
        className="h-12 w-full rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
        disabled={loggingOut}
        onClick={() => void handleLogout()}
      >
        <Power className="me-2 h-4 w-4" />
        {loggingOut ? t('account.loggingOut') : t('account.logout')}
      </Button>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('account.editProfile')}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={saveProfile}>
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">{t('register.name')}</Label>
              <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-phone">{t('account.mobile')}</Label>
              <Input
                id="edit-phone"
                dir="ltr"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">{t('account.email')}</Label>
              <Input
                id="edit-email"
                type="email"
                dir="ltr"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                {t('common.back')}
              </Button>
              <Button type="submit">{t('account.save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useStorefrontCustomerUi } from '@/features/ecommerce/storefront/hooks/use-storefront-customer-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, useRouter } from '@/i18n/navigation';

export function StoreLoginClient() {
  const t = useTranslations('storefront');
  const router = useRouter();
  const customer = useStorefrontCustomerUi((s) => s.customer);
  const login = useStorefrontCustomerUi((s) => s.login);

  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (customer) {
      router.replace('/store/account');
    }
  }, [customer, router]);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error(t('login.errors.required'));
      return;
    }
    setSubmitting(true);
    login({ name, phone, email });
    toast.success(t('login.success'));
    router.push('/store/account');
    setSubmitting(false);
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
        <h1 className="font-arabic-display text-xl font-semibold text-foreground">{t('login.formTitle')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('login.formDescription')}</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="store-login-name">{t('login.name')}</Label>
            <Input
              id="store-login-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="store-login-phone">{t('login.phone')}</Label>
            <Input
              id="store-login-phone"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="77xxxxxxx"
              autoComplete="tel"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="store-login-email">{t('login.email')}</Label>
            <Input
              id="store-login-email"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>

          <Button type="submit" className="h-11 w-full" disabled={submitting}>
            {submitting ? t('login.submitting') : t('login.submit')}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">{t('login.mockHint')}</p>

        <div className="mt-6 border-t border-border pt-4 text-center text-sm">
          <Link href="/store" prefetch={false} className="text-primary hover:underline">
            {t('login.continueGuest')}
          </Link>
        </div>
      </section>
    </div>
  );
}

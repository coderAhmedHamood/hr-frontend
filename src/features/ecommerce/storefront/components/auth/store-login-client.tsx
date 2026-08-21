'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { useStorefrontCustomerUi } from '@/features/ecommerce/storefront/hooks/use-storefront-customer-ui';
import { loginPartner } from '@/features/ecommerce/storefront/lib/api/partner-auth-api';
import { PartnerAuthApiError } from '@/features/ecommerce/storefront/domain/partner-auth';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import {
  resolveStoreAuthReturnTo,
  storeRegisterHref,
} from '@/features/ecommerce/storefront/lib/store-auth-return';
import { StoreAuthShell } from '@/features/ecommerce/storefront/components/auth/store-auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, useRouter } from '@/i18n/navigation';
import { useStorefrontAuthReady } from '@/features/ecommerce/storefront/hooks/use-storefront-auth-ready';

export function StoreLoginClient() {
  const t = useTranslations('storefront');
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = resolveStoreAuthReturnTo(searchParams.get('returnTo'));
  const customer = useStorefrontCustomerUi((s) => s.customer);
  const setSession = useStorefrontCustomerUi((s) => s.setSession);

  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const hydrated = useStorefrontAuthReady();


  React.useEffect(() => {
    if (hydrated && customer) {
      router.replace(returnTo);
    }
  }, [hydrated, customer, router, returnTo]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!identifier.trim() || !password) {
      toast.error(t('login.errors.required'));
      return;
    }

    setSubmitting(true);
    try {
      const session = await loginPartner({
        identifier: identifier.trim(),
        password,
        companyId: getStorefrontCompanyId(),
      });
      setSession(session);
      toast.success(session.message || t('login.success'));
      router.push(returnTo);
    } catch (error) {
      const message =
        error instanceof PartnerAuthApiError
          ? error.message
          : t('login.errors.generic');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  const checkoutReturn = returnTo.startsWith('/store/checkout');

  return (
    <StoreAuthShell
      eyebrow={t('login.eyebrow')}
      title={t('login.formTitle')}
      description={checkoutReturn ? t('login.checkoutRequiredHint') : t('login.formDescription')}
      footer={
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground">
            {t('login.noAccount')}{' '}
            <Link
              href={storeRegisterHref(returnTo)}
              prefetch={false}
              className="font-medium text-primary hover:underline"
            >
              {t('login.createAccount')}
            </Link>
          </p>
          {!checkoutReturn ? (
            <Link
              href="/store"
              prefetch={false}
              className="text-muted-foreground hover:text-foreground hover:underline"
            >
              {t('login.continueGuest')}
            </Link>
          ) : (
            <Link
              href="/store/cart"
              prefetch={false}
              className="text-muted-foreground hover:text-foreground hover:underline"
            >
              {t('login.backToCart')}
            </Link>
          )}
        </div>
      }
    >
      <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
        <div className="space-y-1.5">
          <Label htmlFor="store-login-identifier">{t('login.identifier')}</Label>
          <Input
            id="store-login-identifier"
            dir="ltr"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
            placeholder={t('login.identifierPlaceholder')}
            required
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="store-login-password">{t('login.password')}</Label>
            <Link
              href="/store/forgot-password"
              prefetch={false}
              className="text-xs text-muted-foreground hover:text-primary hover:underline"
            >
              {t('login.forgotPassword')}
            </Link>
          </div>
          <div className="relative" dir="ltr">
            <Input
              id="store-login-password"
              type={showPassword ? 'text' : 'password'}
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="pe-10"
              required
              minLength={6}
            />
            <button
              type="button"
              className="absolute end-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="h-11 w-full" disabled={submitting}>
          {submitting ? t('login.submitting') : t('login.submit')}
        </Button>
      </form>
    </StoreAuthShell>
  );
}

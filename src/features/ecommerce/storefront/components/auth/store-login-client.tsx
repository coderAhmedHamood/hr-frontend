'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import {
  useIsStorefrontAuthenticated,
  useStorefrontCustomerUi,
} from '@/features/ecommerce/storefront/hooks/use-storefront-customer-ui';
import { loginPartner } from '@/features/ecommerce/storefront/lib/api/partner-auth-api';
import { PartnerAuthApiError } from '@/features/ecommerce/storefront/domain/partner-auth';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import {
  resolveStoreAuthReturnTo,
  storeLoginHref,
  storeRegisterHref,
} from '@/features/ecommerce/storefront/lib/store-auth-return';
import { useStoreCountry } from '@/features/ecommerce/storefront/hooks/use-store-country';
import { StoreAuthShell } from '@/features/ecommerce/storefront/components/auth/store-auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, useRouter } from '@/i18n/navigation';
import { useStorefrontAuthReady } from '@/features/ecommerce/storefront/hooks/use-storefront-auth-ready';
import { customerErrorText } from '@/features/ecommerce/storefront/lib/customer-error';

export function StoreLoginClient() {
  const t = useTranslations('storefront');
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = resolveStoreAuthReturnTo(searchParams.get('returnTo'));
  const authenticated = useIsStorefrontAuthenticated();
  const setSession = useStorefrontCustomerUi((s) => s.setSession);

  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const hydrated = useStorefrontAuthReady();
  const country = useStoreCountry();

  React.useEffect(() => {
    if (hydrated && authenticated) {
      router.replace(returnTo);
    }
  }, [hydrated, authenticated, router, returnTo]);

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
      toast.error(customerErrorText(error, t('login.errors.generic')));
    } finally {
      setSubmitting(false);
    }
  }

  const checkoutReturn = returnTo.startsWith('/store/checkout');

  return (
    <StoreAuthShell
      eyebrow={t('login.eyebrow')}
      title={t('login.formTitle')}
      description={checkoutReturn ? t('login.checkoutRequiredHint') : undefined}
      tabs={{
        active: 'login',
        loginHref: storeLoginHref(returnTo),
        registerHref: storeRegisterHref(returnTo),
        loginLabel: t('authTabs.login'),
        registerLabel: t('authTabs.register'),
        ariaLabel: t('authTabs.aria'),
      }}
      footer={
        <div className="flex flex-col gap-3">
          <p className="text-muted-foreground">{t('login.noAccount')}</p>
          <Button asChild variant="outline" className="h-11 w-full gap-2">
            <Link href={storeRegisterHref(returnTo)} prefetch={false}>
              <UserPlus className="h-4 w-4" aria-hidden />
              {t('login.createAccountCta')}
            </Link>
          </Button>
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
            placeholder={t('login.identifierPlaceholder', {
              example: `0${country.mobileExample ?? ''}`,
            })}
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
              placeholder={t('login.passwordPlaceholder')}
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
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {t('login.noStoreAccount')}{' '}
            <Link
              href={storeRegisterHref(returnTo)}
              prefetch={false}
              className="font-medium text-primary hover:underline"
            >
              {t('login.createAccountInline')}
            </Link>
          </p>
        </div>

        <Button type="submit" className="h-11 w-full" disabled={submitting}>
          {submitting ? t('login.submitting') : t('login.submit')}
        </Button>
      </form>
    </StoreAuthShell>
  );
}

'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { useStorefrontCustomerUi } from '@/features/ecommerce/storefront/hooks/use-storefront-customer-ui';
import {
  isPartnerAuthHttpEnabled,
  registerPartner,
} from '@/features/ecommerce/storefront/lib/api/partner-auth-api';
import { PartnerAuthApiError } from '@/features/ecommerce/storefront/domain/partner-auth';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { StoreAuthShell } from '@/features/ecommerce/storefront/components/auth/store-auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, useRouter } from '@/i18n/navigation';

export function StoreRegisterClient() {
  const t = useTranslations('storefront');
  const router = useRouter();
  const customer = useStorefrontCustomerUi((s) => s.customer);
  const setSession = useStorefrontCustomerUi((s) => s.setSession);

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [mobile, setMobile] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (customer) {
      router.replace('/store/account');
    }
  }, [customer, router]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (name.trim().length < 2) {
      toast.error(t('register.errors.nameMin'));
      return;
    }
    if (!email.trim() || !mobile.trim()) {
      toast.error(t('register.errors.emailMobileRequired'));
      return;
    }
    if (password.length < 6) {
      toast.error(t('register.errors.passwordMin'));
      return;
    }

    setSubmitting(true);
    try {
      const session = await registerPartner({
        companyId: getStorefrontCompanyId(),
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        password,
        accountKind: 'customer',
      });
      setSession(session);
      toast.success(session.message || t('register.success'));
      router.push('/store/account');
    } catch (error) {
      const message =
        error instanceof PartnerAuthApiError
          ? error.message
          : t('register.errors.generic');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <StoreAuthShell
      eyebrow={t('register.eyebrow')}
      title={t('register.formTitle')}
      description={t('register.formDescription')}
      footer={
        <p className="text-muted-foreground">
          {t('register.hasAccount')}{' '}
          <Link href="/store/login" prefetch={false} className="font-medium text-primary hover:underline">
            {t('register.signIn')}
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
        <div className="space-y-1.5">
          <Label htmlFor="store-register-name">{t('register.name')}</Label>
          <Input
            id="store-register-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
            minLength={2}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="store-register-email">{t('register.email')}</Label>
          <Input
            id="store-register-email"
            type="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="store-register-mobile">{t('register.mobile')}</Label>
          <Input
            id="store-register-mobile"
            dir="ltr"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            autoComplete="tel"
            placeholder="0501234567"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="store-register-password">{t('register.password')}</Label>
          <div className="relative">
            <Input
              id="store-register-password"
              type={showPassword ? 'text' : 'password'}
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
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
          <p className="text-[11px] text-muted-foreground">{t('register.passwordHint')}</p>
        </div>

        <Button type="submit" className="h-11 w-full" disabled={submitting}>
          {submitting ? t('register.submitting') : t('register.submit')}
        </Button>
      </form>

      {!isPartnerAuthHttpEnabled() ? (
        <p className="mt-4 text-center text-xs text-muted-foreground">{t('register.mockHint')}</p>
      ) : null}
    </StoreAuthShell>
  );
}

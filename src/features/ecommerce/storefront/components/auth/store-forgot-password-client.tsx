'use client';

import { useTranslations } from 'next-intl';
import { StoreAuthShell } from '@/features/ecommerce/storefront/components/auth/store-auth-shell';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

export function StoreForgotPasswordClient() {
  const t = useTranslations('storefront');

  return (
    <StoreAuthShell
      eyebrow={t('forgotPassword.eyebrow')}
      title={t('forgotPassword.title')}
      description={t('forgotPassword.description')}
      footer={
        <Link href="/store/login" prefetch={false} className="font-medium text-primary hover:underline">
          {t('forgotPassword.backToLogin')}
        </Link>
      }
    >
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
        <p className="text-sm font-medium text-foreground">{t('account.comingSoon')}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t('forgotPassword.hint')}</p>
      </div>
      <Button asChild className="mt-4 h-11 w-full" variant="outline">
        <Link href="/store/login" prefetch={false}>
          {t('forgotPassword.backToLogin')}
        </Link>
      </Button>
    </StoreAuthShell>
  );
}

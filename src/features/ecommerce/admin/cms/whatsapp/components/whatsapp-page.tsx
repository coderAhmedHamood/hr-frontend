'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ExternalLink, MessageCircle, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { openWhatsappWeb } from '@/features/ecommerce/admin/cms/whatsapp/lib/whatsapp-web';
import { Button } from '@/components/ui/button';

export function WhatsappPage() {
  const t = useTranslations('ecommerceAdmin.whatsapp');
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get('phone');
  const openedPhoneRef = React.useRef<string | null>(null);

  function openHome() {
    const win = openWhatsappWeb();
    if (!win) {
      toast.error(t('popupBlocked'));
      return;
    }
    toast.message(t('openedHomeHint'));
  }

  function openCustomer(phone: string) {
    const win = openWhatsappWeb({ phone });
    if (!win) {
      toast.error(t('popupBlocked'));
    }
  }

  React.useEffect(() => {
    if (!phoneParam?.trim() || openedPhoneRef.current === phoneParam) return;
    openedPhoneRef.current = phoneParam;
    openCustomer(phoneParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open once per phone query
  }, [phoneParam]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <SetPageTitle titleAr={t('title')} descriptionAr={t('subtitle')} iconName="MessageCircle" />

      <div>
        <h1 className="font-arabic-display text-xl font-bold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-card p-8 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <QrCode className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">{t('openTitle')}</h2>
          <p className="max-w-md text-sm text-muted-foreground">{t('openHint')}</p>
        </div>

        <ol className="w-full max-w-md space-y-2 text-start text-sm text-muted-foreground">
          <li>1. {t('step1')}</li>
          <li>2. {t('step2')}</li>
          <li>3. {t('step3')}</li>
        </ol>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button type="button" className="gap-2" onClick={openHome}>
            <ExternalLink className="h-4 w-4" />
            {t('openWhatsappWeb')}
          </Button>
          {phoneParam?.trim() ? (
            <Button
              type="button"
              variant="secondary"
              className="gap-2"
              onClick={() => openCustomer(phoneParam)}
            >
              <MessageCircle className="h-4 w-4" />
              {t('openCustomerChat')}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

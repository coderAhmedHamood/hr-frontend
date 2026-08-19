'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { ExternalLink, MessageCircle, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { openWhatsappWeb } from '@/features/ecommerce/admin/cms/whatsapp/lib/whatsapp-web';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/shared/utils';

type Props = {
  phone: string;
  customerName?: string | null;
  orderId?: string;
  className?: string;
  /** Stop row click / card navigation when used inside clickable parents */
  stopPropagation?: boolean;
};

/** Order phone chip → confirm → open WhatsApp Web (reuses one named window). */
export function WhatsappPhoneAction({
  phone,
  customerName,
  className,
  stopPropagation = true,
}: Props) {
  const t = useTranslations('ecommerceAdmin.whatsapp');
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  if (!phone?.trim()) return null;

  function onPhoneClick(event: React.MouseEvent) {
    if (stopPropagation) {
      event.preventDefault();
      event.stopPropagation();
    }
    setConfirmOpen(true);
  }

  function openChat() {
    setConfirmOpen(false);
    const win = openWhatsappWeb({ phone });
    if (!win) toast.error(t('popupBlocked'));
  }

  return (
    <>
      <button
        type="button"
        onClick={onPhoneClick}
        className={cn(
          'inline-flex items-center gap-1 text-xs font-semibold tabular-nums text-primary hover:underline',
          className,
        )}
        dir="ltr"
      >
        <Phone className="h-3 w-3" />
        {phone}
      </button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <MessageCircle className="h-5 w-5 text-primary" />
              {t('confirmTitle')}
            </DialogTitle>
            <DialogDescription>{t('confirmDescription')}</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-foreground" dir="ltr">
            {customerName ? `${customerName} · ` : ''}
            {phone}
          </p>
          <DialogFooter className="flex flex-row flex-wrap justify-start gap-2 sm:justify-start">
            <Button type="button" className="gap-1.5" onClick={openChat}>
              <ExternalLink className="h-3.5 w-3.5" />
              {t('confirmOpen')}
            </Button>
            <Button type="button" variant="outline" asChild>
              <a href={`tel:${phone.replace(/\s/g, '')}`}>{t('confirmCall')}</a>
            </Button>
            <Button type="button" variant="ghost" onClick={() => setConfirmOpen(false)}>
              {t('confirmCancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

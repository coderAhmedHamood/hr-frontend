'use client';

import * as React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { submitStorefrontContactMessage } from '@/features/ecommerce/storefront/lib/contact-actions';

export function ContactForm() {
  const t = useTranslations('storefront');
  const [submitted, setSubmitted] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    try {
      const result = await submitStorefrontContactMessage({
        name: String(data.get('name') ?? ''),
        email: String(data.get('email') ?? ''),
        message: String(data.get('message') ?? ''),
      });
      if (!result.ok) {
        toast.error(t('contact.formError'));
        return;
      }
      setSubmitted(true);
    } catch {
      toast.error(t('contact.formError'));
    } finally {
      setPending(false);
    }
  }

  if (submitted) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/70 bg-card px-6 py-14 text-center"
        role="status"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-7 w-7" aria-hidden />
        </span>
        <p className="max-w-sm text-sm font-medium leading-relaxed text-foreground">
          {t('contact.formSuccess')}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-2xl border border-border/70 bg-card p-5 sm:p-6"
    >
      <div>
        <h2 className="text-base font-semibold text-foreground">{t('contact.formTitle')}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t('contact.formNote')}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-name">{t('contact.formName')}</Label>
        <Input
          id="contact-name"
          name="name"
          required
          autoComplete="name"
          className="h-12 rounded-xl"
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-email">{t('contact.formEmail')}</Label>
        <Input
          id="contact-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          dir="ltr"
          className="h-12 rounded-xl text-right"
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-message">{t('contact.formMessage')}</Label>
        <Textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          className="min-h-32 rounded-xl"
          disabled={pending}
        />
      </div>
      <Button type="submit" className="h-12 rounded-xl" disabled={pending}>
        {pending ? t('contact.formSubmitting') : t('contact.formSubmit')}
      </Button>
    </form>
  );
}

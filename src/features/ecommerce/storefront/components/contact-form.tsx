'use client';

import * as React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ContactForm() {
  const t = useTranslations('storefront');
  const [submitted, setSubmitted] = React.useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 text-center" role="status">
        <CheckCircle2 className="h-10 w-10 text-success" aria-hidden />
        <p className="text-sm font-medium text-foreground">{t('contact.formSuccess')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="contact-name" className="text-sm font-medium text-foreground">
          {t('contact.formName')}
        </label>
        <input
          id="contact-name"
          name="name"
          required
          className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none ring-primary/20 focus:ring-2"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="contact-email" className="text-sm font-medium text-foreground">
          {t('contact.formEmail')}
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none ring-primary/20 focus:ring-2"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="contact-message" className="text-sm font-medium text-foreground">
          {t('contact.formMessage')}
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
        />
      </div>
      <p className="text-xs text-muted-foreground">{t('contact.formNote')}</p>
      <button
        type="submit"
        className="inline-flex h-11 items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        {t('contact.formSubmit')}
      </button>
    </form>
  );
}

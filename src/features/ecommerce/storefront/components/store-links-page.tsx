'use client';

import * as React from 'react';
import { Mail, Phone, Store } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { StoreCsrError, StoreCsrLoading } from '@/features/ecommerce/storefront/components/store-csr-status';
import {
  STOREFRONT_SOCIAL_ICONS,
  type StorefrontSocialNetwork,
} from '@/features/ecommerce/storefront/components/store-social-icons';
import { COMPANY_SOCIAL_NETWORKS } from '@/features/ecommerce/storefront/domain/company-config';
import type { StorefrontCompanyConfig } from '@/features/ecommerce/storefront/domain/storefront-models';
import { clientStorefrontData } from '@/features/ecommerce/storefront/lib/client-storefront-data';
import { resolveUploadUrl } from '@/shared/resolve-upload-url';
import type { StorefrontLocale } from '@/i18n/routing';

const SOCIAL_LABEL_KEYS = {
  instagram: 'socialInstagram',
  twitter: 'socialTwitter',
  facebook: 'socialFacebook',
  whatsapp: 'socialWhatsapp',
  tiktok: 'socialTiktok',
  youtube: 'socialYoutube',
  snapchat: 'socialSnapchat',
  linkedin: 'socialLinkedin',
} as const satisfies Record<StorefrontSocialNetwork, string>;

type LinkRow = {
  id: string;
  label: string;
  href: string;
  external: boolean;
  icon: React.ReactNode;
};

function LinkButton({ row, featured }: { row: LinkRow; featured?: boolean }) {
  const className = featured
    ? 'flex items-center gap-3 rounded-2xl border-2 border-primary bg-primary px-4 py-3.5 text-primary-foreground shadow-soft'
    : 'flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-foreground shadow-sm transition-colors hover:border-primary/40';
  const iconBox = featured
    ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15'
    : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground';
  const body = (
    <>
      <span className={iconBox}>{row.icon}</span>
      <span className="flex-1 text-center text-sm font-semibold">{row.label}</span>
      <span className="h-10 w-10 shrink-0" aria-hidden />
    </>
  );
  if (row.external) {
    return (
      <a href={row.href} target="_blank" rel="noopener noreferrer" className={className}>
        {body}
      </a>
    );
  }
  return (
    <Link href="/store" prefetch={false} className={className}>
      {body}
    </Link>
  );
}

export function StoreLinksPage({ config }: { config: StorefrontCompanyConfig }) {
  const t = useTranslations('storefront.links');
  const tA11y = useTranslations('storefront.a11y');
  const [logoFailed, setLogoFailed] = React.useState(false);
  const logoSrc = config.logoUrl ? resolveUploadUrl(config.logoUrl) : '';
  const showLogo = Boolean(logoSrc) && !logoFailed;
  const tagline = config.footer.tagline.trim();

  const socials = COMPANY_SOCIAL_NETWORKS.flatMap((network) => {
    const url = config.social[network]?.trim();
    if (!url) return [];
    const Icon = STOREFRONT_SOCIAL_ICONS[network];
    return [{ network, url, Icon, label: tA11y(SOCIAL_LABEL_KEYS[network]) }];
  });

  const rows: LinkRow[] = [
    {
      id: 'store',
      label: t('store'),
      href: '/store',
      external: false,
      icon: <Store className="h-5 w-5" aria-hidden />,
    },
  ];
  if (config.contact.phone?.trim()) {
    rows.push({
      id: 'phone',
      label: t('phone'),
      href: `tel:${config.contact.phone.trim()}`,
      external: true,
      icon: <Phone className="h-5 w-5" aria-hidden />,
    });
  }
  if (config.contact.email?.trim()) {
    rows.push({
      id: 'email',
      label: t('email'),
      href: `mailto:${config.contact.email.trim()}`,
      external: true,
      icon: <Mail className="h-5 w-5" aria-hidden />,
    });
  }
  for (const social of socials) {
    const Icon = social.Icon;
    rows.push({
      id: social.network,
      label: social.label,
      href: social.url,
      external: true,
      icon: <Icon className="h-5 w-5" />,
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 pb-10">
      {showLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoSrc}
          alt=""
          className="h-24 w-24 rounded-full bg-card object-contain p-2 shadow-soft"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary text-3xl font-black text-secondary-foreground shadow-soft">
          {config.name.charAt(0)}
        </span>
      )}

      <div className="space-y-2 text-center">
        <h1 className="font-arabic-display text-2xl font-bold text-foreground">{config.name}</h1>
        {tagline ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{tagline}</p>
        ) : null}
      </div>

      {socials.length > 0 ? (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {socials.map((social) => {
            const Icon = social.Icon;
            return (
              <a
                key={social.network}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:border-primary/40"
              >
                <Icon className="h-5 w-5" />
              </a>
            );
          })}
        </div>
      ) : null}

      <div className="flex w-full flex-col gap-3">
        {rows.map((row) => (
          <LinkButton key={row.id} row={row} featured={row.id === 'store'} />
        ))}
      </div>
    </div>
  );
}

export function StoreLinksPageCsr() {
  const locale = useLocale() as StorefrontLocale;
  const [config, setConfig] = React.useState<StorefrontCompanyConfig | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void clientStorefrontData.getConfig(locale).then(
      (next) => {
        if (cancelled) return;
        if (!next) setError('NOT_FOUND');
        else setConfig(next);
      },
      () => {
        if (!cancelled) setError('FAILED');
      },
    );
    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (error) return <StoreCsrError />;
  if (!config) return <StoreCsrLoading />;
  return <StoreLinksPage config={config} />;
}

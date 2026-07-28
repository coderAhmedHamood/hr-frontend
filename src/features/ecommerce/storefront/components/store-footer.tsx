import { getTranslations } from 'next-intl/server';
import { Mail, MapPin, Phone } from 'lucide-react';
import type {
  StorefrontCategory,
  StorefrontCompanyConfig,
} from '@/features/ecommerce/storefront/domain/storefront-models';
import { buildCategoryTree } from '@/features/ecommerce/storefront/utils/category-tree';
import { StoreFooterUtilities } from '@/features/ecommerce/storefront/components/store-footer-utilities';
import {
  STOREFRONT_SOCIAL_ICONS,
  type StorefrontSocialNetwork,
} from '@/features/ecommerce/storefront/components/store-social-icons';
import { Link } from '@/i18n/navigation';

const SOCIAL_LABEL_KEYS = {
  instagram: 'socialInstagram',
  twitter: 'socialTwitter',
  facebook: 'socialFacebook',
  whatsapp: 'socialWhatsapp',
} as const satisfies Record<StorefrontSocialNetwork, string>;

export async function StoreFooter({
  config,
  categories,
}: {
  config: StorefrontCompanyConfig;
  categories: StorefrontCategory[];
}) {
  const t = await getTranslations('storefront');
  const { roots } = buildCategoryTree(categories);

  return (
    <footer className="mt-auto border-t border-border bg-muted/40 text-foreground">
      <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-12 lg:gap-10">
          <div className="col-span-2 flex flex-col gap-4 lg:col-span-4">
            <p className="font-arabic-display text-xl font-bold text-foreground">{config.name}</p>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{t('footer.tagline')}</p>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              {config.contact.phone ? (
                <a href={`tel:${config.contact.phone}`} className="inline-flex items-center gap-2 hover:text-foreground">
                  <Phone className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  {config.contact.phone}
                </a>
              ) : null}
              {config.contact.email ? (
                <a href={`mailto:${config.contact.email}`} className="inline-flex items-center gap-2 hover:text-foreground">
                  <Mail className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  {config.contact.email}
                </a>
              ) : null}
              {config.contact.address ? (
                <span className="inline-flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  {config.contact.address}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {(Object.entries(config.social) as [StorefrontSocialNetwork, string | undefined][])
                .filter((entry): entry is [StorefrontSocialNetwork, string] => Boolean(entry[1]))
                .map(([network, url]) => {
                  const Icon = STOREFRONT_SOCIAL_ICONS[network];
                  if (!Icon) return null;
                  const label = t(`a11y.${SOCIAL_LABEL_KEYS[network]}`);
                  return (
                    <a
                      key={network}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted hover:text-foreground"
                      aria-label={label}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
            </div>
          </div>

          {config.footer.linkGroups.map((group) => (
            <div key={group.id} className="flex flex-col gap-3 lg:col-span-2">
              <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
              <ul className="flex flex-col gap-2">
                {group.links.map((link, linkIndex) => (
                  <li key={`${group.id}-${linkIndex}`}>
                    <Link
                      href={link.href}
                      prefetch={false}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="flex flex-col gap-3 lg:col-span-2">
            <h3 className="text-sm font-semibold text-foreground">{t('footer.accountLinks')}</h3>
            <ul className="flex flex-col gap-2">
              <li>
                <Link
                  href="/store/orders"
                  prefetch={false}
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {t('orders.myOrdersTitle')}
                </Link>
              </li>
              <li>
                <Link
                  href="/store/account"
                  prefetch={false}
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {t('account.title')}
                </Link>
              </li>
              <li>
                <Link
                  href="/store/login"
                  prefetch={false}
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {t('nav.login')}
                </Link>
              </li>
              <li>
                <Link
                  href="/store/wishlist"
                  prefetch={false}
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {t('nav.wishlist')}
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 lg:col-span-2">
            <h3 className="text-sm font-semibold text-foreground">{t('nav.categories')}</h3>
            <ul className="flex flex-col gap-2">
              {roots.slice(0, 7).map((root) => (
                <li key={root.id}>
                  <Link
                    href={`/store/categories/${root.slug}`}
                    prefetch={false}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {root.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
          <StoreFooterUtilities />
          <div className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {config.footer.copyrightOwnerName}
            {config.footer.commercialRegistration ? (
              <span className="ms-2">
                · {t('footer.cr')}: {config.footer.commercialRegistration}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}

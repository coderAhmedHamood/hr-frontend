import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';
import { LOCALE_COOKIE_NAME, MESSAGE_NAMESPACES } from './config';

async function loadMessages(locale: string) {
  const modules = await Promise.all(
    MESSAGE_NAMESPACES.map((namespace) => import(`../../messages/${locale}/${namespace}.json`)),
  );

  return MESSAGE_NAMESPACES.reduce<Record<string, unknown>>((messages, namespace, index) => {
    messages[namespace] = modules[index].default;
    return messages;
  }, {});
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;

  // Storefront requests carry a locale via the `[locale]` segment (middleware-resolved).
  // Admin requests carry none — resolve from the persisted locale Cookie instead, falling
  // back to the default locale. Never infer from `Accept-Language` beyond seeding that
  // Cookie on first visit; every subsequent request must trust the Cookie, not the header,
  // so the resolved locale stays stable and matches what SSR rendered.
  let locale = hasLocale(routing.locales, requested) ? requested : undefined;

  if (!locale) {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
    locale = hasLocale(routing.locales, cookieLocale) ? cookieLocale : routing.defaultLocale;
  }

  return {
    locale,
    messages: await loadMessages(locale),
  };
});

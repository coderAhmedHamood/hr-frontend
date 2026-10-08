/**
 * Typos of the well-known mail providers (`@gmaic.com`, `@hotmial.com`,
 * `@gmail.co`). Many of these domains exist (squatters), so a DNS check
 * alone lets them through. The storefront shows the same suggestion
 * (hr-backend `core/email/email-typos.ts` refuses them — keep both lists in step).
 *
 * A company domain (`@cleanlife.sa`) is never a typo: only a domain one or
 * two letters away from a provider below is.
 */
const PROVIDERS = [
  'gmail.com',
  'googlemail.com',
  'hotmail.com',
  'outlook.com',
  'yahoo.com',
  'icloud.com',
  'protonmail.com',
];

/** Real domains that look like a provider typo. */
const KNOWN = new Set([
  ...PROVIDERS,
  'ymail.com',
  'mail.com',
  'email.com',
  'gmx.com',
  'live.com',
  'msn.com',
  'me.com',
  'mac.com',
  'aol.com',
  'yahoo.fr',
  'yahoo.co.uk',
  'hotmail.fr',
  'hotmail.co.uk',
  'outlook.sa',
  'outlook.fr',
  'yandex.com',
  'zoho.com',
  'proton.me',
  'rocketmail.com',
]);

/** Edit distance with swapped neighbours as one edit. */
function distance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0,
    ),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/** The provider the domain was probably meant to be, or null. */
export function suggestEmailDomain(domain: string): string | null {
  const value = domain.trim().toLowerCase();
  if (!value || KNOWN.has(value)) return null;
  // A provider's country domain (hotmail.de, outlook.es) is real; .co .cm .om
  // are the usual slips of .com.
  const [name, tld, ...rest] = value.split('.');
  if (
    rest.length === 0 &&
    tld?.length === 2 &&
    !['co', 'cm', 'om'].includes(tld) &&
    PROVIDERS.some((p) => p.split('.')[0] === name)
  ) {
    return null;
  }
  let best: { domain: string; d: number } | null = null;
  for (const provider of PROVIDERS) {
    const max = provider.length <= 10 ? 1 : 2;
    const d = distance(value, provider);
    if (d <= max && (!best || d < best.d)) best = { domain: provider, d };
  }
  return best?.domain ?? null;
}

/** The whole email with the suggested domain, or null. */
export function suggestEmail(email: string): string | null {
  const at = email.lastIndexOf('@');
  if (at < 1) return null;
  const domain = suggestEmailDomain(email.slice(at + 1));
  return domain ? `${email.slice(0, at)}@${domain}` : null;
}

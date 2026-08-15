const BILLING_DISABLED_KEY = 'gmaps-billing-disabled';

function flattenConsoleArgs(args: unknown[]): string {
  return args
    .map((arg) => {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return `${arg.name} ${arg.message}`;
      if (arg && typeof arg === 'object' && 'message' in arg) {
        return String((arg as { message: unknown }).message ?? '');
      }
      try {
        return String(arg);
      } catch {
        return '';
      }
    })
    .join(' ');
}

/** Maps JS failed to load — hide the map for the rest of the session. */
function messageLooksLikeMapsBillingError(args: unknown[]): boolean {
  const text = flattenConsoleArgs(args);
  const lower = text.toLowerCase();
  return (
    lower.includes('billingnotenabledmaperror') ||
    lower.includes('billingnotenabled') ||
    (lower.includes('google maps javascript api error') && lower.includes('billing'))
  );
}

/**
 * Geocoding / Places still log when project billing is off, even if the map tiles loaded.
 * Mute those notices so Next.js does not treat them as app crashes.
 */
function messageLooksLikeMapsPlatformBillingNotice(args: unknown[]): boolean {
  if (messageLooksLikeMapsBillingError(args)) return true;
  const text = flattenConsoleArgs(args);
  const lower = text.toLowerCase();
  return (
    lower.includes('gmp-get-started') ||
    (lower.includes('enable billing') &&
      (lower.includes('google') ||
        lower.includes('geocoding') ||
        lower.includes('places') ||
        lower.includes('cloud project'))) ||
    (lower.includes('billing') && lower.includes('cloud.google.com'))
  );
}

export function isGoogleMapsBillingDisabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(BILLING_DISABLED_KEY) === '1';
  } catch {
    return false;
  }
}

export function markGoogleMapsBillingDisabled(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(BILLING_DISABLED_KEY, '1');
  } catch {
    // ignore quota / private mode
  }
}

/** Mute Google’s BillingNotEnabledMapError / Geocoding billing console spam while Maps is probing. */
export function suppressGoogleMapsBillingConsoleErrors(): () => void {
  const originalError = console.error.bind(console);
  const originalWarn = console.warn.bind(console);

  console.error = (...args: unknown[]) => {
    if (messageLooksLikeMapsBillingError(args)) {
      markGoogleMapsBillingDisabled();
      return;
    }
    if (messageLooksLikeMapsPlatformBillingNotice(args)) {
      return;
    }
    originalError(...args);
  };

  console.warn = (...args: unknown[]) => {
    if (messageLooksLikeMapsBillingError(args)) {
      markGoogleMapsBillingDisabled();
      return;
    }
    if (messageLooksLikeMapsPlatformBillingNotice(args)) {
      return;
    }
    originalWarn(...args);
  };

  return () => {
    console.error = originalError;
    console.warn = originalWarn;
  };
}

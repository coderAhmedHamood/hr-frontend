const BILLING_DISABLED_KEY = 'gmaps-billing-disabled';

function messageLooksLikeMapsBillingError(args: unknown[]): boolean {
  return args.some((arg) => {
    if (typeof arg === 'string') {
      return (
        arg.includes('BillingNotEnabledMapError') ||
        (arg.includes('Google Maps JavaScript API error') && arg.includes('Billing'))
      );
    }
    if (arg instanceof Error) {
      return (
        arg.message.includes('BillingNotEnabledMapError') ||
        arg.message.includes('BillingNotEnabled')
      );
    }
    return false;
  });
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

/** Mute Google’s BillingNotEnabledMapError console spam while Maps is probing. */
export function suppressGoogleMapsBillingConsoleErrors(): () => void {
  const originalError = console.error.bind(console);
  const originalWarn = console.warn.bind(console);

  console.error = (...args: unknown[]) => {
    if (messageLooksLikeMapsBillingError(args)) {
      markGoogleMapsBillingDisabled();
      return;
    }
    originalError(...args);
  };

  console.warn = (...args: unknown[]) => {
    if (messageLooksLikeMapsBillingError(args)) {
      markGoogleMapsBillingDisabled();
      return;
    }
    originalWarn(...args);
  };

  return () => {
    console.error = originalError;
    console.warn = originalWarn;
  };
}

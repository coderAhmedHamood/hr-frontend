const CHECKOUT_ATTEMPTS = 'store-checkout-attempts';
const ATTEMPT_TTL_MS = 30 * 60_000;

/** A short, stable hash of a string (FNV-1a), for a key per order content. */
function contentHash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

function freshKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `order-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * One Idempotency-Key per checkout attempt, kept in the customer's browser
 * (the order is sent from a server action, which has no sessionStorage):
 * sending the same order again (after the network dropped the answer, or
 * from a second tab) reuses its key, so the server returns the order it
 * already made instead of a second one. A changed cart, address or payment
 * is a new attempt; a placed order ends its attempt.
 */
export function checkoutAttemptKey(content: unknown): {
  key: string;
  done: () => void;
} {
  const hash = contentHash(JSON.stringify(content));
  let store: Record<string, { key: string; at: number }> = {};
  try {
    store = JSON.parse(
      window.localStorage.getItem(CHECKOUT_ATTEMPTS) ?? '{}',
    ) as typeof store;
  } catch {
    store = {};
  }
  const now = Date.now();
  for (const [h, entry] of Object.entries(store)) {
    if (now - entry.at > ATTEMPT_TTL_MS) delete store[h];
  }
  const key = store[hash]?.key ?? freshKey();
  store[hash] = { key, at: now };
  const save = () => {
    try {
      window.localStorage.setItem(CHECKOUT_ATTEMPTS, JSON.stringify(store));
    } catch {
      /* private mode: the key lives for this attempt only */
    }
  };
  save();
  return {
    key,
    done: () => {
      delete store[hash];
      save();
    },
  };
}

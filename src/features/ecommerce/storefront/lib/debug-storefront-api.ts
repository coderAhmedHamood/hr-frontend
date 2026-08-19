/**
 * Server-only storefront API debug logging.
 * Enable with STOREFRONT_API_DEBUG=true in .env (not NEXT_PUBLIC_*).
 * Logs appear in the Next.js terminal, not the browser Network tab.
 */
export function isStorefrontApiDebugEnabled(): boolean {
  const value = process.env.STOREFRONT_API_DEBUG?.trim().toLowerCase();
  return value === 'true' || value === '1';
}

export function logStorefrontApi(input: {
  method?: string;
  url: string;
  status?: number | null;
  ok?: boolean;
  data?: unknown;
  error?: unknown;
}): void {
  if (!isStorefrontApiDebugEnabled()) return;

  const method = input.method ?? 'GET';
  const statusLabel = input.status == null ? '—' : String(input.status);
  const prefix = `[storefront-api] ${method} ${input.url} → ${statusLabel}`;

  if (input.error != null) {
    console.error(prefix, { error: input.error, data: input.data ?? null });
    return;
  }

  console.log(prefix, {
    ok: input.ok ?? null,
    data: input.data ?? null,
  });
}

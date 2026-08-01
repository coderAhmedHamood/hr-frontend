/** Normalize legacy single URL + array field into a clean unique list. */
export function resolvePaymentProofUrls(input: {
  paymentProofUrls?: string[] | null;
  paymentProofUrl?: string | null;
}): string[] {
  const fromArray = (input.paymentProofUrls ?? [])
    .map((url) => url?.trim())
    .filter((url): url is string => Boolean(url));
  if (fromArray.length > 0) {
    return Array.from(new Set(fromArray));
  }
  const single = input.paymentProofUrl?.trim();
  return single ? [single] : [];
}

export const MAX_PAYMENT_PROOF_FILES = 5;
export const MAX_PAYMENT_PROOF_BYTES = 4 * 1024 * 1024;

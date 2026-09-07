/** Layers expiring inside this window are flagged before they actually expire. */
export const EXPIRY_SOON_DAYS = 30;

export type BatchExpiryState = 'none' | 'expired' | 'soon' | 'ok';

export function batchExpiryState(
  expiryDate: string | undefined,
  soonDays = EXPIRY_SOON_DAYS,
): BatchExpiryState {
  if (!expiryDate) return 'none';
  const expiry = new Date(expiryDate).getTime();
  if (Number.isNaN(expiry)) return 'none';
  const now = Date.now();
  if (expiry < now) return 'expired';
  return expiry - now <= soonDays * 24 * 60 * 60 * 1000 ? 'soon' : 'ok';
}

export const BATCH_EXPIRY_LABEL_AR: Record<BatchExpiryState, string> = {
  none: 'بدون صلاحية',
  expired: 'منتهية',
  soon: 'قاربت الانتهاء',
  ok: 'سارية',
};

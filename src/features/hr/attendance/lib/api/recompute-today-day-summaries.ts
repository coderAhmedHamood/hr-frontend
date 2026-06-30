import { todayYMD } from '@/features/hr/discipline/lib/discipline-date-filter';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { attendanceDaySummariesApi } from '@/features/hr/attendance/lib/api/attendance-day-summaries';

function defaultTimezoneOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

let inFlight: Promise<void> | null = null;
let lastCompletedKey = '';
let lastCompletedAt = 0;

const RECOMPUTE_COOLDOWN_MS = 3_000;

/**
 * Recompute day summaries for today only (from = to = today).
 * Coalesces concurrent calls and skips repeat runs within a short cooldown.
 */
export async function recomputeTodayDaySummaries(companyId?: string | null): Promise<void> {
  const cid = companyId ?? getDefaultCompanyId();
  if (!cid) return;

  const today = todayYMD();
  const runKey = `${cid}:${today}`;

  if (inFlight) {
    await inFlight;
    return;
  }

  if (lastCompletedKey === runKey && Date.now() - lastCompletedAt < RECOMPUTE_COOLDOWN_MS) {
    return;
  }

  const user = useAuthStore.getState().user;

  inFlight = attendanceDaySummariesApi
    .recompute({
      companyId: cid,
      from: today,
      to: today,
      timezoneOffsetMinutes: defaultTimezoneOffsetMinutes(),
      overwriteManualOverrides: false,
      computedBy: user?.email ?? user?.id ?? null,
    })
    .then(() => {
      lastCompletedKey = runKey;
      lastCompletedAt = Date.now();
    })
    .catch(() => {
      /* background refresh — do not block callers */
    })
    .finally(() => {
      inFlight = null;
    });

  await inFlight;
}

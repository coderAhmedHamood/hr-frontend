import { publicConfig } from '@/shared/config';
import {
  extractApiErrorCode,
  extractApiErrorMessage,
  isAuthApiContext,
  resolveAuthDisplayMessage,
  translateDeviceAuthErrorCode,
} from '@/features/auth/lib/auth-api-messages';
import { ApiError } from '@/shared/api/client';
import type { ApiErrorEnvelope } from '@/shared/api/types';
import { isApiErrorEnvelope } from '@/shared/api/types';
import { toast } from 'sonner';
import { duplicateAdvanceNumberMessage, isDuplicateAdvanceNumberError } from '@/features/hr/contracts/lib/employee-advance-errors';
import {
  isCorrectionRequestContext,
  translateCorrectionRequestMessage,
} from '@/features/hr/requests/attendance-corrections/lib/correction-request-errors';
import { translateRequestApprovalMessage } from '@/features/hr/requests/lib/request-approval-errors';
import { reportError } from '@/shared/errors/report-error';
import {
  currentLoginHref,
  shouldRedirectOnUnauthorized,
} from '@/shared/navigation/login-redirect';

export type ApiErrorHandleResult = {
  /** Human-readable backend message for toasts and inline UI. */
  displayMessage: string;
  /** Full backend envelope JSON (dev console / debug panels only). */
  debugPayload: string | null;
  envelope: ApiErrorEnvelope | null;
  status: number;
  isForbidden: boolean;
};

function translateKnownBackendMessage(rawMessage: string): string | null {
  const trimmed = rawMessage.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (lower.includes('system owner cannot be marked as a company superuser')) {
    return 'مالك النظام لا يُعيَّن Superuser للشركة. عيّن مستخدم شركة عادي مربوطاً بالشركة.';
  }
  if (lower.includes('not linked to the selected company')) {
    return 'مالك النظام غير مربوط بهذه الشركة. أنشئ مستخدم شركة عادي وعيّنه صاحب الشركة؛ هو من يدير الأدوار والصلاحيات بعد دخوله.';
  }
  if (lower.includes('only company superuser') || lower.includes('only a company superuser')) {
    return 'طلب تفعيل التطبيق متاح لصاحب الشركة (Superuser) فقط.';
  }
  if (lower.includes('already enabled')) {
    return 'هذا التطبيق مفعّل مسبقاً.';
  }
  if (lower.includes('pending') && lower.includes('activation')) {
    return 'يوجد طلب تفعيل قيد الانتظار لهذا التطبيق.';
  }
  // Phase 4: the store–inventory link (store-stock-sync).
  if (lower.includes('inventory is not available right now')) {
    return 'تعذّر الوصول إلى المخازن الآن، ولم يُنفَّذ الإجراء. أعد المحاولة بعد قليل.';
  }
  if (lower.includes('store–inventory link is not enabled')) {
    return 'ربط المتجر بالمخازن غير مفعّل لهذه الشركة.';
  }
  if (lower.includes('start draining the store–inventory link')) {
    return 'ابدأ تصريف ربط المتجر بالمخازن أولاً (من إعدادات المتجر ← المخازن والمتجر)، ثم عالج الطلبات المفتوحة قبل التعطيل.';
  }
  if (lower.includes('open inventory order(s)')) {
    return 'لا يمكن تعطيل ربط المتجر بالمخازن: توجد حجوزات أو طلبات مخازن مفتوحة أو طلبات قديمة بلا مصدر. اشحنها أو ألغها أو حدّد مصدرها أولاً.';
  }
  if (lower.includes('held in the current warehouse')) {
    return 'لا يمكن تغيير مستودع المتجر وفيه حجوزات مفتوحة: اشحن تلك الطلبات أو ألغها أولاً.';
  }
  if (lower.includes("the store's warehouse is not set")) {
    return 'مستودع المتجر غير محدد: اختره من إعدادات المتجر ← المخازن والمتجر.';
  }
  if (lower.startsWith('reserved stock:')) {
    return 'الكمية محجوزة لطلبات المتجر: لا يمكن صرف ما يمس المحجوز. اصرف كمية أقل أو عالج الطلبات أولاً.';
  }
  if (lower.includes('no longer covers this order')) {
    return 'رصيد مستودع المتجر لم يعد يغطي حجز هذا الطلب (تلف أو جرد): استلم مخزوناً أو ألغِ الطلب.';
  }
  if (lower.includes('left at this location after other prepared orders')) {
    return 'الكمية في هذا الموقع لا تكفي بعد ما جُهِّز منه لطلبات أخرى. اختر موقعاً آخر في مستودع المتجر.';
  }
  if (lower.includes("prepare this order from the store's warehouse")) {
    return 'جهّز هذا الطلب من مستودع المتجر المحدد في الإعدادات.';
  }
  if (lower.includes('prepare from an active internal')) {
    return 'جهّز من موقع داخلي فعّال (صالح للبيع) في مستودع المتجر.';
  }
  if (lower.includes('choose where this order takes its stock from')) {
    return 'حدّد مصدر مخزون هذا الطلب القديم أولاً (من قسم «مخزون الطلب»).';
  }
  if (lower.includes('not enough stock in the store') && lower.includes('to ship')) {
    return 'رصيد مستودع المتجر لا يكفي لشحن هذا الطلب.';
  }
  if (lower.includes('return of this order was already received') || lower.includes('already returned its quantity')) {
    return 'تم تأكيد استلام مرتجع هذا الطلب سابقاً.';
  }
  if (lower.includes('nothing') && lower.includes('return')) {
    return 'لا توجد كمية صُرفت لهذا الطلب يمكن إرجاعها (لم يُشحن، أو أُرجعت سابقاً).';
  }
  if (lower.includes('approved opening')) {
    return 'كميات المتجر تحتاج اعتماد الكميات الافتتاحية قبل البيع المحلي.';
  }
  return null;
}

function isDevEnv() {
  const env = publicConfig.appEnv.toLowerCase();
  return env === '' || env === 'development' || env === 'dev' || env === 'local';
}

/** Pretty-print exact backend body for UI + console (dev-friendly debugging). */
export function formatApiErrorForDisplay(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.envelope) {
      return JSON.stringify(error.envelope, null, 2);
    }
    if (error.payload) {
      return JSON.stringify(error.payload, null, 2);
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Single entry for API failures. Shows toast, applies status rules.
 * Returns backend-shaped message for UI (never a generic Arabic override).
 */
export function handleApiError(
  error: unknown,
  context?: string,
  options?: { suppressRedirect?: boolean; surface?: 'page' | 'filter' | 'action' },
): ApiErrorHandleResult {
  if (!(error instanceof ApiError)) {
    const displayMessage = error instanceof Error ? error.message : String(error);
    toast.error(displayMessage);
    return { displayMessage, debugPayload: null, envelope: null, status: 0, isForbidden: false };
  }

  const envelope = error.envelope;
  const status = error.status;
  const surface = options?.surface ?? 'action';
  const isForbidden = status === 403;

  const deviceAuthMessage = translateDeviceAuthErrorCode(extractApiErrorCode(envelope));

  const rawMessage = isDuplicateAdvanceNumberError(error)
    ? duplicateAdvanceNumberMessage()
    : extractApiErrorMessage(envelope, error.message);

  const branchScopeForbidden =
    isForbidden
    && /فرع|branch|warehouse.*(scope|access)|خارج نطاق/i.test(rawMessage);

  const knownAr =
    translateKnownBackendMessage(rawMessage)
    ?? translateRequestApprovalMessage(rawMessage);

  const displayMessage = knownAr
    ? knownAr
    : deviceAuthMessage
    ? deviceAuthMessage
    : branchScopeForbidden
      ? 'لا تملك صلاحية على هذا الفرع'
      : isForbidden
      ? 'ليس لديك صلاحية للوصول إلى هذا المورد'
      : isDuplicateAdvanceNumberError(error)
        ? rawMessage
        : isCorrectionRequestContext(context)
          ? translateCorrectionRequestMessage(rawMessage)
          : resolveAuthDisplayMessage(rawMessage, context);

  // 5xx: same toast as always, plus route it into the shared logging pipeline (correlation
  // id, dev/prod formatting) so backend failures show up alongside render/route crashes.
  // 4xx never reaches here — those are expected, user-actionable outcomes, not incidents.
  if (status >= 500) {
    reportError(error, context ?? 'api-error', undefined, { skipToast: true });
  }

  const authContext = isAuthApiContext(context);
  const suppressRedirect = Boolean(options?.suppressRedirect);

  if (status === 401 && typeof window !== 'undefined' && !suppressRedirect) {
    // Storefront pages handle their own session; bouncing them to a login
    // page would fight their partner session and loop.
    if (shouldRedirectOnUnauthorized()) {
      window.location.replace(currentLoginHref());
    }
  } else {
    const skipToast =
      error.toastShown
      || ((status === 401 && suppressRedirect && !authContext)
      || (isForbidden && surface === 'page'));
    if (!skipToast) {
      toast.error(displayMessage);
    }
  }
  const debugPayload = isDevEnv() ? formatApiErrorForDisplay(error) : null;

  return { displayMessage, debugPayload, envelope, status, isForbidden };
}

export function toApiErrorEnvelope(payload: unknown, status: number, fallbackMessage: string): ApiErrorEnvelope {
  if (isApiErrorEnvelope(payload)) {
    return payload;
  }
  return {
    status,
    message: fallbackMessage,
    data: null,
    error: payload,
  };
}

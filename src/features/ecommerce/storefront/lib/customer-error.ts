/**
 * What a store customer reads when something fails (approved 2026-10-09):
 * always Arabic and never an internal id. The backend writes customer
 * messages in Arabic; anything else (an English or technical message, a
 * code, a UUID) gives way to the screen's own Arabic message.
 */
const ARABIC = /[؀-ۿ]/;
const UUID = /#?\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;

/** Known English messages a customer can meet, in Arabic. */
const KNOWN: Array<[RegExp, string]> = [
  [/failed to fetch|fetch failed|network|ECONNREFUSED|ETIMEDOUT|timeout/i, 'تعذّر الاتصال بالمتجر — تحقق من الإنترنت وحاول مرة أخرى.'],
  [/account is inactive|not active/i, 'هذا الحساب غير مفعّل — تواصل مع المتجر.'],
  [/not verified/i, 'هذا الحساب لم يُفعَّل بعد — تواصل مع المتجر.'],
  [/staff login/i, 'هذا الحساب خاص بالموظفين — سجّل الدخول من بوابة الموظفين.'],
  [/invalid (email|credentials)|password/i, 'البريد/رقم الجوال أو كلمة المرور غير صحيحة.'],
  [/already (registered|exists)/i, 'هذا الحساب مسجّل مسبقًا — سجّل الدخول بدلًا من ذلك.'],
  [/unauthori[sz]ed|token/i, 'انتهت جلستك — سجّل الدخول من جديد.'],
  [/too many requests|throttl/i, 'محاولات كثيرة — انتظر قليلًا ثم حاول مرة أخرى.'],
];

function rawMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (Array.isArray(message)) return message.join(' ');
    if (typeof message === 'string') return message;
  }
  return '';
}

export function customerErrorText(error: unknown, fallback: string): string {
  const text = rawMessage(error).trim();
  if (!text) return fallback;
  if (ARABIC.test(text)) {
    const clean = text.replace(UUID, '').replace(/\s{2,}/g, ' ').trim();
    return clean || fallback;
  }
  for (const [pattern, arabic] of KNOWN) {
    if (pattern.test(text)) return arabic;
  }
  return fallback;
}

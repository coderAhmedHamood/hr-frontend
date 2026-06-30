/** Maps backend auth API English messages to Arabic UI copy. */
const AUTH_API_MESSAGE_AR: Record<string, string> = {
  'Invalid email or password': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
  'Account is inactive': 'الحساب غير نشط. تواصل مع مسؤول النظام.',
  'Account is not verified. Please activate your account via email.':
    'الحساب غير مفعّل. فعّل حسابك عبر البريد الإلكتروني.',
  'Invalid email or verification code': 'البريد أو رمز التحقق غير صحيح',
  'Account is already activated.': 'الحساب مفعّل مسبقاً.',
  'This verification code was replaced by a newer reset request. Please use the latest code from your email.':
    'استُبدل هذا الرمز بطلب أحدث. استخدم آخر رمز وصل إلى بريدك.',
  'Verification code has expired. Please request a new password reset.':
    'انتهت صلاحية رمز التحقق. اطلب إعادة تعيين كلمة مرور جديدة.',
  'This verification code was replaced by a newer activation request. Please use the latest code from your email.':
    'استُبدل هذا الرمز بطلب تفعيل أحدث. استخدم آخر رمز وصل إلى بريدك.',
  'Verification code has expired. Please request a new activation code.':
    'انتهت صلاحية رمز التفعيل. اطلب رمزاً جديداً.',
  'Authentication required': 'يجب تسجيل الدخول أولاً',
  'User no longer exists': 'المستخدم لم يعد موجوداً',
  'Token has been revoked — please sign in again':
    'انتهت صلاحية الجلسة. سجّل الدخول مرة أخرى.',
  Unauthorized: 'غير مصرّح',
};

export const AUTH_SUCCESS_TOAST = {
  login: 'تم تسجيل الدخول بنجاح',
  logout: 'تم تسجيل الخروج بنجاح',
  passwordReset: 'تم تحديث كلمة المرور بنجاح',
  accountActivated: 'تم تفعيل الحساب بنجاح',
} as const;

export function isAuthApiContext(context?: string): boolean {
  return Boolean(context?.startsWith('auth.'));
}

export function translateAuthApiMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return trimmed;
  return AUTH_API_MESSAGE_AR[trimmed] ?? trimmed;
}

export function extractApiErrorMessage(envelope: {
  message?: string;
  error?: unknown;
} | null | undefined, fallback: string): string {
  const top = envelope?.message?.trim();
  if (top) return top;

  const nested = envelope?.error;
  if (nested && typeof nested === 'object' && 'message' in nested) {
    const nestedMessage = (nested as { message?: unknown }).message;
    if (typeof nestedMessage === 'string' && nestedMessage.trim()) {
      return nestedMessage.trim();
    }
  }

  return fallback;
}

export function resolveAuthDisplayMessage(
  rawMessage: string,
  context?: string,
): string {
  if (!isAuthApiContext(context)) return rawMessage;
  return translateAuthApiMessage(rawMessage);
}

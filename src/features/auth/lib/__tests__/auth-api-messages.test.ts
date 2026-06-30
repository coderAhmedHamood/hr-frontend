import {
  AUTH_SUCCESS_TOAST,
  translateAuthApiMessage,
} from '@/features/auth/lib/auth-api-messages';

describe('translateAuthApiMessage', () => {
  it('translates invalid login credentials', () => {
    expect(translateAuthApiMessage('Invalid email or password')).toBe(
      'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    );
  });

  it('translates inactive account', () => {
    expect(translateAuthApiMessage('Account is inactive')).toBe(
      'الحساب غير نشط. تواصل مع مسؤول النظام.',
    );
  });

  it('returns unknown messages unchanged', () => {
    expect(translateAuthApiMessage('Something else')).toBe('Something else');
  });
});

describe('AUTH_SUCCESS_TOAST', () => {
  it('defines login and logout messages', () => {
    expect(AUTH_SUCCESS_TOAST.login).toBe('تم تسجيل الدخول بنجاح');
    expect(AUTH_SUCCESS_TOAST.logout).toBe('تم تسجيل الخروج بنجاح');
  });
});

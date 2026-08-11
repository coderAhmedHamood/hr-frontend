import {
  AUTH_SUCCESS_TOAST,
  extractApiErrorCode,
  translateAuthApiMessage,
  translateDeviceAuthErrorCode,
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

  it('translates device serial required by code-as-message', () => {
    expect(translateAuthApiMessage('DEVICE_SERIAL_REQUIRED')).toContain(
      'مربوط بجهاز موقع',
    );
  });

  it('returns unknown messages unchanged', () => {
    expect(translateAuthApiMessage('Something else')).toBe('Something else');
  });
});

describe('device auth error codes', () => {
  it('maps DEVICE_SERIAL_REQUIRED', () => {
    expect(translateDeviceAuthErrorCode('DEVICE_SERIAL_REQUIRED')).toBe(
      'هذا الحساب مربوط بجهاز موقع. أرسل بصمة الجهاز (mobileSerialNumber). إذا كان جهازاً جديداً سيُطلب تفعيله حسب إعدادات الشركة قبل إكمال الدخول.',
    );
  });

  it('maps MOBILE_SERIAL_ADMIN_APPROVAL_REQUIRED', () => {
    expect(translateDeviceAuthErrorCode('MOBILE_SERIAL_ADMIN_APPROVAL_REQUIRED')).toContain(
      'موافقة الإدارة',
    );
  });

  it('extracts code from envelope.error', () => {
    expect(
      extractApiErrorCode({
        message: 'Forbidden',
        error: { code: 'MOBILE_SERIAL_VERIFICATION_REQUIRED' },
      }),
    ).toBe('MOBILE_SERIAL_VERIFICATION_REQUIRED');
  });
});

describe('AUTH_SUCCESS_TOAST', () => {
  it('defines login and logout messages', () => {
    expect(AUTH_SUCCESS_TOAST.login).toBe('تم تسجيل الدخول بنجاح');
    expect(AUTH_SUCCESS_TOAST.logout).toBe('تم تسجيل الخروج بنجاح');
  });
});

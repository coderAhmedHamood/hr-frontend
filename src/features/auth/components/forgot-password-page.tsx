'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { AuthFlowShell } from '@/features/auth/components/auth-flow-shell';
import {
  isVerificationCodeComplete,
  VerificationCodeInput,
} from '@/features/auth/components/verification-code-input';
import {
  formatResendCountdown,
  useResendCooldown,
} from '@/features/auth/hooks/use-resend-cooldown';
import {
  buildAuthFlowHref,
  useAuthFlowEmailPrefill,
} from '@/features/auth/hooks/use-auth-flow-email';
import { AUTH_SUCCESS_TOAST } from '@/features/auth/lib/auth-api-messages';
import { authApi } from '@/features/auth/lib/api/auth';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { publicConfig } from '@/shared/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const emailSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صالح'),
});

const passwordSchema = z.object({
  newPassword: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

type EmailForm = z.infer<typeof emailSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const GENERIC_SENT_MESSAGE =
  'إذا وُجد حساب نشط مرتبط بهذا البريد، فقد أُرسل رمز التحقق. تحقّق من صندوق الوارد أو مجلد الرسائل غير المرغوب فيها.';

const authFieldClass = 'h-11 rounded-full border-border bg-background text-base shadow-soft sm:h-12';
const authButtonClass =
  'h-11 w-full rounded-full text-sm font-semibold shadow-soft sm:h-12 sm:text-base';
const authFormSpacing = 'space-y-3 sm:space-y-5';

export function ForgotPasswordPage() {
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [code, setCode] = React.useState('');
  const { secondsLeft, canResend, startCooldown } = useResendCooldown(step === 2);

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  useAuthFlowEmailPrefill(emailForm.reset);
  const draftEmail = emailForm.watch('email');
  const loginHref = buildAuthFlowHref('/login', email || draftEmail);

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: '' },
  });

  React.useEffect(() => {
    if (step === 2) startCooldown();
  }, [step, startCooldown]);

  const ensureApi = () => {
    if (!publicConfig.apiUrl) {
      toast.error('لم يتم ضبط عنوان الـ API (NEXT_PUBLIC_API_URL)');
      return false;
    }
    return true;
  };

  const sendCode = async (targetEmail: string) => {
    await authApi.forgotPassword(targetEmail.trim().toLowerCase());
  };

  const onRequestCode = async (values: EmailForm) => {
    if (!ensureApi()) return;
    setLoading(true);
    try {
      const normalized = values.email.trim().toLowerCase();
      await sendCode(normalized);
      setEmail(normalized);
      emailForm.reset({ email: normalized });
      setStep(2);
      toast.message(GENERIC_SENT_MESSAGE);
    } catch (err) {
      handleApiError(err, 'auth.forgot-password', { suppressRedirect: true });
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!email || !ensureApi() || !canResend) return;
    setResending(true);
    try {
      await sendCode(email);
      startCooldown();
      toast.message(GENERIC_SENT_MESSAGE);
    } catch (err) {
      handleApiError(err, 'auth.forgot-password.resend', { suppressRedirect: true });
    } finally {
      setResending(false);
    }
  };

  const onContinueFromCode = () => {
    if (!isVerificationCodeComplete(code)) return;
    setStep(3);
  };

  const onResetPassword = async (values: PasswordForm) => {
    if (!ensureApi() || !isVerificationCodeComplete(code)) return;
    setLoading(true);
    try {
      await authApi.resetPassword({
        email,
        code,
        newPassword: values.newPassword,
      });
      setDone(true);
      toast.success(AUTH_SUCCESS_TOAST.passwordReset);
    } catch (err) {
      const { status } = handleApiError(err, 'auth.reset-password', { suppressRedirect: true });
      if (status === 401) {
        setStep(2);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFlowShell
      compactOnMobile
      backHref={loginHref}
      title={done ? 'تمت إعادة التعيين' : 'نسيت كلمة المرور؟'}
      subtitle={
        done
          ? 'يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.'
          : step === 1
            ? 'أدخل بريدك وسنرسل رمز تحقق من 6 أرقام إن وُجد حساب نشط.'
            : step === 2
              ? 'أدخل رمز التحقق المرسل إلى بريدك.'
              : 'اختر كلمة مرور جديدة لحسابك.'
      }
      mobileSubtitle={
        done
          ? undefined
          : step === 1
            ? 'أدخل بريدك لاستلام رمز التحقق.'
            : undefined
      }
      step={
        done
          ? undefined
          : {
              current: step,
              total: 3,
              labels: ['البريد الإلكتروني', 'رمز التحقق', 'كلمة المرور الجديدة'],
            }
      }
      success={
        done
          ? {
              title: 'تمت إعادة التعيين',
              description: 'تم تحديث كلمة المرور. يمكنك تسجيل الدخول الآن.',
              actionHref: loginHref,
              actionLabel: 'تسجيل الدخول',
            }
          : undefined
      }
    >
      {step === 1 ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void emailForm.handleSubmit(onRequestCode)(e);
          }}
          className={authFormSpacing}
        >
          <div className="hidden rounded-2xl border border-border/70 bg-muted/20 p-4 text-right text-xs leading-relaxed text-muted-foreground sm:block">
            لأسباب أمنية، لن نخبرك ما إذا كان البريد مسجّلاً في النظام. إذا وُجد حساب، سيصلك الرمز خلال دقائق.
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="reset-email" className="text-sm font-medium">
              البريد الإلكتروني
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              <Input
                id="reset-email"
                type="email"
                placeholder="your@email.com"
                className={`${authFieldClass} pe-4 ps-11`}
                dir="ltr"
                autoComplete="email"
                {...emailForm.register('email')}
              />
            </div>
            {emailForm.formState.errors.email ? (
              <p className="text-xs text-destructive">{emailForm.formState.errors.email.message}</p>
            ) : null}
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className={authButtonClass}
          >
            {loading ? 'جاري الإرسال…' : 'إرسال رمز التحقق'}
          </Button>
        </form>
      ) : step === 2 ? (
        <div className={authFormSpacing}>
          <div className="text-center sm:rounded-2xl sm:border sm:border-primary/20 sm:bg-primary/5 sm:p-4">
            <p className="text-xs text-muted-foreground sm:hidden">الرمز أُرسل إلى</p>
            <p className="hidden text-xs text-muted-foreground sm:block">أُرسل الرمز إلى</p>
            <p className="mt-0.5 text-sm font-medium sm:mt-1" dir="ltr">
              {email}
            </p>
            <button
              type="button"
              className="mt-1 text-xs text-primary hover:underline sm:mt-2"
              onClick={() => {
                setStep(1);
                setCode('');
                passwordForm.reset();
              }}
            >
              تغيير البريد
            </button>
          </div>

          <div className="space-y-1.5 text-center sm:space-y-2">
            <Label className="text-sm font-medium">رمز التحقق</Label>
            <VerificationCodeInput
              value={code}
              onChange={setCode}
              disabled={loading}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-1 gap-1.5 text-xs text-muted-foreground"
              disabled={resending || !canResend}
              onClick={() => void onResend()}
            >
              <RefreshCw className={resending ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
              {canResend
                ? 'إعادة إرسال الرمز'
                : `إعادة الإرسال بعد ${formatResendCountdown(secondsLeft)}`}
            </Button>
          </div>

          <Button
            type="button"
            size="lg"
            disabled={!isVerificationCodeComplete(code)}
            className={authButtonClass}
            onClick={onContinueFromCode}
          >
            متابعة
          </Button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void passwordForm.handleSubmit(onResetPassword)(e);
          }}
          className={authFormSpacing}
        >
          <div className="hidden rounded-2xl border border-border/70 bg-muted/20 p-4 text-right text-xs leading-relaxed text-muted-foreground sm:block">
            تم التحقق من الرمز. أدخل كلمة المرور الجديدة لحسابك.
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="new-password" className="text-sm font-medium">
              كلمة المرور الجديدة
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className={`${authFieldClass} px-11`}
                dir="ltr"
                autoComplete="new-password"
                autoFocus
                {...passwordForm.register('newPassword')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'إخفاء' : 'إظهار'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passwordForm.formState.errors.newPassword ? (
              <p className="text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5 sm:gap-2">
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className={authButtonClass}
            >
              {loading ? 'جاري الحفظ…' : 'تعيين كلمة مرور جديدة'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              disabled={loading}
              onClick={() => setStep(2)}
            >
              العودة لرمز التحقق
            </Button>
          </div>
        </form>
      )}

      {!done && step === 1 ? (
        <p className="mt-2 text-center text-xs text-muted-foreground sm:mt-4">
          حسابك غير مفعّل؟{' '}
          <Link
            href={buildAuthFlowHref('/login/activate', draftEmail)}
            className="font-medium text-primary hover:underline"
          >
            تفعيل الحساب
          </Link>
        </p>
      ) : null}
    </AuthFlowShell>
  );
}

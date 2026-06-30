'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, RefreshCw, ShieldCheck } from 'lucide-react';
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

const activateSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'أدخل رمزاً من 6 أرقام'),
});

type EmailForm = z.infer<typeof emailSchema>;
type ActivateForm = z.infer<typeof activateSchema>;

const GENERIC_SENT_MESSAGE =
  'إذا وُجد حساب غير مفعّل مرتبط بهذا البريد، فقد أُرسل رمز التفعيل. تحقّق من صندوق الوارد.';

const authFieldClass = 'h-11 rounded-full border-border bg-background text-base shadow-soft sm:h-12';
const authButtonClass =
  'h-11 w-full rounded-full text-sm font-semibold shadow-soft sm:h-12 sm:text-base';
const authFormSpacing = 'space-y-3 sm:space-y-5';

export function ActivateAccountPage() {
  const [step, setStep] = React.useState<1 | 2>(1);
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [code, setCode] = React.useState('');
  const { secondsLeft, canResend, startCooldown } = useResendCooldown(step === 2);

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  useAuthFlowEmailPrefill(emailForm.reset);
  const draftEmail = emailForm.watch('email');
  const loginHref = buildAuthFlowHref('/login', email || draftEmail);

  const activateForm = useForm<ActivateForm>({
    resolver: zodResolver(activateSchema),
    defaultValues: { code: '' },
  });

  React.useEffect(() => {
    activateForm.setValue('code', code, { shouldValidate: code.length === 6 });
  }, [code, activateForm]);

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
    await authApi.requestActivation(targetEmail.trim().toLowerCase());
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
      handleApiError(err, 'auth.request-activation', { suppressRedirect: true });
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
      handleApiError(err, 'auth.request-activation.resend', { suppressRedirect: true });
    } finally {
      setResending(false);
    }
  };

  const onActivate = async (values: ActivateForm) => {
    if (!ensureApi()) return;
    setLoading(true);
    try {
      await authApi.activateAccount({ email, code: values.code });
      setDone(true);
      toast.success(AUTH_SUCCESS_TOAST.accountActivated);
    } catch (err) {
      const { status } = handleApiError(err, 'auth.activate-account', { suppressRedirect: true });
      if (status === 401) {
        activateForm.setError('code', { message: 'رمز غير صحيح أو منتهٍ' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFlowShell
      compactOnMobile
      backHref={loginHref}
      title={done ? 'تم التفعيل' : 'تفعيل الحساب'}
      subtitle={
        done
          ? 'حسابك أصبح مفعّلاً. يمكنك تسجيل الدخول الآن.'
          : 'أدخل بريدك لاستلام رمز تفعيل من 6 أرقام.'
      }
      mobileSubtitle={done ? undefined : 'أدخل بريدك لاستلام رمز التفعيل.'}
      step={
        done
          ? undefined
          : { current: step, total: 2, labels: ['البريد الإلكتروني', 'رمز التفعيل'] }
      }
      success={
        done
          ? {
              title: 'تم تفعيل الحساب',
              description: 'يمكنك الآن تسجيل الدخول والوصول إلى النظام.',
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
          <div className="hidden items-start gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4 text-right sm:flex">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              استخدم هذه الصفحة إذا أنشئ لك حساب ولم تصلك رسالة التفعيل. لأسباب أمنية، الاستجابة عامة دائماً.
            </p>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="activate-email" className="text-sm font-medium">
              البريد الإلكتروني
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              <Input
                id="activate-email"
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
            {loading ? 'جاري الإرسال…' : 'إرسال رمز التفعيل'}
          </Button>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void activateForm.handleSubmit(onActivate)(e);
          }}
          className={authFormSpacing}
        >
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
                activateForm.reset();
              }}
            >
              تغيير البريد
            </button>
          </div>

          <div className="space-y-1.5 text-center sm:space-y-2">
            <Label className="text-sm font-medium">رمز التفعيل</Label>
            <VerificationCodeInput
              value={code}
              onChange={setCode}
              disabled={loading}
              error={Boolean(activateForm.formState.errors.code)}
            />
            {activateForm.formState.errors.code ? (
              <p className="text-xs text-destructive">{activateForm.formState.errors.code.message}</p>
            ) : null}
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
            type="submit"
            size="lg"
            disabled={loading || !isVerificationCodeComplete(code)}
            className={authButtonClass}
          >
            {loading ? 'جاري التفعيل…' : 'تفعيل الحساب'}
          </Button>
        </form>
      )}

      {!done && step === 1 ? (
        <p className="mt-2 text-center text-xs text-muted-foreground sm:mt-4">
          نسيت كلمة المرور؟{' '}
          <Link
            href={buildAuthFlowHref('/login/forgot-password', draftEmail)}
            className="font-medium text-primary hover:underline"
          >
            إعادة التعيين
          </Link>
        </p>
      ) : null}
    </AuthFlowShell>
  );
}

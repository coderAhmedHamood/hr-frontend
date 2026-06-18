'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Logo } from '@/components/layouts/logo';
import { authApi } from '@/features/auth/lib/api/auth';
import { setAccessTokenCookie } from '@/features/auth/lib/auth-cookie';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { publicConfig } from '@/shared/config';
import { toast } from 'sonner';

const schema = z.object({
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

type FormValues = z.infer<typeof schema>;

function resolvePostLoginPath(returnTo: string | null): string {
  if (!returnTo || !returnTo.startsWith('/') || returnTo.startsWith('//')) {
    return '/hr/dashboard';
  }
  return returnTo;
}

function getReturnToFromLocation(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('returnTo');
}

export function LoginPage() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberDevice, setRememberDevice] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'admin@test.com', password: 'Admin123!' },
  });

  const onSubmit = async (values: FormValues) => {
    if (!publicConfig.apiUrl) {
      toast.error('لم يتم ضبط عنوان الـ API (NEXT_PUBLIC_API_URL)');
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.login({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });

      if (!result.access_token?.trim() || !result.user?.id) {
        toast.error('استجابة تسجيل الدخول غير مكتملة');
        return;
      }

      useAuthStore.getState().setUser(result.user);
      useAuthStore.getState().setAccessProfile(result.accessProfile);
      setAccessTokenCookie(result.access_token);

      const destination = resolvePostLoginPath(getReturnToFromLocation());
      // Full navigation is more reliable than client routing across layout groups (Docker/production).
      window.location.assign(destination);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'auth.login');
      toast.error(displayMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Decorative atmospheric background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-gold/10 blur-[140px]" />
        <div className="absolute inset-0 dotted-bg opacity-40" />
      </div>

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
        {/* Left: brand storytelling panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
          {/* Grain texture overlay */}
          <div className="absolute inset-0 opacity-[0.08] mix-blend-overlay bg-noise" />
          {/* Gold accent orb */}
          <div className="absolute -bottom-48 -left-48 h-96 w-96 rounded-full bg-gold/30 blur-3xl" />
          <div className="absolute -right-32 top-32 h-64 w-64 rounded-full bg-primary-700/40 blur-3xl" />

          {/* Top: logo */}
          <div className="relative z-10 flex items-center gap-3">
            <Logo size={44} />
            <div>
              <div className="font-display text-2xl font-bold tracking-tight">روز</div>
              <div className="text-[10px] tracking-[0.25em] text-primary-foreground/60">rose · HR PLATFORM</div>
            </div>
          </div>

          {/* Middle: editorial quote */}
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-3">
              <div className="h-px w-10 bg-gold" />
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
                EST. 2018 · RIYADH
              </span>
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.1] tracking-tight text-balance">
              حين تصبح إدارة موظفيك
              <br />
              <span className="italic text-gold">فناً،</span> لا مجرد إجراء.
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-primary-foreground/70">
              منصة روز تجمع الحضور والرواتب والهيكل التنظيمي وتحليلات الأداء في تجربة واحدة
              مصممة بعناية لفرق العمل المتنامية.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {['متعدد الفروع', 'تتبع ذكي', 'تقارير فورية', 'آمن بالكامل'].map((f) => (
                <div
                  key={f}
                  className="rounded-full border border-primary-foreground/20 bg-primary-foreground/5 px-4 py-1.5 text-xs font-medium backdrop-blur-sm"
                >
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: stats strip */}
          <div className="relative z-10 grid grid-cols-3 gap-6 border-t border-primary-foreground/10 pt-8">
            {[
              { v: '+٨٤٢', l: 'موظف يستخدم النظام' },
              { v: '٩٩٫٩٪', l: 'وقت التشغيل الفعلي' },
              { v: '+٦', l: 'فروع مترابطة' },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-display text-3xl font-bold text-gold">{s.v}</div>
                <div className="mt-1 text-xs leading-snug text-primary-foreground/60">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: form panel */}
        <div className="flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="mb-8 flex justify-center lg:hidden">
              <Logo size={56} />
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-4xl font-bold tracking-tight text-foreground">
                سجّل دخولك
              </h2>
              <p className="text-muted-foreground">
                ادخل بيانات حسابك للوصول إلى لوحة التحكم الخاصة بك
              </p>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit(onSubmit)(event);
              }}
              className="mt-10 space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    className="pr-10"
                    dir="ltr"
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Link href="#" className="text-xs font-medium text-primary hover:underline">
                    نسيت كلمة المرور؟
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="px-10"
                    dir="ltr"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
              <Button
                type="submit"
                variant="luxe"
                size="lg"
                className="w-full gap-2"
                disabled={loading || !hydrated}
              >
                {!hydrated ? 'جاري التحميل...' : loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
              </div>
            </form>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              © 2026 روز. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

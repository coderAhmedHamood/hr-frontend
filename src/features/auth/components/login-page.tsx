'use client';

import * as React from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    defaultValues:
      process.env.NODE_ENV === 'development'
        ? { email: 'admin@test.com', password: 'Admin123!' }
        : { email: '', password: '' },
  });

  const appTitle = publicConfig.appName.trim() || 'نظام الموارد البشرية';

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
      window.location.assign(destination);
    } catch (err) {
      handleApiError(err, 'auth.login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden" dir="rtl">
      <Image
        src="/Background.webp"
        alt=""
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-black/25 dark:bg-black/50" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-[420px] rounded-[28px] border border-white/70 bg-gradient-to-b from-primary/10 via-white to-white p-8 shadow-elevated dark:border-border/50 dark:from-primary/15 dark:via-card dark:to-card sm:p-10">
          <div className="flex flex-col items-center space-y-4 text-center">
            <Logo size={56} />
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-bold tracking-tight text-primary">تسجيل الدخول</h1>
              <p className="text-sm text-muted-foreground">أهلاً بك في {appTitle}</p>
            </div>
          </div>

          {!hydrated ? (
            <div className="mt-8 space-y-5" aria-busy="true" aria-hidden="true">
              <div className="h-4 w-28 rounded bg-muted" />
              <div className="h-12 w-full rounded-full bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-12 w-full rounded-full bg-muted" />
              <div className="h-12 w-full rounded-full bg-muted" />
            </div>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit(onSubmit)(event);
              }}
              className="mt-8 space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  البريد الإلكتروني
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    className="h-12 rounded-full border-border bg-background pe-4 ps-11 text-base shadow-soft"
                    dir="ltr"
                    autoComplete="email"
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="h-12 rounded-full border-border bg-background px-11 text-base shadow-soft"
                    dir="ltr"
                    autoComplete="current-password"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? 'إخفاء' : 'إظهار'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="h-12 w-full rounded-full text-base font-semibold shadow-soft"
              >
                {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

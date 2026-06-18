'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useAccessProfile } from '@/features/auth/hooks/use-access-profile';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { hasAccessTokenCookie } from '@/features/auth/lib/auth-cookie';
import { useAuthStore } from '@/features/auth/lib/auth-store';

export function AuthenticatedShell({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const user = useAuthStore((s) => s.user);
  const accessProfile = useAuthStore((s) => s.accessProfile);
  const { isLoading: sessionLoading, isError: sessionError } = useAuthSession();
  const { isLoading: profileLoading, isError: profileError } = useAccessProfile();

  useEffect(() => {
    setMounted(true);
  }, []);

  const waitingForSession = mounted && sessionLoading;
  const waitingForProfile =
    mounted && !!user && !accessProfile && profileLoading && !profileError;

  if (waitingForSession || waitingForProfile) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div
          className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
          role="status"
          aria-label="جاري التحميل"
        />
      </div>
    );
  }

  if (!user && !hasAccessTokenCookie()) {
    if (typeof window !== 'undefined') {
      const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.replace(`/login?returnTo=${returnTo}`);
    }
    return null;
  }

  if (sessionError && !user) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-muted-foreground">
        <p>انتهت الجلسة أو لم يتم تسجيل الدخول.</p>
        <a href="/login" className="text-primary underline-offset-4 hover:underline">
          تسجيل الدخول
        </a>
      </div>
    );
  }

  return <div className="flex min-h-full flex-col">{children}</div>;
}

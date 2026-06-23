'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useAccessProfile } from '@/features/auth/hooks/use-access-profile';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { hasAccessTokenCookie } from '@/features/auth/lib/auth-cookie';
import { useAuthStore } from '@/features/auth/lib/auth-store';

function AuthShellFrame({ children }: { children: ReactNode }) {
  return <div className="flex min-h-full flex-col">{children}</div>;
}

function AuthLoadingFallback() {
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

export function AuthenticatedShell({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const user = useAuthStore((s) => s.user);
  const accessProfile = useAuthStore((s) => s.accessProfile);
  const { isLoading: sessionLoading, isError: sessionError } = useAuthSession();
  const { isLoading: profileLoading, isError: profileError } = useAccessProfile();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || user || hasAccessTokenCookie() || sessionLoading) return;

    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(`/login?returnTo=${returnTo}`);
  }, [mounted, user, sessionLoading]);

  // SSR and the first client paint must render the same tree. Cookie/session
  // checks only exist in the browser, so defer auth branching until mounted.
  if (!mounted) {
    return (
      <AuthShellFrame>
        <AuthLoadingFallback />
      </AuthShellFrame>
    );
  }

  const waitingForSession = sessionLoading;
  const waitingForProfile = !!user && !accessProfile && profileLoading && !profileError;

  if (waitingForSession || waitingForProfile) {
    return (
      <AuthShellFrame>
        <AuthLoadingFallback />
      </AuthShellFrame>
    );
  }

  if (!user && !hasAccessTokenCookie()) {
    return (
      <AuthShellFrame>
        <AuthLoadingFallback />
      </AuthShellFrame>
    );
  }

  if (sessionError && !user) {
    return (
      <AuthShellFrame>
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-muted-foreground">
          <p>انتهت الجلسة أو لم يتم تسجيل الدخول.</p>
          <a href="/login" className="text-primary underline-offset-4 hover:underline">
            تسجيل الدخول
          </a>
        </div>
      </AuthShellFrame>
    );
  }

  return <AuthShellFrame>{children}</AuthShellFrame>;
}

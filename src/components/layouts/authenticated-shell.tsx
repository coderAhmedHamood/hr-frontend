'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useAccessProfile } from '@/features/auth/hooks/use-access-profile';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { useAuthStore } from '@/features/auth/lib/auth-store';

export function AuthenticatedShell({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const user = useAuthStore((s) => s.user);
  const { isLoading: sessionLoading, isError: sessionError } = useAuthSession();
  const { isLoading: profileLoading } = useAccessProfile();

  useEffect(() => {
    setMounted(true);
  }, []);

  const bootstrapping = mounted && (sessionLoading || (!!user && profileLoading));

  if (bootstrapping) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div
          className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
          role="status"
          aria-label="جاري التحميل"
        />
      </div>
    );
  }

  if (sessionError && !user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2 text-muted-foreground">
        <p>انتهت الجلسة أو لم يتم تسجيل الدخول.</p>
        <a href="/login" className="text-primary underline-offset-4 hover:underline">
          تسجيل الدخول
        </a>
      </div>
    );
  }

  return <div className="flex min-h-full flex-col">{children}</div>;
}

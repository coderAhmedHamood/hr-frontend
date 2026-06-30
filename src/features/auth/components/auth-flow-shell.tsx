'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/layouts/logo';
import { Button } from '@/components/ui/button';
import {
  useLoginPageBranding,
} from '@/features/auth/hooks/use-default-company-branding';
import { cn } from '@/shared/utils';

type StepInfo = {
  current: number;
  total: number;
  labels?: string[];
};

type AuthFlowShellProps = {
  title: string;
  subtitle: string;
  /** Shorter subtitle on small screens when `compactOnMobile` is enabled. */
  mobileSubtitle?: string;
  step?: StepInfo;
  success?: { title: string; description: string; actionHref?: string; actionLabel?: string };
  backHref?: string;
  backLabel?: string;
  /** Tighter layout on phones; desktop (`sm+`) stays unchanged. */
  compactOnMobile?: boolean;
  children: React.ReactNode;
};

export function AuthFlowShell({
  title,
  subtitle,
  mobileSubtitle,
  step,
  success,
  backHref = '/login',
  backLabel = 'العودة لتسجيل الدخول',
  compactOnMobile = false,
  children,
}: AuthFlowShellProps) {
  const { logoUrl, logoAlt } = useLoginPageBranding();
  const hideSubtitleOnMobile =
    compactOnMobile && Boolean(step) && !success && (step?.current ?? 1) > 1;

  return (
    <div className="relative min-h-dvh overflow-hidden" dir="rtl">
      <Image
        src="/Background.webp"
        alt=""
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-black/25 dark:bg-black/50" />

      <div
        className={cn(
          'relative z-10 flex min-h-dvh items-center justify-center',
          compactOnMobile ? 'p-2 sm:p-4' : 'p-4',
        )}
      >
        <div
          className={cn(
            'w-full max-w-[440px] border border-white/70 bg-gradient-to-b from-primary/10 via-white to-white shadow-elevated dark:border-border/50 dark:from-primary/15 dark:via-card dark:to-card',
            compactOnMobile
              ? 'rounded-2xl p-5 sm:rounded-[28px] sm:p-8 md:p-10'
              : 'rounded-[28px] p-8 sm:p-10',
          )}
        >
          <div
            className={cn(
              'flex flex-col items-center text-center',
              compactOnMobile ? 'space-y-2 sm:space-y-4' : 'space-y-4',
            )}
          >
            <div className={cn(compactOnMobile && 'origin-center scale-[0.79] sm:scale-100')}>
              <Logo size={56} src={logoUrl} alt={logoAlt} />
            </div>
            <div className="space-y-1 sm:space-y-2">
              <h1
                className={cn(
                  'font-display font-bold tracking-tight text-primary',
                  compactOnMobile ? 'text-xl sm:text-2xl md:text-3xl' : 'text-2xl sm:text-3xl',
                )}
              >
                {success ? success.title : title}
              </h1>
              {!hideSubtitleOnMobile ? (
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {success ? (
                    success.description
                  ) : compactOnMobile && mobileSubtitle ? (
                    <>
                      <span className="sm:hidden">{mobileSubtitle}</span>
                      <span className="hidden sm:inline">{subtitle}</span>
                    </>
                  ) : (
                    subtitle
                  )}
                </p>
              ) : null}
            </div>
          </div>

          {step && !success ? (
            <div className={cn(compactOnMobile ? 'mt-4 space-y-2 sm:mt-6 sm:space-y-3' : 'mt-6 space-y-3')}>
              <div
                className={cn(
                  'flex items-center justify-between text-xs text-muted-foreground',
                  compactOnMobile && 'max-sm:hidden',
                )}
              >
                <span>
                  الخطوة {step.current} من {step.total}
                </span>
                {step.labels?.[step.current - 1] ? (
                  <span className="font-medium text-foreground">{step.labels[step.current - 1]}</span>
                ) : null}
              </div>
              <div className="flex gap-1.5 sm:gap-2">
                {Array.from({ length: step.total }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors sm:h-1.5',
                      i < step.current ? 'bg-primary' : 'bg-muted',
                    )}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <div className={compactOnMobile ? 'mt-4 sm:mt-8' : 'mt-8'}>
            {success ? (
              <div
                className={cn(
                  'flex flex-col items-center text-center',
                  compactOnMobile ? 'gap-4 sm:gap-5' : 'gap-5',
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center rounded-full bg-success/10 text-success',
                    compactOnMobile ? 'h-14 w-14 sm:h-16 sm:w-16' : 'h-16 w-16',
                  )}
                >
                  <CheckCircle2 className={compactOnMobile ? 'h-7 w-7 sm:h-8 sm:w-8' : 'h-8 w-8'} />
                </div>
                <Button
                  asChild
                  className={cn(
                    'w-full rounded-full font-semibold shadow-soft',
                    compactOnMobile ? 'h-11 text-sm sm:h-12 sm:text-base' : 'h-12 text-base',
                  )}
                >
                  <Link href={success.actionHref ?? '/login'}>
                    {success.actionLabel ?? 'تسجيل الدخول'}
                  </Link>
                </Button>
              </div>
            ) : (
              children
            )}
          </div>

          {!success ? (
            <div className={cn('text-center', compactOnMobile ? 'mt-4 sm:mt-6' : 'mt-6')}>
              <Link
                href={backHref}
                className={cn(
                  'inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary',
                  compactOnMobile ? 'text-xs sm:text-sm' : 'text-sm',
                )}
              >
                <ArrowRight className={compactOnMobile ? 'h-3.5 w-3.5 sm:h-4 sm:w-4' : 'h-4 w-4'} />
                {backLabel}
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

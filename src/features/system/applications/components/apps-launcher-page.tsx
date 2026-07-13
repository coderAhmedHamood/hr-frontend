'use client';

import * as React from 'react';
import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';
import { useLoginPageBranding } from '@/features/auth/hooks/use-default-company-branding';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import {
  applicationsApi,
  resolveApplicationLaunchPath,
  type ApplicationResponseDto,
} from '@/features/system/applications/lib/api/applications';
import {
  resolveApplicationIcon,
  resolveApplicationSurfaceAccent,
  resolveApplicationTileClass,
} from '@/features/system/applications/lib/application-tile-config';
import { cn } from '@/shared/utils';

function AppTile({
  app,
  index,
}: {
  app: ApplicationResponseDto;
  index: number;
}) {
  const Icon = resolveApplicationIcon(app);
  const href = resolveApplicationLaunchPath(app);
  const tileClass = resolveApplicationTileClass(app, index);
  const surfaceAccent = resolveApplicationSurfaceAccent(index);

  return (
    <Link
      href={href}
      className="group flex w-[7.75rem] flex-col items-center gap-2.5 text-center outline-none focus-visible:rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-[8.75rem]"
    >
      <div
        className={cn(
          'flex w-full flex-col items-center gap-2.5 rounded-xl border border-border/70 bg-card/95 p-3.5 shadow-soft',
          'transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/25 group-hover:shadow-md',
          surfaceAccent,
        )}
      >
        <span
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105',
            tileClass,
          )}
        >
          <Icon className="h-7 w-7" strokeWidth={1.75} />
        </span>

        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-foreground">
          {app.nameAr}
        </h3>
      </div>
    </Link>
  );
}

function LauncherSkeleton() {
  return (
    <div className="flex flex-wrap items-start justify-center gap-5 sm:gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex w-[7.75rem] flex-col items-center gap-2.5 sm:w-[8.75rem]">
          <div className="flex w-full flex-col items-center gap-2.5 rounded-xl border border-border/50 bg-muted/30 p-3.5">
            <div className="h-14 w-14 animate-pulse rounded-xl bg-muted/60" />
            <div className="h-3.5 w-16 animate-pulse rounded-full bg-muted/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CompanyHero({
  companyNameAr,
  companyNameEn,
}: {
  companyNameAr: string | null;
  companyNameEn: string | null;
}) {
  if (!companyNameAr && !companyNameEn) return null;

  return (
    <header className="mb-8 flex w-full max-w-2xl flex-col items-center text-center sm:mb-10">
      <div className="mb-5 flex w-full max-w-[14rem] items-center gap-3 sm:max-w-xs" aria-hidden>
        <span className="gold-accent-line h-px flex-1 opacity-80" />
        <span className="h-1.5 w-1.5 rotate-45 rounded-[1px] bg-gold shadow-[0_0_8px_hsl(var(--gold)/0.45)]" />
        <span className="gold-accent-line h-px flex-1 opacity-80" />
      </div>

      {companyNameAr ? (
        <h1 className="font-arabic-display bg-gradient-to-br from-primary via-primary-700 to-gold bg-clip-text text-[1.65rem] font-bold leading-snug tracking-tight text-transparent sm:text-3xl md:text-[2.125rem]">
          {companyNameAr}
        </h1>
      ) : null}

      {companyNameEn ? (
        <p
          className="mt-2 font-display text-[10px] font-semibold uppercase tracking-[0.32em] text-muted-foreground/75 sm:text-[11px]"
          dir="ltr"
        >
          {companyNameEn}
        </p>
      ) : null}

  
    </header>
  );
}

export function AppsLauncherPage() {
  const branding = useLoginPageBranding();
  const [apps, setApps] = React.useState<ApplicationResponseDto[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const items = await applicationsApi.getLauncher();
        if (!cancelled) setApps(items);
      } catch (err) {
        handleApiError(err, 'applications.launcher');
        if (!cancelled) setApps([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 dotted-bg opacity-25" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 end-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 start-0 h-72 w-72 rounded-full bg-gold/10 blur-3xl"
      />

      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
        <CompanyHero
          companyNameAr={branding.companyNameAr}
          companyNameEn={branding.companyNameEn}
        />

        {loading ? (
          <LauncherSkeleton />
        ) : apps.length === 0 ? (
          <div className="glass-card flex w-full max-w-md flex-col items-center gap-3 rounded-2xl px-8 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <LayoutGrid className="h-7 w-7" />
            </span>
            <p className="text-sm font-medium text-foreground">لا توجد تطبيقات متاحة لحسابك</p>
            <p className="text-xs text-muted-foreground">تواصل مع مسؤول النظام لمنح الصلاحيات.</p>
          </div>
        ) : (
          <div className="flex w-full max-w-3xl flex-wrap items-start justify-center gap-5 sm:gap-6">
            {apps.map((app, index) => (
              <AppTile key={app.id} app={app} index={index} />
            ))}
          </div>
        )}

        {!loading && apps.length > 0 && (
          <p className="mt-8 text-xs  text-muted-foreground/70">
            {apps.length} {apps.length === 1 ? 'تطبيق متاح' : 'تطبيقات متاحة'}
          </p>
        )}
      </div>
    </div>
  );
}

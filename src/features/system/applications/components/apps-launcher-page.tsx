'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, LayoutGrid } from 'lucide-react';
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
      className="group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div
        className={cn(
          'luxe-card relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br p-5 sm:p-6',
          'transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-elevated',
          surfaceAccent,
        )}
      >
        <div className="flex items-center gap-4 sm:gap-5">
          <span
            className={cn(
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 sm:h-16 sm:w-16',
              tileClass,
            )}
          >
            <Icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.75} />
          </span>

          <div className="min-w-0 flex-1 text-right">
            <h3 className="truncate text-base font-bold tracking-tight text-foreground sm:text-lg">
              {app.nameAr}
            </h3>
          </div>

          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted/70 text-muted-foreground transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
            <ArrowLeft className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function LauncherSkeleton() {
  return (
    <div className="grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-[120px] animate-pulse rounded-2xl bg-muted/50" />
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
    <div className="mb-8 w-full max-w-5xl text-center sm:mb-10">
      {companyNameAr ? (
        <p className="font-arabic-display text-lg font-bold text-foreground sm:text-xl">
          {companyNameAr}
        </p>
      ) : null}
    </div>
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

        <div className="mb-10 w-full max-w-5xl text-center sm:mb-12">
          <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
            اختر التطبيق المناسب للبدء
          </p>
        </div>

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
          <div
            className={cn(
              'grid w-full max-w-5xl gap-4',
              apps.length === 1 && 'max-w-md grid-cols-1',
              apps.length === 2 && 'max-w-3xl grid-cols-1 sm:grid-cols-2',
              apps.length >= 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
            )}
          >
            {apps.map((app, index) => (
              <AppTile key={app.id} app={app} index={index} />
            ))}
          </div>
        )}

        {!loading && apps.length > 0 && (
          <p className="mt-8 text-xs text-muted-foreground/70">
            {apps.length} {apps.length === 1 ? 'تطبيق متاح' : 'تطبيقات متاحة'}
          </p>
        )}
      </div>
    </div>
  );
}

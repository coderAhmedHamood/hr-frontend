'use client';

import * as React from 'react';
import { LayoutGrid } from 'lucide-react';
import { useLoginPageBranding } from '@/features/auth/hooks/use-default-company-branding';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import {
  applicationsApi,
  enrichLauncherApplications,
  looksLikeStorefrontApp,
  resolveApplicationExternalUrl,
  resolveApplicationLaunchPath,
  type ApplicationResponseDto,
} from '@/features/system/applications/lib/api/applications';
import { OdooAppTile } from '@/features/system/applications/components/odoo-app-tile';
import {
  resolveApplicationIcon,
  resolveApplicationTileClass,
} from '@/features/system/applications/lib/application-tile-config';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import {
  useIsCompanySuperuser,
  useIsSystemOwner,
} from '@/features/auth/hooks/use-system-owner';
import { systemOwnerRoutes, companyAppsRoutes } from '@/features/system-owner/constants/routes';

function AppTile({
  app,
  index,
}: {
  app: ApplicationResponseDto;
  index: number;
}) {
  const Icon = resolveApplicationIcon(app);
  const externalUrl = resolveApplicationExternalUrl(app);
  const href = externalUrl ?? resolveApplicationLaunchPath(app);

  return (
    <OdooAppTile
      icon={Icon}
      label={app.nameAr}
      tileClass={resolveApplicationTileClass(app, index)}
      href={href}
      external={Boolean(externalUrl)}
      hardNavigation={!externalUrl && looksLikeStorefrontApp(app)}
    />
  );
}

function LauncherSkeleton() {
  return (
    <div className="odoo-app-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="odoo-app-tile flex flex-col items-center gap-2">
          <div className="odoo-app-square animate-pulse bg-muted" />
          <div className="h-3 w-16 animate-pulse rounded-full bg-muted" />
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

const SYSTEM_OWNER_APP: ApplicationResponseDto = {
  id: 'client-app-system-owner',
  code: 'system-owner',
  nameAr: 'مالك النظام',
  nameEn: 'System Owner',
  description: 'إدارة الشركات والتطبيقات وطلبات التفعيل',
  icon: 'crown',
  routePath: systemOwnerRoutes.companies,
  sortOrder: 0,
  isActive: true,
  status: 'active',
};

const COMPANY_APPS_APP: ApplicationResponseDto = {
  id: 'client-app-company-apps',
  code: 'company-apps',
  nameAr: 'تطبيقات الشركة',
  nameEn: 'Company Apps',
  description: 'عرض التطبيقات المفعّلة وغير المفعّلة وطلب التفعيل',
  icon: 'layout-grid',
  routePath: companyAppsRoutes.overview,
  sortOrder: 2,
  isActive: true,
  status: 'active',
};

function asLauncherList(value: unknown): ApplicationResponseDto[] {
  if (Array.isArray(value)) return value as ApplicationResponseDto[];
  if (value && typeof value === 'object' && Array.isArray((value as { items?: unknown }).items)) {
    return (value as { items: ApplicationResponseDto[] }).items;
  }
  return [];
}

export function AppsLauncherPage() {
  const branding = useLoginPageBranding();
  const activeCompanyId = useAuthStore((s) => s.activeCompanyId);
  const isSystemOwner = useIsSystemOwner();
  const isSuperuser = useIsCompanySuperuser();
  const [apps, setApps] = React.useState<ApplicationResponseDto[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        let raw: unknown;
        try {
          raw = await applicationsApi.getLauncher();
        } catch {
          const fallback = await applicationsApi.getAll({ page: 1, limit: 200 });
          raw = fallback.items;
        }
        if (cancelled) return;
        const enriched = enrichLauncherApplications(asLauncherList(raw), activeCompanyId);
        const rest = enriched.filter((app) => {
          const code = app.code.trim().toLowerCase();
          return code !== 'system-owner' && code !== 'company-apps';
        });
        const companyAppsFromApi = enriched.find(
          (app) => app.code.trim().toLowerCase() === 'company-apps',
        );
        const list: ApplicationResponseDto[] = [];
        if (isSystemOwner) list.push(SYSTEM_OWNER_APP);
        if (isSuperuser || isSystemOwner) {
          list.push(
            companyAppsFromApi
              ? {
                  ...companyAppsFromApi,
                  routePath: companyAppsFromApi.routePath || companyAppsRoutes.overview,
                }
              : COMPANY_APPS_APP,
          );
        }
        list.push(...rest);
        setApps(list);
      } catch (err) {
        handleApiError(err, 'applications.launcher');
        if (!cancelled) {
          const fallback: ApplicationResponseDto[] = [];
          if (isSystemOwner) fallback.push(SYSTEM_OWNER_APP);
          if (isSuperuser || isSystemOwner) fallback.push(COMPANY_APPS_APP);
          setApps(fallback);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeCompanyId, isSystemOwner, isSuperuser]);

  return (
    <div className="apps-launcher-page relative flex w-full min-w-0 flex-1 flex-col">
      <div aria-hidden className="pointer-events-none absolute inset-0 dotted-bg opacity-25" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 end-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 start-0 h-72 w-72 rounded-full bg-gold/10 blur-3xl"
      />

      <div className="relative flex w-full flex-col items-center px-4 py-8 pb-20 sm:min-h-full sm:justify-center sm:px-6 sm:py-14 sm:pb-14">
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
            <p className="text-xs text-muted-foreground">تواصل مع مسؤول النظام لمنح الصلاحيات أو تفعيل التطبيقات.</p>
          </div>
        ) : (
          <div className="odoo-app-grid">
            {apps.map((app, index) => (
              <AppTile key={app.id} app={app} index={index} />
            ))}
          </div>
        )}

        {!loading && apps.length > 0 ? (
          <p className="mt-8 text-xs text-muted-foreground/70">
            {apps.length} {apps.length === 1 ? 'تطبيق متاح' : 'تطبيقات متاحة'}
          </p>
        ) : null}
      </div>
    </div>
  );
}

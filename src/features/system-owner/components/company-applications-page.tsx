'use client';

import * as React from 'react';
import { Clock, Lock } from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ForbiddenState } from '@/components/shared/forbidden-state';
import { ApiError } from '@/features/hr/lib/api/client';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import {
  useIsCompanySuperuser,
  useIsSystemOwner,
} from '@/features/auth/hooks/use-system-owner';
import {
  useCancelAppActivationRequest,
  useCompanyAppsCatalog,
  useCreateAppActivationRequest,
} from '@/features/system-owner/hooks/use-company-apps';
import type { CompanyAppCatalogItem } from '@/features/system-owner/lib/api/system-owner';
import {
  resolveApplicationExternalUrl,
  resolveApplicationLaunchPath,
  type ApplicationResponseDto,
} from '@/features/system/applications/lib/api/applications';
import {
  resolveApplicationIcon,
  resolveApplicationTileClass,
} from '@/features/system/applications/lib/application-tile-config';
import { OdooAppTile } from '@/features/system/applications/components/odoo-app-tile';

type FilterId = 'all' | 'enabled' | 'available' | 'pending';

function toLauncherApp(app: CompanyAppCatalogItem): ApplicationResponseDto {
  return {
    id: app.applicationId,
    code: app.code,
    nameAr: app.nameAr,
    nameEn: app.nameEn ?? '',
    description: app.description ?? null,
    icon: app.icon ?? null,
    routePath: app.routePath ?? null,
    launchUrl: app.launchUrl ?? null,
    sortOrder: app.sortOrder,
    isActive: true,
    status: 'active',
  };
}

function MarketplaceTile({
  app,
  index,
  cancelPending,
  onRequest,
}: {
  app: CompanyAppCatalogItem;
  index: number;
  cancelPending: { isPending: boolean; mutate: (id: string) => void };
  onRequest: (app: CompanyAppCatalogItem) => void;
}) {
  const launcherApp = toLauncherApp(app);
  const Icon = resolveApplicationIcon(launcherApp);
  const externalUrl = resolveApplicationExternalUrl(launcherApp);
  const href = externalUrl ?? resolveApplicationLaunchPath(launcherApp);
  const tileClass = resolveApplicationTileClass(launcherApp, index);
  const canOpen = app.activationState === 'enabled' || app.activationState === 'always_on';
  const isPending = app.activationState === 'pending';
  const isLocked = !canOpen;

  const overlay = isPending ? (
    <span className="absolute -end-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-warning text-warning-foreground">
      <Clock className="h-3 w-3" />
    </span>
  ) : isLocked ? (
    <span className="absolute -end-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <Lock className="h-3 w-3" />
    </span>
  ) : null;

  const caption = canOpen
    ? undefined
    : isPending
      ? 'بانتظار الموافقة'
      : app.canRequestActivation
        ? 'طلب تفعيل'
        : 'غير مفعّل';

  const tile = (
    <OdooAppTile
      icon={Icon}
      label={app.nameAr}
      caption={caption}
      tileClass={tileClass}
      href={canOpen ? href : undefined}
      external={canOpen && Boolean(externalUrl)}
      onClick={!canOpen && app.canRequestActivation ? () => onRequest(app) : undefined}
      muted={isLocked}
      overlay={overlay}
    />
  );

  if (isPending && app.canCancelPendingRequest && app.pendingRequest) {
    return (
      <div className="flex flex-col items-center gap-1">
        {tile}
        <button
          type="button"
          className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          disabled={cancelPending.isPending}
          onClick={() => cancelPending.mutate(app.pendingRequest!.id)}
        >
          إلغاء الطلب
        </button>
      </div>
    );
  }

  return tile;
}

export function CompanyApplicationsPage() {
  const companyId = useAuthStore((s) => s.activeCompanyId);
  const isSuperuser = useIsCompanySuperuser();
  const isSystemOwner = useIsSystemOwner();
  const catalogQuery = useCompanyAppsCatalog(companyId ?? '');
  const createRequest = useCreateAppActivationRequest(companyId ?? '');
  const cancelRequest = useCancelAppActivationRequest(companyId ?? '');
  const [filter, setFilter] = React.useState<FilterId>('all');
  const [requestingApp, setRequestingApp] = React.useState<CompanyAppCatalogItem | null>(null);
  const [message, setMessage] = React.useState('');

  const catalog = catalogQuery.data;
  const canOpenPage =
    isSuperuser
    || isSystemOwner
    || catalog?.isCompanySuperuser === true
    || catalog?.isSystemOwner === true;

  const apps = (catalog?.applications ?? []).filter((app) => {
    const code = app.code.trim().toLowerCase();
    if (code === 'company-apps' || code === 'system-owner') return false;
    return app.includeInMarketplace;
  });
  const enabledApps = apps.filter(
    (app) => app.activationState === 'enabled' || app.activationState === 'always_on',
  );
  const pendingApps = apps.filter((app) => app.activationState === 'pending');
  const availableApps = apps.filter((app) => app.activationState === 'available');
  const visibleApps =
    filter === 'enabled'
      ? enabledApps
      : filter === 'pending'
        ? pendingApps
        : filter === 'available'
          ? availableApps
          : apps;

  if (!companyId) {
    return <ForbiddenState title="اختر شركة" description="لا توجد شركة نشطة في الجلسة." />;
  }

  if (catalogQuery.isError) {
    const status = catalogQuery.error instanceof ApiError ? catalogQuery.error.status : 0;
    if (status === 403) {
      return (
        <ForbiddenState
          title="لا تملك صلاحية الوصول"
          description="تطبيقات الشركة تظهر لصاحب الشركة (Superuser) أو مالك النظام."
        />
      );
    }
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <SetPageTitle titleAr="تطبيقات الشركة" iconName="LayoutGrid" />
        <p className="text-sm text-destructive">تعذر تحميل كتالوج التطبيقات.</p>
      </div>
    );
  }

  if (!catalogQuery.isLoading && catalog && !canOpenPage) {
    return (
      <ForbiddenState
        title="لا تملك صلاحية الوصول"
        description="تطبيقات الشركة تظهر لصاحب الشركة فقط."
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <SetPageTitle
        titleAr="تطبيقات الشركة"
        descriptionAr="المفعّلة وغير المفعّلة — اطلب التفعيل ليصل مالك النظام"
        iconName="LayoutGrid"
      />

      <p className="text-sm text-muted-foreground">
        اضغط التطبيق المفعّل لفتحه. غير المفعّل اطلب تفعيله ليصل الطلب إلى مالك النظام.
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {(
          [
            ['all', `الكل (${apps.length})`],
            ['enabled', `مفعّل (${enabledApps.length})`],
            ['available', `غير مفعّل (${availableApps.length})`],
            ['pending', `بانتظار الموافقة (${pendingApps.length})`],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            size="sm"
            variant={filter === id ? 'default' : 'outline'}
            onClick={() => setFilter(id)}
          >
            {label}
          </Button>
        ))}
      </div>

      <section className="odoo-app-grid mx-auto">
        {catalogQuery.isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="odoo-app-tile flex flex-col items-center gap-2">
                <div className="odoo-app-square animate-pulse bg-muted" />
                <div className="h-3 w-16 animate-pulse rounded-full bg-muted" />
              </div>
            ))
          : null}
        {visibleApps.map((app, index) => (
          <MarketplaceTile
            key={app.applicationId || app.code}
            app={app}
            index={index}
            cancelPending={cancelRequest}
            onRequest={setRequestingApp}
          />
        ))}
        {!catalogQuery.isLoading && visibleApps.length === 0 ? (
          <p className="w-full text-center text-sm text-muted-foreground">لا توجد تطبيقات في هذا التصنيف.</p>
        ) : null}
      </section>

      <Dialog
        open={Boolean(requestingApp)}
        onOpenChange={(open) => {
          if (!open) {
            setRequestingApp(null);
            setMessage('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>طلب تفعيل {requestingApp?.nameAr}</DialogTitle>
            <DialogDescription>
              يصل الطلب إلى مالك النظام للموافقة. بعد الموافقة يظهر التطبيق في المشغّل.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="activation-request-message">رسالة الطلب (اختياري)</Label>
            <Textarea
              id="activation-request-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="مثال: نحتاج المخازن لفرع الرياض"
              className="min-h-22"
            />
          </div>
          <DialogFooter>
            <Button
              disabled={!requestingApp || createRequest.isPending}
              onClick={() => {
                if (!requestingApp) return;
                createRequest.mutate(
                  {
                    applicationId: requestingApp.applicationId,
                    message: message.trim() || undefined,
                  },
                  {
                    onSuccess: () => {
                      setRequestingApp(null);
                      setMessage('');
                    },
                  },
                );
              }}
            >
              إرسال الطلب
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRequestingApp(null);
                setMessage('');
              }}
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

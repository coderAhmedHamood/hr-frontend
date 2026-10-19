'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { systemOwnerQueryKeys } from '@/features/system-owner/hooks/query-keys';
import {
  systemOwnerApi,
  type PlatformApplication,
} from '@/features/system-owner/lib/api/system-owner';

/**
 * Platform status of every application (system owner only — the route sits
 * under the SystemOwnerGuard layout and the API refuses anyone else).
 * Stopping an app switches it off for every company that has it enabled;
 * their own choice is kept and comes back when the app is started again.
 */
export function SystemOwnerApplicationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [stopping, setStopping] = React.useState<PlatformApplication | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: systemOwnerQueryKeys.platformApplications(),
    queryFn: () => systemOwnerApi.listPlatformApplications(),
  });

  const setActive = useMutation({
    mutationFn: (vars: { app: PlatformApplication; isActive: boolean }) =>
      systemOwnerApi.setPlatformApplicationActive(vars.app.id, vars.isActive),
    onSuccess: (_data, vars) => {
      setStopping(null);
      // Company app lists and catalogs show the platform status too.
      void queryClient.invalidateQueries({ queryKey: ['system-owner'] });
      void queryClient.invalidateQueries({ queryKey: ['company-apps'] });
      toast.success(
        vars.isActive
          ? `تم تشغيل «${vars.app.nameAr}» على مستوى المنصة`
          : `تم إيقاف «${vars.app.nameAr}» على مستوى المنصة`,
      );
    },
    // The API client already shows the server's reason.
  });

  const apps = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = data ?? [];
    if (!q) return rows;
    return rows.filter((app) =>
      [app.nameAr, app.nameEn, app.code].filter(Boolean).join(' ').toLowerCase().includes(q),
    );
  }, [data, search]);
  const stoppedCount = (data ?? []).filter((app) => !app.isActive).length;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <SetPageTitle
        titleAr="تطبيقات المنصة"
        descriptionAr="تشغيل أو إيقاف التطبيق لكل الشركات"
        iconName="LayoutGrid"
      />
      <p className="text-xs text-muted-foreground">
        «نشط» يعني أن التطبيق يعمل للشركات المفعّل لديها. «موقوف» يوقفه لكل الشركات معاً، ويبقى
        اختيار كل شركة محفوظاً ويعود عند التشغيل. التطبيقات الأساسية للمنصة لا تُوقف.
        {stoppedCount > 0 ? ` الموقوف الآن: ${stoppedCount}.` : ''}
      </p>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="بحث بالاسم أو الرمز…"
        className="max-w-sm"
      />
      {isLoading ? <p className="text-sm text-muted-foreground">جاري التحميل…</p> : null}
      {isError ? <p className="text-sm text-destructive">تعذر تحميل التطبيقات.</p> : null}

      <div className="space-y-2">
        {apps.map((app) => (
          <div
            key={app.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{app.nameAr}</p>
                {app.isActive ? (
                  <Badge variant="success" className="text-[10px]">نشط</Badge>
                ) : (
                  <Badge variant="destructive" className="text-[10px]">موقوف</Badge>
                )}
                {app.isCore ? (
                  <Badge variant="secondary" className="text-[10px]">أساسي</Badge>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground" dir="ltr">
                {app.code}
              </p>
              {!app.isPlatformOnly ? (
                <p className="text-xs text-muted-foreground">
                  مفعّل لدى {app.enabledCompanyCount} شركة
                  {!app.isActive && app.enabledCompanyCount > 0
                    ? ' — لا يعمل لديها حتى يُشغَّل'
                    : ''}
                </p>
              ) : null}
            </div>
            <label className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
              <Switch
                checked={app.isActive}
                disabled={app.isCore || setActive.isPending}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setActive.mutate({ app, isActive: true });
                  } else {
                    setStopping(app);
                  }
                }}
                aria-label={`${app.isActive ? 'إيقاف' : 'تشغيل'} ${app.nameAr} على مستوى المنصة`}
              />
              {app.isActive ? 'نشط' : 'موقوف'}
            </label>
          </div>
        ))}
        {!isLoading && apps.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد تطبيقات.</p>
        ) : null}
      </div>

      <Dialog
        open={stopping !== null}
        onOpenChange={(open) => (!open && !setActive.isPending ? setStopping(null) : undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إيقاف «{stopping?.nameAr}» على مستوى المنصة؟</DialogTitle>
            <DialogDescription>
              إيقاف التطبيق يوقفه لكل الشركات المفعّل لديها ({stopping?.enabledCompanyCount ?? 0}{' '}
              شركة). لا تُحذف أي بيانات، ويبقى اختيار كل شركة محفوظاً ويعود عند تشغيله.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              disabled={setActive.isPending}
              onClick={() => setStopping(null)}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              disabled={setActive.isPending}
              onClick={() => stopping && setActive.mutate({ app: stopping, isActive: false })}
            >
              {setActive.isPending ? 'جارٍ الإيقاف…' : 'إيقاف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

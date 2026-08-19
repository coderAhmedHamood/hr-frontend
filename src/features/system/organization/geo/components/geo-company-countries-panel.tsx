'use client';

import * as React from 'react';
import { MapPinned, Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useCan } from '@/features/auth/hooks/use-can';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import {
  useCompanyGeoCountries,
  useGeoCountries,
  useUpdateCompanyGeoCountry,
} from '@/features/system/organization/geo/hooks/use-geo';
import { GEO_COUNTRIES_PERMISSIONS } from '@/features/system/organization/geo/permissions';

type Props = {
  companyId: string;
};

/**
 * Seeded company ↔ country links — activate/deactivate for store.
 * Uses a resilient helper that survives backend cascade 404s on missing children.
 */
export function GeoCompanyCountriesPanel({ companyId }: Props) {
  const can = useCan();
  const canUpdate = can(GEO_COUNTRIES_PERMISSIONS.update);

  const linksQuery = useCompanyGeoCountries(companyId, Boolean(companyId));
  const catalogQuery = useGeoCountries(
    { companyId, page: 1, limit: 200, archiveScope: 'active' },
    Boolean(companyId),
  );

  const updateLink = useUpdateCompanyGeoCountry();
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const catalogNameByCode = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const row of catalogQuery.data?.items ?? []) {
      map.set(row.code.trim().toUpperCase(), row.nameAr);
    }
    return map;
  }, [catalogQuery.data?.items]);

  async function toggleCountry(linkId: string, countryCode: string, next: boolean) {
    setBusyId(linkId);
    try {
      await updateLink.mutateAsync({
        companyId,
        linkId,
        countryCode,
        showInStore: next,
      });
    } catch (error) {
      handleApiError(error);
    } finally {
      setBusyId(null);
    }
  }

  const rows = linksQuery.data ?? [];
  const loading = linksQuery.isLoading;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">الدول المدعومة للشركة</p>
        <p className="max-w-2xl text-xs text-muted-foreground">
          فعّل أو ألغِ تفعيل الدولة للمتجر. يتم مزامنة المدن والأحياء الموجودة تلقائياً (مع تجاهل
          الصفوف التالفة إن وُجدت).
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : linksQuery.isError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-4 text-sm text-destructive">
          <span>تعذر تحميل الدول المدعومة.</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg"
            onClick={() => void linksQuery.refetch()}
          >
            إعادة المحاولة
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-muted/10 px-6 py-12 text-center">
          <MapPinned className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            لا توجد دول مربوطة بعد. شغّل تهيئة النظام (
            <span dir="ltr">npm run system:init</span>) لتعبئة اليمن وربطها بالشركة.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => {
            const code = row.countryCode.trim().toUpperCase();
            const title = row.nameAr?.trim() || catalogNameByCode.get(code) || code;
            const pending = busyId === row.id || updateLink.isPending;
            return (
              <li
                key={row.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-card px-3.5 py-3 transition-colors hover:border-border"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{title}</p>
                    <Badge variant="outline" className="font-mono text-[11px]" dir="ltr">
                      {code}
                    </Badge>
                    {row.showInStore ? (
                      <Badge
                        variant="subtle"
                        className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                      >
                        <Store className="h-3 w-3" />
                        مفعّلة بالمتجر
                      </Badge>
                    ) : (
                      <Badge variant="subtle" className="text-muted-foreground">
                        غير مفعّلة
                      </Badge>
                    )}
                  </div>
                  {pending ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      جاري التفعيل ومزامنة المدن…
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5">
                  <span className="text-xs text-muted-foreground">تفعيل بالمتجر</span>
                  <Switch
                    checked={row.showInStore}
                    disabled={!canUpdate || pending}
                    onCheckedChange={(next) => void toggleCountry(row.id, code, next)}
                    aria-label={`تفعيل ${code} بالمتجر`}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

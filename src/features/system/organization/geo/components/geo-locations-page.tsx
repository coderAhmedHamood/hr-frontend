'use client';

import * as React from 'react';
import { Archive, MapPinned, Pencil, Plus, RotateCcw } from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Can } from '@/components/shared/can';
import { ForbiddenState } from '@/components/shared/forbidden-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCan } from '@/features/auth/hooks/use-can';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { ApiError } from '@/features/hr/lib/api/client';
import { toast } from 'sonner';
import {
  useCompanyGeoCountries,
  useCreateGeoCity,
  useCreateGeoDistrict,
  useDeleteGeoCity,
  useDeleteGeoDistrict,
  useGeoCities,
  useGeoCountries,
  useGeoDistricts,
  useRestoreGeoCity,
  useRestoreGeoDistrict,
  useUpdateGeoCity,
  useUpdateGeoDistrict,
} from '@/features/system/organization/geo/hooks/use-geo';
import { GeoCompanyCountriesPanel } from '@/features/system/organization/geo/components/geo-company-countries-panel';
import { geoCitiesApi, geoDistrictsApi } from '@/features/system/organization/geo/lib/api/geo-api';
import type { ArchiveScope, GeoCity, GeoDistrict } from '@/features/system/organization/geo/lib/api/geo-api';
import {
  GEO_CITIES_PERMISSIONS,
  GEO_COUNTRIES_PERMISSIONS,
  GEO_DISTRICTS_PERMISSIONS,
} from '@/features/system/organization/geo/permissions';
import { cn } from '@/shared/utils';

type EntityForm = {
  nameAr: string;
  nameEn: string;
  sortOrder: string;
  isActive: boolean;
  countryId: string;
  cityId: string;
};

const EMPTY_FORM: EntityForm = {
  nameAr: '',
  nameEn: '',
  sortOrder: '0',
  isActive: true,
  countryId: '',
  cityId: '',
};

type Props = {
  /** When true, omit page chrome (used inside store website settings). */
  embedded?: boolean;
  /** Override tenant scope (defaults to the signed-in default company). */
  companyId?: string | null;
};

export default function GeoLocationsPage({
  embedded = false,
  companyId: companyIdProp,
}: Props) {
  const can = useCan();
  const defaultCompanyId = useDefaultCompanyId();
  const companyId = companyIdProp || defaultCompanyId;
  const canReadAny =
    can(GEO_COUNTRIES_PERMISSIONS.read) ||
    can(GEO_CITIES_PERMISSIONS.read) ||
    can(GEO_DISTRICTS_PERMISSIONS.read);

  const [tab, setTab] = React.useState<'countries' | 'cities' | 'districts'>('countries');
  const [archiveScope, setArchiveScope] = React.useState<ArchiveScope>('active');
  const [selectedCountryId, setSelectedCountryId] = React.useState<string>('all');
  const [selectedCityId, setSelectedCityId] = React.useState<string>('all');
  const [search, setSearch] = React.useState('');

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<
    | { kind: 'city'; row: GeoCity }
    | { kind: 'district'; row: GeoDistrict }
    | null
  >(null);
  const [form, setForm] = React.useState<EntityForm>(EMPTY_FORM);

  const citiesQuery = useGeoCities(
    {
      companyId: companyId || undefined,
      countryId: selectedCountryId === 'all' ? undefined : selectedCountryId,
      page: 1,
      limit: 100,
      archiveScope,
      search: search || undefined,
    },
    Boolean(companyId) && can(GEO_CITIES_PERMISSIONS.read) && tab === 'cities',
  );
  const districtsQuery = useGeoDistricts(
    {
      companyId: companyId || undefined,
      cityId: selectedCityId === 'all' ? undefined : selectedCityId,
      countryId: selectedCountryId === 'all' ? undefined : selectedCountryId,
      page: 1,
      limit: 100,
      archiveScope,
      search: search || undefined,
    },
    Boolean(companyId) && can(GEO_DISTRICTS_PERMISSIONS.read) && tab === 'districts',
  );

  const filterCountries = useGeoCountries(
    { companyId: companyId || undefined, page: 1, limit: 200, archiveScope: 'active' },
    Boolean(companyId),
  );
  const companyCountries = useCompanyGeoCountries(companyId || '', Boolean(companyId));
  const filterCities = useGeoCities(
    {
      companyId: companyId || undefined,
      countryId: selectedCountryId === 'all' ? undefined : selectedCountryId,
      page: 1,
      limit: 200,
      archiveScope: 'active',
    },
    Boolean(companyId && (tab === 'cities' || tab === 'districts')),
  );

  const createCity = useCreateGeoCity();
  const updateCity = useUpdateGeoCity();
  const deleteCity = useDeleteGeoCity();
  const restoreCity = useRestoreGeoCity();
  const createDistrict = useCreateGeoDistrict();
  const updateDistrict = useUpdateGeoDistrict();
  const deleteDistrict = useDeleteGeoDistrict();
  const restoreDistrict = useRestoreGeoDistrict();

  const countryNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const row of filterCountries.data?.items ?? []) {
      map.set(row.id, `${row.nameAr}${row.code ? ` (${row.code})` : ''}`);
    }
    return map;
  }, [filterCountries.data?.items]);

  const countryCodeById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const row of filterCountries.data?.items ?? []) {
      map.set(row.id, row.code.trim().toUpperCase());
    }
    return map;
  }, [filterCountries.data?.items]);

  /** Whether a catalog country is activated for the store via company-countries. */
  const storeActiveByCountryId = React.useMemo(() => {
    const activeCodes = new Set(
      (companyCountries.data ?? [])
        .filter((link) => link.showInStore)
        .map((link) => link.countryCode.trim().toUpperCase()),
    );
    const map = new Map<string, boolean>();
    for (const [id, code] of countryCodeById) {
      map.set(id, activeCodes.has(code));
    }
    return map;
  }, [companyCountries.data, countryCodeById]);

  const cityNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const row of filterCities.data?.items ?? []) {
      map.set(row.id, row.nameAr);
    }
    for (const row of citiesQuery.data?.items ?? []) {
      map.set(row.id, row.nameAr);
    }
    return map;
  }, [filterCities.data?.items, citiesQuery.data?.items]);

  const cityCountryIdById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const row of filterCities.data?.items ?? []) {
      map.set(row.id, row.countryId);
    }
    for (const row of citiesQuery.data?.items ?? []) {
      map.set(row.id, row.countryId);
    }
    return map;
  }, [filterCities.data?.items, citiesQuery.data?.items]);

  function inheritShowInStoreForCountry(countryId: string): boolean {
    return storeActiveByCountryId.get(countryId) === true;
  }

  function inheritShowInStoreForCity(cityId: string): boolean {
    const countryId = cityCountryIdById.get(cityId);
    return countryId ? inheritShowInStoreForCountry(countryId) : false;
  }

  function openCreate() {
    if (tab === 'countries') return;
    setEditTarget(null);
    setForm({
      ...EMPTY_FORM,
      countryId: selectedCountryId !== 'all' ? selectedCountryId : '',
      cityId: selectedCityId !== 'all' ? selectedCityId : '',
    });
    setDialogOpen(true);
  }

  function openEdit(kind: 'city' | 'district', row: GeoCity | GeoDistrict) {
    if (kind === 'city') {
      const city = row as GeoCity;
      setEditTarget({ kind, row: city });
      setForm({
        ...EMPTY_FORM,
        nameAr: city.nameAr,
        nameEn: city.nameEn ?? '',
        sortOrder: String(city.sortOrder),
        isActive: city.isActive,
        countryId: city.countryId,
      });
    } else {
      const district = row as GeoDistrict;
      setEditTarget({ kind, row: district });
      setForm({
        ...EMPTY_FORM,
        nameAr: district.nameAr,
        nameEn: district.nameEn ?? '',
        sortOrder: String(district.sortOrder),
        isActive: district.isActive,
        cityId: district.cityId,
      });
    }
    setDialogOpen(true);
  }

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    if (!companyId || !form.nameAr.trim()) return;
    const sortOrder = Number(form.sortOrder) || 0;

    if (tab === 'cities') {
      if (!form.countryId) return;
      const showInStore = inheritShowInStoreForCountry(form.countryId);
      if (editTarget?.kind === 'city') {
        await updateCity.mutateAsync({
          id: editTarget.row.id,
          patch: {
            countryId: form.countryId,
            nameAr: form.nameAr,
            nameEn: form.nameEn || null,
            sortOrder,
            isActive: form.isActive,
            showInStore,
          },
        });
      } else {
        await createCity.mutateAsync({
          companyId,
          countryId: form.countryId,
          nameAr: form.nameAr,
          nameEn: form.nameEn || null,
          sortOrder,
          isActive: form.isActive,
          showInStore,
        });
      }
    } else if (tab === 'districts') {
      if (!form.cityId) return;
      const showInStore = inheritShowInStoreForCity(form.cityId);
      if (editTarget?.kind === 'district') {
        await updateDistrict.mutateAsync({
          id: editTarget.row.id,
          patch: {
            cityId: form.cityId,
            nameAr: form.nameAr,
            nameEn: form.nameEn || null,
            sortOrder,
            isActive: form.isActive,
            showInStore,
          },
        });
      } else {
        await createDistrict.mutateAsync({
          companyId,
          cityId: form.cityId,
          nameAr: form.nameAr,
          nameEn: form.nameEn || null,
          sortOrder,
          isActive: form.isActive,
          showInStore,
        });
      }
    }
    setDialogOpen(false);
  }

  if (!canReadAny) return <ForbiddenState />;

  const saving =
    createCity.isPending ||
    updateCity.isPending ||
    createDistrict.isPending ||
    updateDistrict.isPending;

  const createPerm =
    tab === 'cities' ? GEO_CITIES_PERMISSIONS.create : GEO_DISTRICTS_PERMISSIONS.create;

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col gap-4', embedded && 'gap-3')}>
      {!embedded ? (
        <SetPageTitle
          titleAr="المواقع الجغرافية"
          descriptionAr="فعّل الدولة للشركة، ثم أضف مدناً وأحياء تحتها. الظهور في المتجر يتبع تفعيل الدولة."
          iconName="MapPin"
        />
      ) : null}

      {!companyId ? (
        <p className="text-sm text-muted-foreground">اختر شركة أولاً لإدارة المواقع.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-3">
            {tab !== 'countries' ? (
              <>
                <div className="space-y-1.5">
                  <Label>الأرشفة</Label>
                  <Select
                    value={archiveScope}
                    onValueChange={(v) => setArchiveScope(v as ArchiveScope)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">النشطة</SelectItem>
                      <SelectItem value="archived">المؤرشفة</SelectItem>
                      <SelectItem value="all">الكل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-[12rem] flex-1 space-y-1.5">
                  <Label>بحث</Label>
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="اسم…"
                  />
                </div>
                <Can permission={createPerm}>
                  <Button className="ms-auto" onClick={openCreate}>
                    <Plus className="me-1.5 h-4 w-4" />
                    {tab === 'cities' ? 'إضافة مدينة' : 'إضافة حي'}
                  </Button>
                </Can>
              </>
            ) : null}
          </div>

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as typeof tab)}
            className="flex min-h-0 flex-1 flex-col gap-4"
          >
            <TabsList className="h-auto w-fit flex-wrap">
              <TabsTrigger value="countries">الدول (تفعيل)</TabsTrigger>
              <TabsTrigger value="cities">المدن (إضافة)</TabsTrigger>
              <TabsTrigger value="districts">الأحياء (إضافة)</TabsTrigger>
            </TabsList>

            <TabsContent value="countries" className="mt-0 space-y-3">
              <GeoCompanyCountriesPanel companyId={companyId} />
            </TabsContent>

            <TabsContent value="cities" className="mt-0 space-y-3">
              <p className="text-xs text-muted-foreground">
                أضف مدينة تحت دولة، أو بدّل ظهورها في المتجر. تفعيل الدولة يزامِن المدن أيضاً.
              </p>
              <div className="space-y-1.5">
                <Label>تصفية بالدولة</Label>
                <Select value={selectedCountryId} onValueChange={setSelectedCountryId}>
                  <SelectTrigger className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الدول</SelectItem>
                    {(filterCountries.data?.items ?? []).map((country) => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.nameAr}
                        {storeActiveByCountryId.get(country.id) ? ' · مفعّلة' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <EntityTable
                loading={citiesQuery.isLoading}
                error={citiesQuery.isError}
                empty="لا توجد مدن ضمن هذا الفلتر."
                onRetry={() => void citiesQuery.refetch()}
                rows={(citiesQuery.data?.items ?? []).map((row) => ({
                  id: row.id,
                  title: row.nameAr,
                  subtitle: countryNameById.get(row.countryId) ?? row.countryId.slice(0, 8),
                  isActive: row.isActive,
                  isArchived: row.isArchived,
                  showInStore: row.showInStore,
                  meta: storeActiveByCountryId.get(row.countryId)
                    ? 'الدولة مفعّلة'
                    : 'الدولة غير مفعّلة بالمتجر',
                  onEdit: () => openEdit('city', row),
                  onToggleStore: can(GEO_CITIES_PERMISSIONS.update)
                    ? async (next) => {
                        try {
                          await geoCitiesApi.update(row.id, { showInStore: next }, { silent: true });
                          toast.success(next ? 'تم إظهار المدينة بالمتجر' : 'تم إخفاء المدينة عن المتجر');
                          await citiesQuery.refetch();
                        } catch (error) {
                          if (error instanceof ApiError && error.status === 404) {
                            toast.error('هذه المدينة غير موجودة في السيرفر — حدّث القائمة');
                            await citiesQuery.refetch();
                            return;
                          }
                          throw error;
                        }
                      }
                    : undefined,
                  onArchive: () => {
                    if (window.confirm('أرشفة هذه المدينة؟')) deleteCity.mutate(row.id);
                  },
                  onRestore: () => {
                    if (window.confirm('استرجاع هذه المدينة من الأرشيف؟')) {
                      restoreCity.mutate(row.id);
                    }
                  },
                  canUpdate: can(GEO_CITIES_PERMISSIONS.update),
                  canDelete: can(GEO_CITIES_PERMISSIONS.delete),
                }))}
              />
            </TabsContent>

            <TabsContent value="districts" className="mt-0 space-y-3">
              <p className="text-xs text-muted-foreground">
                أضف حياً تحت مدينة، أو بدّل ظهوره في المتجر.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="space-y-1.5">
                  <Label>الدولة</Label>
                  <Select
                    value={selectedCountryId}
                    onValueChange={(v) => {
                      setSelectedCountryId(v);
                      setSelectedCityId('all');
                    }}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الدول</SelectItem>
                      {(filterCountries.data?.items ?? []).map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.nameAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>المدينة</Label>
                  <Select value={selectedCityId} onValueChange={setSelectedCityId}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل المدن</SelectItem>
                      {(filterCities.data?.items ?? []).map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.nameAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <EntityTable
                loading={districtsQuery.isLoading}
                error={districtsQuery.isError}
                empty="لا توجد أحياء ضمن هذا الفلتر."
                onRetry={() => void districtsQuery.refetch()}
                rows={(districtsQuery.data?.items ?? []).map((row) => {
                  const countryId = cityCountryIdById.get(row.cityId);
                  return {
                    id: row.id,
                    title: row.nameAr,
                    subtitle: cityNameById.get(row.cityId) ?? row.cityId.slice(0, 8),
                    isActive: row.isActive,
                    isArchived: row.isArchived,
                    showInStore: row.showInStore,
                    meta:
                      countryId && storeActiveByCountryId.get(countryId)
                        ? 'الدولة مفعّلة'
                        : 'الدولة غير مفعّلة بالمتجر',
                    onEdit: () => openEdit('district', row),
                    onToggleStore: can(GEO_DISTRICTS_PERMISSIONS.update)
                      ? async (next) => {
                          try {
                            await geoDistrictsApi.update(
                              row.id,
                              { showInStore: next },
                              { silent: true },
                            );
                            toast.success(
                              next ? 'تم إظهار الحي بالمتجر' : 'تم إخفاء الحي عن المتجر',
                            );
                            await districtsQuery.refetch();
                          } catch (error) {
                            if (error instanceof ApiError && error.status === 404) {
                              toast.error('هذا الحي غير موجود في السيرفر — حدّث القائمة');
                              await districtsQuery.refetch();
                              return;
                            }
                            throw error;
                          }
                        }
                      : undefined,
                    onArchive: () => {
                      if (window.confirm('أرشفة هذا الحي؟')) deleteDistrict.mutate(row.id);
                    },
                    onRestore: () => {
                      if (window.confirm('استرجاع هذا الحي من الأرشيف؟')) {
                        restoreDistrict.mutate(row.id);
                      }
                    },
                    canUpdate: can(GEO_DISTRICTS_PERMISSIONS.update),
                    canDelete: can(GEO_DISTRICTS_PERMISSIONS.delete),
                  };
                })}
              />
            </TabsContent>
          </Tabs>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editTarget
                ? tab === 'cities'
                  ? 'تعديل مدينة'
                  : 'تعديل حي'
                : tab === 'cities'
                  ? 'مدينة جديدة'
                  : 'حي جديد'}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={(e) => void onSave(e)}>
            {tab === 'cities' ? (
              <div className="space-y-1.5">
                <Label>الدولة</Label>
                <Select
                  value={form.countryId}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, countryId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الدولة" />
                  </SelectTrigger>
                  <SelectContent>
                    {(filterCountries.data?.items ?? []).map((country) => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.nameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.countryId ? (
                  <p className="text-[11px] text-muted-foreground">
                    {inheritShowInStoreForCountry(form.countryId)
                      ? 'الدولة مفعّلة — ستظهر المدينة في المتجر تلقائياً.'
                      : 'الدولة غير مفعّلة — فعّلها من تاب الدول لتظهر هذه المدينة بالمتجر.'}
                  </p>
                ) : null}
              </div>
            ) : null}
            {tab === 'districts' ? (
              <div className="space-y-1.5">
                <Label>المدينة</Label>
                <Select
                  value={form.cityId}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, cityId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المدينة" />
                  </SelectTrigger>
                  <SelectContent>
                    {(filterCities.data?.items ?? []).map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.nameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label>الاسم بالعربية</Label>
              <Input
                value={form.nameAr}
                onChange={(e) => setForm((prev) => ({ ...prev, nameAr: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>الاسم بالإنجليزية</Label>
              <Input
                value={form.nameEn}
                onChange={(e) => setForm((prev) => ({ ...prev, nameEn: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>الترتيب</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <span className="text-sm">نشط في الكتالوج</span>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm((prev) => ({ ...prev, isActive: v }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={
                  saving ||
                  !form.nameAr.trim() ||
                  (tab === 'cities' && !form.countryId) ||
                  (tab === 'districts' && !form.cityId)
                }
              >
                حفظ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type GeoEntityTableProps = {
  loading: boolean;
  error: boolean;
  empty: string;
  onRetry: () => void;
  rows: Array<{
    id: string;
    title: string;
    subtitle?: string;
    meta?: string;
    isActive: boolean;
    isArchived: boolean;
    showInStore?: boolean;
    onEdit: () => void;
    onToggleStore?: (next: boolean) => void | Promise<void>;
    onArchive: () => void;
    onRestore?: () => void;
    canUpdate: boolean;
    canDelete: boolean;
  }>;
};

function EntityTable({ loading, error, empty, onRetry, rows }: GeoEntityTableProps) {
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/40" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-card p-4 text-sm text-destructive">
        تعذر التحميل.
        <button type="button" className="ms-2 underline" onClick={onRetry}>
          إعادة المحاولة
        </button>
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
        <MapPinned className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{empty}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li
          key={row.id}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-foreground">{row.title}</p>
              {row.isArchived ? (
                <Badge variant="subtle" className="text-muted-foreground">
                  مؤرشف
                </Badge>
              ) : !row.isActive ? (
                <Badge variant="subtle" className="text-amber-700 dark:text-amber-400">
                  غير نشط
                </Badge>
              ) : null}
              {row.showInStore ? (
                <Badge
                  variant="subtle"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                >
                  بالمتجر
                </Badge>
              ) : row.showInStore === false ? (
                <Badge variant="subtle" className="text-muted-foreground">
                  مخفي
                </Badge>
              ) : null}
            </div>
            {row.subtitle ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{row.subtitle}</p>
            ) : null}
            {row.meta ? (
              <p className="mt-0.5 text-[11px] text-muted-foreground">{row.meta}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            {row.onToggleStore && row.canUpdate && !row.isArchived ? (
              <div className="me-1 flex items-center gap-1.5 rounded-lg border border-border px-2 py-1">
                <span className="text-[11px] text-muted-foreground">متجر</span>
                <Switch
                  checked={Boolean(row.showInStore)}
                  disabled={togglingId === row.id}
                  onCheckedChange={(next) => {
                    setTogglingId(row.id);
                    void Promise.resolve(row.onToggleStore?.(next)).finally(() =>
                      setTogglingId(null),
                    );
                  }}
                  aria-label="ظهور بالمتجر"
                />
              </div>
            ) : null}
            {row.canUpdate && !row.isArchived ? (
              <Button type="button" variant="ghost" size="sm" onClick={row.onEdit}>
                <Pencil className="h-4 w-4" />
              </Button>
            ) : null}
            {row.isArchived && row.canUpdate && row.onRestore ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                title="استرجاع من الأرشيف"
                onClick={row.onRestore}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            ) : null}
            {row.canDelete && !row.isArchived ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={row.onArchive}
              >
                <Archive className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

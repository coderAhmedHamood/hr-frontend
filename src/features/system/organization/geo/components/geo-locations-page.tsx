'use client';

import * as React from 'react';
import { Archive, MapPinned, Pencil, Plus, Store } from 'lucide-react';
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
import {
  useCreateGeoCity,
  useCreateGeoCountry,
  useCreateGeoDistrict,
  useDeleteGeoCity,
  useDeleteGeoCountry,
  useDeleteGeoDistrict,
  useGeoCities,
  useGeoCountries,
  useGeoDistricts,
  useUpdateGeoCity,
  useUpdateGeoCountry,
  useUpdateGeoDistrict,
} from '@/features/system/organization/geo/hooks/use-geo';
import type { ArchiveScope, GeoCity, GeoCountry, GeoDistrict } from '@/features/system/organization/geo/lib/api/geo-api';
import {
  GEO_CITIES_PERMISSIONS,
  GEO_COUNTRIES_PERMISSIONS,
  GEO_DISTRICTS_PERMISSIONS,
} from '@/features/system/organization/geo/permissions';

type EntityForm = {
  code: string;
  nameAr: string;
  nameEn: string;
  sortOrder: string;
  isActive: boolean;
  showInStore: boolean;
  countryId: string;
  cityId: string;
};

const EMPTY_FORM: EntityForm = {
  code: '',
  nameAr: '',
  nameEn: '',
  sortOrder: '0',
  isActive: true,
  showInStore: false,
  countryId: '',
  cityId: '',
};

export default function GeoLocationsPage() {
  const can = useCan();
  const companyId = useDefaultCompanyId();
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
    | { kind: 'country'; row: GeoCountry }
    | { kind: 'city'; row: GeoCity }
    | { kind: 'district'; row: GeoDistrict }
    | null
  >(null);
  const [form, setForm] = React.useState<EntityForm>(EMPTY_FORM);

  const countriesQuery = useGeoCountries(
    {
      companyId: companyId || undefined,
      page: 1,
      limit: 100,
      archiveScope,
      search: search || undefined,
    },
    Boolean(companyId) && can(GEO_COUNTRIES_PERMISSIONS.read) && tab === 'countries',
  );
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

  const createCountry = useCreateGeoCountry();
  const updateCountry = useUpdateGeoCountry();
  const deleteCountry = useDeleteGeoCountry();
  const createCity = useCreateGeoCity();
  const updateCity = useUpdateGeoCity();
  const deleteCity = useDeleteGeoCity();
  const createDistrict = useCreateGeoDistrict();
  const updateDistrict = useUpdateGeoDistrict();
  const deleteDistrict = useDeleteGeoDistrict();

  const countryNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const row of filterCountries.data?.items ?? []) {
      map.set(row.id, `${row.nameAr}${row.code ? ` (${row.code})` : ''}`);
    }
    return map;
  }, [filterCountries.data?.items]);

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

  function openCreate() {
    setEditTarget(null);
    setForm({
      ...EMPTY_FORM,
      countryId: selectedCountryId !== 'all' ? selectedCountryId : '',
      cityId: selectedCityId !== 'all' ? selectedCityId : '',
      code: tab === 'countries' ? 'YE' : '',
    });
    setDialogOpen(true);
  }

  function openEdit(
    kind: 'country' | 'city' | 'district',
    row: GeoCountry | GeoCity | GeoDistrict,
  ) {
    if (kind === 'country') {
      const country = row as GeoCountry;
      setEditTarget({ kind, row: country });
      setForm({
        ...EMPTY_FORM,
        code: country.code,
        nameAr: country.nameAr,
        nameEn: country.nameEn ?? '',
        sortOrder: String(country.sortOrder),
        isActive: country.isActive,
        showInStore: country.showInStore,
      });
    } else if (kind === 'city') {
      const city = row as GeoCity;
      setEditTarget({ kind, row: city });
      setForm({
        ...EMPTY_FORM,
        nameAr: city.nameAr,
        nameEn: city.nameEn ?? '',
        sortOrder: String(city.sortOrder),
        isActive: city.isActive,
        showInStore: city.showInStore,
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
        showInStore: district.showInStore,
        cityId: district.cityId,
      });
    }
    setDialogOpen(true);
  }

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    if (!companyId || !form.nameAr.trim()) return;
    const sortOrder = Number(form.sortOrder) || 0;

    if (tab === 'countries') {
      if (editTarget?.kind === 'country') {
        await updateCountry.mutateAsync({
          id: editTarget.row.id,
          patch: {
            code: form.code,
            nameAr: form.nameAr,
            nameEn: form.nameEn || null,
            sortOrder,
            isActive: form.isActive,
            showInStore: form.showInStore,
          },
        });
      } else {
        if (!form.code.trim()) return;
        await createCountry.mutateAsync({
          companyId,
          code: form.code,
          nameAr: form.nameAr,
          nameEn: form.nameEn || null,
          sortOrder,
          isActive: form.isActive,
          showInStore: form.showInStore,
        });
      }
    } else if (tab === 'cities') {
      if (!form.countryId) return;
      if (editTarget?.kind === 'city') {
        await updateCity.mutateAsync({
          id: editTarget.row.id,
          patch: {
            countryId: form.countryId,
            nameAr: form.nameAr,
            nameEn: form.nameEn || null,
            sortOrder,
            isActive: form.isActive,
            showInStore: form.showInStore,
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
          showInStore: form.showInStore,
        });
      }
    } else {
      if (!form.cityId) return;
      if (editTarget?.kind === 'district') {
        await updateDistrict.mutateAsync({
          id: editTarget.row.id,
          patch: {
            cityId: form.cityId,
            nameAr: form.nameAr,
            nameEn: form.nameEn || null,
            sortOrder,
            isActive: form.isActive,
            showInStore: form.showInStore,
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
          showInStore: form.showInStore,
        });
      }
    }
    setDialogOpen(false);
  }

  async function toggleShowInStore(
    kind: 'country' | 'city' | 'district',
    id: string,
    next: boolean,
  ) {
    if (kind === 'country') await updateCountry.mutateAsync({ id, patch: { showInStore: next } });
    else if (kind === 'city') await updateCity.mutateAsync({ id, patch: { showInStore: next } });
    else await updateDistrict.mutateAsync({ id, patch: { showInStore: next } });
  }

  if (!canReadAny) return <ForbiddenState />;

  const saving =
    createCountry.isPending ||
    updateCountry.isPending ||
    createCity.isPending ||
    updateCity.isPending ||
    createDistrict.isPending ||
    updateDistrict.isPending;

  const createPerm =
    tab === 'countries'
      ? GEO_COUNTRIES_PERMISSIONS.create
      : tab === 'cities'
        ? GEO_CITIES_PERMISSIONS.create
        : GEO_DISTRICTS_PERMISSIONS.create;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <SetPageTitle
        titleAr="المواقع الجغرافية"
        descriptionAr="دول → مدن → أحياء. فعّل «ظهور بالمتجر» لتظهر في قوائم الشحن والـ checkout."
        iconName="MapPin"
      />

      {!companyId ? (
        <p className="text-sm text-muted-foreground">اختر شركة أولاً لإدارة المواقع.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-3">
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
                placeholder="اسم أو رمز…"
              />
            </div>
            <Can permission={createPerm}>
              <Button className="ms-auto" onClick={openCreate}>
                <Plus className="me-1.5 h-4 w-4" />
                إضافة
              </Button>
            </Can>
          </div>

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as typeof tab)}
            className="flex min-h-0 flex-1 flex-col gap-4"
          >
            <TabsList className="w-fit">
              <TabsTrigger value="countries">الدول</TabsTrigger>
              <TabsTrigger value="cities">المدن</TabsTrigger>
              <TabsTrigger value="districts">الأحياء</TabsTrigger>
            </TabsList>

            <TabsContent value="countries" className="mt-0 space-y-3">
              <EntityTable
                loading={countriesQuery.isLoading}
                error={countriesQuery.isError}
                empty="لا توجد دول بعد."
                onRetry={() => void countriesQuery.refetch()}
                rows={(countriesQuery.data?.items ?? []).map((row) => ({
                  id: row.id,
                  title: row.nameAr,
                  subtitle: row.code,
                  showInStore: row.showInStore,
                  isActive: row.isActive,
                  isArchived: row.isArchived,
                  meta: `ترتيب ${row.sortOrder}`,
                  onEdit: () => openEdit('country', row),
                  onToggleStore: (next: boolean) => void toggleShowInStore('country', row.id, next),
                  onArchive: () => {
                    if (window.confirm('أرشفة هذه الدولة؟')) deleteCountry.mutate(row.id);
                  },
                  canUpdate: can(GEO_COUNTRIES_PERMISSIONS.update),
                  canDelete: can(GEO_COUNTRIES_PERMISSIONS.delete),
                }))}
              />
            </TabsContent>

            <TabsContent value="cities" className="mt-0 space-y-3">
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
                  showInStore: row.showInStore,
                  isActive: row.isActive,
                  isArchived: row.isArchived,
                  meta: `ترتيب ${row.sortOrder}`,
                  onEdit: () => openEdit('city', row),
                  onToggleStore: (next: boolean) => void toggleShowInStore('city', row.id, next),
                  onArchive: () => {
                    if (window.confirm('أرشفة هذه المدينة؟')) deleteCity.mutate(row.id);
                  },
                  canUpdate: can(GEO_CITIES_PERMISSIONS.update),
                  canDelete: can(GEO_CITIES_PERMISSIONS.delete),
                }))}
              />
            </TabsContent>

            <TabsContent value="districts" className="mt-0 space-y-3">
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
                rows={(districtsQuery.data?.items ?? []).map((row) => ({
                  id: row.id,
                  title: row.nameAr,
                  subtitle: cityNameById.get(row.cityId) ?? row.cityId.slice(0, 8),
                  showInStore: row.showInStore,
                  isActive: row.isActive,
                  isArchived: row.isArchived,
                  meta: `ترتيب ${row.sortOrder}`,
                  onEdit: () => openEdit('district', row),
                  onToggleStore: (next: boolean) => void toggleShowInStore('district', row.id, next),
                  onArchive: () => {
                    if (window.confirm('أرشفة هذا الحي؟')) deleteDistrict.mutate(row.id);
                  },
                  canUpdate: can(GEO_DISTRICTS_PERMISSIONS.update),
                  canDelete: can(GEO_DISTRICTS_PERMISSIONS.delete),
                }))}
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
                ? tab === 'countries'
                  ? 'تعديل دولة'
                  : tab === 'cities'
                    ? 'تعديل مدينة'
                    : 'تعديل حي'
                : tab === 'countries'
                  ? 'دولة جديدة'
                  : tab === 'cities'
                    ? 'مدينة جديدة'
                    : 'حي جديد'}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={(e) => void onSave(e)}>
            {tab === 'countries' ? (
              <div className="space-y-1.5">
                <Label>الرمز (ISO)</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder="YE"
                  required
                />
              </div>
            ) : null}
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
              <span className="text-sm">نشط</span>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm((prev) => ({ ...prev, isActive: v }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-sm">ظهور بالمتجر</p>
                <p className="text-xs text-muted-foreground">showInStore — قوائم الشحن والـ checkout</p>
              </div>
              <Switch
                checked={form.showInStore}
                onCheckedChange={(v) => setForm((prev) => ({ ...prev, showInStore: v }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={saving || !form.nameAr.trim()}>
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
    showInStore: boolean;
    isActive: boolean;
    isArchived: boolean;
    onEdit: () => void;
    onToggleStore: (next: boolean) => void;
    onArchive: () => void;
    canUpdate: boolean;
    canDelete: boolean;
  }>;
};

function EntityTable({ loading, error, empty, onRetry, rows }: GeoEntityTableProps) {
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
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3"
        >
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-foreground">{row.title}</p>
              {row.subtitle ? (
                <span className="text-xs text-muted-foreground" dir="ltr">
                  {row.subtitle}
                </span>
              ) : null}
              {!row.isActive ? <Badge variant="outline">غير نشط</Badge> : null}
              {row.isArchived ? (
                <Badge variant="outline" className="gap-1">
                  <Archive className="h-3 w-3" />
                  مؤرشف
                </Badge>
              ) : null}
            </div>
            {row.meta ? <p className="text-xs text-muted-foreground">{row.meta}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {row.canUpdate && !row.isArchived ? (
              <div className="flex items-center gap-2 rounded-xl border border-border px-2.5 py-1.5">
                <Store className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">بالمتجر</span>
                <Switch checked={row.showInStore} onCheckedChange={row.onToggleStore} />
              </div>
            ) : row.showInStore ? (
              <Badge variant="secondary" className="gap-1">
                <Store className="h-3 w-3" />
                بالمتجر
              </Badge>
            ) : null}
            {row.canUpdate && !row.isArchived ? (
              <Button size="sm" variant="outline" onClick={row.onEdit}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            ) : null}
            {row.canDelete && !row.isArchived ? (
              <Button size="sm" variant="ghost" className="text-destructive" onClick={row.onArchive}>
                <Archive className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

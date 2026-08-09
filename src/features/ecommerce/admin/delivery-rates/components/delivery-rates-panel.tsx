'use client';

import * as React from 'react';
import { Archive, Banknote, Pencil, Plus, RotateCcw } from 'lucide-react';
import { Can } from '@/components/shared/can';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useCan } from '@/features/auth/hooks/use-can';
import {
  useCreateDeliveryRate,
  useDeleteDeliveryRate,
  useDeliveryRates,
  useRestoreDeliveryRate,
  useUpdateDeliveryRate,
} from '@/features/ecommerce/admin/delivery-rates/hooks/use-delivery-rates';
import type {
  ArchiveScope,
  DeliveryRateScopeType,
  StoreDeliveryRate,
} from '@/features/ecommerce/admin/delivery-rates/lib/api/delivery-rates-api';
import { DELIVERY_RATES_PERMISSIONS } from '@/features/ecommerce/admin/delivery-rates/permissions';
import {
  useCompanyGeoCountries,
  useGeoCities,
  useGeoCountries,
  useGeoDistricts,
} from '@/features/system/organization/geo/hooks/use-geo';
import { cn } from '@/shared/utils';

type Props = {
  companyId: string;
  /** Default currency from store settings (optional override on create). */
  currencyCode?: string;
};

type FormState = {
  name: string;
  amount: string;
  scopeType: DeliveryRateScopeType;
  countryId: string;
  cityIdForDistricts: string;
  cityIds: string[];
  districtIds: string[];
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  name: '',
  amount: '',
  scopeType: 'city',
  countryId: '',
  cityIdForDistricts: '',
  cityIds: [],
  districtIds: [],
  isActive: true,
};

function parseAmount(raw: string): number | null {
  const n = Number(String(raw).replace(/,/g, '').trim());
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function formatAmount(raw: string | number): string {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return String(raw);
  return n.toLocaleString('ar-YE', { maximumFractionDigits: 2 });
}

function toggleId(list: string[], id: string, checked: boolean): string[] {
  if (checked) return list.includes(id) ? list : [...list, id];
  return list.filter((item) => item !== id);
}

export function DeliveryRatesPanel({ companyId, currencyCode }: Props) {
  const can = useCan();
  const [archiveScope, setArchiveScope] = React.useState<ArchiveScope>('active');
  const [countryFilter, setCountryFilter] = React.useState<string>('all');
  const [scopeFilter, setScopeFilter] = React.useState<'all' | DeliveryRateScopeType>('all');
  const [search, setSearch] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<StoreDeliveryRate | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);

  const listQuery = {
    page: 1,
    limit: 100,
    archiveScope,
    countryId: countryFilter === 'all' ? undefined : countryFilter,
    scopeType: scopeFilter === 'all' ? undefined : scopeFilter,
    search: search.trim() || undefined,
  };

  const ratesQuery = useDeliveryRates(companyId, listQuery, Boolean(companyId));
  const createRate = useCreateDeliveryRate(companyId);
  const updateRate = useUpdateDeliveryRate(companyId);
  const deleteRate = useDeleteDeliveryRate(companyId);
  const restoreRate = useRestoreDeliveryRate(companyId);

  const companyCountries = useCompanyGeoCountries(companyId, Boolean(companyId));
  const countriesQuery = useGeoCountries(
    { companyId, page: 1, limit: 200, archiveScope: 'active' },
    Boolean(companyId),
  );

  const storeCountryIds = React.useMemo(() => {
    const activeCodes = new Set(
      (companyCountries.data ?? [])
        .filter((link) => link.showInStore)
        .map((link) => link.countryCode.trim().toUpperCase()),
    );
    return (countriesQuery.data?.items ?? []).filter((country) =>
      activeCodes.has(country.code.trim().toUpperCase()),
    );
  }, [companyCountries.data, countriesQuery.data?.items]);

  const countryOptions =
    storeCountryIds.length > 0 ? storeCountryIds : (countriesQuery.data?.items ?? []);

  const formCountryId = form.countryId || (countryFilter !== 'all' ? countryFilter : '');

  const citiesQuery = useGeoCities(
    {
      companyId,
      countryId: formCountryId || undefined,
      page: 1,
      limit: 200,
      archiveScope: 'active',
    },
    Boolean(companyId && formCountryId && dialogOpen),
  );

  const districtsQuery = useGeoDistricts(
    {
      companyId,
      cityId: form.cityIdForDistricts || undefined,
      page: 1,
      limit: 200,
      archiveScope: 'active',
    },
    Boolean(companyId && form.scopeType === 'district' && form.cityIdForDistricts && dialogOpen),
  );

  const countryNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const row of countriesQuery.data?.items ?? []) {
      map.set(row.id, `${row.nameAr}${row.code ? ` (${row.code})` : ''}`);
    }
    return map;
  }, [countriesQuery.data?.items]);

  function openCreate(scopeType: DeliveryRateScopeType) {
    setEditTarget(null);
    setForm({
      ...EMPTY_FORM,
      scopeType,
      countryId: countryFilter !== 'all' ? countryFilter : countryOptions[0]?.id ?? '',
    });
    setDialogOpen(true);
  }

  function openEdit(row: StoreDeliveryRate) {
    setEditTarget(row);
    setForm({
      name: row.name,
      amount: String(Number(row.amount)),
      scopeType: row.scopeType,
      countryId: row.countryId,
      cityIdForDistricts: '',
      cityIds: row.cities.map((c) => c.id),
      districtIds: row.districts.map((d) => d.id),
      isActive: row.isActive,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const amount = parseAmount(form.amount);
    if (!form.name.trim()) return;
    if (amount === null) return;
    if (!form.countryId) return;

    if (editTarget) {
      await updateRate.mutateAsync({
        id: editTarget.id,
        patch: {
          name: form.name,
          amount,
          isActive: form.isActive,
          ...(editTarget.scopeType === 'city' ? { cityIds: form.cityIds } : {}),
          ...(editTarget.scopeType === 'district' ? { districtIds: form.districtIds } : {}),
        },
      });
    } else {
      if (form.scopeType === 'city' && form.cityIds.length === 0) return;
      if (form.scopeType === 'district' && form.districtIds.length === 0) return;
      await createRate.mutateAsync({
        countryId: form.countryId,
        name: form.name,
        scopeType: form.scopeType,
        amount,
        currencyCode: currencyCode || undefined,
        cityIds: form.scopeType === 'city' ? form.cityIds : undefined,
        districtIds: form.scopeType === 'district' ? form.districtIds : undefined,
        isActive: form.isActive,
      });
    }
    setDialogOpen(false);
  }

  const saving = createRate.isPending || updateRate.isPending;
  const canCreate = can(DELIVERY_RATES_PERMISSIONS.create);
  const canUpdate = can(DELIVERY_RATES_PERMISSIONS.update);
  const canDelete = can(DELIVERY_RATES_PERMISSIONS.delete);

  return (
    <Can
      permission={DELIVERY_RATES_PERMISSIONS.read}
      fallback={
        <p className="text-sm text-muted-foreground">
          لا تملك صلاحية عرض أسعار التوصيل (`sta.delivery-rates.read`).
        </p>
      }
    >
      <div className="space-y-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          أولوية الحساب: سعر الحي إن وُجد، وإلا سعر المدينة، وإلا صفر. فعّل الدولة والمدن/الأحياء من
          تبويب المواقع الجغرافية أولاً.
        </p>

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label>الدولة</Label>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الدول</SelectItem>
                {countryOptions.map((country) => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.nameAr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>النطاق</Label>
            <Select
              value={scopeFilter}
              onValueChange={(v) => setScopeFilter(v as 'all' | DeliveryRateScopeType)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="city">مدن</SelectItem>
                <SelectItem value="district">أحياء</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>الأرشيف</Label>
            <Select
              value={archiveScope}
              onValueChange={(v) => setArchiveScope(v as ArchiveScope)}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">النشطة</SelectItem>
                <SelectItem value="archived">المؤرشفة</SelectItem>
                <SelectItem value="all">الكل</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[10rem] flex-1 space-y-1.5">
            <Label>بحث</Label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="اسم السعر…"
              className="h-10"
            />
          </div>
          {canCreate ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" className="gap-1.5" onClick={() => openCreate('city')}>
                <Plus className="h-4 w-4" />
                سعر مدن
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => openCreate('district')}
              >
                <Plus className="h-4 w-4" />
                سعر أحياء
              </Button>
            </div>
          ) : null}
        </div>

        {ratesQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/40" />
            ))}
          </div>
        ) : ratesQuery.isError ? (
          <div className="rounded-xl border border-destructive/30 bg-card p-4 text-sm text-destructive">
            تعذر تحميل أسعار التوصيل.
            <button
              type="button"
              className="ms-2 underline"
              onClick={() => void ratesQuery.refetch()}
            >
              إعادة المحاولة
            </button>
          </div>
        ) : (ratesQuery.data?.items ?? []).length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
            <Banknote className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">لا توجد أسعار ضمن هذا الفلتر.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {(ratesQuery.data?.items ?? []).map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{row.name}</p>
                    <Badge variant="subtle">
                      {row.scopeType === 'city' ? 'مدن' : 'أحياء'}
                    </Badge>
                    {row.isArchived ? (
                      <Badge variant="subtle" className="text-muted-foreground">
                        مؤرشف
                      </Badge>
                    ) : !row.isActive ? (
                      <Badge variant="subtle" className="text-amber-700 dark:text-amber-400">
                        غير نشط
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {countryNameById.get(row.countryId) ?? row.countryId.slice(0, 8)}
                    {' · '}
                    {formatAmount(row.amount)} {row.currencyCode}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {row.scopeType === 'city'
                      ? row.cities.map((c) => c.nameAr).join('، ') || 'بدون مدن'
                      : row.districts.map((d) => d.nameAr).join('، ') || 'بدون أحياء'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {canUpdate && !row.isArchived ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(row)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  ) : null}
                  {row.isArchived && canUpdate ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      title="استرجاع"
                      onClick={() => {
                        if (window.confirm('استرجاع سعر التوصيل من الأرشيف؟')) {
                          restoreRate.mutate(row.id);
                        }
                      }}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  ) : null}
                  {canDelete && !row.isArchived ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (window.confirm('أرشفة سعر التوصيل؟')) deleteRate.mutate(row.id);
                      }}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editTarget
                  ? 'تعديل سعر التوصيل'
                  : form.scopeType === 'city'
                    ? 'سعر توصيل للمدن'
                    : 'سعر توصيل للأحياء'}
              </DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
              <div className="space-y-1.5">
                <Label>الاسم</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="مثال: صنعاء والمناطق المجاورة"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>المبلغ {currencyCode ? `(${currencyCode})` : ''}</Label>
                  <Input
                    dir="ltr"
                    type="number"
                    min={0}
                    step="any"
                    value={form.amount}
                    onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>الدولة</Label>
                  <Select
                    value={form.countryId || undefined}
                    onValueChange={(countryId) =>
                      setForm((prev) => ({
                        ...prev,
                        countryId,
                        cityIds: [],
                        districtIds: [],
                        cityIdForDistricts: '',
                      }))
                    }
                    disabled={Boolean(editTarget)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر دولة" />
                    </SelectTrigger>
                    <SelectContent>
                      {countryOptions.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.nameAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                <span className="text-sm">نشط</span>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(isActive) => setForm((prev) => ({ ...prev, isActive }))}
                />
              </div>

              {(editTarget?.scopeType ?? form.scopeType) === 'city' ? (
                <div className="space-y-2">
                  <Label>المدن (اختيار متعدد)</Label>
                  {!form.countryId ? (
                    <p className="text-xs text-muted-foreground">اختر الدولة أولاً.</p>
                  ) : citiesQuery.isLoading ? (
                    <p className="text-xs text-muted-foreground">جاري التحميل…</p>
                  ) : (citiesQuery.data?.items ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">لا مدن تحت هذه الدولة.</p>
                  ) : (
                    <ul className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
                      {(citiesQuery.data?.items ?? []).map((city) => {
                        const checked = form.cityIds.includes(city.id);
                        return (
                          <li key={city.id}>
                            <label
                              className={cn(
                                'flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/50',
                                checked && 'bg-muted/40',
                              )}
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(next) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    cityIds: toggleId(prev.cityIds, city.id, Boolean(next)),
                                  }))
                                }
                              />
                              {city.nameAr}
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>مدينة (لتصفية الأحياء)</Label>
                    <Select
                      value={form.cityIdForDistricts || undefined}
                      onValueChange={(cityIdForDistricts) =>
                        setForm((prev) => ({
                          ...prev,
                          cityIdForDistricts,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر مدينة" />
                      </SelectTrigger>
                      <SelectContent>
                        {(citiesQuery.data?.items ?? []).map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.nameAr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>الأحياء (اختيار متعدد)</Label>
                    {editTarget && form.districtIds.length > 0 && !form.cityIdForDistricts ? (
                      <p className="text-[11px] text-muted-foreground">
                        المحدد حالياً:{' '}
                        {editTarget.districts.map((d) => d.nameAr).join('، ')} — اختر مدينة لتعديل
                        القائمة.
                      </p>
                    ) : null}
                    {!form.cityIdForDistricts ? (
                      <p className="text-xs text-muted-foreground">اختر مدينة لعرض أحياءها.</p>
                    ) : districtsQuery.isLoading ? (
                      <p className="text-xs text-muted-foreground">جاري التحميل…</p>
                    ) : (districtsQuery.data?.items ?? []).length === 0 ? (
                      <p className="text-xs text-muted-foreground">لا أحياء تحت هذه المدينة.</p>
                    ) : (
                      <ul className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
                        {(districtsQuery.data?.items ?? []).map((district) => {
                          const checked = form.districtIds.includes(district.id);
                          return (
                            <li key={district.id}>
                              <label
                                className={cn(
                                  'flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/50',
                                  checked && 'bg-muted/40',
                                )}
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(next) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      districtIds: toggleId(
                                        prev.districtIds,
                                        district.id,
                                        Boolean(next),
                                      ),
                                    }))
                                  }
                                />
                                {district.nameAr}
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={
                    saving ||
                    !form.name.trim() ||
                    parseAmount(form.amount) === null ||
                    !form.countryId ||
                    (!editTarget &&
                      form.scopeType === 'city' &&
                      form.cityIds.length === 0) ||
                    (!editTarget &&
                      form.scopeType === 'district' &&
                      form.districtIds.length === 0)
                  }
                >
                  حفظ
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Can>
  );
}

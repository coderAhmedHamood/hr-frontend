'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useGeoCities,
  useGeoCountries,
  useGeoDistricts,
  usePublicGeoCities,
  usePublicGeoCountries,
  usePublicGeoDistricts,
} from '@/features/system/organization/geo/hooks/use-geo';
import { cn } from '@/shared/utils';

export type GeoCascadeValue = {
  countryId: string | null;
  cityId: string | null;
  districtId: string | null;
  /** ISO / geo country code when known (e.g. YE). */
  countryCode: string | null;
  city: string;
  district: string;
};

export const EMPTY_GEO_CASCADE: GeoCascadeValue = {
  countryId: null,
  cityId: null,
  districtId: null,
  countryCode: null,
  city: '',
  district: '',
};

type Option = { id: string; nameAr: string; code?: string };

type Props = {
  companyId: string;
  /** `admin` = staff `/geo/...` (all active). `public` = storefront showInStore only. */
  mode?: 'admin' | 'public';
  value: GeoCascadeValue;
  onChange: (value: GeoCascadeValue) => void;
  disabled?: boolean;
  className?: string;
  showCountry?: boolean;
  labels?: {
    country?: string;
    city?: string;
    district?: string;
  };
};

export function GeoCascadeSelect({
  companyId,
  mode = 'admin',
  value,
  onChange,
  disabled,
  className,
  showCountry = true,
  labels,
}: Props) {
  const isAdmin = mode === 'admin';
  const isPublic = mode === 'public';

  const adminCountries = useGeoCountries(
    { companyId, page: 1, limit: 200, archiveScope: 'active', isActive: true },
    isAdmin && Boolean(companyId),
  );
  const adminCities = useGeoCities(
    {
      companyId,
      countryId: value.countryId || undefined,
      page: 1,
      limit: 200,
      archiveScope: 'active',
      isActive: true,
    },
    isAdmin && Boolean(companyId && value.countryId),
  );
  const adminDistricts = useGeoDistricts(
    {
      companyId,
      cityId: value.cityId || undefined,
      page: 1,
      limit: 200,
      archiveScope: 'active',
      isActive: true,
    },
    isAdmin && Boolean(companyId && value.cityId),
  );

  const publicCountries = usePublicGeoCountries(companyId, isPublic && Boolean(companyId));
  const publicCities = usePublicGeoCities(
    companyId,
    value.countryId ?? '',
    isPublic && Boolean(companyId && value.countryId),
  );
  const publicDistricts = usePublicGeoDistricts(
    companyId,
    value.cityId ?? '',
    isPublic && Boolean(companyId && value.cityId),
  );

  const countries: Option[] = isPublic
    ? (publicCountries.data ?? [])
    : (adminCountries.data?.items ?? []);
  const cities: Option[] = isPublic
    ? (publicCities.data ?? [])
    : (adminCities.data?.items ?? []);
  const districts: Option[] = isPublic
    ? (publicDistricts.data ?? [])
    : (adminDistricts.data?.items ?? []);

  const loadingCountries = isPublic ? publicCountries.isLoading : adminCountries.isLoading;
  const loadingCities = isPublic ? publicCities.isLoading : adminCities.isLoading;
  const loadingDistricts = isPublic ? publicDistricts.isLoading : adminDistricts.isLoading;

  const countryLabel = labels?.country ?? 'الدولة';
  const cityLabel = labels?.city ?? 'المدينة';
  const districtLabel = labels?.district ?? 'الحي';

  function selectCountry(id: string) {
    const country = countries.find((item) => item.id === id);
    onChange({
      countryId: id,
      cityId: null,
      districtId: null,
      countryCode: country?.code ?? null,
      city: '',
      district: '',
    });
  }

  function selectCity(id: string) {
    const city = cities.find((item) => item.id === id);
    onChange({
      ...value,
      cityId: id,
      districtId: null,
      city: city?.nameAr ?? '',
      district: '',
    });
  }

  function selectDistrict(id: string) {
    const district = districts.find((item) => item.id === id);
    onChange({
      ...value,
      districtId: id,
      district: district?.nameAr ?? '',
    });
  }

  return (
    <div className={cn('grid gap-2 sm:grid-cols-3', className)}>
      {showCountry ? (
        <div className="space-y-1.5">
          <Label>{countryLabel}</Label>
          <Select
            value={value.countryId ?? undefined}
            onValueChange={selectCountry}
            disabled={disabled || loadingCountries}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={loadingCountries ? 'جاري التحميل…' : 'اختر الدولة'}
              />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.id} value={country.id}>
                  {country.nameAr}
                  {country.code ? ` (${country.code})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label>{cityLabel}</Label>
        <Select
          value={value.cityId ?? undefined}
          onValueChange={selectCity}
          disabled={disabled || !value.countryId || loadingCities}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                !value.countryId
                  ? 'اختر الدولة أولاً'
                  : loadingCities
                    ? 'جاري التحميل…'
                    : 'اختر المدينة'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectItem key={city.id} value={city.id}>
                {city.nameAr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>{districtLabel}</Label>
        <Select
          value={value.districtId ?? undefined}
          onValueChange={selectDistrict}
          disabled={disabled || !value.cityId || loadingDistricts}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                !value.cityId
                  ? 'اختر المدينة أولاً'
                  : loadingDistricts
                    ? 'جاري التحميل…'
                    : 'اختر الحي'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {districts.map((district) => (
              <SelectItem key={district.id} value={district.id}>
                {district.nameAr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  geoCitiesApi,
  geoCountriesApi,
  geoDistrictsApi,
  type CreateGeoCityInput,
  type CreateGeoCountryInput,
  type CreateGeoDistrictInput,
  type GeoListQuery,
  type UpdateGeoCityInput,
  type UpdateGeoCountryInput,
  type UpdateGeoDistrictInput,
} from '@/features/system/organization/geo/lib/api/geo-api';
import { publicStoreGeoApi } from '@/features/system/organization/geo/lib/api/public-store-geo-api';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { toast } from 'sonner';

export const geoQueryKeys = {
  all: ['system', 'geo'] as const,
  countries: (query: GeoListQuery) => [...geoQueryKeys.all, 'countries', query] as const,
  cities: (query: GeoListQuery) => [...geoQueryKeys.all, 'cities', query] as const,
  districts: (query: GeoListQuery) => [...geoQueryKeys.all, 'districts', query] as const,
  public: {
    all: ['public', 'store', 'geo'] as const,
    countries: (companyId: string) =>
      [...geoQueryKeys.public.all, 'countries', companyId] as const,
    cities: (companyId: string, countryId: string) =>
      [...geoQueryKeys.public.all, 'cities', companyId, countryId] as const,
    districts: (companyId: string, cityId: string) =>
      [...geoQueryKeys.public.all, 'districts', companyId, cityId] as const,
  },
};

export function useGeoCountries(query: GeoListQuery, enabled = true) {
  return useQuery({
    queryKey: geoQueryKeys.countries(query),
    queryFn: () => geoCountriesApi.list(query),
    enabled: enabled && Boolean(query.companyId),
  });
}

export function useGeoCities(query: GeoListQuery, enabled = true) {
  return useQuery({
    queryKey: geoQueryKeys.cities(query),
    queryFn: () => geoCitiesApi.list(query),
    enabled: enabled && Boolean(query.companyId),
  });
}

export function useGeoDistricts(query: GeoListQuery, enabled = true) {
  return useQuery({
    queryKey: geoQueryKeys.districts(query),
    queryFn: () => geoDistrictsApi.list(query),
    enabled: enabled && Boolean(query.companyId),
  });
}

export function usePublicGeoCountries(companyId: string, enabled = true) {
  return useQuery({
    queryKey: geoQueryKeys.public.countries(companyId),
    queryFn: () => publicStoreGeoApi.listCountries(companyId),
    enabled: enabled && Boolean(companyId),
  });
}

export function usePublicGeoCities(companyId: string, countryId: string, enabled = true) {
  return useQuery({
    queryKey: geoQueryKeys.public.cities(companyId, countryId),
    queryFn: () => publicStoreGeoApi.listCities(companyId, countryId),
    enabled: enabled && Boolean(companyId && countryId),
  });
}

export function usePublicGeoDistricts(companyId: string, cityId: string, enabled = true) {
  return useQuery({
    queryKey: geoQueryKeys.public.districts(companyId, cityId),
    queryFn: () => publicStoreGeoApi.listDistricts(companyId, cityId),
    enabled: enabled && Boolean(companyId && cityId),
  });
}

function useInvalidateGeo() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: geoQueryKeys.all });
}

export function useCreateGeoCountry() {
  const invalidate = useInvalidateGeo();
  return useMutation({
    mutationFn: (input: CreateGeoCountryInput) => geoCountriesApi.create(input),
    onSuccess: async () => {
      toast.success('تم إنشاء الدولة');
      await invalidate();
    },
    onError: (error) => handleApiError(error),
  });
}

export function useUpdateGeoCountry() {
  const invalidate = useInvalidateGeo();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateGeoCountryInput }) =>
      geoCountriesApi.update(id, patch),
    onSuccess: async () => {
      toast.success('تم تحديث الدولة');
      await invalidate();
    },
    onError: (error) => handleApiError(error),
  });
}

export function useDeleteGeoCountry() {
  const invalidate = useInvalidateGeo();
  return useMutation({
    mutationFn: (id: string) => geoCountriesApi.remove(id),
    onSuccess: async () => {
      toast.success('تمت أرشفة الدولة');
      await invalidate();
    },
    onError: (error) => handleApiError(error),
  });
}

export function useCreateGeoCity() {
  const invalidate = useInvalidateGeo();
  return useMutation({
    mutationFn: (input: CreateGeoCityInput) => geoCitiesApi.create(input),
    onSuccess: async () => {
      toast.success('تم إنشاء المدينة');
      await invalidate();
    },
    onError: (error) => handleApiError(error),
  });
}

export function useUpdateGeoCity() {
  const invalidate = useInvalidateGeo();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateGeoCityInput }) =>
      geoCitiesApi.update(id, patch),
    onSuccess: async () => {
      toast.success('تم تحديث المدينة');
      await invalidate();
    },
    onError: (error) => handleApiError(error),
  });
}

export function useDeleteGeoCity() {
  const invalidate = useInvalidateGeo();
  return useMutation({
    mutationFn: (id: string) => geoCitiesApi.remove(id),
    onSuccess: async () => {
      toast.success('تمت أرشفة المدينة');
      await invalidate();
    },
    onError: (error) => handleApiError(error),
  });
}

export function useCreateGeoDistrict() {
  const invalidate = useInvalidateGeo();
  return useMutation({
    mutationFn: (input: CreateGeoDistrictInput) => geoDistrictsApi.create(input),
    onSuccess: async () => {
      toast.success('تم إنشاء الحي');
      await invalidate();
    },
    onError: (error) => handleApiError(error),
  });
}

export function useUpdateGeoDistrict() {
  const invalidate = useInvalidateGeo();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateGeoDistrictInput }) =>
      geoDistrictsApi.update(id, patch),
    onSuccess: async () => {
      toast.success('تم تحديث الحي');
      await invalidate();
    },
    onError: (error) => handleApiError(error),
  });
}

export function useDeleteGeoDistrict() {
  const invalidate = useInvalidateGeo();
  return useMutation({
    mutationFn: (id: string) => geoDistrictsApi.remove(id),
    onSuccess: async () => {
      toast.success('تمت أرشفة الحي');
      await invalidate();
    },
    onError: (error) => handleApiError(error),
  });
}

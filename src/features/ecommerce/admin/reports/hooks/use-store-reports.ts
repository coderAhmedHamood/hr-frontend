'use client';

import { useQuery } from '@tanstack/react-query';
import {
  storeReportsApi,
  type SalesReportFilters,
  type SalesReportGranularity,
} from '@/features/ecommerce/admin/reports/lib/api/store-reports-api';

export const storeReportsQueryKeys = {
  all: ['ecommerce', 'store-reports'] as const,
  dashboard: (filters: SalesReportFilters, granularity: SalesReportGranularity) =>
    [...storeReportsQueryKeys.all, 'dashboard', filters, granularity] as const,
  geoDistrict: (filters: SalesReportFilters, limit: number) =>
    [...storeReportsQueryKeys.all, 'geo-district', filters, limit] as const,
  paymentsAccount: (filters: SalesReportFilters, limit: number) =>
    [...storeReportsQueryKeys.all, 'payments-account', filters, limit] as const,
  catalogCategory: (filters: SalesReportFilters, limit: number) =>
    [...storeReportsQueryKeys.all, 'catalog-category', filters, limit] as const,
  catalogBrand: (filters: SalesReportFilters, limit: number) =>
    [...storeReportsQueryKeys.all, 'catalog-brand', filters, limit] as const,
  fulfillment: (filters: SalesReportFilters) =>
    [...storeReportsQueryKeys.all, 'fulfillment', filters] as const,
  ordersSource: (filters: SalesReportFilters) =>
    [...storeReportsQueryKeys.all, 'orders-source', filters] as const,
  operations: (companyId: string, from?: string, to?: string) =>
    [...storeReportsQueryKeys.all, 'operations', companyId, from, to] as const,
};

function enabled(filters: SalesReportFilters) {
  return Boolean(filters.companyId);
}

export function useReportsDashboard(
  filters: SalesReportFilters,
  granularity: SalesReportGranularity = 'day',
  active = true,
) {
  return useQuery({
    queryKey: storeReportsQueryKeys.dashboard(filters, granularity),
    queryFn: () =>
      storeReportsApi.dashboard(filters, {
        comparePreviousPeriod: true,
        timeseriesGranularity: granularity,
      }),
    enabled: active && enabled(filters),
  });
}

export function useGeoByDistrict(filters: SalesReportFilters, limit = 20, active = true) {
  return useQuery({
    queryKey: storeReportsQueryKeys.geoDistrict(filters, limit),
    queryFn: () => storeReportsApi.geoByDistrict(filters, limit),
    enabled: active && enabled(filters),
  });
}

export function usePaymentsByAccount(filters: SalesReportFilters, limit = 20, active = true) {
  return useQuery({
    queryKey: storeReportsQueryKeys.paymentsAccount(filters, limit),
    queryFn: () => storeReportsApi.paymentsByAccount(filters, limit),
    enabled: active && enabled(filters),
  });
}

export function useCatalogByCategory(filters: SalesReportFilters, limit = 20, active = true) {
  return useQuery({
    queryKey: storeReportsQueryKeys.catalogCategory(filters, limit),
    queryFn: () => storeReportsApi.catalogByCategory(filters, limit),
    enabled: active && enabled(filters),
  });
}

export function useCatalogByBrand(filters: SalesReportFilters, limit = 20, active = true) {
  return useQuery({
    queryKey: storeReportsQueryKeys.catalogBrand(filters, limit),
    queryFn: () => storeReportsApi.catalogByBrand(filters, limit),
    enabled: active && enabled(filters),
  });
}

export function useFulfillmentByShipStatus(filters: SalesReportFilters, active = true) {
  return useQuery({
    queryKey: storeReportsQueryKeys.fulfillment(filters),
    queryFn: () => storeReportsApi.fulfillmentByShipStatus(filters),
    enabled: active && enabled(filters),
  });
}

export function useOrdersBySource(filters: SalesReportFilters, active = true) {
  return useQuery({
    queryKey: storeReportsQueryKeys.ordersSource(filters),
    queryFn: () => storeReportsApi.ordersBySource(filters),
    enabled: active && enabled(filters),
  });
}

export function useOperationsSummary(
  companyId: string,
  from?: string,
  to?: string,
  active = true,
) {
  return useQuery({
    queryKey: storeReportsQueryKeys.operations(companyId, from, to),
    queryFn: () => storeReportsApi.operationsSummary(companyId, from, to),
    enabled: active && Boolean(companyId),
  });
}

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  salesReportsApi,
  type SalesReportFilters,
  type SalesReportGranularity,
} from '@/features/ecommerce/admin/reports/lib/api/sales-reports-api';

export const salesReportsQueryKeys = {
  all: ['ecommerce', 'sales-reports'] as const,
  summary: (filters: SalesReportFilters) =>
    [...salesReportsQueryKeys.all, 'summary', filters] as const,
  timeseries: (filters: SalesReportFilters, granularity: SalesReportGranularity) =>
    [...salesReportsQueryKeys.all, 'timeseries', filters, granularity] as const,
  byStatus: (filters: SalesReportFilters) =>
    [...salesReportsQueryKeys.all, 'by-status', filters] as const,
  byPayment: (filters: SalesReportFilters) =>
    [...salesReportsQueryKeys.all, 'by-payment', filters] as const,
  byCity: (filters: SalesReportFilters, limit: number) =>
    [...salesReportsQueryKeys.all, 'by-city', filters, limit] as const,
  byProduct: (filters: SalesReportFilters, limit: number) =>
    [...salesReportsQueryKeys.all, 'by-product', filters, limit] as const,
  byPartner: (filters: SalesReportFilters, limit: number) =>
    [...salesReportsQueryKeys.all, 'by-partner', filters, limit] as const,
  lines: (filters: SalesReportFilters, page: number, limit: number) =>
    [...salesReportsQueryKeys.all, 'lines', filters, page, limit] as const,
};

function enabled(filters: SalesReportFilters) {
  return Boolean(filters.companyId);
}

export function useSalesSummary(filters: SalesReportFilters, active = true) {
  return useQuery({
    queryKey: salesReportsQueryKeys.summary(filters),
    queryFn: () => salesReportsApi.summary(filters),
    enabled: active && enabled(filters),
  });
}

export function useSalesTimeseries(
  filters: SalesReportFilters,
  granularity: SalesReportGranularity = 'day',
  active = true,
) {
  return useQuery({
    queryKey: salesReportsQueryKeys.timeseries(filters, granularity),
    queryFn: () => salesReportsApi.timeseries(filters, granularity),
    enabled: active && enabled(filters),
  });
}

export function useSalesByStatus(filters: SalesReportFilters, active = true) {
  return useQuery({
    queryKey: salesReportsQueryKeys.byStatus(filters),
    queryFn: () => salesReportsApi.byStatus(filters),
    enabled: active && enabled(filters),
  });
}

export function useSalesByPayment(filters: SalesReportFilters, active = true) {
  return useQuery({
    queryKey: salesReportsQueryKeys.byPayment(filters),
    queryFn: () => salesReportsApi.byPayment(filters),
    enabled: active && enabled(filters),
  });
}

export function useSalesByCity(filters: SalesReportFilters, limit = 20, active = true) {
  return useQuery({
    queryKey: salesReportsQueryKeys.byCity(filters, limit),
    queryFn: () => salesReportsApi.byCity(filters, limit),
    enabled: active && enabled(filters),
  });
}

export function useSalesByProduct(filters: SalesReportFilters, limit = 20, active = true) {
  return useQuery({
    queryKey: salesReportsQueryKeys.byProduct(filters, limit),
    queryFn: () => salesReportsApi.byProduct(filters, limit),
    enabled: active && enabled(filters),
  });
}

export function useSalesByPartner(filters: SalesReportFilters, limit = 20, active = true) {
  return useQuery({
    queryKey: salesReportsQueryKeys.byPartner(filters, limit),
    queryFn: () => salesReportsApi.byPartner(filters, limit),
    enabled: active && enabled(filters),
  });
}

export function useSalesLines(
  filters: SalesReportFilters,
  page = 1,
  limit = 50,
  active = true,
) {
  return useQuery({
    queryKey: salesReportsQueryKeys.lines(filters, page, limit),
    queryFn: () => salesReportsApi.lines(filters, page, limit),
    enabled: active && enabled(filters),
  });
}

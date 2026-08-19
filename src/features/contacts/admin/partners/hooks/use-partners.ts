'use client';

import { useQuery } from '@tanstack/react-query';
import { partnersApi } from '@/features/contacts/admin/partners/lib/api/partners';
import {
  partnerActivitiesApi,
  partnerAttachmentsApi,
  partnerNotesApi,
} from '@/features/contacts/admin/partners/lib/api/partner-nested';
import { partnersQueryKeys } from '@/features/contacts/admin/hooks/query-keys';
import type { PartnerListQuery } from '@/features/contacts/domain/types/partner';

export function usePartners(query: PartnerListQuery) {
  return useQuery({
    queryKey: partnersQueryKeys.list(query),
    queryFn: () => partnersApi.getAll(query),
    enabled: Boolean(query.companyId),
  });
}

export function usePartner(companyId: string, id: string | undefined) {
  return useQuery({
    queryKey: partnersQueryKeys.detail(companyId, id ?? ''),
    queryFn: () => partnersApi.getById(id!),
    enabled: Boolean(companyId && id),
  });
}

export function usePartnerFull(companyId: string, id: string | undefined) {
  return useQuery({
    queryKey: partnersQueryKeys.full(companyId, id ?? ''),
    queryFn: () => partnersApi.getFull(id!, companyId),
    enabled: Boolean(companyId && id),
  });
}

export function usePartnerChildren(companyId: string, id: string | undefined) {
  return useQuery({
    queryKey: partnersQueryKeys.children(companyId, id ?? ''),
    queryFn: () => partnersApi.getChildren(id!, companyId),
    enabled: Boolean(companyId && id),
  });
}

export function usePartnerNotes(companyId: string, partnerId: string | undefined) {
  return useQuery({
    queryKey: partnersQueryKeys.notes(companyId, partnerId ?? ''),
    queryFn: () => partnerNotesApi.getAll(partnerId!),
    enabled: Boolean(companyId && partnerId),
  });
}

export function usePartnerActivities(companyId: string, partnerId: string | undefined) {
  return useQuery({
    queryKey: partnersQueryKeys.activities(companyId, partnerId ?? ''),
    queryFn: () => partnerActivitiesApi.getAll(partnerId!),
    enabled: Boolean(companyId && partnerId),
  });
}

export function usePartnerAttachments(companyId: string, partnerId: string | undefined) {
  return useQuery({
    queryKey: partnersQueryKeys.attachments(companyId, partnerId ?? ''),
    queryFn: () => partnerAttachmentsApi.getAll(partnerId!),
    enabled: Boolean(companyId && partnerId),
  });
}

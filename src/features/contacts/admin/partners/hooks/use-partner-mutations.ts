'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { partnersApi } from '@/features/contacts/admin/partners/lib/api/partners';
import {
  partnerActivitiesApi,
  partnerAddressesApi,
  partnerAttachmentsApi,
  partnerChannelsApi,
  partnerNotesApi,
  partnerRelationsApi,
} from '@/features/contacts/admin/partners/lib/api/partner-nested';
import { partnersQueryKeys } from '@/features/contacts/admin/hooks/query-keys';
import type { CreatePartnerInput, UpdatePartnerInput } from '@/features/contacts/domain/types/partner';

export function usePartnerMutations(companyId: string) {
  const queryClient = useQueryClient();

  function invalidateAll() {
    void queryClient.invalidateQueries({ queryKey: partnersQueryKeys.all(companyId) });
  }

  function invalidateDetail(id: string) {
    void queryClient.invalidateQueries({ queryKey: partnersQueryKeys.full(companyId, id) });
    void queryClient.invalidateQueries({ queryKey: partnersQueryKeys.detail(companyId, id) });
    void queryClient.invalidateQueries({ queryKey: partnersQueryKeys.children(companyId, id) });
    void queryClient.invalidateQueries({ queryKey: partnersQueryKeys.notes(companyId, id) });
    void queryClient.invalidateQueries({ queryKey: partnersQueryKeys.activities(companyId, id) });
    void queryClient.invalidateQueries({ queryKey: partnersQueryKeys.attachments(companyId, id) });
    invalidateAll();
  }

  const create = useMutation({
    mutationFn: (input: CreatePartnerInput) => partnersApi.create(input),
    onSuccess: () => {
      invalidateAll();
      toast.success('تم إنشاء جهة الاتصال');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'cnt.partners.create');
      toast.error(displayMessage);
    },
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdatePartnerInput }) =>
      partnersApi.update(id, patch),
    onSuccess: (_data, variables) => {
      invalidateDetail(variables.id);
      toast.success('تم تحديث جهة الاتصال');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'cnt.partners.update');
      toast.error(displayMessage);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => partnersApi.remove(id),
    onSuccess: () => {
      invalidateAll();
      toast.success('تم أرشفة جهة الاتصال');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'cnt.partners.delete');
      toast.error(displayMessage);
    },
  });

  const createAddress = useMutation({
    mutationFn: partnerAddressesApi.create,
    onSuccess: (_d, vars) => {
      invalidateDetail(vars.partnerId);
      toast.success('تمت إضافة العنوان');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'cnt.partner-addresses.create');
      toast.error(displayMessage);
    },
  });

  const removeAddress = useMutation({
    mutationFn: ({ id, partnerId }: { id: string; partnerId: string }) =>
      partnerAddressesApi.remove(id).then(() => partnerId),
    onSuccess: (partnerId) => {
      invalidateDetail(partnerId);
      toast.success('تم أرشفة العنوان');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'cnt.partner-addresses.delete');
      toast.error(displayMessage);
    },
  });

  const createChannel = useMutation({
    mutationFn: partnerChannelsApi.create,
    onSuccess: (_d, vars) => {
      invalidateDetail(vars.partnerId);
      toast.success('تمت إضافة وسيلة الاتصال');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'cnt.partner-channels.create');
      toast.error(displayMessage);
    },
  });

  const removeChannel = useMutation({
    mutationFn: ({ id, partnerId }: { id: string; partnerId: string }) =>
      partnerChannelsApi.remove(id).then(() => partnerId),
    onSuccess: (partnerId) => {
      invalidateDetail(partnerId);
      toast.success('تم أرشفة وسيلة الاتصال');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'cnt.partner-channels.delete');
      toast.error(displayMessage);
    },
  });

  const createRelation = useMutation({
    mutationFn: partnerRelationsApi.create,
    onSuccess: (_d, vars) => {
      invalidateDetail(vars.fromPartnerId);
      toast.success('تم ربط العلاقة');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'cnt.partner-relations.create');
      toast.error(displayMessage);
    },
  });

  const removeRelation = useMutation({
    mutationFn: ({ id, partnerId }: { id: string; partnerId: string }) =>
      partnerRelationsApi.remove(id).then(() => partnerId),
    onSuccess: (partnerId) => {
      invalidateDetail(partnerId);
      toast.success('تم أرشفة العلاقة');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'cnt.partner-relations.delete');
      toast.error(displayMessage);
    },
  });

  const createNote = useMutation({
    mutationFn: partnerNotesApi.create,
    onSuccess: (_d, vars) => {
      invalidateDetail(vars.partnerId);
      toast.success('تمت إضافة الملاحظة');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'cnt.partner-notes.create');
      toast.error(displayMessage);
    },
  });

  const removeNote = useMutation({
    mutationFn: ({ id, partnerId }: { id: string; partnerId: string }) =>
      partnerNotesApi.remove(id).then(() => partnerId),
    onSuccess: (partnerId) => {
      invalidateDetail(partnerId);
      toast.success('تم أرشفة الملاحظة');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'cnt.partner-notes.delete');
      toast.error(displayMessage);
    },
  });

  const createActivity = useMutation({
    mutationFn: partnerActivitiesApi.create,
    onSuccess: (_d, vars) => {
      invalidateDetail(vars.partnerId);
      toast.success('تمت إضافة النشاط');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'cnt.partner-activities.create');
      toast.error(displayMessage);
    },
  });

  const updateActivity = useMutation({
    mutationFn: ({
      id,
      partnerId,
      patch,
    }: {
      id: string;
      partnerId: string;
      patch: Parameters<typeof partnerActivitiesApi.update>[1];
    }) => partnerActivitiesApi.update(id, patch).then(() => partnerId),
    onSuccess: (partnerId) => {
      invalidateDetail(partnerId);
      toast.success('تم تحديث النشاط');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'cnt.partner-activities.update');
      toast.error(displayMessage);
    },
  });

  const createAttachment = useMutation({
    mutationFn: partnerAttachmentsApi.create,
    onSuccess: (_d, vars) => {
      invalidateDetail(vars.partnerId);
      toast.success('تمت إضافة المرفق');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'cnt.partner-attachments.create');
      toast.error(displayMessage);
    },
  });

  const removeAttachment = useMutation({
    mutationFn: ({ id, partnerId }: { id: string; partnerId: string }) =>
      partnerAttachmentsApi.remove(id).then(() => partnerId),
    onSuccess: (partnerId) => {
      invalidateDetail(partnerId);
      toast.success('تم أرشفة المرفق');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'cnt.partner-attachments.delete');
      toast.error(displayMessage);
    },
  });

  const assignCategory = useMutation({
    mutationFn: ({ partnerId, categoryId }: { partnerId: string; categoryId: string }) =>
      partnersApi.assignCategory(partnerId, categoryId),
    onSuccess: (_d, vars) => {
      invalidateDetail(vars.partnerId);
      toast.success('تم تعيين التصنيف');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'cnt.partner-category-members.create');
      toast.error(displayMessage);
    },
  });

  const unassignCategory = useMutation({
    mutationFn: ({ partnerId, categoryId }: { partnerId: string; categoryId: string }) =>
      partnersApi.unassignCategory(partnerId, categoryId),
    onSuccess: (_d, vars) => {
      invalidateDetail(vars.partnerId);
      toast.success('تم إزالة التصنيف');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'cnt.partner-category-members.delete');
      toast.error(displayMessage);
    },
  });

  return {
    create,
    update,
    remove,
    createAddress,
    removeAddress,
    createChannel,
    removeChannel,
    createRelation,
    removeRelation,
    createNote,
    removeNote,
    createActivity,
    updateActivity,
    createAttachment,
    removeAttachment,
    assignCategory,
    unassignCategory,
  };
}

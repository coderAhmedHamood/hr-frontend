'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { systemOwnerQueryKeys } from '@/features/system-owner/hooks/query-keys';
import {
  systemOwnerApi,
  type CreateSystemOwnerCompanyDto,
  type CreateSystemOwnerCompanyUserDto,
} from '@/features/system-owner/lib/api/system-owner';

export function useSystemOwnerCompanies(search?: string) {
  return useQuery({
    queryKey: systemOwnerQueryKeys.companies(search),
    queryFn: () => systemOwnerApi.listCompanies({ page: 1, limit: 200, search: search || undefined }),
  });
}

export function useSystemOwnerCompany(companyId: string) {
  return useQuery({
    queryKey: systemOwnerQueryKeys.company(companyId),
    queryFn: () => systemOwnerApi.getCompany(companyId),
    enabled: Boolean(companyId),
  });
}

export function useSystemOwnerCompanyUsers(companyId: string) {
  return useQuery({
    queryKey: systemOwnerQueryKeys.companyUsers(companyId),
    queryFn: () => systemOwnerApi.listCompanyUsers(companyId),
    enabled: Boolean(companyId),
  });
}

export function useSystemOwnerCompanyApplications(companyId: string) {
  return useQuery({
    queryKey: systemOwnerQueryKeys.companyApplications(companyId),
    queryFn: () => systemOwnerApi.listCompanyApplications(companyId),
    enabled: Boolean(companyId),
  });
}

export function useSystemOwnerSuperusers(companyId: string) {
  return useQuery({
    queryKey: systemOwnerQueryKeys.superusers(companyId),
    queryFn: () => systemOwnerApi.listSuperusers(companyId),
    enabled: Boolean(companyId),
  });
}

export function useSystemOwnerActivationRequests(status?: string) {
  return useQuery({
    queryKey: systemOwnerQueryKeys.activationRequests(status),
    queryFn: () => systemOwnerApi.listActivationRequests(status ? { status } : undefined),
  });
}

export function useSystemOwnerMutations() {
  const queryClient = useQueryClient();

  function invalidateCompany(companyId?: string) {
    void queryClient.invalidateQueries({ queryKey: ['system-owner'] });
    if (companyId) {
      void queryClient.invalidateQueries({ queryKey: systemOwnerQueryKeys.company(companyId) });
      void queryClient.invalidateQueries({ queryKey: systemOwnerQueryKeys.companyUsers(companyId) });
      void queryClient.invalidateQueries({ queryKey: systemOwnerQueryKeys.companyApplications(companyId) });
      void queryClient.invalidateQueries({ queryKey: systemOwnerQueryKeys.superusers(companyId) });
    }
  }

  const createCompany = useMutation({
    mutationFn: (payload: CreateSystemOwnerCompanyDto) => systemOwnerApi.createCompany(payload),
    onSuccess: () => {
      invalidateCompany();
      toast.success('تم إنشاء الشركة — تطبيق النظام مفعّل افتراضياً');
    },
    onError: (err) => {
      toast.error(handleApiError(err, 'system-owner.companies.create').displayMessage);
    },
  });

  const updateCompany = useMutation({
    mutationFn: ({
      companyId,
      payload,
    }: {
      companyId: string;
      payload: Partial<CreateSystemOwnerCompanyDto>;
    }) => systemOwnerApi.updateCompany(companyId, payload),
    onSuccess: (_data, vars) => {
      invalidateCompany(vars.companyId);
      toast.success('تم تحديث الشركة');
    },
    onError: (err) => {
      toast.error(handleApiError(err, 'system-owner.companies.update').displayMessage);
    },
  });

  const setApplicationEnabled = useMutation({
    mutationFn: (vars: {
      companyId: string;
      applicationId: string;
      isEnabled: boolean;
      notes?: string;
    }) =>
      systemOwnerApi.setCompanyApplicationEnabled(vars.companyId, vars.applicationId, {
        isEnabled: vars.isEnabled,
        notes: vars.notes,
      }),
    onSuccess: (_data, vars) => {
      invalidateCompany(vars.companyId);
      toast.success(vars.isEnabled ? 'تم تفعيل التطبيق' : 'تم تعطيل التطبيق');
    },
    onError: (err) => {
      toast.error(handleApiError(err, 'system-owner.applications.patch').displayMessage);
    },
  });

  const createCompanyUser = useMutation({
    mutationFn: (vars: { companyId: string; payload: CreateSystemOwnerCompanyUserDto }) =>
      systemOwnerApi.createCompanyUser(vars.companyId, vars.payload),
    onSuccess: (data, vars) => {
      invalidateCompany(vars.companyId);
      toast.success(
        data.isCompanySuperuser
          ? 'تم إنشاء صاحب الشركة المخوّل مع أدوار superadmin للتطبيقات المفعّلة. يدخل بإيميله ويدير الشركة.'
          : 'تم إنشاء المستخدم وربطه بالشركة.',
      );
    },
    onError: (err) => {
      toast.error(handleApiError(err, 'system-owner.users.create').displayMessage);
    },
  });

  const assignSuperuser = useMutation({
    mutationFn: (vars: { companyId: string; userId: string; notes?: string }) =>
      systemOwnerApi.assignSuperuser(vars.companyId, { userId: vars.userId, notes: vars.notes }),
    onSuccess: (_data, vars) => {
      invalidateCompany(vars.companyId);
      toast.success('تم تعيين Superuser');
    },
    onError: (err) => {
      toast.error(handleApiError(err, 'system-owner.superusers.assign').displayMessage);
    },
  });

  const setSuperuserActive = useMutation({
    mutationFn: (vars: { companyId: string; userId: string; isActive: boolean }) =>
      systemOwnerApi.setSuperuserActive(vars.companyId, vars.userId, vars.isActive),
    onSuccess: (_data, vars) => {
      invalidateCompany(vars.companyId);
      toast.success(vars.isActive ? 'تم تفعيل Superuser' : 'تم إيقاف Superuser');
    },
    onError: (err) => {
      toast.error(handleApiError(err, 'system-owner.superusers.patch').displayMessage);
    },
  });

  const approveRequest = useMutation({
    mutationFn: (vars: { id: string; decisionNote?: string }) =>
      systemOwnerApi.approveActivationRequest(vars.id, vars.decisionNote),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['system-owner'] });
      toast.success('تمت الموافقة وتفعيل التطبيق');
    },
    onError: (err) => {
      toast.error(handleApiError(err, 'system-owner.requests.approve').displayMessage);
    },
  });

  const rejectRequest = useMutation({
    mutationFn: (vars: { id: string; decisionNote?: string }) =>
      systemOwnerApi.rejectActivationRequest(vars.id, vars.decisionNote),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['system-owner'] });
      toast.success('تم رفض الطلب');
    },
    onError: (err) => {
      toast.error(handleApiError(err, 'system-owner.requests.reject').displayMessage);
    },
  });

  return {
    createCompany,
    updateCompany,
    createCompanyUser,
    setApplicationEnabled,
    assignSuperuser,
    setSuperuserActive,
    approveRequest,
    rejectRequest,
  };
}

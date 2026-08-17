'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { PERMISSIONS_KEYS } from '@/features/system/permissions/hooks/query-keys';
import { rolesApi } from '@/features/system/permissions/lib/api/roles';
import { userRolesApi } from '@/features/system/permissions/lib/api/user-roles';
import { systemOwnerQueryKeys } from '@/features/system-owner/hooks/query-keys';
import {
  systemOwnerApi,
  type CreateSystemOwnerCompanyDto,
  type CreateSystemOwnerCompanyUserDto,
} from '@/features/system-owner/lib/api/system-owner';
import {
  assignRolesToUser,
  ensureFullAccessRoleIds,
  isAssignableCompanyRole,
  syncUserRoles,
} from '@/features/system-owner/lib/assign-company-user-roles';

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

export function useSystemOwnerCompanyRoles(companyId: string, enabled = true) {
  return useQuery({
    queryKey: systemOwnerQueryKeys.companyRoles(companyId),
    queryFn: async () => {
      const result = await rolesApi.getAll({ limit: 200 });
      return {
        ...result,
        items: (result.items ?? []).filter((role) => isAssignableCompanyRole(role, companyId)),
      };
    },
    enabled: enabled && Boolean(companyId),
    staleTime: 60 * 1000,
  });
}

export function useSystemOwnerUserRoles(userId: string | null, companyId: string, enabled = true) {
  return useQuery({
    queryKey: [...PERMISSIONS_KEYS.userRoles(userId), companyId],
    queryFn: async () => {
      const result = await userRolesApi.list(userId!);
      return (result.items ?? []).filter(
        (row) => row.isActive && (!row.companyId || row.companyId === companyId),
      );
    },
    enabled: enabled && Boolean(userId) && Boolean(companyId),
    staleTime: 30 * 1000,
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
    mutationFn: async (vars: {
      companyId: string;
      payload: CreateSystemOwnerCompanyUserDto;
      roleIds?: string[];
      grantFullAccess?: boolean;
    }) => {
      const created = await systemOwnerApi.createCompanyUser(vars.companyId, vars.payload);
      const userId = created.user.id;
      if (!userId) return { ...created, rolesAssigned: 0, rolesFailed: 0 };

      const roleIds = [...(vars.roleIds ?? [])];
      if (vars.grantFullAccess) {
        try {
          const apps = await systemOwnerApi.listCompanyApplications(vars.companyId);
          const fullAccessIds = await ensureFullAccessRoleIds(vars.companyId, apps);
          roleIds.push(...fullAccessIds);
        } catch {
          return { ...created, rolesAssigned: 0, rolesFailed: 1 };
        }
      }

      if (roleIds.length === 0) return { ...created, rolesAssigned: 0, rolesFailed: 0 };

      const result = await assignRolesToUser(userId, vars.companyId, roleIds);
      return { ...created, rolesAssigned: result.assigned, rolesFailed: result.failed };
    },
    onSuccess: (data, vars) => {
      invalidateCompany(vars.companyId);
      void queryClient.invalidateQueries({ queryKey: PERMISSIONS_KEYS.roles });
      void queryClient.invalidateQueries({ queryKey: systemOwnerQueryKeys.companyRoles(vars.companyId) });

      if (data.rolesFailed > 0) {
        toast.error(
          data.isCompanySuperuser
            ? 'تم إنشاء صاحب الشركة، لكن تعذر إسناد بعض الأدوار.'
            : 'تم إنشاء المستخدم، لكن تعذر إسناد بعض الأدوار.',
        );
        return;
      }

      if (data.rolesAssigned > 0) {
        toast.success(
          data.isCompanySuperuser
            ? 'تم إنشاء صاحب الشركة وإسناد صلاحيات التطبيقات المفعّلة.'
            : 'تم إنشاء المستخدم وإسناد الأدوار.',
        );
        return;
      }

      toast.success(
        data.isCompanySuperuser
          ? 'تم إنشاء صاحب الشركة. يدخل بإيميله إلى ERP ويطلب تفعيل التطبيقات.'
          : 'تم إنشاء المستخدم وربطه بالشركة.',
      );
    },
    onError: (err) => {
      toast.error(handleApiError(err, 'system-owner.users.create').displayMessage);
    },
  });

  const syncCompanyUserRoles = useMutation({
    mutationFn: (vars: { companyId: string; userId: string; roleIds: string[] }) =>
      syncUserRoles(vars.userId, vars.companyId, vars.roleIds),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: PERMISSIONS_KEYS.userRoles(vars.userId) });
      toast.success('تم تحديث أدوار المستخدم');
    },
    onError: (err) => {
      toast.error(handleApiError(err, 'system-owner.users.roles').displayMessage);
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
    syncCompanyUserRoles,
    setApplicationEnabled,
    assignSuperuser,
    setSuperuserActive,
    approveRequest,
    rejectRequest,
  };
}

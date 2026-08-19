'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ACCESS_PROFILE_KEY } from '@/features/auth/hooks/use-access-profile';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { usersApi, type UserResponseDto } from '@/features/hr/organization/lib/api/users';
import { userCompaniesApi } from '@/features/system/organization/contacts/lib/api/user-companies';
import { userBranchesApi } from '@/features/system/organization/contacts/lib/api/user-branches';
import type { CompanyResponseDto } from '@/features/hr/organization/lib/api/companies';
import type { BranchResponseDto } from '@/features/hr/organization/lib/api/branches';

type ReferenceData = {
  companies: CompanyResponseDto[];
  branches: BranchResponseDto[];
};

export function useUserDetailModel(
  userId: string | null,
  reference: ReferenceData,
  onUserUpdated?: (user: UserResponseDto) => void,
) {
  const queryClient = useQueryClient();
  const sessionUserId = useAuthStore((s) => s.user?.id);
  const [user, setUser] = React.useState<UserResponseDto | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [assignCompanyId, setAssignCompanyId] = React.useState('');
  const [assignBranchId, setAssignBranchId] = React.useState('');
  const [assignCompanyDefault, setAssignCompanyDefault] = React.useState(false);
  const [assignBranchDefault, setAssignBranchDefault] = React.useState(false);

  const refreshSessionAccessProfile = React.useCallback(async () => {
    if (!userId || !sessionUserId || userId !== sessionUserId) return;
    await queryClient.invalidateQueries({ queryKey: [...ACCESS_PROFILE_KEY, sessionUserId] });
  }, [queryClient, sessionUserId, userId]);

  const reload = React.useCallback(async () => {
    if (!userId) {
      setUser(null);
      return;
    }
    setLoading(true);
    try {
      const fresh = await usersApi.getById(userId);
      setUser(fresh);
      onUserUpdated?.(fresh);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'users.detail');
      toast.error(displayMessage);
    } finally {
      setLoading(false);
    }
  }, [onUserUpdated, userId]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const assignedCompanyIds = React.useMemo(
    () => new Set(user?.companies.map((c) => c.companyId) ?? []),
    [user?.companies],
  );

  const assignedBranchIds = React.useMemo(
    () => new Set(user?.branches.map((b) => b.branchId) ?? []),
    [user?.branches],
  );

  const availableCompanies = React.useMemo(
    () => reference.companies.filter((c) => !assignedCompanyIds.has(c.id)),
    [assignedCompanyIds, reference.companies],
  );

  /** Branches still available to assign — limited to companies already linked to the user. */
  const availableBranches = React.useMemo(() => {
    const companyIds = assignedCompanyIds;
    return reference.branches.filter(
      (b) => !assignedBranchIds.has(b.id) && (companyIds.size === 0 || companyIds.has(b.companyId)),
    );
  }, [assignedBranchIds, assignedCompanyIds, reference.branches]);

  const branchesForAssignCompany = React.useMemo(() => {
    if (!assignCompanyId) return availableBranches;
    return availableBranches.filter((b) => b.companyId === assignCompanyId);
  }, [assignCompanyId, availableBranches]);

  const runMutation = React.useCallback(
    async (action: () => Promise<void>, successMessage: string) => {
      setSaving(true);
      try {
        await action();
        toast.success(successMessage);
        await reload();
        await refreshSessionAccessProfile();
      } catch (err) {
        const { displayMessage } = handleApiError(err, 'users.assignment');
        toast.error(displayMessage);
      } finally {
        setSaving(false);
      }
    },
    [refreshSessionAccessProfile, reload],
  );

  const assignCompany = React.useCallback(async () => {
    if (!userId || !assignCompanyId) return;
    await runMutation(async () => {
      await userCompaniesApi.assign(userId, {
        companyId: assignCompanyId,
        isDefault: assignCompanyDefault,
        isActive: true,
      });
      setAssignCompanyId('');
      setAssignCompanyDefault(false);
    }, 'تم إسناد الشركة');
  }, [assignCompanyDefault, assignCompanyId, runMutation, userId]);

  const assignBranch = React.useCallback(async () => {
    if (!userId || !assignBranchId) return;
    await runMutation(async () => {
      await userBranchesApi.assign(userId, {
        branchId: assignBranchId,
        isDefault: assignBranchDefault,
        isActive: true,
      });
      setAssignBranchId('');
      setAssignBranchDefault(false);
    }, 'تم إسناد الفرع');
  }, [assignBranchDefault, assignBranchId, runMutation, userId]);

  const updateCompanyLink = React.useCallback(
    async (assignmentId: string, patch: { isDefault?: boolean; isActive?: boolean }) => {
      if (!userId) return;
      await runMutation(async () => {
        await userCompaniesApi.update(userId, assignmentId, patch);
      }, 'تم تحديث إسناد الشركة');
    },
    [runMutation, userId],
  );

  const updateBranchLink = React.useCallback(
    async (assignmentId: string, patch: { isDefault?: boolean; isActive?: boolean }) => {
      if (!userId) return;
      await runMutation(async () => {
        await userBranchesApi.update(userId, assignmentId, patch);
      }, 'تم تحديث إسناد الفرع');
    },
    [runMutation, userId],
  );

  const removeCompanyLink = React.useCallback(
    async (assignmentId: string) => {
      await runMutation(async () => {
        await userCompaniesApi.remove(assignmentId);
      }, 'تم إلغاء إسناد الشركة');
    },
    [runMutation],
  );

  const removeBranchLink = React.useCallback(
    async (assignmentId: string) => {
      await runMutation(async () => {
        await userBranchesApi.remove(assignmentId);
      }, 'تم إلغاء إسناد الفرع');
    },
    [runMutation],
  );

  return {
    user,
    loading,
    saving,
    reload,
    availableCompanies,
    availableBranches,
    branchesForAssignCompany,
    assignCompanyId,
    setAssignCompanyId,
    assignBranchId,
    setAssignBranchId,
    assignCompanyDefault,
    setAssignCompanyDefault,
    assignBranchDefault,
    setAssignBranchDefault,
    assignCompany,
    assignBranch,
    updateCompanyLink,
    updateBranchLink,
    removeCompanyLink,
    removeBranchLink,
  };
}

export type UserDetailModel = ReturnType<typeof useUserDetailModel>;

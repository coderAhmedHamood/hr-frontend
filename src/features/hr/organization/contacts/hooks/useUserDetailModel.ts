'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { usersApi, type UserResponseDto } from '@/features/hr/organization/lib/api/users';
import { userCompaniesApi } from '@/features/hr/organization/contacts/lib/api/user-companies';
import { userBranchesApi } from '@/features/hr/organization/contacts/lib/api/user-branches';
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
  const [user, setUser] = React.useState<UserResponseDto | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [assignCompanyId, setAssignCompanyId] = React.useState('');
  const [assignBranchId, setAssignBranchId] = React.useState('');
  const [assignCompanyDefault, setAssignCompanyDefault] = React.useState(false);
  const [assignBranchDefault, setAssignBranchDefault] = React.useState(false);

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

  const availableBranches = React.useMemo(
    () => reference.branches.filter((b) => !assignedBranchIds.has(b.id)),
    [assignedBranchIds, reference.branches],
  );

  const branchesForAssignCompany = React.useMemo(() => {
    if (!assignCompanyId) return reference.branches;
    return reference.branches.filter((b) => b.companyId === assignCompanyId);
  }, [assignCompanyId, reference.branches]);

  const runMutation = React.useCallback(
    async (action: () => Promise<void>, successMessage: string) => {
      setSaving(true);
      try {
        await action();
        toast.success(successMessage);
        await reload();
      } catch (err) {
        const { displayMessage } = handleApiError(err, 'users.assignment');
        toast.error(displayMessage);
      } finally {
        setSaving(false);
      }
    },
    [reload],
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

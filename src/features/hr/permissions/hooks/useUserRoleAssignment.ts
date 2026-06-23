'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userRolesApi } from '@/features/hr/permissions/lib/api/user-roles';
import { usersApi, type UserResponseDto } from '@/features/hr/organization/lib/api/users';
import { organizationActiveListStatusQuery } from '@/features/hr/organization/lib/archive-scope';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';

export function useUsersForRole(roleId: string | null) {
  const [assignedUserIds, setAssignedUserIds] = React.useState<Set<string>>(new Set());
  const [assignmentIdMap, setAssignmentIdMap] = React.useState<Record<string, string>>({});

  const usersQuery = useQuery({
    queryKey: ['users', 'list'],
    queryFn: () => usersApi.getAll({ limit: 200, ...organizationActiveListStatusQuery() }),
    staleTime: 5 * 60 * 1000,
  });

  const assignedQuery = useQuery({
    queryKey: ['role-users', roleId],
    queryFn: async () => {
      if (!roleId) return { items: [] };
      const all = await usersApi.getAll({ limit: 200, ...organizationActiveListStatusQuery() });
      const results = await Promise.all(
        all.items.map((u) =>
          userRolesApi.list(u.id).then((r) => ({ userId: u.id, assignments: r.items })),
        ),
      );
      const idMap: Record<string, string> = {};
      const ids = new Set<string>();
      for (const { userId, assignments } of results) {
        const match = assignments.find((a) => a.roleId === roleId && a.isActive);
        if (match) {
          ids.add(userId);
          idMap[userId] = match.id;
        }
      }
      setAssignedUserIds(ids);
      setAssignmentIdMap(idMap);
      return { items: all.items };
    },
    enabled: !!roleId,
    staleTime: 0,
  });

  const queryClient = useQueryClient();

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['role-users', roleId] });
  }

  const assign = useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      userRolesApi.assign(userId, { roleId: roleId!, isActive: true }),
    onSuccess: invalidate,
    onError: (err) => { handleApiError(err, 'userRoles.assign'); },
  });

  const revoke = useMutation({
    mutationFn: ({ assignmentId }: { assignmentId: string }) =>
      userRolesApi.revoke(assignmentId),
    onSuccess: invalidate,
    onError: (err) => { handleApiError(err, 'userRoles.revoke'); },
  });

  return {
    allUsers: usersQuery.data?.items ?? [] as UserResponseDto[],
    isLoading: assignedQuery.isLoading || usersQuery.isLoading,
    assignedUserIds,
    assignmentIdMap,
    assign,
    revoke,
  };
}

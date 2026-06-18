'use client';

import * as React from 'react';
import { Search, UserCheck, UserX, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { useUsersForRole } from '@/features/hr/permissions/hooks/useUserRoleAssignment';
import type { RoleResponseDto } from '@/features/hr/permissions/lib/api/roles';
import type { UserResponseDto } from '@/features/hr/organization/lib/api/users';

type Props = {
  role: RoleResponseDto | null;
  onClose: () => void;
};

export function AssignUsersDialog({ role, onClose }: Props) {
  const [search, setSearch] = React.useState('');
  const { allUsers, isLoading, assignedUserIds, assignmentIdMap, assign, revoke } =
    useUsersForRole(role?.id ?? null);

  const filtered = allUsers.filter((u: UserResponseDto) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      u.email.toLowerCase().includes(q) ||
      (u.fullNameAr ?? '').includes(q) ||
      (u.fullNameEn ?? '').toLowerCase().includes(q)
    );
  });

  const assignedCount = assignedUserIds.size;

  return (
    <Dialog open={!!role} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            تعيين المستخدمين — {role?.nameAr ?? role?.name}
          </DialogTitle>
          <DialogDescription>
            المستخدمون الحاملون لهذا الدور:{' '}
            <span className="number-ar font-semibold text-foreground">{assignedCount}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو البريد الإلكتروني…"
            className="pe-9"
          />
        </div>

        <div className="max-h-[380px] overflow-y-auto space-y-1 py-1">
          {isLoading ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">لا يوجد مستخدمون</p>
          ) : (
            filtered.map((user: UserResponseDto) => (
              <UserRow
                key={user.id}
                user={user}
                isAssigned={assignedUserIds.has(user.id)}
                assignmentId={assignmentIdMap[user.id]}
                isActing={
                  (assign.isPending && (assign.variables as { userId: string })?.userId === user.id) ||
                  (revoke.isPending && (revoke.variables as { assignmentId: string })?.assignmentId === assignmentIdMap[user.id])
                }
                onAssign={() => assign.mutate({ userId: user.id })}
                onRevoke={() => revoke.mutate({ assignmentId: assignmentIdMap[user.id]! })}
              />
            ))
          )}
        </div>

        <div className="flex justify-end border-t border-border pt-3">
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type RowProps = {
  user: UserResponseDto;
  isAssigned: boolean;
  assignmentId: string | undefined;
  isActing: boolean;
  onAssign: () => void;
  onRevoke: () => void;
};

function UserRow({ user, isAssigned, isActing, onAssign, onRevoke }: RowProps) {
  const displayName = user.fullNameAr ?? user.fullNameEn ?? user.email;
  return (
    <div className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium leading-tight">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 ms-3">
        {isAssigned && (
          <Badge variant="subtle" className="text-[10px] gap-1">
            <UserCheck className="h-3 w-3" /> مُعيَّن
          </Badge>
        )}
        {isAssigned ? (
          <Button
            size="sm"
            variant="outline"
            disabled={isActing}
            onClick={onRevoke}
            className="h-7 gap-1 border-destructive/30 px-2 text-[11px] text-destructive hover:bg-destructive/10"
          >
            {isActing ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserX className="h-3 w-3" />}
            إلغاء
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={isActing}
            onClick={onAssign}
            className="h-7 gap-1 px-2 text-[11px]"
          >
            {isActing ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserCheck className="h-3 w-3" />}
            تعيين
          </Button>
        )}
      </div>
    </div>
  );
}

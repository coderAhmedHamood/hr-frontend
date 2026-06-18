'use client';

import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogFormFooterClass,
} from '@/components/ui/dialog';
import type { EmployeeCreateUserModel } from '@/features/hr/organization/employees/hooks/useEmployeeCreateUser';
import type { Employee } from '@/features/hr/organization/employees/types';

type Props = {
  employee: Employee;
  model: EmployeeCreateUserModel;
};

export function EmployeeCreateUserDialog({ employee, model }: Props) {
  const {
    createUserOpen,
    setCreateUserOpen,
    createUserEmail,
    setCreateUserEmail,
    createUserPassword,
    setCreateUserPassword,
    isCreatingUser,
    handleCreateUser,
  } = model;

  const canSubmit = createUserEmail.trim().length > 0 && createUserPassword.length >= 6;

  return (
    <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-arabic-display">إنشاء حساب مستخدم</DialogTitle>
          <DialogDescription>
            سيتم ربط الحساب بالموظف{' '}
            <span className="font-medium text-foreground">{employee?.name ?? '—'}</span>{' '}
            ويمكنه تسجيل الدخول بالبريد وكلمة المرور.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="create-user-email">البريد الإلكتروني</Label>
            <Input
              id="create-user-email"
              type="email"
              dir="ltr"
              autoComplete="off"
              placeholder="user@company.com"
              value={createUserEmail}
              onChange={(e) => setCreateUserEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-user-password">كلمة المرور</Label>
            <Input
              id="create-user-password"
              type="password"
              dir="ltr"
              autoComplete="new-password"
              placeholder="6 أحرف على الأقل"
              value={createUserPassword}
              onChange={(e) => setCreateUserPassword(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className={dialogFormFooterClass}>
          <Button
            type="button"
            className="gap-2"
            disabled={!canSubmit || isCreatingUser}
            onClick={() => void handleCreateUser()}
          >
            {isCreatingUser ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            إنشاء الحساب
          </Button>
          <Button type="button" variant="ghost" onClick={() => setCreateUserOpen(false)}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

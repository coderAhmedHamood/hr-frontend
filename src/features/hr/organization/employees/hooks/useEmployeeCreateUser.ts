'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import type { Employee } from '@/features/hr/organization/employees/types';
import {
  createEmployeeUserAccount,
  resolveCreatedUserId,
  resolveEmployeeUserAccountCompanyId,
} from '@/features/hr/organization/employees/services/employee-user-account.service';

export function useEmployeeCreateUser(
  employee: Employee,
  onUserCreated?: (userId: string) => void,
) {
  const qc = useQueryClient();
  const [createUserOpen, setCreateUserOpen] = React.useState(false);
  const [createUserEmail, setCreateUserEmail] = React.useState(employee.email ?? '');
  const [createUserPassword, setCreateUserPassword] = React.useState('');

  React.useEffect(() => {
    if (createUserOpen) {
      setCreateUserEmail(employee.email ?? '');
      setCreateUserPassword('');
    }
  }, [createUserOpen, employee.email]);

  const createUserMutation = useMutation({
    mutationFn: async () => {
      if (!employee.employeeCode?.trim()) throw new Error('رقم الموظف غير متوفر');
      if (!createUserEmail.trim()) throw new Error('البريد الإلكتروني مطلوب');
      if (createUserPassword.length < 6) throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');

      const companyId = await resolveEmployeeUserAccountCompanyId(employee.id);

      return createEmployeeUserAccount({
        employeeCode: employee.employeeCode.trim(),
        companyId,
        email: createUserEmail.trim().toLowerCase(),
        password: createUserPassword,
      });
    },
    onSuccess: (result) => {
      const userId = resolveCreatedUserId(result);
      if (!userId) {
        toast.error('تم إنشاء الحساب لكن لم يُرجع الخادم معرّف المستخدم');
        return;
      }

      toast.success('تم إنشاء حساب المستخدم وربطه بالموظف بنجاح');
      setCreateUserPassword('');
      setCreateUserOpen(false);
      onUserCreated?.(userId);
      void qc.invalidateQueries({ queryKey: ['employees'] });
      void qc.invalidateQueries({ queryKey: ['user-roles', userId] });
      void qc.invalidateQueries({ queryKey: ['user-permissions', userId] });
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'employee.createUserAccount');
      toast.error(displayMessage);
    },
  });

  return {
    createUserOpen,
    setCreateUserOpen,
    createUserEmail,
    setCreateUserEmail,
    createUserPassword,
    setCreateUserPassword,
    isCreatingUser: createUserMutation.isPending,
    handleCreateUser: () => createUserMutation.mutate(),
  };
}

export type EmployeeCreateUserModel = ReturnType<typeof useEmployeeCreateUser>;

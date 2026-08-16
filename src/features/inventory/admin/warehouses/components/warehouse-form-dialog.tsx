'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ACCESS_PROFILE_KEY } from '@/features/auth/hooks/use-access-profile';
import { useInventoryBranchScope } from '@/features/inventory/lib/use-inventory-branch-scope';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import {
  getBranchAccessLabel,
  resolveInventoryBranchScope,
} from '@/features/auth/types/access-profile';
import { useWarehouseMutations } from '@/features/inventory/admin/warehouses/hooks/use-warehouse-mutations';
import {
  INCOMING_STEP_OPTIONS,
  OUTGOING_STEP_OPTIONS,
  WAREHOUSE_FORM_DEFAULT_VALUES,
  warehouseFormSchema,
  type WarehouseFormValues,
} from '@/features/inventory/admin/schemas/warehouse-schemas';
import { EntityFormRow } from '@/features/ecommerce/admin/shared/components/entity-form-row';
import type { Warehouse } from '@/features/inventory/domain/types/warehouse';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  dialogShellBodyClass,
  dialogShellContentClass,
  dialogShellHeaderClass,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/shared/utils';

const NONE_VALUE = '__none__';

type Props = {
  warehouse?: Warehouse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toFormValues(warehouse: Warehouse): WarehouseFormValues {
  return {
    code: warehouse.code,
    nameAr: warehouse.nameAr,
    address: warehouse.address ?? '',
    branchId: warehouse.branchId ?? '',
    status: warehouse.status,
    incomingSteps: warehouse.incomingSteps ?? 1,
    outgoingSteps: warehouse.outgoingSteps ?? 1,
    buyToResupply: warehouse.buyToResupply ?? false,
  };
}

export function WarehouseFormDialog({ warehouse, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const { create, update } = useWarehouseMutations();
  const {
    companyId,
    hasAllBranchAccess,
    allowedBranchIds,
  } = useInventoryBranchScope();
  const accessProfile = useAuthStore((s) => s.accessProfile);
  const company = accessProfile?.companies.find((c) => c.companyId === companyId);
  const branchOptions = React.useMemo(() => {
    const branches = company?.branches ?? [];
    if (hasAllBranchAccess) return branches;
    return branches.filter((b) => allowedBranchIds.includes(b.branchId));
  }, [company?.branches, hasAllBranchAccess, allowedBranchIds]);

  const isEditing = Boolean(warehouse);
  const isSaving = create.isPending || update.isPending;

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: WAREHOUSE_FORM_DEFAULT_VALUES,
  });

  // Access profile caches assigned branches — refresh when opening create/edit
  // so newly assigned user_branches appear without a full re-login.
  React.useEffect(() => {
    if (!open || !userId) return;
    void queryClient.invalidateQueries({ queryKey: [...ACCESS_PROFILE_KEY, userId] });
  }, [open, queryClient, userId]);

  React.useEffect(() => {
    if (!open) return;
    if (warehouse) {
      form.reset(toFormValues(warehouse));
      return;
    }
    // Branch is optional on create — leave unset (null/central on save).
    form.reset({
      ...WAREHOUSE_FORM_DEFAULT_VALUES,
      branchId: '',
    });
  }, [open, warehouse, form]);

  const onSubmit = async (values: WarehouseFormValues) => {
    if (!companyId) return;
    const raw = (values.branchId ?? '').trim();
    const branchId: string | null =
      !raw || raw === NONE_VALUE ? null : raw;

    // Refresh access profile so a newly toggled role.isAllBranches is visible.
    if (userId) {
      await queryClient.refetchQueries({ queryKey: [...ACCESS_PROFILE_KEY, userId] });
    }
    const freshCompany =
      useAuthStore.getState().accessProfile?.companies.find((c) => c.companyId === companyId)
      ?? null;
    const freshScope = resolveInventoryBranchScope(freshCompany);
    const canCreateCentral = freshScope.hasAllBranchAccess;

    // Client hint only when profile clearly lacks the flag. Backend still enforces.
    if (branchId === null && !canCreateCentral) {
      form.setError('branchId', {
        message:
          'جلسة الدخول لا تُظهر isAllBranches=true على أدوارك (من /auth/access-profile). '
          + 'تأكد أن الدور مفعّل عليه «كل الفروع» ومُسند لحسابك، ثم سجّل خروجاً ودخولاً. '
          + 'أو اختر فرعاً يدوياً.',
      });
      return;
    }
    if (
      branchId
      && !freshScope.hasAllBranchAccess
      && !freshScope.allowedBranchIds.includes(branchId)
    ) {
      form.setError('branchId', { message: 'لا تملك صلاحية على هذا الفرع.' });
      return;
    }

    const payload = {
      companyId,
      code: values.code.trim(),
      nameAr: values.nameAr.trim(),
      address: values.address?.trim() || undefined,
      branchId,
      status: values.status,
      incomingSteps: values.incomingSteps,
      outgoingSteps: values.outgoingSteps,
      buyToResupply: values.buyToResupply,
    };

    if (warehouse) {
      await update.mutateAsync({ companyId, id: warehouse.id, patch: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(dialogShellContentClass, 'max-w-2xl sm:max-w-2xl')}>
        <div className={dialogShellHeaderClass}>
          <DialogTitle className="text-base font-semibold">
            {isEditing ? 'تعديل المستودع' : 'مستودع جديد'}
          </DialogTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            عند الإنشاء تُنشأ مواقع تلقائية باسم المختصر (مثل: فثسف/المخزون).
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit(onSubmit)(e);
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className={cn(dialogShellBodyClass, 'space-y-1')}>
            <EntityFormRow label="اسم المستودع" htmlFor="wh-name-ar">
              <Input
                id="wh-name-ar"
                className="max-w-sm border-0 bg-transparent px-0 text-xl font-semibold shadow-none focus-visible:ring-0"
                placeholder="مثال: المستودع المركزي"
                {...form.register('nameAr')}
              />
              {form.formState.errors.nameAr ? (
                <p className="text-xs text-destructive">{form.formState.errors.nameAr.message}</p>
              ) : null}
            </EntityFormRow>

            <EntityFormRow label="الاسم المختصر" htmlFor="wh-code" hint>
              <div className="space-y-1">
                <Input id="wh-code" className="max-w-xs" placeholder="مثال: فثسف أو WH" {...form.register('code')} />
                {form.formState.errors.code ? (
                  <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
                ) : null}
                <p className="text-xs text-muted-foreground">يُستخدم لإنشاء المواقع التلقائية.</p>
              </div>
            </EntityFormRow>

            <EntityFormRow label="الفرع" htmlFor="wh-branch">
              <Controller
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <Select
                    value={field.value && field.value !== '' ? field.value : NONE_VALUE}
                    onValueChange={(value) =>
                      field.onChange(value === NONE_VALUE ? '' : value)
                    }
                    disabled={isEditing && !hasAllBranchAccess}
                  >
                    <SelectTrigger id="wh-branch" aria-label="فرع المستودع" className="max-w-sm">
                      <SelectValue placeholder="اختياري — بدون فرع = مركزي" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>بدون فرع (اختياري)</SelectItem>
                      {branchOptions.map((branch) => (
                        <SelectItem key={branch.branchId} value={branch.branchId}>
                          {getBranchAccessLabel(branch)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.branchId ? (
                <p className="text-xs text-destructive">{form.formState.errors.branchId.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {hasAllBranchAccess
                    ? 'الفرع اختياري. «بدون فرع» = مستودع مركزي (من access profile: isAllBranches).'
                    : 'لم تظهر «كل الفروع» في جلسة الدخول بعد. المصدر: /auth/access-profile ← roles[].isAllBranches — ليس مجرد مفتاح شاشة الأدوار.'}
                </p>
              )}
            </EntityFormRow>

            <EntityFormRow label="العنوان" htmlFor="wh-address">
              <Input id="wh-address" className="max-w-lg" {...form.register('address')} />
            </EntityFormRow>

            <EntityFormRow label="الشحنات الواردة" htmlFor="wh-incoming">
              <Controller
                control={form.control}
                name="incomingSteps"
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(value) => field.onChange(Number(value) as 1 | 2 | 3)}
                  >
                    <SelectTrigger id="wh-incoming" aria-label="الشحنات الواردة" className="max-w-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INCOMING_STEP_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={String(option.value)}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </EntityFormRow>

            <EntityFormRow label="الشحنات الصادرة" htmlFor="wh-outgoing">
              <Controller
                control={form.control}
                name="outgoingSteps"
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(value) => field.onChange(Number(value) as 1 | 2 | 3)}
                  >
                    <SelectTrigger id="wh-outgoing" aria-label="الشحنات الصادرة" className="max-w-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OUTGOING_STEP_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={String(option.value)}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </EntityFormRow>

            <EntityFormRow label="إعادة التزويد">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">اقتراح أوامر شراء عند انخفاض المخزون</p>
                <Controller
                  control={form.control}
                  name="buyToResupply"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label="الشراء لإعادة التزويد"
                    />
                  )}
                />
              </div>
            </EntityFormRow>

            <EntityFormRow label="مستودع نشط">
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Switch
                    checked={field.value === 'active'}
                    onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'inactive')}
                    aria-label="حالة المستودع"
                  />
                )}
              />
            </EntityFormRow>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-border px-6 py-4 sm:justify-start">
            <Button type="submit" disabled={isSaving || !companyId || (!hasAllBranchAccess && branchOptions.length === 0)}>
              {isSaving ? 'جاري الحفظ…' : isEditing ? 'حفظ' : 'إنشاء المستودع'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              إلغاء
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrderStageHandlers } from '@/features/ecommerce/admin/orders/hooks/use-order-stages';
import type { OrderStage } from '@/features/ecommerce/admin/orders/lib/api/order-stages';

/** Picker values that are not a user. */
export const HANDLER_AUTO = '__auto';
export const HANDLER_KEEP = '__keep';
export const HANDLER_NONE = '__none';

type Props = {
  companyId: string;
  stage: OrderStage;
  value: string;
  onChange: (value: string) => void;
  /** Extra first choices (e.g. by the settings / unchanged). */
  leading?: Array<{ value: string; label: string }>;
  /** Offer "unassigned". */
  allowNone?: boolean;
  disabled?: boolean;
  /** A user not to offer (e.g. the current assignee). */
  excludeUserId?: string | null;
};

/** The staff who may handle `stage`, least loaded first, with their open orders. */
export function OrderHandlerSelect({
  companyId,
  stage,
  value,
  onChange,
  leading = [],
  allowNone = true,
  disabled,
  excludeUserId,
}: Props) {
  const handlers = useOrderStageHandlers(companyId, stage);
  const users = (handlers.data ?? []).filter((user) => user.id !== excludeUserId);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger aria-label="المستخدم المسؤول" className="w-full">
        <SelectValue placeholder={handlers.isLoading ? 'جاري التحميل…' : 'اختر المستخدم'} />
      </SelectTrigger>
      <SelectContent>
        {leading.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
        {allowNone ? (
          <SelectItem value={HANDLER_NONE}>بدون إسناد — يستلمه أحد مستخدمي المرحلة</SelectItem>
        ) : null}
        {users.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            {user.nameAr}
            <span className="ms-1 text-xs text-muted-foreground">({user.openOrders} طلب مفتوح)</span>
          </SelectItem>
        ))}
        {!handlers.isLoading && users.length === 0 ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            لا يوجد مستخدمون يملكون صلاحية هذه المرحلة
          </div>
        ) : null}
      </SelectContent>
    </Select>
  );
}

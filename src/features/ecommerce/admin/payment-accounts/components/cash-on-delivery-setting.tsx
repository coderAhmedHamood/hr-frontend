'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { useCan } from '@/features/auth/hooks/use-can';
import { usePaymentAccounts } from '@/features/ecommerce/admin/payment-accounts/hooks/use-payment-accounts';
import { resolveStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { apiRequest } from '@/features/hr/lib/api/client';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';

const settingsPath = (companyId: string) =>
  `/store-admin/companies/${resolveStorefrontCompanyId(companyId)}/settings`;

const queryKey = (companyId: string) => ['store-admin', 'cash-on-delivery', companyId] as const;

/**
 * Cash on delivery is a store setting (off by default): the owner turns it
 * on only when the store supports it. Checkout then offers it through a
 * published cash account (the account carries its name and instructions).
 */
export function CashOnDeliverySetting({ companyId }: { companyId: string }) {
  const can = useCan();
  const canUpdate = can('sta.settings.update');
  const queryClient = useQueryClient();

  const setting = useQuery({
    queryKey: queryKey(companyId),
    queryFn: async () => {
      const settings = await apiRequest<{ cashOnDeliveryEnabled?: boolean }>(
        settingsPath(companyId),
        { throwOnError: true },
      );
      return settings?.cashOnDeliveryEnabled === true;
    },
    enabled: Boolean(companyId),
  });

  const cashAccounts = usePaymentAccounts(
    companyId,
    { page: 1, limit: 100, archiveScope: 'active', type: 'cash' },
    Boolean(companyId),
  );
  const hasPublishedCash = (cashAccounts.data?.items ?? []).some(
    (account) => account.isActive && account.showInStore,
  );

  const update = useMutation({
    mutationFn: (enabled: boolean) =>
      apiRequest(settingsPath(companyId), {
        method: 'PATCH',
        throwOnError: true,
        body: { cashOnDeliveryEnabled: enabled },
      }),
    onSuccess: (_data, enabled) => {
      queryClient.setQueryData(queryKey(companyId), enabled);
      toast.success(enabled ? 'تم تفعيل الدفع عند الاستلام' : 'تم إيقاف الدفع عند الاستلام');
    },
    onError: (error) => handleApiError(error, 'ecommerce.settings.cashOnDelivery'),
  });

  const enabled = setting.data === true;

  return (
    <div className="space-y-2 rounded-xl border border-border/60 bg-muted/15 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">الدفع عند الاستلام</p>
          <p className="text-xs text-muted-foreground">
            فعّله فقط إن كان متجرك يحصّل المبلغ نقداً عند التسليم.
          </p>
        </div>
        <Switch
          checked={enabled}
          disabled={!canUpdate || setting.isLoading || update.isPending}
          onCheckedChange={(next) => update.mutate(next)}
          aria-label="الدفع عند الاستلام"
        />
      </div>
      {enabled && cashAccounts.isSuccess && !hasPublishedCash ? (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          أضف حساب دفع من نوع «نقدي» وأظهره في المتجر ليظهر الدفع عند الاستلام في صفحة الشراء.
        </p>
      ) : null}
    </div>
  );
}

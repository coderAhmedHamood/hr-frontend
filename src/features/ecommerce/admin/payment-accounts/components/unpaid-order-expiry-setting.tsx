'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useCan } from '@/features/auth/hooks/use-can';
import { resolveStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { apiRequest } from '@/features/hr/lib/api/client';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';

const settingsPath = (companyId: string) =>
  `/store-admin/companies/${resolveStorefrontCompanyId(companyId)}/settings`;

const queryKey = (companyId: string) => ['store-admin', 'unpaid-order-expiry', companyId] as const;

const DEFAULT_HOURS = 48;
const MAX_HOURS = 720;

/**
 * Unpaid prepaid orders (bank, network, wallet, card) without a payment
 * proof are cancelled after these hours and their quantity comes back.
 * Cash on delivery is never cancelled. Applies to orders placed from when
 * it is turned on.
 */
export function UnpaidOrderExpirySetting({ companyId }: { companyId: string }) {
  const can = useCan();
  const canUpdate = can('sta.settings.update');
  const queryClient = useQueryClient();

  const setting = useQuery({
    queryKey: queryKey(companyId),
    queryFn: async () => {
      const settings = await apiRequest<{ unpaidOrderExpiryHours?: number | null }>(
        settingsPath(companyId),
        { throwOnError: true },
      );
      return settings?.unpaidOrderExpiryHours ?? null;
    },
    enabled: Boolean(companyId),
  });

  const hours = setting.data ?? null;
  const [draft, setDraft] = useState('');
  useEffect(() => {
    setDraft(String(hours ?? DEFAULT_HOURS));
  }, [hours]);

  const update = useMutation({
    mutationFn: (next: number | null) =>
      apiRequest(settingsPath(companyId), {
        method: 'PATCH',
        throwOnError: true,
        body: { unpaidOrderExpiryHours: next },
      }),
    onSuccess: (_data, next) => {
      queryClient.setQueryData(queryKey(companyId), next);
      toast.success(
        next === null
          ? 'تم إيقاف الإلغاء التلقائي للطلبات غير المدفوعة'
          : `تُلغى الطلبات غير المدفوعة بعد ${next} ساعة`,
      );
    },
    onError: (error) => handleApiError(error, 'ecommerce.settings.unpaidOrderExpiry'),
  });

  const enabled = hours !== null;
  const parsed = Number(draft);
  const validDraft = Number.isInteger(parsed) && parsed >= 1 && parsed <= MAX_HOURS;
  const busy = !canUpdate || setting.isLoading || update.isPending;

  return (
    <div className="space-y-2 rounded-xl border border-border/60 bg-muted/15 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">إلغاء الطلبات غير المدفوعة تلقائياً</p>
          <p className="text-xs text-muted-foreground">
            الطلب المدفوع مسبقاً (تحويل، شبكة، محفظة، بطاقة) الذي لم يُدفع ولم يُرفق له إثبات دفع يُلغى
            بعد المدة وتعود كميته. لا يشمل الدفع عند الاستلام، ولا الطلبات التي سبقت التفعيل.
          </p>
        </div>
        <Switch
          checked={enabled}
          disabled={busy}
          onCheckedChange={(next) => update.mutate(next ? (validDraft ? parsed : DEFAULT_HOURS) : null)}
          aria-label="إلغاء الطلبات غير المدفوعة تلقائياً"
        />
      </div>
      {enabled ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">بعد</span>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_HOURS}
            value={draft}
            disabled={busy}
            onChange={(event) => setDraft(event.target.value)}
            className="h-8 w-24"
            aria-label="عدد الساعات"
          />
          <span className="text-xs text-muted-foreground">ساعة</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy || !validDraft || parsed === hours}
            onClick={() => update.mutate(parsed)}
          >
            حفظ
          </Button>
          {!validDraft ? (
            <span className="text-xs text-destructive">من 1 إلى {MAX_HOURS} ساعة</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

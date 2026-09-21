'use client';

import { BellRing } from 'lucide-react';
import { toast } from 'sonner';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useCan } from '@/features/auth/hooks/use-can';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { useActiveCompany } from '@/features/hr/organization/hooks/useActiveCompany';
import {
  INVENTORY_NOTIFICATION_GROUPS,
  type InventoryNotificationKey,
} from '@/features/inventory/admin/notifications/constants/notification-groups';
import { useInventoryCompanySettings } from '@/features/inventory/admin/notifications/hooks/use-inventory-settings';
import type {
  InventoryCompanySettings,
  UpdateInventoryCompanySettingsDto,
} from '@/features/inventory/admin/notifications/lib/api/inventory-settings';
import { NotificationTogglesCard } from '@/features/system/organization/pages/_shared/components/notification-toggles-card';
import { SettingsCompanyBanner } from '@/features/system/organization/pages/_shared/components/settings-company-banner';
import {
  SettingsPageEmpty,
  SettingsPageError,
  SettingsPageLoading,
} from '@/features/system/organization/pages/_shared/components/settings-page-states';
import { useModuleEnablementContext } from '@/features/auth/hooks/use-system-owner';
import { isModuleEnabledFor } from '@/shared/modules/registry';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function InventorySettingsPage() {
  const can = useCan();
  const canRead = can('inv.settings.read');
  const canUpdate = can('inv.settings.update');

  const activeCompanyId = useAuthStore((s) => s.activeCompanyId);
  const { companyId: moduleCompanyId, ...moduleContext } = useModuleEnablementContext();
  const inventoryEnabled = isModuleEnabledFor(
    'inventory',
    activeCompanyId ?? moduleCompanyId,
    moduleContext,
  );

  const { data: company } = useActiveCompany();
  const { data: settings, isLoading, isError, error, update, companyId } =
    useInventoryCompanySettings();

  const handleToggle = async (key: string, value: boolean) => {
    if (!settings || !canUpdate) return;
    try {
      await update.mutateAsync({ [key]: value });
      toast.success('تم تحديث الإعداد');
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'settings.inventory.update');
      toast.error(displayMessage);
    }
  };

  const handleBatchStrategy = async (
    value: InventoryCompanySettings['batchAllocationStrategy'],
  ) => {
    if (!settings || !canUpdate) return;
    try {
      await update.mutateAsync({ batchAllocationStrategy: value });
      toast.success('تم تحديث استراتيجية استهلاك الدفعات');
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'settings.inventory.update');
      toast.error(displayMessage);
    }
  };

  const handleCostingField = async (
    patch: Pick<
      UpdateInventoryCompanySettingsDto,
      'costingStatus' | 'costingMethod' | 'costingScope'
    >,
  ) => {
    if (!settings || !canUpdate) return;
    try {
      await update.mutateAsync(patch);
      toast.success('تم تحديث إعدادات التكلفة');
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'settings.inventory.update');
      toast.error(displayMessage);
    }
  };

  const handleDisplayDecimals = async (
    patch: Pick<UpdateInventoryCompanySettingsDto, 'quantityDisplayDecimals' | 'costDisplayDecimals'>,
  ) => {
    if (!settings || !canUpdate) return;
    try {
      await update.mutateAsync(patch);
      toast.success('تم تحديث دقة عرض الأرقام');
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'settings.inventory.update');
      toast.error(displayMessage);
    }
  };

  if (!inventoryEnabled) {
    return (
      <SettingsPageEmpty message="تطبيق المخازن غير مفعّل لهذه الشركة — لا تظهر إعدادات الإشعارات." />
    );
  }

  if (!canRead) {
    return <SettingsPageEmpty message="ليس لديك صلاحية عرض إعدادات إشعارات المخازن." />;
  }

  if (!companyId) {
    return <SettingsPageEmpty message="لا توجد شركة افتراضية — سجّل الدخول أو اختر شركة." />;
  }

  if (isLoading) {
    return <SettingsPageLoading />;
  }

  if (isError || !settings) {
    const { displayMessage } = handleApiError(error, 'settings.inventory.get');
    return <SettingsPageError message={displayMessage} />;
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <SetPageTitle titleAr="إعدادات المخازن" iconName="Bell" />
      {company ? (
        <SettingsCompanyBanner
          eyebrow="المخازن"
          icon={BellRing}
          companyName={company.nameAr}
          description="تحكم في إشعارات المخازن: تنبيهات المخزون، حركات المستودع، وخصم البيع. المستلمون = من يملك inv.notifications.read ضمن نطاق الفرع (ليس broadcast لكل الشركة)."
        />
      ) : null}

      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="space-y-1">
          <h2 className="font-semibold">إدارة دفعات المخزون</h2>
          <p className="text-sm text-muted-foreground">
            تحدد ترتيب الدفعات عند الصرف والتحويل والنقص في الجرد داخل الموقع المختار.
          </p>
        </div>
        <div className="mt-4 max-w-md space-y-1.5">
          <Label htmlFor="batch-allocation-strategy">استراتيجية استهلاك الدفعات</Label>
          <Select
            value={settings.batchAllocationStrategy}
            disabled={update.isPending || !canUpdate}
            onValueChange={(value) =>
              void handleBatchStrategy(
                value as InventoryCompanySettings['batchAllocationStrategy'],
              )
            }
          >
            <SelectTrigger id="batch-allocation-strategy">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fifo">FIFO — الأقدم دخولًا أولًا</SelectItem>
              <SelectItem value="lifo">LIFO — الأحدث دخولًا أولًا</SelectItem>
              <SelectItem value="fefo">FEFO — الأقرب انتهاءً أولًا</SelectItem>
            </SelectContent>
          </Select>
          {settings.batchAllocationStrategy === 'fefo' ? (
            <p className="text-xs text-muted-foreground">
              الدفعات بلا تاريخ صلاحية تُستهلك بعد الدفعات المؤرخة، وبترتيب FIFO ثابت.
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="space-y-1">
          <h2 className="font-semibold">تكلفة المخزون</h2>
          <p className="text-sm text-muted-foreground">
            تفعيل احتساب تكلفة المخزون وطريقة تقييمه ونطاقه — تؤثر على تكلفة الاستلامات والصرف والتقارير المالية.
          </p>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="costing-status">احتساب التكلفة</Label>
            <Select
              value={settings.costingStatus}
              disabled={update.isPending || !canUpdate}
              onValueChange={(value) => void handleCostingField({ costingStatus: value as InventoryCompanySettings['costingStatus'] })}
            >
              <SelectTrigger id="costing-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disabled">معطّل</SelectItem>
                <SelectItem value="active">مفعّل</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="costing-method">طريقة التقييم</Label>
            <Select
              value={settings.costingMethod}
              disabled={update.isPending || !canUpdate || settings.costingStatus === 'disabled'}
              onValueChange={(value) => void handleCostingField({ costingMethod: value as InventoryCompanySettings['costingMethod'] })}
            >
              <SelectTrigger id="costing-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="moving_average">متوسط متحرك</SelectItem>
                <SelectItem value="fifo">FIFO — الأقدم دخولًا أولًا</SelectItem>
                <SelectItem value="lifo">LIFO — الأحدث دخولًا أولًا</SelectItem>
                <SelectItem value="standard">تكلفة معيارية</SelectItem>
                <SelectItem value="specific">تحديد دفعة بعينها</SelectItem>
                <SelectItem value="periodic_weighted_average">متوسط مرجّح دوري</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="costing-scope">نطاق التكلفة</Label>
            <Select
              value={settings.costingScope}
              disabled={update.isPending || !canUpdate || settings.costingStatus === 'disabled'}
              onValueChange={(value) => void handleCostingField({ costingScope: value as InventoryCompanySettings['costingScope'] })}
            >
              <SelectTrigger id="costing-scope">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company">الشركة كاملة</SelectItem>
                <SelectItem value="warehouse">كل مستودع على حدة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {settings.costingStatus === 'disabled' ? (
          <p className="mt-3 text-xs text-muted-foreground">
            فعّل احتساب التكلفة أولًا لاختيار طريقة التقييم ونطاقه.
          </p>
        ) : null}
      </section>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="space-y-1">
          <h2 className="font-semibold">دقة عرض الأرقام</h2>
          <p className="text-sm text-muted-foreground">
            عدد الخانات العشرية المعروضة في الواجهة للكميات والتكاليف (مثال: 255.00 بدل 255.00000000).
            التخزين الداخلي للتكلفة يبقى دقيقًا دون تغيير — هذا يتحكم بالعرض فقط.
          </p>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 sm:max-w-md">
          <div className="space-y-1.5">
            <Label htmlFor="quantity-display-decimals">خانات الكمية العشرية</Label>
            <Input
              id="quantity-display-decimals"
              type="number"
              min={0}
              max={4}
              disabled={update.isPending || !canUpdate}
              defaultValue={settings.quantityDisplayDecimals}
              onBlur={(e) => {
                const value = Math.min(4, Math.max(0, Number(e.target.value) || 0));
                if (value !== settings.quantityDisplayDecimals) {
                  void handleDisplayDecimals({ quantityDisplayDecimals: value });
                }
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cost-display-decimals">خانات التكلفة العشرية</Label>
            <Input
              id="cost-display-decimals"
              type="number"
              min={0}
              max={8}
              disabled={update.isPending || !canUpdate}
              defaultValue={settings.costDisplayDecimals}
              onBlur={(e) => {
                const value = Math.min(8, Math.max(0, Number(e.target.value) || 0));
                if (value !== settings.costDisplayDecimals) {
                  void handleDisplayDecimals({ costDisplayDecimals: value });
                }
              }}
            />
          </div>
        </div>
      </section>

      <NotificationTogglesCard
        title="إشعارات المخازن"
        description="إعدادات مستقلة عن الموارد البشرية — تُطبَّق على أحداث المخزون والمستودعات فقط."
        groups={INVENTORY_NOTIFICATION_GROUPS}
        values={settings as Pick<InventoryCompanySettings, InventoryNotificationKey>}
        disabled={update.isPending || !canUpdate}
        masterDisabled={!settings.notificationsEnabled}
        onToggle={(key, value) => void handleToggle(key, value)}
      />
    </div>
  );
}

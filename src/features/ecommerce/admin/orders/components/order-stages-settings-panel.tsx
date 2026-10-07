'use client';

import * as React from 'react';
import { AlertTriangle, ShieldCheck, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { OrderHandlerSelect } from '@/features/ecommerce/admin/orders/components/order-handler-select';
import {
  useOrderStagesSettings,
  useSaveOrderStagesSettings,
} from '@/features/ecommerce/admin/orders/hooks/use-order-stages';
import type {
  OrderStage,
  OrderStageAutoAssign,
  SaveOrderStagesSettingsInput,
} from '@/features/ecommerce/admin/orders/lib/api/order-stages';
import { cn } from '@/shared/utils';

const AUTO_ASSIGN_LABELS: Record<OrderStageAutoAssign, string> = {
  none: 'بدون إسناد — يستلمه أحد موظفي المرحلة',
  user: 'موظف محدد',
  balanced: 'توزيع تلقائي — الأقل طلبات مفتوحة',
};

const STAGE_HINTS: Record<OrderStage, string> = {
  pending: 'مراجعة الطلب الجديد وتأكيده (أو بدء تجهيزه مباشرة).',
  confirmed: 'بدء تجهيز الطلب المؤكد — غالباً موظف المخزن.',
  processing: 'تخصيص البنود وشحنها ثم نقل الطلب إلى «تم الشحن».',
  shipped: 'توصيل الطلب وتسليمه للعميل — مندوب التوصيل، مع تحصيل المبلغ عند الاستلام.',
};

const OTHER_PERMISSIONS = [
  ['sta.order-stages.cancel', 'إلغاء الطلبات'],
  ['sta.order-stages.refund', 'استرداد الطلبات'],
  ['sta.order-stages.rollback', 'إرجاع الطلب إلى مرحلة سابقة'],
  ['sta.order-stages.assign', 'إسناد الطلبات وإعادة إسنادها لأي موظف (مشرف)'],
] as const;

type StageDraft = { autoAssign: OrderStageAutoAssign; userId: string | null };

function SwitchRow({
  title,
  description,
  checked,
  onChange,
  disabled,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-xl border border-border/70 p-3">
      <span className="space-y-0.5">
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        <span className="block text-xs leading-relaxed text-muted-foreground">{description}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} aria-label={title} />
    </label>
  );
}

/**
 * Order stages settings: turning stage permissions on, the assignee rule,
 * shipping only once paid, and who gets an order entering each stage.
 */
export function OrderStagesSettingsPanel({ companyId }: { companyId: string }) {
  const query = useOrderStagesSettings(companyId);
  const save = useSaveOrderStagesSettings(companyId);
  const [enabled, setEnabled] = React.useState(false);
  const [assigneeOnly, setAssigneeOnly] = React.useState(true);
  const [requirePayment, setRequirePayment] = React.useState(false);
  const [stages, setStages] = React.useState<Partial<Record<OrderStage, StageDraft>>>({});

  React.useEffect(() => {
    if (!query.data) return;
    setEnabled(query.data.enabled);
    setAssigneeOnly(query.data.assigneeOnly);
    setRequirePayment(query.data.requirePaymentBeforeShipping);
    setStages(
      Object.fromEntries(
        query.data.stages.map((s) => [s.stage, { autoAssign: s.autoAssign, userId: s.userId }]),
      ),
    );
  }, [query.data]);

  if (query.isLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">جاري التحميل…</p>;
  }
  if (!query.data) {
    return <p className="py-8 text-center text-sm text-muted-foreground">تعذّر تحميل الإعدادات.</p>;
  }

  const missingUser = query.data.stages.some(
    (s) => stages[s.stage]?.autoAssign === 'user' && !stages[s.stage]?.userId,
  );
  const emptyStages = query.data.stages.filter((s) => s.handlersCount === 0);

  function submit() {
    const input: SaveOrderStagesSettingsInput = {
      enabled,
      assigneeOnly,
      requirePaymentBeforeShipping: requirePayment,
      stages: query.data!.stages.map((s) => {
        const draft = stages[s.stage] ?? { autoAssign: 'none', userId: null };
        return {
          stage: s.stage,
          autoAssign: draft.autoAssign,
          userId: draft.autoAssign === 'user' ? draft.userId : null,
        };
      }),
    };
    void save.mutateAsync(input).catch(() => undefined);
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <SwitchRow
          title="تفعيل التحكم بمراحل الطلبات"
          description="عند التفعيل لا ينقل الطلب من مرحلة إلى أخرى إلا من يملك صلاحية تلك المرحلة، ويُسند الطلب تلقائياً حسب الإعدادات أدناه. عند الإيقاف تعمل الطلبات كما كانت (صلاحية تعديل الطلبات)."
          checked={enabled}
          onChange={setEnabled}
        />
        <SwitchRow
          title="الطلب المسند يعمل عليه المسند إليه فقط"
          description="لا يحرّك الطلب المسند إلا صاحبه أو من يملك صلاحية الإسناد (المشرف)."
          checked={assigneeOnly}
          onChange={setAssigneeOnly}
          disabled={!enabled}
        />
        <SwitchRow
          title="لا يُشحن الطلب المدفوع مسبقاً قبل تأكيد الدفع"
          description="للتحويل البنكي والمحافظ والبطاقات: لا يُنقل الطلب إلى «تم الشحن» حتى تصبح حالة الدفع «مدفوع». الدفع عند الاستلام لا يتأثر."
          checked={requirePayment}
          onChange={setRequirePayment}
        />
      </div>

      {enabled && emptyStages.length > 0 ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            لا يوجد موظف يملك صلاحية مرحلة: {emptyStages.map((s) => `«${s.labelAr}»`).join('، ')}. ستتوقف
            الطلبات عندها — امنح الصلاحية لدور من شاشة الأدوار والصلاحيات.
          </p>
        </div>
      ) : null}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">المراحل ومن يستلم الطلب عند دخولها</h3>
        {query.data.stages.map((stage) => {
          const draft = stages[stage.stage] ?? {
            autoAssign: 'none' as const,
            userId: null,
          };
          const savedUserIneligible =
            stage.userId && stage.userEligible === false && draft.userId === stage.userId;
          return (
            <div
              key={stage.stage}
              className={cn('space-y-3 rounded-xl border border-border/70 p-3', !enabled && 'opacity-80')}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">{stage.labelAr}</p>
                  <p className="text-xs text-muted-foreground">{STAGE_HINTS[stage.stage]}</p>
                  <p className="text-[11px] text-muted-foreground" dir="ltr">
                    {stage.permissionCode}
                  </p>
                </div>
                <Badge variant={stage.handlersCount === 0 ? 'warning' : 'subtle'} className="gap-1">
                  <Users className="h-3 w-3" />
                  {stage.handlersCount} موظف
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Select
                  value={draft.autoAssign}
                  onValueChange={(value) =>
                    setStages((current) => ({
                      ...current,
                      [stage.stage]: {
                        ...draft,
                        autoAssign: value as OrderStageAutoAssign,
                      },
                    }))
                  }
                >
                  <SelectTrigger aria-label={`الإسناد في مرحلة ${stage.labelAr}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(AUTO_ASSIGN_LABELS) as OrderStageAutoAssign[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {AUTO_ASSIGN_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {draft.autoAssign === 'user' ? (
                  <OrderHandlerSelect
                    companyId={companyId}
                    stage={stage.stage}
                    value={draft.userId ?? ''}
                    allowNone={false}
                    onChange={(userId) =>
                      setStages((current) => ({
                        ...current,
                        [stage.stage]: { ...draft, userId },
                      }))
                    }
                  />
                ) : null}
              </div>
              {savedUserIneligible ? (
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {stage.userNameAr ?? 'الموظف المحدد'} لم يعد يملك صلاحية هذه المرحلة — لن يُسند إليه حتى
                  تُعاد الصلاحية أو تختار موظفاً آخر.
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="space-y-2 rounded-xl border border-border/70 bg-muted/25 p-3">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          صلاحيات أخرى في مجموعة «مراحل الطلبات»
        </p>
        <ul className="space-y-1 text-xs text-muted-foreground">
          {OTHER_PERMISSIONS.map(([code, label]) => (
            <li key={code}>
              {label} <span dir="ltr">({code})</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          تُمنح من شاشة الأدوار والصلاحيات. الموظف الذي لا يملك «عرض طلبات المتجر» يرى الطلبات المسندة إليه
          وطلبات مرحلته غير المسندة فقط. ولاستلام إشعار الإسناد يلزمه «عرض إشعارات المتجر».
        </p>
      </div>

      <div className="flex justify-end">
        <Button type="button" disabled={save.isPending || missingUser} onClick={submit}>
          حفظ الإعدادات
        </Button>
      </div>
    </div>
  );
}

'use client';

import * as React from 'react';
import { AlertTriangle, ShieldCheck, Truck, UserRound } from 'lucide-react';
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
  none: 'بدون إسناد',
  user: 'مستخدم محدد',
  balanced: 'توزيع تلقائي',
};

const AUTO_ASSIGN_HINTS: Record<OrderStageAutoAssign, string> = {
  none: 'يستلمه أي مستخدم يملك صلاحية هذه المرحلة.',
  user: 'يُسند دائماً إلى المستخدم الذي تختاره.',
  balanced: 'يُسند إلى من لديه أقل طلبات مفتوحة.',
};

const STAGE_HINTS: Record<OrderStage, string> = {
  pending: 'مراجعة الطلب الجديد وتأكيده.',
  confirmed: 'بدء تجهيز الطلب المؤكد — غالباً مسؤول المخزن.',
  processing: 'تخصيص البنود وشحنها.',
  shipped: 'توصيل الطلب وتسليمه للعميل.',
};

const OTHER_PERMISSIONS = [
  ['sta.order-stages.cancel', 'إلغاء الطلبات'],
  ['sta.order-stages.refund', 'استرداد الطلبات'],
  ['sta.order-stages.rollback', 'إرجاع الطلب إلى مرحلة سابقة'],
  ['sta.order-stages.assign', 'إسناد الطلبات لأي مستخدم'],
] as const;

type StageDraft = { autoAssign: OrderStageAutoAssign; userId: string | null };

function Section({
  index,
  title,
  description,
  icon: Icon,
  children,
}: {
  index: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border/70">
      <header className="flex items-start gap-3 border-b border-border/60 bg-muted/30 px-4 py-3.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            <span className="me-1.5 text-muted-foreground">{index}</span>
            {title}
          </h3>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </header>
      <div className="space-y-3 p-4">{children}</div>
    </section>
  );
}

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
    <label
      className={cn(
        'flex items-start justify-between gap-4 rounded-xl border border-border/70 bg-background p-3',
        disabled && 'opacity-60',
      )}
    >
      <span className="space-y-0.5">
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        <span className="block text-xs leading-relaxed text-muted-foreground">{description}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} aria-label={title} />
    </label>
  );
}

/**
 * Order stages settings, split into who may work a stage, who receives it,
 * and when shipping is allowed.
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
      <Section
        index="١"
        title="صلاحيات المراحل"
        description="من يحق له نقل الطلب في كل مرحلة. الصلاحيات نفسها تُمنح من شاشة الأدوار."
        icon={ShieldCheck}
      >
        <SwitchRow
          title="تفعيل التحكم بالمراحل"
          description="عند التفعيل لا ينقل الطلب إلا من يملك صلاحية المرحلة الحالية. عند الإيقاف تكفي صلاحية تعديل الطلبات."
          checked={enabled}
          onChange={setEnabled}
        />
        <SwitchRow
          title="الطلب المسند يعمل عليه صاحبه فقط"
          description="بعد الإسناد لا يحرّكه إلا المسند إليه، أو من يملك صلاحية الإسناد."
          checked={assigneeOnly}
          onChange={setAssigneeOnly}
          disabled={!enabled}
        />

        <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70">
          {query.data.stages.map((stage, index) => (
            <li key={stage.stage} className="flex flex-wrap items-center justify-between gap-3 bg-background px-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  <span className="me-2 text-xs text-muted-foreground">{index + 1}</span>
                  {stage.labelAr}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{STAGE_HINTS[stage.stage]}</p>
              </div>
              <Badge variant={stage.handlersCount === 0 ? 'warning' : 'subtle'}>
                {stage.handlersCount === 0 ? 'لا مستخدمين' : `${stage.handlersCount} مستخدم`}
              </Badge>
            </li>
          ))}
        </ul>

        {enabled && emptyStages.length > 0 ? (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              لا يوجد مستخدم لمرحلة {emptyStages.map((s) => `«${s.labelAr}»`).join('، ')}. الطلبات تتوقف هناك حتى
              تُمنح الصلاحية لدور.
            </p>
          </div>
        ) : null}

        <div className="rounded-xl bg-muted/30 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          <p className="font-medium text-foreground">صلاحيات إضافية</p>
          <ul className="mt-1.5 space-y-1">
            {OTHER_PERMISSIONS.map(([, label]) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
          <p className="mt-2">
            من لا يملك «عرض طلبات المتجر» يرى الطلبات المسندة إليه وطلبات مرحلته غير المسندة فقط.
          </p>
        </div>
      </Section>

      <Section
        index="٢"
        title="الإسناد التلقائي"
        description="من يستلم الطلب فور دخوله المرحلة. يعمل بعد تفعيل التحكم بالمراحل."
        icon={UserRound}
      >
        {!enabled ? (
          <p className="text-xs text-muted-foreground">فعّل التحكم بالمراحل أولاً حتى يُطبَّق الإسناد.</p>
        ) : null}
        <div className={cn('space-y-3', !enabled && 'pointer-events-none opacity-60')}>
          {query.data.stages.map((stage) => {
            const draft = stages[stage.stage] ?? {
              autoAssign: 'none' as const,
              userId: null,
            };
            const savedUserIneligible =
              stage.userId && stage.userEligible === false && draft.userId === stage.userId;
            return (
              <div key={stage.stage} className="space-y-2 rounded-xl border border-border/70 bg-background p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{stage.labelAr}</p>
                  <p className="text-xs text-muted-foreground">{AUTO_ASSIGN_HINTS[draft.autoAssign]}</p>
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
                    {stage.userNameAr ?? 'المستخدم المحدد'} لم يعد يملك صلاحية هذه المرحلة.
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </Section>

      <Section
        index="٣"
        title="شروط الشحن"
        description="متى يُسمح بنقل الطلب إلى مرحلة «تم الشحن»."
        icon={Truck}
      >
        <SwitchRow
          title="لا يُشحن الطلب المدفوع مسبقاً قبل تأكيد الدفع"
          description="التحويل البنكي والمحافظ والبطاقات تبقى حتى تصبح حالة الدفع «مدفوع». الدفع عند الاستلام لا يتأثر."
          checked={requirePayment}
          onChange={setRequirePayment}
        />
      </Section>

      <div className="flex justify-end">
        <Button type="button" disabled={save.isPending || missingUser} onClick={submit}>
          حفظ الإعدادات
        </Button>
      </div>
    </div>
  );
}

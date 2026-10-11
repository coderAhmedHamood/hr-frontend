'use client';

import * as React from 'react';
import { AlertTriangle, ArrowLeft, ShieldCheck, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrderHandlerSelect } from '@/features/ecommerce/admin/orders/components/order-handler-select';
import {
  useOrderStagesSettings,
  useSaveOrderStagesSettings,
} from '@/features/ecommerce/admin/orders/hooks/use-order-stages';
import type {
  OrderStage,
  OrderStageAutoAssign,
  OrderStageSettingView,
  SaveOrderStagesSettingsInput,
} from '@/features/ecommerce/admin/orders/lib/api/order-stages';
import { cn } from '@/shared/utils';

const AUTO_ASSIGN_LABELS: Record<OrderStageAutoAssign, string> = {
  none: 'بدون إسناد',
  user: 'مستخدم محدد',
  balanced: 'توزيع تلقائي',
};

const AUTO_ASSIGN_HINTS: Record<OrderStageAutoAssign, string> = {
  none: 'يبقى الطلب متاحاً لكل من يملك صلاحية المرحلة.',
  user: 'يصل دائماً إلى المستخدم الذي تختاره.',
  balanced: 'يصل إلى من لديه أقل طلبات مفتوحة.',
};

const STAGE_HINTS: Record<OrderStage, string> = {
  pending: 'مراجعة الطلب الجديد وتأكيده.',
  confirmed: 'بدء تجهيز الطلب المؤكد، وغالباً يتولاه المخزن.',
  processing: 'تخصيص البنود وتجهيزها للشحن.',
  shipped: 'خروج الطلب وتسليمه للعميل.',
};

const OTHER_PERMISSIONS = [
  ['إلغاء الطلبات', 'إنهاء الطلب قبل اكتماله.'],
  ['استرداد الطلبات', 'تسجيل استرداد مبلغ طلب مكتمل أو ملغى.'],
  ['إرجاع الطلب إلى مرحلة سابقة', 'إعادة الطلب خطوة إلى الخلف.'],
  ['إسناد الطلبات لأي مستخدم', 'اختيار المسؤول عن الطلب يدوياً.'],
] as const;

type StageDraft = { autoAssign: OrderStageAutoAssign; userId: string | null };
type PanelTab = 'path' | 'access' | 'assign' | 'ship';

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
 * Order stages settings, one decision per tab: the path, who may work a
 * stage, who receives it, and when shipping is allowed.
 */
export function OrderStagesSettingsPanel({ companyId }: { companyId: string }) {
  const query = useOrderStagesSettings(companyId);
  const save = useSaveOrderStagesSettings(companyId);
  const [tab, setTab] = React.useState<PanelTab>('path');
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

  const stageRows = query.data.stages;
  const missingUser = stageRows.some(
    (s) => stages[s.stage]?.autoAssign === 'user' && !stages[s.stage]?.userId,
  );
  const emptyStages = stageRows.filter((s) => s.handlersCount === 0);

  function draftOf(stage: OrderStageSettingView): StageDraft {
    return stages[stage.stage] ?? { autoAssign: 'none', userId: null };
  }

  function submit() {
    const input: SaveOrderStagesSettingsInput = {
      enabled,
      assigneeOnly,
      requirePaymentBeforeShipping: requirePayment,
      stages: stageRows.map((s) => {
        const draft = draftOf(s);
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
    <Tabs value={tab} onValueChange={(value) => setTab(value as PanelTab)} className="space-y-4">
      <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
        <TabsTrigger value="path">المسار</TabsTrigger>
        <TabsTrigger value="access">من يعمل</TabsTrigger>
        <TabsTrigger value="assign">من يستلم</TabsTrigger>
        <TabsTrigger value="ship">الشحن</TabsTrigger>
      </TabsList>

      <TabsContent value="path" className="mt-0 space-y-3">
        <p className="text-xs leading-relaxed text-muted-foreground">
          الطلب يتحرك بالترتيب. كل مرحلة لها سؤالان: من يحق له العمل عليها، ومن تصله عند دخولها.
        </p>
        <ol className="space-y-2">
          {stageRows.map((stage, index) => {
            const draft = draftOf(stage);
            return (
              <li key={stage.stage} className="rounded-xl border border-border/70 bg-background p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      <span className="me-2 text-xs text-muted-foreground">{index + 1}</span>
                      {stage.labelAr}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{STAGE_HINTS[stage.stage]}</p>
                  </div>
                  <Badge variant={stage.handlersCount === 0 ? 'warning' : 'subtle'}>
                    {stage.handlersCount === 0 ? 'لا مستخدمين' : `${stage.handlersCount} مستخدم`}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  الإسناد: {AUTO_ASSIGN_LABELS[draft.autoAssign]}
                  {draft.autoAssign === 'user' && stage.userNameAr ? ` — ${stage.userNameAr}` : ''}
                </p>
              </li>
            );
          })}
        </ol>
        <div className="grid gap-2 sm:grid-cols-3">
          <DecisionLink title="من يعمل" detail="صلاحية كل مرحلة" onClick={() => setTab('access')} />
          <DecisionLink title="من يستلم" detail="إسناد الطلب عند دخوله" onClick={() => setTab('assign')} />
          <DecisionLink title="الشحن" detail="شرط الدفع قبل الخروج" onClick={() => setTab('ship')} />
        </div>
      </TabsContent>

      <TabsContent value="access" className="mt-0 space-y-3">
        <SwitchRow
          title="تفعيل التحكم بالمراحل"
          description="عند التفعيل لا ينقل الطلب إلا صاحب صلاحية مرحلته الحالية. عند الإيقاف تكفي صلاحية تعديل الطلبات."
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
          {stageRows.map((stage, index) => (
            <li key={stage.stage} className="flex items-center justify-between gap-3 bg-background px-3 py-3">
              <div>
                <p className="text-sm font-medium">
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
              لا يوجد مستخدم لمرحلة {emptyStages.map((s) => `«${s.labelAr}»`).join('، ')}. الطلب يتوقف هناك حتى
              تُمنح الصلاحية من شاشة الأدوار.
            </p>
          </div>
        ) : null}
        <div className="grid gap-2 sm:grid-cols-2">
          {OTHER_PERMISSIONS.map(([title, detail]) => (
            <div key={title} className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="text-sm font-medium">{title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
            </div>
          ))}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          هذه الصلاحيات تُمنح من شاشة الأدوار. من لا يملك «عرض طلبات المتجر» يرى الطلبات المسندة إليه وطلبات مرحلته
          غير المسندة فقط.
        </p>
      </TabsContent>

      <TabsContent value="assign" className="mt-0 space-y-3">
        {!enabled ? (
          <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/30 p-3 text-sm">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p>الإسناد يُطبَّق بعد تفعيل التحكم بالمراحل من تبويب «من يعمل».</p>
          </div>
        ) : null}
        <div className={cn('space-y-3', !enabled && 'pointer-events-none opacity-60')}>
          {stageRows.map((stage) => {
            const draft = draftOf(stage);
            const savedUserIneligible =
              stage.userId && stage.userEligible === false && draft.userId === stage.userId;
            return (
              <div key={stage.stage} className="space-y-3 rounded-xl border border-border/70 bg-background p-3">
                <div>
                  <p className="text-sm font-semibold">{stage.labelAr}</p>
                  <p className="text-xs text-muted-foreground">{AUTO_ASSIGN_HINTS[draft.autoAssign]}</p>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="group" aria-label={`إسناد ${stage.labelAr}`}>
                  {(Object.keys(AUTO_ASSIGN_LABELS) as OrderStageAutoAssign[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={cn(
                        'rounded-lg border px-3 py-2 text-sm',
                        draft.autoAssign === key
                          ? 'border-primary bg-primary/10 font-semibold text-foreground'
                          : 'border-border text-muted-foreground',
                      )}
                      onClick={() =>
                        setStages((current) => ({
                          ...current,
                          [stage.stage]: { ...draft, autoAssign: key },
                        }))
                      }
                    >
                      {AUTO_ASSIGN_LABELS[key]}
                    </button>
                  ))}
                </div>
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
                {savedUserIneligible ? (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    {stage.userNameAr ?? 'المستخدم المحدد'} لم يعد يملك صلاحية هذه المرحلة.
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="ship" className="mt-0 space-y-3">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Truck className="mt-0.5 h-4 w-4 shrink-0" />
          <p>هذا الشرط يخص الانتقال إلى مرحلة «تم الشحن» فقط.</p>
        </div>
        <SwitchRow
          title="لا يُشحن الطلب المدفوع مسبقاً قبل تأكيد الدفع"
          description="التحويل البنكي والمحافظ والبطاقات تبقى حتى تصبح حالة الدفع «مدفوع». الدفع عند الاستلام لا يتأثر."
          checked={requirePayment}
          onChange={setRequirePayment}
        />
      </TabsContent>

      <div className="flex justify-end">
        <Button type="button" disabled={save.isPending || missingUser} onClick={submit}>
          حفظ الإعدادات
        </Button>
      </div>
    </Tabs>
  );
}

function DecisionLink({
  title,
  detail,
  onClick,
}: {
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-background px-3 py-2.5 text-start"
    >
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{detail}</span>
      </span>
      <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

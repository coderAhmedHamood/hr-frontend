'use client';

import * as React from 'react';
import { AlertTriangle, ArrowLeft, ShieldCheck, Trash2, Truck, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useOrderStageCandidates,
  useOrderStagesSettings,
  useSaveOrderStagesSettings,
} from '@/features/ecommerce/admin/orders/hooks/use-order-stages';
import {
  ORDER_STAGE_SCOPE_LABELS,
  type OrderStage,
  type OrderStageAutoAssign,
  type OrderStageScope,
  type OrderStageSettingView,
  type SaveOrderStagesSettingsInput,
} from '@/features/ecommerce/admin/orders/lib/api/order-stages';
import { cn } from '@/shared/utils';

const AUTO_ASSIGN_LABELS: Record<OrderStageAutoAssign, string> = {
  none: 'بدون إسناد',
  user: 'مستخدم محدد',
  balanced: 'توزيع تلقائي',
};

const AUTO_ASSIGN_HINTS: Record<OrderStageAutoAssign, string> = {
  none: 'يبقى الطلب في طابور المرحلة، ويستلمه أحد أعضائها.',
  user: 'يصل دائماً إلى العضو الذي تختاره.',
  balanced: 'يصل إلى العضو الذي لديه أقل طلبات مفتوحة.',
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

const SCOPE_HINTS: Record<OrderStageScope, string> = {
  assigned: 'يرى ويعمل على ما يُسند إليه فقط.',
  queue: 'يرى ما يُسند إليه، وطابور المرحلة غير المسند فيستلم منه.',
  all: 'يرى كل طلبات المرحلة، حتى المسندة لغيره.',
};

type MemberDraft = { userId: string; nameAr: string | null; scope: OrderStageScope; canOpenOrders: boolean };
type StageDraft = { autoAssign: OrderStageAutoAssign; userId: string | null; members: MemberDraft[] };
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
        query.data.stages.map((s) => [
          s.stage,
          { autoAssign: s.autoAssign, userId: s.userId, members: s.members.map((m) => ({ ...m })) },
        ]),
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
  function draftOf(stage: OrderStageSettingView): StageDraft {
    return stages[stage.stage] ?? { autoAssign: 'none', userId: null, members: [] };
  }
  const missingUser = stageRows.some((s) => {
    const draft = draftOf(s);
    return draft.autoAssign === 'user' && (!draft.userId || !draft.members.some((m) => m.userId === draft.userId));
  });
  const emptyStages = stageRows.filter((s) => draftOf(s).members.filter((m) => m.canOpenOrders).length === 0);
  const setDraft = (stage: OrderStage, patch: Partial<StageDraft>) =>
    setStages((current) => ({
      ...current,
      [stage]: { ...(current[stage] ?? { autoAssign: 'none', userId: null, members: [] }), ...patch },
    }));

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
          members: draft.members.map((m) => ({ userId: m.userId, scope: m.scope })),
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
                  <MembersBadge count={draft.members.length} />
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
          <DecisionLink title="من يعمل" detail="أعضاء كل مرحلة وما يرونه" onClick={() => setTab('access')} />
          <DecisionLink title="من يستلم" detail="إسناد الطلب عند دخوله" onClick={() => setTab('assign')} />
          <DecisionLink title="الشحن" detail="شرط الدفع قبل الخروج" onClick={() => setTab('ship')} />
        </div>
      </TabsContent>

      <TabsContent value="access" className="mt-0 space-y-3">
        <SwitchRow
          title="تفعيل التحكم بالمراحل"
          description="عند التفعيل لا ينقل الطلب إلا عضو مرحلته الحالية (أو من يملك صلاحية الإسناد). عند الإيقاف تكفي صلاحية تعديل الطلبات."
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
        <div className="space-y-3">
          {stageRows.map((stage, index) => (
            <StageMembersCard
              key={stage.stage}
              companyId={companyId}
              index={index}
              stage={stage}
              members={draftOf(stage).members}
              onChange={(members) => {
                const draft = draftOf(stage);
                // The rule's user leaves with them.
                const keepsUser = members.some((m) => m.userId === draft.userId);
                setDraft(stage.stage, {
                  members,
                  ...(keepsUser ? {} : { userId: null }),
                });
              }}
            />
          ))}
        </div>
        {enabled && emptyStages.length > 0 ? (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              لا أعضاء في مرحلة {emptyStages.map((s) => `«${s.labelAr}»`).join('، ')}. الطلب يتوقف هناك حتى
              تضيف لها أعضاء.
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
          هذه الصلاحيات تُمنح من شاشة الأدوار، وكذلك «العمل على مراحل الطلبات» التي يحتاجها العضو ليفتح الطلبات. من
          يملك «عرض طلبات المتجر» يرى كل الطلبات أيًا كان نطاقه.
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
                  draft.members.length === 0 ? (
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      أضف أعضاء لهذه المرحلة من تبويب «من يعمل» أولًا.
                    </p>
                  ) : (
                    <Select
                      value={draft.userId ?? ''}
                      onValueChange={(userId) => setDraft(stage.stage, { userId })}
                    >
                      <SelectTrigger aria-label={`مستخدم ${stage.labelAr}`} className="w-full">
                        <SelectValue placeholder="اختر العضو" />
                      </SelectTrigger>
                      <SelectContent>
                        {draft.members.map((m) => (
                          <SelectItem key={m.userId} value={m.userId}>
                            {m.nameAr ?? m.userId}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                ) : null}
                {savedUserIneligible ? (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    {stage.userNameAr ?? 'المستخدم المحدد'} لم يعد عضوًا يفتح الطلبات في هذه المرحلة.
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

function MembersBadge({ count }: { count: number }) {
  return <Badge variant={count === 0 ? 'warning' : 'subtle'}>{count === 0 ? 'لا أعضاء' : `${count} عضو`}</Badge>;
}

/**
 * One stage's members: several users per stage (a user may be in several
 * stages), each with what they see of it.
 */
function StageMembersCard({
  companyId,
  index,
  stage,
  members,
  onChange,
}: {
  companyId: string;
  index: number;
  stage: OrderStageSettingView;
  members: MemberDraft[];
  onChange: (members: MemberDraft[]) => void;
}) {
  const candidates = useOrderStageCandidates(companyId);
  const available = (candidates.data ?? []).filter((c) => !members.some((m) => m.userId === c.id));
  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">
            <span className="me-2 text-xs text-muted-foreground">{index + 1}</span>
            {stage.labelAr}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{STAGE_HINTS[stage.stage]}</p>
        </div>
        <MembersBadge count={members.length} />
      </div>
      {members.length > 0 ? (
        <ul className="space-y-2">
          {members.map((member) => (
            <li
              key={member.userId}
              className="flex flex-col gap-2 rounded-lg border border-border/60 p-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{member.nameAr ?? member.userId}</p>
                {!member.canOpenOrders ? (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    لا يملك «العمل على مراحل الطلبات» في أدواره، فلن يفتح الطلبات.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">{SCOPE_HINTS[member.scope]}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={member.scope}
                  onValueChange={(scope) =>
                    onChange(
                      members.map((m) =>
                        m.userId === member.userId ? { ...m, scope: scope as OrderStageScope } : m,
                      ),
                    )
                  }
                >
                  <SelectTrigger aria-label={`ما يراه ${member.nameAr ?? ''}`} className="h-9 w-full sm:w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ORDER_STAGE_SCOPE_LABELS) as OrderStageScope[]).map((scope) => (
                      <SelectItem key={scope} value={scope}>
                        {ORDER_STAGE_SCOPE_LABELS[scope]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  aria-label={`إزالة ${member.nameAr ?? ''} من المرحلة`}
                  onClick={() => onChange(members.filter((m) => m.userId !== member.userId))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">لا أعضاء بعد.</p>
      )}
      <Select
        value=""
        onValueChange={(userId) => {
          const user = available.find((c) => c.id === userId);
          if (!user) return;
          onChange([...members, { userId: user.id, nameAr: user.nameAr, scope: 'queue', canOpenOrders: true }]);
        }}
        disabled={candidates.isLoading || available.length === 0}
      >
        <SelectTrigger aria-label={`إضافة عضو إلى ${stage.labelAr}`} className="w-full">
          <span className="flex items-center gap-2 text-muted-foreground">
            <UserPlus className="h-4 w-4" />
            {candidates.isError
              ? 'تعذّر تحميل المستخدمين'
              : available.length === 0 && !candidates.isLoading
                ? 'لا مستخدمين آخرين يملكون «العمل على مراحل الطلبات»'
                : 'إضافة عضو'}
          </span>
        </SelectTrigger>
        <SelectContent>
          {available.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.nameAr}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

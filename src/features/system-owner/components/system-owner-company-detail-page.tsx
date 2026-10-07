'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { systemOwnerRoutes } from '@/features/system-owner/constants/routes';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import {
  useSystemOwnerCompany,
  useSystemOwnerCompanyApplications,
  useSystemOwnerCompanyUsers,
  useSystemOwnerMutations,
  useSystemOwnerSuperusers,
} from '@/features/system-owner/hooks/use-system-owner';
import {
  systemOwnerApi,
  type CompanyDataKind,
  type CompanyDataRun,
  type SystemOwnerCompanyApplication,
} from '@/features/system-owner/lib/api/system-owner';
import { ApiError } from '@/shared/api/client';
import { cn } from '@/shared/utils';

type TabId = 'apps' | 'data' | 'users' | 'superusers';

export function SystemOwnerCompanyDetailPage() {
  const params = useParams<{ companyId: string }>();
  const companyId = params.companyId;
  const [tab, setTab] = React.useState<TabId>('apps');
  const companyQuery = useSystemOwnerCompany(companyId);
  const company = companyQuery.data;

  return (
    <div className="flex flex-col gap-4">
      <SetPageTitle
        titleAr={company?.nameAr ?? 'تفاصيل الشركة'}
        descriptionAr="تفعيل التطبيقات وتعيين صاحب الشركة المخوّل"
        iconName="Building2"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={systemOwnerRoutes.overview}>العودة للشركات</Link>
        </Button>
        {company?.code ? (
          <span className="text-xs text-muted-foreground" dir="ltr">
            {company.code}
          </span>
        ) : null}
      </div>

      {companyQuery.isError ? (
        <p className="text-sm text-destructive">تعذر تحميل الشركة.</p>
      ) : (
        <>
          <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1">
            {(
              [
                ['apps', 'التطبيقات'],
                ['data', 'البيانات الافتراضية'],
                ['users', 'المستخدمون'],
                ['superusers', 'Superusers'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  'flex-1 rounded-lg px-3 py-1.5 text-sm transition-colors',
                  tab === id ? 'bg-card font-medium shadow-sm' : 'text-muted-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'apps' ? <CompanyAppsTab companyId={companyId} /> : null}
          {tab === 'data' ? <CompanyDataTab companyId={companyId} /> : null}
          {tab === 'users' ? <CompanyUsersTab companyId={companyId} /> : null}
          {tab === 'superusers' ? <CompanySuperusersTab companyId={companyId} /> : null}
        </>
      )}
    </div>
  );
}

function CompanyAppsTab({ companyId }: { companyId: string }) {
  const { data, isLoading, isError } = useSystemOwnerCompanyApplications(companyId);
  const { patchCompanyApplication } = useSystemOwnerMutations();
  const queryClient = useQueryClient();
  /** The app whose switch was turned on while some of what it needs is off. */
  const [needsFirst, setNeedsFirst] = React.useState<SystemOwnerCompanyApplication | null>(null);
  const [enablingChain, setEnablingChain] = React.useState(false);

  const apps = data ?? [];
  const byCode = new Map(apps.map((a) => [a.code, a]));
  const nameOf = (code: string) => byCode.get(code)?.nameAr || code;
  const names = (codes: string[]) => codes.map((c) => `«${nameOf(c)}»`).join('، ');

  /** Enables what the app needs (in order), then the app; stops at the first refusal. */
  async function enableWithRequirements(app: SystemOwnerCompanyApplication) {
    setEnablingChain(true);
    const chain = [...app.missingDependencies, app.code];
    let done = 0;
    try {
      for (const code of chain) {
        const target = byCode.get(code);
        if (!target) throw new Error(`التطبيق ${code} غير موجود في قائمة الشركة`);
        await systemOwnerApi.patchCompanyApplication(companyId, target.applicationId || target.id, {
          isEnabled: true,
        });
        done += 1;
      }
      toast.success(`تم تفعيل ${names(chain)}`);
      setNeedsFirst(null);
    } catch (err) {
      // The API client already showed the reason; say how far it got.
      if (done > 0) toast.message(`فُعّل: ${names(chain.slice(0, done))}. توقّف عند «${nameOf(chain[done])}».`);
      if (!(err instanceof ApiError)) toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setEnablingChain(false);
      void queryClient.invalidateQueries({ queryKey: ['system-owner'] });
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">جاري التحميل…</p>;
  if (isError) return <p className="text-sm text-destructive">تعذر تحميل التطبيقات.</p>;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        «تفعيل» يتحكم بالترخيص والصلاحيات. «إظهار» يتحكم بظهور التطبيق في مشغّل الموظفين. تطبيق
        النظام وتطبيقات الشركة لا يمكن تعطيلهما، لكن يمكن إخفاؤهما من المشغّل. التطبيق لا يُفعَّل قبل
        ما يعتمد عليه، ولا يُعطَّل وتطبيق مفعّل يعتمد عليه.
      </p>
      {apps.map((app) => {
        const enableLocked = app.isAlwaysEnabled;
        const applicationId = app.applicationId || app.id;
        const pending = patchCompanyApplication.isPending || enablingChain;
        const missing = app.isEnabled ? [] : app.missingDependencies;
        const dependents = app.isEnabled ? app.enabledDependents : [];

        return (
          <div
            key={app.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{app.nameAr}</p>
                {!app.isVisible && app.isEnabled ? (
                  <Badge variant="secondary" className="text-[10px]">
                    مخفي من المشغّل
                  </Badge>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground" dir="ltr">
                {app.code}
              </p>
              {app.dependsOn.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  يعتمد على: {names(app.dependsOn)}
                </p>
              ) : null}
              {missing.length > 0 ? (
                <p className="text-xs text-warning">
                  يتطلب تفعيل {names(missing)} أولاً.
                </p>
              ) : null}
              {dependents.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  تعتمد عليه: {names(dependents)} — لا يُعطَّل قبلها.
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Switch
                  checked={app.isEnabled || enableLocked}
                  disabled={enableLocked || pending}
                  onCheckedChange={(checked) => {
                    if (checked && missing.length > 0) {
                      setNeedsFirst(app);
                      return;
                    }
                    if (!checked && dependents.length > 0) {
                      toast.error(
                        `لا يمكن تعطيل «${app.nameAr}»: ${dependents.length > 1 ? 'هذه التطبيقات المفعّلة تعتمد عليه' : 'هذا التطبيق المفعّل يعتمد عليه'}: ${names(dependents)}. عطّلها أولاً.`,
                      );
                      return;
                    }
                    patchCompanyApplication.mutate({
                      companyId,
                      applicationId,
                      payload: { isEnabled: checked },
                    });
                  }}
                  aria-label={`تفعيل ${app.nameAr}`}
                />
                تفعيل
              </label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Switch
                  checked={app.isVisible}
                  disabled={!app.isEnabled || pending}
                  onCheckedChange={(checked) =>
                    patchCompanyApplication.mutate({
                      companyId,
                      applicationId,
                      payload: { isVisible: checked },
                    })
                  }
                  aria-label={`إظهار ${app.nameAr} في المشغّل`}
                />
                إظهار
              </label>
            </div>
          </div>
        );
      })}
      {apps.length === 0 ? (
        <p className="text-sm text-muted-foreground">لا توجد تطبيقات في الكتالوج.</p>
      ) : null}

      <Dialog open={needsFirst !== null} onOpenChange={(open) => (!open && !enablingChain ? setNeedsFirst(null) : undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تفعيل «{needsFirst?.nameAr}» يتطلب تطبيقات أخرى</DialogTitle>
            <DialogDescription>
              «{needsFirst?.nameAr}» يعتمد على تطبيقات غير مفعّلة لهذه الشركة. تُفعَّل بهذا الترتيب ثم يُفعَّل هو:
            </DialogDescription>
          </DialogHeader>
          <ol className="list-decimal space-y-1 ps-5 text-sm">
            {(needsFirst?.missingDependencies ?? []).map((code) => (
              <li key={code}>{nameOf(code)}</li>
            ))}
            <li className="font-medium">{needsFirst?.nameAr}</li>
          </ol>
          <DialogFooter className="gap-2">
            <Button variant="outline" disabled={enablingChain} onClick={() => setNeedsFirst(null)}>
              إلغاء
            </Button>
            <Button disabled={enablingChain} onClick={() => needsFirst && void enableWithRequirements(needsFirst)}>
              {enablingChain ? 'جارٍ التفعيل…' : 'تفعيل مع المتطلبات'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const COMPANY_DATA_CARDS: Array<{
  kind: CompanyDataKind;
  title: string;
  description: string;
  action: string;
  warning?: string;
}> = [
  {
    kind: 'starter',
    title: 'بيانات تأسيسية',
    description:
      'إعدادات بداية حقيقية للتطبيقات المفعّلة: المسميات الوظيفية، أنواع الإجازات والطلبات، تصنيفات جهات الاتصال، التصنيفات ووحدات القياس وخصائص المنتجات، والمستودع الرئيسي ومواقعه. آمنة لشركة عميل.',
    action: 'إنشاء البيانات التأسيسية',
  },
  {
    kind: 'demo',
    title: 'بيانات تجريبية',
    description:
      'منتجات تجريبية ومتغيراتها وعرضها في المتجر، مع البيانات التأسيسية. للعرض والتجربة.',
    action: 'إنشاء البيانات التجريبية',
    warning: 'لا تُنشئها لشركة عميل حقيقية: ستظهر المنتجات التجريبية في الكتالوج والمتجر.',
  },
];

function CompanyDataTab({ companyId }: { companyId: string }) {
  const { data: apps } = useSystemOwnerCompanyApplications(companyId);
  const names = new Map((apps ?? []).map((a) => [a.code, a.nameAr]));
  const appName = (code: string) => names.get(code) || code;
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        تُنشأ لهذه الشركة فقط، وللتطبيقات المفعّلة لها فقط. لا يتغير شيء موجود: ما أنشأته الشركة أو عدّلته يبقى
        كما هو، لذلك يمكن الضغط مرة أخرى بعد تفعيل تطبيق جديد. اعرض المعاينة أولاً لترى ما سيُنشأ.
      </p>
      {COMPANY_DATA_CARDS.map((card) => (
        <CompanyDataCard key={card.kind} companyId={companyId} card={card} appName={appName} />
      ))}
    </div>
  );
}

function CompanyDataCard({
  companyId,
  card,
  appName,
}: {
  companyId: string;
  card: (typeof COMPANY_DATA_CARDS)[number];
  appName: (code: string) => string;
}) {
  const [run, setRun] = React.useState<CompanyDataRun | null>(null);
  const [confirming, setConfirming] = React.useState(false);
  const preview = useMutation({
    mutationFn: () => systemOwnerApi.previewCompanyData(companyId, card.kind),
    onSuccess: setRun,
  });
  const apply = useMutation({
    mutationFn: () => systemOwnerApi.applyCompanyData(companyId, card.kind),
    onSuccess: (result) => {
      setRun(result);
      setConfirming(false);
      toast.success(
        result.totals.created > 0 ? `أُنشئ ${result.totals.created} سجل` : 'لا جديد: كل البيانات موجودة مسبقاً',
      );
    },
  });
  const busy = preview.isPending || apply.isPending;

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{card.title}</h3>
        <p className="text-xs text-muted-foreground">{card.description}</p>
        {card.warning ? <p className="text-xs text-warning">{card.warning}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={busy} onClick={() => preview.mutate()}>
          {preview.isPending ? 'جارٍ الحساب…' : 'معاينة'}
        </Button>
        <Button size="sm" disabled={busy} onClick={() => setConfirming(true)}>
          {card.action}
        </Button>
      </div>
      {run ? <CompanyDataResult run={run} appName={appName} /> : null}

      <Dialog open={confirming} onOpenChange={(open) => (!apply.isPending ? setConfirming(open) : undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{card.action}</DialogTitle>
            <DialogDescription>
              تُنشأ البيانات الناقصة فقط، ولا يتغير شيء موجود. {card.warning ?? ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" disabled={apply.isPending} onClick={() => setConfirming(false)}>
              إلغاء
            </Button>
            <Button disabled={apply.isPending} onClick={() => apply.mutate()}>
              {apply.isPending ? 'جارٍ الإنشاء…' : 'إنشاء'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function CompanyDataResult({ run, appName }: { run: CompanyDataRun; appName: (code: string) => string }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium">
        {run.applied ? 'النتيجة' : 'المعاينة (لم يُكتب شيء)'}: {run.applied ? 'أُنشئ' : 'سيُنشأ'} {run.totals.created}، موجود
        مسبقاً {run.totals.skipped}
      </p>
      <div className="overflow-x-auto rounded-xl border border-border/70">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-start font-medium">البيانات</th>
              <th className="px-3 py-2 text-start font-medium">{run.applied ? 'أُنشئ' : 'سيُنشأ'}</th>
              <th className="px-3 py-2 text-start font-medium">موجود مسبقاً</th>
            </tr>
          </thead>
          <tbody>
            {run.sets.map((set) => (
              <tr key={set.code} className="border-t border-border/60">
                <td className="px-3 py-2">
                  {set.labelAr}
                  {set.missingApps.length > 0 ? (
                    <span className="ms-2 text-xs text-muted-foreground">
                      (لم يُنفَّذ: يتطلب تفعيل {set.missingApps.map((c) => `«${appName(c)}»`).join('، ')})
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2 tabular-nums">{set.missingApps.length > 0 ? '—' : set.created}</td>
                <td className="px-3 py-2 tabular-nums">{set.missingApps.length > 0 ? '—' : set.skipped}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompanyUsersTab({ companyId }: { companyId: string }) {
  const currentUser = useAuthStore((s) => s.user);
  const { data, isLoading, isError } = useSystemOwnerCompanyUsers(companyId);
  const { createCompanyUser } = useSystemOwnerMutations();
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [fullNameAr, setFullNameAr] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [assignSuperuser, setAssignSuperuser] = React.useState(true);

  function resetForm() {
    setEmail('');
    setFullNameAr('');
    setPassword('');
    setAssignSuperuser(true);
  }

  const canSubmit = email.trim() && fullNameAr.trim() && password.trim();
  const ownEmail = (currentUser?.email ?? '').trim().toLowerCase();
  const isOwnAccount = Boolean(ownEmail) && email.trim().toLowerCase() === ownEmail;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          أنشئ صاحب الشركة ببريد مختلف عن مالك النظام. بعد الدخول يدير المستخدمين والأدوار والصلاحيات بنفسه.
        </p>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          إضافة مستخدم
        </Button>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">جاري التحميل…</p> : null}
      {isError ? <p className="text-sm text-destructive">تعذر تحميل المستخدمين.</p> : null}

      {(data ?? []).map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
        >
          <div>
            <p className="text-sm font-medium">{user.fullNameAr || user.email || user.id.slice(0, 8)}</p>
            <p className="text-xs text-muted-foreground" dir="ltr">
              {user.email}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {user.isCompanySuperuser ? <Badge variant="gold">صاحب الشركة</Badge> : null}
            <Badge variant={user.isActive === false ? 'subtle' : 'success'}>
              {user.isActive === false ? 'غير نشط' : 'نشط'}
            </Badge>
          </div>
        </div>
      ))}
      {!isLoading && (data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">لا يوجد مستخدمون مرتبطون بالشركة.</p>
      ) : null}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة مستخدم للشركة</DialogTitle>
            <DialogDescription>
              يُنشأ المستخدم ويُربط بالشركة. إذا اخترت صاحب الشركة يصبح مخوّلاً بإدارة المستخدمين والأدوار والصلاحيات والتطبيقات المفعّلة.
            </DialogDescription>
          </DialogHeader>
          <div className="so-user-dialog-form space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="so-user-name">الاسم</Label>
              <Input
                id="so-user-name"
                value={fullNameAr}
                onChange={(e) => setFullNameAr(e.target.value)}
                placeholder="محمد العلي"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="so-user-email">البريد</Label>
              <Input
                id="so-user-email"
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@acme.com"
              />
              {isOwnAccount ? (
                <p className="text-xs text-destructive">
                  هذا بريد مالك النظام. أنشئ مستخدماً ببريد مختلف ليصبح صاحب الشركة.
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="so-user-password">كلمة المرور</Label>
              <Input
                id="so-user-password"
                type="password"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Str0ngP@ssw0rd!"
              />
            </div>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
              <span className="min-w-0">
                <span className="block text-sm">تعيين صاحب الشركة (Superuser)</span>
                <span className="block text-[11px] text-muted-foreground">
                  يخوّله بإدارة المستخدمين والأدوار والصلاحيات وكل تطبيق مفعّل على شركته.
                </span>
              </span>
              <Switch checked={assignSuperuser} onCheckedChange={setAssignSuperuser} />
            </label>
          </div>
          <DialogFooter>
            <Button
              disabled={!canSubmit || isOwnAccount || createCompanyUser.isPending}
              onClick={() =>
                createCompanyUser.mutate(
                  {
                    companyId,
                    payload: {
                      email: email.trim(),
                      fullNameAr: fullNameAr.trim(),
                      password,
                      assignSuperuser,
                    },
                  },
                  {
                    onSuccess: () => {
                      setOpen(false);
                      resetForm();
                    },
                  },
                )
              }
            >
              إنشاء
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CompanySuperusersTab({ companyId }: { companyId: string }) {
  const usersQuery = useSystemOwnerCompanyUsers(companyId);
  const superusersQuery = useSystemOwnerSuperusers(companyId);
  const { assignSuperuser, setSuperuserActive } = useSystemOwnerMutations();
  const [userId, setUserId] = React.useState('');
  const [notes, setNotes] = React.useState('');

  const assignedIds = new Set((superusersQuery.data ?? []).map((s) => s.userId));
  const availableUsers = (usersQuery.data ?? []).filter((u) => {
    if (assignedIds.has(u.id)) return false;
    if ((u.userType ?? '').toLowerCase() === 'platform_admin') return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-medium">تعيين Superuser</p>
        <p className="text-xs text-muted-foreground">
          مالك النظام لا يُعيَّن Superuser. صاحب الشركة المخوّل يدير المستخدمين والأدوار والصلاحيات والتطبيقات المفعّلة بعد دخوله.
        </p>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="space-y-1.5">
            <Label>المستخدم</Label>
            <Select value={userId || '_none'} onValueChange={(v) => setUserId(v === '_none' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر مستخدماً مربوطاً بالشركة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">— اختر —</SelectItem>
                {availableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.fullNameAr || user.email || user.id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>ملاحظة</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="أساسي" />
          </div>
        </div>
        <Button
          disabled={!userId || assignSuperuser.isPending}
          onClick={() =>
            assignSuperuser.mutate(
              { companyId, userId, notes: notes.trim() || undefined },
              {
                onSuccess: () => {
                  setUserId('');
                  setNotes('');
                },
              },
            )
          }
        >
          تعيين
        </Button>
      </div>

      {(superusersQuery.data ?? []).map((row) => (
        <div
          key={row.userId}
          className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
        >
          <div>
            <p className="text-sm font-medium">{row.fullNameAr || row.email || row.userId.slice(0, 8)}</p>
            <p className="text-xs text-muted-foreground" dir="ltr">
              {row.email}
              {row.notes ? ` · ${row.notes}` : ''}
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>نشط</span>
            <Switch
              checked={row.isActive}
              disabled={setSuperuserActive.isPending}
              onCheckedChange={(checked) =>
                setSuperuserActive.mutate({
                  companyId,
                  userId: row.userId,
                  isActive: checked,
                })
              }
            />
          </label>
        </div>
      ))}
      {(superusersQuery.data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">لم يُعيَّن Superuser بعد.</p>
      ) : null}
    </div>
  );
}

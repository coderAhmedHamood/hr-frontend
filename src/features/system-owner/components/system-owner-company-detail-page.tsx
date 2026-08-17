'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Plus, Shield } from 'lucide-react';
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
import { CompanyUserRolePicker } from '@/features/system-owner/components/company-user-role-picker';
import {
  useSystemOwnerCompany,
  useSystemOwnerCompanyApplications,
  useSystemOwnerCompanyRoles,
  useSystemOwnerCompanyUsers,
  useSystemOwnerMutations,
  useSystemOwnerSuperusers,
  useSystemOwnerUserRoles,
} from '@/features/system-owner/hooks/use-system-owner';
import type { SystemOwnerCompanyUser } from '@/features/system-owner/lib/api/system-owner';
import { cn } from '@/shared/utils';

type TabId = 'apps' | 'users' | 'superusers';

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
        descriptionAr="تفعيل التطبيقات وتعيين Superusers"
        iconName="Building2"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={systemOwnerRoutes.companies}>العودة للشركات</Link>
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
          {tab === 'users' ? <CompanyUsersTab companyId={companyId} /> : null}
          {tab === 'superusers' ? <CompanySuperusersTab companyId={companyId} /> : null}
        </>
      )}
    </div>
  );
}

function CompanyAppsTab({ companyId }: { companyId: string }) {
  const { data, isLoading, isError } = useSystemOwnerCompanyApplications(companyId);
  const { setApplicationEnabled } = useSystemOwnerMutations();

  if (isLoading) return <p className="text-sm text-muted-foreground">جاري التحميل…</p>;
  if (isError) return <p className="text-sm text-destructive">تعذر تحميل التطبيقات.</p>;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">لا يمكن تعطيل تطبيق النظام.</p>
      {(data ?? []).map((app) => {
        const locked = app.code.toLowerCase() === 'system';
        return (
          <div
            key={app.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium">{app.nameAr}</p>
              <p className="text-xs text-muted-foreground" dir="ltr">
                {app.code}
              </p>
            </div>
            <Switch
              checked={app.isEnabled || locked}
              disabled={locked || setApplicationEnabled.isPending}
              onCheckedChange={(checked) =>
                setApplicationEnabled.mutate({
                  companyId,
                  applicationId: app.applicationId || app.id,
                  isEnabled: checked,
                })
              }
              aria-label={`تفعيل ${app.nameAr}`}
            />
          </div>
        );
      })}
      {(data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">لا توجد تطبيقات في الكتالوج.</p>
      ) : null}
    </div>
  );
}

function CompanyUsersTab({ companyId }: { companyId: string }) {
  const { data, isLoading, isError } = useSystemOwnerCompanyUsers(companyId);
  const { createCompanyUser } = useSystemOwnerMutations();
  const [open, setOpen] = React.useState(false);
  const [rolesUser, setRolesUser] = React.useState<SystemOwnerCompanyUser | null>(null);
  const appsQuery = useSystemOwnerCompanyApplications(companyId);
  const rolesQuery = useSystemOwnerCompanyRoles(companyId, open || Boolean(rolesUser));
  const [email, setEmail] = React.useState('');
  const [fullNameAr, setFullNameAr] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [assignSuperuser, setAssignSuperuser] = React.useState(true);
  const [grantFullAccess, setGrantFullAccess] = React.useState(true);
  const [roleIds, setRoleIds] = React.useState<string[]>([]);

  const defaultRoleIds = React.useMemo(
    () => (rolesQuery.data?.items ?? []).filter((role) => role.isDefault).map((role) => role.id),
    [rolesQuery.data?.items],
  );

  function resetForm() {
    setEmail('');
    setFullNameAr('');
    setPassword('');
    setAssignSuperuser(true);
    setGrantFullAccess(true);
    setRoleIds(defaultRoleIds);
  }

  React.useEffect(() => {
    if (open && roleIds.length === 0 && defaultRoleIds.length > 0 && !grantFullAccess) {
      setRoleIds(defaultRoleIds);
    }
  }, [open, defaultRoleIds, grantFullAccess, roleIds.length]);

  const canSubmit = email.trim() && fullNameAr.trim() && password.trim();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          أنشئ مستخدم شركة عادي هنا. حساب مالك النظام لا يُضاف لهذه الشركة.
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
            <Button variant="outline" size="sm" onClick={() => setRolesUser(user)}>
              <Shield className="h-3.5 w-3.5" />
              الأدوار
            </Button>
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
              يُنشأ المستخدم ويُربط بالشركة ويُفعَّل فوراً. الصلاحيات تُسند عبر الأدوار أو بمنح صلاحيات التطبيقات المفعّلة.
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
              <span className="text-sm">تعيين صاحب الشركة (Superuser)</span>
              <Switch
                checked={assignSuperuser}
                onCheckedChange={(checked) => {
                  setAssignSuperuser(checked);
                  if (checked) setGrantFullAccess(true);
                }}
              />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
              <span className="min-w-0">
                <span className="block text-sm">منح صلاحيات التطبيقات المفعّلة</span>
                <span className="block text-[11px] text-muted-foreground">
                  يُنشئ أدواراً بصلاحيات كاملة لكل تطبيق مفعّل على هذه الشركة ثم يسندها للمستخدم.
                </span>
              </span>
              <Switch checked={grantFullAccess} onCheckedChange={setGrantFullAccess} />
            </label>
            {!grantFullAccess ? (
              <div className="space-y-1.5">
                <Label>الأدوار</Label>
                <CompanyUserRolePicker
                  roles={rolesQuery.data?.items ?? []}
                  applications={appsQuery.data}
                  selectedIds={roleIds}
                  onChange={setRoleIds}
                  isLoading={rolesQuery.isLoading}
                  emptyHint="لا توجد أدوار لهذه الشركة. فعّل منح صلاحيات التطبيقات المفعّلة أو أنشئ أدواراً لاحقاً."
                />
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              disabled={!canSubmit || createCompanyUser.isPending}
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
                    roleIds: grantFullAccess ? [] : roleIds,
                    grantFullAccess,
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

      <AssignCompanyUserRolesDialog
        companyId={companyId}
        user={rolesUser}
        onClose={() => setRolesUser(null)}
      />
    </div>
  );
}

function AssignCompanyUserRolesDialog({
  companyId,
  user,
  onClose,
}: {
  companyId: string;
  user: SystemOwnerCompanyUser | null;
  onClose: () => void;
}) {
  const appsQuery = useSystemOwnerCompanyApplications(companyId);
  const rolesQuery = useSystemOwnerCompanyRoles(companyId, Boolean(user));
  const assignedQuery = useSystemOwnerUserRoles(user?.id ?? null, companyId, Boolean(user));
  const { syncCompanyUserRoles } = useSystemOwnerMutations();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!user) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds((assignedQuery.data ?? []).map((row) => row.roleId));
  }, [user, assignedQuery.data]);

  return (
    <Dialog open={Boolean(user)} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>أدوار المستخدم</DialogTitle>
          <DialogDescription>
            {user?.fullNameAr || user?.email || 'اختر الأدوار التي تمنح صلاحيات التطبيقات المفعّلة.'}
          </DialogDescription>
        </DialogHeader>
        <CompanyUserRolePicker
          roles={rolesQuery.data?.items ?? []}
          applications={appsQuery.data}
          selectedIds={selectedIds}
          onChange={setSelectedIds}
          isLoading={rolesQuery.isLoading || assignedQuery.isLoading}
          emptyHint="لا توجد أدوار لهذه الشركة بعد. أنشئ المستخدم بصلاحيات التطبيقات المفعّلة أو أضف أدواراً من تطبيق النظام."
        />
        <DialogFooter>
          <Button
            disabled={!user || syncCompanyUserRoles.isPending}
            onClick={() => {
              if (!user) return;
              syncCompanyUserRoles.mutate(
                { companyId, userId: user.id, roleIds: selectedIds },
                { onSuccess: onClose },
              );
            }}
          >
            حفظ الأدوار
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
          مالك النظام لا يُعيَّن Superuser. اختر مستخدم شركة عادي مربوطاً بهذه الشركة أولاً.
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

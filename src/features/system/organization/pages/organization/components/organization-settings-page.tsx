'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Check, Loader2, Mail, Server, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/shared/utils';
import { useActiveCompany } from '@/features/hr/organization/hooks/useActiveCompany';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { ORGANIZATION_USER_NOTIFICATION_ITEMS } from '@/features/system/organization/pages/_shared/constants/notification-groups';
import { NotificationToggleList } from '@/features/system/organization/pages/_shared/components/notification-toggles-card';
import { SettingsCompanyBanner } from '@/features/system/organization/pages/_shared/components/settings-company-banner';
import {
  SettingsPageEmpty,
  SettingsPageError,
  SettingsPageLoading,
} from '@/features/system/organization/pages/_shared/components/settings-page-states';
import { useOrganizationCompanySettings } from '@/features/system/organization/pages/organization/hooks/useOrganizationSettings';
import { DatabaseBackupSection } from '@/features/system/organization/pages/organization/components/database-backup-section';
import type {
  OrganizationCompanySettings,
  UpdateOrganizationCompanySettingsDto,
} from '@/features/system/organization/pages/_shared/types/settings';

type OrgFormState = {
  emailEnabled: boolean;
  smtpHost: string;
  smtpPort: string;
  smtpSecure: boolean;
  smtpUsername: string;
  smtpPassword: string;
  smtpFromEmail: string;
  smtpFromName: string;
  notifyUserCreated: boolean;
  notifyUserAssignedToCompany: boolean;
  notifyUserAssignedToBranch: boolean;
};

function toFormState(data: OrganizationCompanySettings): OrgFormState {
  return {
    emailEnabled: data.emailEnabled,
    smtpHost: data.smtpHost ?? '',
    smtpPort: data.smtpPort != null ? String(data.smtpPort) : '',
    smtpSecure: data.smtpSecure,
    smtpUsername: data.smtpUsername ?? '',
    smtpPassword: '',
    smtpFromEmail: data.smtpFromEmail ?? '',
    smtpFromName: data.smtpFromName ?? '',
    notifyUserCreated: data.notifyUserCreated,
    notifyUserAssignedToCompany: data.notifyUserAssignedToCompany,
    notifyUserAssignedToBranch: data.notifyUserAssignedToBranch,
  };
}

function FormField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export default function OrganizationSettingsPage() {
  const { data: company } = useActiveCompany();
  const { data: settings, isLoading, isError, error, update, companyId } = useOrganizationCompanySettings();
  const [form, setForm] = React.useState<OrgFormState | null>(null);
  const [activeTab, setActiveTab] = React.useState('smtp');

  React.useEffect(() => {
    if (settings) setForm(toFormState(settings));
  }, [settings]);

  const patch = (partial: Partial<OrgFormState>) => {
    setForm((prev) => (prev ? { ...prev, ...partial } : prev));
  };

  const handleSave = async () => {
    if (!form) return;
    const dto: UpdateOrganizationCompanySettingsDto = {
      emailEnabled: form.emailEnabled,
      smtpHost: form.smtpHost.trim() || null,
      smtpPort: form.smtpPort.trim() ? Number(form.smtpPort) : null,
      smtpSecure: form.smtpSecure,
      smtpUsername: form.smtpUsername.trim() || null,
      smtpFromEmail: form.smtpFromEmail.trim() || null,
      smtpFromName: form.smtpFromName.trim() || null,
      notifyUserCreated: form.notifyUserCreated,
      notifyUserAssignedToCompany: form.notifyUserAssignedToCompany,
      notifyUserAssignedToBranch: form.notifyUserAssignedToBranch,
    };
    if (form.smtpPassword.trim()) {
      dto.smtpPassword = form.smtpPassword;
    }

    try {
      await update.mutateAsync(dto);
      toast.success('تم حفظ إعدادات المنظمة');
      setForm((prev) => (prev ? { ...prev, smtpPassword: '' } : prev));
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'settings.organization.update');
      toast.error(displayMessage);
    }
  };

  if (!companyId) {
    return <SettingsPageEmpty message="لا توجد شركة افتراضية — سجّل الدخول أو اختر شركة." />;
  }

  if (isLoading || !form) {
    return <SettingsPageLoading />;
  }

  if (isError || !settings) {
    const { displayMessage } = handleApiError(error, 'settings.organization.get');
    return <SettingsPageError message={displayMessage} />;
  }

  const userNotifEnabled = ORGANIZATION_USER_NOTIFICATION_ITEMS.filter((i) => form[i.key]).length;
  const smtpDisabled = !form.emailEnabled;

  return (
    <div className="space-y-4 sm:space-y-5">
      <DatabaseBackupSection />
      <SettingsCompanyBanner
        eyebrow="النظام"
        icon={Server}
        companyName={company?.nameAr ?? 'إعدادات النظام'}
        description="اضبط خادم البريد وإشعارات المستخدمين ثم احفظ التغييرات."
      />

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="space-y-5 p-4 sm:p-5">
          <div
            className={cn(
              'flex items-center justify-between gap-4 rounded-xl border px-4 py-3.5 transition-colors',
              form.emailEnabled
                ? 'border-primary/25 bg-primary/[0.04]'
                : 'border-border/70 bg-muted/10',
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">تفعيل البريد الإلكتروني</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">مطلوب لإرسال الإشعارات عبر SMTP</p>
              </div>
            </div>
            <Switch checked={form.emailEnabled} onCheckedChange={(v) => patch({ emailEnabled: v })} />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl" className="w-full">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-muted/40 p-1">
              <TabsTrigger
                value="smtp"
                className="gap-1.5 rounded-lg px-3 py-1.5 text-xs data-[state=active]:bg-card data-[state=active]:shadow-soft sm:text-sm"
              >
                <Mail className="h-3.5 w-3.5" />
                البريد (SMTP)
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="gap-1.5 rounded-lg px-3 py-1.5 text-xs data-[state=active]:bg-card data-[state=active]:shadow-soft sm:text-sm"
              >
                <Users className="h-3.5 w-3.5" />
                إشعارات المستخدمين
                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-primary">
                  {userNotifEnabled}/{ORGANIZATION_USER_NOTIFICATION_ITEMS.length}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="smtp" className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="خادم SMTP">
                  <Input
                    dir="ltr"
                    value={form.smtpHost}
                    onChange={(e) => patch({ smtpHost: e.target.value })}
                    placeholder="smtp.example.com"
                    disabled={smtpDisabled}
                    className="h-9"
                  />
                </FormField>
                <FormField label="المنفذ">
                  <Input
                    dir="ltr"
                    type="number"
                    value={form.smtpPort}
                    onChange={(e) => patch({ smtpPort: e.target.value })}
                    placeholder="587"
                    disabled={smtpDisabled}
                    className="h-9"
                  />
                </FormField>
                <FormField label="اسم المستخدم">
                  <Input
                    dir="ltr"
                    value={form.smtpUsername}
                    onChange={(e) => patch({ smtpUsername: e.target.value })}
                    disabled={smtpDisabled}
                    className="h-9"
                  />
                </FormField>
                <FormField label="كلمة المرور">
                  <Input
                    dir="ltr"
                    type="password"
                    value={form.smtpPassword}
                    onChange={(e) => patch({ smtpPassword: e.target.value })}
                    placeholder={settings.smtpPasswordConfigured ? 'مُعَدّة — اتركها فارغة للإبقاء' : 'كلمة مرور SMTP'}
                    disabled={smtpDisabled}
                    className="h-9"
                  />
                </FormField>
                <FormField label="البريد المرسل (From)">
                  <Input
                    dir="ltr"
                    type="email"
                    value={form.smtpFromEmail}
                    onChange={(e) => patch({ smtpFromEmail: e.target.value })}
                    disabled={smtpDisabled}
                    className="h-9"
                  />
                </FormField>
                <FormField label="اسم المرسل">
                  <Input
                    value={form.smtpFromName}
                    onChange={(e) => patch({ smtpFromName: e.target.value })}
                    disabled={smtpDisabled}
                    className="h-9"
                  />
                </FormField>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-card px-4 py-3 shadow-soft">
                <p className="text-sm font-medium">اتصال آمن (TLS/SSL)</p>
                <Switch
                  checked={form.smtpSecure}
                  onCheckedChange={(v) => patch({ smtpSecure: v })}
                  disabled={smtpDisabled}
                />
              </div>
            </TabsContent>

            <TabsContent value="users" className="mt-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                إشعارات متعلقة بإنشاء المستخدمين وإسنادهم للشركات والفروع.
              </p>
              <NotificationToggleList
                items={ORGANIZATION_USER_NOTIFICATION_ITEMS}
                values={{
                  notifyUserCreated: form.notifyUserCreated,
                  notifyUserAssignedToCompany: form.notifyUserAssignedToCompany,
                  notifyUserAssignedToBranch: form.notifyUserAssignedToBranch,
                }}
                disabled={smtpDisabled}
                onToggle={(key, value) => patch({ [key]: value } as Partial<OrgFormState>)}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-start border-t border-border/80 bg-muted/10 px-4 py-3 sm:px-5">
          <Button variant="luxe" className="gap-2" onClick={() => void handleSave()} disabled={update.isPending}>
            {update.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري الحفظ…
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                حفظ الإعدادات
              </>
            )}
          </Button>
        </div>
      </section>
    </div>
  );
}

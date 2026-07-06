'use client';

import { Building2, Plus, Star, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { companyLinkLabel } from '@/features/system/organization/contacts/constants/users-directory';
import type { UserDetailModel } from '@/features/system/organization/contacts/hooks/useUserDetailModel';

type Props = {
  model: UserDetailModel;
};

export function UserCompaniesPanel({ model }: Props) {
  const {
    user,
    saving,
    availableCompanies,
    assignCompanyId,
    setAssignCompanyId,
    assignCompanyDefault,
    setAssignCompanyDefault,
    assignCompany,
    updateCompanyLink,
    removeCompanyLink,
  } = model;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
        <div className="mb-3 flex items-center gap-2 text-right">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Plus className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">إسناد شركة</p>
            <p className="text-xs text-muted-foreground">اربط المستخدم بشركة جديدة</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-1.5 text-right">
            <label className="text-xs text-muted-foreground">الشركة</label>
            <Select value={assignCompanyId || '_none'} onValueChange={(v) => setAssignCompanyId(v === '_none' ? '' : v)}>
              <SelectTrigger className="h-10 bg-background text-right">
                <SelectValue placeholder="اختر شركة" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="_none">— اختر —</SelectItem>
                {availableCompanies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nameAr}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            <label className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs">
              <span>افتراضي</span>
              <Switch checked={assignCompanyDefault} onCheckedChange={setAssignCompanyDefault} />
            </label>
            <Button
              variant="luxe"
              size="sm"
              className="h-10 shrink-0 px-4"
              disabled={!assignCompanyId || saving}
              onClick={() => void assignCompany()}
            >
              إضافة
            </Button>
          </div>
        </div>
      </div>

      {(user?.companies.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/10 px-6 py-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">لا توجد شركات مسندة</p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            أضف شركة من النموذج أعلاه لربط هذا المستخدم بها.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {user!.companies.map((link) => (
            <article
              key={link.id}
              className="group rounded-xl border border-border/70 bg-card p-4 shadow-soft transition-colors hover:border-primary/20"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1 text-right">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <h4 className="font-semibold">{companyLinkLabel(link)}</h4>
                    {link.isDefault ? (
                      <Badge variant="secondary" className="gap-1 text-[10px]">
                        <Star className="h-3 w-3" />
                        افتراضي
                      </Badge>
                    ) : null}
                    {link.isActive ? (
                      <Badge variant="outline" className="border-success/40 text-[10px] text-success">نشط</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-destructive">غير نشط</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground" dir="ltr">
                    {link.companyCode ?? link.companyId}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  {!link.isDefault ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      disabled={saving}
                      onClick={() => void updateCompanyLink(link.id, { isDefault: true })}
                    >
                      تعيين افتراضي
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive"
                    disabled={saving}
                    onClick={() => void removeCompanyLink(link.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    إزالة
                  </Button>
                </div>

                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>نشط</span>
                  <Switch
                    checked={link.isActive}
                    disabled={saving}
                    onCheckedChange={(v) => void updateCompanyLink(link.id, { isActive: v })}
                  />
                </label>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

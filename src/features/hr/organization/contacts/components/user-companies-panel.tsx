'use client';

import { Building2, Star, Trash2 } from 'lucide-react';
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
import { companyLinkLabel } from '@/features/hr/organization/contacts/constants/users-directory';
import type { UserDetailModel } from '@/features/hr/organization/contacts/hooks/useUserDetailModel';

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
    <div className="space-y-4">
      <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
        <p className="mb-3 text-right text-sm font-medium">إسناد شركة جديدة</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5 text-right">
            <label className="text-xs text-muted-foreground">الشركة</label>
            <Select value={assignCompanyId || '_none'} onValueChange={(v) => setAssignCompanyId(v === '_none' ? '' : v)}>
              <SelectTrigger className="h-9 text-right">
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
          <div className="flex shrink-0 items-center gap-2" dir="rtl">
            <Button
              variant="luxe"
              size="sm"
              className="h-9 shrink-0"
              disabled={!assignCompanyId || saving}
              onClick={() => void assignCompany()}
            >
              حفظ
            </Button>
            <label className="flex items-center gap-2 text-sm">
              افتراضي
              <Switch checked={assignCompanyDefault} onCheckedChange={setAssignCompanyDefault} />
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {(user?.companies.length ?? 0) === 0 ? (
          <p className="rounded-xl border border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            لا توجد شركات مسندة لهذا المستخدم
          </p>
        ) : (
          user!.companies.map((link) => (
            <div
              key={link.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-soft"
            >
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  disabled={saving}
                  onClick={() => void removeCompanyLink(link.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs">
                  <span>نشط</span>
                  <Switch
                    checked={link.isActive}
                    disabled={saving}
                    onCheckedChange={(v) => void updateCompanyLink(link.id, { isActive: v })}
                  />
                </label>
                {!link.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={saving}
                    onClick={() => void updateCompanyLink(link.id, { isDefault: true })}
                  >
                    تعيين افتراضي
                  </Button>
                )}
              </div>
              <div className="flex min-w-0 flex-1 items-start justify-end gap-3">
                <div className="min-w-0 text-right">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <p className="font-semibold">{companyLinkLabel(link)}</p>
                    {link.isDefault && (
                      <Badge variant="secondary" className="gap-1 text-[10px]">
                        <Star className="h-3 w-3" /> افتراضي
                      </Badge>
                    )}
                    {link.isActive ? (
                      <Badge variant="outline" className="border-success/40 text-[10px] text-success">نشط</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-destructive">غير نشط</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    {link.companyCode ?? link.companyId}
                  </p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

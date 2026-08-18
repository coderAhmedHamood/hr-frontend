'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getContactsCompanyId } from '@/features/contacts/lib/company-id';
import { usePartnerMutations } from '@/features/contacts/admin/partners/hooks/use-partner-mutations';
import {
  PARTNER_FORM_DEFAULT_VALUES,
  partnerFormSchema,
  type PartnerFormValues,
} from '@/features/contacts/admin/schemas/partner-schemas';
import { EntityFormRow } from '@/features/ecommerce/admin/shared/components/entity-form-row';
import type { Partner } from '@/features/contacts/domain/types/partner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  dialogShellBodyClass,
  dialogShellContentClass,
  dialogShellHeaderClass,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/shared/utils';

type Props = {
  partner?: Partner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (partner: Partner) => void;
};

function toFormValues(partner: Partner): PartnerFormValues {
  return {
    name: partner.name,
    displayName: partner.displayName ?? '',
    nameAr: partner.nameAr ?? '',
    nameEn: partner.nameEn ?? '',
    isCompany: partner.isCompany,
    status: partner.status,
    isCustomer: partner.isCustomer,
    isVendor: partner.isVendor,
    isEmployee: partner.isEmployee,
    isInternal: partner.isInternal,
    parentId: partner.parentId ?? '',
    email: partner.email ?? '',
    mobile: partner.mobile ?? '',
    phone: partner.phone ?? '',
    website: partner.website ?? '',
    taxNumber: partner.taxNumber ?? '',
    commercialRegistration: partner.commercialRegistration ?? '',
    industry: partner.industry ?? '',
    jobTitle: partner.jobTitle ?? '',
    department: partner.department ?? '',
    languageCode: partner.languageCode ?? 'ar',
    currencyCode: partner.currencyCode ?? 'SAR',
    paymentTerms: partner.paymentTerms ?? '',
    creditLimitAmount: partner.creditLimitAmount ?? '',
    preferredPaymentMethod: partner.preferredPaymentMethod ?? '',
    notes: partner.notes ?? '',
    refCode: partner.refCode ?? '',
    tags: partner.tags?.join(', ') ?? '',
  };
}

function emptyToNull(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function PartnerFormDialog({ partner, open, onOpenChange, onCreated }: Props) {
  const companyId = getContactsCompanyId();
  const { create, update } = usePartnerMutations(companyId);
  const isEditing = Boolean(partner);
  const isSaving = create.isPending || update.isPending;

  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerFormSchema),
    defaultValues: PARTNER_FORM_DEFAULT_VALUES,
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset(partner ? toFormValues(partner) : PARTNER_FORM_DEFAULT_VALUES);
  }, [open, partner, form]);

  const onSubmit = async (values: PartnerFormValues) => {
    if (!companyId) return;
    const credit = values.creditLimitAmount?.trim();
    const tags = values.tags
      ?.split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      companyId,
      name: values.name.trim(),
      displayName: emptyToNull(values.displayName) ?? values.name.trim(),
      nameAr: emptyToNull(values.nameAr),
      nameEn: emptyToNull(values.nameEn),
      isCompany: values.isCompany,
      status: values.status,
      isCustomer: values.isCustomer,
      isVendor: values.isVendor,
      isEmployee: values.isEmployee,
      isInternal: values.isInternal,
      parentId: emptyToNull(values.parentId),
      email: emptyToNull(values.email),
      mobile: emptyToNull(values.mobile),
      phone: emptyToNull(values.phone),
      website: emptyToNull(values.website),
      taxNumber: emptyToNull(values.taxNumber),
      commercialRegistration: emptyToNull(values.commercialRegistration),
      industry: emptyToNull(values.industry),
      jobTitle: emptyToNull(values.jobTitle),
      department: emptyToNull(values.department),
      languageCode: emptyToNull(values.languageCode) ?? 'ar',
      currencyCode: emptyToNull(values.currencyCode) ?? 'SAR',
      paymentTerms: emptyToNull(values.paymentTerms),
      creditLimitAmount: credit ? Number(credit) : null,
      creditLimitCurrency: credit ? values.currencyCode || 'SAR' : null,
      preferredPaymentMethod: emptyToNull(values.preferredPaymentMethod),
      notes: emptyToNull(values.notes),
      refCode: emptyToNull(values.refCode),
      tags: tags?.length ? tags : null,
    };

    if (partner) {
      await update.mutateAsync({ id: partner.id, patch: payload });
      onOpenChange(false);
      return;
    }

    const created = await create.mutateAsync(payload);
    onOpenChange(false);
    onCreated?.(created);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(dialogShellContentClass, 'max-w-2xl sm:max-w-2xl')}>
        <div className={dialogShellHeaderClass}>
          <DialogTitle className="text-base font-semibold">
            {isEditing ? 'تعديل جهة الاتصال' : 'جهة اتصال جديدة'}
          </DialogTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            سجل واحد يمكن أن يكون عميلاً ومورداً وموظفاً في آن واحد.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit(onSubmit)(e);
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className={cn(dialogShellBodyClass, 'space-y-1')}>
            <EntityFormRow label="الاسم" htmlFor="partner-name">
              <Input
                id="partner-name"
                className="w-full max-w-sm border-0 bg-transparent px-0 text-xl font-semibold shadow-none focus-visible:ring-0"
                placeholder="مثال: Clean Life أو أحمد"
                {...form.register('name')}
              />
              {form.formState.errors.name ? (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              ) : null}
            </EntityFormRow>

            <EntityFormRow label="اسم العرض" htmlFor="partner-display">
              <Input id="partner-display" className="w-full max-w-sm" {...form.register('displayName')} />
            </EntityFormRow>

            <EntityFormRow label="شركة؟" htmlFor="partner-is-company">
              <Controller
                control={form.control}
                name="isCompany"
                render={({ field }) => (
                  <Switch id="partner-is-company" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </EntityFormRow>

            <EntityFormRow label="الحالة" htmlFor="partner-status">
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="partner-status" className="w-full max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">مسودة</SelectItem>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="inactive">غير نشط</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </EntityFormRow>

            <EntityFormRow label="الأدوار">
              <div className="flex flex-wrap gap-4">
                {(
                  [
                    ['isCustomer', 'عميل'],
                    ['isVendor', 'مورد'],
                    ['isEmployee', 'موظف'],
                    ['isInternal', 'داخلي'],
                  ] as const
                ).map(([name, label]) => (
                  <label key={name} className="flex items-center gap-2 text-sm">
                    <Controller
                      control={form.control}
                      name={name}
                      render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </EntityFormRow>

            <EntityFormRow label="الجوال" htmlFor="partner-mobile">
              <Input id="partner-mobile" dir="ltr" className="w-full max-w-xs" {...form.register('mobile')} />
            </EntityFormRow>

            <EntityFormRow label="الهاتف" htmlFor="partner-phone">
              <Input id="partner-phone" dir="ltr" className="w-full max-w-xs" {...form.register('phone')} />
            </EntityFormRow>

            <EntityFormRow label="البريد" htmlFor="partner-email">
              <Input id="partner-email" dir="ltr" className="w-full max-w-sm" {...form.register('email')} />
              {form.formState.errors.email ? (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              ) : null}
            </EntityFormRow>

            <EntityFormRow label="الموقع" htmlFor="partner-website">
              <Input id="partner-website" dir="ltr" className="w-full max-w-sm" {...form.register('website')} />
            </EntityFormRow>

            <EntityFormRow label="الرقم الضريبي" htmlFor="partner-tax">
              <Input id="partner-tax" dir="ltr" className="w-full max-w-xs" {...form.register('taxNumber')} />
            </EntityFormRow>

            <EntityFormRow label="السجل التجاري" htmlFor="partner-cr">
              <Input id="partner-cr" dir="ltr" className="w-full max-w-xs" {...form.register('commercialRegistration')} />
            </EntityFormRow>

            <EntityFormRow label="المسمى الوظيفي" htmlFor="partner-job">
              <Input id="partner-job" className="w-full max-w-sm" {...form.register('jobTitle')} />
            </EntityFormRow>

            <EntityFormRow label="القسم" htmlFor="partner-dept">
              <Input id="partner-dept" className="w-full max-w-sm" {...form.register('department')} />
            </EntityFormRow>

            <EntityFormRow label="الصناعة" htmlFor="partner-industry">
              <Input id="partner-industry" className="w-full max-w-sm" {...form.register('industry')} />
            </EntityFormRow>

            <EntityFormRow label="شروط الدفع" htmlFor="partner-terms">
              <Input id="partner-terms" className="w-full max-w-sm" {...form.register('paymentTerms')} />
            </EntityFormRow>

            <EntityFormRow label="حد الائتمان" htmlFor="partner-credit">
              <Input
                id="partner-credit"
                dir="ltr"
                className="w-full max-w-xs"
                placeholder="0"
                {...form.register('creditLimitAmount')}
              />
            </EntityFormRow>

            <EntityFormRow label="المرجع" htmlFor="partner-ref">
              <Input id="partner-ref" dir="ltr" className="w-full max-w-xs" {...form.register('refCode')} />
            </EntityFormRow>

            <EntityFormRow label="وسوم" htmlFor="partner-tags" hint>
              <Input
                id="partner-tags"
                className="w-full max-w-lg"
                placeholder="VIP, Prospect — مفصولة بفاصلة"
                {...form.register('tags')}
              />
            </EntityFormRow>

            <EntityFormRow label="ملاحظات" htmlFor="partner-notes">
              <Textarea id="partner-notes" rows={3} className="w-full max-w-lg" {...form.register('notes')} />
            </EntityFormRow>
          </div>

          <DialogFooter className="ctc-dialog-footer gap-2 border-t border-border px-4 py-4 sm:px-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSaving || !companyId}>
              {isSaving ? 'جاري الحفظ…' : isEditing ? 'حفظ' : 'إنشاء'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

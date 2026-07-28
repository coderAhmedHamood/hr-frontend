'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Building2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Trash2,
} from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getContactsCompanyId } from '@/features/contacts/lib/company-id';
import { contactsAdminRoutes } from '@/features/contacts/admin/constants/routes';
import {
  usePartnerActivities,
  usePartnerAttachments,
  usePartnerChildren,
  usePartnerFull,
  usePartnerNotes,
} from '@/features/contacts/admin/partners/hooks/use-partners';
import { usePartnerMutations } from '@/features/contacts/admin/partners/hooks/use-partner-mutations';
import { usePartnerCategories } from '@/features/contacts/admin/categories/hooks/use-partner-categories';
import { PartnerFormDialog } from '@/features/contacts/admin/partners/components/partner-form-dialog';
import {
  PartnerRoleBadges,
  PartnerStatusBadge,
  partnerInitials,
} from '@/features/contacts/admin/partners/components/partner-role-badges';
import {
  PARTNER_ACTIVITY_STATUS_LABELS,
  PARTNER_ACTIVITY_TYPE_LABELS,
  PARTNER_ADDRESS_TYPE_LABELS,
  PARTNER_CHANNEL_TYPE_LABELS,
  PARTNER_RELATION_TYPE_LABELS,
} from '@/features/contacts/domain/constants/labels';
import type {
  PartnerActivityType,
  PartnerAddressType,
  PartnerChannelType,
  PartnerRelationType,
} from '@/features/contacts/domain/types/partner';

type Props = { partnerId: string };

export function PartnerDetailPage({ partnerId }: Props) {
  const companyId = getContactsCompanyId();
  const router = useRouter();
  const { data: partner, isLoading, isError } = usePartnerFull(companyId, partnerId);
  const { data: children } = usePartnerChildren(companyId, partnerId);
  const { data: notes } = usePartnerNotes(companyId, partnerId);
  const { data: activities } = usePartnerActivities(companyId, partnerId);
  const { data: attachments } = usePartnerAttachments(companyId, partnerId);
  const { data: categoriesData } = usePartnerCategories({
    companyId,
    page: 1,
    limit: 200,
  });
  const mutations = usePartnerMutations(companyId);
  const [editOpen, setEditOpen] = React.useState(false);
  const [categoryToAssign, setCategoryToAssign] = React.useState('');
  const [attachmentForm, setAttachmentForm] = React.useState({
    fileName: '',
    fileUrl: '',
    label: '',
  });

  const [addressForm, setAddressForm] = React.useState({
    addressType: 'main' as PartnerAddressType,
    city: '',
    street: '',
    district: '',
  });
  const [channelForm, setChannelForm] = React.useState({
    channelType: 'mobile' as PartnerChannelType,
    value: '',
  });
  const [relationForm, setRelationForm] = React.useState({
    toPartnerId: '',
    relationType: 'billing_contact' as PartnerRelationType,
  });
  const [noteBody, setNoteBody] = React.useState('');
  const [activityForm, setActivityForm] = React.useState({
    activityType: 'task' as PartnerActivityType,
    subject: '',
    body: '',
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">جاري تحميل جهة الاتصال…</p>;
  }

  if (isError || !partner) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">تعذر تحميل جهة الاتصال.</p>
        <Button variant="outline" asChild>
          <Link href={contactsAdminRoutes.partners}>العودة للقائمة</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle titleAr={partner.displayName} iconName="Users" />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild aria-label="رجوع">
            <Link href={contactsAdminRoutes.partners}>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted text-lg font-semibold">
            {partner.isCompany ? (
              <Building2 className="h-5 w-5 text-muted-foreground" />
            ) : (
              partnerInitials(partner.displayName)
            )}
          </span>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">{partner.displayName}</h1>
              <PartnerStatusBadge status={partner.status} />
            </div>
            <PartnerRoleBadges partner={partner} />
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {partner.mobile ? (
                <span className="flex items-center gap-1" dir="ltr">
                  <Phone className="h-3.5 w-3.5" />
                  {partner.mobile}
                </span>
              ) : null}
              {partner.email ? (
                <span className="flex items-center gap-1" dir="ltr">
                  <Mail className="h-3.5 w-3.5" />
                  {partner.email}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <Button onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4" />
          تعديل
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="flex h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="general">عام</TabsTrigger>
          <TabsTrigger value="addresses">عناوين</TabsTrigger>
          <TabsTrigger value="channels">وسائل الاتصال</TabsTrigger>
          <TabsTrigger value="relations">علاقات</TabsTrigger>
          <TabsTrigger value="financial">مالي</TabsTrigger>
          <TabsTrigger value="activities">أنشطة</TabsTrigger>
          <TabsTrigger value="notes">ملاحظات</TabsTrigger>
          <TabsTrigger value="attachments">مرفقات</TabsTrigger>
          <TabsTrigger value="related">سجلات مرتبطة</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4 space-y-4">
          <DetailGrid
            rows={[
              ['الاسم', partner.name],
              ['اسم العرض', partner.displayName],
              ['النوع', partner.isCompany ? 'شركة' : 'شخص'],
              ['المرجع', partner.refCode],
              ['الرقم الضريبي', partner.taxNumber],
              ['السجل التجاري', partner.commercialRegistration],
              ['الصناعة', partner.industry],
              ['المسمى', partner.jobTitle],
              ['القسم', partner.department],
              ['اللغة', partner.languageCode],
              ['العملة', partner.currencyCode],
              ['الموقع', partner.website],
            ]}
          />
          {partner.notes ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-1 text-xs font-medium text-muted-foreground">ملاحظات</p>
              <p className="whitespace-pre-wrap text-sm">{partner.notes}</p>
            </div>
          ) : null}
          {partner.tags?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {partner.tags.map((tag) => (
                <Badge key={tag} variant="subtle">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">التصنيفات</p>
            <div className="flex flex-wrap gap-1.5">
              {(partner.categories ?? []).map((cat) => (
                <Badge key={cat.id} variant="outline" className="gap-1.5 pe-1">
                  {cat.nameAr}
                  <button
                    type="button"
                    className="rounded-sm p-0.5 hover:bg-muted"
                    aria-label={`إزالة ${cat.nameAr}`}
                    onClick={() =>
                      void mutations.unassignCategory.mutateAsync({
                        partnerId,
                        categoryId: cat.id,
                      })
                    }
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                </Badge>
              ))}
              {!partner.categories?.length ? (
                <span className="text-sm text-muted-foreground">لا تصنيفات معيّنة.</span>
              ) : null}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={categoryToAssign} onValueChange={setCategoryToAssign}>
                <SelectTrigger className="sm:flex-1">
                  <SelectValue placeholder="اختر تصنيفًا لإضافته" />
                </SelectTrigger>
                <SelectContent>
                  {(categoriesData?.items ?? [])
                    .filter((c) => !(partner.categories ?? []).some((pc) => pc.id === c.id))
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nameAr}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                disabled={!categoryToAssign || mutations.assignCategory.isPending}
                onClick={() =>
                  void mutations.assignCategory
                    .mutateAsync({ partnerId, categoryId: categoryToAssign })
                    .then(() => setCategoryToAssign(''))
                }
              >
                <Plus className="h-4 w-4" />
                تعيين
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="addresses" className="mt-4 space-y-4">
          <div className="space-y-2">
            {(partner.addresses ?? []).map((address) => (
              <div
                key={address.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {PARTNER_ADDRESS_TYPE_LABELS[address.addressType]}
                      {address.isDefault ? ' · افتراضي' : ''}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {[address.street, address.building, address.district, address.city, address.state]
                      .filter(Boolean)
                      .join('، ') || '—'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="حذف العنوان"
                  onClick={() =>
                    void mutations.removeAddress.mutateAsync({ id: address.id, partnerId })
                  }
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {!partner.addresses?.length ? (
              <p className="text-sm text-muted-foreground">لا عناوين بعد.</p>
            ) : null}
          </div>

          <div className="grid gap-2 rounded-xl border border-dashed border-border p-3 sm:grid-cols-4">
            <Select
              value={addressForm.addressType}
              onValueChange={(v) =>
                setAddressForm((s) => ({ ...s, addressType: v as PartnerAddressType }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PARTNER_ADDRESS_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="المدينة"
              value={addressForm.city}
              onChange={(e) => setAddressForm((s) => ({ ...s, city: e.target.value }))}
            />
            <Input
              placeholder="الحي"
              value={addressForm.district}
              onChange={(e) => setAddressForm((s) => ({ ...s, district: e.target.value }))}
            />
            <Input
              placeholder="الشارع"
              value={addressForm.street}
              onChange={(e) => setAddressForm((s) => ({ ...s, street: e.target.value }))}
            />
            <Button
              className="sm:col-span-4"
              disabled={mutations.createAddress.isPending}
              onClick={() =>
                void mutations.createAddress
                  .mutateAsync({
                    partnerId,
                    addressType: addressForm.addressType,
                    city: addressForm.city || null,
                    district: addressForm.district || null,
                    street: addressForm.street || null,
                    isDefault: true,
                  })
                  .then(() => setAddressForm({ addressType: 'main', city: '', street: '', district: '' }))
              }
            >
              <Plus className="h-4 w-4" />
              إضافة عنوان
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="channels" className="mt-4 space-y-4">
          <div className="space-y-2">
            {(partner.channels ?? []).map((channel) => (
              <div
                key={channel.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {PARTNER_CHANNEL_TYPE_LABELS[channel.channelType]}
                    {channel.isPrimary ? ' · أساسي' : ''}
                  </p>
                  <p className="truncate text-sm" dir="ltr">
                    {channel.value}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    void mutations.removeChannel.mutateAsync({ id: channel.id, partnerId })
                  }
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {!partner.channels?.length ? (
              <p className="text-sm text-muted-foreground">لا وسائل اتصال إضافية.</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 rounded-xl border border-dashed border-border p-3">
            <Select
              value={channelForm.channelType}
              onValueChange={(v) =>
                setChannelForm((s) => ({ ...s, channelType: v as PartnerChannelType }))
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PARTNER_CHANNEL_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="min-w-[180px] flex-1"
              dir="ltr"
              placeholder="القيمة"
              value={channelForm.value}
              onChange={(e) => setChannelForm((s) => ({ ...s, value: e.target.value }))}
            />
            <Button
              disabled={!channelForm.value.trim() || mutations.createChannel.isPending}
              onClick={() =>
                void mutations.createChannel
                  .mutateAsync({
                    partnerId,
                    channelType: channelForm.channelType,
                    value: channelForm.value.trim(),
                    isPrimary: true,
                  })
                  .then(() => setChannelForm({ channelType: 'mobile', value: '' }))
              }
            >
              إضافة
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="relations" className="mt-4 space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-semibold">الأبناء ({children?.items.length ?? 0})</h3>
            <div className="space-y-1">
              {(children?.items ?? []).map((child) => (
                <button
                  key={child.id}
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-start hover:bg-muted/40"
                  onClick={() => router.push(contactsAdminRoutes.partnerDetail(child.id))}
                >
                  <span className="text-sm font-medium">{child.displayName}</span>
                  <PartnerRoleBadges partner={child} />
                </button>
              ))}
              {!children?.items.length ? (
                <p className="text-sm text-muted-foreground">لا جهات فرعية. اربط parentId عند الإنشاء.</p>
              ) : null}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">علاقات مسمّاة</h3>
            <div className="space-y-2">
              {(partner.relations ?? []).map((rel) => (
                <div
                  key={rel.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {PARTNER_RELATION_TYPE_LABELS[rel.relationType]}
                    </p>
                    <p className="text-xs text-muted-foreground" dir="ltr">
                      → {rel.toPartnerId}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      void mutations.removeRelation.mutateAsync({ id: rel.id, partnerId })
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Input
                className="min-w-[220px] flex-1"
                dir="ltr"
                placeholder="UUID الجهة المرتبطة"
                value={relationForm.toPartnerId}
                onChange={(e) => setRelationForm((s) => ({ ...s, toPartnerId: e.target.value }))}
              />
              <Select
                value={relationForm.relationType}
                onValueChange={(v) =>
                  setRelationForm((s) => ({ ...s, relationType: v as PartnerRelationType }))
                }
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PARTNER_RELATION_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                disabled={!relationForm.toPartnerId.trim()}
                onClick={() =>
                  void mutations.createRelation
                    .mutateAsync({
                      fromPartnerId: partnerId,
                      toPartnerId: relationForm.toPartnerId.trim(),
                      relationType: relationForm.relationType,
                    })
                    .then(() =>
                      setRelationForm({ toPartnerId: '', relationType: 'billing_contact' }),
                    )
                }
              >
                ربط
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="mt-4">
          <DetailGrid
            rows={[
              ['شروط الدفع', partner.paymentTerms],
              [
                'حد الائتمان',
                partner.creditLimitAmount
                  ? `${partner.creditLimitAmount} ${partner.creditLimitCurrency ?? ''}`.trim()
                  : null,
              ],
              ['طريقة الدفع المفضلة', partner.preferredPaymentMethod],
              ['العملة', partner.currencyCode],
            ]}
          />
        </TabsContent>

        <TabsContent value="activities" className="mt-4 space-y-4">
          <div className="space-y-2">
            {(activities ?? []).map((activity) => (
              <div key={activity.id} className="rounded-xl border border-border bg-card p-3">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge variant="subtle">
                    {PARTNER_ACTIVITY_TYPE_LABELS[activity.activityType]}
                  </Badge>
                  <Badge variant={activity.status === 'done' ? 'success' : 'outline'}>
                    {PARTNER_ACTIVITY_STATUS_LABELS[activity.status]}
                  </Badge>
                  <span className="text-sm font-medium">{activity.subject}</span>
                </div>
                {activity.body ? (
                  <p className="text-sm text-muted-foreground">{activity.body}</p>
                ) : null}
                {activity.status !== 'done' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() =>
                      void mutations.updateActivity.mutateAsync({
                        id: activity.id,
                        partnerId,
                        patch: { status: 'done', completedAt: new Date().toISOString() },
                      })
                    }
                  >
                    إنجاز
                  </Button>
                ) : null}
              </div>
            ))}
            {!activities?.length ? (
              <p className="text-sm text-muted-foreground">لا أنشطة بعد.</p>
            ) : null}
          </div>
          <div className="grid gap-2 rounded-xl border border-dashed border-border p-3">
            <Select
              value={activityForm.activityType}
              onValueChange={(v) =>
                setActivityForm((s) => ({ ...s, activityType: v as PartnerActivityType }))
              }
            >
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PARTNER_ACTIVITY_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="الموضوع"
              value={activityForm.subject}
              onChange={(e) => setActivityForm((s) => ({ ...s, subject: e.target.value }))}
            />
            <Textarea
              placeholder="التفاصيل"
              rows={2}
              value={activityForm.body}
              onChange={(e) => setActivityForm((s) => ({ ...s, body: e.target.value }))}
            />
            <Button
              disabled={!activityForm.subject.trim()}
              onClick={() =>
                void mutations.createActivity
                  .mutateAsync({
                    partnerId,
                    activityType: activityForm.activityType,
                    subject: activityForm.subject.trim(),
                    body: activityForm.body.trim() || null,
                  })
                  .then(() => setActivityForm({ activityType: 'task', subject: '', body: '' }))
              }
            >
              إضافة نشاط
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="notes" className="mt-4 space-y-4">
          <div className="space-y-2">
            {(notes ?? []).map((note) => (
              <div
                key={note.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div>
                  <p className="whitespace-pre-wrap text-sm">{note.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(note.createdAt).toLocaleString('ar-SA')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void mutations.removeNote.mutateAsync({ id: note.id, partnerId })}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Textarea
              rows={3}
              placeholder="ملاحظة جديدة…"
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
            />
            <Button
              disabled={!noteBody.trim()}
              onClick={() =>
                void mutations.createNote
                  .mutateAsync({ partnerId, body: noteBody.trim() })
                  .then(() => setNoteBody(''))
              }
            >
              حفظ الملاحظة
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="attachments" className="mt-4 space-y-4">
          <div className="space-y-2">
            {(attachments ?? []).map((file) => (
              <div
                key={file.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium">{file.label || file.fileName}</p>
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-xs text-primary underline-offset-2 hover:underline"
                    dir="ltr"
                  >
                    {file.fileUrl}
                  </a>
                  {file.mimeType ? (
                    <p className="text-xs text-muted-foreground">{file.mimeType}</p>
                  ) : null}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="أرشفة المرفق"
                  onClick={() =>
                    void mutations.removeAttachment.mutateAsync({ id: file.id, partnerId })
                  }
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {!attachments?.length ? (
              <p className="text-sm text-muted-foreground">لا مرفقات بعد.</p>
            ) : null}
          </div>
          <div className="grid gap-2 rounded-xl border border-dashed border-border p-3 sm:grid-cols-3">
            <Input
              placeholder="اسم الملف *"
              value={attachmentForm.fileName}
              onChange={(e) => setAttachmentForm((s) => ({ ...s, fileName: e.target.value }))}
            />
            <Input
              placeholder="رابط الملف *"
              dir="ltr"
              value={attachmentForm.fileUrl}
              onChange={(e) => setAttachmentForm((s) => ({ ...s, fileUrl: e.target.value }))}
            />
            <Input
              placeholder="تسمية (اختياري)"
              value={attachmentForm.label}
              onChange={(e) => setAttachmentForm((s) => ({ ...s, label: e.target.value }))}
            />
            <Button
              className="sm:col-span-3"
              disabled={
                !attachmentForm.fileName.trim() ||
                !attachmentForm.fileUrl.trim() ||
                mutations.createAttachment.isPending
              }
              onClick={() =>
                void mutations.createAttachment
                  .mutateAsync({
                    partnerId,
                    fileName: attachmentForm.fileName.trim(),
                    fileUrl: attachmentForm.fileUrl.trim(),
                    label: attachmentForm.label.trim() || null,
                  })
                  .then(() => setAttachmentForm({ fileName: '', fileUrl: '', label: '' }))
              }
            >
              <Plus className="h-4 w-4" />
              إضافة مرفق
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="related" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: 'المبيعات', hint: 'طلبات البيع المرتبطة بـ partner_id' },
              { label: 'المشتريات', hint: 'أوامر الشراء' },
              { label: 'المخزون', hint: 'عمليات المستودع' },
              { label: 'المحاسبة', hint: 'فواتير وقيود' },
              { label: 'الموارد البشرية', hint: 'سجل الموظف إن وُجد' },
              { label: 'التذاكر / المشاريع', hint: 'Helpdesk & Projects' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border bg-card p-4">
                <p className="font-medium">{item.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.hint}</p>
                <p className="mt-2 text-xs text-muted-foreground">سيظهر العدّاد بعد ربط الوحدات.</p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <PartnerFormDialog open={editOpen} partner={partner} onOpenChange={setEditOpen} />
    </div>
  );
}

function DetailGrid({ rows }: { rows: [string, string | null | undefined][] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-border bg-card px-3 py-2.5">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-sm font-medium text-foreground">{value || '—'}</p>
        </div>
      ))}
    </div>
  );
}

'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Building2,
  CircleUserRound,
  Clock,
  CreditCard,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Network,
  Paperclip,
  Pencil,
  Phone,
  Plus,
  StickyNote,
  Trash2,
  Waypoints,
} from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { PageHeaderPrimaryButton } from '@/components/layouts/page-header-primary-button';
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
import { PartnerStoreOrdersPanel } from '@/features/contacts/admin/partners/components/partner-store-orders-panel';
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
import { cn } from '@/shared/utils';

type Props = { partnerId: string };

const DETAIL_TABS = [
  { value: 'general', label: 'عام', icon: CircleUserRound },
  { value: 'addresses', label: 'عناوين', icon: MapPin },
  { value: 'channels', label: 'اتصال', icon: Phone },
  { value: 'relations', label: 'علاقات', icon: Waypoints },
  { value: 'financial', label: 'مالي', icon: CreditCard },
  { value: 'activities', label: 'أنشطة', icon: Clock },
  { value: 'notes', label: 'ملاحظات', icon: StickyNote },
  { value: 'attachments', label: 'مرفقات', icon: Paperclip },
  { value: 'related', label: 'مرتبط', icon: Network },
] as const;

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

  usePageHeaderActions(
    () =>
      partner ? (
        <PageHeaderPrimaryButton icon={Pencil} label="تعديل" onClick={() => setEditOpen(true)} />
      ) : null,
    [partner],
  );

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-40 animate-pulse rounded-3xl bg-muted/60" />
        <div className="h-11 animate-pulse rounded-xl bg-muted/50" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-2xl bg-muted/40" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !partner) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
        <CircleUserRound className="h-10 w-10 text-muted-foreground/50" />
        <div className="space-y-1">
          <p className="font-medium text-foreground">تعذر تحميل جهة الاتصال</p>
          <p className="text-sm text-muted-foreground">تحقق من الرابط أو عد للقائمة وحاول مجددًا.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={contactsAdminRoutes.partners}>العودة للقائمة</Link>
        </Button>
      </div>
    );
  }

  const identityRows: [string, string | null | undefined][] = [
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
  ];

  return (
    <div className="flex flex-col gap-6">
      <SetPageTitle titleAr={partner.displayName} iconName="Users" />

      {/* Profile hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-l from-primary/15 via-primary/5 to-transparent"
          aria-hidden
        />
        <div className="relative flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full border border-border/80 bg-background/80"
              asChild
              aria-label="رجوع"
            >
              <Link href={contactsAdminRoutes.partners}>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-semibold text-primary shadow-soft ring-1 ring-primary/15 sm:h-20 sm:w-20 sm:text-2xl">
              {partner.isCompany ? (
                <Building2 className="h-8 w-8 sm:h-9 sm:w-9" />
              ) : (
                partnerInitials(partner.displayName)
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">
                    {partner.displayName}
                  </h1>
                  <PartnerStatusBadge status={partner.status} />
                </div>
                <PartnerRoleBadges partner={partner} />
              </div>

              <div className="flex flex-wrap gap-2">
                {partner.mobile ? (
                  <a
                    href={`tel:${partner.mobile}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/90 px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
                    dir="ltr"
                  >
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    {partner.mobile}
                  </a>
                ) : null}
                {partner.email ? (
                  <a
                    href={`mailto:${partner.email}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/90 px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
                    dir="ltr"
                  >
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    {partner.email}
                  </a>
                ) : null}
                {partner.website ? (
                  <a
                    href={partner.website.startsWith('http') ? partner.website : `https://${partner.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/90 px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
                    dir="ltr"
                  >
                    <Globe className="h-3.5 w-3.5 text-primary" />
                    موقع الويب
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>
                ) : null}
                {!partner.mobile && !partner.email && !partner.website ? (
                  <span className="text-sm text-muted-foreground">لا بيانات تواصل سريعة بعد.</span>
                ) : null}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="hidden h-10 rounded-xl sm:inline-flex"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-4 w-4" />
              تعديل البيانات
            </Button>
          </div>
        </div>
      </section>

      <Tabs defaultValue="general" className="w-full space-y-5">
        <div className="sticky top-0 z-10 -mx-1 overflow-x-auto px-1 pb-1">
          <TabsList className="inline-flex h-auto min-w-full w-max justify-start gap-1 rounded-2xl bg-muted/70 p-1.5">
            {DETAIL_TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="h-9 gap-1.5 rounded-xl px-3 text-xs sm:text-sm data-[state=active]:shadow-soft"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="general" className="mt-0 space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Panel title="البيانات الأساسية" description="هوية الجهة والمعلومات الرسمية.">
              <DetailGrid rows={identityRows} />
              {partner.notes ? (
                <div className="mt-4 rounded-2xl bg-muted/40 px-4 py-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">ملاحظات عامة</p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{partner.notes}</p>
                </div>
              ) : null}
              {partner.tags?.length ? (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {partner.tags.map((tag) => (
                    <Badge key={tag} variant="subtle">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </Panel>

            <Panel title="التصنيفات" description="تجميع الجهة ضمن تصنيفات جهات الاتصال.">
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
                  <EmptyInline message="لا تصنيفات معيّنة بعد." />
                ) : null}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Select value={categoryToAssign} onValueChange={setCategoryToAssign}>
                  <SelectTrigger className="min-w-[12rem] flex-1 sm:max-w-xs sm:flex-none">
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
                  className="shrink-0"
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
            </Panel>
          </div>
        </TabsContent>

        <TabsContent value="addresses" className="mt-0 space-y-4">
          <Panel title="العناوين" description="عناوين التوصيل والفواتير والمكاتب.">
            <div className="space-y-2">
              {(partner.addresses ?? []).map((address) => (
                <div
                  key={address.id}
                  className="group flex items-start justify-between gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-3 transition-colors hover:border-primary/25"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <MapPin className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-medium">
                        {PARTNER_ADDRESS_TYPE_LABELS[address.addressType]}
                      </span>
                      {address.isDefault ? <Badge variant="success">افتراضي</Badge> : null}
                    </div>
                    <p className="ps-10 text-sm text-muted-foreground">
                      {[address.street, address.building, address.district, address.city, address.state]
                        .filter(Boolean)
                        .join('، ') || '—'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-70 group-hover:opacity-100"
                    aria-label="حذف العنوان"
                    onClick={() =>
                      void mutations.removeAddress.mutateAsync({ id: address.id, partnerId })
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {!partner.addresses?.length ? <EmptyInline message="لا عناوين بعد." /> : null}
            </div>

            <AddFormShell title="إضافة عنوان">
              <div className="grid gap-2 sm:grid-cols-4">
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
              </div>
              <div className="mt-3 flex justify-start">
                <Button
                  className="shrink-0"
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
                      .then(() =>
                        setAddressForm({ addressType: 'main', city: '', street: '', district: '' }),
                      )
                  }
                >
                  <Plus className="h-4 w-4" />
                  إضافة عنوان
                </Button>
              </div>
            </AddFormShell>
          </Panel>
        </TabsContent>

        <TabsContent value="channels" className="mt-0 space-y-4">
          <Panel title="وسائل الاتصال" description="هواتف وبريد وقنوات تواصل إضافية.">
            <div className="space-y-2">
              {(partner.channels ?? []).map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {PARTNER_CHANNEL_TYPE_LABELS[channel.channelType]}
                      {channel.isPrimary ? ' · أساسي' : ''}
                    </p>
                    <p className="truncate text-sm font-medium" dir="ltr">
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
                <EmptyInline message="لا وسائل اتصال إضافية." />
              ) : null}
            </div>

            <AddFormShell title="إضافة وسيلة اتصال">
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={channelForm.channelType}
                  onValueChange={(v) =>
                    setChannelForm((s) => ({ ...s, channelType: v as PartnerChannelType }))
                  }
                >
                  <SelectTrigger className="w-35">
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
                  className="min-w-45 flex-1"
                  dir="ltr"
                  placeholder="القيمة"
                  value={channelForm.value}
                  onChange={(e) => setChannelForm((s) => ({ ...s, value: e.target.value }))}
                />
                <Button
                  className="shrink-0"
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
            </AddFormShell>
          </Panel>
        </TabsContent>

        <TabsContent value="relations" className="mt-0 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title={`الجهات الفرعية (${children?.items.length ?? 0})`}>
              <div className="space-y-1.5">
                {(children?.items ?? []).map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/60 px-3 py-2.5 text-start transition-colors hover:border-primary/30 hover:bg-primary/5"
                    onClick={() => router.push(contactsAdminRoutes.partnerDetail(child.id))}
                  >
                    <span className="text-sm font-medium">{child.displayName}</span>
                    <PartnerRoleBadges partner={child} />
                  </button>
                ))}
                {!children?.items.length ? (
                  <EmptyInline message="لا جهات فرعية. اربط parentId عند الإنشاء." />
                ) : null}
              </div>
            </Panel>

            <Panel title="علاقات مسمّاة">
              <div className="space-y-2">
                {(partner.relations ?? []).map((rel) => (
                  <div
                    key={rel.id}
                    className="flex items-center justify-between rounded-2xl border border-border/70 px-3 py-2.5"
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
              <AddFormShell title="ربط جهة">
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    className="min-w-55 flex-1"
                    dir="ltr"
                    placeholder="UUID الجهة المرتبطة"
                    value={relationForm.toPartnerId}
                    onChange={(e) =>
                      setRelationForm((s) => ({ ...s, toPartnerId: e.target.value }))
                    }
                  />
                  <Select
                    value={relationForm.relationType}
                    onValueChange={(v) =>
                      setRelationForm((s) => ({ ...s, relationType: v as PartnerRelationType }))
                    }
                  >
                    <SelectTrigger className="w-40">
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
                    className="shrink-0"
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
              </AddFormShell>
            </Panel>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="mt-0">
          <Panel title="البيانات المالية" description="شروط الدفع والائتمان والعملة.">
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
          </Panel>
        </TabsContent>

        <TabsContent value="activities" className="mt-0 space-y-4">
          <Panel title="الأنشطة" description="مهام ومتابعات مرتبطة بهذه الجهة.">
            <div className="space-y-2">
              {(activities ?? []).map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-2xl border border-border/70 bg-background/60 p-4"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="subtle">
                      {PARTNER_ACTIVITY_TYPE_LABELS[activity.activityType]}
                    </Badge>
                    <Badge variant={activity.status === 'done' ? 'success' : 'outline'}>
                      {PARTNER_ACTIVITY_STATUS_LABELS[activity.status]}
                    </Badge>
                    <span className="text-sm font-medium">{activity.subject}</span>
                  </div>
                  {activity.body ? (
                    <p className="text-sm leading-relaxed text-muted-foreground">{activity.body}</p>
                  ) : null}
                  {activity.status !== 'done' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 shrink-0"
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
              {!activities?.length ? <EmptyInline message="لا أنشطة بعد." /> : null}
            </div>

            <AddFormShell title="نشاط جديد">
              <div className="grid gap-2">
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
                <div className="flex justify-start">
                  <Button
                    className="shrink-0"
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
              </div>
            </AddFormShell>
          </Panel>
        </TabsContent>

        <TabsContent value="notes" className="mt-0 space-y-4">
          <Panel title="الملاحظات" description="ملاحظات داخلية عن هذه الجهة.">
            <div className="space-y-2">
              {(notes ?? []).map((note) => (
                <div
                  key={note.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-border/70 bg-background/60 p-4"
                >
                  <div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{note.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
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
              {!notes?.length ? <EmptyInline message="لا ملاحظات بعد." /> : null}
            </div>
            <AddFormShell title="ملاحظة جديدة">
              <div className="space-y-2">
                <Textarea
                  rows={3}
                  placeholder="اكتب ملاحظة…"
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                />
                <div className="flex justify-start">
                  <Button
                    className="shrink-0"
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
              </div>
            </AddFormShell>
          </Panel>
        </TabsContent>

        <TabsContent value="attachments" className="mt-0 space-y-4">
          <Panel title="المرفقات" description="ملفات وروابط مرتبطة بهذه الجهة.">
            <div className="space-y-2">
              {(attachments ?? []).map((file) => (
                <div
                  key={file.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-border/70 bg-background/60 p-4"
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
              {!attachments?.length ? <EmptyInline message="لا مرفقات بعد." /> : null}
            </div>
            <AddFormShell title="إضافة مرفق">
              <div className="grid gap-2 sm:grid-cols-3">
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
              </div>
              <div className="mt-3 flex justify-start">
                <Button
                  className="shrink-0"
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
            </AddFormShell>
          </Panel>
        </TabsContent>

        <TabsContent value="related" className="mt-0 space-y-4">
          {companyId ? (
            <PartnerStoreOrdersPanel companyId={companyId} partnerId={partnerId} />
          ) : null}

          <Panel title="سجلات مرتبطة" description="روابط مستقبلية مع وحدات النظام الأخرى.">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[
                { label: 'المشتريات', hint: 'أوامر الشراء' },
                { label: 'المخزون', hint: 'عمليات المستودع' },
                { label: 'المحاسبة', hint: 'فواتير وقيود' },
                { label: 'الموارد البشرية', hint: 'سجل الموظف إن وُجد' },
                { label: 'التذاكر / المشاريع', hint: 'Helpdesk & Projects' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-border/70 bg-gradient-to-br from-muted/40 to-background p-4"
                >
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.hint}</p>
                  <p className="mt-3 text-xs text-muted-foreground/80">سيظهر العدّاد بعد ربط الوحدات.</p>
                </div>
              ))}
            </div>
          </Panel>
        </TabsContent>
      </Tabs>

      <PartnerFormDialog open={editOpen} partner={partner} onOpenChange={setEditOpen} />
    </div>
  );
}

function Panel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-3xl border border-border/70 bg-card p-4 sm:p-5', className)}>
      <header className="mb-4 space-y-1">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}

function AddFormShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-border/80 bg-muted/20 p-3 sm:p-4">
      <p className="mb-3 text-xs font-medium text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function EmptyInline({ message }: { message: string }) {
  return <p className="text-sm text-muted-foreground">{message}</p>;
}

function DetailGrid({ rows }: { rows: [string, string | null | undefined][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-0 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex flex-col gap-0.5 border-b border-border/50 py-3 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0"
        >
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </dt>
          <dd className="text-sm font-medium text-foreground">{value || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

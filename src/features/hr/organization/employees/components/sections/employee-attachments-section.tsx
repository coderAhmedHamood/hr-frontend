'use client';

import * as React from 'react';
import {
  Eye,
  FileText,
  ImageIcon,
  Loader2,
  Paperclip,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DisplayDate } from '@/components/ui/table-cells';
import { FilterSelect } from '@/components/ui/select-with-clear';
import { Empty } from '@/features/hr/organization/employees/components/EmployeeProfilePrimitives';
import { EmployeeProfilePagedList } from '@/features/hr/organization/employees/components/employee-profile-paged-list';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';
import {
  EMPLOYEE_ATTACHMENT_DOCUMENT_TYPES,
  EMPLOYEE_ATTACHMENT_LIBRARY_GROUPS,
  employeeAttachmentDocumentTypeLabel,
  employeeAttachmentUploadCategoryLabel,
} from '@/features/hr/organization/employees/constants/employee-attachment-document-types';
import {
  ORGANIZATION_ARCHIVE_SCOPE_OPTIONS,
  type OrganizationArchiveScope,
} from '@/features/hr/organization/lib/archive-scope';
import {
  formatAttachmentSize,
  isImageAttachment,
  isPdfAttachment,
} from '@/features/hr/organization/employees/lib/employee-attachments-utils';
import type { EmployeeAttachmentDto } from '@/features/hr/organization/employees/lib/api/employee-attachments';
import { statusPillClass } from '@/shared/status-pill-classes';
import { cn } from '@/shared/utils';

function AttachmentIcon({ item }: { item: EmployeeAttachmentDto }) {
  if (isImageAttachment(item.mimeType)) return <ImageIcon className="h-4 w-4" />;
  if (isPdfAttachment(item.mimeType)) return <FileText className="h-4 w-4" />;
  return <Paperclip className="h-4 w-4" />;
}

function rangeLabel(page: number, pageSize: number, total: number): string {
  if (total <= 0) return 'لا توجد نتائج';
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return `عرض ${from}–${to} من ${total}`;
}

export function EmployeeAttachmentsSection({ model }: { model: EmployeeProfileModel }) {
  const {
    employee,
    employeeAttachments,
    attachmentsLoading,
    attachmentsPagination,
    attachmentsTotal,
    attachmentsError,
    archiveScope,
    setArchiveScope,
    libraryGroup,
    setLibraryGroup,
    documentTypeFilter,
    setDocumentTypeFilter,
    search,
    setSearch,
    hasAttachmentFilters,
    clearAttachmentFilters,
    setUploadOpen,
    setDetailAttachment,
  } = model;

  const [searchDraft, setSearchDraft] = React.useState(search);

  React.useEffect(() => {
    setSearchDraft(search);
  }, [search]);

  const applySearch = () => setSearch(searchDraft.trim());

  const activeGroup = EMPLOYEE_ATTACHMENT_LIBRARY_GROUPS.find((g) => g.id === libraryGroup);
  const subtypeOptions = React.useMemo(() => {
    const base = [{ value: 'all', label: 'كل الأنواع في المجموعة' }];
    const allowed = activeGroup && activeGroup.id !== 'all'
      ? EMPLOYEE_ATTACHMENT_DOCUMENT_TYPES.filter((t) =>
          (activeGroup.types as readonly string[]).includes(t.value),
        )
      : EMPLOYEE_ATTACHMENT_DOCUMENT_TYPES;
    return [
      ...base,
      ...allowed.map((item) => ({ value: item.value, label: item.label })),
    ];
  }, [activeGroup]);

  const filteredTotal = attachmentsPagination.total ?? 0;
  const listTotalLabel = hasAttachmentFilters ? filteredTotal : attachmentsTotal;

  if (attachmentsLoading && employeeAttachments.length === 0 && !attachmentsError) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        جاري تحميل المرفقات…
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft">
        <div className="pointer-events-none absolute inset-0 dotted-bg opacity-20" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px gold-accent-line" aria-hidden />
        <div className="relative p-5 sm:p-6 space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <Paperclip className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  مرفقات الموظف
                </h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-2xl">
                  مكتبة مستندات الموظف — فلتر حسب المجموعة، ابحث بالاسم، وافتح المعاينة بنقرة واحدة
                  واحدةحتى مع عشرات أو مئات الملفات.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  إجمالي المكتبة
                  <span className="mx-1 font-semibold text-foreground tabular-nums">
                    {attachmentsTotal}
                  </span>
                  مرفق
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="luxe"
              size="sm"
              className="h-9 shrink-0 gap-1.5 text-xs"
              onClick={() => setUploadOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              رفع مرفق
            </Button>
          </div>

          {attachmentsError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {attachmentsError}
            </div>
          ) : null}

          <div className="rounded-xl border border-border/70 bg-background/80 overflow-hidden">
            {/* Sticky library toolbar — scales to 100+ docs via server filters + pagination */}
            <div className="sticky top-0 z-20 space-y-3 border-b border-border/60 bg-background/95 px-4 py-3.5 backdrop-blur-sm sm:px-5">
              <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:thin]">
                {EMPLOYEE_ATTACHMENT_LIBRARY_GROUPS.map((group) => {
                  const active = libraryGroup === group.id;
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setLibraryGroup(group.id)}
                      className={cn(
                        'shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground shadow-soft'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      {group.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchDraft}
                    onChange={(e) => setSearchDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') applySearch();
                    }}
                    placeholder="بحث في الاسم أو الوصف أو اسم الملف…"
                    className="h-9 pr-9 text-sm"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" className="h-9 shrink-0" onClick={applySearch}>
                    بحث
                  </Button>
                  <FilterSelect
                    value={documentTypeFilter}
                    onValueChange={setDocumentTypeFilter}
                    options={subtypeOptions}
                    placeholder="نوع دقيق"
                  />
                  <FilterSelect
                    value={archiveScope}
                    onValueChange={(v) => setArchiveScope(v as OrganizationArchiveScope)}
                    options={ORGANIZATION_ARCHIVE_SCOPE_OPTIONS.map((o) => ({
                      value: o.value,
                      label: o.label,
                    }))}
                    placeholder="العرض"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground tabular-nums">
                  {attachmentsLoading
                    ? 'جاري التحديث…'
                    : rangeLabel(
                        attachmentsPagination.page,
                        attachmentsPagination.pageSize,
                        listTotalLabel,
                      )}
                  {hasAttachmentFilters ? (
                    <span className="ms-2 text-muted-foreground/80">
                      · مفلتر من {attachmentsTotal}
                    </span>
                  ) : null}
                </p>
                {hasAttachmentFilters ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={clearAttachmentFilters}
                  >
                    <X className="h-3 w-3" />
                    مسح الفلاتر
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <EmployeeProfilePagedList
                items={employeeAttachments}
                serverPagination={attachmentsPagination}
                loading={attachmentsLoading}
                empty={(
                  <Empty
                    icon={Paperclip}
                    text={
                      hasAttachmentFilters
                        ? 'لا توجد مرفقات مطابقة للفلتر الحالي'
                        : `لا توجد مرفقات لـ ${employee.name}`
                    }
                  />
                )}
                renderItems={(pageItems) => (
                  <ul className="divide-y divide-border/60 rounded-xl border border-border/60 bg-card/40">
                    {pageItems.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => setDetailAttachment(item)}
                          className="group flex w-full min-w-0 items-start gap-3 px-3 py-2.5 text-start transition-colors hover:bg-muted/40 sm:px-3.5"
                        >
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/8 text-primary">
                            <AttachmentIcon item={item} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1 flex flex-wrap items-center gap-1.5">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {item.name}
                                </p>
                                <Badge variant="secondary" className="text-[10px] font-normal">
                                  {employeeAttachmentDocumentTypeLabel(item.documentType)}
                                </Badge>
                                <span className={statusPillClass(item.isArchived ? 'inactive' : 'active')}>
                                  {item.isArchived ? 'مؤرشف' : 'نشط'}
                                </span>
                              </div>
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-primary/20 bg-primary/5 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                <Eye className="h-3 w-3" />
                                معاينة
                              </span>
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-muted-foreground">
                              <span>
                                {employeeAttachmentUploadCategoryLabel(item.uploadCategory)}
                              </span>
                              <span dir="ltr" className="truncate">
                                {formatAttachmentSize(item.sizeBytes)}
                              </span>
                              <DisplayDate value={item.createdAt} mode="date" />
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

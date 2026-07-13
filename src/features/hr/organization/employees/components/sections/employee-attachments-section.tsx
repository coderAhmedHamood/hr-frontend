'use client';

import * as React from 'react';
import {
  FileText,
  ImageIcon,
  Loader2,
  Paperclip,
  Plus,
  Search,
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
import { cn } from '@/shared/utils';

const DOCUMENT_TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'كل الأنواع' },
  ...EMPLOYEE_ATTACHMENT_DOCUMENT_TYPES.map((item) => ({
    value: item.value,
    label: item.label,
  })),
];

function AttachmentIcon({ item }: { item: EmployeeAttachmentDto }) {
  if (isImageAttachment(item.mimeType)) return <ImageIcon className="h-4 w-4" />;
  if (isPdfAttachment(item.mimeType)) return <FileText className="h-4 w-4" />;
  return <Paperclip className="h-4 w-4" />;
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
    documentTypeFilter,
    setDocumentTypeFilter,
    search,
    setSearch,
    hasAttachmentFilters,
    setUploadOpen,
    setDetailAttachment,
  } = model;

  const [searchDraft, setSearchDraft] = React.useState(search);

  React.useEffect(() => {
    setSearchDraft(search);
  }, [search]);

  const applySearch = () => setSearch(searchDraft.trim());

  if (attachmentsLoading && employeeAttachments.length === 0 && !attachmentsError) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        جاري تحميل المرفقات…
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-arabic-display text-lg font-semibold tracking-tight text-foreground">
            <Paperclip className="h-5 w-5 shrink-0 text-primary" />
            مرفقات الموظف
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            رفع وإدارة المستندات المرتبطة بالموظف — هوية، عقود، شهادات، وغيرها
          </p>
        </div>
        <Button
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
        <div className="shrink-0 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {attachmentsError}
        </div>
      ) : null}

      <div className="flex flex-col rounded-xl border border-border bg-card shadow-sm">
        <div className="flex shrink-0 flex-col gap-3 border-b border-border/60 bg-muted/20 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              سجل المرفقات
              <span className="mr-2 text-xs font-normal text-muted-foreground">
                ({hasAttachmentFilters ? attachmentsPagination.total ?? 0 : attachmentsTotal})
              </span>
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <FilterSelect
                value={archiveScope}
                onValueChange={(v) => setArchiveScope(v as OrganizationArchiveScope)}
                options={ORGANIZATION_ARCHIVE_SCOPE_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
                placeholder="العرض"
              />
              <FilterSelect
                value={documentTypeFilter}
                onValueChange={setDocumentTypeFilter}
                options={DOCUMENT_TYPE_FILTER_OPTIONS}
                placeholder="نوع المستند"
              />
            </div>
          </div>

          <div className="flex gap-2">
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
            <Button variant="outline" size="sm" className="h-9 shrink-0" onClick={applySearch}>
              بحث
            </Button>
          </div>
        </div>

        <div className="px-4 pb-4 pt-3">
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
              <div className="overflow-hidden rounded-lg border border-border/50">
                <div className="hidden border-b border-border/60 bg-muted/40 px-4 py-2 text-[11px] font-medium text-muted-foreground sm:grid sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_5.5rem] sm:gap-3">
                  <span>المرفق</span>
                  <span>النوع</span>
                  <span>تاريخ الرفع</span>
                  <span className="text-center">الحالة</span>
                </div>
                <div className="divide-y divide-border/60">
                  {pageItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDetailAttachment(item)}
                      className={cn(
                        'grid w-full gap-2 px-4 py-3 text-right transition-colors hover:bg-muted/25',
                        'sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_5.5rem] sm:items-center sm:gap-3',
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/10 text-primary">
                          <AttachmentIcon item={item} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                          <p className="mt-0.5 truncate text-[11px] text-muted-foreground" dir="ltr">
                            {item.originalFileName}
                            {' · '}
                            {formatAttachmentSize(item.sizeBytes)}
                          </p>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-foreground/90">
                          {employeeAttachmentDocumentTypeLabel(item.documentType)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {employeeAttachmentUploadCategoryLabel(item.uploadCategory)}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground sm:text-sm">
                        <DisplayDate value={item.createdAt} mode="datetime" />
                      </div>
                      <div className="flex sm:justify-center">
                        <Badge variant={item.isArchived ? 'secondary' : 'success'} className="text-[9px]">
                          {item.isArchived ? 'مؤرشف' : 'نشط'}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          />
        </div>
      </div>
    </section>
  );
}

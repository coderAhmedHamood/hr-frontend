'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Trash2, Eye, FileText, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRecruitmentStore } from '@/features/hr/recruitment/lib/store';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { ApplicantDetailDialog } from './applicant-detail-dialog';
import type { RecruitmentApplicant, RecruitmentForm } from '@/features/hr/recruitment/lib/types';
import { DisplayDate } from '@/components/ui/table-cells';
import Link from 'next/link';

export function ApplicantManagementClient() {
  const searchParams = useSearchParams();
  const initialFormId = searchParams.get('form') ?? '';

  const { forms, applicants, deleteApplicant } = useRecruitmentStore();
  const [selectedFormId, setSelectedFormId] = React.useState(initialFormId);
  const [search, setSearch] = React.useState('');
  const [viewApplicant, setViewApplicant] = React.useState<RecruitmentApplicant | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const selectedForm = React.useMemo(
    () => forms.find((f) => f.id === selectedFormId),
    [forms, selectedFormId],
  );

  const filtered = React.useMemo(() => {
    let list = applicants;
    if (selectedFormId) {
      list = list.filter((a) => a.formId === selectedFormId);
    }
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((a) => {
      const vals = Object.values(a.answers).filter((v): v is string => typeof v === 'string').join(' ').toLowerCase();
      return vals.includes(q) || (a.cvFileName?.toLowerCase().includes(q) ?? false);
    });
  }, [applicants, selectedFormId, search]);

  const getApplicantForm = React.useCallback(
    (applicant: RecruitmentApplicant): RecruitmentForm | undefined => forms.find((f) => f.id === applicant.formId),
    [forms],
  );

  const activeFilterCount = (search.trim() ? 1 : 0) + (selectedFormId ? 1 : 0);

  usePageHeaderActions(
    () => <FilterToggleButton activeFilterCount={activeFilterCount} />,
    [activeFilterCount],
  );

  useEntityFilterSlot(
    () => (
      <div className="rounded-xl border border-border/60 bg-card/80 px-3 py-2.5 shadow-sm backdrop-blur-sm sm:px-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث في المتقدمين…" className="h-8 pr-9 text-xs" />
          </div>
          <select
            value={selectedFormId}
            onChange={(e) => setSelectedFormId(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-3 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            <option value="">جميع النماذج</option>
            {forms.map((f) => (
              <option key={f.id} value={f.id}>{f.title}</option>
            ))}
          </select>
        </div>
      </div>
    ),
    [search, selectedFormId, forms],
  );

  const handleDelete = (id: string) => {
    deleteApplicant(id);
    setDeleteId(null);
    toast.success('تم حذف المتقدم');
  };

  const getPrimaryLabel = (applicant: RecruitmentApplicant): string => {
    const form = getApplicantForm(applicant);
    const nameField = form?.fields.find((f) => f.id.includes('name') || f.label.includes('اسم'));
    const val = nameField ? applicant.answers[nameField.id] : undefined;
    return typeof val === 'string' && val ? val : 'متقدم مجهول';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/hr/recruitment/admin">
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> العودة
          </Button>
        </Link>
      </div>

      {selectedForm && (
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-2 text-sm">
          <span className="text-muted-foreground">النموذج المحدد:</span>{' '}
          <span className="font-medium">{selectedForm.title}</span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <Search className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {search.trim() || selectedFormId ? 'لا توجد نتائج مطابقة' : 'لا يوجد متقدمون بعد.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((applicant) => {
            const form = getApplicantForm(applicant);
            return (
              <div key={applicant.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-soft transition-shadow hover:shadow-elevated">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{getPrimaryLabel(applicant)}</span>
                    {applicant.cvFileName && (
                      <Badge variant="outline" className="gap-1 text-[10px] h-5">
                        <FileText className="h-3 w-3" /> CV
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{form?.title ?? '—'}</span>
                    <span>·</span>
                    <DisplayDate value={applicant.submittedAt} mode="datetime" />
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setViewApplicant(applicant)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(applicant.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ApplicantDetailDialog
        applicant={viewApplicant}
        form={viewApplicant ? getApplicantForm(viewApplicant) : undefined}
        open={!!viewApplicant}
        onOpenChange={(v) => { if (!v) setViewApplicant(null); }}
      />

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-luxe space-y-4">
            <h3 className="text-lg font-semibold">حذف المتقدم</h3>
            <p className="text-sm text-muted-foreground">سيتم حذف بيانات المتقدم نهائياً. لا يمكن التراجع.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>إلغاء</Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(deleteId)}>حذف</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

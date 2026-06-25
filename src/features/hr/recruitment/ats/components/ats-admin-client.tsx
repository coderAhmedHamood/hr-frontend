'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Briefcase,
  Pencil, Trash2, Share2, Power, Eye, ArrowUpRight, Users,
  ClipboardList, FileEdit, ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AtsJob } from '@/features/hr/recruitment/lib/ats/types';
import { QRCodeDialog } from '@/features/hr/recruitment/shared/qr-code-dialog';
import { RecruitmentJobNav } from '@/features/hr/recruitment/ats/components/recruitment-job-nav';
import { recruitmentJobRoutes } from '@/features/hr/recruitment/lib/recruitment-routes';
import {
  RECRUITMENT_ARCHIVE_SCOPE_DEFAULT,
} from '@/features/hr/recruitment/lib/archive-scope';
import type { RecruitmentArchiveScope } from '@/features/hr/recruitment/lib/api/types';
import { useRecruitmentApplicantsList, useRecruitmentJobsList, useRecruitmentMutations } from '@/features/hr/recruitment/hooks/useRecruitment';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';

const JOB_TYPE_AR: Record<string, string> = {
  'full-time': 'دوام كامل',
  'part-time': 'دوام جزئي',
  contract: 'عقد',
  internship: 'تدريب',
};

export function AtsAdminClient() {
  const router = useRouter();
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [qrJob, setQrJob] = React.useState<AtsJob | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [archiveScope, setArchiveScope] = React.useState<RecruitmentArchiveScope>(
    RECRUITMENT_ARCHIVE_SCOPE_DEFAULT,
  );

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: jobsData, isLoading, isError, error } = useRecruitmentJobsList(
    debouncedSearch || undefined,
    archiveScope,
  );
  const { data: applicants = [] } = useRecruitmentApplicantsList({});
  const { deleteJob, toggleJobActive } = useRecruitmentMutations();

  const jobs = jobsData?.jobs ?? [];

  const handleDelete = async (id: string) => {
    try {
      await deleteJob.mutateAsync(id);
      setDeleteId(null);
      toast.success('تم أرشفة الوظيفة ومتقدميها');
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'recruitment.jobs.delete');
      toast.error(displayMessage);
    }
  };

  const handleToggle = async (job: AtsJob) => {
    try {
      await toggleJobActive.mutateAsync(job.id);
      toast.success(
        job.isActive
          ? 'تم إيقاف الوظيفة وأرشفة متقدميها'
          : 'تم تفعيل الوظيفة',
      );
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'recruitment.jobs.toggle');
      toast.error(displayMessage);
    }
  };

  if (isError) {
    const { displayMessage } = handleApiError(error, 'recruitment.jobs.list');
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-3">
          <p className="text-sm text-destructive">{displayMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <RecruitmentJobNav />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative max-w-xs w-full min-w-[12rem]">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="بحث بالوظيفة أو القسم…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>        </div>
        <Button variant="luxe" size="sm" onClick={() => router.push('/hr/recruitment/ats-admin/jobs/create')}>
          <Plus className="h-4 w-4 me-1" /> وظيفة جديدة
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href="/careers" target="_blank" rel="noopener noreferrer">بوابة التوظيف العامة</a>
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">جاري التحميل…</CardContent>
        </Card>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <Briefcase className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium">لا توجد وظائف</p>
            <p className="text-xs text-muted-foreground">أنشئ وظيفة جديدة من الباكند أو من هنا</p>
            <Button variant="luxe" size="sm" className="mt-1" onClick={() => router.push('/hr/recruitment/ats-admin/jobs/create')}>
              <Plus className="h-4 w-4 me-1" /> إنشاء وظيفة
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => {
            const jobApps = applicants.filter((a) => a.jobId === job.id);
            const hired = jobApps.filter((a) => a.pipelineStage === 'hired').length;
            const routes = recruitmentJobRoutes(job.id, job.slug);
            return (
              <Card key={job.id} className="group relative overflow-hidden transition-all hover:shadow-elevated">
                <div className={`absolute inset-y-0 right-0 w-1 ${job.isActive ? 'bg-emerald-400' : 'bg-muted-foreground/20'}`} />
                <CardContent className="p-5 pr-6">
                  <button
                    type="button"
                    className="mb-3 flex w-full items-start justify-between gap-2 text-left"
                    onClick={() => router.push(routes.hub)}
                  >
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-base leading-tight group-hover:text-primary transition-colors">{job.title}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">{job.department} · {job.location}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      {job.isArchived && (
                        <Badge variant="outline" className="text-[10px] px-2 py-0 text-amber-700 border-amber-500/40">
                          مؤرشف
                        </Badge>
                      )}
                      <Badge variant={job.isActive ? 'default' : 'secondary'} className="text-[10px] px-2 py-0">
                        {job.isActive ? 'نشطة' : 'متوقفة'}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-2 py-0 text-muted-foreground">
                        {JOB_TYPE_AR[job.type]}
                      </Badge>
                    </div>
                  </button>

                  <p className="  text-xs text-muted-foreground leading-relaxed mb-3">{job.description}</p>

                  <div className="mb-4 flex flex-wrap gap-1.5">
                    <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px] px-2.5" onClick={() => router.push(routes.applicants)}>
                      <Users className="h-3 w-3" />
                      المتقدمون ({jobApps.length})
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px] px-2.5" onClick={() => router.push(routes.pipeline)}>
                      <ClipboardList className="h-3 w-3" />
                      المسار
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px] px-2.5" onClick={() => router.push(routes.editForm)}>
                      <FileEdit className="h-3 w-3" />
                      النموذج
                    </Button>
                    {routes.publicApply && (
                      <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px] px-2.5" asChild>
                        <a href={routes.publicApply} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                          التقديم
                        </a>
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {hired > 0 && (
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <ArrowUpRight className="h-3.5 w-3.5" /> {hired} معيّن
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        <code className="text-[10px]">/f/{job.slug}</code>
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground"
                        title={job.isActive ? 'إيقاف' : 'تفعيل'}
                        onClick={() => void handleToggle(job)}
                      >
                        <Power className={`h-3.5 w-3.5 ${job.isActive ? 'text-emerald-500' : ''}`} />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground" onClick={() => setQrJob(job)}>
                        <Share2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground" onClick={() => router.push(`/hr/recruitment/ats-admin/jobs/create?edit=${job.id}`)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive/60 hover:text-destructive" title="أرشفة الوظيفة" onClick={() => setDeleteId(job.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <QRCodeDialog job={qrJob} open={!!qrJob} onOpenChange={() => setQrJob(null)} />

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-sm shadow-xl">
            <CardContent className="p-6 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold">تأكيد الأرشفة</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  سيتم أرشفة الوظيفة وإيقافها وأرشفة جميع المتقدمين المرتبطين بها. لا يُحذف شيء نهائياً.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>إلغاء</Button>
                <Button variant="destructive" size="sm" onClick={() => void handleDelete(deleteId)} disabled={deleteJob.isPending}>
                  أرشفة
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

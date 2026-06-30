'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Users,
  ClipboardList,
  FileEdit,
  ExternalLink,
  Share2,
  Power,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  useRecruitmentJobDetail,
  useRecruitmentJobStats,
  useRecruitmentMutations,
} from '@/features/hr/recruitment/hooks/useRecruitment';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { ATS_STAGE_LABELS } from '@/features/hr/recruitment/lib/ats/stage-styles';
import type { AtsPipelineStage } from '@/features/hr/recruitment/lib/ats/types';
import { recruitmentJobRoutes } from '@/features/hr/recruitment/lib/recruitment-routes';
import { RecruitmentJobNav } from '@/features/hr/recruitment/ats/components/recruitment-job-nav';
import { QRCodeDialog } from '@/features/hr/recruitment/shared/qr-code-dialog';
import { DisplayDate } from '@/components/ui/table-cells';
import { JOB_TYPE_AR } from '@/features/hr/recruitment/ats/constants/ats-jobs-list';

const STAGE_ORDER: AtsPipelineStage[] = [
  'applied',
  'screening',
  'interview',
  'technical',
  'offer',
  'hired',
  'rejected',
];

export function JobHubClient({ jobId }: { jobId: string }) {
  const router = useRouter();
  const { data: jobData, isLoading, isError } = useRecruitmentJobDetail(jobId);
  const { data: stats } = useRecruitmentJobStats(jobId);
  const { toggleJobActive } = useRecruitmentMutations();
  const job = jobData?.job;
  const [qrOpen, setQrOpen] = React.useState(false);

  if (isLoading) {
    return <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">جاري التحميل…</CardContent></Card>;
  }

  if (isError || !job) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm font-medium">الوظيفة غير موجودة</p>
          <Button variant="outline" size="sm" onClick={() => router.push('/hr/recruitment/ats-admin')}>
            العودة إلى الوظائف
          </Button>
        </CardContent>
      </Card>
    );
  }

  const routes = recruitmentJobRoutes(job.id, job.slug);
  const stageCounts = stats?.stageCounts ?? STAGE_ORDER.reduce(
    (acc, stage) => { acc[stage] = 0; return acc; },
    {} as Record<AtsPipelineStage, number>,
  );
  const totalApplicants = stats?.totalApplicants ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-muted-foreground"
          onClick={() => router.push('/hr/recruitment/ats-admin')}
        >
          <ArrowRight className="h-4 w-4" />
          جميع الوظائف
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setQrOpen(true)}>
            <Share2 className="h-3.5 w-3.5" />
            مشاركة
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => router.push(routes.editForm)}
          >
            <Pencil className="h-3.5 w-3.5" />
            تعديل
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={async () => {
              try {
                await toggleJobActive.mutateAsync(job.id);
                toast.success(job.isActive ? 'تم إيقاف الوظيفة' : 'تم تفعيل الوظيفة');
              } catch (err) {
                const { displayMessage } = handleApiError(err, 'recruitment.jobs.toggle');
                toast.error(displayMessage);
              }
            }}
          >
            <Power className={`h-3.5 w-3.5 ${job.isActive ? 'text-emerald-500' : ''}`} />
            {job.isActive ? 'إيقاف' : 'تفعيل'}
          </Button>
        </div>
      </div>

      <RecruitmentJobNav jobId={jobId} active="job" />

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">{job.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {job.department} · {job.location} · {JOB_TYPE_AR[job.type]}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={job.isActive ? 'default' : 'secondary'}>
                {job.isActive ? 'نشطة' : 'متوقفة'}
              </Badge>
              <Badge variant="outline">{JOB_TYPE_AR[job.type]}</Badge>
            </div>
          </div>

          {job.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">{job.description}</p>
          )}

          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>
              تاريخ الإنشاء: <DisplayDate value={job.createdAt} mode="date" className="text-xs" />
            </span>
            <span>
              رابط التقديم: <code className="text-[11px]">/f/{job.slug}</code>
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card
          className="cursor-pointer transition-all hover:shadow-elevated hover:-translate-y-px"
          onClick={() => router.push(routes.applicants)}
        >
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{totalApplicants}</p>
              <p className="text-xs text-muted-foreground">متقدم لهذه الوظيفة</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-all hover:shadow-elevated hover:-translate-y-px"
          onClick={() => router.push(routes.pipeline)}
        >
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15">
              <ClipboardList className="h-6 w-6 text-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{stats?.hiredCount ?? stageCounts.hired ?? 0}</p>
              <p className="text-xs text-muted-foreground">تم التعيين · افتح المسار</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-all hover:shadow-elevated hover:-translate-y-px"
          onClick={() => router.push(routes.editForm)}
        >
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
              <FileEdit className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">نموذج التقديم</p>
              <p className="text-xs text-muted-foreground">تعديل حقول النموذج</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold">توزيع المتقدمين على المراحل</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {STAGE_ORDER.map((stage) => (
              <button
                key={stage}
                type="button"
                onClick={() => router.push(`${routes.pipeline}&stage=${stage}`)}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-left transition-colors hover:bg-primary/5 hover:border-primary/30"
              >
                <span className="text-xs text-muted-foreground">{ATS_STAGE_LABELS[stage]}</span>
                <span className="text-sm font-bold tabular-nums">{stageCounts[stage]}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="luxe" size="sm" className="gap-1.5" onClick={() => router.push(routes.applicants)}>
          <Users className="h-3.5 w-3.5" />
          عرض المتقدمين
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => router.push(routes.pipeline)}>
          <ClipboardList className="h-3.5 w-3.5" />
          مسار التوظيف
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => router.push(routes.editForm)}>
          <FileEdit className="h-3.5 w-3.5" />
          نموذج التقديم
        </Button>
        {routes.publicApply && (
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <a href={routes.publicApply} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              صفحة التقديم العامة
            </a>
          </Button>
        )}
      </div>

      <QRCodeDialog job={job} open={qrOpen} onOpenChange={setQrOpen} />
    </div>
  );
}

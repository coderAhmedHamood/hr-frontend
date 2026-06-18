'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Briefcase,
  Pencil, Trash2, Share2, Power, Eye, ArrowUpRight, Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAtsStore } from '@/features/hr/recruitment/lib/ats/store';
import type { AtsJob } from '@/features/hr/recruitment/lib/ats/types';
import { QRCodeDialog } from '@/features/hr/recruitment/shared/qr-code-dialog';

const JOB_TYPE_AR: Record<string, string> = {
  'full-time': 'دوام كامل',
  'part-time': 'دوام جزئي',
  contract: 'عقد',
  internship: 'تدريب',
};

export function AtsAdminClient() {
  const router = useRouter();
  const { getTenantJobs, getTenantApplicants, updateJob, deleteJob } = useAtsStore();
  const jobs = getTenantJobs();
  const applicants = getTenantApplicants();
  const [search, setSearch] = React.useState('');
  const [qrJob, setQrJob] = React.useState<AtsJob | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const filtered = jobs.filter((j) =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.department.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string) => {
    deleteJob(id);
    setDeleteId(null);
    toast.success('تم حذف الوظيفة');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs w-full">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="بحث بالوظيفة أو القسم…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Button variant="luxe" size="sm" onClick={() => router.push('/hr/recruitment/ats-admin/jobs/create')}>
          <Plus className="h-4 w-4 me-1" /> وظيفة جديدة
        </Button>
      </div>

      {/* Jobs */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <Briefcase className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium">لا توجد وظائف</p>
            <p className="text-xs text-muted-foreground">أنشئ وظيفة جديدة للبدء في استقبال الطلبات</p>
            <Button variant="luxe" size="sm" className="mt-1" onClick={() => router.push('/hr/recruitment/ats-admin/jobs/create')}>
              <Plus className="h-4 w-4 me-1" /> إنشاء وظيفة
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((job) => {
            const jobApps = applicants.filter((a) => a.jobId === job.id);
            const hired = jobApps.filter((a) => a.pipelineStage === 'hired').length;
            return (
              <Card key={job.id} className="group relative overflow-hidden transition-all hover:shadow-elevated">
                {/* active indicator */}
                <div className={`absolute inset-y-0 right-0 w-1 ${job.isActive ? 'bg-emerald-400' : 'bg-muted-foreground/20'}`} />
                <CardContent className="p-5 pr-6">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-base leading-tight">{job.title}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">{job.department} · {job.location}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <Badge variant={job.isActive ? 'default' : 'secondary'} className="text-[10px] px-2 py-0">
                        {job.isActive ? 'نشطة' : 'متوقفة'}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-2 py-0 text-muted-foreground">
                        {JOB_TYPE_AR[job.type]}
                      </Badge>
                    </div>
                  </div>

                  <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed mb-4">{job.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium">
                        <Users className="h-3.5 w-3.5" /> {jobApps.length}
                      </span>
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
                        onClick={() => updateJob(job.id, { isActive: !job.isActive })}
                      >
                        <Power className={`h-3.5 w-3.5 ${job.isActive ? 'text-emerald-500' : ''}`} />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground" onClick={() => setQrJob(job)}>
                        <Share2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground" onClick={() => router.push(`/hr/recruitment/ats-admin/jobs/create?edit=${job.id}`)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive/60 hover:text-destructive" onClick={() => setDeleteId(job.id)}>
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
                <h3 className="font-semibold">تأكيد الحذف</h3>
                <p className="mt-1 text-sm text-muted-foreground">سيتم حذف الوظيفة والنموذج والمتقدمين المرتبطين بها نهائياً.</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>إلغاء</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(deleteId)}>حذف</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

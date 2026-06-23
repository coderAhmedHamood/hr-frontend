'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  ClipboardList,
  FileEdit,
  ExternalLink,
  Calendar,
  Type,
  Hash,
  List,
  Upload,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  AtsApplicant,
  AtsForm,
  AtsFormFieldType,
  AtsPipelineStage,
} from '@/features/hr/recruitment/lib/ats/types';
import { useRecruitmentJobsList, useRecruitmentMutations } from '@/features/hr/recruitment/hooks/useRecruitment';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { getApplicantFieldValue } from '@/features/hr/recruitment/lib/ats/submit-application-payload';
import { getApplicantName, getInitials } from '@/features/hr/recruitment/lib/ats/utils';
import { ATS_STAGE_BADGE, ATS_STAGE_LABELS, scoreBarTone } from '@/features/hr/recruitment/lib/ats/stage-styles';
import { recruitmentJobRoutes } from '@/features/hr/recruitment/lib/recruitment-routes';
import { DisplayDate } from '@/components/ui/table-cells';

const FIELD_ICONS: Record<AtsFormFieldType, React.ElementType> = {
  text: Type,
  number: Hash,
  select: List,
  file: Upload,
};

const STAGE_ORDER: AtsPipelineStage[] = [
  'applied',
  'screening',
  'interview',
  'technical',
  'offer',
  'hired',
  'rejected',
];

interface AtsApplicantDetailDialogProps {
  applicant: AtsApplicant | null;
  form: AtsForm | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AtsApplicantDetailDialog({
  applicant,
  form,
  open,
  onOpenChange,
}: AtsApplicantDetailDialogProps) {
  const router = useRouter();
  const { data: jobsData } = useRecruitmentJobsList();
  const { moveApplicantStage, deleteApplicant, scoreApplicant } = useRecruitmentMutations();

  if (!applicant || !form) return null;

  const job = jobsData?.jobs.find((j) => j.id === applicant.jobId);
  const name = getApplicantName(applicant, form.fields);
  const initials = getInitials(name);
  const routes = recruitmentJobRoutes(applicant.jobId, job?.slug);

  const handleStageChange = async (stage: AtsPipelineStage) => {
    try {
      await moveApplicantStage.mutateAsync({ id: applicant.id, dto: { pipelineStage: stage } });
      toast.success(`تم نقل المتقدم إلى: ${ATS_STAGE_LABELS[stage]}`);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'recruitment.applicants.stage');
      toast.error(displayMessage);
    }
  };

  const handleScore = async () => {
    try {
      await scoreApplicant.mutateAsync(applicant.id);
      toast.success('تم تحديث التقييم التلقائي');
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'recruitment.applicants.score');
      toast.error(displayMessage);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteApplicant.mutateAsync(applicant.id);
      toast.success('تم أرشفة المتقدم');
      onOpenChange(false);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'recruitment.applicants.delete');
      toast.error(displayMessage);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl overflow-hidden p-0">
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background px-6 pb-6 pt-8">
          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-lg font-bold text-primary-foreground shadow-lg">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-bold leading-tight">{name}</DialogTitle>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {job && (
                  <Badge variant="secondary" className="gap-1 text-[10px] font-normal">
                    <Briefcase className="h-3 w-3" />
                    {job.title}
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={`text-[10px] font-normal ${ATS_STAGE_BADGE[applicant.pipelineStage]}`}
                >
                  {ATS_STAGE_LABELS[applicant.pipelineStage]}
                </Badge>
                <Badge variant="outline" className="gap-1 text-[10px] font-normal text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <DisplayDate value={applicant.submittedAt} mode="datetime" className="text-[10px] font-normal" />
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-2 space-y-5">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => {
                onOpenChange(false);
                router.push(routes.hub);
              }}
            >
              <Briefcase className="h-3.5 w-3.5" />
              الوظيفة
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => {
                onOpenChange(false);
                router.push(routes.pipeline);
              }}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              مسار التوظيف
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => {
                onOpenChange(false);
                router.push(routes.editForm);
              }}
            >
              <FileEdit className="h-3.5 w-3.5" />
              نموذج التقديم
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">مرحلة التوظيف</p>
            <Select value={applicant.pipelineStage} onValueChange={(v) => handleStageChange(v as AtsPipelineStage)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGE_ORDER.map((stage) => (
                  <SelectItem key={stage} value={stage} className="text-xs">
                    {ATS_STAGE_LABELS[stage]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {applicant.score ? (
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">التقييم التلقائي</span>
                <span className={`text-sm font-bold tabular-nums ${scoreBarTone(applicant.score.finalScore).text}`}>
                  {applicant.score.finalScore}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${scoreBarTone(applicant.score.finalScore).bar}`}
                  style={{ width: `${applicant.score.finalScore}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{applicant.score.reasoning}</p>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              disabled={scoreApplicant.isPending}
              onClick={handleScore}
            >
              {scoreApplicant.isPending ? 'جاري التقييم...' : 'تقييم تلقائي'}
            </Button>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {form.fields.map((field) => {
              const value = getApplicantFieldValue(applicant, field);
              const Icon = FIELD_ICONS[field.type];
              const hasValue = value !== undefined && value !== '';
              return (
                <div
                  key={field.id}
                  className={`rounded-xl border p-4 ${hasValue ? 'bg-card border-border' : 'bg-muted/20 border-border/50'}`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md border bg-muted/40 text-[10px]">
                      <Icon className="h-3 w-3" />
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">{field.label}</span>
                  </div>
                  <p className={`text-sm font-semibold ${hasValue ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {hasValue ? String(value) : '—'}
                  </p>
                </div>
              );
            })}
          </div>

          <Separator />

          <div className="flex justify-between">
            <Button variant="destructive" size="sm" className="gap-1.5 text-xs" onClick={handleDelete}>
              <Trash2 className="h-3.5 w-3.5" />
              أرشفة المتقدم
            </Button>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              إغلاق
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

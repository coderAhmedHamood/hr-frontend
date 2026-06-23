'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Users,
  ClipboardList,
  FileEdit,
  ExternalLink,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '@/shared/utils';
import { Badge } from '@/components/ui/badge';
import {
  recruitmentGlobalRoutes,
  recruitmentJobRoutes,
} from '@/features/hr/recruitment/lib/recruitment-routes';
import { useRecruitmentJobDetail, useRecruitmentJobStats } from '@/features/hr/recruitment/hooks/useRecruitment';

export type RecruitmentNavSection = 'job' | 'applicants' | 'pipeline' | 'form' | 'apply';

interface RecruitmentJobNavProps {
  jobId?: string;
  active?: RecruitmentNavSection;
  className?: string;
}

export function RecruitmentJobNav({ jobId, active, className }: RecruitmentJobNavProps) {
  const { data: jobDetail } = useRecruitmentJobDetail(jobId);
  const { data: stats } = useRecruitmentJobStats(jobId);
  const job = jobDetail?.job;
  const applicantCount = stats?.totalApplicants ?? 0;
  const routes = jobId ? recruitmentJobRoutes(jobId, job?.slug) : null;

  const items: {
    key: RecruitmentNavSection | 'all-jobs';
    label: string;
    href: string;
    icon: React.ElementType;
    external?: boolean;
    count?: number;
  }[] = jobId && routes
    ? [
        { key: 'all-jobs', label: 'جميع الوظائف', href: recruitmentGlobalRoutes.jobs, icon: LayoutGrid },
        { key: 'job', label: 'الوظيفة', href: routes.hub, icon: Briefcase },
        {
          key: 'applicants',
          label: 'المتقدمون',
          href: routes.applicants,
          icon: Users,
          count: applicantCount,
        },
        { key: 'pipeline', label: 'مسار التوظيف', href: routes.pipeline, icon: ClipboardList },
        { key: 'form', label: 'نموذج التقديم', href: routes.editForm, icon: FileEdit },
        ...(routes.publicApply
          ? [{
              key: 'apply' as RecruitmentNavSection,
              label: 'صفحة التقديم',
              href: routes.publicApply,
              icon: ExternalLink,
              external: true,
            }]
          : []),
      ]
    : [
        { key: 'all-jobs', label: 'الوظائف', href: recruitmentGlobalRoutes.jobs, icon: Briefcase },
        { key: 'applicants', label: 'المتقدمون', href: recruitmentGlobalRoutes.applicants, icon: Users },
        { key: 'pipeline', label: 'مسار التوظيف', href: recruitmentGlobalRoutes.pipeline, icon: ClipboardList },
      ];

  return (
    <div className={cn('space-y-3', className)}>
      {job && (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1 text-xs font-normal">
            <Briefcase className="h-3 w-3" />
            {job.title}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {job.department} · {job.location}
          </span>
        </div>
      )}

      <nav className="flex flex-wrap gap-1.5" aria-label="تنقل التوظيف">
        {items.map((item, index) => {
          const isActive =
            item.key === 'all-jobs'
              ? active === undefined && !jobId
              : active === item.key;
          const isExternal = item.external === true;

          const linkClass = cn(
            'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
            isActive
              ? 'border-primary bg-primary/10 text-primary shadow-sm'
              : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground',
          );

          const content = (
            <>
              <item.icon className="h-3.5 w-3.5 shrink-0" />
              {item.label}
              {item.count !== undefined && item.count > 0 && (
                <span className="rounded-full bg-primary/15 px-1.5 py-px text-[10px] font-bold tabular-nums text-primary">
                  {item.count}
                </span>
              )}
              {isExternal && <ExternalLink className="h-3 w-3 opacity-60" />}
            </>
          );

          if (isExternal) {
            return (
              <a
                key={`${item.key}-${index}`}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                {content}
              </a>
            );
          }

          return (
            <Link key={`${item.key}-${index}`} href={item.href} className={linkClass}>
              {content}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

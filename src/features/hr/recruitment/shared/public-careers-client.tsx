'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Briefcase,
  MapPin,
  Building2,
  Search,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePublicRecruitmentJobsList } from '@/features/hr/recruitment/hooks/usePublicRecruitment';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';

const JOB_TYPE_AR: Record<string, string> = {
  'full-time': 'دوام كامل',
  'part-time': 'دوام جزئي',
  contract: 'عقد',
  internship: 'تدريب',
};

export function PublicCareersClient() {
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: jobs = [], isLoading, isError, error } = usePublicRecruitmentJobsList(
    debouncedSearch.trim() || undefined,
  );

  const activeJobs = jobs.filter((j) => j.isActive);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background px-6 py-10 sm:px-10 sm:py-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, hsl(var(--primary)) 0%, transparent 45%)' }}
        />
        <div className="relative max-w-2xl">
          <Badge variant="secondary" className="mb-3 text-[10px]">بوابة التوظيف</Badge>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">الوظائف المتاحة</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            تصفح الوظائف النشطة وقدّم طلبك مباشرة عبر النموذج المخصص لكل وظيفة.
          </p>
        </div>
      </section>

      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="بحث بالمسمى، القسم، أو الموقع…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-9"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-5 space-y-3">
                <div className="h-5 w-2/3 rounded-md bg-muted animate-pulse" />
                <div className="h-4 w-1/2 rounded-md bg-muted animate-pulse" />
                <div className="h-12 rounded-md bg-muted animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <p className="text-sm text-destructive">
              {handleApiError(error, 'recruitment.public.jobs.list').displayMessage}
            </p>
            <p className="text-xs text-muted-foreground">
              للزوار بدون تسجيل: أضف GET /public/recruitment/jobs في الباكند أو عيّن RECRUITMENT_PUBLIC_LIST_TOKEN في .env
            </p>
          </CardContent>
        </Card>
      ) : activeJobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <Briefcase className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium">لا توجد وظائف نشطة حالياً</p>
            <p className="text-xs text-muted-foreground">جرّب تغيير البحث أو عد لاحقاً</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {activeJobs.length} وظيفة متاحة للتقديم
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeJobs.map((job) => (
              <Link key={job.id} href={`/f/${job.slug}`} className="group block">
                <Card className="h-full overflow-hidden transition-all hover:shadow-elevated hover:-translate-y-0.5">
                  <div className="h-1 w-full bg-emerald-500/80" />
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {job.title}
                      </h2>
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {JOB_TYPE_AR[job.type] ?? job.type}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {job.department}
                      </span>
                      {job.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {job.location}
                        </span>
                      )}
                    </div>

                    {job.description && (
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                        {job.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                        <Clock className="h-3.5 w-3.5" />
                        متاح للتقديم
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                        قدّم الآن
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function PublicCareersShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/careers" className="flex items-center gap-2.5">
            <Image src="/logo.webp" alt="روز" width={32} height={32} className="rounded-lg" />
            <div className="leading-tight">
              <p className="text-sm font-semibold">روز</p>
              <p className="text-[10px] text-muted-foreground">التوظيف</p>
            </div>
          </Link>
          <Button variant="outline" size="sm" className="text-xs" asChild>
            <Link href="/careers">جميع الوظائف</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>

      <footer className="border-t border-border/60 bg-background/60">
        <div className="mx-auto max-w-5xl px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
          بوابة التوظيف — روز لإدارة الموارد البشرية
        </div>
      </footer>
    </div>
  );
}

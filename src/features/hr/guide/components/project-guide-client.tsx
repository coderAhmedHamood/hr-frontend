'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { BookOpen, Menu, X } from 'lucide-react';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/utils';
import {
  DEFAULT_GUIDE_SLUG,
  getGuidePage,
} from '@/features/hr/guide/constants/project-guide-content';
import { ProjectGuideSidebar } from '@/features/hr/guide/components/project-guide-sidebar';
import { ProjectGuideToc } from '@/features/hr/guide/components/project-guide-toc';
import { ProjectGuideArticle } from '@/features/hr/guide/components/project-guide-article';

export function ProjectGuideClient() {
  const params = useParams();
  const slug = typeof params?.slug === 'string' ? params.slug : DEFAULT_GUIDE_SLUG;
  const page = getGuidePage(slug) ?? getGuidePage(DEFAULT_GUIDE_SLUG)!;
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  useSetPageTitle({
    titleAr: 'دليل المشروع',
    descriptionAr: page.title,
    iconName: 'BookOpen',
  });

  React.useEffect(() => {
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  return (
    <div className="-m-4 flex min-h-[calc(100vh-8.5rem)] flex-col bg-background lg:-m-4">
      {/* Docs header bar */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">دليل روز — التهيئة والاستخدام</p>
            <p className="truncate text-xs text-muted-foreground">توثيق نظري للمستخدمين</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="lg:hidden shrink-0"
          onClick={() => setMobileNavOpen((v) => !v)}
        >
          {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          <span className="ms-2">الفهرس</span>
        </Button>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Left sidebar */}
        <aside
          className={cn(
            'shrink-0 border-e border-border bg-card/50 overflow-y-auto',
            'fixed inset-y-0 start-0 z-50 w-72 pt-[7.5rem] pb-6 px-3 lg:static lg:z-auto lg:w-64 lg:pt-4 lg:pb-8',
            mobileNavOpen ? 'block' : 'hidden lg:block',
          )}
        >
          <ProjectGuideSidebar />
        </aside>

        {mobileNavOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            aria-label="إغلاق القائمة"
            onClick={() => setMobileNavOpen(false)}
          />
        ) : null}

        {/* Main content */}
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-10">
            <ProjectGuideArticle page={page} />
          </div>
        </main>

        {/* Right TOC */}
        <aside className="hidden w-52 shrink-0 overflow-y-auto border-s border-border bg-card/30 px-4 py-8 xl:block">
          <ProjectGuideToc blocks={page.blocks} className="sticky top-4" />
        </aside>
      </div>
    </div>
  );
}

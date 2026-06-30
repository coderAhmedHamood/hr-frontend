'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
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
  const mainRef = React.useRef<HTMLElement>(null);

  useSetPageTitle({
    titleAr: 'دليل المشروع',
    descriptionAr: page.title,
    iconName: 'BookOpen',
  });

  React.useEffect(() => {
    setMobileNavOpen(false);
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  React.useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  usePageHeaderActions(
    () => (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 shrink-0 lg:hidden"
        aria-label="فهرس الدليل"
        onClick={() => setMobileNavOpen((v) => !v)}
      >
        {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        <span className="ms-2 hidden sm:inline">الفهرس</span>
      </Button>
    ),
    [mobileNavOpen],
  );

  return (
    <div className="-m-4 flex min-h-0 flex-1 flex-col overflow-hidden bg-background lg:-m-4">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left sidebar — mobile drawer + desktop column */}
        <aside
          className={cn(
            'shrink-0 border-e border-border bg-card text-card-foreground',
            'fixed top-28 bottom-0 start-0 z-50 flex w-72 flex-col shadow-elevated',
            'lg:static lg:z-auto lg:w-64 lg:shadow-none',
            mobileNavOpen ? 'flex' : 'hidden lg:flex',
          )}
          aria-label="فهرس الدليل"
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 lg:py-8">
            <ProjectGuideSidebar />
          </div>
        </aside>

        {mobileNavOpen ? (
          <button
            type="button"
            className="fixed inset-0 top-28 z-40 bg-background/75 backdrop-blur-sm lg:hidden"
            aria-label="إغلاق القائمة"
            onClick={() => setMobileNavOpen(false)}
          />
        ) : null}

        {/* Main content — sole scroll region */}
        <main ref={mainRef} className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-10">
            <ProjectGuideArticle page={page} />
          </div>
        </main>

        {/* Right TOC — sticky titles, no separate scroll */}
        <aside className="hidden w-52 shrink-0 border-s border-border bg-muted/30 px-4 py-8 xl:block">
          <ProjectGuideToc blocks={page.blocks} className="sticky top-4" scrollRoot={mainRef} />
        </aside>
      </div>
    </div>
  );
}

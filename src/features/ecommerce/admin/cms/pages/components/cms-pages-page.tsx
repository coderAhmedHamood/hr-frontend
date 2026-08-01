'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Pencil, Save } from 'lucide-react';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import {
  getCmsContentBundle,
  saveCmsAbout,
  saveCmsContact,
  saveCmsLegalPage,
} from '@/features/ecommerce/admin/cms/shared/cms-actions';
import type {
  AboutPageContent,
  ContactPageContent,
  LegalPageContent,
  LegalPageSlug,
  StorefrontContentBundle,
} from '@/features/ecommerce/storefront/domain/content';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { PageHeaderPrimaryButton } from '@/components/layouts/page-header-primary-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CmsAboutTab } from '@/features/ecommerce/admin/cms/pages/components/cms-about-tab';
import { CmsContactTab } from '@/features/ecommerce/admin/cms/pages/components/cms-contact-tab';
import {
  CmsLegalPageForm,
  emptyLegalPage,
  ensureLegalPages,
  LEGAL_SLUGS,
} from '@/features/ecommerce/admin/cms/pages/components/cms-legal-tab';
import { FaqCmsPage } from '@/features/ecommerce/admin/cms/faq/components/faq-cms-page';

const CMS_PAGES_QUERY_KEY = ['ecommerce-cms', 'content', 'pages'] as const;

export type CmsPagesPanel = 'list' | 'faq';

type PageRowKind = 'about' | 'contact' | 'legal' | 'faq';

type PageRow = {
  id: string;
  kind: PageRowKind;
  slug?: LegalPageSlug;
  titleKey: 'about' | 'contact' | 'faq' | LegalPageSlug;
};

type EditFormState =
  | { kind: 'about'; draft: AboutPageContent }
  | { kind: 'contact'; draft: ContactPageContent }
  | { kind: 'legal'; slug: LegalPageSlug; draft: LegalPageContent };

function buildPageRows(): PageRow[] {
  return [
    { id: 'about', kind: 'about', titleKey: 'about' },
    { id: 'contact', kind: 'contact', titleKey: 'contact' },
    ...LEGAL_SLUGS.map((slug) => ({
      id: `legal-${slug}`,
      kind: 'legal' as const,
      slug,
      titleKey: slug,
    })),
    { id: 'faq', kind: 'faq', titleKey: 'faq' },
  ];
}

function typeBadgeKey(kind: PageRowKind): string {
  if (kind === 'legal') return 'typeLegal';
  if (kind === 'faq') return 'typeDynamic';
  return 'typePage';
}

type Props = {
  embedded?: boolean;
  initialPanel?: CmsPagesPanel;
};

export function CmsPagesPage({ embedded = false, initialPanel = 'list' }: Props) {
  const companyId = getStorefrontCompanyId();
  const t = useTranslations('ecommerceAdmin.cmsPages');
  const tHome = useTranslations('ecommerceAdmin.homepage');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();

  const [panel, setPanel] = React.useState<CmsPagesPanel>(initialPanel);

  React.useEffect(() => {
    setPanel(initialPanel);
  }, [initialPanel]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...CMS_PAGES_QUERY_KEY, companyId],
    queryFn: async () => {
      const bundle = await getCmsContentBundle(companyId);
      if (!bundle) throw new Error('CONTENT_NOT_FOUND');
      return {
        ...bundle,
        legal: ensureLegalPages(bundle.legal),
      } satisfies StorefrontContentBundle;
    },
  });

  const [draft, setDraft] = React.useState<StorefrontContentBundle | null>(null);
  const [dirty, setDirty] = React.useState(false);
  const [form, setForm] = React.useState<EditFormState | null>(null);

  React.useEffect(() => {
    if (data) {
      setDraft(structuredClone(data));
      setDirty(false);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async (bundle: StorefrontContentBundle) => {
      const about = await saveCmsAbout(companyId, bundle.about);
      const contact = await saveCmsContact(companyId, bundle.contact);
      const legal: LegalPageContent[] = [];
      for (const page of ensureLegalPages(bundle.legal)) {
        legal.push(
          await saveCmsLegalPage(companyId, {
            ...page,
            updatedAt: new Date().toISOString(),
          }),
        );
      }
      return {
        ...bundle,
        about,
        contact,
        legal: ensureLegalPages(legal),
      } satisfies StorefrontContentBundle;
    },
    onSuccess: (saved) => {
      queryClient.setQueryData([...CMS_PAGES_QUERY_KEY, companyId], saved);
      setDraft(saved);
      setDirty(false);
      toast.success(t('saveSuccess'));
    },
    onError: () => toast.error(t('saveError')),
  });

  usePageHeaderActions(
    () => {
      if (panel !== 'list') return null;
      return (
        <PageHeaderPrimaryButton
          icon={Save}
          label={save.isPending ? tCommon('status.saving') : tCommon('actions.save')}
          disabled={!draft || save.isPending || !dirty}
          onClick={() => {
            if (draft) void save.mutateAsync(draft);
          }}
        />
      );
    },
    [draft, dirty, save.isPending, tCommon, panel],
  );

  function pagePreview(row: PageRow): string {
    if (!draft) return '';
    if (row.kind === 'about') {
      return draft.about.headline.ar.trim() || draft.about.intro.ar.trim();
    }
    if (row.kind === 'contact') {
      return draft.contact.headline.ar.trim() || draft.contact.intro.ar.trim();
    }
    if (row.kind === 'faq') {
      return t('faqPreview', { count: draft.faq.length });
    }
    const page = draft.legal.find((item) => item.slug === row.slug);
    return page?.title.ar.trim() || page?.body.ar.trim() || '';
  }

  function openEdit(row: PageRow) {
    if (row.kind === 'faq') {
      setPanel('faq');
      return;
    }
    if (!draft) return;
    if (row.kind === 'about') {
      setForm({ kind: 'about', draft: structuredClone(draft.about) });
      return;
    }
    if (row.kind === 'contact') {
      setForm({ kind: 'contact', draft: structuredClone(draft.contact) });
      return;
    }
    const page = draft.legal.find((item) => item.slug === row.slug) ?? emptyLegalPage(row.slug!);
    setForm({
      kind: 'legal',
      slug: row.slug!,
      draft: structuredClone(page),
    });
  }

  function applyForm() {
    if (!form || !draft) return;
    if (form.kind === 'about') {
      setDraft({ ...draft, about: form.draft });
    } else if (form.kind === 'contact') {
      setDraft({ ...draft, contact: form.draft });
    } else {
      setDraft({
        ...draft,
        legal: ensureLegalPages(
          draft.legal.map((page) => (page.slug === form.slug ? form.draft : page)),
        ),
      });
    }
    setDirty(true);
    setForm(null);
  }

  const rows = buildPageRows();

  const columns: ColumnDef<PageRow>[] = [
    {
      key: 'title',
      title: t('columnPage'),
      render: (row) => (
        <span className="text-sm font-medium text-foreground">{t(row.titleKey)}</span>
      ),
    },
    {
      key: 'preview',
      title: t('columnPreview'),
      render: (row) => (
        <span className="line-clamp-2 text-sm text-muted-foreground">
          {pagePreview(row) || t('noPreview')}
        </span>
      ),
    },
    {
      key: 'type',
      title: t('columnType'),
      render: (row) => <Badge variant="subtle">{t(typeBadgeKey(row.kind))}</Badge>,
    },
    {
      key: 'actions',
      title: '',
      isActions: true,
      render: (row) => (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={tCommon('actions.edit')}
          onClick={() => openEdit(row)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const dialogTitle =
    form?.kind === 'about'
      ? t('about')
      : form?.kind === 'contact'
        ? t('contact')
        : form?.kind === 'legal'
          ? t(form.slug)
          : '';

  if (panel === 'faq') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setPanel('list')}>
            <ArrowRight className="me-1.5 h-4 w-4" />
            {t('backToPages')}
          </Button>
          <h2 className="text-sm font-semibold text-foreground">{t('faq')}</h2>
        </div>
        <FaqCmsPage embedded />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {!embedded ? (
        <SetPageTitle titleAr={t('title')} descriptionAr={t('description')} iconName="BookOpen" />
      ) : null}

      {dirty ? (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          {tHome('unsavedHint')}
        </div>
      ) : null}

      {isError ? (
        <Card>
          <CardContent className="flex items-center justify-between gap-3 py-6">
            <p className="text-sm text-destructive">{t('loadError')}</p>
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              {tCommon('actions.retry')}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <DataTable
        columns={columns}
        data={rows}
        keyExtractor={(row) => row.id}
        loading={isLoading || !draft}
        emptyText={t('empty')}
        alwaysShowTable
      />

      <Dialog
        open={form !== null}
        onOpenChange={(open) => {
          if (!open) setForm(null);
        }}
      >
        <DialogContent className={form?.kind === 'legal' ? 'max-w-3xl' : 'max-w-lg'}>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>

          {form?.kind === 'about' ? (
            <CmsAboutTab
              about={form.draft}
              onChange={(about) => setForm({ kind: 'about', draft: about })}
            />
          ) : null}
          {form?.kind === 'contact' ? (
            <CmsContactTab
              contact={form.draft}
              onChange={(contact) => setForm({ kind: 'contact', draft: contact })}
            />
          ) : null}
          {form?.kind === 'legal' ? (
            <CmsLegalPageForm
              page={form.draft}
              onChange={(page) => setForm({ kind: 'legal', slug: form.slug, draft: page })}
            />
          ) : null}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setForm(null)}>
              {tCommon('actions.cancel')}
            </Button>
            <Button type="button" onClick={applyForm}>
              {tCommon('actions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

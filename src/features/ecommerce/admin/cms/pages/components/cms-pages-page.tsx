'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Pencil, Save } from 'lucide-react';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import {
  getCmsCompanyRecord,
  getCmsContentBundle,
  saveCmsAbout,
  saveCmsCompanyRecord,
  saveCmsContact,
  saveCmsLegalPage,
} from '@/features/ecommerce/admin/cms/shared/cms-actions';
import {
  normalizeStorePagesVisibility,
  type CompanyConfigRecord,
  type CompanyStorePagesVisibility,
} from '@/features/ecommerce/storefront/domain/company-config';
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
import { Switch } from '@/components/ui/switch';
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
const CMS_COMPANY_QUERY_KEY = ['ecommerce-cms', 'company', 'pages-visibility'] as const;

export type CmsPagesPanel = 'list' | 'faq';

type PageRowKind = 'about' | 'contact' | 'legal' | 'faq' | 'catalog';

type PageRow = {
  id: string;
  kind: PageRowKind;
  slug?: LegalPageSlug;
  catalogKey?: keyof CompanyStorePagesVisibility;
  titleKey: 'about' | 'contact' | 'faq' | 'offers' | 'wholesale' | LegalPageSlug;
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
    { id: 'offers', kind: 'catalog', catalogKey: 'offers', titleKey: 'offers' },
    { id: 'wholesale', kind: 'catalog', catalogKey: 'wholesale', titleKey: 'wholesale' },
  ];
}

function typeBadgeKey(kind: PageRowKind): string {
  if (kind === 'legal') return 'typeLegal';
  if (kind === 'faq') return 'typeDynamic';
  if (kind === 'catalog') return 'typeCatalog';
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

  const {
    data: company,
    isLoading: companyLoading,
    isError: companyError,
    refetch: refetchCompany,
  } = useQuery({
    queryKey: [...CMS_COMPANY_QUERY_KEY, companyId],
    queryFn: async () => {
      const record = await getCmsCompanyRecord(companyId);
      if (!record) throw new Error('COMPANY_NOT_FOUND');
      return {
        ...record,
        storePages: normalizeStorePagesVisibility(record.storePages),
      } satisfies CompanyConfigRecord;
    },
  });

  const [draft, setDraft] = React.useState<StorefrontContentBundle | null>(null);
  const [storePages, setStorePages] = React.useState<CompanyStorePagesVisibility | null>(null);
  const [dirty, setDirty] = React.useState(false);
  const [form, setForm] = React.useState<EditFormState | null>(null);

  React.useEffect(() => {
    if (data) {
      setDraft(structuredClone(data));
      setDirty(false);
    }
  }, [data]);

  React.useEffect(() => {
    if (company) {
      setStorePages(normalizeStorePagesVisibility(company.storePages));
    }
  }, [company]);

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

  const saveVisibility = useMutation({
    mutationFn: async (next: CompanyStorePagesVisibility) => {
      if (!company) throw new Error('COMPANY_NOT_FOUND');
      return saveCmsCompanyRecord({
        ...company,
        storePages: normalizeStorePagesVisibility(next),
      });
    },
    onSuccess: (saved) => {
      queryClient.setQueryData([...CMS_COMPANY_QUERY_KEY, companyId], saved);
      setStorePages(normalizeStorePagesVisibility(saved.storePages));
      toast.success(t('visibilitySaveSuccess'));
    },
    onError: () => toast.error(t('visibilitySaveError')),
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
    if (row.kind === 'catalog') {
      const visible = row.catalogKey ? storePages?.[row.catalogKey] : false;
      return visible ? t('visibilityOn') : t('visibilityOff');
    }
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
    if (row.kind === 'catalog') return;
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

  function toggleCatalogPage(key: keyof CompanyStorePagesVisibility, enabled: boolean) {
    if (!storePages || saveVisibility.isPending) return;
    const next = { ...storePages, [key]: enabled };
    setStorePages(next);
    void saveVisibility.mutateAsync(next);
  }

  const rows = buildPageRows();

  const columns: ColumnDef<PageRow>[] = [
    {
      key: 'title',
      title: t('columnPage'),
      render: (row) => (
        <div className="space-y-0.5">
          <span className="text-sm font-medium text-foreground">{t(row.titleKey)}</span>
          {row.kind === 'catalog' ? (
            <p className="text-xs text-muted-foreground">{t('catalogHint')}</p>
          ) : null}
        </div>
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
      key: 'visibility',
      title: t('columnVisibility'),
      render: (row) => {
        if (row.kind !== 'catalog' || !row.catalogKey) {
          return <span className="text-xs text-muted-foreground">—</span>;
        }
        const checked = storePages?.[row.catalogKey] ?? true;
        return (
          <Switch
            checked={checked}
            disabled={!storePages || saveVisibility.isPending}
            onCheckedChange={(enabled) => toggleCatalogPage(row.catalogKey!, enabled)}
            aria-label={t('columnVisibility')}
          />
        );
      },
    },
    {
      key: 'actions',
      title: '',
      isActions: true,
      render: (row) =>
        row.kind === 'catalog' ? (
          <span className="inline-block w-9" />
        ) : (
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

  const loading = isLoading || companyLoading || !draft || !storePages;
  const loadFailed = isError || companyError;

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

      {loadFailed ? (
        <Card>
          <CardContent className="flex items-center justify-between gap-3 py-6">
            <p className="text-sm text-destructive">{t('loadError')}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void refetch();
                void refetchCompany();
              }}
            >
              {tCommon('actions.retry')}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <DataTable
        columns={columns}
        data={rows}
        keyExtractor={(row) => row.id}
        loading={loading}
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

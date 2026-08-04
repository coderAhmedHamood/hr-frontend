'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleHelp,
  FileText,
  Mail,
  Pencil,
  Percent,
  Scale,
  Save,
  Shield,
  ShoppingBag,
  Users,
} from 'lucide-react';
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
import { cn } from '@/shared/utils';

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

type PageGroupId = 'store' | 'legal' | 'content' | 'catalog';

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

function groupForRow(row: PageRow): PageGroupId {
  if (row.kind === 'legal') return 'legal';
  if (row.kind === 'faq') return 'content';
  if (row.kind === 'catalog') return 'catalog';
  return 'store';
}

function rowIcon(row: PageRow) {
  if (row.kind === 'about') return Users;
  if (row.kind === 'contact') return Mail;
  if (row.kind === 'faq') return CircleHelp;
  if (row.kind === 'catalog') {
    return row.catalogKey === 'offers' ? Percent : ShoppingBag;
  }
  if (row.slug === 'privacy') return Shield;
  if (row.slug === 'terms') return Scale;
  return FileText;
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
  const [form, setForm] = React.useState<EditFormState | null>(null);

  React.useEffect(() => {
    setPanel(initialPanel);
  }, [initialPanel]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...CMS_PAGES_QUERY_KEY, companyId],
    queryFn: async () => {
      const bundle = await getCmsContentBundle(companyId);
      const resolved =
        bundle ??
        ({
          companyId,
          about: {
            headline: { ar: '', en: '' },
            intro: { ar: '', en: '' },
            sections: [],
            stats: [],
          },
          contact: {
            headline: { ar: '', en: '' },
            intro: { ar: '', en: '' },
          },
          faq: [],
          legal: [],
        } satisfies StorefrontContentBundle);
      return {
        ...resolved,
        legal: ensureLegalPages(resolved.legal),
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
      if (panel !== 'list' || form) return null;
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
    [draft, dirty, save.isPending, tCommon, panel, form],
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
    return page?.title.ar.trim() || page?.body.ar.replace(/<[^>]+>/g, '').trim() || '';
  }

  function hasContent(row: PageRow): boolean {
    if (row.kind === 'catalog') return Boolean(row.catalogKey && storePages?.[row.catalogKey]);
    if (row.kind === 'faq') return (draft?.faq.length ?? 0) > 0;
    return Boolean(pagePreview(row).trim());
  }

  function openEdit(row: PageRow) {
    if (row.kind === 'catalog') return;
    if (row.kind === 'faq') {
      setForm(null);
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
  const groups: Array<{
    id: PageGroupId;
    title: string;
    hint: string;
    items: PageRow[];
  }> = [
    {
      id: 'store',
      title: t('groupStore'),
      hint: t('groupStoreHint'),
      items: rows.filter((row) => groupForRow(row) === 'store'),
    },
    {
      id: 'legal',
      title: t('groupLegal'),
      hint: t('groupLegalHint'),
      items: rows.filter((row) => groupForRow(row) === 'legal'),
    },
    {
      id: 'content',
      title: t('groupContent'),
      hint: t('groupContentHint'),
      items: rows.filter((row) => groupForRow(row) === 'content'),
    },
    {
      id: 'catalog',
      title: t('groupCatalog'),
      hint: t('groupCatalogHint'),
      items: rows.filter((row) => groupForRow(row) === 'catalog'),
    },
  ];

  const editorTitle =
    form?.kind === 'about'
      ? t('about')
      : form?.kind === 'contact'
        ? t('contact')
        : form?.kind === 'legal'
          ? t(form.slug)
          : '';

  const loading = isLoading || companyLoading;
  const loadFailed = isError || companyError;

  if (panel === 'faq') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3">
          <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => setPanel('list')}>
            <ArrowRight className="me-1.5 h-4 w-4" />
            {t('backToPages')}
          </Button>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">{t('faq')}</h2>
            <p className="text-xs text-muted-foreground">{t('editContentHint')}</p>
          </div>
        </div>
        <FaqCmsPage embedded />
      </div>
    );
  }

  if (form) {
    return (
      <div className="flex flex-col gap-4">
        <section className="sticky top-13.5 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/95 px-4 py-3 shadow-soft backdrop-blur-md">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => setForm(null)}>
              <ArrowRight className="me-1.5 h-4 w-4" />
              {t('backToPages')}
            </Button>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground">{editorTitle}</h2>
              <p className="text-xs text-muted-foreground">{t('studioEditorHint')}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setForm(null)}>
              {tCommon('actions.cancel')}
            </Button>
            <Button type="button" className="rounded-xl" onClick={applyForm}>
              {t('applyContent')}
            </Button>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
          <div className="border-b border-border/60 bg-linear-to-l from-primary/8 via-card to-card px-5 py-5 sm:px-7">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary/80">{t('studioEditorEyebrow')}</p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-foreground">{editorTitle}</h3>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t('editDialogHint')}</p>
          </div>
          <div className="px-5 py-6 sm:px-7">
            {form.kind === 'about' ? (
              <CmsAboutTab about={form.draft} onChange={(about) => setForm({ kind: 'about', draft: about })} />
            ) : null}
            {form.kind === 'contact' ? (
              <CmsContactTab
                contact={form.draft}
                onChange={(contact) => setForm({ kind: 'contact', draft: contact })}
              />
            ) : null}
            {form.kind === 'legal' ? (
              <CmsLegalPageForm
                page={form.draft}
                onChange={(page) => setForm({ kind: 'legal', slug: form.slug, draft: page })}
              />
            ) : null}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {!embedded ? (
        <SetPageTitle titleAr={t('title')} descriptionAr={t('description')} iconName="BookOpen" />
      ) : null}


      {dirty ? (
        <div className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-xs text-warning">
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

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-3xl bg-muted/40" />
          ))}
        </div>
      ) : (
        <div className="space-y-7">
          {groups.map((group) => (
            <section key={group.id} className="space-y-3">
              <header className="px-1">
                <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{group.hint}</p>
              </header>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {group.items.map((row) => {
                  const Icon = rowIcon(row);
                  const ready = hasContent(row);
                  const preview = pagePreview(row);
                  const isCatalog = row.kind === 'catalog';

                  return (
                    <article
                      key={row.id}
                      className={cn(
                        'group relative flex min-h-42 flex-col overflow-hidden rounded-3xl border border-border/70 bg-card p-4 transition-all duration-200',
                        !isCatalog && 'hover:border-primary/35 hover:shadow-soft',
                      )}
                    >
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-b from-primary/6 to-transparent opacity-80" />
                      <div className="relative flex items-start justify-between gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                          <Icon className="h-5 w-5" aria-hidden />
                        </span>
                        <Badge variant="subtle" className="rounded-lg">
                          {ready ? (
                            <span className="inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-primary" />
                              {isCatalog ? t('visibilityOn') : t('contentReady')}
                            </span>
                          ) : (
                            t(isCatalog ? 'visibilityOff' : 'contentEmpty')
                          )}
                        </Badge>
                      </div>

                      <div className="relative mt-4 min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-foreground">{t(row.titleKey)}</h4>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {isCatalog ? t('catalogHint') : preview || t('noPreview')}
                        </p>
                      </div>

                      <div className="relative mt-4 flex items-center justify-between gap-2 border-t border-border/50 pt-3">
                        {isCatalog && row.catalogKey ? (
                          <>
                            <span className="text-xs text-muted-foreground">{t('columnVisibility')}</span>
                            <Switch
                              checked={storePages?.[row.catalogKey] ?? true}
                              disabled={!storePages || saveVisibility.isPending}
                              onCheckedChange={(enabled) => toggleCatalogPage(row.catalogKey!, enabled)}
                              aria-label={t('columnVisibility')}
                            />
                          </>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            disabled={!draft}
                            onClick={() => openEdit(row)}
                          >
                            <Pencil className="me-1.5 h-3.5 w-3.5" />
                            {t('editPage')}
                          </Button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

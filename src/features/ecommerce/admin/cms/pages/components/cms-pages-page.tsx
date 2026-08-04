'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { storefrontContentRepository } from '@/features/ecommerce/storefront/lib/repositories/content-repository';
import type {
  AboutPageContent,
  ContactPageContent,
  LegalPageContent,
  StorefrontContentBundle,
} from '@/features/ecommerce/storefront/domain/content';
import { BookOpen } from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CmsAboutTab } from '@/features/ecommerce/admin/cms/pages/components/cms-about-tab';
import { CmsContactTab } from '@/features/ecommerce/admin/cms/pages/components/cms-contact-tab';
import { CmsLegalTab, ensureLegalPages } from '@/features/ecommerce/admin/cms/pages/components/cms-legal-tab';

const CMS_PAGES_QUERY_KEY = ['ecommerce-cms', 'content', 'pages'] as const;

export function CmsPagesPage({ embedded = false }: { embedded?: boolean }) {
  const companyId = getStorefrontCompanyId();
  const t = useTranslations('ecommerceAdmin.cmsPages');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...CMS_PAGES_QUERY_KEY, companyId],
    queryFn: async () => {
      const bundle = await storefrontContentRepository.getContentBundle(companyId);
      if (!bundle) throw new Error('CONTENT_NOT_FOUND');
      return {
        ...bundle,
        legal: ensureLegalPages(bundle.legal),
      } satisfies StorefrontContentBundle;
    },
  });

  const [draft, setDraft] = React.useState<StorefrontContentBundle | null>(null);
  const [activeTab, setActiveTab] = React.useState('about');

  React.useEffect(() => {
    if (data) setDraft(structuredClone(data));
  }, [data]);

  const saveAbout = useMutation({
    mutationFn: (about: AboutPageContent) => storefrontContentRepository.saveAbout(companyId, about),
    onSuccess: (saved) => {
      queryClient.setQueryData<StorefrontContentBundle>([...CMS_PAGES_QUERY_KEY, companyId], (prev) =>
        prev ? { ...prev, about: saved } : prev,
      );
      setDraft((prev) => (prev ? { ...prev, about: saved } : prev));
      toast.success(t('saveSuccess'));
    },
    onError: () => toast.error(t('saveError')),
  });

  const saveContact = useMutation({
    mutationFn: (contact: ContactPageContent) =>
      storefrontContentRepository.saveContact(companyId, contact),
    onSuccess: (saved) => {
      queryClient.setQueryData<StorefrontContentBundle>([...CMS_PAGES_QUERY_KEY, companyId], (prev) =>
        prev ? { ...prev, contact: saved } : prev,
      );
      setDraft((prev) => (prev ? { ...prev, contact: saved } : prev));
      toast.success(t('saveSuccess'));
    },
    onError: () => toast.error(t('saveError')),
  });

  const saveLegal = useMutation({
    mutationFn: async (pages: LegalPageContent[]) => {
      const saved: LegalPageContent[] = [];
      for (const page of pages) {
        saved.push(
          await storefrontContentRepository.saveLegalPage(companyId, {
            ...page,
            updatedAt: new Date().toISOString(),
          }),
        );
      }
      return saved;
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<StorefrontContentBundle>([...CMS_PAGES_QUERY_KEY, companyId], (prev) =>
        prev ? { ...prev, legal: ensureLegalPages(saved) } : prev,
      );
      setDraft((prev) => (prev ? { ...prev, legal: ensureLegalPages(saved) } : prev));
      toast.success(t('saveSuccess'));
    },
    onError: () => toast.error(t('saveError')),
  });

  const isSaving = saveAbout.isPending || saveContact.isPending || saveLegal.isPending;

  function handleSave() {
    if (!draft) return;
    if (activeTab === 'about') void saveAbout.mutateAsync(draft.about);
    else if (activeTab === 'contact') void saveContact.mutateAsync(draft.contact);
    else void saveLegal.mutateAsync(draft.legal);
  }

  return (
    <div className="flex flex-col gap-5">
      {!embedded ? (
        <>
          <SetPageTitle titleAr={t('title')} iconName="BookOpen" />

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" disabled={!draft || isSaving} onClick={handleSave}>
                {isSaving ? tCommon('status.saving') : tCommon('actions.save')}
              </Button>
      </div>
        </>
      ) : (
        <div className="flex justify-end">
          <Button type="button" disabled={!draft || isSaving} onClick={handleSave}>
            {isSaving ? tCommon('status.saving') : tCommon('actions.save')}
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/50" />
          ))}
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

      {draft ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="about">{t('about')}</TabsTrigger>
            <TabsTrigger value="contact">{t('contact')}</TabsTrigger>
            <TabsTrigger value="legal">{t('legal')}</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-4">
            <CmsAboutTab
              about={draft.about}
              onChange={(about) => setDraft({ ...draft, about })}
            />
          </TabsContent>

          <TabsContent value="contact" className="mt-4">
            <CmsContactTab
              contact={draft.contact}
              onChange={(contact) => setDraft({ ...draft, contact })}
            />
          </TabsContent>

          <TabsContent value="legal" className="mt-4">
            <CmsLegalTab
              legal={draft.legal}
              onChange={(legal) => setDraft({ ...draft, legal })}
            />
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
}

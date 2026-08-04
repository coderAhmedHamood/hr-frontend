'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { FileStack, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { storefrontContentRepository } from '@/features/ecommerce/storefront/lib/repositories/content-repository';
import type { BlogPost } from '@/features/ecommerce/storefront/domain/content';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const BLOG_QUERY_KEY = ['ecommerce-cms', 'content', 'blog'] as const;

function emptyPost(companyId: string): BlogPost {
  return {
    id: crypto.randomUUID(),
    companyId,
    slug: '',
    title: { ar: '', en: '' },
    excerpt: { ar: '', en: '' },
    body: { ar: '', en: '' },
    coverImageUrl: '',
    authorName: { ar: '', en: '' },
    publishedAt: new Date().toISOString(),
    seo: {},
    isPublished: false,
  };
}

export function BlogCmsPage({ embedded = false }: { embedded?: boolean }) {
  const companyId = getStorefrontCompanyId();
  const t = useTranslations('ecommerceAdmin.blog');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...BLOG_QUERY_KEY, companyId],
    queryFn: () => storefrontContentRepository.listBlogPostsAdmin(companyId),
  });

  const [editorOpen, setEditorOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<BlogPost | null>(null);
  const [isNew, setIsNew] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<BlogPost | null>(null);

  const save = useMutation({
    mutationFn: (post: BlogPost) => storefrontContentRepository.saveBlogPost(post),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...BLOG_QUERY_KEY, companyId] });
      setEditorOpen(false);
      setDraft(null);
      toast.success(t('saveSuccess'));
    },
    onError: () => toast.error(t('saveError')),
  });

  const remove = useMutation({
    mutationFn: (post: BlogPost) => storefrontContentRepository.deleteBlogPost(companyId, post.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...BLOG_QUERY_KEY, companyId] });
      setDeleteTarget(null);
      toast.success(t('deleteSuccess'));
    },
    onError: () => toast.error(t('saveError')),
  });

  function openCreate() {
    setDraft(emptyPost(companyId));
    setIsNew(true);
    setEditorOpen(true);
  }

  function openEdit(post: BlogPost) {
    setDraft(structuredClone(post));
    setIsNew(false);
    setEditorOpen(true);
  }

  return (
    <div className="flex flex-col gap-5">
      {!embedded ? (
        <>
          <SetPageTitle titleAr={t('title')} iconName="FileStack" />

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" onClick={openCreate}>
                <Plus className="me-2 h-4 w-4" />
                {t('addPost')}
              </Button>
      </div>
        </>
      ) : (
        <div className="flex justify-end">
          <Button type="button" onClick={openCreate}>
            <Plus className="me-2 h-4 w-4" />
            {t('addPost')}
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted/50" />
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

      {data && data.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <FileStack className="mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">{t('empty')}</p>
        </div>
      ) : null}

      <ul className="flex flex-col gap-3">
        {(data ?? []).map((post) => (
          <li key={post.id}>
            <Card className="transition-shadow hover:shadow-elevated">
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1.5">
                  <p className="truncate font-medium text-foreground">{post.title.ar || post.title.en || '—'}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{post.slug}</span>
                    <Badge variant={post.isPublished ? 'success' : 'subtle'}>
                      {post.isPublished ? t('published') : t('draft')}
                    </Badge>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => openEdit(post)}>
                    <Pencil className="me-2 h-4 w-4" />
                    {t('editPost')}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setDeleteTarget(post)}>
                    <Trash2 className="me-2 h-4 w-4" />
                    {t('deletePost')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <Dialog
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setDraft(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isNew ? t('addPost') : t('editPost')}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t('titleAr')}</Label>
                <Input
                  value={draft.title.ar}
                  onChange={(event) =>
                    setDraft({ ...draft, title: { ...draft.title, ar: event.target.value } })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('titleEn')}</Label>
                <Input
                  value={draft.title.en}
                  onChange={(event) =>
                    setDraft({ ...draft, title: { ...draft.title, en: event.target.value } })
                  }
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{t('slug')}</Label>
                <Input
                  value={draft.slug}
                  onChange={(event) => setDraft({ ...draft, slug: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('excerptAr')}</Label>
                <Textarea
                  value={draft.excerpt.ar}
                  onChange={(event) =>
                    setDraft({ ...draft, excerpt: { ...draft.excerpt, ar: event.target.value } })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('excerptEn')}</Label>
                <Textarea
                  value={draft.excerpt.en}
                  onChange={(event) =>
                    setDraft({ ...draft, excerpt: { ...draft.excerpt, en: event.target.value } })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('bodyAr')}</Label>
                <Textarea
                  value={draft.body.ar}
                  onChange={(event) =>
                    setDraft({ ...draft, body: { ...draft.body, ar: event.target.value } })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('bodyEn')}</Label>
                <Textarea
                  value={draft.body.en}
                  onChange={(event) =>
                    setDraft({ ...draft, body: { ...draft.body, en: event.target.value } })
                  }
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{t('coverImageUrl')}</Label>
                <Input
                  value={draft.coverImageUrl ?? ''}
                  onChange={(event) => setDraft({ ...draft, coverImageUrl: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('authorAr')}</Label>
                <Input
                  value={draft.authorName.ar}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      authorName: { ...draft.authorName, ar: event.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('authorEn')}</Label>
                <Input
                  value={draft.authorName.en}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      authorName: { ...draft.authorName, en: event.target.value },
                    })
                  }
                />
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <Switch
                  checked={draft.isPublished}
                  onCheckedChange={(checked) => setDraft({ ...draft, isPublished: checked })}
                />
                <Label>{draft.isPublished ? t('published') : t('draft')}</Label>
              </div>
            </div>
          ) : null}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setEditorOpen(false)}>
              {tCommon('actions.cancel')}
            </Button>
            <Button
              type="button"
              disabled={!draft || save.isPending}
              onClick={() => draft && void save.mutateAsync(draft)}
            >
              {save.isPending ? tCommon('status.saving') : tCommon('actions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{tCommon('confirmation.deleteTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {tCommon('confirmation.deleteDescription', {
              name: deleteTarget?.title.ar || deleteTarget?.title.en || deleteTarget?.slug || '',
            })}
          </p>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              {tCommon('actions.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!deleteTarget || remove.isPending}
              onClick={() => deleteTarget && void remove.mutateAsync(deleteTarget)}
            >
              {t('deletePost')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import * as React from 'react';
import { Plus, BookOpen, Star, Hash, Eye, Pencil, Trash2, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { usePageFilters } from '@/components/layouts/filter-panel-context';
import {
  HRSettingsFormDrawer, FormField, ConfirmationModal, EmptyState, ActiveBadge,
} from '@/features/hr/requests/components/shared-ui';
import { DirectoryPagedViews, useServerDirectoryPagination } from '@/components/ui/paged-list';
import { contractArticlesApi } from '@/features/hr/contracts/lib/contracts-api';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import {
  useHRContractArticlesStore, normalizeArticleBody,
  type HRContractArticle,
} from '@/features/hr/contracts/lib/contract-articles-store';
import { cn } from '@/shared/utils';

type DraftForm = {
  code: string;
  title: string;
  body: string;
  isBasic: boolean;
  isActive: boolean;
};

const EMPTY_FORM: DraftForm = { code: '', title: '', body: '', isBasic: false, isActive: true };

function makeArticleCode() {
  return `ART-${Date.now().toString(36).toUpperCase()}`;
}

export function ContractArticlesClient() {
  const { articles, add, update, remove, fetch: fetchArticles } = useHRContractArticlesStore();
  const companyId = useDefaultCompanyId() ?? '';

  React.useEffect(() => { fetchArticles(); }, []);

  const { values } = usePageFilters([
    {
      key: 'kind', label: 'النوع', type: 'select',
      options: [
        { value: 'basic', label: 'أساسية' },
        { value: 'optional', label: 'اختيارية' },
      ],
    },
    {
      key: 'active', label: 'الحالة', type: 'select',
      options: [{ value: 'active', label: 'نشطة فقط' }],
    },
  ]);

  const kindFilter = (values.kind as string) || 'all';
  const activeOnly = (values.active as string) === 'active';

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    if (!companyId) return { items: [] as HRContractArticle[], total: 0 };
    try {
      const res = await contractArticlesApi.list({
        companyId,
        page,
        limit: pageSize,
        ...(kindFilter === 'basic' ? { isBasic: true } : kindFilter === 'optional' ? { isBasic: false } : {}),
        ...(activeOnly ? { isActive: true } : {}),
      });
      const items = res.items.map((a) => ({
        id: a.id,
        code: a.code,
        title: a.titleAr,
        body: normalizeArticleBody(a.bodyAr ?? ''),
        isBasic: a.isBasic,
        isActive: a.isActive,
        updatedAt: a.updatedAt,
      })).sort((a, b) => a.code.localeCompare(b.code));
      return { items, total: res.pagination.total };
    } catch (err) {
      handleApiError(err, 'contract-articles.load');
      return { items: [], total: 0 };
    }
  }, [activeOnly, companyId, kindFilter]);

  const {
    items: filtered,
    loading: listLoading,
    pagination,
    reload: reloadArticles,
  } = useServerDirectoryPagination<HRContractArticle>(loadPage, {
    enabled: !!companyId,
    resetDeps: [kindFilter, activeOnly],
  });
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<DraftForm>(EMPTY_FORM);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [previewId, setPreviewId] = React.useState<string | null>(null);

  const total = pagination.total;
  const preview = previewId ? (filtered.find(a => a.id === previewId) ?? articles.find(a => a.id === previewId)) : null;

  const openCreate = () => {
    setEditId(null); setForm(EMPTY_FORM); setError(null); setDrawerOpen(true);
  };
  const openEdit = (a: HRContractArticle) => {
    setEditId(a.id);
    setForm({ code: a.code, title: a.title, body: a.body, isBasic: a.isBasic, isActive: a.isActive });
    setError(null); setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError('العنوان مطلوب'); return; }
    if (!form.body.trim()) { setError('نص المادة مطلوب'); return; }
    try {
      const payload = { ...form, code: editId ? form.code : makeArticleCode() };
      if (editId) {
        await update(editId, payload);
      } else {
        await add(payload);
      }
      setDrawerOpen(false);
      await reloadArticles();
      void fetchArticles();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const patch = (p: Partial<DraftForm>) => setForm(f => ({ ...f, ...p }));

  const basicCount    = articles.filter(a => a.isBasic && a.isActive).length;
  const optionalCount = articles.filter(a => !a.isBasic && a.isActive).length;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <SetPageTitle titleAr="مواد العقود" descriptionAr="مكتبة البنود والمواد القانونية للعقود." iconName="BookOpen" />

      {/* ── Hero bar ── */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/8">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">إجمالي المواد</p>
            <p className="text-2xl font-bold tabular-nums leading-none text-foreground">{total}</p>
          </div>
          <div className="mx-1 h-8 w-px bg-border hidden sm:block" />
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/6 px-2.5 py-1 text-xs font-medium text-primary">
            <Star className="h-3 w-3" />{basicCount} أساسية
          </div>
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <Hash className="h-3 w-3" />{optionalCount} اختيارية
          </div>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />مادة جديدة
        </Button>
      </div>

      {!listLoading && filtered.length === 0 && pagination.total === 0 ? (
        <EmptyState icon={BookOpen} title="لا توجد مواد" description="أضف مادة جديدة لمكتبة العقود." />
      ) : (
        <DirectoryPagedViews items={filtered} serverPagination={pagination} loading={listLoading}>
          {(pageItems) => (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 animate-fade-in">
          {pageItems.map(a => (
            <Card
              key={a.id}
              className={cn(
                'luxe-card group relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-elevated',
                !a.isActive && 'opacity-55',
              )}
              onClick={() => setPreviewId(a.id)}
            >
              {/* Left accent bar */}
              <div className={cn(
                'absolute inset-e-0 top-0 bottom-0 w-1 rounded-e-lg',
                a.isBasic ? 'bg-primary' : 'bg-border',
              )} />

              <CardContent className="p-4 pe-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Badges row */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {a.isBasic ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/8 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          <Star className="h-2.5 w-2.5" />أساسية
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                          اختيارية
                        </span>
                      )}
                      {!a.isActive && (
                        <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                          غير نشطة
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <p className="font-semibold text-sm text-foreground leading-snug truncate">{a.title}</p>

                    {/* Body preview */}
                    <p className="text-[11.5px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {a.body.slice(0, 140)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex shrink-0 flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
                      onClick={() => setPreviewId(a.id)}
                      title="معاينة"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:border-gold/40 hover:text-gold transition-colors"
                      onClick={() => openEdit(a)}
                      title="تعديل"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:border-destructive/40 hover:text-destructive transition-colors"
                      onClick={() => setConfirmId(a.id)}
                      title="حذف"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
          )}
        </DirectoryPagedViews>
      )}

      {/* ── Preview modal ── */}
      {preview && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setPreviewId(null)}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-luxe max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className={cn(
              'relative flex items-start justify-between gap-3 border-b border-border px-5 py-4',
              preview.isBasic
                ? 'bg-linear-to-b from-primary/8 to-card'
                : 'bg-linear-to-b from-muted/60 to-card',
            )}>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {preview.isBasic ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/8 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                      <Star className="h-3 w-3" />مادة أساسية
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[11px] text-muted-foreground">
                      اختيارية
                    </span>
                  )}
                  {preview.isActive && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-success/25 bg-success/8 px-2.5 py-0.5 text-[11px] font-medium text-success">
                      <CheckCircle2 className="h-3 w-3" />نشطة
                    </span>
                  )}
                </div>
                <h2 className="text-base font-bold text-foreground leading-snug">{preview.title}</h2>
              </div>
              <button
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setPreviewId(null)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto px-5 py-4 flex-1">
              <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-loose">{preview.body}</p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
              <Button variant="outline" size="sm" onClick={() => { setPreviewId(null); openEdit(preview); }}>
                <Pencil className="h-3.5 w-3.5 me-1.5" />تعديل
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPreviewId(null)}>إغلاق</Button>
            </div>
          </div>
        </div>
      )}

      <HRSettingsFormDrawer
        open={drawerOpen} onOpenChange={setDrawerOpen}
        title={editId ? 'تعديل المادة' : 'مادة جديدة'}
        onSave={handleSave} error={error}
      >
        <FormField label="العنوان" required span2>
          <Input value={form.title} onChange={e => patch({ title: e.target.value })} placeholder="عنوان المادة…" />
        </FormField>
        <FormField label="نص المادة" required span2>
          <Textarea
            value={form.body}
            onChange={e => patch({ body: e.target.value })}
            placeholder="نص البند القانوني…"
            rows={6}
          />
        </FormField>
        <FormField label="">
          <div className="flex items-center gap-2 pt-2">
            <Switch id="isBasic" checked={form.isBasic} onCheckedChange={v => patch({ isBasic: v })} />
            <Label htmlFor="isBasic">مادة أساسية</Label>
          </div>
        </FormField>
        <FormField label="">
          <div className="flex items-center gap-2 pt-2">
            <Switch id="isActive" checked={form.isActive} onCheckedChange={v => patch({ isActive: v })} />
            <Label htmlFor="isActive">نشطة</Label>
          </div>
        </FormField>
      </HRSettingsFormDrawer>

      <ConfirmationModal
        open={!!confirmId}
        onOpenChange={v => { if (!v) setConfirmId(null); }}
        title="حذف المادة"
        description="هل أنت متأكد من حذف هذه المادة من المكتبة؟"
        confirmLabel="حذف"
        variant="destructive"
        onConfirm={async () => { if (confirmId) { await remove(confirmId); setConfirmId(null); } }}
      />
    </div>
  );
}

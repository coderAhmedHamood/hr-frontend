'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Pencil, Trash2, Share2, Users, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRecruitmentStore } from '@/features/hr/recruitment/lib/store';
import { FormBuilderDialog } from '@/features/hr/recruitment/shared/form-builder-dialog';
import { FormSharingTools } from '@/features/hr/recruitment/shared/form-sharing-tools';
import type { RecruitmentForm } from '@/features/hr/recruitment/lib/types';

export function RecruitmentAdminClient() {
  const router = useRouter();
  const { forms, updateForm, deleteForm } = useRecruitmentStore();
  const [search, setSearch] = React.useState('');
  const [builderOpen, setBuilderOpen] = React.useState(false);
  const [editingForm, setEditingForm] = React.useState<RecruitmentForm | null>(null);
  const [sharingForm, setSharingForm] = React.useState<RecruitmentForm | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return forms;
    return forms.filter((f) => f.title.toLowerCase().includes(q) || f.description.toLowerCase().includes(q));
  }, [forms, search]);

  const activeCount = React.useMemo(() => forms.filter((f) => f.isActive).length, [forms]);

  const handleSaveForm = (data: Omit<RecruitmentForm, 'id' | 'createdAt'>) => {
    if (editingForm) {
      updateForm(editingForm.id, data);
      setEditingForm(null);
    }
  };

  const handleEdit = (form: RecruitmentForm) => {
    setEditingForm(form);
    setBuilderOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteForm(id);
    setDeleteId(null);
    toast.success('تم حذف النموذج والمتقدمين المرتبطين به');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في النماذج…"
              className="pr-9"
            />
          </div>
        </div>
        <Button variant="luxe" size="sm" className="gap-2" onClick={() => router.push('/hr/recruitment/admin/create')}>
          <Plus className="h-4 w-4" /> نموذج جديد
        </Button>
      </div>

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>إجمالي النماذج: {forms.length}</span>
        <span>·</span>
        <span>النماذج النشطة: {activeCount}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <Search className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {search.trim() ? 'لا توجد نتائج مطابقة للبحث' : 'لا توجد نماذج توظيف. أنشئ نموذجاً جديداً للبدء.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((form) => (
            <Card key={form.id} className="flex flex-col transition-shadow hover:shadow-elevated">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">{form.title}</CardTitle>
                  <Badge variant={form.isActive ? 'default' : 'secondary'} className="shrink-0">
                    {form.isActive ? 'نشط' : 'معطل'}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">{form.description || '—'}</CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex flex-wrap gap-2">
                  {form.fields.map((f) => (
                    <span key={f.id} className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground">
                      {f.label}
                    </span>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="mt-auto flex items-center gap-2 border-t border-border/50 pt-3">
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => handleEdit(form)}>
                  <Pencil className="h-3 w-3" /> تعديل
                </Button>
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setSharingForm(form)}>
                  <Share2 className="h-3 w-3" /> مشاركة
                </Button>
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => router.push(`/hr/recruitment/applicants?form=${form.id}`)}>
                  <Users className="h-3 w-3" /> المتقدمون
                </Button>
                <div className="me-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteId(form.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground"
                  onClick={() => updateForm(form.id, { isActive: !form.isActive })}
                  title={form.isActive ? 'تعطيل' : 'تفعيل'}
                >
                  {form.isActive ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4" />}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <FormBuilderDialog
        open={builderOpen}
        onOpenChange={(v) => { setBuilderOpen(v); if (!v) setEditingForm(null); }}
        existingForm={editingForm}
        onSave={handleSaveForm}
      />

      {sharingForm && (
        <FormSharingTools
          form={sharingForm}
          open={!!sharingForm}
          onOpenChange={(v) => { if (!v) setSharingForm(null); }}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-luxe space-y-4">
            <h3 className="text-lg font-semibold">حذف النموذج</h3>
            <p className="text-sm text-muted-foreground">سيتم حذف النموذج وجميع المتقدمين المرتبطين به. لا يمكن التراجع.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>إلغاء</Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(deleteId)}>حذف</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePosContext } from '@/features/pos/hooks/use-pos-context';
import {
  posMenuCategoriesKey,
  usePosMenuCategories,
} from '@/features/pos/hooks/use-pos-menu-categories';
import { savePosMenuCategories } from '@/features/pos/lib/pos-menu-categories-api';
import { newId } from '@/features/pos/lib/pos-store';

type Draft = { key: string; id?: string; name: string };

/**
 * Selling groups for the register. Names only: each product chooses its
 * group on the product form, the same way it chooses its catalog category.
 */
export function PosMenuCategoriesCard() {
  const { companyId, data, can } = usePosContext();
  const canEdit = can('pos.settings.manage');
  const queryClient = useQueryClient();
  const query = usePosMenuCategories(companyId);
  const [categories, setCategories] = React.useState<Draft[]>([]);
  const [saving, setSaving] = React.useState(false);
  const migrated = React.useRef(false);

  React.useEffect(() => {
    if (!query.data) return;
    setCategories(query.data.map((row) => ({ key: row.id, id: row.id, name: row.name })));
  }, [query.data]);

  React.useEffect(() => {
    if (!canEdit || !companyId || !query.isSuccess || migrated.current) return;
    if ((query.data ?? []).length > 0) return;
    const local = data.menuCategories
      .map((category) => category.name.trim())
      .filter((name) => name.length > 0);
    if (local.length === 0) return;
    migrated.current = true;
    void savePosMenuCategories(
      companyId,
      local.map((name) => ({ name })),
    )
      .then((rows) => {
        queryClient.setQueryData(posMenuCategoriesKey(companyId), rows);
        toast.success('نُقلت فئات نقاط البيع المحفوظة على هذا الجهاز');
      })
      .catch(() => {
        migrated.current = false;
      });
  }, [canEdit, companyId, data.menuCategories, query.data, query.isSuccess, queryClient]);

  const save = async () => {
    if (!companyId) return;
    const named = categories.filter((row) => row.name.trim());
    if (named.length !== categories.length) {
      toast.error('اكتب اسم كل فئة، أو احذف الفارغة');
      return;
    }
    setSaving(true);
    try {
      const rows = await savePosMenuCategories(
        companyId,
        named.map((row) => ({ id: row.id, name: row.name.trim() })),
      );
      queryClient.setQueryData(posMenuCategoriesKey(companyId), rows);
      toast.success('حُفظت فئات نقاط البيع');
    } catch {
      toast.error('تعذّر حفظ الفئات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <h3 className="text-sm font-semibold">فئات نقاط البيع</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        أنشئ أسماء الفئات فقط. اختيار الفئة يتم من المنتج نفسه، مثل الفئة العادية، وتظهر في الكاشير ليختارها البائع ثم الصنف.
      </p>
      <div className="mt-3 space-y-3">
        {query.isLoading ? (
          <p className="text-xs text-muted-foreground">جاري تحميل الفئات…</p>
        ) : null}
        {categories.map((category) => (
          <div key={category.key} className="flex gap-2">
            <Input
              value={category.name}
              disabled={!canEdit}
              onChange={(e) =>
                setCategories((rows) =>
                  rows.map((row) => (row.key === category.key ? { ...row, name: e.target.value } : row)),
                )
              }
              placeholder="اسم الفئة في الصندوق"
            />
            <Button
              type="button"
              variant="outline"
              disabled={!canEdit}
              onClick={() => setCategories((rows) => rows.filter((row) => row.key !== category.key))}
            >
              حذف
            </Button>
          </div>
        ))}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!canEdit}
            onClick={() => setCategories((rows) => [...rows, { key: newId(), name: '' }])}
          >
            فئة جديدة
          </Button>
          <Button type="button" disabled={!canEdit || saving} onClick={() => void save()}>
            حفظ الفئات
          </Button>
        </div>
      </div>
    </section>
  );
}

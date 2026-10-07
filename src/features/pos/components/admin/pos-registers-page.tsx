'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link2, Link2Off, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { branchesApi } from '@/features/hr/organization/lib/api/branches';
import type { PosRegister } from '@/features/pos/domain/types';
import { usePosContext } from '@/features/pos/hooks/use-pos-context';
import { readPairedDevice, writePairedDevice } from '@/features/pos/lib/pos-store';
import { formatDateTime } from '@/features/pos/lib/format';
import { EmptyState, PosGate, PosPreviewNote } from '@/features/pos/components/shared/pos-shared';

type Draft = {
  id?: string;
  name: string;
  code: string;
  branchId: string | null;
  warehouseName: string;
  isActive: boolean;
};

const NO_BRANCH = '__none__';

function RegisterDialog({
  draft,
  onClose,
}: {
  draft: Draft | null;
  onClose: () => void;
}) {
  const { companyId, data, actions } = usePosContext();
  const [form, setForm] = React.useState<Draft | null>(draft);
  React.useEffect(() => setForm(draft), [draft]);

  const branches = useQuery({
    queryKey: ['pos', 'branches', companyId],
    queryFn: () => branchesApi.getAll({ companyId: companyId!, limit: 200 }),
    enabled: !!companyId && !!draft,
  });

  if (!form) return null;
  const codeTaken = data.registers.some(
    (r) => r.id !== form.id && r.code.trim().toUpperCase() === form.code.trim().toUpperCase(),
  );
  const valid = form.name.trim() && form.code.trim() && !codeTaken;

  const save = () => {
    if (!actions || !valid) return;
    const branch = branches.data?.items?.find((b) => b.id === form.branchId);
    actions.saveRegister({
      id: form.id,
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      branchId: form.branchId,
      branchName: branch?.nameAr ?? (form.branchId ? data.registers.find((r) => r.id === form.id)?.branchName ?? null : null),
      warehouseName: form.warehouseName.trim() || null,
      isActive: form.isActive,
    });
    toast.success('حُفظت نقطة البيع');
    onClose();
  };

  return (
    <Dialog open={!!draft} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{form.id ? 'تعديل نقطة بيع' : 'نقطة بيع جديدة'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>الاسم</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="الكاشير 1" />
          </div>
          <div className="space-y-1.5">
            <Label>رمز الترقيم</Label>
            <Input
              dir="ltr"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\s/g, '') })}
              placeholder="POS1"
            />
            <p className="text-xs text-muted-foreground">
              {codeTaken ? 'الرمز مستخدم في نقطة بيع أخرى.' : 'بداية رقم الإيصال الظاهر، مثل POS1-000001. فريد في الشركة.'}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>الفرع</Label>
            <Select
              value={form.branchId ?? NO_BRANCH}
              onValueChange={(v) => setForm({ ...form, branchId: v === NO_BRANCH ? null : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر فرعًا" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_BRANCH}>بدون فرع</SelectItem>
                {(branches.data?.items ?? []).map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.nameAr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {data.settings.stockMode === 'inventory' ? (
            <div className="space-y-1.5">
              <Label>مستودع البيع</Label>
              <Input
                value={form.warehouseName}
                onChange={(e) => setForm({ ...form, warehouseName: e.target.value })}
                placeholder="يُختار من مستودعات الفرع عند ربط الخلفية"
              />
              <p className="text-xs text-muted-foreground">
                مستودع في فرع نقطة البيع. لا يتغير وفيها وردية مفتوحة.
              </p>
            </div>
          ) : null}
          <label className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
            نشطة
            <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={save} disabled={!valid}>
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Registers() {
  const { companyId, data, actions, userName, can } = usePosContext();
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [pairedId, setPairedId] = React.useState<string | null>(null);
  const canManage = can('pos.devices.manage');

  React.useEffect(() => {
    if (companyId) setPairedId(readPairedDevice(companyId));
  }, [companyId]);

  const openSessionFor = (registerId: string) =>
    data.sessions.find((s) => s.registerId === registerId && s.status === 'open');

  const edit = (r: PosRegister) =>
    setDraft({
      id: r.id,
      name: r.name,
      code: r.code,
      branchId: r.branchId,
      warehouseName: r.warehouseName ?? '',
      isActive: r.isActive,
    });

  const pairHere = (registerId: string, registerName: string) => {
    if (!companyId || !actions) return;
    const current = pairedId && data.devices.find((d) => d.id === pairedId && !d.revokedAt);
    if (current) actions.revokeDevice(current.id, userName);
    const id = actions.pairDevice(registerId, `متصفح — ${registerName}`, userName);
    writePairedDevice(companyId, id);
    setPairedId(id);
    toast.success('اقترن هذا المتصفح بنقطة البيع');
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <SetPageTitle titleAr="نقاط البيع والأجهزة" iconName="Settings" />
      <PosPreviewNote />
      <div className="flex justify-end">
        {canManage ? (
          <Button
            size="sm"
            onClick={() => setDraft({ name: '', code: `POS${data.registers.length + 1}`, branchId: null, warehouseName: '', isActive: true })}
          >
            <Plus className="h-4 w-4" />
            نقطة بيع جديدة
          </Button>
        ) : null}
      </div>

      {data.registers.length === 0 ? (
        <EmptyState title="لا توجد نقاط بيع" description="أضف نقطة بيع لكل كاشير أو جهاز في الفرع." />
      ) : (
        <div className="space-y-3">
          {data.registers.map((r) => {
            const devices = data.devices.filter((d) => d.registerId === r.id && !d.revokedAt);
            const session = openSessionFor(r.id);
            return (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 font-semibold">
                      {r.name}
                      {r.isActive ? <Badge variant="success">نشطة</Badge> : <Badge variant="subtle">موقوفة</Badge>}
                      {session ? <Badge variant="warning">وردية مفتوحة</Badge> : null}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      الرمز {r.code} · {r.branchName ?? 'بدون فرع'} · آخر رقم {r.nextSequence - 1}
                      {data.settings.stockMode === 'inventory' ? ` · المستودع: ${r.warehouseName ?? 'غير محدد'}` : ''}
                    </div>
                  </div>
                  {canManage ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => pairHere(r.id, r.name)}>
                        <Link2 className="h-4 w-4" />
                        إقران هذا المتصفح
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => edit(r)}>
                        <Pencil className="h-4 w-4" />
                        تعديل
                      </Button>
                    </div>
                  ) : null}
                </div>
                <div className="mt-3 border-t border-border pt-3">
                  <div className="mb-1 text-xs font-semibold text-muted-foreground">الأجهزة المقترنة</div>
                  {devices.length === 0 ? (
                    <p className="text-xs text-muted-foreground">لا أجهزة. أي متصفح بصلاحية البيع يستطيع فتحها في نسخة التصميم.</p>
                  ) : (
                    <ul className="space-y-1">
                      {devices.map((d) => (
                        <li key={d.id} className="flex items-center justify-between gap-2 text-sm">
                          <span>
                            {d.label}
                            {d.id === pairedId ? <Badge variant="outline" className="ms-2">هذا المتصفح</Badge> : null}
                            <span className="ms-2 text-xs text-muted-foreground">{formatDateTime(d.pairedAt)}</span>
                          </span>
                          {canManage ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                actions?.revokeDevice(d.id, userName);
                                if (d.id === pairedId && companyId) {
                                  writePairedDevice(companyId, null);
                                  setPairedId(null);
                                }
                              }}
                            >
                              <Link2Off className="h-4 w-4" />
                              إلغاء الاقتران
                            </Button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <RegisterDialog draft={draft} onClose={() => setDraft(null)} />
    </div>
  );
}

export function PosRegistersPage() {
  return (
    <PosGate permission="pos.devices.manage">
      <Registers />
    </PosGate>
  );
}

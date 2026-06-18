'use client';

import * as React from 'react';
import { Plus, RefreshCw, Pencil, Trash2, ChevronRight, ChevronDown, User, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useHREmployeeDirectoryStore, type HREmployeeDirectoryRow, type HREmployeeStatus, type HREmployeeHierarchyRole } from '@/features/hr/requests/lib/employee-directory-store';
import { useHRConfigurationStore } from '@/features/hr/requests/lib/configuration-store';
import { buildEmployeeForest, HIERARCHY_ROLE_LABELS, STATUS_LABELS, STATUS_COLORS, type EmpTreeNode } from '@/features/hr/requests/lib/hierarchy-utils';
import { MinimalDropdown, SearchableDropdown, ConfirmationModal, HRSettingsFormDrawer, FormField, EmptyState, Pagination } from '@/features/hr/requests/components/shared-ui';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { TableDateCell, TableRowActions } from '@/components/ui/table-cells';
import { cn, formatDate } from '@/shared/utils';

const LS_VIEW = 'hr_employees_list_view_mode';
const LS_PAGE = 'hr_employees_list_page';
const LS_PER  = 'hr_employees_list_per';

const ROLE_OPTIONS: { value: HREmployeeHierarchyRole; label: string }[] = [
  { value: 'ceo',       label: 'الرئيس التنفيذي' },
  { value: 'executive', label: 'تنفيذي' },
  { value: 'gm',        label: 'مدير عام' },
  { value: 'dept_head', label: 'رئيس قسم' },
  { value: 'supervisor',label: 'مشرف' },
  { value: 'staff',     label: 'موظف' },
];
const STATUS_OPTIONS: { value: HREmployeeStatus; label: string }[] = [
  { value: 'active',    label: 'نشط' },
  { value: 'probation', label: 'تحت التجربة' },
  { value: 'suspended', label: 'موقوف' },
];

interface DraftForm {
  bridgeId: string; nameAr: string; nationalId: string;
  departmentId: string; jobTitleAr: string; jobTitleEn: string; hireDate: string;
  status: HREmployeeStatus; email: string; mobile: string; notes: string;
  reportsToId: string; hierarchyRole: HREmployeeHierarchyRole;
}
const EMPTY: DraftForm = {
  bridgeId: '', nameAr: '', nationalId: '', departmentId: '',
  jobTitleAr: '', jobTitleEn: '', hireDate: '', status: 'active',
  email: '', mobile: '', notes: '', reportsToId: '', hierarchyRole: 'staff',
};

// ─── Org chart node ───────────────────────────────────────────────────────────
function OrgNode({ node, onSelect, depth = 0 }: { node: EmpTreeNode; onSelect: (e: HREmployeeDirectoryRow) => void; depth?: number }) {
  const [expanded, setExpanded] = React.useState(true);
  const hasChildren = node.children.length > 0;
  return (
    <div className={cn('relative', depth > 0 && 'border-r border-dashed border-border/60 mr-4 sm:mr-6 pr-3 sm:pr-4')}>
      <div
        className="group mb-1 flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-soft hover:border-primary/30 hover:bg-primary/5 transition-all"
        onClick={() => onSelect(node.emp)}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {node.emp.nameAr.split(' ').map(w => w[0]).slice(0, 2).join('')}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{node.emp.nameAr}</p>
          <p className="truncate text-[11px] text-muted-foreground">{node.emp.jobTitleAr}</p>
        </div>
        {hasChildren && (
          <button type="button" className="shrink-0 text-muted-foreground hover:text-foreground" onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}>
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        )}
      </div>
      {expanded && hasChildren && (
        <div className="mt-1 space-y-1 pr-3 sm:pr-4">
          {node.children.map(child => <OrgNode key={child.emp.id} node={child} onSelect={onSelect} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: HREmployeeStatus }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium', STATUS_COLORS[status])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  );
}

// ─── Employee card (mobile) ───────────────────────────────────────────────────
function EmployeeCard({ emp, getDeptName, onView, onEdit, onDelete }: {
  emp: HREmployeeDirectoryRow;
  getDeptName: (id: string) => string;
  onView: () => void; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-soft hover:border-primary/20 transition-colors cursor-pointer"
      onClick={onView}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
        {emp.nameAr.split(' ').map(w => w[0]).slice(0, 2).join('')}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold text-sm">{emp.nameAr}</p>
            <p className="text-[11px] text-muted-foreground" dir="ltr">{emp.bridgeId}</p>
          </div>
          <StatusBadge status={emp.status} />
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span>{getDeptName(emp.departmentId)}</span>
          <span>·</span>
          <span>{emp.jobTitleAr}</span>
        </div>
      </div>
      <div className="flex shrink-0 gap-1" onClick={e => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
interface Props { openEmployeeId?: string | null; onClearDeepLink: () => void; }

export function EmployeeTab({ openEmployeeId, onClearDeepLink }: Props) {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useHREmployeeDirectoryStore();
  const { departments, fetchDepartments } = useHRConfigurationStore();

  React.useEffect(() => { fetchDepartments(); }, []);

  const [view, setView]           = React.useState<'list' | 'chart'>(() => (typeof window !== 'undefined' ? localStorage.getItem(LS_VIEW) as 'list' | 'chart' : null) ?? 'list');
  const [filterDept, setFilterDept]     = React.useState('all');
  const [filterStatus, setFilterStatus] = React.useState('all');
  const [filtersOpen, setFiltersOpen]   = React.useState(false);
  const [refreshing, setRefreshing]     = React.useState(false);
  const [page, setPage]       = React.useState(() => typeof window !== 'undefined' ? Number(localStorage.getItem(LS_PAGE) ?? '1') : 1);
  const [perPage, setPerPage] = React.useState(() => typeof window !== 'undefined' ? Number(localStorage.getItem(LS_PER) ?? '15') : 15);

  const [sidebarMode, setSidebarMode] = React.useState<'view' | 'edit' | 'create' | null>(null);
  const [selected, setSelected]       = React.useState<HREmployeeDirectoryRow | null>(null);
  const [draft, setDraft]             = React.useState<DraftForm>(EMPTY);
  const [formError, setFormError]     = React.useState<string | null>(null);
  const [deleteId, setDeleteId]       = React.useState<string | null>(null);

  // Deep link
  React.useEffect(() => {
    if (openEmployeeId) {
      const emp = employees.find(e => e.id === openEmployeeId);
      if (emp) { setSelected(emp); setSidebarMode('view'); }
      onClearDeepLink();
    }
  }, [openEmployeeId, employees, onClearDeepLink]);

  React.useEffect(() => { localStorage.setItem(LS_VIEW, view); }, [view]);
  React.useEffect(() => { localStorage.setItem(LS_PAGE, String(page)); }, [page]);
  React.useEffect(() => { localStorage.setItem(LS_PER, String(perPage)); }, [perPage]);

  const deptOptions = [{ value: 'all', label: 'جميع الأقسام' }, ...departments.map(d => ({ value: d.id, label: d.nameAr }))];

  const filtered = React.useMemo(() => {
    return employees.filter(e => {
      if (filterDept !== 'all' && e.departmentId !== filterDept) return false;
      if (filterStatus !== 'all' && e.status !== filterStatus) return false;
      return true;
    });
  }, [employees, filterDept, filterStatus]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const openView   = (emp: HREmployeeDirectoryRow) => { setSelected(emp); setSidebarMode('view'); };
  const openEdit   = (emp: HREmployeeDirectoryRow) => {
    setSelected(emp);
    setDraft({ bridgeId: emp.bridgeId, nameAr: emp.nameAr, nationalId: emp.nationalId, departmentId: emp.departmentId, jobTitleAr: emp.jobTitleAr, jobTitleEn: emp.jobTitleEn, hireDate: emp.hireDate, status: emp.status, email: emp.email ?? '', mobile: emp.mobile ?? '', notes: emp.notes ?? '', reportsToId: emp.reportsToId ?? '', hierarchyRole: emp.hierarchyRole });
    setFormError(null);
    setSidebarMode('edit');
  };
  const openCreate = () => {
    setSelected(null);
    setDraft({ ...EMPTY, bridgeId: `NW-${1000 + employees.length + 1}` });
    setFormError(null);
    setSidebarMode('create');
  };

  const handleSave = () => {
    if (!draft.nameAr.trim()) { setFormError('الاسم مطلوب'); return; }
    if (!draft.departmentId) { setFormError('القسم مطلوب'); return; }
    const payload = { ...draft, nameEn: draft.nameAr.trim(), reportsToId: draft.reportsToId || null, email: draft.email || undefined, mobile: draft.mobile || undefined, notes: draft.notes || undefined };
    if (sidebarMode === 'create') addEmployee(payload);
    else if (sidebarMode === 'edit' && selected) updateEmployee(selected.id, payload);
    setSidebarMode(null);
  };

  const patch = <K extends keyof DraftForm>(k: K, v: DraftForm[K]) => setDraft(d => ({ ...d, [k]: v }));
  const empOptions = employees.filter(e => e.id !== selected?.id).map(e => ({ value: e.id, label: e.nameAr, sub: e.jobTitleAr }));
  const forest     = React.useMemo(() => buildEmployeeForest(filtered), [filtered]);
  const getDeptName = (id: string) => departments.find(d => d.id === id)?.nameAr ?? id;

  const hasActiveFilters = filterDept !== 'all' || filterStatus !== 'all';

  const columns = React.useMemo((): ColumnDef<HREmployeeDirectoryRow>[] => [
    {
      key: 'employee',
      title: 'الموظف',
      headerClassName: 'w-[22%]',
      render: (emp) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {emp.nameAr.split(' ').map(w => w[0]).slice(0, 2).join('')}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold">{emp.nameAr}</p>
            <p className="truncate text-[11px] text-muted-foreground" dir="ltr">{emp.bridgeId}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      title: 'القسم',
      headerClassName: 'w-[14%]',
      className: 'text-xs text-muted-foreground',
      render: (emp) => <span className="line-clamp-2">{getDeptName(emp.departmentId)}</span>,
    },
    {
      key: 'hierarchy',
      title: 'المستوى',
      headerClassName: 'w-[12%]',
      className: 'text-xs',
      render: (emp) => <span className="line-clamp-2">{HIERARCHY_ROLE_LABELS[emp.hierarchyRole]}</span>,
    },
    {
      key: 'jobTitle',
      title: 'المسمى',
      headerClassName: 'w-[18%]',
      className: 'text-xs',
      render: (emp) => <span className="line-clamp-2">{emp.jobTitleAr}</span>,
    },
    {
      key: 'hireDate',
      title: 'تاريخ التعيين',
      headerClassName: 'w-[14%]',
      className: 'text-xs text-muted-foreground',
      render: (emp) => <TableDateCell value={emp.hireDate} />,
    },
    {
      key: 'status',
      title: 'الحالة',
      headerClassName: 'w-[12%]',
      render: (emp) => <StatusBadge status={emp.status} />,
    },
    {
      key: 'actions',
      title: '',
      isActions: true,
      headerClassName: 'w-16 lg:w-20',
      render: (emp) => (
        <TableRowActions
          menuItems={[
            { label: 'تعديل', icon: <Pencil className="h-3.5 w-3.5" />, onClick: (e) => { e.stopPropagation(); openEdit(emp); } },
            { label: 'حذف', icon: <Trash2 className="h-3.5 w-3.5" />, onClick: (e) => { e.stopPropagation(); setDeleteId(emp.id); }, destructive: true, separator: true },
          ]}
        />
      ),
    },
  ], [getDeptName]);

  return (
    <div className="w-full min-w-0 space-y-3">

      {/* ── Top toolbar ── */}
      <div className="flex w-full min-w-0 flex-wrap items-center gap-2">
        {/* View toggle */}
        <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1">
          {(['list', 'chart'] as const).map(v => (
            <button key={v} type="button" onClick={() => setView(v)}
              className={cn('rounded-lg px-3 py-1.5 text-xs font-medium transition-all', view === v ? 'bg-background shadow-soft text-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {v === 'list' ? 'قائمة' : 'مخطط'}
            </button>
          ))}
        </div>

        {/* Filter toggle (mobile) */}
        <Button
          variant="outline" size="sm"
          className={cn('gap-1.5 sm:hidden', hasActiveFilters && 'border-primary/50 text-primary')}
          onClick={() => setFiltersOpen(v => !v)}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          فلترة
          {hasActiveFilters && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">!</span>}
        </Button>

        {/* Dept + Status filters — desktop inline */}
        <div className="hidden sm:flex items-center gap-2">
          <MinimalDropdown value={filterDept} onChange={v => { setFilterDept(v); setPage(1); }} options={deptOptions} className="h-9 text-xs w-36" />
          <MinimalDropdown value={filterStatus} onChange={v => { setFilterStatus(v); setPage(1); }} options={[{ value: 'all', label: 'جميع الحالات' }, ...STATUS_OPTIONS]} className="h-9 text-xs w-32" />
        </div>

        <div className="hidden min-w-0 flex-1 sm:block" aria-hidden />

        {/* Refresh */}
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 700); }} disabled={refreshing}>
          <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
        </Button>

        <Button variant="luxe" size="sm" className="shrink-0 gap-1.5" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">موظف جديد</span>
          <span className="sm:hidden">جديد</span>
        </Button>
      </div>

      {/* ── Mobile filter panel ── */}
      {filtersOpen && (
        <div className="sm:hidden rounded-xl border border-border bg-card p-4 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">الفلاتر</span>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button type="button" className="text-xs text-muted-foreground underline" onClick={() => { setFilterDept('all'); setFilterStatus('all'); setPage(1); }}>
                  مسح الكل
                </button>
              )}
              <button type="button" onClick={() => setFiltersOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <MinimalDropdown value={filterDept} onChange={v => { setFilterDept(v); setPage(1); }} options={deptOptions} placeholder="القسم" />
            <MinimalDropdown value={filterStatus} onChange={v => { setFilterStatus(v); setPage(1); }} options={[{ value: 'all', label: 'جميع الحالات' }, ...STATUS_OPTIONS]} placeholder="الحالة" />
          </div>
        </div>
      )}

      {/* ── Content ── */}
      {view === 'list' ? (
        <div className="w-full min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-soft">
          {paginated.length === 0 ? (
            <EmptyState icon={User} title="لا يوجد موظفون" />
          ) : (
            <>
              <div className="hidden min-w-0 md:block">
                <DataTable
                  variant="directory"
                  alwaysShowTable
                  tableClassName="min-w-0 table-fixed"
                  className="border-0 shadow-none rounded-none"
                  columns={columns}
                  data={paginated}
                  keyExtractor={(emp) => emp.id}
                  onRowClick={openView}
                />
              </div>

              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-border/60">
                {paginated.map(emp => (
                  <div key={emp.id} className="p-3">
                    <EmployeeCard
                      emp={emp}
                      getDeptName={getDeptName}
                      onView={() => openView(emp)}
                      onEdit={() => openEdit(emp)}
                      onDelete={() => setDeleteId(emp.id)}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
          <Pagination page={page} perPage={perPage} total={filtered.length} onPage={setPage} onPerPage={p => { setPerPage(p); setPage(1); }} />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-soft overflow-x-auto">
          {forest.length === 0 ? <EmptyState icon={User} title="لا يوجد موظفون" /> : (
            <div className="space-y-2 min-w-[280px]">
              {forest.map(n => <OrgNode key={n.emp.id} node={n} onSelect={openView} />)}
            </div>
          )}
        </div>
      )}

      {/* ── Create / Edit drawer ── */}
      <HRSettingsFormDrawer
        open={sidebarMode === 'create' || sidebarMode === 'edit'}
        onOpenChange={v => { if (!v) setSidebarMode(null); }}
        title={sidebarMode === 'create' ? 'إضافة موظف جديد' : 'تعديل بيانات الموظف'}
        onSave={handleSave} error={formError} size="lg"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="رقم الموظف" required><Input value={draft.bridgeId} onChange={e => patch('bridgeId', e.target.value)} placeholder="NW-1001" dir="ltr" /></FormField>
          <FormField label="القسم" required>
            <MinimalDropdown value={draft.departmentId} onChange={v => patch('departmentId', v)} options={departments.filter(d => d.isActive).map(d => ({ value: d.id, label: d.nameAr }))} placeholder="اختر القسم" />
          </FormField>
          <FormField label="الاسم" required span2><Input value={draft.nameAr} onChange={e => patch('nameAr', e.target.value)} /></FormField>
          <FormField label="رقم الهوية" required><Input value={draft.nationalId} onChange={e => patch('nationalId', e.target.value)} dir="ltr" /></FormField>
          <FormField label="تاريخ التعيين"><Input type="date" dir="ltr" value={draft.hireDate} onChange={e => patch('hireDate', e.target.value)} /></FormField>
          <FormField label="المسمى بالعربية" span2><Input value={draft.jobTitleAr} onChange={e => patch('jobTitleAr', e.target.value)} /></FormField>
          <FormField label="المسمى بالإنجليزية" span2><Input dir="ltr" value={draft.jobTitleEn} onChange={e => patch('jobTitleEn', e.target.value)} /></FormField>
          <FormField label="المستوى الوظيفي">
            <MinimalDropdown value={draft.hierarchyRole} onChange={v => patch('hierarchyRole', v as HREmployeeHierarchyRole)} options={ROLE_OPTIONS} />
          </FormField>
          <FormField label="الحالة">
            <MinimalDropdown value={draft.status} onChange={v => patch('status', v as HREmployeeStatus)} options={STATUS_OPTIONS} />
          </FormField>
          <FormField label="المدير المباشر" span2>
            <SearchableDropdown value={draft.reportsToId} onChange={v => patch('reportsToId', v)} options={empOptions} placeholder="لا يوجد مدير مباشر" allowClear />
          </FormField>
          <FormField label="البريد الإلكتروني"><Input type="email" dir="ltr" value={draft.email} onChange={e => patch('email', e.target.value)} /></FormField>
          <FormField label="الجوال"><Input dir="ltr" value={draft.mobile} onChange={e => patch('mobile', e.target.value)} /></FormField>
          <FormField label="ملاحظات" span2><Input value={draft.notes} onChange={e => patch('notes', e.target.value)} /></FormField>
        </div>
      </HRSettingsFormDrawer>

      {/* ── View modal ── */}
      {sidebarMode === 'view' && selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setSidebarMode(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-luxe space-y-4 max-h-[90dvh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle bar (mobile) */}
            <div className="sm:hidden mx-auto mb-1 h-1 w-10 rounded-full bg-border" />

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                {selected.nameAr.split(' ').map(w => w[0]).slice(0, 2).join('')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl font-bold truncate">{selected.nameAr}</p>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-sm">
              {([
                ['القسم',        getDeptName(selected.departmentId)],
                ['المسمى',       selected.jobTitleAr],
                ['المستوى',      HIERARCHY_ROLE_LABELS[selected.hierarchyRole]],
                ['تاريخ التعيين', selected.hireDate ? formatDate(selected.hireDate) : '—'],
                ['الهوية',       selected.nationalId],
                ['الجوال',       selected.mobile ?? '—'],
                ['البريد',       selected.email ?? '—', true],
              ] as [string, string, boolean?][]).map(([label, value, full]) => (
                <div key={label} className={cn('rounded-lg bg-muted/30 p-2.5', full && 'col-span-2')}>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                  <p className="font-medium truncate" dir={label === 'البريد' || label === 'الجوال' ? 'ltr' : undefined}>{value}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setSidebarMode(null)}>إغلاق</Button>
              <Button variant="luxe" className="flex-1 gap-1.5" onClick={() => openEdit(selected)}>
                <Pencil className="h-3.5 w-3.5" />تعديل
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}
        title="حذف الموظف"
        description="سيتم حذف الموظف وإزالته من هيكل التقارير لمن يتبع له."
        onConfirm={() => { if (deleteId) deleteEmployee(deleteId); setDeleteId(null); }}
      />
    </div>
  );
}

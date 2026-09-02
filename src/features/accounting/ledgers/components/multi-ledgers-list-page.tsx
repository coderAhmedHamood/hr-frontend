'use client';

import * as React from 'react';
import {
  Search,
  Settings2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  GripVertical,
  SlidersHorizontal,
  Trash2,
  X,
  Plus,
  CalendarDays,
} from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLedgersStore } from '@/features/accounting/ledgers/lib/ledgers-store';
import { AVAILABLE_JOURNALS } from '@/features/accounting/ledgers/lib/mock-ledgers';
import type { LedgerGroup } from '@/features/accounting/domain/types/ledger-group';

export function MultiLedgersListPage() {
  const ledgerGroups = useLedgersStore((state) => state.ledgerGroups);
  const addLedgerGroup = useLedgersStore((state) => state.addLedgerGroup);
  const updateLedgerGroup = useLedgersStore((state) => state.updateLedgerGroup);
  const removeLedgerGroup = useLedgersStore((state) => state.removeLedgerGroup);

  const [search, setSearch] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // Inline editing / new row state
  const [isCreatingNew, setIsCreatingNew] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const [draftName, setDraftName] = React.useState('');
  const [draftExcludedJournals, setDraftExcludedJournals] = React.useState<string[]>([]);

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return ledgerGroups;
    return ledgerGroups.filter(
      (g) =>
        g.name.toLowerCase().includes(term) ||
        g.excludedJournals.some((j) => j.toLowerCase().includes(term)),
    );
  }, [ledgerGroups, search]);

  const handleStartCreate = () => {
    setIsCreatingNew(true);
    setEditingId(null);
    setDraftName('');
    setDraftExcludedJournals([]);
  };

  const handleStartEdit = (group: LedgerGroup) => {
    setEditingId(group.id);
    setIsCreatingNew(false);
    setDraftName(group.name);
    setDraftExcludedJournals([...group.excludedJournals]);
  };

  const handleDiscard = () => {
    setIsCreatingNew(false);
    setEditingId(null);
    setDraftName('');
    setDraftExcludedJournals([]);
  };

  const handleSave = () => {
    if (!draftName.trim()) {
      handleDiscard();
      return;
    }

    if (isCreatingNew) {
      addLedgerGroup({
        name: draftName.trim(),
        excludedJournals: draftExcludedJournals,
      });
    } else if (editingId) {
      updateLedgerGroup(editingId, {
        name: draftName.trim(),
        excludedJournals: draftExcludedJournals,
      });
    }

    setIsCreatingNew(false);
    setEditingId(null);
    setDraftName('');
    setDraftExcludedJournals([]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((g) => g.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleJournalInDraft = (journal: string) => {
    setDraftExcludedJournals((prev) =>
      prev.includes(journal) ? prev.filter((j) => j !== journal) : [...prev, journal],
    );
  };

  const isEditingOrCreating = isCreatingNew || editingId !== null;

  return (
    <div className="flex flex-col gap-4">
      <SetPageTitle
        titleAr="دفتر الأستاذ المتعدد"
        descriptionAr="إدارة مجموعات دفاتر الأستاذ واستثناءات دفاتر اليومية"
        iconName="CalendarDays"
      />

      {/* Top Controls Bar (Matching Screenshot) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-background p-2 border border-border/40 shadow-xs">
        {/* Right side in RTL (Title and Action buttons) */}
        <div className="flex items-center gap-2 order-1 md:order-2">
          {isEditingOrCreating ? (
            <>
              <Button
                type="button"
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 h-9 font-medium shadow-xs"
                onClick={handleSave}
              >
                حفظ
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-lg px-4 h-9 text-sm border-border/60"
                onClick={handleDiscard}
              >
                إهمال
              </Button>
            </>
          ) : (
            <Button
              type="button"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 h-9 font-medium shadow-xs"
              onClick={handleStartCreate}
            >
              جديد
            </Button>
          )}

          <div className="flex items-center gap-1.5 me-1">
            <span className="text-lg font-bold text-foreground">دفتر الأستاذ المتعدد</span>
            <Settings2 className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
          </div>
        </div>

        {/* Center: Search input with dropdown icon */}
        <div className="flex items-center gap-2 flex-1 max-w-md mx-auto order-3 md:order-2">
          <div className="relative w-full">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="...بحث"
              className="ps-4 pe-10 h-9 rounded-lg text-sm bg-muted/20 border-border/60 focus:bg-background transition-colors"
            />
            <div className="absolute end-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted-foreground">
              <Search className="h-4 w-4" />
              <ChevronDown className="h-3 w-3 text-muted-foreground/60" />
            </div>
          </div>
        </div>

        {/* Left side in RTL (Pagination) */}
        <div className="flex items-center gap-2 order-2 md:order-1">
          <div className="flex items-center rounded-md border border-border/60 bg-muted/20 text-muted-foreground">
            <button
              type="button"
              className="p-1.5 hover:text-foreground hover:bg-background rounded-s transition-colors disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="p-1.5 hover:text-foreground hover:bg-background rounded-e transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          <span className="text-xs text-muted-foreground font-mono tabular-nums px-1">
            {ledgerGroups.length + (isCreatingNew ? 1 : 0)} / 1-{filtered.length + (isCreatingNew ? 1 : 0)}
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-lg border border-border/60 bg-card shadow-xs">
        <table className="w-full text-sm">
          <thead className="border-b border-border/60 bg-muted/30 text-muted-foreground select-none">
            <tr>
              <th className="w-10 px-3 py-3 text-start">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selectedIds.length === filtered.length}
                  onChange={toggleSelectAll}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                />
              </th>
              <th className="px-4 py-3 text-start font-semibold text-foreground w-1/3">
                مجموعة دفتر الأستاذ
              </th>
              <th className="px-4 py-3 text-start font-semibold text-foreground">
                دفاتر اليومية المستثناة
              </th>
              <th className="w-10 px-2 py-3 text-start">
                <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground/70" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {filtered.map((group) => {
              const isSelected = selectedIds.includes(group.id);
              const isEditingThis = editingId === group.id;

              if (isEditingThis) {
                return (
                  <tr key={group.id} className="bg-muted/10">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(group.id)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                        <Input
                          autoFocus
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') handleDiscard();
                          }}
                          placeholder="...مثال: IFRS, GAAP"
                          className="h-8 text-sm rounded-md bg-background border-border/70"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {draftExcludedJournals.map((j) => (
                          <span
                            key={j}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300/40"
                          >
                            {j}
                            <button
                              type="button"
                              onClick={() => toggleJournalInDraft(j)}
                              className="hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs px-2 gap-1 rounded-full border-dashed"
                            >
                              <Plus className="h-3 w-3" />
                              <span>إضافة دفتر</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {AVAILABLE_JOURNALS.map((j) => (
                              <DropdownMenuCheckboxItem
                                key={j}
                                checked={draftExcludedJournals.includes(j)}
                                onCheckedChange={() => toggleJournalInDraft(j)}
                              >
                                {j}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLedgerGroup(group.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              }

              return (
                <tr
                  key={group.id}
                  className={`group transition-colors cursor-pointer ${
                    isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'
                  }`}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('input[type="checkbox"]') || target.closest('button')) return;
                    handleStartEdit(group);
                  }}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(group.id)}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground">{group.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {group.excludedJournals.map((j) => (
                        <span
                          key={j}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300/40"
                        >
                          {j}
                        </span>
                      ))}
                      {group.excludedJournals.length === 0 && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLedgerGroup(group.id)}
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}

            {/* Inline Creation Row (Shown when isCreatingNew is true) */}
            {isCreatingNew && (
              <tr className="bg-muted/10 border-t border-dashed border-primary/40">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    disabled
                    className="rounded border-border text-primary opacity-50 h-4 w-4"
                  />
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1.5">
                    <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    <Input
                      autoFocus
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave();
                        if (e.key === 'Escape') handleDiscard();
                      }}
                      placeholder="...مثال: IFRS, GAAP"
                      className="h-8 text-sm rounded-md bg-background border-primary/50 focus:border-primary"
                    />
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {draftExcludedJournals.map((j) => (
                      <span
                        key={j}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300/40"
                      >
                        {j}
                        <button
                          type="button"
                          onClick={() => toggleJournalInDraft(j)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2 gap-1 rounded-full border-dashed"
                        >
                          <Plus className="h-3 w-3" />
                          <span>إضافة دفتر</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {AVAILABLE_JOURNALS.map((j) => (
                          <DropdownMenuCheckboxItem
                            key={j}
                            checked={draftExcludedJournals.includes(j)}
                            onCheckedChange={() => toggleJournalInDraft(j)}
                          >
                            {j}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
                <td className="px-2 py-2 text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleDiscard}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            )}

            {filtered.length === 0 && !isCreatingNew && (
              <tr>
                <td colSpan={4} className="px-4 py-16 text-center text-muted-foreground">
                  <CalendarDays className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                  لا توجد مجموعات دفاتر أستاذ مضافة بعد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings2,
  ChevronRight,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  SlidersHorizontal,
  HelpCircle,
  Undo2,
} from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { accountingRoutes } from '@/features/accounting/constants/routes';
import { useJournalEntriesStore } from '@/features/accounting/journal-entries/lib/journal-entries-store';
import type { JournalEntry, JournalItem } from '@/features/accounting/domain/types/journal-entry';

interface JournalEntryFormPageProps {
  entryId?: string;
}

export function JournalEntryFormPage({ entryId }: JournalEntryFormPageProps) {
  const router = useRouter();
  const isNew = !entryId || entryId === 'new';

  const getEntry = useJournalEntriesStore((state) => state.getEntry);
  const saveEntry = useJournalEntriesStore((state) => state.saveEntry);
  const postEntry = useJournalEntriesStore((state) => state.postEntry);
  const resetToDraft = useJournalEntriesStore((state) => state.resetToDraft);
  const reverseEntry = useJournalEntriesStore((state) => state.reverseEntry);

  const existing = React.useMemo(() => {
    if (isNew) return null;
    return getEntry(entryId);
  }, [isNew, entryId, getEntry]);

  // Form State
  const [name, setName] = React.useState(existing?.name || '/');
  const [date, setDate] = React.useState(existing?.date || new Date().toISOString().split('T')[0]);
  const [accountingDate, setAccountingDate] = React.useState(
    existing?.accountingDate || existing?.date || new Date().toISOString().split('T')[0],
  );
  const [reference, setReference] = React.useState(existing?.reference || '');
  const [journalId, setJournalId] = React.useState(existing?.journalId || 'misc');
  const [journalName, setJournalName] = React.useState(existing?.journalName || 'عمليات متنوعة');
  const [autoPost, setAutoPost] = React.useState(existing?.autoPost || false);
  const [fiscalPosition, setFiscalPosition] = React.useState(existing?.fiscalPosition || '');
  const [nonModifiableEncryption, setNonModifiableEncryption] = React.useState(
    existing?.nonModifiableEncryption || '',
  );
  const [internalNotes, setInternalNotes] = React.useState(existing?.internalNotes || '');
  const [state, setState] = React.useState<'draft' | 'posted' | 'cancel'>(existing?.state || 'draft');

  // Active Tab: 'items' (عناصر اليومية) | 'other' (معلومات أخرى)
  const [activeTab, setActiveTab] = React.useState<'items' | 'other'>('items');

  // Items State
  const [items, setItems] = React.useState<JournalItem[]>(
    existing?.items || [
      {
        id: 'ji-1',
        accountId: '121000 حساب مدين',
        partnerName: 'علي بن علي',
        name: 'التحويل إلى 211000 حساب الدائن',
        debit: 0,
        credit: 1150,
        taxGrids: '',
      },
      {
        id: 'ji-2',
        accountId: '211000 حساب الدائن',
        partnerName: 'علي بن علي',
        name: 'التحويل من 121000 حساب مدين',
        debit: 1150,
        credit: 0,
        taxGrids: '',
      },
    ],
  );

  const [savedSuccess, setSavedSuccess] = React.useState(false);

  // Sync state if existing updates
  React.useEffect(() => {
    if (existing) {
      setName(existing.name);
      setDate(existing.date);
      setAccountingDate(existing.accountingDate || existing.date);
      setReference(existing.reference || '');
      setJournalId(existing.journalId);
      setJournalName(existing.journalName);
      setAutoPost(existing.autoPost || false);
      setFiscalPosition(existing.fiscalPosition || '');
      setNonModifiableEncryption(existing.nonModifiableEncryption || '');
      setInternalNotes(existing.internalNotes || '');
      setState(existing.state);
      setItems(existing.items);
    }
  }, [existing]);

  // Totals calculation
  const { totalDebit, totalCredit } = React.useMemo(() => {
    let debit = 0;
    let credit = 0;
    items.forEach((item) => {
      debit += Number(item.debit) || 0;
      credit += Number(item.credit) || 0;
    });
    return { totalDebit: debit, totalCredit: credit };
  }, [items]);

  const handleAddItem = () => {
    const newItem: JournalItem = {
      id: `ji-${Date.now()}`,
      accountId: '101000 الصندوق الرئيسي',
      partnerName: '',
      name: '',
      debit: 0,
      credit: 0,
      taxGrids: '',
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleUpdateItem = (index: number, field: keyof JournalItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const recordId = isNew ? `je-${Date.now()}` : entryId!;
    const entryRecord: JournalEntry = {
      id: recordId,
      name: name === '/' && isNew ? `المتف/2026/09/${Math.floor(1000 + Math.random() * 9000)}` : name,
      date,
      accountingDate,
      reference,
      journalId,
      journalName,
      partnerName: items.find((i) => i.partnerName)?.partnerName || '',
      total: Math.max(totalDebit, totalCredit),
      state,
      autoPost,
      fiscalPosition,
      nonModifiableEncryption,
      internalNotes,
      items,
    };

    saveEntry(entryRecord);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);

    if (isNew) {
      router.replace(`${accountingRoutes.journalEntries}/${recordId}`);
    }
  };

  const handlePost = () => {
    if (!isNew && entryId) {
      postEntry(entryId);
      setState('posted');
    } else {
      setState('posted');
      handleSave();
    }
  };

  const handleResetDraft = () => {
    if (!isNew && entryId) {
      resetToDraft(entryId);
      setState('draft');
    } else {
      setState('draft');
    }
  };

  const handleReverse = () => {
    if (!isNew && entryId) {
      const newRevId = reverseEntry(entryId);
      if (newRevId) {
        router.push(`${accountingRoutes.journalEntries}/${newRevId}`);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 font-sans max-w-7xl mx-auto" dir="rtl">
      <SetPageTitle
        titleAr={name === '/' || isNew ? 'قيد يومية جديد' : name}
        descriptionAr="تفاصيل وترحيل قيد اليومية"
        iconName="ListOrdered"
      />

      {/* Top Header & Breadcrumbs & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-background p-3 border border-border/40 shadow-xs">
        {/* Breadcrumb + Left Save / New Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-medium"
            onClick={() => router.push(accountingRoutes.journalEntries)}
          >
            قيود اليومية
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-bold text-foreground">{name === '/' ? 'جديد' : name}</span>

          <div className="ms-4 flex items-center gap-2">
            <Button
              type="button"
              className="bg-[#714B67] hover:bg-[#5e3e56] text-white rounded px-4 h-8 text-xs font-medium shadow-xs"
              onClick={handleSave}
            >
              {savedSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5 me-1" /> تم الحفظ
                </>
              ) : (
                'حفظ'
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-medium"
              onClick={() => router.push(`${accountingRoutes.journalEntries}/new`)}
            >
              جديد
            </Button>
          </div>
        </div>

        {/* Right side Status Ribbon & Action Buttons (Odoo Flow) */}
        <div className="flex items-center gap-2">
          {state === 'posted' ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-medium text-foreground hover:bg-muted"
                onClick={handleReverse}
              >
                عكس القيد
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-medium text-foreground hover:bg-muted"
                onClick={handleResetDraft}
              >
                إعادة التعيين كمسودة
              </Button>
            </>
          ) : (
            <Button
              className="bg-[#714B67] hover:bg-[#5e3e56] text-white h-8 text-xs font-medium"
              onClick={handlePost}
            >
              ترحيل
            </Button>
          )}

          {/* Odoo Status Chevron Ribbon */}
          <div className="flex items-center text-xs font-medium border border-border/80 rounded overflow-hidden ms-2">
            <div
              className={`px-3 py-1.5 transition-colors ${
                state === 'posted'
                  ? 'bg-teal-700 text-white font-bold'
                  : 'bg-muted/40 text-muted-foreground'
              }`}
            >
              مُرحّل
            </div>
            <div
              className={`px-3 py-1.5 transition-colors border-s border-border/80 ${
                state === 'draft'
                  ? 'bg-teal-700 text-white font-bold'
                  : 'bg-muted/40 text-muted-foreground'
              }`}
            >
              مسودة
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Sheet */}
      <div className="rounded-xl border border-border/60 bg-background shadow-xs p-6 md:p-8 space-y-6">
        {/* Main Title / Entry Name */}
        <div className="space-y-1">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-2xl md:text-3xl font-extrabold text-foreground border-none p-0 h-auto focus-visible:ring-0 focus-visible:border-b rounded-none shadow-none font-mono"
            placeholder="/"
          />
        </div>

        {/* Main Fields Grid matching Screenshot */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 pt-2 text-sm">
          {/* Column 1 */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 items-center gap-2">
              <label className="text-muted-foreground font-medium text-xs">تاريخ المحاسبة</label>
              <Input
                type="date"
                value={accountingDate}
                onChange={(e) => setAccountingDate(e.target.value)}
                className="col-span-2 h-8 text-xs rounded border-border/60"
              />
            </div>

            <div className="grid grid-cols-3 items-center gap-2">
              <label className="text-muted-foreground font-medium text-xs">دفتر اليومية</label>
              <div className="col-span-2">
                <select
                  value={journalName}
                  onChange={(e) => {
                    setJournalName(e.target.value);
                    if (e.target.value === 'المبيعات') setJournalId('sales');
                    else if (e.target.value === 'تقسيم المخزون') setJournalId('stock');
                    else setJournalId('misc');
                  }}
                  className="w-full h-8 text-xs rounded border border-border/60 bg-background px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="عمليات متنوعة">عمليات متنوعة</option>
                  <option value="المبيعات">المبيعات</option>
                  <option value="تقسيم المخزون">تقسيم المخزون</option>
                  <option value="المشتريات">المشتريات</option>
                  <option value="البنك">البنك</option>
                  <option value="النقدية">النقدية</option>
                </select>
              </div>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 items-center gap-2">
              <label className="text-muted-foreground font-medium text-xs">الرقم المرجعي</label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="مثال: S00003 أو Stock Closing"
                className="col-span-2 h-8 text-xs rounded border-border/60"
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-border/60 pt-4 flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('items')}
            className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'items'
                ? 'border-[#714B67] text-[#714B67] dark:text-purple-300'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            عناصر اليومية
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('other')}
            className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'other'
                ? 'border-[#714B67] text-[#714B67] dark:text-purple-300'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            معلومات أخرى
          </button>
        </div>

        {/* Tab 1: عناصر اليومية (Matching Table in Screenshot 2) */}
        {activeTab === 'items' && (
          <div className="space-y-4 pt-1">
            <div className="border border-border/60 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-start border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-semibold">
                    <th className="px-3 py-2.5 text-start font-bold text-foreground">الحساب</th>
                    <th className="px-3 py-2.5 text-start font-bold text-foreground">الشريك</th>
                    <th className="px-3 py-2.5 text-start font-bold text-foreground">بطاقة عنوان</th>
                    <th className="px-3 py-2.5 text-end font-bold text-foreground">المدين</th>
                    <th className="px-3 py-2.5 text-end font-bold text-foreground">الدائن</th>
                    <th className="px-3 py-2.5 text-start font-bold text-foreground">شبكات الضرائب</th>
                    <th className="w-8 px-2 py-2.5 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-muted/20 group">
                      {/* الحساب */}
                      <td className="p-1.5 w-1/4">
                        <Input
                          value={item.accountId}
                          onChange={(e) => handleUpdateItem(index, 'accountId', e.target.value)}
                          placeholder="مثال: 121000 حساب مدين"
                          className="h-7 text-xs border-transparent hover:border-border/60 focus:border-border/80 bg-transparent"
                        />
                      </td>

                      {/* الشريك */}
                      <td className="p-1.5 w-1/6">
                        <Input
                          value={item.partnerName || ''}
                          onChange={(e) => handleUpdateItem(index, 'partnerName', e.target.value)}
                          placeholder="علي بن علي"
                          className="h-7 text-xs border-transparent hover:border-border/60 focus:border-border/80 bg-transparent"
                        />
                      </td>

                      {/* بطاقة عنوان */}
                      <td className="p-1.5 w-1/4">
                        <Input
                          value={item.name}
                          onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                          placeholder="البيان..."
                          className="h-7 text-xs border-transparent hover:border-border/60 focus:border-border/80 bg-transparent"
                        />
                      </td>

                      {/* المدين */}
                      <td className="p-1.5 w-28">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.debit}
                          onChange={(e) =>
                            handleUpdateItem(index, 'debit', parseFloat(e.target.value) || 0)
                          }
                          className="h-7 text-xs text-end border-transparent hover:border-border/60 focus:border-border/80 bg-transparent font-medium"
                        />
                      </td>

                      {/* الدائن */}
                      <td className="p-1.5 w-28">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.credit}
                          onChange={(e) =>
                            handleUpdateItem(index, 'credit', parseFloat(e.target.value) || 0)
                          }
                          className="h-7 text-xs text-end border-transparent hover:border-border/60 focus:border-border/80 bg-transparent font-medium"
                        />
                      </td>

                      {/* شبكات الضرائب */}
                      <td className="p-1.5">
                        <Input
                          value={item.taxGrids || ''}
                          onChange={(e) => handleUpdateItem(index, 'taxGrids', e.target.value)}
                          placeholder=""
                          className="h-7 text-xs border-transparent hover:border-border/60 focus:border-border/80 bg-transparent"
                        />
                      </td>

                      {/* Delete Action */}
                      <td className="p-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Add line button */}
              <div className="p-2 bg-muted/10 border-t border-border/40">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddItem}
                  className="h-7 text-xs text-[#714B67] dark:text-purple-300 font-semibold hover:bg-muted/40"
                >
                  <Plus className="h-3.5 w-3.5 me-1" /> إضافة سطر
                </Button>
              </div>
            </div>

            {/* Totals Balance Bar */}
            <div className="flex justify-end pt-2">
              <div className="flex items-center gap-12 text-sm font-bold text-foreground px-6 py-2 bg-muted/20 rounded-lg border border-border/40">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground text-xs font-normal">إجمالي المدين:</span>
                  <span>
                    {totalDebit.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    <span className="text-xs font-normal text-muted-foreground">ريال</span>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground text-xs font-normal">إجمالي الدائن:</span>
                  <span>
                    {totalCredit.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    <span className="text-xs font-normal text-muted-foreground">ريال</span>
                  </span>
                </div>

                {Math.abs(totalDebit - totalCredit) > 0.001 && (
                  <div className="text-destructive text-xs font-semibold">
                    (غير متوازن: الفرق {Math.abs(totalDebit - totalCredit).toFixed(2)} ريال)
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: معلومات أخرى (Matching Screenshot 3) */}
        {activeTab === 'other' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 text-sm">
            {/* Right column in RTL */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 items-center gap-2">
                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                  <span>الترحيل التلقائي</span>
                  <span className="text-[10px] text-muted-foreground font-mono cursor-help" title="ترحيل القيد تلقائياً">
                    ?
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs font-medium text-foreground">
                    {autoPost ? 'نعم' : 'لا'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-2">
                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                  <span>الوضع المالي</span>
                  <span className="text-[10px] text-muted-foreground font-mono cursor-help" title="الوضع المالي المعين">
                    ?
                  </span>
                </div>
                <div className="col-span-2">
                  <Input
                    value={fiscalPosition}
                    onChange={(e) => setFiscalPosition(e.target.value)}
                    placeholder="الوضع المالي الافتراضي"
                    className="h-8 text-xs rounded border-border/60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-muted-foreground text-xs">تشفير عدم قابلية التعديل</label>
                <div className="col-span-2">
                  <Input
                    value={nonModifiableEncryption}
                    onChange={(e) => setNonModifiableEncryption(e.target.value)}
                    placeholder="رمز التشفير غير القابل للتعديل"
                    className="h-8 text-xs rounded border-border/60"
                  />
                </div>
              </div>
            </div>

            {/* Left column in RTL (Notes) */}
            <div className="space-y-2">
              <label className="text-muted-foreground text-xs">إضافة ملاحظة داخلية...</label>
              <Textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="إضافة ملاحظة داخلية..."
                rows={4}
                className="text-xs rounded border-border/60"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

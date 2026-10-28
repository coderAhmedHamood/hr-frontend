---
name: list-screens
description: Use for ANY hr-frontend screen that lists records — a table, directory, register or report list, in any app (HR, store admin, inventory, POS, contacts, accounting). Builds the system's one list experience - persisted filters, server-side sorting, grouping with subtotals and grand total, a columns picker, saved views, and PDF/Excel exports that follow the screen. Use when creating a list page, adding filters/sort/grouping to a list, or reviewing one. Triggers - قائمة، جدول، سجل، فلاتر، فلترة، ترتيب، تجميع، الأعمدة، العروض المحفوظة، الإجمالي، list page, DataTable, filters, sort, group by, columns picker.
---

# شاشات القوائم: الفلاتر والترتيب والتجميع

كل شاشة تعرض قائمة سجلات في النظام تُبنى بالطريقة نفسها، في كل تطبيق. المستخدم يتعلّمها مرة واحدة.
المرجع الكامل المطبَّق: شاشة الموظفين.
- `src/features/hr/organization/employees/hooks/useEmployeesListModel.tsx`
- `src/features/hr/organization/employees/components/employees-list-views.tsx`

اقرأهما قبل أن تبدأ.

## 1. ما تقدّمه كل شاشة قائمة

| الميزة | متى | الأداة |
|---|---|---|
| فلاتر محفوظة لكل مستخدم وشركة | دائماً | `usePersistedFilterState` + `hrFiltersKey` + `useEntityFilterSlot`/`ListFilterBar` + `FilterToggleButton` |
| ترتيب من الخادم | دائماً | `useListSort` + `ListSortMenu` + `sortKey` على أعمدة `DataTable` |
| تجميع مع عدد ومجاميع لكل مجموعة وإجمالي عام | حين توجد حقول يُجمَّع بها (فرع، حالة، تصنيف، شهر…) | `useListGroup` + `ListGroupMenu` + `useGroupedList` + `GroupedDataTable` |
| إخفاء وإظهار الأعمدة | حين توجد أعمدة اختيارية | `useColumnVisibility` + `ListColumnsPicker` |
| العروض المحفوظة | دائماً مع الترتيب والتجميع | `listStateKeys` + `ListSavedViews` |
| صف الإجمالي (كل الصفحات) | حين توجد أعمدة رقمية أو مبالغ | `ColumnDef.total` + `totals` من `/groups` |
| تصدير PDF وExcel يتبع الشاشة | دائماً | مهارة `branded-printing` |

لا يُطبَّق هذا على قوائم الاختيار داخل النماذج، ولا على القوائم الصغيرة الثابتة (أقل من نحو 20 عنصراً لا تتغير). إذا قررت عدم تطبيق ميزة على شاشة، اذكر السبب في ردّك.

## 2. الخادم أولاً

- **الترتيب والتجميع والإجماليات من الخادم دائماً**، لأن القائمة مقسّمة صفحات. ترتيب الصفحة الظاهرة أو جمعها في المتصفح خطأ: النتيجة تخص صفحة واحدة، والتصدير لا يطابقها.
- يحتاج الـ API إلى `sortBy`/`sortDir` و`groupBy`/`groupValue`، ونقطة `GET …/groups`، وحقول الفلاتر. إن لم تكن موجودة فابنها أولاً بمهارة `list-endpoints` في `hr-backend`.
- **مفاتيح الترتيب والتجميع في الواجهة = مفاتيح الخادم حرفياً.** المفتاح غير المعروف يرده الخادم بـ 400.

## 3. خطوات البناء (نموذج الشاشة `use<Name>ListModel`)

```ts
// 1) الخيارات: مفاتيح الخادم وعناوين عربية
export const X_SORT_OPTIONS: readonly ListSortOption[] = [
  { key: 'name', label: 'الاسم' }, { key: 'createdAt', label: 'تاريخ الإضافة' },
];
export const X_GROUP_OPTIONS: readonly ListGroupOption[] = [
  ...ORG_LIST_GROUP_OPTIONS,                       // الفرع / القسم / المسمى (قوائم الموظفين)
  { key: 'status', label: 'الحالة', formatKey: (k) => STATUS_AR[k] ?? k, emptyLabel: 'غير محدد' },
  ...dateListGroupOptions(),                       // اليوم / الأسبوع / الشهر
];
export const X_COLUMN_OPTIONS: readonly ListColumnOption[] = [{ key: 'branch', label: 'الفرع' }];

// 2) الحالة: كل مفتاح مقيّد بالشركة
const stateKeys = listStateKeys('<app>', '<page>', companyId);   // مثال: ('store', 'orders', companyId)
const [status, setStatus] = usePersistedFilterState(hrFiltersKey('<app>', '<page>', companyId, 'status'), 'all');
const sort = useListSort(stateKeys.sort, X_SORT_OPTIONS);
const group = useListGroup(stateKeys.group, X_GROUP_OPTIONS, X_MEASURES);
const columns = useColumnVisibility(hrFiltersKey('<app>', '<page>', companyId, 'hiddenColumns'), X_COLUMN_OPTIONS);

// 3) الاستعلام: الفلاتر + الترتيب
const buildListQuery = useCallback((page, limit) => ({
  page, limit, companyId, ...filters, ...listSortQuery(sort.sort),
}), [filters, sort.sort]);

// 4) غير مجمّعة: صفحات (useServerDirectoryPagination) تُعاد مع sort.sortKey في resetDeps
//    مجمّعة: useGroupedList — المجموعات من /groups، وصفوف كل مجموعة عند فتحها
const grouped = useGroupedList<Row>({
  enabled: !!companyId && !!group.groupBy,
  groupBy: group.groupBy,
  resetKey: JSON.stringify(buildListQuery(1, 1)),
  fetchGroups: () => api.groups({ ...filtersOnly, ...listGroupQuery(group.groupBy) }),
  fetchGroupRows: (groupValue, p, l) => api.list({ ...buildListQuery(p, l), ...listGroupQuery(group.groupBy), groupValue }),
});

// 5) أدوات رأس الصفحة (تعمل على الجوال أيضاً)
usePageHeaderActions(() => (
  <>
    <FilterToggleButton activeFilterCount={activeFilterCount} />
    <ListColumnsPicker model={columns} />
    <ListSortMenu model={sort} />
    <ListGroupMenu model={group} />
    <ListSavedViews storageKey={stateKeys.views} prefixes={stateKeys.prefixes} />
    {/* زر الإضافة الأساسي ثم قائمة التصدير */}
  </>
), [/* deps */]);
```

**العرض:**
```tsx
{group.groupBy
  ? <GroupedDataTable columns={visibleColumns} group={group} list={grouped} sort={sort.sort} onSort={sort.toggle} … />
  : <DataTable columns={visibleColumns} data={rows} sort={sort.sort} onSort={sort.toggle} totals={grouped.summary?.total} … />}
```
- العمود القابل للترتيب يحمل `sortKey` (مفتاح الخادم). والعمود الذي له مجموع يحمل `total: (t) => format(t.sums.amount)`.
- الأعمدة المخفية تُحذف من الجدول ومن التصدير معاً، عبر `visibleExportColumns`.

## 4. قواعد لا تُخالف

- **التخزين لكل شركة:** كل مفتاح يمرّ عبر `hrFiltersKey`/`listStateKeys` مع `companyId`. لا تكتب في `localStorage` مباشرة. البادئة `hr-` اسم تاريخي، وتُستعمل لكل التطبيقات، لأن العروض المحفوظة تنسخ هذه البادئات.
- **عدد التبويبات والحالات** (الكل، نشط، موقوف…) من الخادم بكل الصفحات، لا من الصفحة الظاهرة.
- **العملات:** لا يُجمع مبلغان بعملتين في رقم واحد. إن أمكن أن تحوي القائمة أكثر من عملة، فالخادم يرسل `aggregates.currencies`، وحين تكون أكثر من 1 لا يُعرض المجموع. لا تستعمل `'SAR'` ولا أي عملة ثابتة، بل `companyCurrencyCode()`.
- **التطبيقات المفعّلة (AGENTS.md القسم 1):** الفلتر أو العمود أو خيار التجميع الذي يخص تطبيقاً آخر يُعلن `requiresApp` ويُرشَّح بـ `useCompanyApps()`، ولا تُطلب بياناته إن لم يكن مفعّلاً.
- **مجموعة «بلا قيمة»:** `__none__` (`LIST_GROUP_NONE`)، باسم واضح في `emptyLabel` («بدون فرع»)، وتأتي آخر المجموعات دائماً.
- **التاريخ:** التجميع باليوم والأسبوع (الأحد إلى السبت) والشهر عبر `dateListGroupOptions()`، مطابقاً لـ `dateGroupFields` في الخادم.
- **ملخص الفلاتر:** نص يجمع كل فلتر نشط مع `sort.label` و`group.label`، ويُطبع تحت عنوان التقرير.
- **التحميل والفراغ والخطأ:** هيكل تحميل، و«لا توجد نتائج — جرّب تعديل الفلاتر»، والخطأ يظهر خطأً قابلاً لإعادة المحاولة، ولا يتحول إلى قائمة فارغة.
- **الجوال:** القوائم المنسدلة في الرأس تعمل باللمس، والجدول يتحول إلى بطاقات (`mobileCard`) أو يُعرض بتمرير أفقي، مع تثبيت عمود الهوية (`sticky: 'start'`).

## 5. قبل أن تقول «انتهيت»

- [ ] الترتيب بالضغط على رأس العمود ومن قائمة «ترتيب»، ويبقى بعد إعادة التحميل.
- [ ] التجميع: العدد والمجاميع لكل مجموعة تطابق الإجمالي العام، والصفوف داخل المجموعة تتبع الترتيب.
- [ ] تغيير أي فلتر يعيد القائمة إلى الصفحة الأولى، ويعيد تحميل المجموعات.
- [ ] عرض محفوظ يعيد الفلاتر والترتيب والتجميع والأعمدة بضغطة.
- [ ] PDF وExcel: كل الصفوف المفلترة، بترتيب الشاشة وتجميعها، دون الأعمدة المخفية.
- [ ] شركة ثانية لا ترى فلاتر الأولى ولا عروضها.
- [ ] تجربة على عرض الجوال.
- [ ] `npx tsc --noEmit` و`npx eslint` و`npx jest` على المجلدات المعدّلة.

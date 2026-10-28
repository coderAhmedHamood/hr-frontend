---
name: branded-printing
description: Use for ANY printed or downloaded document in hr-frontend — PDF registers of a list, official letters, contracts, receipts, invoices, labels, Excel exports — in any app. Every document carries the printing company's own identity (name, commercial registration, logo, stamp, color, watermark) and follows the screen (filters, sort, grouping, hidden columns). Use when adding an export/print button, building a print component, or reviewing one. Triggers - طباعة، PDF، تصدير، Excel، سجل، كشف، خطاب، عقد، إيصال، فاتورة، ترويسة، هوية الشركة، الشعار، الختم، print, export, letterhead, register.
---

# الطباعة والتصدير بهوية الشركة

كل ملف يخرج من النظام يحمل هوية **الشركة التي تطبعه**: اسمها، وسجلها التجاري، وشعارها، وختمها، ولونها، وعلامتها المائية.
لا يحمل اسماً ثابتاً، ولا شعاراً ثابتاً، ولا هوية شركة أخرى.

## 1. أي أداة لأي مستند

| المستند | الأداة |
|---|---|
| **سجل قائمة** (موظفون، طلبات، حركات، منتجات…) | `RegisterExportMenu` (PDF وExcel)، أو قائمة تصدير خاصة كما في شاشة الموظفين، مع `RegisterDocument`/`*RegisterPrintHtml` و`registerExportRows` |
| **مستند رسمي** (خطاب، عقد، شهادة، تعميم) | مكوّن طباعة بأسلوب `forwardRef`، مع `PdfPreviewExportDialog` ثم `exportDomToPdf` |
| **إيصال أو ملصق بمقاس خاص** | `exportDomToPdf(el, name, { format: [80, 200], margin: [...] })` |
| **Excel** | `downloadXlsxFromAoA` بالصفوف نفسها التي طُبعت في الـ PDF |
| **PDF من الخادم** | مهارة `company-documents` في `hr-backend` |

الأمثلة المطبّقة:
- سجل الموظفين: `useEmployeesListModel.tsx` و`components/pdf/print/employees-register-print-html.tsx`.
- عقد العمل: `components/pdf/print/employment-contract-print-html.tsx`.

## 2. الهوية من مصدر واحد

```ts
const letterhead = usePdfCompanyLetterhead();
// companyNameAr / companyNameEn / commercialReg / logoSrc / stampSrc / accentColor
// representativeNameAr / representativeTitleAr / watermarkEnabled / watermarkOpacity / contractFontScale
```
- **الترويسة:** `RoseTradingLetterheadPrint`. **العلامة المائية:** `RosePdfWatermark`. **الختم:** `RoseCompanyStamp`. أسماؤها قديمة، لكنها تقرأ هوية الشركة الحالية من `usePdfCompanyLetterhead`.
- **ممنوع:**
  - اسم أو شعار أو سجل ثابت في الكود، مثل «روز» أو `ROSE_TRADING_EST`.
  - اسم النظام بدل اسم الشركة. خارج الطباعة استعمل `APP_TITLE` حين لا تُعرف الشركة.
  - عملة ثابتة مثل `'SAR'`. استعمل `companyCurrencyCode()`.
- **الحقل الفارغ لا يُطبع،** ولا يُملأ بقيمة شركة أخرى. مثال: شركة بلا سجل تجاري لا يظهر في ترويستها سطر «س.ت».
- **لون الخطوط والحدود:** `accentColor` (لون الشركة)، وعند غيابه `DEFAULT_LETTERHEAD_ACCENT`.

## 3. السجل يتبع الشاشة

- **كل الصفوف المفلترة، لا الصفحة الظاهرة:** `fetchAllPaginatedItems` بنفس `buildListQuery` (الفلاتر والترتيب)، ومعه `listGroupQuery(groupBy)` حين تكون القائمة مجمّعة.
- **مجمّعة:** `registerExportRows({ columns, rows, total, grouping })` يُخرج عنوان كل مجموعة وصفوفها ومجموعها الفرعي، ثم الإجمالي العام. الصفوف نفسها تُستعمل للـ PDF وExcel.
- **الأعمدة:** `visibleExportColumns(EXPORT_COLUMNS, columnVisibility.isVisible)`. ما أُخفي في الشاشة لا يُطبع.
- **نوع كل عمود** (`RegisterColumn.kind`) يحدد عرضه والتفاف نصه:
  - `name`: الأعرض، ويلتف على سطرين.
  - `text`: يلتف عادياً.
  - `status`: في الوسط.
  - `code` و`date` و`number`: لا تلتف أبداً.
- **تحت العنوان:** ملخص الفلاتر، و`sort.label`، و`group.label`. القارئ يعرف ما الذي طُبع وبأي ترتيب.
- **لا شيء للتصدير:** رسالة واضحة («لا توجد بيانات للتصدير ضمن الفلاتر الحالية.») بدل ملف فارغ.

## 4. قواعد مكوّن الطباعة

- **أنماط مضمّنة فقط** (`style={{…}}`): `exportDomToPdf` يحذف Tailwind وCSS العام من النسخة المطبوعة.
- **الخط:** `PDF_PRINT_FONT_FAMILY`. **المقاسات:** من `official-document-typography` (`PDF_PAGE_FONT`، `PDF_TITLE_FONT`…)، مضروبة في `contractFontScale` حيث يلزم.
- **ترويسة وتذييل على كل صفحة:** علّم الجزء بـ `PDF_RUNNING_HEADER_ATTR` أو `PDF_RUNNING_FOOTER_ATTR`.
- **المستند الطويل** (عقد، تقرير نصي): `pageBreaks: 'flow'` في `PdfPreviewExportDialog`. وما لا يجوز قطعه بين صفحتين يُعلَّم كما في `exportDomToPdf`.
- **الصور المرفوعة** (الشعار والختم) تمر عبر `proxyCrossOriginUploads` داخل `exportDomToPdf`. لا تحوّلها بنفسك، ولا ترسم صورة من نطاق آخر مباشرة، وإلا سقطت من الملف.
- **الاتجاه:** الجذر `dir="rtl"`. السجل العريض بـ `orientation="landscape"`.
- **المعاينة قبل التنزيل** في `PdfPreviewExportDialog`. لا تنزيل مباشر دون معاينة للمستندات الرسمية.

## 5. التطبيقات المفعّلة والصلاحيات

- زر التصدير يتبع صلاحية القراءة للقائمة نفسها، ولا يكشف بيانات لا يراها المستخدم على الشاشة.
- العمود أو القسم المطبوع الذي يخص تطبيقاً آخر يظهر فقط إذا كان مفعّلاً (AGENTS.md القسم 1).

## 6. قبل أن تقول «انتهيت»

- [ ] غيّر في إعدادات الشركة اسمها وشعارها ولونها، ثم اطبع: كل ذلك ظاهر.
- [ ] شركة بلا شعار ولا سجل: لا يظهر شعار ولا اسم شركة أخرى.
- [ ] الـ PDF والـ Excel يطابقان الشاشة: الفلاتر والترتيب والتجميع والأعمدة والإجماليات.
- [ ] مستند متعدد الصفحات: الترويسة والتذييل على كل صفحة، ولا نص مقطوع بين صفحتين.
- [ ] النص العربي سليم، والأرقام والتواريخ بالاتجاه الصحيح.
- [ ] تجربة التنزيل على الجوال.

# إرشادات الشركة (Company Guidelines) — دليل الواجهة

ميزة جديدة تتيح للإدارة إضافة إرشادات/إعلانات/ضوابط بسيطة (عنوان + نص + نقاط) خاصة بالشركة، مع التحكم بظهورها في **تطبيق الجوال للموظفين** عبر حقل `isPublished`، وأرشفتها دون حذفها نهائياً.

## الموديول

- الكود: `src/modules/hr-guidelines/company-guidelines/`
- الجدول: `hr_guidelines_company_guidelines`
- Controller: `Controller('guidelines')` — كل المسارات تحت `/guidelines`
- محمي بـ `JwtAuthGuard` + `PermissionsGuard` (نفس نمط بقية الـHR).

## الصلاحيات (Permission codes)

| Code | الاستخدام |
|---|---|
| `hr.guidelines.read` | عرض القائمة/التفاصيل، وأيضاً **مسار تطبيق الجوال** (لا يوجد كود منفصل للجوال حالياً) |
| `hr.guidelines.create` | إضافة إرشاد جديد |
| `hr.guidelines.update` | تعديل / استعادة من الأرشيف |
| `hr.guidelines.delete` | أرشفة (الحذف منطقي وليس فعلياً) |

⚠️ **مهم لفريق الفرونت/الأدمن:** لتفعيل تبويب الإرشادات داخل **تطبيق الجوال**، يجب منح صلاحية `hr.guidelines.read` لدور الموظف الافتراضي (Employee role) من شاشة الأدوار والصلاحيات — تماماً كما تُمنح بقية صلاحيات القراءة التي يحتاجها التطبيق. الصلاحيات تُزرع في قاعدة البيانات تلقائياً بعد تشغيل `npm run system:init` على الباك-إند (مطلوب مرة واحدة بعد نشر هذا التحديث).

## نموذج البيانات (Response)

```ts
type CompanyGuideline = {
  id: string;              // uuid
  companyId: string;       // uuid
  titleAr: string;         // العنوان
  bodyAr: string | null;   // النص الحر (اختياري)
  points: string[];        // نقاط تفصيلية (قائمة نقطية)
  isPublished: boolean;    // يظهر في تطبيق الجوال أم لا
  sortOrder: number;       // ترتيب العرض (تصاعدي)
  isArchived: boolean;     // هل مؤرشف
  archivedAt: string | null; // وقت الأرشفة (ISO)
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};
```

## نقاط النهاية (Endpoints)

### لوحة تحكم HR (إدارة كاملة)

| Method | Path | الوصف | الصلاحية |
|---|---|---|---|
| POST | `/guidelines` | إنشاء إرشاد جديد | `hr.guidelines.create` |
| GET | `/guidelines` | قائمة مُصفّحة (pagination) | `hr.guidelines.read` |
| GET | `/guidelines/:id` | تفاصيل إرشاد واحد | `hr.guidelines.read` |
| PATCH | `/guidelines/:id` | تعديل إرشاد | `hr.guidelines.update` |
| PATCH | `/guidelines/:id/restore` | استعادة إرشاد مؤرشف | `hr.guidelines.update` |
| DELETE | `/guidelines/:id` | أرشفة (Soft-delete) | `hr.guidelines.delete` |

**GET /guidelines — فلاتر الاستعلام (Query params):**

```ts
{
  companyId?: string;       // uuid — تصفية حسب الشركة
  isPublished?: boolean;    // تصفية حسب حالة النشر
  archiveScope?: 'active' | 'archived' | 'all'; // افتراضي: active
  page?: number;            // افتراضي 1
  limit?: number;           // افتراضي 200
}
```

**استجابة القائمة:**

```ts
{
  items: CompanyGuideline[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
```

**POST /guidelines — جسم الطلب:**

```ts
{
  companyId: string;       // required, uuid
  titleAr: string;         // required, 1-255 حرف
  bodyAr?: string | null;
  points?: string[];       // نقاط، تُنظَّف تلقائياً من الفراغات والقيم الفارغة
  isPublished?: boolean;   // افتراضي false — أنشئه كمسودة غير منشورة ثم انشره لاحقاً
  sortOrder?: number;      // افتراضي 0
}
```

**PATCH /guidelines/:id — جسم الطلب (كل الحقول اختيارية):**

```ts
{
  titleAr?: string;
  bodyAr?: string | null;
  points?: string[];
  isPublished?: boolean;
  sortOrder?: number;
}
```

### تطبيق الجوال (قراءة فقط)

| Method | Path | الوصف | الصلاحية |
|---|---|---|---|
| GET | `/guidelines/mobile/:companyId` | إرشادات الشركة **المنشورة وغير المؤرشفة فقط**، مرتّبة حسب `sortOrder` | `hr.guidelines.read` |

**الاستجابة:** مصفوفة مباشرة (بدون pagination):

```ts
CompanyGuideline[]
```

استدعِ هذا المسار عند فتح شاشة/تبويب "الإرشادات" في تطبيق الجوال، مع `companyId` الخاص بالشركة الحالية للموظف المسجّل دخوله.

## سلوك مقترح للواجهة (لوحة الإدارة)

1. شاشة قائمة (جدول) مع أعمدة: العنوان، عدد النقاط، منشور؟ (Switch يستدعي `PATCH` بتغيير `isPublished`)، ترتيب، أرشفة.
2. نموذج إضافة/تعديل: حقل عنوان، محرر نص بسيط للـ`bodyAr`، وقائمة ديناميكية (Add/Remove) للـ`points`.
3. فلتر `archiveScope` لعرض المؤرشف واستعادته عبر `PATCH :id/restore`.
4. الحذف الفعلي غير متاح عمداً — فقط أرشفة/استعادة (يطابق نمط بقية شاشات HR في هذا المشروع).

## ملاحظات تقنية

- `points` تُخزَّن كـ`jsonb` بسيطة (مصفوفة نصوص) — لا هوية مستقلة لكل نقطة، فلا يوجد `id` لكل نقطة على حدة.
- الأرشفة منطقية (`archivedAt` timestamp) وليست حذفاً فعلياً — نفس نمط بقية جداول HR في هذا المشروع (`AllowanceType`، إلخ).
- بعد سحب هذا التحديث في الباك-إند، شغّل الهجرة والتهيئة مرة واحدة:
  ```
  npm run migration:run
  npm run system:init
  ```

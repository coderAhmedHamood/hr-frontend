# مرفقات طلب المتجر — دليل الفرونت

رفع أكثر من مرفق على طلب المتجر: من العميل عند إنشاء الطلب، ومن لوحة الإدارة لاحقاً.

**Migrations:** `1783373644653-store-order-attachments.ts` · `1783373644654-store-order-attachment-visibility.ts`
**JSON:** camelCase · الأموال والأحجام الكبيرة تُرجع كنص (string)

---

## 0) الفكرة

كل طلب يملك قائمة مرفقات (`attachments`) — ملفات عامة (صور، PDF، أي نوع). نُخزّن **رابط الملف** فقط + بيانات وصفية؛ رفع الملف نفسه إلى التخزين (S3 أو غيره) يتم في طبقة منفصلة، ثم يُرسل الرابط هنا.

| من | متى | endpoint |
|----|-----|----------|
| العميل | عند إنشاء الطلب | `POST /public/store/orders` (حقل `attachments`) |
| الموظف | إضافة لاحقاً | `POST /store-admin/orders/:id/attachments` |
| الموظف | إظهار/إخفاء أو تعديل الوصف | `PATCH /store-admin/orders/:id/attachments/:attachmentId` |
| الموظف | حذف | `DELETE /store-admin/orders/:id/attachments/:attachmentId` |

- الحد الأقصى للمرفقات المرفوعة مع الطلب: **20**.
- حذف الطلب يحذف مرفقاته تلقائياً.
- `paymentProofUrl` القديم (إثبات دفع مفرد) ما زال موجوداً للتوافق ولا يتعارض مع المرفقات المتعددة.

### ظهور المرفق للعميل — `visibleToCustomer`

| القيمة | المعنى |
|--------|--------|
| `true` (افتراضي) | يظهر للعميل في تتبع الطلب وبوابة الشريك |
| `false` | داخلي (للموظفين فقط) — **لا** يظهر في أي استجابة موجهة للعميل |

- المرفقات التي يرفعها **العميل** عند الطلب تكون دائماً `visibleToCustomer = true`.
- المرفقات التي يضيفها **الموظف** افتراضياً `true`، ويمكن ضبطها إلى `false` عند الإنشاء أو لاحقاً عبر `PATCH`.
- **الفلترة تلقائية**: مسارات العميل (تتبع الطلب / طلبات الشريك) تُرجع فقط المرفقات المرئية. لوحة الإدارة تُرجع الكل مع إمكانية الفلترة (انظر القسم 3).

---

## 1) شكل المرفق في الاستجابة

يظهر ضمن `attachments[]` في أي استجابة طلب (تفاصيل الإدارة، تتبع العميل، طلبات الشريك):

```ts
interface StoreOrderAttachment {
  id: string;                 // uuid
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  sizeBytes: string | null;   // bigint كنص، مثل "84213"
  label: string | null;
  visibleToCustomer: boolean; // في استجابات العميل يكون دائماً true
  uploadedBy: string | null;  // "storefront" لرفع العميل، أو معرّف الموظف
  createdAt: string;          // ISO
}
```

> في مسارات العميل لا تظهر إلا المرفقات المرئية، لذا `visibleToCustomer` يكون دائماً `true` هناك. القيمة `false` تظهر فقط للموظفين في لوحة الإدارة.

مثال لجزء من استجابة الطلب:

```jsonc
{
  "id": "…",
  "orderNumber": "ST-20260808-000012",
  "status": "pending",
  "paymentProofUrl": null,
  "lines": [ /* … */ ],
  "statusHistory": [ /* … */ ],
  "attachments": [
    {
      "id": "a1c…",
      "fileName": "receipt.jpg",
      "fileUrl": "https://cdn.example.com/uploads/receipt.jpg",
      "mimeType": "image/jpeg",
      "sizeBytes": "84213",
      "label": "إيصال التحويل",
      "visibleToCustomer": true,
      "uploadedBy": "storefront",
      "createdAt": "2026-08-08T20:03:00.000Z"
    }
  ]
}
```

---

## 2) العميل — رفع مرفقات مع الطلب

`POST /public/store/orders` (عام، بدون JWT)

أضف حقل `attachments` الاختياري إلى جسم الطلب الحالي:

```ts
interface PlaceStoreOrderAttachment {
  fileName: string;           // مطلوب، ≤ 255
  fileUrl: string;            // مطلوب — الرابط بعد رفع الملف للتخزين
  mimeType?: string | null;   // ≤ 120
  sizeBytes?: number | null;  // رقم بالبايت (يُرسل رقماً، يُرجع نصاً)
  label?: string | null;      // ≤ 120
}
```

مثال كامل:

```jsonc
POST /public/store/orders
{
  "companyId": "…",
  "paymentMethod": "card",
  "locale": "ar",
  "address": {
    "fullName": "أحمد",
    "phone": "0555000000",
    "cityId": "…",
    "districtId": "…",
    "street": "شارع 1"
  },
  "items": [
    { "productId": "…", "quantity": 2 }
  ],
  "attachments": [
    {
      "fileName": "receipt.jpg",
      "fileUrl": "https://cdn.example.com/uploads/receipt.jpg",
      "mimeType": "image/jpeg",
      "sizeBytes": 84213,
      "label": "إيصال التحويل"
    },
    {
      "fileName": "id.pdf",
      "fileUrl": "https://cdn.example.com/uploads/id.pdf",
      "mimeType": "application/pdf",
      "label": "صورة الهوية"
    }
  ]
}
```

جميع المرفقات المرفوعة عبر هذا المسار تُوسَم `uploadedBy = "storefront"`.

### تدفق مقترح في الفرونت

1. المستخدم يختار الملفات في شاشة الدفع.
2. ارفع كل ملف للتخزين (endpoint الرفع لديكم) واحصل على `fileUrl`.
3. اجمع `fileName` / `mimeType` / `sizeBytes` من كائن `File` مباشرة.
4. أرسل المصفوفة ضمن جسم إنشاء الطلب.

---

## 3) الإدارة — إضافة / تعديل / حذف / فلترة

يحتاج JWT + صلاحية `sta.orders.update` (والقراءة `sta.orders.read` للتفاصيل).

### إضافة

`POST /store-admin/orders/:id/attachments` → `201` ويُرجع **الطلب كاملاً** (بمرفقاته المحدثة).

```ts
interface CreateStoreOrderAttachment {
  fileName: string;             // مطلوب، ≤ 255
  fileUrl: string;              // مطلوب
  mimeType?: string | null;     // ≤ 120
  sizeBytes?: number | null;
  label?: string | null;        // ≤ 120
  visibleToCustomer?: boolean;  // افتراضي true — اجعلها false لمرفق داخلي
}
```

```jsonc
POST /store-admin/orders/9f2.../attachments
Authorization: Bearer <token>
{
  "fileName": "internal-note.pdf",
  "fileUrl": "https://cdn.example.com/uploads/internal-note.pdf",
  "mimeType": "application/pdf",
  "label": "ملاحظة داخلية",
  "visibleToCustomer": false
}
```

المرفق المُضاف من الإدارة يُوسَم `uploadedBy = <معرّف المستخدم>`.

### تعديل (إظهار/إخفاء عن العميل أو تغيير الوصف)

`PATCH /store-admin/orders/:id/attachments/:attachmentId` → `200` ويُرجع الطلب كاملاً.

```ts
interface UpdateStoreOrderAttachment {
  label?: string | null;
  visibleToCustomer?: boolean;
}
```

```jsonc
// إخفاء مرفق عن العميل
PATCH /store-admin/orders/9f2.../attachments/a1c...
{ "visibleToCustomer": false }
```

### حذف

`DELETE /store-admin/orders/:id/attachments/:attachmentId` → `200` ويُرجع الطلب كاملاً بعد الحذف (حذف نهائي، لا أرشفة).

```jsonc
DELETE /store-admin/orders/9f2.../attachments/a1c...
Authorization: Bearer <token>
```

### الفلترة في تفاصيل الطلب

`GET /store-admin/orders/:id?attachments=<all|visible|hidden>`

| القيمة | النتيجة |
|--------|---------|
| `all` (افتراضي) | كل المرفقات |
| `visible` | المرئية للعميل فقط (`visibleToCustomer = true`) |
| `hidden` | الداخلية فقط (`visibleToCustomer = false`) |

```jsonc
GET /store-admin/orders/9f2...?attachments=hidden
```

> بقية الحقول (`lines`, `statusHistory`, …) لا تتأثر بهذا الفلتر. كما يمكن للفرونت الفلترة محلياً اعتماداً على `visibleToCustomer` في كل مرفق.

---

## 4) أخطاء متوقعة

| الحالة | الرمز |
|--------|-------|
| `fileName` أو `fileUrl` فارغ | `400` |
| عدد المرفقات مع الطلب > 20 | `400` |
| الطلب غير موجود | `404` |
| المرفق غير موجود على الطلب | `404` |
| نقص التوكن/الصلاحية (مسارات الإدارة) | `401` / `403` |

---

## 5) ملخص الحقول

| الحقل | إرسال | استرجاع | ملاحظة |
|-------|-------|---------|--------|
| `fileName` | مطلوب | string | ≤ 255 |
| `fileUrl` | مطلوب | string | رابط الملف المرفوع مسبقاً |
| `mimeType` | اختياري | string \| null | ≤ 120 |
| `sizeBytes` | رقم اختياري | string \| null | bigint — يُرجع نصاً |
| `label` | اختياري | string \| null | ≤ 120 |
| `visibleToCustomer` | اختياري (إدارة فقط) | boolean | افتراضي `true`؛ `false` = داخلي مخفي عن العميل |
| `uploadedBy` | — | string \| null | `"storefront"` أو معرّف الموظف |
| `id`, `createdAt` | — | يُنشأ آلياً | |

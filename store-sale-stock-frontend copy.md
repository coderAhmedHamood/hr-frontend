# خصم وإرجاع مخزون البيع — دليل الفرونت

عقد التزام بين الـ Backend ولوحة المخزون / المتجر.

**Base:** `{HOST}` (مثل `http://localhost:3000` أو عبر البروكسي)  
**Auth موظف:** `Authorization: Bearer <staffToken>`  
**صلاحية الخصم/الإرجاع:** `inv.warehouse.ledger.create`  
**JSON:** camelCase · Envelope: `{ status, message, data, error }`

---

## 0) القاعدة الأساسية

| حقل المنتج | المعنى |
|------------|--------|
| `trackInventory: true` | يُخصم / يُرجَع مخزون المستودع عند البيع أو الإلغاء |
| `trackInventory: false` | **لا خصم ولا إرجاع** — السطر يُتخطى (`skipped_no_track`) |
| `allowBackorder` | عند الخصم فقط: إن `false` يُرفض الطلب إن الكمية غير كافية |

### منتج بلا متغيرات vs مع متغيرات

| الحالة | ماذا ترسل | أين تُخصم/تُرجَع الكمية |
|--------|-----------|-------------------------|
| بلا متغيرات | `productId` فقط (بدون `variantId`) | مستوى المنتج (`variant_id = null` في الدفتر) |
| مع متغيرات | `productId` + **`variantId` إلزامي** | ذلك المتغير فقط |

---

## 1) خصم عند البيع — `POST /inventory/stock/sale-deduct`

يُنشئ حركة مستودع `kind=issue` + قيود دفتر **سالبة**، وتظهر في **سجل حركات المنتج**.

### Body

```ts
{
  companyId: string;       // uuid *
  locationId?: string;     // uuid اختياري — إن حُذف يُخصم من مستودع/موقع المنتج. انظر inventory-pos-stock-frontend.md
  sourceDocument?: string; // مثل رقم الطلب ST-20260805-0001
  partnerName?: string;
  notes?: string;
  createdBy?: string;
  lines: Array<{
    productId: string;     // uuid *
    variantId?: string | null;
    quantity: number;      // > 0 *
  }>;
}
```

### Response `data`

```ts
{
  movement: "sale_deduct";
  operationId: string | null;       // null إن كل الأسطر skipped
  operationReference: string | null; // مثل SALE-42
  locationId: string;
  warehouseId: string;
  lines: Array<{
    productId: string;
    variantId: string | null;
    quantity: string;               // "2.0000"
    status: "deducted" | "skipped_no_track";
    ledgerEntryId: string | null;
    onHandAfter: string | null;
  }>;
}
```

### أخطاء شائعة

| الحالة | النتيجة |
|--------|---------|
| كمية غير كافية و`allowBackorder=false` | `400` |
| منتج بمتغيرات بدون `variantId` | `400` |
| `locationId` غير تابع للشركة | `404` |
| لم يُرسل `locationId` ولا يوجد مستودع/موقع للمنتج ولا WH/Stock للشركة | `400` |

> **تحديث:** `locationId` لم يعد إلزامياً. دليل POS الكامل (مستودع المنتج، اختيار Location، قائمة مخزون سريعة): [`inventory-pos-stock-frontend.md`](./inventory-pos-stock-frontend.md)

### متى يُخصم؟

**لا يوجد خصم تلقائي عند `POST /public/store/orders`.**  
الخصم يتم فقط عند استدعاء هذه الدالة يدوياً (مثلاً بعد التجهيز أو عند تأكيد الصرف).

أرسل `sourceDocument = orderNumber` لربط الخصم بالطلب وتمكين الإرجاع الآمن لاحقاً.

---

## 2) إرجاع عند التراجع / الإلغاء — `POST /inventory/stock/sale-restore`

عكس الخصم: حركة `kind=receipt` + قيود دفتر **موجبة**.  
استخدمها عندما ينسحب العميل بعد التجهيز، أو عند إلغاء/استرداد الطلب.

### Body

**نفس شكل** `sale-deduct` تماماً.

```ts
{
  companyId: string;
  locationId: string;      // يُفضَّل نفس موقع الخصم الأصلي
  sourceDocument?: string; // *مستحسن جداً* = رقم الطلب الذي خُصم عليه
  partnerName?: string;
  notes?: string;
  createdBy?: string;
  lines: Array<{
    productId: string;
    variantId?: string | null;
    quantity: number;
  }>;
}
```

### لماذا `sourceDocument` مهم؟

عند إرسال `sourceDocument` (مثل `ST-...`):

- يحسب النظام **ما يمكن إرجاعه** = ما خُصم سابقاً لهذا المصدر − ما أُرجع مسبقاً
- يمنع الإرجاع المزدوج لنفس الطلب
- إن طلبت أكثر من المتبقي → `400`

بدون `sourceDocument` يُسمح بالإرجاع يدوياً دون هذا القيد (استخدام إداري حذر).

### Response `data`

```ts
{
  movement: "sale_restore";
  operationId: string | null;
  operationReference: string | null; // مثل SALE-RET-43
  locationId: string;
  warehouseId: string;
  lines: Array<{
    productId: string;
    variantId: string | null;
    quantity: string;
    status: "restored" | "skipped_no_track";
    ledgerEntryId: string | null;
    onHandAfter: string | null;
  }>;
}
```

### تلقائي من لوحة الطلبات

عند `PATCH /store-admin/orders/:id/status` إلى:

- `cancelled` أو `refunded`

يُرجع النظام تلقائياً كميات بنود الطلب إلى **نفس مواقع الخصم الأصلية** مع `sourceDocument = orderNumber`  
(مرة واحدة فقط؛ إن كان الطلب ملغى/مسترد مسبقاً لا يُعاد الإرجاع).

---

## 3) تسلسل سليم للفرونت (بيع ثم إلغاء بعد التجهيز)

```
1) إنشاء الطلب → POST /public/store/orders  (بدون خصم مخزون)
2) عند التجهيز/الصرف → POST /inventory/stock/sale-deduct
   مع sourceDocument = orderNumber ونفس بنود الطلب
3) إن انسحب العميل بعد التجهيز:
   الأدمن → cancelled أو refunded  (إرجاع تلقائي)
   أو يدوياً → POST /inventory/stock/sale-restore بنفس sourceDocument
4) تحقق الرصيد:
   GET /inventory/products/:id/stock
   أو GET /inventory/ledger-entries?productId=&sourceDocument=
```

### مثال يدوي — خصم

```http
POST /inventory/stock/sale-deduct
Authorization: Bearer <token>
Content-Type: application/json

{
  "companyId": "76e5bc4f-5adb-434d-a886-bcff05a9680b",
  "locationId": "<WH/Stock-uuid>",
  "sourceDocument": "ST-20260805-0001",
  "lines": [
    { "productId": "45d45868-3e09-416c-b192-cc58dbd67bed", "quantity": 2 }
  ]
}
```

### مثال يدوي — إرجاع (عكس)

```http
POST /inventory/stock/sale-restore
Authorization: Bearer <token>
Content-Type: application/json

{
  "companyId": "76e5bc4f-5adb-434d-a886-bcff05a9680b",
  "locationId": "<نفس-موقع-الخصم>",
  "sourceDocument": "ST-20260805-0001",
  "notes": "إلغاء بعد التجهيز",
  "lines": [
    { "productId": "45d45868-3e09-416c-b192-cc58dbd67bed", "quantity": 2 }
  ]
}
```

### مثال مع متغير

```json
{
  "productId": "e4a10b50-1033-4030-80e6-269dc910cc21",
  "variantId": "7b7aad66-ca60-4f8e-a202-0f66eaef1054",
  "quantity": 1
}
```

---

## 4) أين تظهر في واجهة المنتج؟

| العرض | المصدر |
|--------|--------|
| سجل الحركات | `GET /inventory/ledger-entries?productId=` |
| خصم بيع | `kind=issue` · مرجع `SALE-*` · `quantityDelta` سالب |
| إرجاع بيع | `kind=receipt` · مرجع `SALE-RET-*` · `quantityDelta` موجب |
| الرصيد الحي | `GET /inventory/products/:id/stock` أو `quantityCache` في GET المنتج |

---

## 5) ملخص التزام الفرونت

1. لا تخصم/ترجع يدوياً لمنتج `trackInventory=false` (الـ API يتخطاه بأمان).
2. مع المتغيرات: أرسل دائماً `variantId`.
3. عند الإرجاع: أرسل نفس `sourceDocument` ونفس `locationId` ونفس الكميات (أو جزء منها ≤ المتبقي).
4. بعد التجهيز: استدعِ `sale-deduct` يدوياً ثم عند الإلغاء استخدم `cancelled`/`refunded` (إرجاع تلقائي) أو `sale-restore`.
5. بعد أي حركة: حدّث عرض الكمية من `/stock` أو أعد جلب المنتج.

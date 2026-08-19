# مخزون نقطة البيع والمتجر — دليل الفرونت

عقد التزام بين الـ Backend ولوحة POS / المخزون / المتجر الإلكتروني.

**Base:** `{HOST}`  
**Auth موظف:** `Authorization: Bearer <staffToken>`  
**JSON:** camelCase · Envelope: `{ status, message, data, error }`

يشارك المحل والمتجر **نفس دفتر المخزون**. أي خصم من POS ينقص `quantityCache` و`GET …/stock` فوراً، فتظهر الكمية الصحيحة في المتجر.

---

## 0) القاعدة

| حقل المنتج | المعنى |
|------------|--------|
| `warehouseId` | المستودع الافتراضي للمنتج — منه يُخصم البيع إن لم يُرسل Location |
| `locationId` | موقع التخزين الافتراضي داخل المستودع (اختياري) |
| `trackInventory: true` | يُخصم / يُرجَع من الدفتر |
| `trackInventory: false` | يُتخطى (`skipped_no_track`) |
| `allowBackorder` | إن `false` يُرفض الخصم عند نقص الكمية في **موقع الخصم** |
| `posAvailable` | منتج قابل للبيع من نقطة البيع |

### ترتيب تحديد مكان الخصم (لكل سطر)

1. `lines[].locationId` — اختيار صريح أثناء العملية  
2. `locationId` على مستوى الطلب — نفس الموقع لكل الأسطر بلا `line.locationId`  
3. `warehouseId` على مستوى الطلب → موقع `WH/Stock` لذلك المستودع  
4. `product.locationId`  
5. موقع `WH/Stock` لـ `product.warehouseId`  
6. موقع `WH/Stock` الافتراضي للشركة

المحل والمتجر يقرآن نفس المجموع: `Σ inventory_ledger_entries.quantity_delta`.

---

## 1) ربط المنتج بالمستودع

يُرسل في إنشاء/تحديث المنتج (العادي و`/full`):

```ts
{
  warehouseId?: string | null;  // uuid — المستودع الافتراضي
  locationId?: string | null;   // uuid — موقع داخل ذلك المستودع
}
```

- `locationId` يجب أن يتبع `warehouseId` (أو يُستنتج المستودع من الموقع إن أُرسل الموقع وحده).
- تغيير `warehouseId` دون `locationId` يُفرّغ الموقع إن لم يعد تابعاً للمستودع الجديد.
- `null` يمسح الربط.

يظهر في كل استجابة منتج:

```ts
warehouseId: string | null;
locationId: string | null;
```

فلاتر القائمة: `GET /inventory/products?warehouseId=&locationId=`

---

## 2) خصم عند البيع — `POST /inventory/stock/sale-deduct`

**صلاحية:** `inv.warehouse.ledger.create`

يُنشئ حركة `kind=issue` + قيود دفتر سالبة. استدعِها عند إتمام بيع POS (فوراً) حتى تنقص كمية المتجر.

### Body

```ts
{
  companyId: string;            // uuid *
  locationId?: string | null;   // اختياري — موقع موحّد لكل الأسطر
  warehouseId?: string | null;  // اختياري — مستودع موحّد (WH/Stock) إن لم يُرسل locationId
  sourceDocument?: string;      // رقم تذكرة POS / طلب المتجر
  partnerName?: string;
  notes?: string;
  createdBy?: string;
  lines: Array<{
    productId: string;          // uuid *
    variantId?: string | null;  // إلزامي إن كان للمنتج متغيرات
    quantity: number;           // > 0 *
    locationId?: string | null; // اختيار موقع هذا السطر (يتقدّم على الموقع العام)
  }>;
}
```

### أمثلة

**POS بسيط — الخصم من مستودع المنتج (بدون اختيار موقع):**

```json
{
  "companyId": "…",
  "sourceDocument": "POS-20260815-0001",
  "lines": [
    { "productId": "…", "quantity": 2 }
  ]
}
```

**اختيار Location أثناء العملية:**

```json
{
  "companyId": "…",
  "locationId": "<uuid-WH/Stock-or-bin>",
  "sourceDocument": "POS-20260815-0001",
  "lines": [
    { "productId": "…", "quantity": 1 }
  ]
}
```

**موقع مختلف لكل سطر:**

```json
{
  "companyId": "…",
  "lines": [
    { "productId": "…", "quantity": 1, "locationId": "<bin-A>" },
    { "productId": "…", "quantity": 1, "locationId": "<bin-B>" }
  ]
}
```

### Response `data`

```ts
{
  movement: "sale_deduct";
  operationId: string | null;        // أول عملية (توافق خلفي)
  operationReference: string | null; // مثل SALE-42
  locationId: string | null;
  warehouseId: string | null;
  operations: Array<{                // عملية لكل مستودع إن تعددت المواقع
    operationId: string;
    operationReference: string;
    warehouseId: string;
  }>;
  lines: Array<{
    productId: string;
    variantId: string | null;
    quantity: string;
    status: "deducted" | "skipped_no_track";
    ledgerEntryId: string | null;
    onHandAfter: string | null;      // الرصيد في موقع هذا السطر بعد الخصم
    locationId: string | null;
    warehouseId: string | null;
    operationId: string | null;
  }>;
}
```

بعد النجاح: حدّث عرض الكمية من `quantityCache` أو `GET …/stock`. المتجر العام يقرأ نفس القيمة.

---

## 3) إرجاع — `POST /inventory/stock/sale-restore`

نفس شكل `sale-deduct`.

- مع `sourceDocument` **بدون** `locationId`: يُرجع الكمية إلى **نفس المواقع التي خُصم منها**.
- مع `locationId`: يُرجع إلى ذلك الموقع (مع عدم تجاوز ما خُصم لذلك المصدر).
- إلغاء طلب المتجر (`cancelled` / `refunded`) يستخدم المسار الأول تلقائياً.

---

## 4) قائمة مخزون سريعة — `GET /inventory/stock`

**صلاحية:** `inv.catalog.products.read`

مخصّصة لشاشات POS / جرد الكميات (آلاف المنتجات).

| Query | إلزامي | المعنى |
|-------|--------|--------|
| `companyId` | نعم | |
| `warehouseId` | لا | رصيد **في** هذا المستودع (من الدفتر) |
| `locationId` | لا | رصيد **في** هذا الموقع |
| `productId` / `variantId` | لا | |
| `sku` | لا | مطابقة تامة |
| `barcode` | لا | مسح POS (منتج أو متغير) |
| `search` | لا | sku/barcode تطابق تام أولاً ثم ILIKE للاسم |
| `posAvailable` | لا | `true` لنقطة البيع |
| `inStockOnly` | لا | إخفاء الرصيد صفر ضمن النطاق |
| `page` / `limit` | لا | الافتراضي `limit=200` |

بدون `warehouseId`/`locationId`: `onHand` = `quantityCache` (سريع، محدَّث عند كل بيع).  
مع أحدهما: `onHand` = مجموع الدفتر في ذلك النطاق.

```ts
{
  productId: string;
  variantId: string | null;
  sku: string;
  nameAr: string;
  nameEn: string | null;
  barcode: string | null;
  trackInventory: boolean;
  posAvailable: boolean;
  allowBackorder: boolean;
  warehouseId: string | null;   // المستودع الافتراضي للمنتج
  locationId: string | null;
  onHand: string;               // حسب نطاق الفلتر
  quantityCache: string;        // إجمالي الشركة
}
```

### مسح باركود POS

```
GET /inventory/stock?companyId=…&posAvailable=true&barcode=6281234567890
```

ثم عند البيع: `POST /inventory/stock/sale-deduct` (بدون `locationId` إن رغبت بالخصم من مستودع المنتج).

---

## 5) رصيد منتج مع تفصيل المواقع

`GET /inventory/products/:id/stock`  
`GET /public/inventory/products/:productId/stock?companyId=`

إضافات جديدة في `data`:

```ts
{
  warehouseId: string | null;   // المستودع الافتراضي
  locationId: string | null;
  locations: Array<{
    locationId: string;
    warehouseId: string;
    locationCode: string;
    locationNameAr: string;
    warehouseCode: string;
    onHand: string;
  }>;
  // … onHand / available / variants كما سبق
}
```

استخدم `locations[]` لعرض اختيار مكان خروج البضاعة في POS.

---

## 6) تسريع جلب وفلترة المنتجات

`GET /inventory/products`

| تغيير | ماذا يفعل الفرونت |
|--------|-------------------|
| `warehouseId` / `locationId` | فلتر المستودع/الموقع الافتراضي للمنتج |
| `search` | لم يعد يمسح `description` — يعتمد sku/barcode/الاسم. المطابقة التامة للباركود أولاً |
| `sort=quantity` | ترتيب حسب `quantityCache` |
| `liveQuantity=true` | اختياري: overlay مجموع الدفتر الحي. **الافتراضي كاش سريع** |
| `posAvailable=true` | قائمة POS |

لا تستدعِ `GET /inventory/products` بدون `limit` معتمداً على overlay الدفتر — القائمة أصبحت سريعة لأنها تقرأ `quantityCache`. للرصيد حسب موقع معيّن استخدم `GET /inventory/stock?locationId=`.

---

## 7) تسلسل POS الموصى به

```
1) البحث/المسح
   GET /inventory/stock?companyId=&posAvailable=true&barcode=…  أو  &search=…
2) إن كان للمنتج متغيرات
   GET /inventory/products/:id/stock  → اختر variantId + (اختياري) location من locations[]
3) إتمام البيع
   POST /inventory/stock/sale-deduct
   { companyId, sourceDocument, lines: [{ productId, variantId?, quantity, locationId? }] }
4) المتجر الإلكتروني
   quantityCache و GET /public/inventory/products/:id/stock يعكسان الخصم فوراً
5) إلغاء التذكرة
   POST /inventory/stock/sale-restore بنفس sourceDocument (بدون locationId لإرجاع أصل المواقع)
```

---

## 8) توافق خلفي

- `locationId` على `sale-deduct` **لم يعد إلزامياً**. العملاء القدامى الذين يرسلونه يعملون كما قبل.
- أُضيفت حقول في الاستجابة (`operations`, `lines[].locationId`, …) — تجاهلها آمن.
- قائمة المنتجات لم تعد تحسب `SUM(ledger)` في كل صفحة إلا مع `liveQuantity=true`.

راجع أيضاً [`store-sale-stock-frontend.md`](./store-sale-stock-frontend.md) لسياق طلبات المتجر.

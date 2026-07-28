# عقد تجديد المخزون — منتج أساسي vs متغيرات

> سياسة Backend مطبّقة على `warehouse-operation-lines` + اتساق `ledger-entries`.  
> لا يوجد endpoint جديد؛ الـ API الحالي كافٍ عبر `variantId`.

---

## السياسة (مرنة + منع المزج)

| الوضع | الطلب | متى تستخدمه الواجهة |
|--------|--------|----------------------|
| منتج أساسي فقط | `productId` + `variantId: null` | اختيار المستخدم «المنتج الأساسي فقط» |
| حسب المتغيرات | `productId` + `variantId: <uuid>` لكل سطر | اختيار «حسب المتغيرات» + كميات > 0 |
| مزج الوضعين لنفس المنتج في نفس العملية | — | **ممنوع** (Backend يرفض بـ 400) |

- إن لم يكن للمنتج متغيرات نشطة → الوضع الوحيد: منتج أساسي (`variantId: null`).
- إن وُجدت متغيرات → الواجهة تعرض **اختيار الوضع** (لا تعرض المتغيرات تلقائيًا كخيار وحيد).

---

## ماذا يفعل الـ Frontend

في حوار تجديد المخزون (`ProductStockMoveRequestDialog`):

1. عند الفتح: إن `variants.length > 0` اعرض اختيارًا:
   - **المنتج الأساسي فقط** → سطر واحد: `variantId: null`
   - **حسب المتغيرات** → قائمة متغيرات + كميات (أرسل فقط الكمية > 0)
2. إن لا متغيرات → منتج أساسي فقط تلقائيًا.
3. أنشئ العملية ثم الأسطر كما اليوم:
   - `POST /inventory/warehouse-operations` — مثلًا `kind: "replenishment"` أو `"receipt"`, `status: "draft"`
   - `POST /inventory/warehouse-operation-lines` لكل سطر وفق الوضع
4. **لا تخلط** الوضعين في نفس `operationId` لنفس `productId`.
5. في العرض/التصديق: أظهر اسم المتغير أو «المنتج الأساسي» حسب `variantId`.

### مثال — وضع المتغيرات

```json
{
  "operationId": "...",
  "productId": "8a4e0521-…",
  "variantId": "6689553a-…",
  "quantity": 5,
  "demandQuantity": 5,
  "toLocationId": "…"
}
```

### مثال — منتج أساسي فقط

```json
{
  "operationId": "...",
  "productId": "8a4e0521-…",
  "variantId": null,
  "quantity": 20,
  "demandQuantity": 20,
  "toLocationId": "…"
}
```

---

## ماذا يفعل الـ Backend (مُنفَّذ)

على `POST/PATCH /inventory/warehouse-operation-lines`:

1. `variantId` إن وُجد → يجب أن يتبع نفس `productId` وأن يكون نشطًا.
2. `variantId` مع منتج بلا متغيرات نشطة → رفض.
3. منع المزج لنفس المنتج داخل نفس العملية.
4. على `POST /inventory/ledger-entries`: `variantId` يجب أن يطابق سطر العملية (أو يُحذف ليُورَث من السطر).

رسالة المزج:

```text
Product has variants; each line must include variantId (or use product-only mode with no variants on any line)
```

---

## تسلسل العمل

```text
فتح تجديد المخزون
        │
        ▼
 هل للمنتج متغيرات نشطة؟
   لا ──► سطر منتج أساسي فقط
   نعم ─► اختيار الوضع
            ├─ منتج أساسي فقط ──► سطر variantId=null
            └─ متغيرات ──► أسطر variantId لكل كمية > 0
        │
        ▼
 POST operation + lines
        │
        ▼
 مسودة → جاهز → تصديق / Ledger بنفس مستوى السطر
```

---

راجع أيضًا القسم 18 في [`inventory-api.md`](./inventory-api.md).

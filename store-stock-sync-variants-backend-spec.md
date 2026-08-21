# خصم المبيعات — متغيرات المنتج (Backend Spec)

## الهدف

عند خصم مخزون من تطبيق **خصم المبيعات** (`/pos`) يجب أن يُخصَم على **مستوى المتغير** (`variantId`) — بنفس منطق طلب المتجر الإلكتروني — وليس على مستوى المنتج الأب فقط.

**الفرونت (تم):**
- يفتح منتقي متغير عند الضغط على منتج له أكثر من متغير.
- يرسل `variantId` في كل بند لـ `POST /inventory/stock/sale-deduct`.
- يقرأ الرصيد من `GET /inventory/stock?locationId=…` (صف لكل متغير عند الإمكان).

---

## 1) `POST /inventory/stock/sale-deduct` — مطلوب

### جسم الطلب (موجود — تأكيد السلوك)

```json
{
  "companyId": "uuid",
  "locationId": "uuid",
  "sourceDocument": "SALE-B-01-173…",
  "notes": "خصم مبيعات — موقع …",
  "lines": [
    {
      "productId": "uuid",
      "variantId": "uuid",
      "quantity": 2,
      "locationId": "uuid"
    }
  ]
}
```

### سلوك مطلوب من الباك

| الحالة | المطلوب |
|---|---|
| منتج `displayLevel = variant` و`variantId` مُرسَل | خصم من `LocationStock` **لذلك المتغير** + تحديث `quantityCache` للمتغير + إجمالي المنتج |
| منتج `displayLevel = variant` و`variantId` **غائب** | **400** برسالة واضحة: `"variantId مطلوب لهذا المنتج"` — لا خصم على مستوى المنتج الأب |
| منتج بدون متغيرات | خصم بـ `productId` فقط (`variantId` null) |
| `quantity` > رصيد المتغير في الموقع | **409** أو **422** — `"كمية غير كافية"` مع `onHand` المتبقي |
| `trackInventory = false` | `status: skipped_no_track` (كما هو اليوم) |

**محاذاة مع المتجر:** نفس مسار الخصم المستخدم عند تأكيد طلب storefront (الذي يرسل `variantId` في بنود الطلب).

---

## 2) `GET /inventory/stock` — قائمة POS

**Query:** `companyId`, `locationId`, `search`, `inStockOnly`, `page`, `limit`

### مطلوب للمنتجات ذات المتغيرات

- إرجاع **صف منفصل لكل متغير** في الموقع المحدد:

```json
{
  "items": [
    {
      "productId": "uuid",
      "variantId": "uuid",
      "sku": "ND-LO-ELSEVE-001",
      "nameAr": "ماسك إلسيف — 500ml",
      "onHand": 78,
      "locationId": "uuid",
      "trackInventory": true,
      "posAvailable": true
    }
  ]
}
```

- **لا** تُرجع صفاً على مستوى المنتج (`variantId: null`) **مع** صفوف متغيرات لنفس المنتج — لتجنب التكرار والخصم الخاطئ.
- `nameAr` / `sku` على مستوى **المتغير** (كما في الكatalog).
- `onHand` = الكمية في **`locationId`** المطلوب (ليس إجمالي الشركة).

---

## 3) `GET /inventory/products/:id/stock` — تحسين اختياري

**Query اختياري:** `locationId`

عند تمرير `locationId`:
- `variants[].onHand` / `available` = الرصيد **في ذلك الموقع** فقط.
- `displayLevel` يبقى `product` | `variant`.

> الفرونت يعتمد حالياً على `GET /inventory/stock?productId=…&locationId=…` لرصيد الموقع؛ هذا الـ query على snapshot **يُفضّل** لتقليل الطلبات.

---

## 4) بعد الخصم — تزامن المتجر

بعد `sale-deduct` ناجح بـ `variantId`:

1. تحديث `LocationStock` (variant + location).
2. تحديث `ProductVariant.quantityCache` / `available`.
3. تحديث `Product.quantityCache` (مجموع المتغيرات أو cache المنتج).
4. انعكاس فوري على **واجهة المتجر** (`GET /public/inventory/products/:id/stock`).

---

## 5) رسائل خطأ مقترحة (عربي)

| HTTP | `error.code` | `message` |
|---|---|---|
| 400 | `VARIANT_REQUIRED` | المتغير مطلوب لهذا المنتج — اختر SKU/متغيراً محدداً |
| 409 | `INSUFFICIENT_STOCK` | الكمية غير متوفرة في هذا الموقع |
| 404 | `VARIANT_NOT_FOUND` | المتغير غير موجود أو غير نشط |

---

## 6) اختبار قبول (Acceptance)

1. منتج بمتغيرين (مثلاً مقاس S / M) — رصيد S=5 و M=10 في موقع B-01.
2. من `/pos` اختر الموقع B-01 → اضغط المنتج → اختر S → أضف 2 → تأكيد الخصم.
3. **يتوقع:** S=3, M=10, إجمالي المنتج ينقص 2 فقط من S.
4. طلب متجر بنفس `variantId` يرى نفس الرصيد المتبقي.
5. محاولة خصم بدون `variantId` لمنتج variant → **400 VARIANT_REQUIRED**.

---

## 7) الفرونت — لا تغيير API جديد

الفرونت يستخدم بالفعل:

- `POST /inventory/stock/sale-deduct` مع `variantId`
- `GET /inventory/stock?locationId=…`
- `GET /inventory/products/:id/stock`

**المطلوب من الباك:** ضمان السلوك أعلاه — خاصة **رفض الخصم بدون variantId** و**صفوف قائمة المخزون per-variant per-location**.

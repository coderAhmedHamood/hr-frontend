# متغيّرات المنتج في المتجر (صورة/وصف/عنوان) — دليل الفرونت

عرض متغيّرات المنتج (Variants) في المتجر مع **عنوان** و**وصف** و**صور**، بالإضافة إلى السعر والمخزون وقيم الخصائص لاختيار المتغيّر.

**JSON:** camelCase · الأموال تُرجع نصاً (string) بأربع منازل عشرية

---

## 0) الفكرة

المتغيّر يملك أصلاً الحقول المطلوبة — **لا حقول جديدة، ولا تكرار**:

| العرض المطلوب | الحقل في الـ API |
|----------------|------------------|
| العنوان | `nameAr` |
| الوصف | `description` |
| الصورة الرئيسية | `imageUrl` |
| معرض الصور | `images[]` (مرتّب، `imageUrl = images[0]`) |

هذه الحقول تُرجَع الآن **في كل مكان** يُستدعى فيه المتغيّر: المتجر العام، الاستجابة الكاملة للمنتج، ونقاط الإدارة.

---

## 1) المتجر العام (بدون تسجيل دخول) — جديد

### `GET /public/inventory/products/:productId/variants`

يُرجع متغيّرات المنتج المعروضة في المتجر فقط: **نشِطة، غير مؤرشفة**، لمنتج **نشِط وقابل للبيع** (`status=active`, `saleOk=true`) وغير مؤرشف.

**Query:**

| المعامل | مطلوب | ملاحظة |
|---------|-------|--------|
| `companyId` | نعم | uuid (v4) |

**Response** — مصفوفة مباشرة داخل `data`:

```ts
type PublicProductVariant = {
  id: string;
  productId: string;
  combinationKey: string;      // مثل "color:red|size:xl"
  sku: string;
  nameAr: string;              // العنوان
  description: string | null;  // الوصف
  imageUrl: string | null;     // الصورة الرئيسية (= images[0])
  images: string[];            // معرض الصور
  salePriceAmount: string;     // سعر المتغيّر — إن كان "0.0000" استخدم سعر المنتج
  salePriceCurrency: string;   // مثل "SAR"
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | string;
  attributes: {
    valueId: string;           // معرّف قيمة الخاصية (لاختيار المتغيّر)
    attributeNameAr: string;   // مثل "اللون"
    valueNameAr: string;       // مثل "أحمر"
    colorHex: string | null;   // لون العيّنة إن وُجد
  }[];
};
```

**مثال استجابة:**

```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "id": "…",
      "productId": "…",
      "combinationKey": "color:red|size:xl",
      "sku": "SKU-001-RED-XL",
      "nameAr": "أحمر / XL",
      "description": "قطن 100% — مقاس كبير",
      "imageUrl": "https://api.example.com/uploads/products/red-xl-1.png",
      "images": [
        "https://api.example.com/uploads/products/red-xl-1.png",
        "https://api.example.com/uploads/products/red-xl-2.png"
      ],
      "salePriceAmount": "120.0000",
      "salePriceCurrency": "SAR",
      "stockStatus": "in_stock",
      "attributes": [
        { "valueId": "…", "attributeNameAr": "اللون", "valueNameAr": "أحمر", "colorHex": "#FF0000" },
        { "valueId": "…", "attributeNameAr": "المقاس", "valueNameAr": "XL", "colorHex": null }
      ]
    }
  ],
  "error": null
}
```

### كيف يستخدمها الفرونت في صفحة المنتج

1. اجلب المنتج: `GET /public/inventory/products/by-slug/:slug?companyId=…`.
2. اجلب المتغيّرات: `GET /public/inventory/products/:productId/variants?companyId=…`.
3. ابنِ مبدّلات الاختيار من `attributes` (اللون/المقاس…). عند اختيار قيمة لكل خاصية، طابق المتغيّر عبر `combinationKey` أو عبر `attributes[].valueId`.
4. عند اختيار متغيّر: اعرض `nameAr` كعنوان، و`description` كوصف، وبدّل الصورة إلى `imageUrl`/`images`.
5. السعر: إذا `salePriceAmount === "0.0000"` استخدم سعر المنتج الأساسي، وإلا استخدم سعر المتغيّر.
6. المخزون الموثوق: `GET /public/inventory/products/:productId/stock` — إن كان `displayLevel = variant` اعرض `variants[].available` لكل `variantId`.

> السعر و`salePriceCurrency` وتكلفة المتغيّر: التكلفة والحقول الداخلية **لا** تُرجَع في المسار العام.

---

## 2) لوحة الإدارة — نفس الحقول (موجودة مسبقاً)

الحقول `nameAr` / `description` / `imageUrl` / `images` تُرجَع أصلاً في:

| نقطة | الوصف |
|------|-------|
| `GET /inventory/product-variants` | قائمة المتغيّرات (JWT + صلاحية `inv.catalog.product-variants.read`) |
| `GET /inventory/product-variants/:id` | تفاصيل متغيّر |
| `GET /inventory/products/:id/full` | المنتج الكامل → `variants[]` (نفس الحقول + `attributeLinks` + `attributeValueIds`) |

---

## 3) ضبط العنوان/الوصف/الصورة (إدارة)

عبر إنشاء/تعديل المتغيّر أو مصفوفة المنتج الكامل:

| الحقل | Create/Update Variant | ملاحظة |
|-------|-----------------------|--------|
| `nameAr` | ✅ مطلوب عند الإنشاء | العنوان |
| `description` | ✅ اختياري | نص (يقبل HTML حسب حاجة الواجهة) |
| `imageUrl` | ✅ اختياري | إن أُرسل `images` فإن `imageUrl = images[0]` |
| `images[]` | ✅ اختياري | حتى 20 صورة، مرتّبة. ارفع كل صورة عبر `POST /uploads/products` ثم مرّر الروابط |

- `POST /inventory/product-variants` — إنشاء مفرد.
- `POST /inventory/product-variants/bulk` — دفعة.
- `PATCH /inventory/product-variants/:id` — تعديل (إرسال `images` يستبدل المعرض بالكامل؛ مصفوفة فارغة تمسح المعرض).
- `PATCH /inventory/products/:id/full` — مصفوفة الخصائص + المتغيّرات معاً (الأنسب لواجهة الـ matrix).

---

## خلاصة للفرونت

- **جديد:** `GET /public/inventory/products/:productId/variants?companyId=…` لعرض المتغيّرات في المتجر.
- العنوان = `nameAr`، الوصف = `description`، الصور = `imageUrl` + `images[]`.
- `attributes[]` لبناء اختيار المتغيّر (لون/مقاس…).
- لا تغييرات على قاعدة البيانات ولا migration — الحقول كانت موجودة، أُضيف فقط المسار العام وتوحيد الإرجاع.

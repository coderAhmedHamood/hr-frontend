# Inventory Products Full API — دليل الربط للـ Frontend

> تنفيذ مقترح [`inventory-bulk-api-proposal.md`](./inventory-bulk-api-proposal.md) — الأولوية P0/P1 للمنتجات.  
> الـ endpoints الذرّية في [`inventory-api.md`](./inventory-api.md) ما زالت تعمل كـ fallback للتعديلات الصغيرة.

---

## 1. لماذا هذا الـ API؟

بدل ~50–90 طلب عند حفظ منتج بخصائص ومتغيرات:

| قبل | بعد |
|-----|-----|
| POST منتج + N media + N UOM + N lines + N values + N variants + N links + عدة GET | **طلب واحد** `…/full` |

- **Transaction واحدة:** أي فشل → rollback كامل (لا منتج يتيم).
- **استجابة nested:** المنتج كامل بعد الحفظ/الفتح.
- **`clientKey` → `idMap`:** الواجهة تربط المفاتيح المؤقتة بالـ UUIDs الحقيقية دون تخمين.

---

## 2. الأساسيات

| البند | القيمة |
|------|--------|
| Auth | `Authorization: Bearer <token>` |
| Content-Type | `application/json` |
| Envelope | `{ status, message, data, error }` كباقي المخزون |
| صلاحيات | نفس صلاحيات المنتجات الذرّية |

| Method | Path | Permission | Status |
|--------|------|------------|--------|
| POST | `/inventory/products/full` | `inv.catalog.products.create` | 201 |
| GET | `/inventory/products/:id/full` | `inv.catalog.products.read` | 200 |
| PATCH | `/inventory/products/:id/full` | `inv.catalog.products.update` | 200 |

---

## 3. شكل الاستجابة (`data`)

نفس حقول رأس المنتج من `InventoryProductResponseDto` **إضافةً إلى:**

```json
{
  "id": "…",
  "companyId": "…",
  "sku": "BURGER-001",
  "nameAr": "…",
  "priceAmount": "25.0000",
  "priceCurrency": "SAR",
  "…": "… بقية حقول الرأس …",

  "media": [
    {
      "id": "…",
      "productId": "…",
      "companyId": "…",
      "url": "https://…",
      "alt": "",
      "type": "image",
      "position": 0,
      "isPrimary": true,
      "width": null,
      "height": null,
      "isArchived": false,
      "archivedAt": null,
      "createdAt": "…",
      "createdBy": null,
      "updatedBy": null
    }
  ],

  "uomLines": [
    {
      "id": "…",
      "productId": "…",
      "companyId": "…",
      "nameAr": "قطعة",
      "uneceCode": null,
      "relativeQuantity": "1.000000",
      "isReference": true,
      "packagingType": "unit",
      "sortOrder": 0,
      "isArchived": false,
      "archivedAt": null,
      "createdAt": "…",
      "updatedAt": "…",
      "createdBy": null,
      "updatedBy": null
    }
  ],

  "attributes": [
    {
      "id": "…",
      "productId": "…",
      "companyId": "…",
      "catalogAttributeId": null,
      "nameAr": "الوان مصابيح",
      "displayType": "color",
      "createVariant": "always",
      "sortOrder": 0,
      "isArchived": false,
      "archivedAt": null,
      "createdAt": "…",
      "updatedAt": "…",
      "createdBy": null,
      "updatedBy": null,
      "values": [
        {
          "id": "…",
          "productAttributeLineId": "…",
          "productId": "…",
          "companyId": "…",
          "catalogAttributeValueId": null,
          "nameAr": "اصفر",
          "freeText": null,
          "defaultExtraPrice": null,
          "colorHex": "#effd86",
          "imageUrl": null,
          "sortOrder": 0,
          "isArchived": false,
          "archivedAt": null,
          "createdAt": "…",
          "updatedAt": "…",
          "createdBy": null,
          "updatedBy": null
        }
      ]
    }
  ],

  "variants": [
    {
      "id": "…",
      "productId": "…",
      "companyId": "…",
      "combinationKey": "v-yellow",
      "sku": "BURGER-001-اصفر",
      "nameAr": "منتج تجريبي (اصفر)",
      "barcode": null,
      "imageUrl": null,
      "salePriceAmount": "25.0000",
      "salePriceCurrency": "SAR",
      "costPriceAmount": "0.0000",
      "costPriceCurrency": "SAR",
      "quantityCache": "0.0000",
      "stockStatus": "out_of_stock",
      "isActive": true,
      "isArchived": false,
      "archivedAt": null,
      "createdAt": "…",
      "updatedAt": "…",
      "createdBy": null,
      "updatedBy": null,
      "attributeValueIds": ["<product_attribute_value_uuid>"],
      "attributeLinks": [
        {
          "id": "…",
          "variantId": "…",
          "productAttributeValueId": "…",
          "productId": "…",
          "companyId": "…",
          "attributeNameAr": "الوان مصابيح",
          "valueNameAr": "اصفر",
          "colorHex": "#effd86"
        }
      ]
    }
  ],

  "idMap": {
    "m1": "uuid-media",
    "u1": "uuid-uom",
    "a1": "uuid-attribute-line",
    "v-yellow": "uuid-product-attribute-value",
    "var1": "uuid-variant"
  }
}
```

### ملاحظات الاستجابة

- `GET …/full`: بدون `idMap` عادةً؛ يعيد فقط الصفوف **غير المؤرشفة**.
- `POST/PATCH …/full`: `idMap` يظهر عندما تُرسل `clientKey` على عناصر متداخلة.
- الأرقام العشرية غالباً **string** (مثل باقي المخزون).
- `attributeValueIds` مشتق من `attributeLinks` لسهولة الواجهة.

---

## 4. إنشاء منتج كامل — `POST /inventory/products/full`

### قواعد حاسمة

1. كل شيء داخل **transaction**؛ فشل أي تحقق → لا يُحفظ شيء.
2. قيم الخصائص تُنشأ **قبل** ربط المتغيرات.
3. ربط المتغير يتم عبر `attributeValueClientKeys` فقط (مفاتيح قيم الخصائص في نفس الطلب).
4. **ممنوع** إرسال `catalog-attribute-value` id كأنه `productAttributeValueId`.
5. `catalogAttributeValueId` مسموح داخل `attributes[].values[]` فقط لنسخ بيانات الكتالوج عند الإنشاء.

### Body مثال

```json
{
  "companyId": "11111111-1111-4111-8111-111111111111",
  "sku": "BURGER-001",
  "nameAr": "منتج تجريبي",
  "nameEn": null,
  "slug": null,
  "categoryId": null,
  "brandId": null,
  "status": "draft",
  "stockStatus": "out_of_stock",
  "productType": "goods",
  "tracking": "none",
  "invoicePolicy": "ordered",
  "priceAmount": 25,
  "priceCurrency": "SAR",
  "costPriceAmount": 0,
  "costPriceCurrency": "SAR",
  "trackInventory": true,
  "lowStockThreshold": 5,
  "allowBackorder": false,
  "posAvailable": false,
  "saleOk": true,
  "purchaseOk": true,
  "tags": [],
  "seoMetaTitle": null,
  "seoMetaDescription": null,

  "media": [
    {
      "clientKey": "m1",
      "url": "https://cdn.example.com/p.jpg",
      "alt": "",
      "type": "image",
      "position": 0,
      "isPrimary": true
    }
  ],

  "uomLines": [
    {
      "clientKey": "u1",
      "nameAr": "قطعة",
      "relativeQuantity": 1,
      "isReference": true,
      "packagingType": "unit",
      "sortOrder": 0
    }
  ],

  "attributes": [
    {
      "clientKey": "a1",
      "catalogAttributeId": null,
      "nameAr": "الوان مصابيح",
      "displayType": "color",
      "createVariant": "always",
      "sortOrder": 0,
      "values": [
        {
          "clientKey": "v-yellow",
          "catalogAttributeValueId": null,
          "nameAr": "اصفر",
          "colorHex": "#effd86",
          "defaultExtraPrice": null,
          "sortOrder": 0
        }
      ]
    }
  ],

  "variants": [
    {
      "clientKey": "var1",
      "sku": "BURGER-001-اصفر",
      "nameAr": "منتج تجريبي (اصفر)",
      "combinationKey": "v-yellow",
      "salePriceAmount": 25,
      "salePriceCurrency": "SAR",
      "costPriceAmount": 0,
      "costPriceCurrency": "SAR",
      "stockStatus": "out_of_stock",
      "isActive": true,
      "attributeValueClientKeys": ["v-yellow"]
    }
  ]
}
```

### حقول الرأس (مطلوبة / اختيارية)

نفس `CreateInventoryProductDto`:

| الحقل | مطلوب | ملاحظات |
|-------|-------|---------|
| `companyId` | نعم | uuid |
| `sku` | نعم | فريد لكل شركة |
| `nameAr` | نعم | |
| `slug` | لا | يُولَّد من `nameAr` إن لم يُرسل |
| بقية الحقول | لا | نفس الذرّي (status, prices, SEO, …) |

### المجموعات المتداخلة (كلها اختيارية)

| المجموعة | مطلوب داخل العنصر | ملاحظات |
|----------|-------------------|---------|
| `media[]` | `url` | `clientKey` اختياري |
| `uomLines[]` | `nameAr` | |
| `attributes[]` | `nameAr` أو `catalogAttributeId` | مع `values[]` |
| `attributes[].values[]` | `nameAr` أو `catalogAttributeValueId` | `clientKey` للربط مع المتغيرات |
| `variants[]` | `combinationKey`, `sku`, `nameAr` | الربط: `attributeValueClientKeys` |

### Enums المستخدمة

| الحقل | القيم |
|-------|--------|
| `media.type` | `image`, `video` |
| `uomLines.packagingType` | `unit`, `pack`, `box`, `pallet`, `other` |
| `attributes.displayType` | `radio`, `pills`, `select`, `color`, `image`, `multi` |
| `attributes.createVariant` | `always`, `dynamic`, `never` |
| `variants.stockStatus` | `in_stock`, `out_of_stock`, `preorder`, `discontinued` |
| رأس المنتج | نفس enums في `inventory-api.md` |

---

## 5. قراءة منتج كامل — `GET /inventory/products/:id/full`

```http
GET /inventory/products/91669df4-a5aa-4c48-8838-1ffaf998609a/full
Authorization: Bearer <token>
```

- بديل عن: GET منتج + media + uom + attribute-lines + values + variants + links.
- يعيد الشجرة النشطة فقط (غير المؤرشفة).
- استخدمه بعد الحفظ أو عند فتح شاشة التعديل.

---

## 6. تحديث منتج كامل — `PATCH /inventory/products/:id/full`

### استراتيجية replace-nested

| حالة المفتاح في الـ Body | السلوك |
|--------------------------|--------|
| **غير مُرسل** (`undefined`) | المجموعة لا تُمس |
| **مُرسل** (حتى `[]`) | هذه هي الحالة النهائية المرغوبة |

داخل مجموعة مُرسلة:

| العنصر | السلوك |
|--------|--------|
| له `id` موجود وينتمي للمنتج | تحديث |
| بدون `id` (قد يكون له `clientKey`) | إنشاء |
| موجود في DB وغير موجود في المصفوفة | **أرشفة ناعمة** |

### قواعد إضافية للتحديث

- رأس المنتج: patch عادي (حقول اختيارية مثل `UpdateInventoryProductDto`).
- أرشفة سطر خاصية → تُؤرشف قيمه أيضاً.
- روابط المتغير ↔ القيمة تُعاد بناؤها من:
  - `attributeValueClientKeys` (قيم جديدة في نفس الطلب)، و/أو
  - `attributeValueIds` (UUIDs موجودة لنفس المنتج).
- الروابط القديمة تُحذف صلباً ثم تُعاد حسب القائمة المرسلة.
- الأرشفة تتم قبل الإنشاء في نفس الطلب حتى يمكن إعادة استخدام SKU محذوف في نفس الـ PATCH.

### Body مثال (تحديث جزئي + استبدال المتغيرات)

```json
{
  "nameAr": "منتج محدّث",
  "priceAmount": 30,

  "media": [
    {
      "id": "<existing-media-uuid>",
      "url": "https://cdn.example.com/new.jpg",
      "isPrimary": true
    }
  ],

  "uomLines": [],

  "attributes": [
    {
      "id": "<existing-line-uuid>",
      "nameAr": "الوان مصابيح",
      "displayType": "color",
      "values": [
        {
          "id": "<existing-value-uuid>",
          "nameAr": "اصفر",
          "colorHex": "#effd86"
        },
        {
          "clientKey": "v-red",
          "nameAr": "احمر",
          "colorHex": "#ff0000"
        }
      ]
    }
  ],

  "variants": [
    {
      "id": "<existing-variant-uuid>",
      "sku": "BURGER-001-اصفر",
      "nameAr": "منتج محدّث (اصفر)",
      "combinationKey": "v-yellow",
      "salePriceAmount": 30,
      "attributeValueIds": ["<existing-value-uuid>"]
    },
    {
      "clientKey": "var-red",
      "sku": "BURGER-001-احمر",
      "nameAr": "منتج محدّث (احمر)",
      "combinationKey": "v-red",
      "salePriceAmount": 30,
      "attributeValueClientKeys": ["v-red"]
    }
  ]
}
```

في المثال أعلاه:

- `media` استُبدل ليبقى عنصر واحد محدّث؛ أي media أخرى تُؤرشف.
- `uomLines: []` يؤرشف كل وحدات القياس الحالية.
- قيمة حمراء جديدة + متغير جديد عبر `clientKey`.

---

## 7. أخطاء شائعة وحلولها

| الخطأ | المعنى | الحل |
|-------|--------|------|
| `400` — unknown `attributeValueClientKey` | مفتاح غير موجود في `attributes[].values[].clientKey` | وحّد المفاتيح بين القيم والمتغيرات |
| `400` — value must belong to same product | `attributeValueIds` من منتج آخر | استخدم ids من نفس المنتج |
| `404` — Product attribute value #… | استخدمت الـ API الذرّي بـ id كتالوج بالخطأ | في `full` لا ترسل catalog id كرابط متغير |
| `409` — SKU / combinationKey مكرر | تعارض فريد | غيّر sku أو combinationKey؛ في full يفشل الكل معاً |
| `404` — product / company / category | مرجع غير موجود | تحقق من الـ UUIDs |

---

## 8. ماذا يفعل الـ Frontend بعد الربط؟

1. استبدل `syncNested` + سلسلة الـ POSTs بـ:
   - إنشاء: `POST /inventory/products/full`
   - تعديل: `PATCH /inventory/products/:id/full`
   - فتح/hydrate: `GET /inventory/products/:id/full`
2. احتفظ بالـ endpoints الذرّية فقط لتعديلات صغيرة جداً (مثل تغيير صورة واحدة) إن لزم.
3. عند الإنشاء: أرسل `clientKey` + `catalogAttributeValueId` للنسخ من الكتالوج؛ **لا** ترسل catalog id كـ `productAttributeValueId`.
4. بعد النجاح: استخدم `data.id` و`data.idMap` و/أو الشجرة الكاملة مباشرة — لا حاجة لـ 8 طلبات GET.

### تدفق مقترح للفورمة

```text
[فتح جديد]
  → تعبئة الفورم محلياً بـ clientKeys
  → POST /inventory/products/full
  → خزّن data.id + حدّث الـ UI من data (أو idMap)

[فتح تعديل]
  → GET /inventory/products/:id/full
  → عبّئ الفورم من الشجرة (استخدم ids الحقيقية)

[حفظ تعديل]
  → PATCH /inventory/products/:id/full
     (أرسل المجموعات التي تغيّرت فقط؛ أو كلها إن كان أسهل)
  → حدّث الـ UI من الاستجابة
```

---

## 9. معايير القبول (محققة على الـ Backend)

- [x] إنشاء منتج بخصائص + قيم + متغيرات + media + UOM في **طلب واحد**
- [x] فشل تحقق على متغير يلغي العملية بالكامل
- [x] الاستجابة تعيد ids حقيقية + شجرة nested + `idMap`
- [x] `GET …/full` يغني عن قراءات متعددة بعد الحفظ/الفتح
- [x] `PATCH …/full` يدعم replace-nested مع أرشفة العناصر المحذوفة من المصفوفة
- [x] الـ endpoints الذرّية ما زالت متاحة

---

## 10. خارج النطاق الحالي (لاحقاً من المقترح)

| العنصر | الحالة |
|--------|--------|
| `catalog-attributes/full` | لم يُنفَّذ بعد (P1) |
| `warehouse-operations/full` | لم يُنفَّذ بعد (P2) |
| `POST /inventory/bulk` عام | لم يُنفَّذ بعد (P3) |
| `GET /inventory/products?include=primaryMedia` | لم يُنفَّذ بعد (P3) |

عند الحاجة يمكن طلبها بنفس نمط `…/full`.

---

## 11. ملخص سريع للمطور

```http
POST   /inventory/products/full
GET    /inventory/products/:id/full
PATCH  /inventory/products/:id/full
```

- اربط المتغيرات بـ `attributeValueClientKeys` (إنشاء) أو `attributeValueIds` / `attributeValueClientKeys` (تحديث).
- لا تخلط بين `catalog_attribute_values.id` و `product_attribute_values.id`.
- أي فشل = لا حفظ جزئي.
- التوثيق الذرّي الكامل: [`inventory-api.md`](./inventory-api.md).

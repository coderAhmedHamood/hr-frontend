أولاً: المنتجات (Products) — ما المبني فعليًا

مصدر الحقيقة: نموذج النطاق في src/features/ecommerce/domain/types/product.ts

التخزين الحالي: Mock JSON عبر productsApi → mockProductsStore (src/features/ecommerce/admin/products/lib/api/products.ts + src/features/ecommerce/shared/lib/mock/products.json) — لا جداول SQL في هذه الوحدة حتى الآن.

واجهة الإدارة: نموذج المنتج متعدد التبويبات (product-form-dialog.tsx + tabs).



1) كيف يتم تعريف المنتج؟

كيان Product مرتبط بـ companyId، فيه: هوية (id, sku, slug)، أسماء، وصف، فئة/علامة، حالة، مخزون مضمّن (inventory)، أسعار، وسائط، SEO، خصائص/متغيرات، وحدات قياس، ونوع/تتبع اختياري.



يُنشأ/يُعدَّل من نموذج الإدارة ثم يُحفظ عبر productsApi.create/update.



2) هل يوجد Product و Product Variant؟

نعم.



Product = المنتج الأب

ProductVariant[] = المتغيرات الاختيارية على نفس المنتج

عند عدم وجود خصائص مولِّدة للمتغيرات، variants تبقى فارغة ويُدار السعر/الكمية على مستوى المنتج.



3) كيف يتم إنشاء المتغيرات؟

من تبويب الخصائص (product-attributes-tab.tsx): تربط خصائص من كتالوج الخصائص (CatalogAttribute) بقيم، ومع createVariant !== 'never' تُستدعى syncProductVariants في product-variants.ts (Cartesian product للتركيبات) وتُعرض في product-variants-panel.tsx.



4) هل لكل متغير SKU مستقل؟

نعم في النموذج. كل ProductVariant له sku مستقل (يُولَّد تلقائيًا مثل SKU-أحمر-L إن لم يوجد سابقًا). المنتج الأب له sku منفصل أيضًا.



5) هل يوجد Barcode؟

في النموذج/الـ schema: نعم (Product.barcode? و ProductVariant.barcode?).

في الواجهة وبيانات الـ mock: غير مستخدم فعليًا — لا حقل باركود ظاهر في product-general-tab ولا عمود باركود في لوحة المتغيرات، وproducts.json لا يحتوي barcodes.



6) هل يوجد أكثر من Barcode؟

لا. حقل نصي اختياري واحد فقط على المنتج/المتغير — لا قائمة barcodes متعددة.



7) هل يوجد Unit of Measure؟

نعم. عبر uomLines?: ProductUomLine[] + تبويب «الوحدات والتغليف» (product-units-tab.tsx).



8) هل يوجد أكثر من وحدة قياس؟

نعم. مصفوفة وحدات؛ يجب وجود وحدة مرجعية واحدة (isReference) والباقي بكميات نسبية (relativeQuantity).



9) هل يوجد Packaging؟

جزئيًا نعم. كل سطر UOM له packagingType: unit | pack | box | pallet | other.

هذا تغليف على مستوى وحدات المنتج، وليس كيان Packaging منفصل بمخزون مستقل. قواعد التخزين (PutawayRule) يمكنها أيضًا فلترة بـ packagingType.



10) هل يوجد Product Categories؟

نعم. كيان Category منفصل (domain/types/category.ts) مع شجرة parentId، وربط المنتج عبر product.categoryId.

إدارة التصنيفات في تهيئة الكتالوج + بيانات categories.json.



11) هل يوجد Product Type (Stockable / Service / Consumable)؟

يوجد نوع منتج، لكن ليس بنفس تسميات Stockable/Consumable.

القيم المبنية: goods | service | combo (واجهة: بضائع / خدمة / مجموعة).

لا يوجد نوع consumable منفصل.



12) هل يوجد Cost Price؟

نعم.



على المنتج: costPrice?: Money (سعر الشراء في التبويب العام)

على المتغير: costPrice: Money إلزامي في الصف

13) هل يوجد Selling Price؟

نعم.



المنتج: price (+ اختياري compareAtPrice)

المتغير: salePrice

واجهة: «سعر البيع» + أعمدة أسعار المتغيرات.

14) هل يوجد Weight؟

لا — لا حقل وزن في Product / ProductVariant ولا في النموذج.



15) هل يوجد Dimensions؟

لا — لا أبعاد (طول/عرض/ارتفاع) في النموذج.



16) هل يوجد Supplier Information؟

لا على المنتج. لا supplierId / بيانات مورد مرتبطة بالمنتج.

«المورد» يظهر كموقع مستودع (locationType: 'supplier') أو كـ partnerName على مستندات الحركات — وليس master data للموردين على المنتج.



17) هل يوجد Multiple Suppliers؟

لا على مستوى المنتج.



18) هل يوجد الصور؟

نعم. media: MediaItem[] (صورة/فيديو، ترتيب، primary).

واجهة الرأس (product-form-header.tsx) تضيف/تحدّث الصورة الأساسية عبر رابط URL (ليس رفع ملف حقيقي إلى تخزين).



19) هل يوجد Attachments؟

لا — لا مرفقات مستندات (PDF/عقود…) على المنتج. الموجود فقط وسائط media.



20) هل يوجد Bundles أو Kits؟

لا كمنطق تشغيلي. يوجد فقط نوع combo («مجموعة») كتصنيف، بدون BOM / مكونات / تفكيك كمية.



21) هل يوجد Composite Products؟

لا — لا نموذج منتجات مركّبة بمكونات.



22) هل يوجد Archived Products؟

نعم.



status: 'archived'

archivedAt

API: productsApi.archive / unarchive

يظهر في قائمة المنتجات كحالة «مؤرشف».

23) هل يوجد Active / Inactive؟

جزئيًا:



المنتج: draft | active | archived — لا حالة اسمها inactive منفصلة.

المتغير: isActive: boolean (عمود «مفعّل» في لوحة المتغيرات).

24) هل يوجد تتبع للمنتج (Tracking Type)؟

في التعريف والواجهة: نعم — tracking?: 'none' | 'lot' | 'serial' (حسب الكمية / مجموعات / تسلسلي).

تشغيليًا في المخزون: لا — لا أرقام lot/serial على LocationStock أو بنود الحركات؛ الحقل محفوظ على المنتج فقط دون أثر على التطبيق الفعلي للمخزون.



25) هل يوجد Expiration Settings؟

لا — لا إعدادات صلاحية / shelf life / expiry date على المنتج أو المخزون.



ملخص سريع لما هو مكتمل vs ناقص

مكتمل نسبيًا	موجود كنموذج/واجهة فقط أو ناقص

Product + Variants + SKU

Barcode (نموذج بلا UI فعّال)

Categories + Brands

Weight / Dimensions

UOM متعددة + Packaging type

Suppliers / Multiple suppliers

صور (media)

Attachments

Cost + Selling price

Bundles/Kits/Composite حقيقية

Archive + Active (status)

Consumable كنوع مستقل

Tracking field

Lot/Serial تشغيلي + Expiration



ثانيًا: المستودعات (Warehouses) — ما المبني فعليًا

النموذج: src/features/ecommerce/domain/types/warehouse.ts

الإنشاء/القائمة: warehousesApi + warehouse-form-dialog.tsx + warehouses-list-page.tsx

المواقع الافتراضية عند الإنشاء: default-warehouse-locations.ts

إدارة المواقع: locations-list-page.tsx

التخزين: Mock (warehouses.json, warehouse-locations.json) — لا جداول SQL.



1) كيف يتم إنشاء المستودعات؟

من قائمة المستودعات → «مستودع جديد» (WarehouseFormDialog).



الحقول: code, nameAr, address, status (نشط/غير نشط), incomingSteps, outgoingSteps, buyToResupply.



عند warehousesApi.create:



يُحفظ المستودع في الـ mock store

تُنشأ تلقائيًا مواقع النظام عبر buildDefaultWarehouseLocations

2) هل يوجد أكثر من مستودع؟

نعم. كيان متعدد لكل شركة (companyId). البيانات التجريبية فيها مستودعان: wh-main و wh-north.



3) هل يوجد Warehouse Types؟

لا كيان/حقل warehouseType.

يوجد فقط status + إعدادات تدفق (incomingSteps / outgoingSteps) وليس أنواع مستودع (مثل مركزي/فرعي/متجر).



4) هل يوجد Locations؟

نعم. كيان WarehouseLocation مرتبط بـ warehouseId، مع CRUD في صفحة المواقع وتهيئة تلقائية عند إنشاء المستودع.



5) هل المواقع هرمية؟

نعم. عبر parentLocationId.

مثال عند الإنشاء: {CODE} (view) ← أب لـ {CODE}/Stock (internal).

في النموذج يمكن اختيار موقع أب لأي موقع غير نظامي (أو تعديل محدود للنظامي).



6) هل يوجد Zones؟

لا — لا كيان Zone ولا نوع موقع zone.



7) هل يوجد Racks؟

جزئيًا جدًا. حقل اختياري قديم rack?: string على الموقع (معلّق كـ legacy في النوع)، وموجود في seed لرف واحد (loc-main-a1).

لا يوجد كيان Rack ولا حقل Rack في نموذج الموقع الحالي.



8) هل يوجد Shelves؟

لا كيان Shelf. يمكن تمثيل الرف كموقع internal يدويًا (مثل «رف 1»)، بدون نموذج أرفف منفصل.



9) هل يوجد Bins؟

مثل Rack: حقل bin?: string legacy في النوع/الـ seed فقط، بدون واجهة أو كيان Bin.



(نفس الحال لـ aisle?.)



10) هل يوجد Virtual Locations؟

نعم عمليًا عبر النوع view.

يُسمّى في الواجهة «افتراضي»: موقع تنظيمي لا يُفترض أن يخزّن منتجات مباشرة. يُنشأ جذر المستودع {CODE} من هذا النوع.



11) هل يوجد Vendor Locations؟

نعم. النوع supplier («المورد»). يُنشأ تلقائيًا …/Vendors لكل مستودع جديد.



12) هل يوجد Customer Locations؟

نعم. النوع customer («العميل»). يُنشأ تلقائيًا …/Customers.



13) هل يوجد Transit Locations؟

النوع موجود: transit («العابر») في الـ enum والنموذج.

لا يُنشأ تلقائيًا مع المستودع؛ يمكن إنشاؤه يدويًا كموقع من نوع عابر.



14) هل يوجد Scrap Locations؟

لا نوع اسمه scrap.

الأقرب: inventory («خسارة المخزون» / Inventory adjustment) — موقع نظامي لكل مستودع.

عمليات scrap موجودة كمستندات حركات، وغالبًا تخرج من مواقع داخلية وليست مربوطة بنوع موقع scrap مخصص.



15) هل يوجد Return Locations؟

لا — لا نوع return ولا موقع مرتجعات مخصّص.



16) هل يوجد Quality Locations؟

لا نوع موقع quality.

يوجد فقط إعداد تدفق وارد incomingSteps = 3 («استلام، فحص جودة، ثم تخزين») على المستودع — إعداد وصفي/تشغيلي للمستقبل، بدون موقع QC فعلي.



17) هل يوجد Production Locations؟

نعم. النوع production («الإنتاج»)، ويُنشأ تلقائيًا …/Production.



18) هل يوجد Locations Capacity؟

لا — لا سعة (كمية/وزن/حجم) على الموقع.



19) هل يوجد Location Barcode؟

نعم. حقل barcode?: string في النموذج والواجهة («باركود» في نموذج الموقع).



20) هل يوجد تعطيل للموقع؟

نعم. isActive: boolean مع مفتاح «مفعّل» في نموذج الموقع. يمكن تعطيل الموقع دون حذفه.



أنواع المواقع المدعومة اليوم

النوع	المعنى في الواجهة	يُنشأ تلقائيًا؟

view

افتراضي

نعم ({CODE})

internal

داخلي

نعم ({CODE}/Stock) + مواقع يدوية

supplier

المورد

نعم

customer

العميل

نعم

inventory

خسارة المخزون

نعم

production

الإنتاج

نعم

transit

العابر

يدوي فقط

ملخص سريع

مكتمل	ناقص / جزئي

مستودعات متعددة + إنشاء مع مواقع نظام

Warehouse Types

Locations + hierarchy + barcode + isActive

Zones / Shelves ككيانات

Vendor / Customer / Production / View

Return / Quality locations

Transit كنوع قابل للاختيار

Scrap كموقع مخصص (يوجد inventory loss)

Capacity؛ Rack/Bin/Aisle كواجهة حقيقية

ثالثًا: أرصدة المخزون — ما المبني فعليًا
مصدر الرصيد التشغيلي: LocationStock في
src/features/ecommerce/domain/types/location-stock.ts
API: locationStockApi في src/features/ecommerce/admin/orders/lib/api/location-stock.ts
تطبيق الحركات: applyDoneOperationToStock في apply-operation-stock.ts
مرآة على المنتج: product.inventory.quantity

1) كيف يتم حساب الرصيد؟
الرصيد الفعلي للموقع = قيمة محفوظة في صف LocationStock (quantity لكل منتج/متغير × مستودع × موقع).

عند تصديق مستند حركة إلى done:

وارد → +qty على toLocationId
صادر → -qty من fromLocationId
داخلي/تحويل → خصم من مصدر وإضافة لوجهة
جرد/تعديل → فرق (معدود − نظري) على الموقع
ثم يُعاد حساب إجمالي المنتج عبر مجموع المخزون في المواقع الداخلية فقط (locationType === 'internal') ويُزامَن إلى product.inventory.quantity (وvariant.quantity إن وُجدت متغيرات).

مهم: مسودة/جاهز لا تغيّر الرصيد — فقط done.

2) هل الرصيد محفوظ أم محسوب؟
الاثنان معًا، بمستويين:

المستوى	النوع	المعنى
LocationStock.quantity
محفوظ
الرصيد الحقيقي لكل موقع
On Hand للمنتج
محسوب
مجموع صفوف المواقع الداخلية
product.inventory.quantity
محفوظ كمرآة
يُحدَّث بعد الحركات؛ ليس مصدر الحقيقة
مصدر الحقيقة = LocationStock، وليس حسابًا من كل الحركات التاريخية في كل قراءة.

3) هل يوجد On Hand؟
نعم.

دالة: getOnHandTotal / getOnHandByVariant
Hook: useProductOnHand
التقارير (المخزون / Detailed Stock) تقرأ من نفس المصدر
تعريف النظام: On Hand = مجموع الكميات في المواقع الداخلية.

4) هل يوجد Reserved؟
لا كرصيد مخزون محجوز منفصل.
لا حقل reserved على LocationStock.

ما يوجد أقرب شيء: OrderLineAllocation على بنود الطلب (تعليق: reserved/taken) لتوزيع الشحن على مواقع — تخطيط تخصيص للطلب، وليس دفتر حجز يقلّل Available عالميًا قبل الخصم. الخصم الفعلي يتم عند الشحن عبر deduct/adjust.

5) هل يوجد Available؟
لا بمفهوم Available = On Hand − Reserved.

getAvailability يعيد صفوف مواقع بكمية > 0 (أي On Hand حسب الموقع للبيع/التخصيص). الاسم «Availability» هنا = توفر كميات بالموقع، وليس كمية متاحة بعد الحجز.

6) هل يوجد Incoming؟
لا ككمية واردة متوقعة.
لا حقل/تقرير Incoming Qty من مستندات draft/ready (شراء، تجديد، إيصال…).

incomingSteps على المستودع = إعداد عدد خطوات الاستلام فقط، وليس رصيدًا واردًا.

7) هل يوجد Outgoing؟
لا ككمية صادرة متوقعة.
نفس الفكرة: لا Outgoing Qty من التوصيلات/التحويلات غير المصدَّقة.
outgoingSteps = إعداد تدفق الصادر على المستودع فقط.

8) هل يوجد Forecast Quantity؟
لا. لا كمية متوقعة (On Hand + Incoming − Outgoing) ولا محرك forecast.

9) هل يوجد Safety Stock؟
لا حقل Safety Stock.
الأقرب: inventory.lowStockThreshold على المنتج — حد تنبيه «مخزون منخفض» في الواجهة/التقارير، وليس سياسة أمان مخزون مستقلة.

10) هل يوجد Reorder Level؟
لا حقل Reorder Level / نقطة إعادة الطلب.
ما يوجد بدائل جزئية:

lowStockThreshold (تنبيه انخفاض)
location.replenish (علم اقتراح تجديد للموقع)
مستندات replenishment يدوية
لا يوجد محرك reorder تلقائي عند الوصول لحد معيّن.

ملخص سريع
المفهوم	الحالة في النظام
On Hand
نعم (محسوب من مواقع داخلية)
رصيد الموقع
محفوظ في LocationStock
كمية المنتج
مرآة متزامنة
Reserved
لا (تخصيص طلبات فقط)
Available (الصافي)
لا
Incoming / Outgoing
لا ككميات
Forecast
لا
Safety Stock
لا (يوجد lowStockThreshold)
Reorder Level
لا
الخلاصة: النموذج الحالي رصيد موقع محفوظ + On Hand محسوب، مع تطبيق عند تصديق الحركات فقط. طبقات الحجز/التوقع/نقاط إعادة الطلب غير مبنية بعد.


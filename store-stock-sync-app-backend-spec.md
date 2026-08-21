# تطبيق «خصم المبيعات» (`store-stock-sync`) — مو spec للباك اند

## الهدف

تطبيق مستقل في كتالوج `applications` — **ليس نقطة بيع (POS)**.

يُمكّن موظف المستودع/المتجر من **خصم الكمية** من مواقع المستودع عبر  
`POST /inventory/stock/sale-deduct` حتى تتطابق الكميات مع **المتجر الإلكتروني**.

**الجمهور:**
- شركات **بدون** نقطة بيع في المنصة.
- شركات لديها **POS خارجي** ولا تريد POS المنصة.

**مستقبلاً:** تطبيق منفصل `pos` (كاشير حقيقي) — **لا تستخدم code `pos` لهذا التطبيق.**

---

## 1) سجل في `applications`

| الحقل | القيمة المقترحة |
|---|---|
| `code` | **`store-stock-sync`** (ثابت — لا `pos`) |
| `nameAr` | خصم المبيعات |
| `nameEn` | Store Stock Sync |
| `description` | خصم الكمية من مواقع المستودع لمزامنة المخزون مع المتجر — بدون دفع أو فواتير. |
| `icon` | `package-minus` (أو `shopping-bag`) |
| `routePath` | `/pos` |
| `sortOrder` | بعد `inventory` (مثلاً 36) |
| `isActive` | `true` |
| `permissionPrefix` | `store-stock-sync` (أو ربط بصلاحيات المخزون — انظر §4) |

مثال JSON للـ seed:

```json
{
  "code": "store-stock-sync",
  "nameAr": "خصم المبيعات",
  "nameEn": "Store Stock Sync",
  "description": "خصم الكمية من المستودع لمزامنة المخزون مع المتجر الإلكتروني.",
  "icon": "package-minus",
  "routePath": "/pos",
  "sortOrder": 36,
  "isActive": true
}
```

---

## 2) `company_applications`

- تطبيق **اختياري** لكل شركة (مثل `hr`, `inventory`) — **ليس** `isAlwaysEnabled`.
- يدعم `isEnabled` + `isVisible` مثل باقي التطبيقات.
- **لا** تربط ظهوره تلقائياً بتفعيل `inventory` فقط — يمكن تفعيله من System Owner ب independently.
- عملياً: APIs الخصم (`sale-deduct`) تتطلب مخزوناً مفعّلاً؛ يمكن فرض ذلك في الـ guard أو تركها للتشغيل.

---

## 3) Launcher — `GET /applications/launcher`

يُرجع البلاطة فقط عندما (نفس قواعد باقي التطبيقات):

1. التطبيق `active` عالمياً.
2. `isEnabled` + `isVisible` على شركة واحدة على الأقل للمستخدم.
3. المستخدم يملك **بادئة صلاحية** التطبيق.

**لا** تُرجع بلاطة `pos` قديمة من الـ seed — الفرونت توقف عن حقنها.

---

## 4) الصلاحيات

خياران (اختر واحداً):

**أ) بادئة مستقلة (مُفضّل للفصل عن POS المستقبلي):**

```
store-stock-sync.read
store-stock-sync.sale-deduct
```

**ب) إعادة استخدام صلاحيات المخزون الحالية:**

```
inv.stock.sale-deduct
inv.stock.read
```

يجب أن تتطابق مع ما يُفلتر به الـ launcher (`permissionPrefix` على `applications`).

---

## 5) `access-profile` / `enabledApplicationCodes`

عند تفعيل التطبيق للشركة، أضف **`store-stock-sync`** إلى:

```json
"enabledApplicationCodes": ["system", "inventory", "store-stock-sync", "..."]
```

**لا** تعتمد على alias `pos` في الإنتاج الجديد.  
(الفرونت يقبل `pos`/`cashier` مؤقتاً فقط أثناء migration.)

---

## 6) `homeConsole` (اختياري)

إذا أردت توجيه مستخدم بعد Login مباشرة لهذه الشاشة:

```json
"homeConsole": "store_stock_sync"
```

الفرونت يوجّه إلى `/pos`.

---

## 7) Migration

```sql
-- 1) INSERT application store-stock-sync (انظر §1)
-- 2) لكل company كانت تستخدم POS المحلي (أو تريد الميزة):
INSERT INTO company_applications (company_id, application_id, is_enabled, is_visible)
SELECT c.id, app.id, true, true
FROM companies c
CROSS JOIN applications app
WHERE app.code = 'store-stock-sync'
  AND /* شرطك: مثلاً companies لديها inventory مفعّل */;
```

إن وُجد سجل قديم `applications.code = 'pos'` في DB — **أعد تسميته** إلى `store-stock-sync` أو احذفه ولا تُرجعه في launcher.

---

## 8) تطبيق POS المستقبلي (للتخطيط فقط)

| | `store-stock-sync` (الآن) | `pos` (مستقبلاً) |
|---|---|---|
| `code` | `store-stock-sync` | `pos` |
| `routePath` | `/pos` | `/pos-cashier` (مثلاً) |
| الغرض | خصم مخزون ↔ متجر | كاشير كامل (دفع، فواتير، …) |

---

## 9) الفرونت (تم / يُنسّق معكم)

- إزالة حقن بلاطة `pos` من `enrichLauncherApplications`.
- `resolveApplicationLaunchPath('store-stock-sync')` → `/pos`.
- قبول legacy codes مؤقتاً في فحص التفعيل فقط.

**APIs المستخدمة (بدون تغيير):**

- `GET /inventory/stock` (قائمة سريعة، `posAvailable`)
- `POST /inventory/stock/sale-deduct`
- `POST /inventory/stock/sale-restore` (إن وُجد تراجع)

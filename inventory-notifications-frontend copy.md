# إشعارات المخازن — دليل الفرونت

دليل تكامل واجهة **المخازن** مع نظام الإشعارات. المخازن **مستقلة عن HR** — لا تعتمد على `hr_settings` ولا على inbox الموظف.

---

## 1) ملخص سريع

| السؤال | الجواب |
|---|---|
| أين تُخزَّن الإشعارات؟ | جداول Core مشتركة: `notifications`, `notification_recipients` |
| من يستقبل إشعارات المخازن؟ | **مستخدمون** (`user_id`) يحققون **صلاحية** `inv.notifications.read` **+** **نطاق الفرع** — وليس broadcast لكل الشركة |
| كيف أفعّل/أوقف الإشعارات؟ | `GET/PATCH /inventory/settings/company/:companyId` |
| كيف أعرض inbox المخازن؟ | `GET /notifications/inbox/user/:userId?category=inventory` |
| هل أحتاج HR مثبّتًا؟ | **لا** — تطبيق مخازن فقط يكفي |

---

## 2) الصلاحيات

| الصلاحية | الاستخدام |
|---|---|
| `inv.settings.read` | قراءة إعدادات المخازن |
| `inv.settings.update` | تعديل toggles الإشعارات |
| `inv.notifications.read` | صندوق الوارد + عدد غير المقروء **+** أهلية استلام إشعارات المخازن (مع نطاق الفرع) |
| `inv.notifications.update` | تعليم كمقروء / قراءة الكل |

> endpoints الـ inbox تقبل **`inv.notifications.*` أو `hr.notifications.*`** (أي منهما يكفي). في تطبيق مخازن فقط استخدم `inv.notifications.*`.

---

## 3) إعدادات الإشعارات

**Swagger tag:** `Inventory - Settings`

### GET `/inventory/settings/company/:companyId`

- **Permission:** `inv.settings.read`
- يُنشأ سجل افتراضي تلقائياً عند أول قراءة (كل الـ toggles مفعّلة ما عدا `notifySaleStockDeducted`).

**Response:**

```json
{
  "id": "uuid",
  "companyId": "uuid",
  "notificationsEnabled": true,
  "notifyLowStock": true,
  "notifyOutOfStock": true,
  "notifyNegativeStockBlocked": true,
  "notifyReceiptCompleted": true,
  "notifyIssueCompleted": true,
  "notifyTransferCompleted": true,
  "notifyAdjustmentPosted": true,
  "notifyPhysicalCountCompleted": true,
  "notifyScrapPosted": true,
  "notifyOperationUndone": true,
  "notifySaleStockDeducted": false,
  "createdAt": "2026-08-23T...",
  "updatedAt": "2026-08-23T...",
  "createdBy": null,
  "updatedBy": null
}
```

### PATCH `/inventory/settings/company/:companyId`

- **Permission:** `inv.settings.update`
- Body — كل الحقول **اختيارية**:

```json
{
  "notificationsEnabled": true,
  "notifyLowStock": true,
  "notifyOutOfStock": true,
  "notifyNegativeStockBlocked": true,
  "notifyReceiptCompleted": true,
  "notifyIssueCompleted": true,
  "notifyTransferCompleted": true,
  "notifyAdjustmentPosted": true,
  "notifyPhysicalCountCompleted": true,
  "notifyScrapPosted": true,
  "notifyOperationUndone": true,
  "notifySaleStockDeducted": false,
  "updatedBy": "user-uuid"
}
```

**سلوك:** إذا `notificationsEnabled = false` يُوقَف **كل** إشعارات المخازن بصمت (لا خطأ للمستخدم عند الحدث).

---

## 4) صندوق الوارد (Inbox) — مبني على `userId`

**Swagger tag:** `Core - Notifications`  
**Controller:** `src/modules/core-notifications/notifications.controller.ts`

> **مهم:** لا تستخدم `/notifications/inbox/:employeeId` لتطبيق مخازن مستقل. المستلمون يُخزَّنون في `notification_recipients.user_id`.

### قائمة الإشعارات

```
GET /notifications/inbox/user/:userId
```

**Permission:** `inv.notifications.read`

**Query params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `companyId` | uuid | — | فلترة حسب شركة |
| `category` | enum | — | استخدم `inventory` لعرض مخازن فقط |
| `unreadOnly` | boolean | false | غير المقروء فقط |
| `includeDismissed` | boolean | false | تضمين المُخفاة |
| `includeArchived` | boolean | false | تضمين المؤرشفة |
| `includeExpired` | boolean | false | تضمين المنتهية |
| `page` / `limit` | number | pagination | ترقيم |

**مثال:**

```
GET /notifications/inbox/user/{currentUserId}?category=inventory&companyId={companyId}&page=1&limit=20
```

### عدد غير المقروء (Badge)

```
GET /notifications/inbox/user/:userId/unread-count?companyId={companyId}
```

**Response:**

```json
{
  "userId": "uuid",
  "employeeId": null,
  "unread": 5,
  "byCategory": {
    "inventory": 5
  }
}
```

### تعليم كمقروء

```
POST /notifications/inbox/user/:userId/recipients/:recipientId/read
POST /notifications/inbox/user/:userId/mark-all-read?companyId=
```

**Permission:** `inv.notifications.update`

- `recipientId` = `InboxItemResponseDto.recipientId` (ليس `notificationId`).

### شكل عنصر Inbox

```typescript
interface InboxItemResponseDto {
  recipientId: string;       // للـ mark-read
  notificationId: string;
  companyId: string;
  companyNameAr: string;
  employeeId: string | null; // null لإشعارات المخازن
  userId: string | null;     // معرّف المستخدم المستلم
  employeeNameAr: string | null;
  employeeCode: string | null;
  category: 'inventory';
  severity: 'info' | 'success' | 'warning' | 'error';
  titleAr: string;
  bodyAr: string | null;
  sourceKind: string;        // مثل inventory_low_stock
  sourceTable: string | null;
  sourceId: string | null;
  actionUrl: string | null;
  requiresAcknowledgment: boolean; // false لمعظم إشعارات المخازن
  state: 'delivered' | 'read' | 'acknowledged' | 'dismissed' | 'archived';
  isRead: boolean;
  deliveredAt: string;
  readAt: string | null;
  createdAt: string;
  triggeredByUserId: string | null;  // من نفّذ العملية (اختياري للعرض في UI)
  triggeredByNameAr: string | null;
}
```

> **ملاحظة:** dismiss / archive / acknowledge متاحة حالياً عبر مسار `employeeId` فقط (لـ HR). إشعارات المخازن لا تحتاج acknowledge؛ للإخفاء يمكن الاعتماد على `mark-read` أو انتظار endpoints مستقبلية لـ user inbox.

---

## 5) التصنيف والأحداث

- **category:** `inventory`
- **severity → لون UI:** `info` أزرق، `success` أخضر، `warning` برتقالي، `error` أحمر

| sourceKind | الحدث | severity | toggle في الإعدادات |
|---|---|---|---|
| `inventory_low_stock` | مخزون منخفض | warning | `notifyLowStock` |
| `inventory_out_of_stock` | نفاد مخزون | error | `notifyOutOfStock` |
| `inventory_negative_stock_blocked` | صرف/بيع بدون رصيد | error | `notifyNegativeStockBlocked` |
| `inventory_receipt_completed` | ترحيل استلام | info | `notifyReceiptCompleted` |
| `inventory_issue_completed` | ترحيل صرف | info | `notifyIssueCompleted` |
| `inventory_transfer_completed` | ترحيل تحويل | info | `notifyTransferCompleted` |
| `inventory_adjustment_posted` | تسوية | info | `notifyAdjustmentPosted` |
| `inventory_physical_count_completed` | جرد | info | `notifyPhysicalCountCompleted` |
| `inventory_scrap_posted` | إتلاف | info | `notifyScrapPosted` |
| `inventory_operation_undone` | تراجع عن ترحيل | warning | `notifyOperationUndone` |
| `inventory_sale_stock_deducted` | خصم مخزون بيع | info | `notifySaleStockDeducted` (افتراضي: off) |

---

## 6) الجمهور (Audience) — من يستلم فعلياً؟

> **تحديث:** لم يعد الإرسال broadcast لكل مستخدمي الشركة. المنطق مطابق لصلاحيات ونطاق الفروع في API المخازن (`InventoryBranchScopeService`).

### القاعدة (شرطان معاً — AND)

| # | الشرط | المعنى للفرونت |
|---|---|---|
| **1** | صلاحية `inv.notifications.read` | من لا يملكها **لا يستلم** إشعاراً (ولا يرى inbox أصلاً) |
| **2** | نطاق الفرع | مستودع **بفرع** → `is_all_branches` **أو** عضوية نشطة في ذلك الفرع؛ مستودع **مركزي** (`branch_id` null) → `is_all_branches` **فقط** |

**مصادر منح الصلاحية (أيّها يكفي):**

- دور inventory نشط يتضمن `inv.notifications.read`
- `company_superuser` للشركة **+** تطبيق inventory **مفعّل** في `company_applications`
- overlay `ALLOW` في `user_permissions` (company-wide أو للفرع)

**DENY overlay** على الصلاحية يمنع الاستلام حتى مع دور أو superuser.

**`company_superuser` ≠ كل الفروع:** يمنح الصلاحية فقط؛ نطاق الفروع يأتي من `is_all_branches` على دور inventory أو من `user_branches`.

### حسب نوع الحدث

| نوع الحدث | `audienceKind` في DB | `branchIds` | من يستلم |
|---|---|---|---|
| حركة/تنبيه مرتبط بفرع | `branch` | `[branchId]` | مؤهلون للصلاحية **+** (كل الفروع **أو** عضو `user_branches` لذلك الفرع) |
| مستودع مركزي / بدون فرع | `company` | فارغ | مؤهلون للصلاحية **+** `is_all_branches` فقط — **ليس** كل الشركة |

> **`audienceKind=company` لا يعني «كل المستخدمين».** عند `branchIds` فارغ يُرمّز مستودعاً مركزياً؛ الجمهور = من يرى كل الفروع في API.

### المنفّذ (من نفّذ العملية)

- **يستلم الإشعار أيضاً** إن كان مؤهلاً — **لا** يُستبعد.
- `triggeredByUserId` في سجل الإشعار = للعرض/التدقيق فقط (مثل «نفّذها: أحمد»).

### Transfer بين فرعين

- حالياً: إشعار **فرع مستودع المصدر** فقط (سلوك backend حالي).

### لا تستخدم للفرونت

- **لا** `employee` / `department` — مخازن بدون HR inbox.
- **لا** تفترض أن كل من في `user_companies` يستلم.
- **لا** تفترض أن `audienceKind` وحده يحدد الجمهور — `branchIds` + الصلاحية + النطاق هما المعيار.

### أخطاء شائعة (ليست bugs)

| الملاحظة | التفسير |
|---|---|
| «المستخدم في الشركة ولم يستلم» | قد لا يملك `inv.notifications.read` أو ليس ضمن نطاق الفرع |
| «المنفّذ لم يُستبعد» | **مقصود** — يبقى في المستلمين |
| «مستودع مركزي — لم يصل لمدير الفرع» | **مقصود** — المركزي لمن `is_all_branches` فقط |
| «صفر مستلمين + warn في اللوج» | العملية المخزنية **تكمل**؛ الفلترة الدقيقة قد لا تجد أحدًا مؤهلاً |

---

## 7) Deep links (التنقل من الإشعار)

| sourceTable | صفحة مقترحة |
|---|---|
| `inventory_warehouse_operations` | تفاصيل حركة المستودع — `sourceId` = operation id |
| `inventory_products` | بطاقة المنتج — `sourceId` = product id |

استخدم `sourceKind` للأيقونة و`sourceTable` + `sourceId` للتوجيه.

---

## 8) متى تُطلق الإشعارات؟

| الحدث | المُشغِّل في الـ API |
|---|---|
| ترحيل حركة (`status → done`) | `PATCH /inventory/warehouse-operations/:id` |
| تراجع عن ترحيل | `POST /inventory/warehouse-operations/:id/undo` |
| مخزون منخفض / نفاد | بعد تحديث `quantityCache` (ledger أو بيع) |
| رفض صرف بيع | `POST /inventory/sale-stock/deduct` بدون رصيد |
| خصم بيع (اختياري) | بعد نجاح `sale-stock/deduct` |

الإرسال **best-effort** — فشل الإشعار (أو صفر مستلمين مؤهلين) **لا** يوقف العملية الأساسية؛ يُسجَّل تحذير في backend فقط.

---

## 9) UI مقترح

### صفحة إعدادات `/inventory/settings`

1. Master switch: `notificationsEnabled`
2. مجموعة **تنبيهات المخزون:** low / out / blocked
3. مجموعة **حركات المستودع:** receipt, issue, transfer, adjustment, count, scrap, undo
4. toggle منفصل: **خصم البيع** (`notifySaleStockDeducted` — افتراضي off)

### جرس الإشعارات

```typescript
// Badge
GET /notifications/inbox/user/${auth.userId}/unread-count?companyId=${companyId}
// → byCategory.inventory أو unread إذا فلترت category=inventory في القائمة

// القائمة
GET /notifications/inbox/user/${auth.userId}?category=inventory&companyId=${companyId}
```

### ERP Shell (تطبيقات متعددة)

- Tab **المخازن:** فلتر `category=inventory` + inbox بـ `userId`
- Tab **HR:** inbox بـ `employeeId` (إن وُجد employee link)
- لا تدمج toggles المخازن في شاشة HR settings

---

## 10) Checklist الفرونت

- [ ] شاشة إعدادات المخازن → `GET/PATCH /inventory/settings/company/:companyId`
- [ ] Bell icon → `inbox/user/:userId` + `category=inventory`
- [ ] Badge → `unread-count` (استخدم `byCategory.inventory`)
- [ ] Mark read → `recipientId` من الاستجابة
- [ ] Deep link → `sourceTable` + `sourceId`
- [ ] إخفاء قسم الإشعارات إذا تطبيق Inventory غير مفعّل للشركة
- [ ] **لا** تعتمد على `employeeId` في تطبيق مخازن فقط
- [ ] **لا** تفترض broadcast — inbox يظهر فقط لمن يملك `inv.notifications.read`
- [ ] (اختياري) عرض «نفّذها» من `triggeredByUserId` / `triggeredByNameAr` في بطاقة الإشعار

---

## 11) ملفات Backend مرجعية

| Topic | Path |
|---|---|
| Core inbox API | `src/modules/core-notifications/notifications.controller.ts` |
| Inventory dispatch | `src/modules/inventory/notifications/inventory-notification-dispatch.service.ts` |
| Audience (users) | `src/modules/inventory/notifications/inventory-notification-audience.resolver.ts` |
| Audience query (v2) | `src/modules/inventory/notifications/inventory-notification-audience.query.ts` |
| Policy (toggles) | `src/modules/inventory/settings/inventory-settings-notification.policy.ts` |
| Settings API | `src/modules/inventory/settings/inventory-settings.controller.ts` |
| Migration user_id | `src/core/database/migrations/1783373644674-notification-recipients-user-id.ts` |
| Migration indexes | `src/core/database/migrations/1783373644677-inventory-notification-audience-indexes.ts` |

---

*آخر تحديث: أغسطس 2026 — جمهور المخازن: صلاحية + نطاق فرع (بدون broadcast، المنفّذ يبقى مستلمًا).*

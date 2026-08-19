# System Owner — دليل الواجهة (Frontend)

> إدارة المنصة على مستوى الشركات والتطبيقات والمستخدمين الإداريين.  
> مسارات System Owner محمية بـ `userType = platform_admin` فقط — لا صلاحية شركة تصل إليها.

---

## الأدوار الثلاثة

| الدور | من هو | ماذا يرى |
|--------|--------|----------|
| **System Owner** | حساب `platform_admin` (منشئ النظام) | كل الشركات، تفعيل التطبيقات، تعيين Superuser، صندوق طلبات التفعيل |
| **Company Superuser** | مستخدمون تعيّنهم أنت داخل شركة (يمكن أكثر من واحد) | إدارة الشركة بدون قيود جهاز/OTP الجديدة؛ **لا** يصل لـ `/system-owner` |
| **Company User** | مستخدم عادي | التطبيقات والصلاحيات المفعّلة على شركته فقط |

---

## 1) لوحة System Owner — APIs

كلها: `Authorization: Bearer` + يجب أن يكون المستخدم `platform_admin`. غير ذلك → **403**.

### الشركات

| Method | Path | الوظيفة |
|--------|------|---------|
| GET | `/system-owner/companies` | قائمة كل الشركات |
| POST | `/system-owner/companies` | إنشاء شركة (يفعّل تطبيق `system` فقط افتراضيًا) |
| GET | `/system-owner/companies/:companyId` | تفاصيل |
| PATCH | `/system-owner/companies/:companyId` | تعديل |

### مستخدمو الشركة

| Method | Path | الوظيفة |
|--------|------|---------|
| GET | `/system-owner/companies/:companyId/users` | المستخدمون المرتبطون بالشركة |
| POST | `/system-owner/companies/:companyId/users` | إنشاء مستخدم شركة وربطه بها (اختياري: صاحب الشركة) |

```json
POST /system-owner/companies/{companyId}/users
{
  "email": "owner@acme.com",
  "fullNameAr": "محمد العلي",
  "password": "Str0ngP@ssw0rd!",
  "assignSuperuser": true
}
```

مالك النظام **لا** يسند أدواراً عبر `POST /users/:id/roles` وهو داخل `/system-owner`. إسناد الأدوار بعد ذلك من صاحب الشركة بعد دخوله.

تعيين Superuser لاحقاً يشترط أن يكون المستخدم **مربوطًا بالشركة أولًا** (`user_companies`).

---

## عقد الباك اند — صاحب الشركة المخوّل (مُنفَّذ)

هذا هو النموذج المعتمد. مالك النظام يجهّز الشركة والمستخدم المخوّل فقط. صاحب الشركة يدير شركته بنفسه.

### سبب الخطأ السابق (400)

الخطأ **لم يكن** في إنشاء المستخدم. مالك النظام كان يستدعي بعد ذلك `POST /users/:id/roles` من جلسته، وتلك الواجهة تتوقع عضوية في **شركة الجلسة**. مالك النظام غير مربوط بالشركة العميلة → `400 User is not linked to the selected company`. هذا متوقع: هو يدير المنصة، لا ERP الشركة.

الفرونت **لا يعيد** هذا السلوك: إنشاء المستخدم فقط عبر مسار System Owner، وإسناد الأدوار لاحقاً من صاحب الشركة بعد دخوله.

### التدفق الصحيح

1. `platform_admin` ينشئ شركة.
2. `platform_admin` ينشئ مستخدماً عادياً (`internal_employee` وليس `platform_admin`) عبر  
   `POST /system-owner/companies/:companyId/users` مع `assignSuperuser: true`.
3. ذلك المستخدم يسجّل دخوله ويستخدم APIs الشركة العادية (`/users`, `/roles`, `/permissions`, تطبيقات الشركة المفعّلة).
4. حساب مالك النظام **لا** يُضاف إلى `user_companies` لهذه الشركة و**لا** يُعيَّن Superuser.

### ما يفعله الباك عند `assignSuperuser: true`

في **نفس المعاملة**، على `companyId` الموجود في المسار (وليس شركة JWT):

1. ينشئ مستخدم شركة عادي (`internal_employee`) وليس `platform_admin`.
2. يربطه بـ `user_companies`.
3. يعيّنه Superuser (`isCompanySuperuser = true`).
4. يبذر دور **superadmin** لكل تطبيق **مفعّل** على الشركة ويسنده إليه.
5. إذا `isCompanySuperuser === true`: يتجاوز RBAC داخل شركته للتطبيقات المفعّلة، حتى لو لم تُسند أدوار إضافية بعد.

**عند تفعيل تطبيق لاحقاً** لصاحب الشركة: يُمنح صلاحيات ذلك التطبيق تلقائياً (بذر/إسناد superadmin أو ما يعادله).

### ماذا يعني «إدارة كاملة» لصاحب الشركة؟

داخل شركته فقط، وللتطبيقات **المفعّلة** عليها:

- إدارة المستخدمين وربطهم بالشركة
- إنشاء الأدوار وإسنادها وسحبها
- إدارة شجرة الصلاحيات
- طلب تفعيل التطبيقات ومتابعة كتالوج `company-apps`

لا يصل لـ `/system-owner/*`.

### ما يفعله الفرونت

- إنشاء المستخدم فقط عبر `POST /system-owner/companies/:companyId/users`  
  `{ email, fullNameAr, password, assignSuperuser }` — **بدون** متابعة `POST /users/:id/roles`.
- إذا `accessProfile.companies[].isCompanySuperuser === true`: `useCan()` و `usePageAccess()` يعتبران المستخدم مخوّلاً بكل شاشات الشركة (التطبيقات غير المفعّلة تبقى مخفية عبر `enabledApplicationCodes` والـ launcher).
- إسناد الأدوار للمستخدمين الآخرين: من شاشات النظام العادية بعد دخول صاحب الشركة.

### قواعد ثابتة

- `companyId` في مسار System Owner هو مصدر الحقيقة، لا شركة الجلسة.
- مالك النظام لا يُضاف للشركة ولا يأخذ أدوارها.
- `POST /users/:id/roles` مسار ERP — يعمل لصاحب الشركة لأنه مربوط بـ `user_companies`.

### تفعيل التطبيقات لكل شركة

| Method | Path | الوظيفة |
|--------|------|---------|
| GET | `/system-owner/companies/:companyId/applications` | كل التطبيقات + `isEnabled` |
| PATCH | `/system-owner/companies/:companyId/applications/:applicationId` | تفعيل / تعطيل |

```json
PATCH /system-owner/companies/{companyId}/applications/{applicationId}
{ "isEnabled": true, "notes": "عقد المخازن" }
```

لا يمكن تعطيل تطبيق `system`.

شركة جديدة: مفعّل لها **`system` فقط**. باقي التطبيقات تُفعَّل يدويًا أو عبر طلب العميل.

### Superusers (متعددون لكل شركة)

| Method | Path | الوظيفة |
|--------|------|---------|
| GET | `/system-owner/companies/:companyId/superusers` | القائمة |
| POST | `/system-owner/companies/:companyId/superusers` | تعيين |
| PATCH | `/system-owner/companies/:companyId/superusers/:userId` | تفعيل/إيقاف |

```json
POST /system-owner/companies/{companyId}/superusers
{ "userId": "<uuid>", "notes": "أساسي" }

PATCH /system-owner/companies/{companyId}/superusers/{userId}
{ "isActive": false }
```

### صندوق طلبات تفعيل التطبيقات

| Method | Path | الوظيفة |
|--------|------|---------|
| GET | `/system-owner/app-activation-requests?status=pending` | الوارد |
| POST | `/system-owner/app-activation-requests/:id/approve` | موافقة (يفعّل التطبيق) |
| POST | `/system-owner/app-activation-requests/:id/reject` | رفض |

```json
POST .../approve
{ "decisionNote": "تم التعاقد" }
```

---

## 2) تطبيق «تطبيقات الشركة» — ما يوفّره الباك للفرونت

هذا **تطبيق launcher مستقل** يظهر لصاحب الشركة (Superuser) حتى لو لم تُفعَّل باقي التطبيقات.

| حقل | قيمة |
|------|------|
| `code` | `company-apps` |
| `nameAr` | تطبيقات الشركة |
| `nameEn` | Company Apps |
| `icon` | `layout-grid` |
| `routePath` | `/company-apps` |
| صلاحيات RBAC | لا يحتاج. يظهر تلقائيًا إذا `isCompanySuperuser === true` |

### متى تعرض البلاطة؟

من `GET /applications/launcher`: إذا وُجد عنصر `code === "company-apps"` اعرضه.  
أو من `accessProfile.companies[current].isCompanySuperuser === true`.

مستخدم عادي **لا** يرى هذه البلاطة ولا التطبيقات غير المفعّلة.

### شاشة التطبيق — طلب واحد يكفي

```
GET /company-apps/{companyId}/catalog
Authorization: Bearer
```

لا تحتاج طلبًا ثانيًا لمعرفة الطلبات المعلّقة؛ كل تطبيق يحمل `pendingRequest` و `latestRequest`.

```json
{
  "companyId": "...",
  "isCompanySuperuser": true,
  "isSystemOwner": false,
  "canRequestActivation": true,
  "applications": [
    {
      "applicationId": "...",
      "code": "inventory",
      "nameAr": "المخازن",
      "nameEn": "Inventory",
      "description": "...",
      "icon": "warehouse",
      "routePath": "/inventory",
      "launchUrl": null,
      "sortOrder": 20,
      "isEnabled": false,
      "isAlwaysEnabled": false,
      "includeInMarketplace": true,
      "activationState": "available",
      "canRequestActivation": true,
      "canCancelPendingRequest": false,
      "pendingRequest": null,
      "latestRequest": null,
      "enabledAt": null,
      "disabledAt": null,
      "notes": null
    }
  ]
}
```

`activationState`:

| القيمة | المعنى | UI |
|--------|--------|-----|
| `always_on` | `system` / `company-apps` | مفعّل دائمًا — بدون زر طلب |
| `enabled` | فعّله System Owner | شارة «مفعّل» — يمكن فتح `routePath` |
| `pending` | طلب عند System Owner | شارة «بانتظار الموافقة» + إلغاء إن `canCancelPendingRequest` |
| `available` | غير مفعّل | زر «طلب تفعيل» إن `canRequestActivation` |

اعرض في الشبكة فقط `includeInMarketplace === true` حتى لا تظهر بلاطة «تطبيقات الشركة» داخل نفسها.

### طلب تفعيل → يصل لصاحب النظام

```
POST /company-apps/activation-requests
{
  "companyId": "<uuid>",
  "applicationId": "<uuid>",
  "message": "نحتاج المخازن لفرع الرياض"
}
```

يستقر فورًا في صندوق System Owner:

```
GET /system-owner/app-activation-requests?status=pending
POST /system-owner/app-activation-requests/:id/approve
POST /system-owner/app-activation-requests/:id/reject
```

بعد الموافقة: `isEnabled=true` ويظهر التطبيق في launcher لمن يملك صلاحياته.

### إلغاء طلب معلّق

```
POST /company-apps/activation-requests/:id/cancel
```

`id` من `pendingRequest.id`. بعدها `activationState` يعود `available`.

### سجل الطلبات (اختياري — الكتالوج يغني عنه)

```
GET /company-apps/{companyId}/activation-requests
```

حالات الطلب: `pending` | `approved` | `rejected` | `cancelled`.

---

## 3) ماذا يتغيّر عند تسجيل الدخول؟

`accessProfile` أصبح يتضمن:

```ts
{
  isSystemOwner: boolean,
  companies: [{
    isCompanySuperuser: boolean,
    enabledApplicationCodes: string[],  // e.g. ["system", "inventory"]
    permissions: string[],              // مفلترة حسب التطبيقات المفعّلة
    ...
  }]
}
```

### Launcher

`GET /applications/launcher` يرجع:

1. تطبيقات لها صلاحية لدى المستخدم، **و** مفعّلة على شركته  
2. **إضافة:** بلاطة `company-apps` لصاحب الشركة (Superuser) حتى بدون صلاحيات RBAC  

System Owner: لا يُقيَّد بتفعيل الشركة، وتُضاف له بلاطة الكتالوج أيضًا.

### صلاحيات الإسناد

```
GET /permissions?companyId=<uuid>
```

يرجع مجموعات صلاحيات **التطبيقات المفعّلة لتلك الشركة فقط**.  
استخدم `companyId` دائمًا في شاشة إسناد الأدوار/الصلاحيات.

### Superuser والجهاز

System Owner و Superuser **لا** يمرّون ببوابة سيريال الجهاز / إيميل الجهاز الجديد عند تسجيل الدخول.

يبقى ممنوعًا عليهم استخدام `/system-owner/*` إن لم يكونوا `platform_admin`.

---

## 4) إرشادات شاشات الفرونت

### أ) تطبيق System Owner (منفصل عن ERP الشركة)

- أخفِه عن كل مستخدم حيث `accessProfile.isSystemOwner !== true`.
- شاشات: شركات → مستخدمون → تطبيقات الشركة → Superusers → صندوق الطلبات.

### ب) ERP الشركة

- ابنِ قائمة العمل من `GET /applications/launcher`.
- لا تعرض بلاطات منتج غير مفعّل في الـ launcher (المخازن، HR، …).
- إذا وُجد `company-apps` في الـ launcher: افتح مسار `/company-apps` واطلب `GET /company-apps/{companyId}/catalog`.
- الشبكة داخل هذا التطبيق: `applications.filter(a => a.includeInMarketplace)`.
- الزر الوحيد لطلب التفعيل: `canRequestActivation`. لا تخمّن الحالة من `isEnabled` وحدها.

### ج) إسناد صلاحيات

- `GET /permissions?companyId=currentCompanyId`
- لا تعرض شجرة `inv.*` إذا المخازن غير مفعّلة.

---

## 5) ترحيل قاعدة البيانات

```
1783373644667-company-apps-and-superusers
1783373644668-company-apps-catalog-application
```

- 4667: الجداول الثلاثة + تفعيل كل التطبيقات الحالية للشركات الموجودة.
- 4668: يسجّل تطبيق `company-apps` ويفعّله (مع `system`) لكل الشركات.
- الشركات **الجديدة بعد الترقية** تحصل على `system` + `company-apps` فقط.

---

## 6) Checklist إطلاق

- [ ] تشغيل الـ migration
- [ ] التأكد أن حسابك `userType = platform_admin`
- [ ] تعيين Superuser أساسي + احتياطي لكل شركة
- [ ] تعطيل التطبيقات غير المتعاقد عليها للشركات الجديدة
- [ ] الفرونت: بلاطة `company-apps` + شاشة الكتالوج + صندوق طلبات System Owner

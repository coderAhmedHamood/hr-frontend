# أجهزة الدخول — إعدادات HR + موافقة الإدارة

لكل قناة (تطبيق / موقع) خياران بالترتيب: **إلزام السيريال** ثم **موافقة الإدارة** (لا تعمل إلا إذا كان الإلزام مفعّلاً).

**Migrations:**  
`1783373644660-mobile-serial-admin-approval.ts`  
`1783373644661-device-auth-channels.ts`  
`1783373644663-hr-settings-enforce-mobile-device-serial.ts`

بعد السحب: `npm run db:migrate`

سيريال التطبيق (`users.mobile_serial_number`) منفصل عن سيريال الويب (`users.web_device_serial`).  
أول ربط سيريال لكل قناة **لا** يمر بالموافقة ولا بالإيميل.

---

## واجهة إعدادات الموارد البشرية

اعرض **4 مفاتيح** بهذا الترتيب. عطّل مفتاح الموافقة إذا كان الإلزام فوقه `false`.

| الترتيب | الحقل API | التسمية المقترحة | افتراضي |
|--------|-----------|------------------|---------|
| 1 | `enforceMobileDeviceSerial` | إلزام سيريال جهاز على دخول التطبيق | `true` |
| 2 | `requireAdminApprovalForNewMobileDevice` | موافقة الإدارة لجهاز تطبيق جديد | `false` |
| 3 | `enforceWebDeviceSerial` | إلزام سيريال جهاز على دخول الموقع | `false` |
| 4 | `requireAdminApprovalForNewWebDevice` | موافقة الإدارة لجهاز موقع جديد | `false` |

### نصوص الواجهة

**1 — إلزام سيريال جهاز على دخول التطبيق**  
- مفعّل: دخول التطبيق يلزم `mobileSerialNumber`. إذا اختلف عن المخزّن → إيميل تفعيل (أو موافقة إدارة إن فُعّل الخيار 2).  
- غير مفعّل: دخول التطبيق بدون فحص جهاز و**بدون إيميل**.

**2 — موافقة الإدارة لجهاز تطبيق جديد**  
- يظهر/يُفعّل فقط إذا الخيار 1 مفعّل.  
- مفعّل: جهاز جديد ينتظر موافقة الإدارة ثم يُرسل الإيميل.  
- غير مفعّل (مع الخيار 1 مفعّل): إيميل التفعيل مباشرة.

**3 — إلزام سيريال جهاز على دخول الموقع**  
- مفعّل: دخول الويب يلزم بصمة/سيريال (`mobileSerialNumber`). إذا اختلف عن المخزّن → إيميل تفعيل (أو موافقة إدارة إن فُعّل الخيار 4).  
- غير مفعّل: دخول لوحة الإدارة بدون سيريال، و**بدون إيميل**.

**4 — موافقة الإدارة لجهاز موقع جديد**  
- يظهر/يُفعّل فقط إذا الخيار 3 مفعّل.  
- مفعّل: جهاز ويب جديد ينتظر موافقة الإدارة ثم يُرسل الإيميل.  
- غير مفعّل (مع الخيار 3 مفعّل): إيميل التفعيل مباشرة.

### قواعد الفرونت

```
الخيار 2 disabled = !enforceMobileDeviceSerial
الخيار 4 disabled = !enforceWebDeviceSerial
```

عند إطفاء الخيار 1 أرسل أيضاً `requireAdminApprovalForNewMobileDevice: false`.  
عند إطفاء الخيار 3 أرسل أيضاً `requireAdminApprovalForNewWebDevice: false`.  
الـ API يصفّر الموافقة تلقائياً إذا أُطفئ الإلزام.

### PATCH

`PATCH /hr/settings/company/:companyId`

```json
{
  "enforceMobileDeviceSerial": true,
  "requireAdminApprovalForNewMobileDevice": true,
  "enforceWebDeviceSerial": true,
  "requireAdminApprovalForNewWebDevice": true
}
```

مثال: إلزام الموقع + إيميل فقط (بدون موافقة إدارة):

```json
{
  "enforceWebDeviceSerial": true,
  "requireAdminApprovalForNewWebDevice": false
}
```

---

## ماذا يحدث عند الدخول؟

| الإلزام | موافقة الإدارة | سيريال مختلف عن المخزّن |
|---------|----------------|-------------------------|
| `false` | يُتجاهل | دخول ناجح — لا إيميل |
| `true` | `false` | `403` `MOBILE_SERIAL_VERIFICATION_REQUIRED` + إيميل OTP/رابط |
| `true` | `true` | `403` `MOBILE_SERIAL_ADMIN_APPROVAL_REQUIRED` — الإيميل بعد موافقة الإدارة |
| `true` | أي | نفس السيريال → دخول ناجح |
| `true` | أي | أول سيريال للقناة → يُربط فوراً بدون إيميل/موافقة |

إذا الإلزام `true` ولم يُرسل `mobileSerialNumber` → `400`.

---

## أمثلة `POST /auth/login`

### تطبيق — مع تفعيل الإلزام

```json
{
  "email": "…",
  "password": "…",
  "loginChannel": "app",
  "mobileSerialNumber": "DEVICE-APP-1"
}
```

### موقع — لوحة الإدارة (`enforceWebDeviceSerial=false`)

```json
{
  "email": "…",
  "password": "…",
  "loginChannel": "web"
}
```

### موقع — مع تفعيل الإلزام (بصمة المتصفح)

```json
{
  "email": "…",
  "password": "…",
  "loginChannel": "web",
  "mobileSerialNumber": "BROWSER-FINGERPRINT-1"
}
```

### جهاز جديد + موافقة إدارة → `403`

```json
{
  "code": "MOBILE_SERIAL_ADMIN_APPROVAL_REQUIRED",
  "approvalRequestId": "…",
  "loginChannel": "app",
  "mobileSerialChangeEmailSent": false
}
```

`loginChannel` في الخطأ: `app` أو `web`.  
بدون موافقة إدارة (إلزام فقط): `MOBILE_SERIAL_VERIFICATION_REQUIRED`.

---

## إدارة الطلبات — JWT

**Base:** `/system/mobile-serial-approvals`  
صلاحيات: قائمة `system.users.read` · موافقة/رفض `system.users.update`

| Method | Path |
|--------|------|
| `GET /?companyId=&status=pending&loginChannel=app` | قائمة (`loginChannel=app\|web`) |
| `POST /:id/approve` | موافقة → إيميل التفعيل |
| `POST /:id/reject` | رفض |

```json
{
  "id": "…",
  "loginChannel": "app",
  "userFullNameAr": "…",
  "userFullNameEn": "…",
  "userEmail": "…",
  "userPhone": "…",
  "previousSerialNumber": "aaA18B2C8853D465454645E5F6",
  "pendingSerialNumber": "NEW-DEVICE-SERIAL",
  "oldMobileSerialNumber": "aaA18B2C8853D465454645E5F6",
  "newMobileSerialNumber": "NEW-DEVICE-SERIAL",
  "status": "pending"
}
```

| الحقل | المعنى |
|--------|--------|
| `previousSerialNumber` / `oldMobileSerialNumber` | الرقم القديم (الجهاز المربوط حالياً) |
| `pendingSerialNumber` / `newMobileSerialNumber` | الرقم الجديد المطلوب تفعيله |

بعد الموافقة يكمل المستخدم التفعيل عبر OTP / الرابط.

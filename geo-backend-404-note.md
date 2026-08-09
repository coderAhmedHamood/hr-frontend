# Geo backend 404 — تم الإصلاح

عند `PATCH /geo/company-countries/:id` مع `{ showInStore }` الباكند يزامِن كتالوج الدولة + المدن/الأحياء بـ **bulk update** ولا يفشل إن نقص أبناء.

الفرونت يعتمد على هذا السلوك: تفعيل الدولة فقط عبر `company-countries` دون cascade يدوي على `/geo/cities` أو `/geo/districts`.

راجع: `geo-locations-frontend copy.md` §0.

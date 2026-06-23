# دليل نشر الفرونت — Next.js + Docker + Traefik (مطابق للباكند)

## 1) الهدف

| الخدمة | الدومين | المنفذ داخل الـ container |
|--------|---------|---------------------------|
| API (الباكند) | `https://api.jgrabaya.com` | 3000 |
| الفرونت (Next.js standalone) | `https://portal.jgrabaya.com` | **3001** |

- Traefik **واحد** على السيرفر (لا تشغّل Traefik ثانياً من مشروع الفرونت).
- **لا** تفتح منافذ `80:80` أو `443:443` على container الفرونت.
- **لا Nginx** — Traefik يتولى HTTPS والتوجيه؛ Next.js يعمل مباشرة عبر `node server.js`.
- SSL موثوق عبر Let's Encrypt على Traefik الموجود (`certresolver=letsencrypt`).
- Traefik >= v3.6.1 (مثلاً v3.6.2) إذا Docker Engine 29+.

## 2) DNS

```
portal.jgrabaya.com  → A → IP السيرفر
api.jgrabaya.com     → A → IP السيرفر   (الباكند)
```

## 3) متغيرات البيئة

انسخ `.env.production.example` إلى `.env.production` وعدّل عند الحاجة:

```env
FRONTEND_DOMAIN=portal.jgrabaya.com
NEXT_PUBLIC_API_URL=https://api.jgrabaya.com
BACKEND_URL=https://api.jgrabaya.com
TRAEFIK_NETWORK=traefik
TRAEFIK_CERT_RESOLVER=letsencrypt
```

في الباكند `.env.production` (تأكد من CORS):

```env
CORS_ORIGINS=https://portal.jgrabaya.com
```

## 4) Dockerfile (Next.js standalone — بدون Nginx)

المشروع يستخدم `output: 'standalone'` في `next.config.mjs`:

- البناء: `npm run build`
- التشغيل: `node server.js` على المنفذ **3001**
- لا حاجة لـ `nginx.conf`

متغيرات البناء المهمة في `Dockerfile`:

| ARG | الإنتاج |
|-----|---------|
| `NEXT_PUBLIC_API_URL` | `https://api.jgrabaya.com` |
| `BACKEND_URL` | `https://api.jgrabaya.com` (لـ rewrite `/api-backend` في SSR) |

## 5) docker-compose.prod.yml

الملف `docker-compose.prod.yml` جاهز في المستودع:

- Container: `hr-frontend-web`
- Traefik routers: `portal` (ليس `api`)
- لا `ports` على الـ host
- الشبكة: `traefik` (external)

## 6) سكربتات package.json

```bash
npm run docker:prod:up      # بناء وتشغيل الإنتاج
npm run docker:prod:down    # إيقاف
npm run docker:prod:logs    # سجلات
```

تطوير محلي مع Docker (منفذ 3001):

```bash
docker compose up -d --build
```

## 7) خطوات النشر على السيرفر

```bash
# 1) Traefik يعمل مسبقاً (من الباكند أو compose منفصل)
docker ps | grep traefik

# 2) شبكة traefik
docker network create traefik   # إن لم تكن موجودة

# 3) الفرونت
cd ~/hr-frontend   # أو مسار المستودع
cp .env.production.example .env.production
# عدّل NEXT_PUBLIC_API_URL و FRONTEND_DOMAIN إن لزم

npm run docker:prod:up

# 4) تأكد من الاتصال بالشبكة
docker network connect traefik hr-frontend-web 2>/dev/null || true

# 5) تحقق
curl -I https://portal.jgrabaya.com
curl -I https://api.jgrabaya.com
```

## 8) ربط الفرونت بالـ API

| البيئة | المتغير | القيمة |
|--------|---------|--------|
| Production | `NEXT_PUBLIC_API_URL` | `https://api.jgrabaya.com` |
| Development | `.env.local` | `/api-backend` (rewrite إلى `localhost:3000`) |

في الكود (`src/shared/config/index.ts`):

```ts
apiUrl: process.env.NEXT_PUBLIC_API_URL ?? '/api-backend'
```

**مهم:** `NEXT_PUBLIC_*` يُضبط **وقت البناء** (`docker build`). أي تغيير للدومين يتطلب:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

## 9) Traefik — Let's Encrypt (مرة واحدة على السيرفر)

```yaml
certificatesResolvers:
  letsencrypt:
    acme:
      email: roseebaya2030@gmail.com
      storage: /etc/traefik/acme/acme.json
      httpChallenge:
        entryPoint: web
```

يجب أن يطابق `TRAEFIK_CERT_RESOLVER=letsencrypt` في compose الفرونت والباكند.

## 10) أخطاء شائعة

| الخطأ | السبب | الحل |
|-------|--------|------|
| `port 80 already in use` | Traefik ثانٍ | لا تشغّل Traefik من الفرونت |
| `client version 1.24 is too old` | Traefik قديم + Docker 29 | ترقية Traefik إلى v3.6.2 |
| `network traefik not found` | الشبكة غير منشأة | `docker network create traefik` |
| CORS error | الباكند لا يسمح بالدومين | أضف `https://portal.jgrabaya.com` في `CORS_ORIGINS` |
| API خاطئ | build بدون URL صحيح | مرّر `NEXT_PUBLIC_API_URL` في `build.args` |
| 502 على الدومين | container ليس على شبكة traefik | `docker network connect traefik hr-frontend-web` |

## 11) معايير القبول (Checklist)

- [ ] `https://portal.jgrabaya.com` يفتح بدون تحذير SSL
- [ ] `https://api.jgrabaya.com` يعمل منفصلاً
- [ ] تسجيل الدخول والطلبات تذهب إلى `api.jgrabaya.com`
- [ ] لا منافذ 80/443 على container الفرونت (`docker ps` — Ports فارغ)
- [ ] `hr-frontend-web` على شبكة `traefik`
- [ ] Traefik logs بدون أخطاء Docker API

## 12) الفرق بين الباكند والفرونت

| | الباكند | الفرونت |
|---|---------|---------|
| Container | `hr-backend-api` | `hr-frontend-web` |
| Traefik router | `api` | `portal` |
| Host rule | `api.jgrabaya.com` | `portal.jgrabaya.com` |
| Port داخلي | 3000 | 3001 (Next.js) |
| Traefik container | مرة واحدة على السيرفر | لا |

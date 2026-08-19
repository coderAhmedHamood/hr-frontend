import { NextRequest, NextResponse } from 'next/server';

/**
 * Storefront review create proxy.
 *
 * 1) Tries public POST `/public/store/products/:productId/reviews` when the backend adds it.
 * 2) Falls back to staff `POST /inventory/product-reviews` using:
 *    - `STORE_PRODUCT_REVIEWS_CREATE_TOKEN`, or
 *    - staff `access_token` cookie (same-origin admin login).
 */

function backendBaseUrl(): string {
  return (process.env.BACKEND_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
}

type CreateBody = {
  companyId?: string;
  productId?: string;
  rating?: number;
  title?: string | null;
  body?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  partnerId?: string | null;
};

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback;
  const record = payload as { message?: string | string[] };
  if (Array.isArray(record.message)) return record.message.join(' · ') || fallback;
  if (typeof record.message === 'string' && record.message.trim()) return record.message;
  return fallback;
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as { status?: number; data?: T; error?: unknown };
  if (
    typeof record.status === 'number' &&
    record.status >= 200 &&
    record.status < 300 &&
    record.data != null
  ) {
    return record.data;
  }
  return payload as T;
}

/** Staff JWT only — never the partner storefront bearer. */
function resolveStaffCreateToken(request: NextRequest): string | null {
  const fromEnv = process.env.STORE_PRODUCT_REVIEWS_CREATE_TOKEN?.trim();
  if (fromEnv) return fromEnv;

  const fromCookie = request.cookies.get('access_token')?.value?.trim();
  if (fromCookie) {
    try {
      return decodeURIComponent(fromCookie);
    } catch {
      return fromCookie;
    }
  }

  const cookieHeader = request.headers.get('cookie') ?? '';
  const match = cookieHeader.match(/(?:^|;\s*)access_token=([^;]*)/);
  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  let input: CreateBody;
  try {
    input = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const companyId = typeof input.companyId === 'string' ? input.companyId.trim() : '';
  const productId = typeof input.productId === 'string' ? input.productId.trim() : '';
  const rating = Number(input.rating);
  const guestName = typeof input.guestName === 'string' ? input.guestName.trim() : '';
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const body = typeof input.body === 'string' ? input.body.trim() : '';
  const guestEmail = typeof input.guestEmail === 'string' ? input.guestEmail.trim() : '';
  const guestPhone = typeof input.guestPhone === 'string' ? input.guestPhone.trim() : '';
  const partnerId = typeof input.partnerId === 'string' ? input.partnerId.trim() : '';

  if (!companyId || !productId) {
    return NextResponse.json({ message: 'companyId and productId are required' }, { status: 400 });
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ message: 'rating must be between 1 and 5' }, { status: 400 });
  }
  if (!partnerId && !guestName) {
    return NextResponse.json({ message: 'guestName is required for guest reviews' }, { status: 400 });
  }

  const partnerAuth = request.headers.get('authorization');
  const publicPayload = {
    companyId,
    rating: Math.round(rating),
    title: title || null,
    body: body || null,
    guestName: guestName || null,
    guestEmail: guestEmail || null,
    guestPhone: guestPhone || null,
    ...(partnerId ? { partnerId } : {}),
  };

  // 1) Public store endpoint (preferred when backend supports it)
  try {
    const publicRes = await fetch(
      `${backendBaseUrl()}/public/store/products/${encodeURIComponent(productId)}/reviews`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(partnerAuth ? { Authorization: partnerAuth } : {}),
        },
        body: JSON.stringify(publicPayload),
        cache: 'no-store',
      },
    );

    if (publicRes.ok) {
      const payload = await parseJson(publicRes);
      return NextResponse.json(
        { data: unwrapData(payload) ?? payload, pendingModeration: false },
        { status: publicRes.status === 201 ? 201 : 200 },
      );
    }

    if (publicRes.status !== 404 && publicRes.status !== 405) {
      const payload = await parseJson(publicRes);
      return NextResponse.json(
        { message: extractErrorMessage(payload, `HTTP ${publicRes.status}`) },
        { status: publicRes.status },
      );
    }
  } catch {
    // Backend down / unreachable — try staff fallback below.
  }

  // 2) Staff token fallback → inventory create (approved so it appears on public GET)
  const staffToken = resolveStaffCreateToken(request);
  if (!staffToken) {
    return NextResponse.json(
      {
        message:
          'لا يمكن إرسال التقييم حالياً. سجّل دخول الموظف في لوحة النظام (نفس المتصفح)، أو أضف STORE_PRODUCT_REVIEWS_CREATE_TOKEN في .env ثم أعد تشغيل Next.',
        code: 'STORE_REVIEW_CREATE_UNAVAILABLE',
      },
      { status: 503 },
    );
  }

  let inventoryRes: Response;
  try {
    inventoryRes = await fetch(`${backendBaseUrl()}/inventory/product-reviews`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({
        productId,
        partnerId: partnerId || null,
        rating: Math.round(rating),
        title: title || null,
        body: body || null,
        status: 'approved',
        guestName: guestName || null,
        guestEmail: guestEmail || null,
        guestPhone: guestPhone || null,
      }),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      {
        message: 'تعذر الاتصال بالباكند. تأكد أن الخادم يعمل على BACKEND_URL.',
        code: 'STORE_REVIEW_BACKEND_UNREACHABLE',
      },
      { status: 503 },
    );
  }

  const inventoryPayload = await parseJson(inventoryRes);
  if (!inventoryRes.ok) {
    const message = extractErrorMessage(inventoryPayload, `HTTP ${inventoryRes.status}`);
    if (inventoryRes.status === 401 || inventoryRes.status === 403) {
      return NextResponse.json(
        {
          message:
            'توكن الموظف غير صالح أو بلا صلاحية inv.catalog.product-reviews.create. أعد تسجيل الدخول أو عيّن STORE_PRODUCT_REVIEWS_CREATE_TOKEN.',
          code: 'STORE_REVIEW_STAFF_FORBIDDEN',
          detail: message,
        },
        { status: inventoryRes.status },
      );
    }
    return NextResponse.json({ message }, { status: inventoryRes.status });
  }

  return NextResponse.json(
    {
      data: unwrapData(inventoryPayload) ?? inventoryPayload,
      pendingModeration: false,
    },
    { status: 201 },
  );
}

import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import {
  PartnerAuthApiError,
  type PartnerAuthSessionPayload,
  type PartnerLoginInput,
  type PartnerMePayload,
  type PartnerRegisterInput,
} from '@/features/ecommerce/storefront/domain/partner-auth';
import { resolveApiBaseUrl } from '@/shared/api-base-url';
import { publicConfig } from '@/shared/config';
import { unwrapApiEnvelope } from '@/features/ecommerce/storefront/lib/api/store-http';

/**
 * Partner auth per `store-frontend-endpoints.md` §4.
 * Default on. Set `NEXT_PUBLIC_PARTNER_AUTH_HTTP=false` for local mock only.
 */
function useHttp(): boolean {
  return process.env.NEXT_PUBLIC_PARTNER_AUTH_HTTP !== 'false';
}

function apiBaseUrl(): string {
  return resolveApiBaseUrl(publicConfig.apiUrl).replace(/\/$/, '');
}

async function parseError(response: Response): Promise<PartnerAuthApiError> {
  let message = 'Request failed';
  let code: string | undefined;
  try {
    const body = (await response.json()) as {
      message?: string | string[];
      code?: string;
      error?: { message?: string; code?: string };
    };
    if (Array.isArray(body.message)) message = body.message.join(' · ');
    else if (typeof body.message === 'string' && body.message.trim()) message = body.message;
    else if (typeof body.error?.message === 'string') message = body.error.message;
    code = body.code ?? body.error?.code;
  } catch {
    /* ignore */
  }
  return new PartnerAuthApiError(message, response.status, code);
}

async function partnerAuthFetch<T>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (init.token) {
    headers.set('Authorization', `Bearer ${init.token}`);
  }

  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return undefined as T;

  const payload = (await response.json()) as unknown;
  const data = unwrapApiEnvelope<T>(payload);
  if (data == null) {
    throw new PartnerAuthApiError('Empty partner auth response', response.status);
  }
  return data;
}

type PartnerMeApiDto = {
  userId: string;
  partnerId: string;
  companyId: string;
  email?: string | null;
  phone?: string | null;
  fullNameAr?: string | null;
  userType?: string | null;
  partnerName?: string | null;
  displayName?: string | null;
  partnerStatus?: string | null;
  isCustomer?: boolean;
  isVendor?: boolean;
  partnerEmail?: string | null;
  partnerMobile?: string | null;
  /** Legacy nested shape (if backend still returns it). */
  user?: PartnerAuthSessionPayload['user'];
  partner?: PartnerAuthSessionPayload['partner'];
};

function mapMePayload(dto: PartnerMeApiDto): PartnerMePayload {
  if (dto.user && dto.partner) {
    return {
      userId: dto.userId,
      partnerId: dto.partnerId,
      companyId: dto.companyId,
      user: dto.user,
      partner: dto.partner,
    };
  }

  return {
    userId: dto.userId,
    partnerId: dto.partnerId,
    companyId: dto.companyId,
    user: {
      id: dto.userId,
      email: dto.email ?? '',
      phone: dto.phone ?? '',
      fullNameAr: dto.fullNameAr ?? dto.displayName ?? dto.partnerName ?? '',
      userType: dto.userType ?? 'customer',
    },
    partner: {
      id: dto.partnerId,
      name: dto.partnerName ?? dto.displayName ?? '',
      displayName: dto.displayName ?? dto.partnerName ?? '',
      isCustomer: dto.isCustomer ?? true,
      isVendor: dto.isVendor ?? false,
      email: dto.partnerEmail ?? dto.email ?? '',
      mobile: dto.partnerMobile ?? dto.phone ?? '',
    },
  };
}

/* ── Mock (UI prep / offline demo) ───────────────────────────────────────── */

type MockAccount = {
  password: string;
  session: PartnerAuthSessionPayload;
};

const globalForPartnerAuth = globalThis as typeof globalThis & {
  __storefrontPartnerAuthAccounts?: Map<string, MockAccount>;
};

function mockStore(): Map<string, MockAccount> {
  if (!globalForPartnerAuth.__storefrontPartnerAuthAccounts) {
    globalForPartnerAuth.__storefrontPartnerAuthAccounts = new Map();
  }
  return globalForPartnerAuth.__storefrontPartnerAuthAccounts;
}

function keyFor(companyId: string, identifier: string): string {
  return `${companyId}::${identifier.trim().toLowerCase()}`;
}

function buildMockSession(
  input: Pick<PartnerRegisterInput, 'companyId' | 'name' | 'email' | 'mobile' | 'accountKind'>,
): PartnerAuthSessionPayload {
  const userId = crypto.randomUUID();
  const partnerId = crypto.randomUUID();
  const isCustomer = input.accountKind === 'customer';
  const isVendor = input.accountKind === 'vendor';

  return {
    access_token: `mock-partner.${userId}`,
    userId,
    partnerId,
    companyId: input.companyId,
    user: {
      id: userId,
      email: input.email.trim(),
      phone: input.mobile.trim(),
      fullNameAr: input.name.trim(),
      userType: input.accountKind,
    },
    partner: {
      id: partnerId,
      name: input.name.trim(),
      displayName: input.name.trim(),
      isCustomer,
      isVendor,
      email: input.email.trim(),
      mobile: input.mobile.trim(),
    },
    message: 'تم إنشاء الحساب وتسجيل الدخول بنجاح.',
  };
}

async function mockRegister(input: PartnerRegisterInput): Promise<PartnerAuthSessionPayload> {
  await delay(350);
  const emailKey = keyFor(input.companyId, input.email);
  const mobileKey = keyFor(input.companyId, input.mobile);
  if (mockStore().has(emailKey) || mockStore().has(mobileKey)) {
    throw new PartnerAuthApiError('يوجد حساب مسجّل بهذا البريد أو الجوال مسبقاً.', 409);
  }
  if (input.name.trim().length < 2) {
    throw new PartnerAuthApiError('الاسم يجب أن يكون حرفين على الأقل.', 400);
  }
  if (input.password.length < 6) {
    throw new PartnerAuthApiError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.', 400);
  }

  const session = buildMockSession(input);
  const account = { password: input.password, session };
  mockStore().set(emailKey, account);
  mockStore().set(mobileKey, account);
  return session;
}

async function mockLogin(input: PartnerLoginInput): Promise<PartnerAuthSessionPayload> {
  await delay(350);
  const companyId = input.companyId || getStorefrontCompanyId();
  const account = mockStore().get(keyFor(companyId, input.identifier));
  if (!account || account.password !== input.password) {
    throw new PartnerAuthApiError('الإيميل/الجوال أو كلمة المرور غير صحيحة', 401, 'INVALID_CREDENTIALS');
  }
  return {
    ...account.session,
    access_token: `mock-partner.${account.session.userId}.${Date.now()}`,
    message: 'تم تسجيل الدخول بنجاح.',
  };
}

async function mockMe(token: string): Promise<PartnerMePayload> {
  await delay(200);
  for (const account of mockStore().values()) {
    if (token.startsWith(`mock-partner.${account.session.userId}`)) {
      return {
        user: account.session.user,
        partner: account.session.partner,
        companyId: account.session.companyId,
        userId: account.session.userId,
        partnerId: account.session.partnerId,
      };
    }
  }
  throw new PartnerAuthApiError('الجلسة غير صالحة أو منتهية.', 401, 'UNAUTHORIZED');
}

async function mockLogout(_token: string): Promise<void> {
  await delay(150);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ── Public API ──────────────────────────────────────────────────────────── */

export async function registerPartner(
  input: PartnerRegisterInput,
): Promise<PartnerAuthSessionPayload> {
  if (!useHttp()) return mockRegister(input);
  return partnerAuthFetch<PartnerAuthSessionPayload>('/public/partners/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function loginPartner(input: PartnerLoginInput): Promise<PartnerAuthSessionPayload> {
  if (!useHttp()) return mockLogin(input);
  return partnerAuthFetch<PartnerAuthSessionPayload>('/public/partners/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier: input.identifier,
      password: input.password,
      ...(input.companyId ? { companyId: input.companyId } : {}),
    }),
  });
}

export async function getPartnerMe(token: string): Promise<PartnerMePayload> {
  if (!useHttp()) return mockMe(token);
  const dto = await partnerAuthFetch<PartnerMeApiDto>('/public/partners/auth/me', {
    method: 'GET',
    token,
  });
  return mapMePayload(dto);
}

export async function logoutPartner(token: string): Promise<void> {
  if (!useHttp()) return mockLogout(token);
  await partnerAuthFetch<{ success: boolean; message: string }>('/public/partners/auth/logout', {
    method: 'POST',
    token,
  });
}

export function isPartnerAuthHttpEnabled(): boolean {
  return useHttp();
}

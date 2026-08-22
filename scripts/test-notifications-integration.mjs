/**
 * Integration smoke test for inventory / store / contacts notifications.
 * Usage: node scripts/test-notifications-integration.mjs [email] [password]
 */
const BASE = process.env.BACKEND_URL ?? 'http://localhost:3000';
const EMAIL = process.argv[2] ?? process.env.SYSTEM_ADMIN_EMAIL ?? 'admin@test.com';
const PASSWORD = process.argv[3] ?? process.env.SYSTEM_ADMIN_PASSWORD ?? 'Admin123!';

/** @typedef {{ name: string; ok: boolean; status?: number; detail?: string; data?: unknown }} Result */

/** @type {Result[]} */
const results = [];

function pass(name, extra = {}) {
  results.push({ name, ok: true, ...extra });
  console.log(`✅ ${name}`);
}

function fail(name, detail, extra = {}) {
  results.push({ name, ok: false, detail, ...extra });
  console.log(`❌ ${name} — ${detail}`);
}

async function request(path, { method = 'GET', token, body, query } = {}) {
  const url = new URL(path, BASE);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  const text = await res.text();
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  const data = payload?.data ?? payload;
  return { status: res.status, ok: res.ok, payload, data };
}

async function main() {
  console.log(`\n🔔 Notifications integration test → ${BASE}\n`);

  // ── Login ──
  let token = '';
  let userId = '';
  let companyId = '';

  try {
    const login = await request('/auth/login', {
      method: 'POST',
      body: {
        email: EMAIL,
        password: PASSWORD,
        loginChannel: 'web',
        mobileSerialNumber: 'notifications-test-script',
      },
    });

    if (!login.ok) {
      fail('auth.login', `HTTP ${login.status}: ${JSON.stringify(login.payload)?.slice(0, 200)}`, {
        status: login.status,
      });
      printSummary();
      process.exit(1);
    }

    token = login.data?.access_token ?? login.payload?.access_token ?? '';
    userId = login.data?.userId ?? login.data?.user?.id ?? '';
    companyId =
      login.data?.accessProfile?.defaultCompanyId ??
      login.data?.accessProfile?.companies?.[0]?.id ??
      '';

    if (!token || !userId) {
      fail('auth.login', 'Missing token or userId in response');
    } else {
      pass('auth.login', { data: { userId, companyId: companyId || '(none)' } });
    }
  } catch (e) {
    fail('auth.login', (e).message);
    printSummary();
    process.exit(1);
  }

  if (!companyId) {
    try {
      const profile = await request('/auth/access-profile', {
        method: 'POST',
        token,
        body: { userId },
      });
      companyId =
        profile.data?.defaultCompanyId ?? profile.data?.companies?.[0]?.id ?? '';
      if (companyId) {
        pass('auth.access-profile.companyId', { data: { companyId } });
      } else {
        fail('auth.access-profile.companyId', 'No default company in profile');
      }
    } catch (e) {
      fail('auth.access-profile.companyId', (e).message);
    }
  }

  const modules = [
    {
      key: 'inventory',
      settingsGet: `/inventory/settings/company/${companyId}`,
      settingsPatch: `/inventory/settings/company/${companyId}`,
      patchBody: { notifySaleStockDeducted: false },
      inboxCategory: 'inventory',
      requiredFields: ['notificationsEnabled', 'notifyLowStock'],
    },
    {
      key: 'store',
      settingsGet: `/store/settings/company/${companyId}`,
      settingsPatch: `/store/settings/company/${companyId}`,
      patchBody: { notifyOrderProcessing: false },
      inboxCategory: 'store',
      requiredFields: ['notificationsEnabled', 'notifyOrderPlaced'],
    },
    {
      key: 'contacts',
      settingsGet: `/contacts/settings/company/${companyId}`,
      settingsPatch: `/contacts/settings/company/${companyId}`,
      patchBody: { notifyPartnerActivityCreated: false },
      inboxCategory: 'contacts',
      requiredFields: ['notificationsEnabled', 'notifyPartnerCreated'],
    },
  ];

  for (const mod of modules) {
    if (!companyId) {
      fail(`${mod.key}.settings.GET`, 'Skipped — no companyId');
      fail(`${mod.key}.settings.PATCH`, 'Skipped — no companyId');
      fail(`${mod.key}.inbox.GET`, 'Skipped — no companyId');
      fail(`${mod.key}.inbox.unread-count`, 'Skipped — no companyId');
      continue;
    }

    // GET settings
    try {
      const res = await request(mod.settingsGet, { token });
      if (!res.ok) {
        fail(`${mod.key}.settings.GET`, `HTTP ${res.status}`, { status: res.status, data: res.payload });
      } else {
        const missing = mod.requiredFields.filter((f) => res.data?.[f] === undefined);
        if (missing.length) {
          fail(`${mod.key}.settings.GET`, `Missing fields: ${missing.join(', ')}`, { data: res.data });
        } else {
          pass(`${mod.key}.settings.GET`, {
            data: {
              notificationsEnabled: res.data.notificationsEnabled,
              companyId: res.data.companyId,
            },
          });
        }
      }
    } catch (e) {
      fail(`${mod.key}.settings.GET`, (e).message);
    }

    // PATCH settings (round-trip)
    try {
      const res = await request(mod.settingsPatch, {
        method: 'PATCH',
        token,
        body: mod.patchBody,
      });
      if (!res.ok) {
        fail(`${mod.key}.settings.PATCH`, `HTTP ${res.status}`, { status: res.status, data: res.payload });
      } else {
        const patchKey = Object.keys(mod.patchBody)[0];
        if (res.data?.[patchKey] !== mod.patchBody[patchKey]) {
          fail(`${mod.key}.settings.PATCH`, `Field ${patchKey} not updated`, { data: res.data });
        } else {
          pass(`${mod.key}.settings.PATCH`, { data: { [patchKey]: res.data[patchKey] } });
        }
      }
    } catch (e) {
      fail(`${mod.key}.settings.PATCH`, (e).message);
    }

    // Inbox
    try {
      const res = await request(`/notifications/inbox/user/${userId}`, {
        token,
        query: { companyId, category: mod.inboxCategory, limit: 5 },
      });
      if (!res.ok) {
        fail(`${mod.key}.inbox.GET`, `HTTP ${res.status}`, { status: res.status, data: res.payload });
      } else {
        const items = res.data?.items ?? [];
        pass(`${mod.key}.inbox.GET`, { data: { count: items.length, total: res.data?.pagination?.total } });
      }
    } catch (e) {
      fail(`${mod.key}.inbox.GET`, (e).message);
    }

    // Unread count
    try {
      const res = await request(`/notifications/inbox/user/${userId}/unread-count`, {
        token,
        query: { companyId },
      });
      if (!res.ok) {
        fail(`${mod.key}.inbox.unread-count`, `HTTP ${res.status}`, { status: res.status, data: res.payload });
      } else {
        const byCat = res.data?.byCategory?.[mod.inboxCategory];
        pass(`${mod.key}.inbox.unread-count`, {
          data: { unread: res.data?.unread, byCategory: byCat ?? 0 },
        });
      }
    } catch (e) {
      fail(`${mod.key}.inbox.unread-count`, (e).message);
    }
  }

  // Frontend static checks (file existence)
  const fs = await import('node:fs');
  const path = await import('node:path');
  const root = path.resolve(import.meta.dirname, '..');

  const frontendChecks = [
    ['inventory', 'src/features/inventory/admin/notifications/components/inventory-settings-page.tsx'],
    ['inventory', 'src/features/inventory/admin/notifications/components/inventory-notification-bell-popover.tsx'],
    ['inventory', 'src/app/(app)/(inventory)/inventory/settings/page.tsx'],
    ['store', 'src/features/ecommerce/admin/notifications/components/store-settings-page.tsx'],
    ['store', 'src/features/ecommerce/admin/notifications/components/store-notification-bell-popover.tsx'],
    ['store', 'src/app/(app)/(ecommerce)/notification-settings/page.tsx'],
    ['contacts', 'src/features/contacts/admin/notifications/components/contacts-settings-page.tsx'],
    ['contacts', 'src/features/contacts/admin/notifications/components/contacts-notification-bell-popover.tsx'],
    ['contacts', 'src/app/(app)/(contacts)/contacts/settings/page.tsx'],
    ['shared', 'src/components/layouts/topbar.tsx'],
  ];

  for (const [mod, rel] of frontendChecks) {
    const full = path.join(root, rel);
    if (fs.existsSync(full)) {
      pass(`frontend.${mod}.${path.basename(rel)}`);
    } else {
      fail(`frontend.${mod}.${path.basename(rel)}`, `Missing file: ${rel}`);
    }
  }

  printSummary();
  process.exit(results.some((r) => !r.ok) ? 1 : 0);
}

function printSummary() {
  const passed = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  console.log('\n══════════════════════════════════════');
  console.log(`✅ نجح: ${passed.length}`);
  console.log(`❌ فشل: ${failed.length}`);
  if (failed.length) {
    console.log('\nتفاصيل الفشل:');
    for (const f of failed) {
      console.log(`  • ${f.name}: ${f.detail ?? ''}${f.status ? ` (HTTP ${f.status})` : ''}`);
    }
  }
  console.log('══════════════════════════════════════\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

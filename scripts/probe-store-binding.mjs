const BASE = process.env.BASE || 'http://localhost:3000';
const CID = process.env.CID || '76e5bc4f-5adb-434d-a886-bcff05a9680b';
const TOKEN = process.env.TOKEN || '';

async function call(name, method, path, opts = {}) {
  const url = new URL(path.startsWith('http') ? path : BASE + path);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }
  const headers = { Accept: 'application/json', ...(opts.headers || {}) };
  if (opts.auth) headers.Authorization = 'Bearer ' + TOKEN;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { raw: text.slice(0, 200) };
    }
    const data = json && typeof json === 'object' && 'data' in json ? json.data : json;
    const shape =
      data === null || data === undefined
        ? 'null'
        : Array.isArray(data)
          ? 'array'
          : data && typeof data === 'object' && Array.isArray(data.items) && data.pagination
            ? 'list{items,pagination}'
            : data && typeof data === 'object'
              ? 'object'
              : typeof data;
    const msg =
      json && typeof json === 'object'
        ? json.message || (json.error && json.error.message) || ''
        : '';
    return {
      name,
      method,
      path: url.pathname + url.search,
      status: res.status,
      ok: res.ok,
      ms: Date.now() - started,
      shape,
      message: String(msg).slice(0, 200),
      hint: summarize(data),
      group: opts.group || 'other',
    };
  } catch (e) {
    return {
      name,
      method,
      path,
      status: 0,
      ok: false,
      ms: Date.now() - started,
      shape: 'error',
      message: String(e.message || e),
      hint: '',
      group: opts.group || 'other',
    };
  }
}

function summarize(data) {
  if (!data || typeof data !== 'object') return String(data ?? '');
  if (Array.isArray(data.items) && data.pagination) {
    return `items=${data.items.length} total=${data.pagination.total ?? '?'}`;
  }
  if (data.settings) return 'config bootstrap';
  if (data.sections) return `sections=${Array.isArray(data.sections) ? data.sections.length : '?'}`;
  if (data.orderNumber) return `order=${data.orderNumber}`;
  if (data.currencyCode) return `currency=${data.currencyCode}`;
  if (data.storeNameAr) return `store=${data.storeNameAr}`;
  if (data.products && data.categories) {
    const pi = data.products.items?.length ?? (Array.isArray(data.products) ? data.products.length : '?');
    return `search products=${pi}`;
  }
  const keys = Object.keys(data).slice(0, 8).join(',');
  return keys ? `keys:${keys}` : '';
}

async function jsonGet(path, auth = false) {
  const headers = { Accept: 'application/json' };
  if (auth) headers.Authorization = 'Bearer ' + TOKEN;
  const r = await fetch(BASE + path, { headers });
  const j = await r.json().catch(() => null);
  return j?.data ?? null;
}

(async () => {
  const results = [];

  results.push(
    await call('products list', 'GET', '/public/inventory/products', {
      query: { companyId: CID, page: 1, limit: 5 },
      group: 'catalog',
    }),
  );
  const productsPage = await jsonGet(`/public/inventory/products?companyId=${CID}&page=1&limit=5`);
  const products = productsPage?.items || [];
  const product = products[0];
  const productId = product?.id;
  const productSlug = product?.slug;
  const productCurrency = product?.priceCurrency;

  if (productSlug) {
    results.push(
      await call('product by slug', 'GET', `/public/inventory/products/by-slug/${encodeURIComponent(productSlug)}`, {
        query: { companyId: CID },
        group: 'catalog',
      }),
    );
  }

  results.push(
    await call('categories list', 'GET', '/public/inventory/categories', {
      query: { companyId: CID, page: 1, limit: 5 },
      group: 'catalog',
    }),
  );
  const cats = (await jsonGet(`/public/inventory/categories?companyId=${CID}&page=1&limit=1`))?.items || [];
  if (cats[0]?.slug) {
    results.push(
      await call('category by slug', 'GET', `/public/inventory/categories/by-slug/${encodeURIComponent(cats[0].slug)}`, {
        query: { companyId: CID },
        group: 'catalog',
      }),
    );
  }

  results.push(
    await call('brands list', 'GET', '/public/inventory/brands', {
      query: { companyId: CID, page: 1, limit: 5 },
      group: 'catalog',
    }),
  );
  const brands = (await jsonGet(`/public/inventory/brands?companyId=${CID}&page=1&limit=1`))?.items || [];
  if (brands[0]?.slug) {
    results.push(
      await call('brand by slug', 'GET', `/public/inventory/brands/by-slug/${encodeURIComponent(brands[0].slug)}`, {
        query: { companyId: CID },
        group: 'catalog',
      }),
    );
  }

  results.push(await call('public config', 'GET', `/public/store/companies/${CID}/config`, { group: 'public-store' }));
  results.push(
    await call('public homepage', 'GET', '/public/store/pages/homepage', {
      query: { companyId: CID },
      group: 'public-store',
    }),
  );
  results.push(
    await call('public about', 'GET', '/public/store/content/about', {
      query: { companyId: CID },
      group: 'public-store',
    }),
  );
  results.push(
    await call('public contact', 'GET', '/public/store/content/contact', {
      query: { companyId: CID },
      group: 'public-store',
    }),
  );
  results.push(
    await call('public faq', 'GET', '/public/store/content/faq', {
      query: { companyId: CID, page: 1, limit: 20 },
      group: 'public-store',
    }),
  );
  for (const slug of ['privacy', 'terms', 'returns']) {
    results.push(
      await call(`legal ${slug}`, 'GET', `/public/store/content/legal/${slug}`, {
        query: { companyId: CID },
        group: 'public-store',
      }),
    );
  }
  if (productId) {
    results.push(
      await call('product reviews', 'GET', `/public/store/products/${productId}/reviews`, {
        query: { companyId: CID, page: 1, limit: 10 },
        group: 'public-store',
      }),
    );
  }
  results.push(
    await call('search', 'GET', '/public/store/search', {
      query: { companyId: CID, q: 'a', page: 1, limit: 5 },
      group: 'public-store',
    }),
  );

  results.push(
    await call('contact message POST', 'POST', '/public/store/contact-messages', {
      body: {
        companyId: CID,
        name: 'Binding Probe',
        email: 'probe@test.com',
        phone: '770000000',
        message: 'automated binding verification — ignore',
      },
      group: 'mutations',
    }),
  );

  if (productId) {
    results.push(
      await call('place order POST', 'POST', '/public/store/orders', {
        headers: { 'Idempotency-Key': `probe-${Date.now()}` },
        body: {
          companyId: CID,
          paymentMethod: 'cash_on_delivery',
          locale: 'ar',
          address: {
            fullName: 'Probe User',
            phone: '777123456',
            city: 'صنعاء',
            district: 'test',
            street: 'test st',
          },
          items: [{ productId, quantity: 1 }],
        },
        group: 'mutations',
      }),
    );
  }

  results.push(
    await call('wishlist GET (staff token)', 'GET', '/public/store/wishlist', {
      auth: true,
      query: { page: 1, limit: 10 },
      group: 'partner-only',
    }),
  );

  const adminBase = `/store-admin/companies/${CID}`;
  results.push(await call('admin settings GET', 'GET', `${adminBase}/settings`, { auth: true, group: 'admin-settings' }));
  for (const child of ['checkout-cities', 'social-links', 'nav-items', 'footer', 'announcements']) {
    results.push(await call(`admin ${child}`, 'GET', `${adminBase}/settings/${child}`, { auth: true, group: 'admin-settings' }));
  }
  results.push(await call('admin about', 'GET', `${adminBase}/content/about`, { auth: true, group: 'admin-content' }));
  results.push(await call('admin contact', 'GET', `${adminBase}/content/contact`, { auth: true, group: 'admin-content' }));
  results.push(
    await call('admin contact-messages', 'GET', `${adminBase}/contact-messages`, {
      auth: true,
      query: { page: 1, limit: 10 },
      group: 'admin-content',
    }),
  );
  results.push(
    await call('admin faq', 'GET', `${adminBase}/faq`, {
      auth: true,
      query: { page: 1, limit: 20 },
      group: 'admin-content',
    }),
  );
  for (const slug of ['privacy', 'terms', 'returns']) {
    results.push(await call(`admin legal ${slug}`, 'GET', `${adminBase}/legal/${slug}`, { auth: true, group: 'admin-content' }));
  }
  results.push(await call('admin homepage', 'GET', `${adminBase}/pages/homepage`, { auth: true, group: 'admin-pages' }));
  results.push(
    await call('admin orders list', 'GET', '/store-admin/orders', {
      auth: true,
      query: { companyId: CID, page: 1, limit: 10 },
      group: 'admin-orders',
    }),
  );

  const orders = (await jsonGet(`/store-admin/orders?companyId=${CID}&page=1&limit=1`, true))?.items || [];
  if (orders[0]?.id) {
    results.push(
      await call('admin order detail', 'GET', `/store-admin/orders/${orders[0].id}`, {
        auth: true,
        group: 'admin-orders',
      }),
    );
  }

  results.push(await call('uploads categories', 'GET', '/uploads/categories', { auth: true, group: 'uploads' }));

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(
    JSON.stringify(
      {
        meta: {
          base: BASE,
          companyId: CID,
          tokenType: 'staff',
          productId: productId || null,
          productCurrency: productCurrency || null,
          productSlug: productSlug || null,
          passed,
          failed,
          total: results.length,
          at: new Date().toISOString(),
        },
        results,
      },
      null,
      2,
    ),
  );
})();

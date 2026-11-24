import { buildApp } from '../app';
import { DEFAULT_ADMIN_CREDENTIALS } from '../prisma/seed';

interface TestResult {
  name: string;
  passed: boolean;
  status: number;
  detail?: string;
}

async function run() {
  const app = buildApp();
  await app.ready();

  const results: TestResult[] = [];
  const check = (
    name: string,
    res: { statusCode: number; body: string },
    expectedStatus: number | number[],
    predicate?: (json: any) => boolean
  ) => {
    const allowed = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    let passed = allowed.includes(res.statusCode);
    let parsed: any = {};
    try {
      parsed = JSON.parse(res.body || '{}');
    } catch {
      // non-json response
    }
    if (passed && predicate) {
      passed = Boolean(predicate(parsed));
    }
    results.push({
      name,
      passed,
      status: res.statusCode,
      detail: passed ? undefined : res.body.slice(0, 220),
    });
    return parsed;
  };

  // 1. Health & Public Storefront
  check('PUB: GET /health', await app.inject({ method: 'GET', url: '/health' }), 200);
  check('PUB: GET /api/v1/store/settings', await app.inject({ method: 'GET', url: '/api/v1/store/settings' }), 200);
  check('PUB: GET /api/v1/store/contact-info', await app.inject({ method: 'GET', url: '/api/v1/store/contact-info' }), 200);
  check('PUB: GET /api/v1/store/delivery-methods', await app.inject({ method: 'GET', url: '/api/v1/store/delivery-methods' }), 200);

  // 2. Security Guards (Negative Cases)
  check('SEC: GET /store/metrics without token -> 401', await app.inject({ method: 'GET', url: '/api/v1/store/metrics' }), 401);
  check('SEC: POST /profile/wishlist/toggle without token -> 401', await app.inject({ method: 'POST', url: '/api/v1/profile/wishlist/toggle', payload: { productId: 'x' } }), 401);

  // 3. Auth Login, Refresh & Forgot Password
  const loginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: {
      email: DEFAULT_ADMIN_CREDENTIALS.email,
      password: DEFAULT_ADMIN_CREDENTIALS.password,
    },
  });
  const loginJson = check('AUTH: POST /auth/login (Owner)', loginRes, 200, (j) => Boolean(j?.data?.appToken));
  const token = loginJson?.data?.appToken || loginJson?.data?.token || '';
  const refreshToken = loginJson?.data?.refreshToken || '';
  const authHeaders = { authorization: `Bearer ${token}` };

  check(
    'AUTH: POST /auth/login wrong password -> 401/400',
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: DEFAULT_ADMIN_CREDENTIALS.email, password: 'WrongPassword999!' },
    }),
    [400, 401]
  );

  check(
    'AUTH: POST /auth/refresh (Valid)',
    await app.inject({ method: 'POST', url: '/api/v1/auth/refresh', payload: { refreshToken } }),
    200,
    (j) => Boolean(j?.data?.appToken)
  );

  check(
    'AUTH: POST /auth/refresh (Invalid -> 401)',
    await app.inject({ method: 'POST', url: '/api/v1/auth/refresh', payload: { refreshToken: 'invalid.jwt.token' } }),
    401
  );

  // 4. Products, Related, Reviews, Wishlist
  const prodJson = check('CAT: GET /products', await app.inject({ method: 'GET', url: '/api/v1/products' }), 200);
  const firstProduct = prodJson?.data?.[0];
  const firstProductId = firstProduct?.id;

  if (firstProductId) {
    check('CAT: GET /products/:id/related', await app.inject({ method: 'GET', url: `/api/v1/products/${firstProductId}/related` }), 200);
    check('CAT: GET /products/:id/reviews', await app.inject({ method: 'GET', url: `/api/v1/products/${firstProductId}/reviews` }), 200);
    check(
      'CAT: POST /products/:id/reviews (Auth)',
      await app.inject({
        method: 'POST',
        url: `/api/v1/products/${firstProductId}/reviews`,
        headers: authHeaders,
        payload: { rating: 5, comment: 'Automated test verified review.' },
      }),
      201
    );
    check(
      'CAT: POST /profile/wishlist/toggle (Add)',
      await app.inject({
        method: 'POST',
        url: '/api/v1/profile/wishlist/toggle',
        headers: authHeaders,
        payload: { productId: firstProductId },
      }),
      200
    );
    check(
      'CAT: GET /profile/wishlist',
      await app.inject({ method: 'GET', url: '/api/v1/profile/wishlist', headers: authHeaders }),
      200,
      (j) => Array.isArray(j?.data)
    );
    // Toggle off to keep state clean
    await app.inject({
      method: 'POST',
      url: '/api/v1/profile/wishlist/toggle',
      headers: authHeaders,
      payload: { productId: firstProductId },
    });

    // 5. Checkout Calculate
    check(
      'CHK: POST /checkout/calculate',
      await app.inject({
        method: 'POST',
        url: '/api/v1/checkout/calculate',
        headers: authHeaders,
        payload: { items: [{ productId: firstProductId, qty: 1 }], shippingType: 'PICKUP' },
      }),
      [200, 400]
    );
  }

  // 6. News UUID Routing
  const newsJson = check('NEWS: GET /news', await app.inject({ method: 'GET', url: '/api/v1/news' }), 200);
  const firstNewsId = newsJson?.data?.[0]?.id;
  if (firstNewsId) {
    check('NEWS: GET /news/:uuid', await app.inject({ method: 'GET', url: `/api/v1/news/${firstNewsId}` }), 200);
  }

  // 7. ERP Panels Read Endpoints
  const erpEndpoints = [
    '/api/v1/store/metrics',
    '/api/v1/store/orders',
    '/api/v1/store/inventory',
    '/api/v1/store/agents',
    '/api/v1/store/vouchers',
    '/api/v1/store/devices',
    '/api/v1/store/esignatures',
    '/api/v1/store/product-knowledge',
    '/api/v1/store/stock-velocity',
    '/api/v1/store/restock-recommendations',
    '/api/v1/store/reports/financial',
    '/api/v1/store/contact-messages',
    '/api/v1/store/shifts/current',
    '/api/v1/store/shifts',
    '/api/v1/store/suppliers',
    '/api/v1/store/purchase-orders',
    '/api/v1/store/returns',
    '/api/v1/store/audit-logs',
    '/api/v1/store/rbac/roles',
    '/api/v1/store/rbac/permissions',
  ];
  for (const url of erpEndpoints) {
    check(`ERP: GET ${url}`, await app.inject({ method: 'GET', url, headers: authHeaders }), 200);
  }

  // 8. ERP Write & Business Logic Flow: Shift Open/Close + Purchasing PO + Stock Increment + Audit Log
  const shiftOpenJson = check(
    'ERP-FLOW: POST /store/shifts/open',
    await app.inject({
      method: 'POST',
      url: '/api/v1/store/shifts/open',
      headers: authHeaders,
      payload: { openingCash: 100000, notes: 'Automated QA Shift' },
    }),
    [201, 400]
  );
  const shiftId = shiftOpenJson?.data?.id;
  if (shiftId) {
    check(
      'ERP-FLOW: POST /store/shifts/:id/close',
      await app.inject({
        method: 'POST',
        url: `/api/v1/store/shifts/${shiftId}/close`,
        headers: authHeaders,
        payload: { closingCash: 100000, notes: 'Shift closed cleanly' },
      }),
      200
    );
  }

  const supJson = check(
    'ERP-FLOW: POST /store/suppliers',
    await app.inject({
      method: 'POST',
      url: '/api/v1/store/suppliers',
      headers: authHeaders,
      payload: { name: 'Supplier QA Test', phone: '08120000000' },
    }),
    201
  );
  const supId = supJson?.data?.id;
  if (supId && firstProductId) {
    const poJson = check(
      'ERP-FLOW: POST /store/purchase-orders',
      await app.inject({
        method: 'POST',
        url: '/api/v1/store/purchase-orders',
        headers: authHeaders,
        payload: {
          supplierId: supId,
          items: [{ productId: firstProductId, name: firstProduct.name, qty: 2, unitCost: 25000 }],
        },
      }),
      201
    );
    const poId = poJson?.data?.id;
    if (poId) {
      check(
        'ERP-FLOW: POST /store/purchase-orders/:id/receive',
        await app.inject({ method: 'POST', url: `/api/v1/store/purchase-orders/${poId}/receive`, headers: authHeaders }),
        200
      );
      check(
        'ERP-FLOW: Double receive rejected -> 400',
        await app.inject({ method: 'POST', url: `/api/v1/store/purchase-orders/${poId}/receive`, headers: authHeaders }),
        400
      );
      check(
        'ERP-FLOW: POST /store/purchase-orders/:id/pay',
        await app.inject({
          method: 'POST',
          url: `/api/v1/store/purchase-orders/${poId}/pay`,
          headers: authHeaders,
          payload: { amount: 50000 },
        }),
        200,
        (j) => j?.data?.paymentStatus === 'PAID'
      );
    }
    await app.inject({ method: 'DELETE', url: `/api/v1/store/suppliers/${supId}`, headers: authHeaders });
  }

  check(
    'ERP-FLOW: Audit logs recorded',
    await app.inject({ method: 'GET', url: '/api/v1/store/audit-logs', headers: authHeaders }),
    200,
    (j) => Array.isArray(j?.data) && j.data.length > 0
  );

  // Summary output
  let failedCount = 0;
  console.log('\n=== HASIL PENGUJIAN ALL MODULE & PER PANEL TIJARAH ===');
  for (const r of results) {
    const icon = r.passed ? '✅' : '❌';
    console.log(`${icon} [${r.status}] ${r.name}${r.detail ? ` -> ${r.detail}` : ''}`);
    if (!r.passed) failedCount++;
  }
  console.log(`\nTotal: ${results.length} | Lulus: ${results.length - failedCount} | Gagal: ${failedCount}`);

  await app.close();
  process.exit(failedCount > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('❌ Test suite crash:', err);
  process.exit(1);
});

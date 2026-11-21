/**
 * ==============================================================================
 * Centralized API Endpoints Registry - Tijarah Frontend
 * ==============================================================================
 * File ini menjadi satu-satunya sumber kebenaran (Single Source of Truth) untuk
 * semua URL endpoint backend yang dipanggil oleh frontend.
 *
 * Manfaat:
 * 1. Mencegah typo atau broken routes (seperti kasus 404 pada /api/v1/auth/profile).
 * 2. Autocomplete penuh dan validasi tipe TypeScript.
 * 3. Memudahkan audit ketersediaan endpoint backend via checker tool.
 */

export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        REFRESH: '/auth/refresh',
        PROFILE: '/auth/profile',
        GOOGLE_URL: '/auth/google/url',
        GOOGLE_SIGN_IN: '/auth/sign-in-with-google',
        EXCHANGE_CODE: '/auth/exchange-code',
        AUTH_CODE: '/auth/auth-code',
        RESEND_OTP: '/auth/resend-otp',
        VERIFY_OTP: '/auth/verify-otp',
    },
    PROFILE: {
        GET: (id?: string) => (id ? `/profile/${id}` : '/auth/profile'),
        UPDATE: (id?: string) => (id ? `/profile/${id}` : '/auth/profile'),
        SAVE_HNI: (id: string) => `/profile/${id}/hni`,
        SEARCH_HNI: '/profile/search-hni',
        SEARCH_HNI_PROFILE: '/profile/searchHniProfile',
    },
    PRODUCTS: {
        LIST: '/products',
        DETAIL: (id: string) => `/products/${id}`,
    },
    CREDIT: {
        ACCOUNT: (userId?: string) => (userId ? `/credit/account/${userId}` : '/credit/account'),
        LEDGER: (userId?: string) => (userId ? `/credit/ledger/${userId}` : '/credit/ledger'),
        APPLY: '/credit/apply',
        ADMIN_APPLICATIONS: '/credit/admin/applications',
        ADMIN_APPROVE: (id: string) => `/credit/admin/applications/${id}/approve`,
        ADMIN_REJECT: (id: string) => `/credit/admin/applications/${id}/reject`,
    },
    ADDRESSES: {
        LIST: (userId?: string) => (userId ? `/user/addresses/${userId}` : '/user/addresses'),
        CREATE: '/user/addresses',
        UPDATE: (id: string) => `/user/addresses/${id}`,
        DELETE: (id: string) => `/user/addresses/${id}`,
        SET_PRIMARY: (id: string) => `/user/addresses/${id}/primary`,
    },
    VOUCHERS: {
        LIST: (userId?: string) => (userId ? `/vouchers/${userId}` : '/vouchers'),
        VALIDATE: '/vouchers/validate',
    },
    CHECKOUT: {
        CALCULATE: '/checkout/calculate',
        PROCESS: '/checkout/process',
        MOCK_PAY: (orderId: string) => `/checkout/payments/mock-pay/${orderId}`,
        RECEIPT: (orderId: string) => `/checkout/orders/${orderId}/receipt`,
        ADMIN_APPROVE: (orderId: string) => `/checkout/admin/orders/${orderId}/approve`,
        ADMIN_SHIP: (orderId: string) => `/checkout/admin/orders/${orderId}/ship`,
        ADMIN_REJECT: (orderId: string) => `/checkout/admin/orders/${orderId}/reject`,
    },
    ORDERS: {
        LIST: '/user/orders',
        STATUS_COUNTS: '/user/orders/status-counts',
        DETAIL: (id: string) => `/user/orders/${id}`,
        CANCEL: (id: string) => `/user/orders/${id}/cancel`,
        CONFIRM_DELIVERED: (id: string) => `/user/orders/${id}/confirm-delivered`,
    },
    NOTIFICATIONS: {
        LIST: '/user/notifications',
        UNREAD_COUNT: '/user/notifications/unread-count',
        MARK_READ: (id: string) => `/user/notifications/${id}/read`,
        MARK_ALL_READ: '/user/notifications/read-all',
        DELETE: (id: string) => `/user/notifications/${id}`,
    },
    PAYMENTS: {
        SYNC_STATUS: (orderId: string) => `/payments/sync-status/${orderId}`,
        ADMIN_CONFIRM_TRANSFER: '/payments/admin/confirm-transfer',
        COD_CONFIRM: (orderId: string) => `/payments/orders/${orderId}/cod-confirm`,
        RECEIPT_HTML: (orderId: string) => `/payments/receipt/${orderId}`,
    },
    I18N: {
        DICTIONARY: '/i18n/dictionary',
    },
    META: {
        ROUTES: '/meta/routes',
    },
    STORE: {
        METRICS: '/store/metrics',
        ORDERS: '/store/orders',
        APPROVE_ORDER: (id: string) => `/store/orders/${id}/approve`,
        SHIP_ORDER: (id: string) => `/store/orders/${id}/ship`,
        CONFIRM_DELIVERED: (id: string) => `/store/orders/${id}/confirm-delivered`,
        COMPLETE_ORDER: (id: string) => `/store/orders/${id}/complete`,
        REJECT_ORDER: (id: string) => `/store/orders/${id}/reject`,
        INVENTORY: '/store/inventory',
        INVENTORY_ITEM: (id: string) => `/store/inventory/${id}`,
        DEVICES: '/store/devices',
        DEVICE_ITEM: (id: string) => `/store/devices/${id}`,
        AGENTS: '/store/agents',
        AGENT_ITEM: (id: string) => `/store/agents/${id}`,
        MERCHANTS: '/store/merchants',
        MERCHANT_ITEM: (id: string) => `/store/merchants/${id}`,
        NON_HNI_PRODUCTS: '/store/non-hni-products',
        NON_HNI_PRODUCT_ITEM: (id: string) => `/store/non-hni-products/${id}`,
        ESIGNATURES: '/store/esignatures',
        ESIGNATURE_ITEM: (id: string) => `/store/esignatures/${id}`,
        PRODUCT_KNOWLEDGE: '/store/product-knowledge',
        HSIS_ENDPOINTS: '/store/hsis-endpoints',
        HSIS_AUTO_LOGIN: '/store/hsis/auto-login',
    },
} as const;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface EndpointMeta {
    module: string;
    method: HttpMethod;
    path: string;
    description: string;
    sampleUrl: string;
}

/**
 * Daftar flat seluruh endpoint frontend beserta contoh URL untuk verifikasi otomatis
 */
export const ALL_FRONTEND_ENDPOINTS: EndpointMeta[] = [
    // AUTH
    { module: 'AUTH', method: 'POST', path: '/auth/login', sampleUrl: '/auth/login', description: 'User login' },
    { module: 'AUTH', method: 'POST', path: '/auth/register', sampleUrl: '/auth/register', description: 'User registration' },
    { module: 'AUTH', method: 'POST', path: '/auth/refresh', sampleUrl: '/auth/refresh', description: 'Refresh token session' },
    { module: 'AUTH', method: 'GET', path: '/auth/profile', sampleUrl: '/auth/profile', description: 'Current user profile' },
    { module: 'AUTH', method: 'PUT', path: '/auth/profile', sampleUrl: '/auth/profile', description: 'Update current user profile' },
    { module: 'AUTH', method: 'GET', path: '/auth/google/url', sampleUrl: '/auth/google/url', description: 'Get Google OAuth URL' },
    { module: 'AUTH', method: 'POST', path: '/auth/sign-in-with-google', sampleUrl: '/auth/sign-in-with-google', description: 'Google token sign in' },
    { module: 'AUTH', method: 'POST', path: '/auth/exchange-code', sampleUrl: '/auth/exchange-code', description: 'Exchange code for token' },
    { module: 'AUTH', method: 'POST', path: '/auth/auth-code', sampleUrl: '/auth/auth-code', description: 'Verify auth code' },
    { module: 'AUTH', method: 'POST', path: '/auth/resend-otp', sampleUrl: '/auth/resend-otp', description: 'Resend OTP' },
    { module: 'AUTH', method: 'POST', path: '/auth/verify-otp', sampleUrl: '/auth/verify-otp', description: 'Verify OTP' },

    // PROFILE
    { module: 'PROFILE', method: 'GET', path: '/profile/:id', sampleUrl: '/profile/sample-id', description: 'Get user profile by ID' },
    { module: 'PROFILE', method: 'PUT', path: '/profile/:id', sampleUrl: '/profile/sample-id', description: 'Update user profile by ID' },
    { module: 'PROFILE', method: 'POST', path: '/profile/:id/hni', sampleUrl: '/profile/sample-id/hni', description: 'Save HNI profile' },
    { module: 'PROFILE', method: 'GET', path: '/profile/search-hni', sampleUrl: '/profile/search-hni', description: 'Search HNI profile' },
    { module: 'PROFILE', method: 'GET', path: '/profile/searchHniProfile', sampleUrl: '/profile/searchHniProfile', description: 'Search HNI profile (alias)' },

    // PRODUCTS
    { module: 'PRODUCTS', method: 'GET', path: '/products', sampleUrl: '/products', description: 'List catalog products' },
    { module: 'PRODUCTS', method: 'GET', path: '/products/:id', sampleUrl: '/products/sample-id', description: 'Product detail' },

    // CREDIT / KASBON
    { module: 'CREDIT', method: 'GET', path: '/credit/account', sampleUrl: '/credit/account', description: 'Current credit account' },
    { module: 'CREDIT', method: 'GET', path: '/credit/account/:userId', sampleUrl: '/credit/account/sample-user-id', description: 'User credit account' },
    { module: 'CREDIT', method: 'POST', path: '/credit/apply', sampleUrl: '/credit/apply', description: 'Apply kasbon limit' },
    { module: 'CREDIT', method: 'GET', path: '/credit/ledger', sampleUrl: '/credit/ledger', description: 'Credit ledger transactions' },
    { module: 'CREDIT', method: 'GET', path: '/credit/ledger/:userId', sampleUrl: '/credit/ledger/sample-user-id', description: 'User credit ledger' },
    { module: 'CREDIT', method: 'GET', path: '/credit/admin/applications', sampleUrl: '/credit/admin/applications', description: 'Admin: Get applications' },
    { module: 'CREDIT', method: 'PATCH', path: '/credit/admin/applications/:id/approve', sampleUrl: '/credit/admin/applications/sample-id/approve', description: 'Admin: Approve application' },
    { module: 'CREDIT', method: 'PATCH', path: '/credit/admin/applications/:id/reject', sampleUrl: '/credit/admin/applications/sample-id/reject', description: 'Admin: Reject application' },

    // ADDRESSES
    { module: 'ADDRESSES', method: 'GET', path: '/user/addresses', sampleUrl: '/user/addresses', description: 'List user addresses' },
    { module: 'ADDRESSES', method: 'GET', path: '/user/addresses/:userId', sampleUrl: '/user/addresses/sample-user-id', description: 'List addresses by user ID' },
    { module: 'ADDRESSES', method: 'POST', path: '/user/addresses', sampleUrl: '/user/addresses', description: 'Create new address' },
    { module: 'ADDRESSES', method: 'PUT', path: '/user/addresses/:id', sampleUrl: '/user/addresses/sample-id', description: 'Update address' },
    { module: 'ADDRESSES', method: 'DELETE', path: '/user/addresses/:id', sampleUrl: '/user/addresses/sample-id', description: 'Delete address' },
    { module: 'ADDRESSES', method: 'PATCH', path: '/user/addresses/:id/primary', sampleUrl: '/user/addresses/sample-id/primary', description: 'Set primary address' },

    // VOUCHERS
    { module: 'VOUCHERS', method: 'GET', path: '/vouchers', sampleUrl: '/vouchers', description: 'List available vouchers' },
    { module: 'VOUCHERS', method: 'GET', path: '/vouchers/:userId', sampleUrl: '/vouchers/sample-user-id', description: 'User vouchers' },
    { module: 'VOUCHERS', method: 'POST', path: '/vouchers/validate', sampleUrl: '/vouchers/validate', description: 'Validate voucher code' },

    // CHECKOUT
    { module: 'CHECKOUT', method: 'POST', path: '/checkout/calculate', sampleUrl: '/checkout/calculate', description: 'Calculate checkout total' },
    { module: 'CHECKOUT', method: 'POST', path: '/checkout/process', sampleUrl: '/checkout/process', description: 'Process checkout order' },
    { module: 'CHECKOUT', method: 'POST', path: '/checkout/payments/mock-pay/:orderId', sampleUrl: '/checkout/payments/mock-pay/sample-id', description: 'Simulate mock payment' },
    { module: 'CHECKOUT', method: 'GET', path: '/checkout/orders/:id/receipt', sampleUrl: '/checkout/orders/sample-id/receipt', description: 'Get order receipt' },
    { module: 'CHECKOUT', method: 'POST', path: '/checkout/admin/orders/:id/approve', sampleUrl: '/checkout/admin/orders/sample-id/approve', description: 'Admin: Approve order' },
    { module: 'CHECKOUT', method: 'POST', path: '/checkout/admin/orders/:id/ship', sampleUrl: '/checkout/admin/orders/sample-id/ship', description: 'Admin: Ship order' },
    { module: 'CHECKOUT', method: 'POST', path: '/checkout/admin/orders/:id/reject', sampleUrl: '/checkout/admin/orders/sample-id/reject', description: 'Admin: Reject order' },

    // ORDERS
    { module: 'ORDERS', method: 'GET', path: '/user/orders', sampleUrl: '/user/orders', description: 'List user orders' },
    { module: 'ORDERS', method: 'GET', path: '/user/orders/status-counts', sampleUrl: '/user/orders/status-counts', description: 'Get order status counts' },
    { module: 'ORDERS', method: 'GET', path: '/user/orders/:id', sampleUrl: '/user/orders/sample-id', description: 'Order detail' },
    { module: 'ORDERS', method: 'POST', path: '/user/orders/:id/cancel', sampleUrl: '/user/orders/sample-id/cancel', description: 'Cancel order' },
    { module: 'ORDERS', method: 'POST', path: '/user/orders/:id/confirm-delivered', sampleUrl: '/user/orders/sample-id/confirm-delivered', description: 'Confirm delivered' },

    // NOTIFICATIONS
    { module: 'NOTIFICATIONS', method: 'GET', path: '/user/notifications', sampleUrl: '/user/notifications', description: 'List notifications' },
    { module: 'NOTIFICATIONS', method: 'GET', path: '/user/notifications/unread-count', sampleUrl: '/user/notifications/unread-count', description: 'Unread notification count' },
    { module: 'NOTIFICATIONS', method: 'PATCH', path: '/user/notifications/:id/read', sampleUrl: '/user/notifications/sample-id/read', description: 'Mark notification as read' },
    { module: 'NOTIFICATIONS', method: 'PATCH', path: '/user/notifications/read-all', sampleUrl: '/user/notifications/read-all', description: 'Mark all as read' },
    { module: 'NOTIFICATIONS', method: 'DELETE', path: '/user/notifications/:id', sampleUrl: '/user/notifications/sample-id', description: 'Delete notification' },

    // PAYMENTS
    { module: 'PAYMENTS', method: 'GET', path: '/payments/sync-status/:orderId', sampleUrl: '/payments/sync-status/sample-id', description: 'Sync Xendit payment status' },
    { module: 'PAYMENTS', method: 'POST', path: '/payments/admin/confirm-transfer', sampleUrl: '/payments/admin/confirm-transfer', description: 'Admin confirm transfer' },
    { module: 'PAYMENTS', method: 'POST', path: '/payments/orders/:orderId/cod-confirm', sampleUrl: '/payments/orders/sample-id/cod-confirm', description: 'Courier confirm COD' },
    { module: 'PAYMENTS', method: 'GET', path: '/payments/receipt/:orderId', sampleUrl: '/payments/receipt/sample-id', description: 'View receipt HTML' },

    // I18N
    { module: 'I18N', method: 'GET', path: '/i18n/dictionary', sampleUrl: '/i18n/dictionary', description: 'Get i18n dictionary' },

    // META
    { module: 'META', method: 'GET', path: '/meta/routes', sampleUrl: '/meta/routes', description: 'List backend registered routes' },
];

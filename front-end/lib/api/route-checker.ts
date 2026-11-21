import apiClient from '../axios/client';
import { ALL_FRONTEND_ENDPOINTS, EndpointMeta, HttpMethod } from '@/config/endpoints';

export interface RouteCheckResult {
    path: string;
    method: HttpMethod;
    available: boolean;
    status: number | null;
    message: string;
    backendMatch?: string;
    latencyMs?: number;
}

export interface BackendRouteInfo {
    method: string;
    path: string;
    prefix?: string;
}

/**
 * Normalisasi path endpoint untuk pencocokan URL dinamis.
 * Contoh: /profile/123-abc cocok dengan /api/v1/profile/:id
 */
function normalizePath(path: string): string {
    let clean = path.split('?')[0].trim();
    if (!clean.startsWith('/')) clean = '/' + clean;
    if (!clean.startsWith('/api/v1')) {
        clean = '/api/v1' + clean;
    }
    return clean;
}

/**
 * Mencocokkan path dinamis (Fastify `:param` format) dengan path URL aktual
 */
function matchesPattern(actualPath: string, fastifyPattern: string): boolean {
    const actualNorm = normalizePath(actualPath);
    const patternNorm = normalizePath(fastifyPattern);

    if (actualNorm === patternNorm) return true;

    // Ganti :param dengan wildcard regex
    const regexPattern = patternNorm
        .replace(/:[a-zA-Z0-9_]+/g, '[^/]+')
        .replace(/\//g, '\\/');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(actualNorm);
}

/**
 * Mengambil seluruh daftar route yang aktif langsung dari Fastify backend
 */
export async function fetchBackendRoutes(): Promise<BackendRouteInfo[]> {
    try {
        const res = await apiClient.get('/meta/routes', {
            // @ts-ignore
            skipGlobalToast: true,
            timeout: 3000,
        });
        return res.data?.routes || [];
    } catch {
        return [];
    }
}

/**
 * Fungsi utama: Cek ketersediaan satu endpoint di backend
 *
 * @param path - URL endpoint (contoh: '/auth/profile' atau '/api/v1/auth/profile')
 * @param method - HTTP Method ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'), default: 'GET'
 * @returns Status ketersediaan endpoint di backend
 *
 * @example
 * const res = await checkEndpoint('/auth/profile', 'GET');
 * if (!res.available) {
 *    console.warn("Endpoint belum ada di backend!");
 * }
 */
export async function checkEndpoint(
    path: string,
    method: HttpMethod = 'GET'
): Promise<RouteCheckResult> {
    const startTime = Date.now();
    const cleanPath = path.startsWith('/api/v1') ? path.replace('/api/v1', '') : path;

    // 1. Cek langsung via meta routes jika backend menyediakannya
    const backendRoutes = await fetchBackendRoutes();
    if (backendRoutes.length > 0) {
        const match = backendRoutes.find(
            (r) => r.method === method && matchesPattern(cleanPath, r.path)
        );

        const latencyMs = Date.now() - startTime;
        if (match) {
            return {
                path: cleanPath,
                method,
                available: true,
                status: 200,
                message: `Tersedia di backend (Pola terdaftar: ${match.path})`,
                backendMatch: match.path,
                latencyMs,
            };
        }
    }

    // 2. Fallback uji tembak request langsung ke endpoint dengan skipGlobalToast
    try {
        const response = await apiClient.request({
            url: cleanPath,
            method,
            // @ts-ignore
            skipGlobalToast: true,
            // @ts-ignore
            silent: true,
            validateStatus: () => true, // Terima semua status tanpa throw error
        });

        const latencyMs = Date.now() - startTime;
        const status = response.status;

        if (status === 404) {
            return {
                path: cleanPath,
                method,
                available: false,
                status: 404,
                message: '❌ 404 Route Not Found: Endpoint belum didaftarkan di backend!',
                latencyMs,
            };
        }

        // Status 200, 201, 204, 400, 401, 403, 422 semuanya berarti ROUTE TERSEDIA di backend
        const isAuthRequired = status === 401 || status === 403;
        const isValidationError = status === 400 || status === 422;

        return {
            path: cleanPath,
            method,
            available: true,
            status,
            message: isAuthRequired
                ? `✅ Tersedia di backend (HTTP ${status}: Memerlukan Auth)`
                : isValidationError
                ? `✅ Tersedia di backend (HTTP ${status}: Validasi Schema Aktif)`
                : `✅ Tersedia di backend (HTTP ${status}: Sukses)`,
            latencyMs,
        };
    } catch (err: any) {
        const latencyMs = Date.now() - startTime;
        return {
            path: cleanPath,
            method,
            available: false,
            status: null,
            message: `⚠️ Server backend tidak dapat dihubungi (${err.message || 'Offline'})`,
            latencyMs,
        };
    }
}

/**
 * Uji seluruh endpoint frontend terhadap backend dan tampilkan ringkasan
 */
export async function checkAllEndpoints(): Promise<RouteCheckResult[]> {
    console.log('%c🔍 Memulai pemeriksaan seluruh API endpoint frontend terhadap backend...', 'color: #3b82f6; font-weight: bold;');

    const backendRoutes = await fetchBackendRoutes();
    const isMetaAvailable = backendRoutes.length > 0;

    if (isMetaAvailable) {
        console.log(`%cℹ️ Berhasil membaca ${backendRoutes.length} rute aktif dari Fastify backend.`, 'color: #10b981;');
    } else {
        console.warn('⚠️ Endpoint /meta/routes belum siap atau backend belum di-restart. Menggunakan mode pengujian langsung...');
    }

    const results: RouteCheckResult[] = [];

    for (const item of ALL_FRONTEND_ENDPOINTS) {
        const res = await checkEndpoint(item.sampleUrl, item.method);
        results.push(res);
    }

    // Format output ke console.table yang indah untuk developer
    if (typeof console.table === 'function') {
        const tableData = results.map((r, idx) => {
            const meta = ALL_FRONTEND_ENDPOINTS[idx];
            return {
                Module: meta.module,
                Method: r.method,
                'Frontend Endpoint': meta.path,
                Status: r.available ? '✅ TERSEDIA' : '❌ TIDAK DITEMUKAN',
                'HTTP Code': r.status ?? 'N/A',
                Keterangan: r.message,
            };
        });
        console.table(tableData);
    }

    const availableCount = results.filter((r) => r.available).length;
    const missingCount = results.length - availableCount;

    console.log(
        `%c📊 Ringkasan: ${availableCount}/${results.length} Endpoint Tersedia (${missingCount} hilang/404).`,
        missingCount === 0 ? 'color: #10b981; font-weight: bold;' : 'color: #ef4444; font-weight: bold;'
    );

    return results;
}

/**
 * Menginisialisasi helper global di window pada environment development
 * Memungkinkan developer mengetik `checkApi('/auth/profile')` langsung di Chrome DevTools!
 */
export function initDevRouteChecker() {
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
        (window as any).checkApi = checkEndpoint;
        (window as any).checkAllApi = checkAllEndpoints;
        (window as any).fetchBackendRoutes = fetchBackendRoutes;

        // Cetak petunjuk sekali saat inisialisasi di DevTools
        console.log(
            '%c🚀 [Tijarah API Checker] Terpasang di window!\nKetik checkApi(\'/auth/profile\') atau checkAllApi() di konsol untuk verifikasi endpoint.',
            'color: #06b6d4; font-size: 11px;'
        );
    }
}

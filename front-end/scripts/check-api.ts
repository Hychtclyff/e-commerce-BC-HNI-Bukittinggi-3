/**
 * ==============================================================================
 * Tijarah API Compatibility & Route Checker CLI
 * ==============================================================================
 * Skrip ini memverifikasi seluruh endpoint yang didefinisikan di frontend
 * terhadap endpoint aktif di Fastify backend (http://localhost:5000).
 *
 * Jalankan: bun run check:api
 */

import { ALL_FRONTEND_ENDPOINTS } from '../config/endpoints';

const BE_URL = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:5000/api/v1';

// ANSI Colors untuk terminal output
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';

function normalize(path: string): string {
    let clean = path.split('?')[0].trim();
    if (!clean.startsWith('/')) clean = '/' + clean;
    if (!clean.startsWith('/api/v1')) {
        clean = '/api/v1' + clean;
    }
    return clean;
}

function matchesPattern(actualPath: string, fastifyPattern: string): boolean {
    const actualNorm = normalize(actualPath);
    const patternNorm = normalize(fastifyPattern);

    if (actualNorm === patternNorm) return true;

    const regexPattern = patternNorm
        .replace(/:[a-zA-Z0-9_]+/g, '[^/]+')
        .replace(/\//g, '\\/');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(actualNorm);
}

async function runCheck() {
    console.log(`\n${BOLD}${CYAN}================================================================${RESET}`);
    console.log(`${BOLD}🔍 TIJARAH API CHECKER - VERIFIKASI ENDPOINT FE VS BE${RESET}`);
    console.log(`${BOLD}${CYAN}================================================================${RESET}`);
    console.log(`${GRAY}Target Backend: ${BE_URL}${RESET}\n`);

    let backendRoutes: Array<{ method: string; path: string }> = [];

    try {
        const metaRes = await fetch(`${BE_URL}/meta/routes`, {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(3000),
        });

        if (metaRes.ok) {
            const data: any = await metaRes.json();
            backendRoutes = data.routes || [];
            console.log(`${GREEN}✔ Berhasil terhubung ke Fastify Backend (${backendRoutes.length} endpoint aktif terdeteksi).${RESET}\n`);
        }
    } catch {
        console.log(`${YELLOW}⚠ Tidak dapat membaca /api/v1/meta/routes langsung.${RESET}`);
        console.log(`${GRAY}  (Pastikan server backend running di ${BE_URL} atau restart backend untuk memuat route meta baru).${RESET}\n`);
    }

    let matchedCount = 0;
    let missingCount = 0;

    console.log(`${BOLD}${'MODULE'.padEnd(14)} ${'METHOD'.padEnd(8)} ${'FRONTEND ENDPOINT'.padEnd(42)} ${'STATUS'}${RESET}`);
    console.log(`${GRAY}-------------------------------------------------------------------------------------${RESET}`);

    for (const ep of ALL_FRONTEND_ENDPOINTS) {
        let isAvailable = false;
        let matchNote = '';

        if (backendRoutes.length > 0) {
            const match = backendRoutes.find(
                (r) => r.method === ep.method && matchesPattern(ep.path, r.path)
            );

            if (match) {
                isAvailable = true;
                matchNote = match.path;
            }
        } else {
            // Mode fallback: uji fetch langsung jika meta routes belum ada
            try {
                const sample = ep.sampleUrl.startsWith('/') ? ep.sampleUrl : '/' + ep.sampleUrl;
                const testRes = await fetch(`${BE_URL}${sample}`, {
                    method: ep.method,
                    signal: AbortSignal.timeout(2000),
                });

                if (testRes.status !== 404) {
                    isAvailable = true;
                    matchNote = `HTTP ${testRes.status}`;
                }
            } catch {
                isAvailable = false;
            }
        }

        const modCol = ep.module.padEnd(14);
        const methCol = ep.method.padEnd(8);
        const pathCol = ep.path.padEnd(42);

        if (isAvailable) {
            matchedCount++;
            console.log(`${modCol} ${methCol} ${pathCol} ${GREEN}✔ TERSEDIA${RESET} ${GRAY}(${matchNote})${RESET}`);
        } else {
            missingCount++;
            console.log(`${modCol} ${methCol} ${pathCol} ${RED}✖ 404 NOT FOUND${RESET}`);
        }
    }

    console.log(`${GRAY}-------------------------------------------------------------------------------------${RESET}`);
    console.log(`\n${BOLD}📊 HASIL PEMERIKSAAN:${RESET}`);
    console.log(`  Total Endpoint Diperiksa : ${ALL_FRONTEND_ENDPOINTS.length}`);
    console.log(`  ${GREEN}✔ Tersedia di Backend   : ${matchedCount}${RESET}`);
    if (missingCount > 0) {
        console.log(`  ${RED}✖ Hilang / Belum Ada BE : ${missingCount}${RESET}`);
        console.log(`\n${YELLOW}👉 Rekomendasi: Daftarkan endpoint yang hilang di router backend terkait.${RESET}`);
    } else {
        console.log(`\n${GREEN}${BOLD}🎉 Seluruh API Endpoint Frontend 100% Sesuai dan Tersedia di Backend!${RESET}`);
    }
    console.log('');
}

runCheck().catch((err) => {
    console.error('Pemeriksaan gagal:', err);
    process.exit(1);
});

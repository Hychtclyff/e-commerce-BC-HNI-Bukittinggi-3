import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { env } from './env';

/**
 * Konfigurasi Axios Client Instance terpusat untuk HTTP Request eksternal (misalnya HSIS HNI API)
 */
const rawBaseUrl = (env.URL_HSIS_API || process.env.URL_HSIS_API || 'https://hsis.hni.net/api/v1').trim().replace(/\/+$/, '');

export const axiosClient: AxiosInstance = axios.create({
    baseURL: rawBaseUrl,
    timeout: 15000, // 15 detik timeout
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

let runtimeHsisToken: string | null = null;
let runtimeHsisCookie: string | null = null;

export function setRuntimeHsisAuth(token: string | null, cookie?: string | null) {
    runtimeHsisToken = token ? token.replace(/"/g, '').trim() : null;
    runtimeHsisCookie = cookie ? cookie.trim() : null;
    if (runtimeHsisToken) {
        process.env.token_HNI = runtimeHsisToken;
    }
}

export function getRuntimeHsisAuth() {
    const rawToken = runtimeHsisToken || env.token_HNI || process.env.token_HNI || '';
    const cleanToken = rawToken.replace(/"/g, '').trim();
    return {
        token: cleanToken || null,
        cookie: runtimeHsisCookie || null,
    };
}

// Interceptor Request: Logging & Otorisasi Header
axiosClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const { token: cleanToken, cookie } = getRuntimeHsisAuth();
        if (cleanToken) {
            config.headers.Authorization = cleanToken.startsWith('Bearer ') ? cleanToken : `Bearer ${cleanToken}`;
        }
        if (cookie) {
            config.headers.Cookie = cookie;
        }
        if (config.url && !/^https?:\/\//i.test(config.url) && !config.url.startsWith('/')) {
            config.url = `/${config.url}`;
        }
        if (env.NODE_ENV === 'development') {
            console.log(`🌐 [Axios Request] ${config.method?.toUpperCase()} ${config.baseURL || ''}${config.url}`);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor Response: Logging Error & Pengolahan Respon
axiosClient.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    (error) => {
        if (error.response) {
            console.error(`❌ [Axios Response Error] Status ${error.response.status}:`, error.response.data);
        } else if (error.request) {
            console.error(`❌ [Axios Network Error] Tidak ada respon dari server target:`, error.message);
        } else {
            console.error(`❌ [Axios Request Error] Gagal menyiapkan request:`, error.message);
        }
        return Promise.reject(error);
    }
);

/**
 * Helper factory untuk membuat custom Axios Instance jika dibutuhkan ke service lain
 */
export const createAxiosClient = (baseURL: string, customHeaders: Record<string, string> = {}): AxiosInstance => {
    return axios.create({
        baseURL,
        timeout: 15000,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': env.token_HNI,
            ...customHeaders,
        },
    });
};

'use client';

import { toast as sonnerToast } from 'sonner';

/**
 * Toast utility wrapper with success, error, warning, info variants
 * Uses Sonner for beautiful toast notifications
 */

type ToastOptions = {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
};

/**
 * Show success toast notification
 */
const showSuccess = (title: string, description?: string, options?: ToastOptions) => {
  sonnerToast.success(title, {
    description,
    duration: options?.duration || 5000,
    position: options?.position || 'top-right',
  });
};

/**
 * Show error toast notification
 */
const showError = (title: string, description?: string, options?: ToastOptions) => {
  sonnerToast.error(title, {
    description,
    duration: options?.duration || 7000,
    position: options?.position || 'top-right',
  });
};

/**
 * Show warning toast notification
 */
const showWarning = (title: string, description?: string, options?: ToastOptions) => {
  sonnerToast.warning(title, {
    description,
    duration: options?.duration || 6000,
    position: options?.position || 'top-right',
  });
};

/**
 * Show info toast notification
 */
const showInfo = (title: string, description?: string, options?: ToastOptions) => {
  sonnerToast.info(title, {
    description,
    duration: options?.duration || 5000,
    position: options?.position || 'top-right',
  });
};

/**
 * Main toast object with all notification types
 */
export const toast = {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
};

/**
 * Alternative export name for backward compatibility
 */
export const showToast = {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
};

/**
 * Handle API error with formatted message
 * Extracts error details from axios response and displays appropriate toast
 */
export const handleApiError = (error: any, defaultTitle: string = 'Terjadi Kesalahan') => {
  let title = defaultTitle;
  let description = error?.response?.data?.message || error?.message || 'Silakan coba lagi nanti.';

  // Parse error details if available
  if (error?.response?.data?.errors) {
    const fieldErrors = error.response.data.errors;
    if (typeof fieldErrors === 'string') {
      description = fieldErrors;
    } else if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
      description = fieldErrors
        .map((e: any) => e.message || e)
        .join(', ');
    }
  }

  // For HTTP errors - set appropriate title and message
  if (error?.response?.status) {
    switch (error.response.status) {
      case 400:
        title = 'Permintaan Tidak Valid';
        break;
      case 401:
        title = 'Tidak Terautentikasi';
        description = 'Silakan login kembali';
        break;
      case 403:
        title = 'Akses Ditolak';
        description = 'Anda tidak memiliki hak akses ke sumber daya ini';
        break;
      case 404:
        title = 'Data Tidak Ditemukan';
        break;
      case 429:
        title = 'Terlalu Banyak Permintaan';
        description = 'Terlalu banyak request. Silakan tunggu sebentar.';
        break;
      case 500:
        title = 'Error Server';
        description = 'Terjadi kesalahan pada server. Silakan coba lagi nanti.';
        break;
      default:
        title = 'Error';
    }
  }

  toast.error(title, description);
};

// Export default for convenience
export default toast;
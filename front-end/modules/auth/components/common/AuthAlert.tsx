"use client";

import { useSearchParams } from "next/navigation";

/**
 * Membaca `?error=...` dan `?success=...` dari URL
 * dan menampilkan alert yang sesuai.
 */
export function AuthAlert() {
    const params = useSearchParams();
    const error = params.get("error");
    const success = params.get("success");

    if (!error && !success) return null;

    const errorMessages: Record<string, string> = {
        "Invalid login credentials": "Email atau kata sandi tidak sesuai.",
        "Email not confirmed": "Email belum dikonfirmasi. Cek kotak masuk Anda.",
        "User already registered": "Email ini sudah terdaftar. Silakan masuk.",
        "google-oauth-failed": "Gagal masuk dengan Google. Coba lagi.",
        "oauth-callback-failed": "Proses autentikasi gagal. Coba lagi.",
        "email-required": "Alamat email diperlukan untuk mengirim ulang verifikasi.",
        "For security purposes, you can only request this after":
            "Harap tunggu beberapa menit sebelum meminta email verifikasi lagi.",
    };

    const successMessages: Record<string, string> = {
        "check-email":
            "✅ Akun berhasil dibuat! Cek email Anda untuk verifikasi sebelum masuk.",
        "email-resent":
            "✅ Email verifikasi berhasil dikirim ulang. Periksa kotak masuk Anda.",
        "email-verified":
            "✅ Email Anda berhasil diverifikasi! Selamat datang kembali.",
        "login-success":
            "✅ Berhasil masuk ke akun Anda.",
    };

    const errorText =
        error
            ? (errorMessages[decodeURIComponent(error)] ?? decodeURIComponent(error))
            : null;
    const successText =
        success ? (successMessages[success] ?? success) : null;

    if (errorText) {
        return (
            <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-status-danger/30 bg-status-danger/10 px-4 py-3 text-sm text-status-danger"
            >
                <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span>{errorText}</span>
            </div>
        );
    }

    if (successText) {
        return (
            <div
                role="status"
                className="flex items-start gap-2.5 rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-3 text-sm text-status-success"
            >
                <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span>{successText}</span>
            </div>
        );
    }

    return null;
}

export default AuthAlert;

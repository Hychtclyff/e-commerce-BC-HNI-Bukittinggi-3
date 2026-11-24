"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { ArrowLeft, KeyRound } from "lucide-react";
import { authService } from "@/modules/auth/services/auth.service";
import { AuthCardWrapper } from "@/modules/auth/components/common/AuthCardWrapper";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahAlert } from "@/components/atom/tijarahAlert";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const isEn = locale === "en";
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!token) {
      setErrorMsg(isEn ? "Reset token is missing." : "Token reset password tidak ditemukan.");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg(isEn ? "Password must be at least 6 characters." : "Password minimal 6 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg(isEn ? "Passwords do not match." : "Konfirmasi password tidak cocok.");
      return;
    }

    setIsPending(true);
    try {
      const res = await authService.resetPassword(token, newPassword);
      setSuccessMsg(
        res?.message ||
          (isEn ? "Password updated successfully." : "Password berhasil diperbarui. Mengarahkan ke halaman login...")
      );
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          (isEn ? "Failed to reset password." : "Gagal mengatur ulang password.")
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-4">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-primary-sage transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isEn ? "Back to Sign In" : "Kembali ke Halaman Masuk"}</span>
        </Link>

        <AuthCardWrapper>
          <div className="mb-6 space-y-1.5">
            <h1 className="text-xl font-bold text-text-primary">
              {isEn ? "Create New Password" : "Buat Password Baru"}
            </h1>
            <p className="text-xs text-text-muted leading-relaxed">
              {isEn
                ? "Enter your new password to secure your Tijarah account."
                : "Masukkan password baru untuk mengamankan akun Tijarah Anda."}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {successMsg && (
              <TijarahAlert
                tijarahVariant="success"
                title={isEn ? "Success" : "Berhasil"}
                description={successMsg}
              />
            )}
            {errorMsg && (
              <TijarahAlert
                tijarahVariant="danger"
                title={isEn ? "Error" : "Gagal"}
                description={errorMsg}
              />
            )}

            <TijarahInput
              id="reset-new-password"
              type="password"
              label={isEn ? "New Password" : "Password Baru"}
              placeholder="Minimal 6 karakter"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              tijarahVariant="primary"
              radius="lg"
            />

            <TijarahInput
              id="reset-confirm-password"
              type="password"
              label={isEn ? "Confirm Password" : "Konfirmasi Password"}
              placeholder="Ulangi password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              tijarahVariant="primary"
              radius="lg"
            />

            <TijarahButton
              type="submit"
              tijarahVariant="primary"
              isLoading={isPending}
              className="w-full font-bold rounded-xl py-3 flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isEn ? "Save New Password" : "Simpan Password Baru"}</span>
            </TijarahButton>
          </form>
        </AuthCardWrapper>
      </div>
    </div>
  );
}

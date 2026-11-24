"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { ArrowLeft, MailCheck } from "lucide-react";
import { authService } from "@/modules/auth/services/auth.service";
import { AuthCardWrapper } from "@/modules/auth/components/common/AuthCardWrapper";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahAlert } from "@/components/atom/tijarahAlert";

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const isEn = locale === "en";
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [submittedMsg, setSubmittedMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsPending(true);
    setErrorMsg(null);
    setSubmittedMsg(null);
    try {
      const res = await authService.forgotPassword(email.trim());
      setSubmittedMsg(
        res?.message ||
          (isEn
            ? "If the email is registered, a password reset link has been sent."
            : "Jika email terdaftar, tautan reset password telah dikirim ke kotak masuk Anda.")
      );
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          (isEn ? "Failed to send reset link." : "Gagal mengirim tautan reset password.")
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
              {isEn ? "Forgot Password" : "Lupa Password"}
            </h1>
            <p className="text-xs text-text-muted leading-relaxed">
              {isEn
                ? "Enter your registered email address to receive a password reset link."
                : "Masukkan alamat email terdaftar Anda untuk menerima tautan reset password."}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {submittedMsg && (
              <TijarahAlert
                tijarahVariant="success"
                title={isEn ? "Email Sent" : "Tautan Terkirim"}
                description={submittedMsg}
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
              id="forgot-email"
              type="email"
              label={isEn ? "Email Address" : "Alamat Email"}
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              <MailCheck className="w-4 h-4" />
              <span>{isEn ? "Send Reset Link" : "Kirim Tautan Reset"}</span>
            </TijarahButton>
          </form>
        </AuthCardWrapper>
      </div>
    </div>
  );
}

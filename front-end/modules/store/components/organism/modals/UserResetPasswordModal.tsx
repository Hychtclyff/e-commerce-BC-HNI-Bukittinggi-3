"use client";

import React, { useState } from "react";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { KeyRound, Copy, Check, ShieldAlert } from "lucide-react";

interface UserResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any | null;
  onReset: (userId: string, newPassword: string) => Promise<void>;
  isLoading?: boolean;
}

export const UserResetPasswordModal: React.FC<UserResetPasswordModalProps> = ({
  isOpen,
  onClose,
  user,
  onReset,
  isLoading = false,
}) => {
  const [newPassword, setNewPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  const handleCopy = () => {
    if (newPassword) {
      navigator.clipboard.writeText(newPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPassword.trim() || newPassword.trim().length < 6) return;

    await onReset(user.id, newPassword.trim());
    setNewPassword("");
    onClose();
  };

  return (
    <TijarahModal
      isOpen={isOpen}
      onClose={onClose}
      title="Reset Kata Sandi Akun"
      description={`Pengguna: ${user?.fullName || "Pengguna"}`}
      maxWidth="md"
      showCloseIcon
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Admin dapat mereset kata sandi akun secara langsung. Berikan kata sandi baru ini kepada pengguna yang bersangkutan.
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-text-primary">
              Kata Sandi Baru <span className="text-status-danger">*</span>
            </label>
            <button
              type="button"
              onClick={generateRandomPassword}
              className="text-[11px] font-bold text-primary-sage hover:underline cursor-pointer"
            >
              Generate Acak
            </button>
          </div>

          <div className="flex gap-2">
            <TijarahInput
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
            />
            {newPassword && (
              <TijarahButton
                type="button"
                heroVariant="outline"
                size="sm"
                onClick={handleCopy}
                className="px-2.5 shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-status-success" /> : <Copy className="w-4 h-4" />}
              </TijarahButton>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
          <TijarahButton type="button" heroVariant="outline" size="sm" onClick={onClose} isDisabled={isLoading}>
            Batal
          </TijarahButton>
          <TijarahButton
            type="submit"
            tijarahVariant="primary"
            size="sm"
            isDisabled={isLoading || newPassword.trim().length < 6}
            className="font-bold"
          >
            Simpan Kata Sandi
          </TijarahButton>
        </div>
      </form>
    </TijarahModal>
  );
};

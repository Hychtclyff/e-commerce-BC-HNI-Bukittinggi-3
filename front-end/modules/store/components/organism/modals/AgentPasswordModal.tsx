"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { passwordSchema, type PasswordFormData } from "../../../schemas/store.schema";
import type { StoreAgent } from "../../../types/store.types";
import { KeyRound, RefreshCw, Copy, Check, ShieldAlert } from "lucide-react";
import { showToast } from "@/utils/toast";

export interface IAgentPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: StoreAgent | null;
  onSetPassword: (id: string, newPass: string) => Promise<any>;
  onResetPassword: (id: string) => Promise<any>;
  isLoading: boolean;
}

export const AgentPasswordModal: React.FC<IAgentPasswordModalProps> = ({
  isOpen,
  onClose,
  agent,
  onSetPassword,
  onResetPassword,
  isLoading,
}) => {
  const [copied, setCopied] = useState(false);
  const [generatedPass, setGeneratedPass] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any, any, PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  if (!agent) return null;

  const handleManualSubmit = async (data: PasswordFormData) => {
    await onSetPassword(agent.id, data.newPassword);
    reset();
    setGeneratedPass(null);
    onClose();
  };

  const handleQuickReset = async () => {
    const res = await onResetPassword(agent.id);
    if (res?.temporaryPassword) {
      setGeneratedPass(res.temporaryPassword);
    }
  };

  const handleCopyPassword = () => {
    if (!generatedPass) return;
    navigator.clipboard.writeText(generatedPass);
    setCopied(true);
    showToast.success("Tersalin", "Password sementara telah disalin ke clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TijarahModal
      isOpen={isOpen}
      onClose={() => {
        reset();
        setGeneratedPass(null);
        onClose();
      }}
      title={`Manajemen Password #${agent.name}`}
      description="Atur ulang kata sandi akun operasional kasir, gudang, atau staf admin."
      showCancelButton={false}
      closeButtonText="Tutup"
      maxWidth="md"
    >
      <div className="space-y-4 pt-1">
        {/* Info Box Akun */}
        <div className="p-3 bg-canvas rounded-xl border border-border-subtle flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-text-primary block">{agent.name}</span>
            <span className="text-text-muted">
              ID HNI: {agent.hniMemberId || "-"} • Peran: {agent.role}
            </span>
          </div>
          <span className="text-[10px] text-text-muted">
            Status: <strong className="text-status-success">{agent.status}</strong>
          </span>
        </div>

        {/* Opsi 1: Reset Cepat & Generate Password Baru */}
        <div className="p-3.5 rounded-xl bg-primary-sage/10 border border-primary-sage/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-primary-sage" />
              Reset Otomatis (Generate Password Acak)
            </span>

            <TijarahButton
              type="button"
              heroVariant="outline"
              size="sm"
              isLoading={isLoading}
              onClick={handleQuickReset}
              className="text-xs font-bold px-2.5 h-7 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Acak</span>
            </TijarahButton>
          </div>

          {generatedPass ? (
            <div className="p-2.5 rounded-lg bg-surface border border-border-subtle flex items-center justify-between mt-2">
              <div>
                <span className="text-[10px] text-text-muted block">Password Sementara Baru:</span>
                <span className="font-mono text-sm font-black text-primary-sage tracking-wider">
                  {generatedPass}
                </span>
              </div>

              <TijarahButton
                type="button"
                heroVariant="ghost"
                size="sm"
                onClick={handleCopyPassword}
                className="text-xs px-2 h-7 font-bold text-text-primary flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Tersalin" : "Salin"}</span>
              </TijarahButton>
            </div>
          ) : (
            <p className="text-[11px] text-text-muted leading-relaxed">
              Klik &quot;Reset Acak&quot; untuk membuat password baru yang aman. Agen wajib mengganti kata sandi saat pertama login.
            </p>
          )}
        </div>

        {/* Pemisah atau */}
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-text-muted tracking-wider">
          <div className="flex-1 h-px bg-border-subtle" />
          <span>Atau Tentukan Manual</span>
          <div className="flex-1 h-px bg-border-subtle" />
        </div>

        {/* Opsi 2: Form Input Password Baru Manual */}
        <form onSubmit={handleSubmit(handleManualSubmit)} className="space-y-3">
          <div>
            <TijarahInput
              type="password"
              label="Password Baru*"
              placeholder="Minimal 8 karakter (huruf besar, kecil, angka)"
              {...register("newPassword")}
              isInvalid={!!errors.newPassword}
              errorMessage={errors.newPassword?.message as string}
              className="text-xs"
            />
          </div>

          <div>
            <TijarahInput
              type="password"
              label="Konfirmasi Password Baru*"
              placeholder="Ulangi password baru"
              {...register("confirmPassword")}
              isInvalid={!!errors.confirmPassword}
              errorMessage={errors.confirmPassword?.message as string}
              className="text-xs"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <TijarahButton
              type="submit"
              tijarahVariant="primary"
              size="sm"
              isLoading={isLoading}
              className="text-xs px-4 h-9 font-bold"
            >
              Simpan Password Baru
            </TijarahButton>
          </div>
        </form>
      </div>
    </TijarahModal>
  );
};

export default AgentPasswordModal;

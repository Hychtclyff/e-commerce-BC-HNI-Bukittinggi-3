"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { TijarahTabs, TijarahTabList, TijarahTab } from "@/components/atom/tijarahTabs";
import { TijarahTextArea } from "@/components/atom/tijarahTextArea";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { storeApi } from "../../../api/store.api";
import { showToast } from "@/utils/toast";
import { ExternalLink, KeyRound, ShieldCheck } from "lucide-react";

export interface IHsisConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: () => void;
}

export const HsisConnectModal: React.FC<IHsisConnectModalProps> = ({
  isOpen,
  onClose,
  onConnected,
}) => {
  const locale = useLocale();
  const isEn = locale === "en";

  const [tab, setTab] = useState<"interactive" | "manual">("interactive");
  const [launchingBrowser, setLaunchingBrowser] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [cookieInput, setCookieInput] = useState("");
  const [savingManual, setSavingManual] = useState(false);

  const handleLaunchInteractiveWindow = async () => {
    setLaunchingBrowser(true);
    try {
      const res = await storeApi.runHsisAutoLogin();
      if (res.success) {
        showToast.success(
          isEn ? "HSIS Connected" : "HSIS Terhubung",
          res.message ||
            (isEn
              ? "Bearer token captured and saved to database."
              : "Token Bearer HSIS berhasil ditangkap dan disimpan.")
        );
        onConnected();
        onClose();
      } else {
        showToast.error(
          isEn ? "Capture Failed" : "Gagal Menangkap Token",
          res.output ||
            (isEn
              ? "Please try again or use Manual Token."
              : "Silakan coba lagi atau gunakan tab Tempel Token Manual.")
        );
      }
    } catch (err: any) {
      showToast.error(isEn ? "Error" : "Gagal", err?.message || "Gagal membuka window login HSIS.");
    } finally {
      setLaunchingBrowser(false);
    }
  };

  const handleSaveManualToken = async () => {
    if (!tokenInput.trim()) {
      showToast.error(
        isEn ? "Token Required" : "Token Wajib Diisi",
        isEn ? "Paste your HSIS Bearer token first." : "Tempel Bearer Token HSIS terlebih dahulu."
      );
      return;
    }
    setSavingManual(true);
    try {
      const res = await storeApi.saveHsisToken(tokenInput.trim(), cookieInput.trim() || undefined);
      showToast.success(isEn ? "Token Saved" : "Token Disimpan", res.message);
      setTokenInput("");
      setCookieInput("");
      onConnected();
      onClose();
    } catch (err: any) {
      showToast.error(isEn ? "Failed" : "Gagal", err?.message || "Gagal menyimpan token HSIS.");
    } finally {
      setSavingManual(false);
    }
  };

  return (
    <TijarahModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEn ? "Connect HSIS Session & Token" : "Hubungkan Sesi & Token HSIS"}
      description={
        isEn
          ? "Authenticate with HSIS HNI to enable real-time sales sync, balance check, and TP posting."
          : "Hubungkan akun HSIS HNI agar sinkronisasi penjualan, cek saldo, dan posting poin TP berjalan otomatis."
      }
      confirmText={
        tab === "interactive"
          ? isEn
            ? "Open HSIS Login Window"
            : "Buka Window Login HSIS"
          : isEn
            ? "Save Token"
            : "Simpan & Aktifkan Token"
      }
      confirmVariant="primary"
      isConfirmLoading={tab === "interactive" ? launchingBrowser : savingManual}
      onConfirm={tab === "interactive" ? handleLaunchInteractiveWindow : handleSaveManualToken}
      showCancelButton
      cancelText={isEn ? "Cancel" : "Batal"}
      maxWidth="lg"
    >
      <div className="space-y-4">
        <TijarahTabs
          variant="segmented"
          selectedKey={tab}
          onSelectionChange={(k) => setTab(k as "interactive" | "manual")}
          className="w-full"
        >
          <TijarahTabList>
            <TijarahTab id="interactive">
              <span className="flex items-center gap-1.5 text-xs font-bold">
                <ExternalLink className="w-3.5 h-3.5" />
                {isEn ? "Chrome Login Window" : "Window Login HSIS"}
              </span>
            </TijarahTab>
            <TijarahTab id="manual">
              <span className="flex items-center gap-1.5 text-xs font-bold">
                <KeyRound className="w-3.5 h-3.5" />
                {isEn ? "Manual Token (Postman)" : "Tempel Token Manual"}
              </span>
            </TijarahTab>
          </TijarahTabList>
        </TijarahTabs>

        {tab === "interactive" ? (
          <div className="p-4 rounded-xl border border-primary-sage/30 bg-primary-sage/5 space-y-2.5 text-xs">
            <div className="flex items-center gap-2 font-bold text-text-primary">
              <ShieldCheck className="w-4 h-4 text-primary-sage shrink-0" />
              <span>
                {isEn
                  ? "Interactive Chrome Window (Local PC)"
                  : "Alur Login Window Chrome Kecil (PC Lokal)"}
              </span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-text-muted leading-relaxed">
              <li>
                {isEn
                  ? "Click 'Open HSIS Login Window' below."
                  : "Klik tombol 'Buka Window Login HSIS' di bawah."}
              </li>
              <li>
                {isEn
                  ? "A small Chrome window will open https://hsis.hni.net/login/."
                  : "Window Chrome kecil akan terbuka langsung ke halaman https://hsis.hni.net/login/."}
              </li>
              <li>
                {isEn
                  ? "Enter your Username, Password, and Security Code manually."
                  : "Masukkan Username, Password, dan Security Code CAPTCHA secara manual lalu Submit."}
              </li>
              <li>
                {isEn
                  ? "Once logged in, Tijarah automatically captures the Bearer token and closes the window."
                  : "Setelah berhasil masuk ke dashboard HSIS, sistem otomatis menangkap Bearer Token dan menyimpannya ke database."}
              </li>
            </ol>
            {launchingBrowser && (
              <p className="text-[11px] font-semibold text-primary-sage pt-1">
                {isEn
                  ? "Waiting for login in Chrome window (up to 3 minutes)..."
                  : "Menunggu proses login Anda di window Chrome HSIS (maks. 3 menit)..."}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <TijarahTextArea
              label={isEn ? "HSIS Bearer Token*" : "Bearer Token HSIS*"}
              placeholder={
                isEn
                  ? "Paste Bearer token from Postman or Browser DevTools..."
                  : "Tempel token Bearer HSIS dari Postman atau DevTools..."
              }
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="text-xs font-mono min-h-[84px]"
            />
            <TijarahTextArea
              label={isEn ? "Session Cookie (Optional)" : "Cookie Sesi HSIS (Opsional)"}
              placeholder="PHPSESSID=..."
              value={cookieInput}
              onChange={(e) => setCookieInput(e.target.value)}
              className="text-xs font-mono min-h-[56px]"
            />
          </div>
        )}
      </div>
    </TijarahModal>
  );
};

export default HsisConnectModal;

"use client";

import React from "react";
import { StoreCreditApplication } from "../../../types/store.types";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { TijarahAccordion } from "@/components/atom/tijarahAccordion";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { CreditCard, Check, X, ShieldAlert, CheckCircle2, User } from "lucide-react";
import { useTranslations } from "next-intl";

interface KasbonPanelProps {
  applications: StoreCreditApplication[];
  isLoading: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
}

export const KasbonPanel: React.FC<KasbonPanelProps> = ({
  applications,
  isLoading,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}) => {
  const t = useTranslations("storeErp.credit");

  const pendingApps = applications.filter((a) => a.status === "PENDING");
  const processedApps = applications.filter((a) => a.status !== "PENDING");

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header Panel */}
      <div>
        <h2 className="text-xl font-black text-text-primary tracking-tight">{t("title")}</h2>
        <p className="text-xs text-text-muted mt-0.5">{t("subtitle")}</p>
      </div>

      {/* Info Accordion Kasbon Toko */}
      <TijarahAccordion
        items={[
          {
            id: "kasbon-mechanism",
            icon: <CreditCard className="w-4 h-4 text-primary-sage" />,
            title: "Mekanisme Kasbon B2B Toko (Mitra Agen)",
            subtitle: "Ketentuan tempo pembayaran dan pemotongan otomatis saldo agen HNI",
            content: (
              <p className="leading-relaxed">
                Persetujuan limit kasbon memberikan kelonggaran tempo pembayaran (H+14) bagi agen aktif HNI untuk
                mengambil barang terlebih dahulu di toko BC Anda. Saldo kasbon akan otomatis terpotong saat pesanan dibuat.
              </p>
            ),
          },
        ]}
      />

      {/* Antrean Pengajuan yang Perlu Verifikasi */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
            Menunggu Verifikasi ({pendingApps.length})
          </h3>
        </div>

        {pendingApps.length === 0 ? (
          <TijarahCard tijarahVariant="default" className="p-8 text-center border border-border-subtle">
            <CheckCircle2 className="w-8 h-8 text-status-success mx-auto mb-2" />
            <p className="font-bold text-sm text-text-primary">Tidak Ada Pengajuan Pending</p>
            <p className="text-xs text-text-muted mt-1">Semua pengajuan limit kasbon mitra telah selesai diverifikasi.</p>
          </TijarahCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingApps.map((app) => (
              <TijarahCard
                key={app.id}
                tijarahVariant="default"
                className="p-5 border border-amber-500/40 bg-surface/90 rounded-2xl mac-glass mac-shadow flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-primary-sage" />
                        <span>{app.applicantName}</span>
                      </span>
                      <span className="text-[11px] text-text-muted block mt-0.5">
                        ID HNI: <strong className="text-text-primary">{app.hniMemberId || "-"}</strong> • {app.phoneNumber || "No Telp"}
                      </span>
                    </div>

                    <TijarahBadge tijarahVariant="warning" className="text-[10px] px-2 py-0.5 font-bold">
                      Menunggu Persetujuan
                    </TijarahBadge>
                  </div>

                  <div className="p-3 bg-canvas/70 rounded-xl border border-border-subtle text-xs space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-text-muted">Plafon yang Diajukan:</span>
                      <span className="font-black text-text-primary text-sm">
                        {formatCurrency(app.requestedLimit)}
                      </span>
                    </div>
                    <div className="text-[11px] text-text-muted pt-1 border-t border-border-subtle">
                      <span className="font-semibold text-text-primary">Alasan: </span>
                      {app.reason}
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi Persetujuan */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
                  <TijarahButton
                    type="button"
                    tijarahVariant="danger"
                    size="sm"
                    onClick={() => onReject(app.id)}
                    isLoading={isRejecting}
                    className="text-xs px-3 h-8 font-bold flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Tolak</span>
                  </TijarahButton>

                  <TijarahButton
                    type="button"
                    tijarahVariant="success"
                    size="sm"
                    onClick={() => onApprove(app.id)}
                    isLoading={isApproving}
                    className="text-xs px-3.5 h-8 font-bold flex items-center gap-1 shadow-none"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Setujui Plafon</span>
                  </TijarahButton>
                </div>
              </TijarahCard>
            ))}
          </div>
        )}
      </div>

      {/* Riwayat Pengajuan Sebelumnya */}
      {processedApps.length > 0 && (
        <div className="space-y-3 pt-4">
          <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
            Riwayat Verifikasi ({processedApps.length})
          </h3>

          <TijarahCard tijarahVariant="default" className="border border-border-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border-subtle bg-canvas/60 text-text-muted uppercase text-[10px] tracking-wider font-bold">
                    <th className="py-2.5 px-4">Nama Agen</th>
                    <th className="py-2.5 px-4">ID Anggota HNI</th>
                    <th className="py-2.5 px-4">Limit Plafon</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {processedApps.map((item) => (
                    <tr key={item.id} className="hover:bg-canvas/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-text-primary">{item.applicantName}</td>
                      <td className="py-3 px-4 font-mono">{item.hniMemberId}</td>
                      <td className="py-3 px-4 font-semibold">{formatCurrency(item.requestedLimit)}</td>
                      <td className="py-3 px-4">
                        <TijarahBadge
                          tijarahVariant={item.status === "APPROVED" ? "success" : "danger"}
                          className="text-[10px] px-2 py-0.5 font-bold"
                        >
                          {item.status === "APPROVED" ? "Disetujui" : "Ditolak"}
                        </TijarahBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TijarahCard>
        </div>
      )}
    </div>
  );
};

export default KasbonPanel;

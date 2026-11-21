"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import type { StoreAgent, StoreEsignature, StoreOrder } from "../../../types/store.types";
import type { EsignaturePayload } from "../../../api/store.api";
import { CreateEsignatureModal } from "../modals/CreateEsignatureModal";
import { DeleteConfirmModal } from "../modals/DeleteConfirmModal";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { formatDate } from "@/utils/formatters";
import { QRCodeSVG } from "qrcode.react";
import { downloadSvgAsPng } from "../../../utils/store.utils";
import { showToast } from "@/utils/toast";
import {
  ShieldCheck,
  Plus,
  Download,
  Trash2,
  CheckCircle2,
  QrCode,
  User,
  Clock,
} from "lucide-react";

export interface IEsignaturePanelProps {
  signatures: StoreEsignature[];
  agents?: StoreAgent[];
  orders?: StoreOrder[];
  isLoading: boolean;
  onDownload?: (sig: StoreEsignature) => void;
  onCreateSignature?: (payload: EsignaturePayload) => Promise<any>;
  onDeleteSignature?: (id: string) => Promise<any>;
  isSaving?: boolean;
  isDeleting?: boolean;
}

export const EsignaturePanel: React.FC<IEsignaturePanelProps> = ({
  signatures,
  agents = [],
  onCreateSignature,
  onDeleteSignature,
  isSaving = false,
  isDeleting = false,
}) => {
  const locale = useLocale();
  const isEn = locale === "en";
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSignatureForDelete, setSelectedSignatureForDelete] =
    useState<StoreEsignature | null>(null);

  const handleDownloadQrBarcode = (sig: StoreEsignature) => {
    const svgElement = document.getElementById(`qr-code-${sig.id}`) as SVGSVGElement | null;
    if (svgElement) {
      downloadSvgAsPng(svgElement, `Staff-Signature-${sig.verificationCode}.png`);
      showToast.success(
        isEn ? "Signature QR Downloaded" : "QR Tanda Tangan Diunduh",
        isEn
          ? `Employee signature QR ${sig.verificationCode} is ready.`
          : `QR tanda tangan karyawan ${sig.verificationCode} siap digunakan.`
      );
    } else {
      showToast.success(
        isEn ? "Signature Code Copied" : "Kode Tanda Tangan Disalin",
        isEn
          ? `Authorization code ${sig.verificationCode} is ready.`
          : `Kode otorisasi ${sig.verificationCode} siap digunakan.`
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-black text-text-primary tracking-tight">
              {isEn
                ? "Employee Digital Signature Management"
                : "Manajemen Tanda Tangan Digital Karyawan"}
            </h2>
            <TijarahBadge tijarahVariant="success" className="text-[10px] font-bold">
              SHA-256
            </TijarahBadge>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            {isEn
              ? "Manage authorized staff digital signatures. Every order action automatically records the acting employee's signature."
              : "Kelola tanda tangan digital karyawan toko. Setiap aksi pada pesanan otomatis mencatat tanda tangan petugas yang memproses."}
          </p>
        </div>

        <TijarahButton
          type="button"
          tijarahVariant="primary"
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="text-xs px-3.5 h-9 font-bold flex items-center gap-1.5 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isEn ? "Register Staff Signature" : "Daftarkan Tanda Tangan"}</span>
        </TijarahButton>
      </div>

      {/* Info Policy Banner */}
      <TijarahCard
        tijarahVariant="default"
        className="p-4 border border-primary-sage/30 bg-primary-sage/5 mac-glass mac-shadow rounded-2xl flex items-start gap-3.5"
      >
        <div className="w-10 h-10 rounded-xl bg-primary-sage/15 text-primary-sage flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="text-xs space-y-1">
          <h4 className="font-bold text-text-primary">
            {isEn
              ? "Order Action Authorization Policy"
              : "Kebijakan Otorisasi Aksi Pesanan"}
          </h4>
          <p className="text-text-muted leading-relaxed">
            {isEn
              ? "Employees without an active digital signature are blocked from approving, packing, shipping, completing, or rejecting orders. Once an action is performed, the employee's signature code is stamped onto the order and receipt."
              : "Karyawan yang belum memiliki tanda tangan digital aktif tidak dapat melakukan aksi persetujuan, pengiriman, siap ambil, penyelesaian, atau penolakan pesanan. Saat aksi dilakukan, kode tanda tangan petugas otomatis tercetak pada resi pesanan."}
          </p>
        </div>
      </TijarahCard>

      {/* Grid Employee Signatures */}
      {signatures.length === 0 ? (
        <TijarahCard
          tijarahVariant="default"
          className="p-8 border border-border-subtle rounded-2xl text-center space-y-2"
        >
          <QrCode className="w-8 h-8 text-text-muted mx-auto" />
          <p className="text-sm font-bold text-text-primary">
            {isEn ? "No employee signatures registered yet" : "Belum ada tanda tangan karyawan terdaftar"}
          </p>
          <p className="text-xs text-text-muted">
            {isEn
              ? "Register an employee digital signature to enable order processing."
              : "Daftarkan tanda tangan digital karyawan agar dapat memproses pesanan."}
          </p>
        </TijarahCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {signatures.map((sig) => (
            <TijarahCard
              key={sig.id}
              tijarahVariant="default"
              className="p-5 border border-border-subtle mac-glass mac-shadow rounded-2xl flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                {/* Header Kartu */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-black text-primary-sage tracking-wider block">
                      {sig.verificationCode}
                    </span>
                    <span className="text-[11px] text-text-muted block mt-0.5 font-semibold">
                      {sig.signerName} • {sig.signer}
                    </span>
                  </div>

                  <TijarahBadge tijarahVariant="success" className="text-[10px] font-bold shrink-0">
                    <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                    {isEn ? "Active" : "Aktif"}
                  </TijarahBadge>
                </div>

                {/* Visual QR Digital Signature */}
                <div className="p-3.5 bg-white text-slate-900 rounded-xl border border-slate-200 shadow-inner flex flex-col items-center justify-center gap-2">
                  <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-xs">
                    <QRCodeSVG
                      id={`qr-code-${sig.id}`}
                      value={sig.signatureData || sig.verificationCode}
                      size={110}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <div className="text-center">
                    <span className="font-mono text-[9px] font-bold text-slate-700 tracking-wider block">
                      {sig.verificationCode}
                    </span>
                    <span className="text-[8px] text-slate-500 block uppercase font-semibold">
                      {isEn
                        ? "Authorized Staff E-Signature"
                        : "Tanda Tangan Digital Resmi Petugas"}
                    </span>
                  </div>
                </div>

                {/* Rincian Karyawan */}
                <div className="p-3 bg-canvas/60 rounded-xl border border-border-subtle text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-text-muted flex items-center gap-1">
                      <User className="w-3 h-3 text-primary-sage" />
                      {isEn ? "Employee:" : "Karyawan:"}
                    </span>
                    <span className="font-bold text-text-primary text-right">
                      {sig.signerName} ({sig.signer})
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {isEn ? "Registered:" : "Terdaftar:"}
                    </span>
                    <span>{formatDate(sig.timestamp)}</span>
                  </div>

                  {sig.notes && (
                    <p className="text-[10px] text-text-muted italic pt-1 border-t border-border-subtle/50 mt-1 leading-snug">
                      &quot;{sig.notes}&quot;
                    </p>
                  )}
                </div>
              </div>

              {/* Footer Aksi */}
              <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
                <TijarahButton
                  type="button"
                  tijarahVariant="primary"
                  size="sm"
                  onClick={() => handleDownloadQrBarcode(sig)}
                  className="text-xs px-3 h-8 font-bold flex items-center gap-1 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isEn ? "Download QR" : "Unduh QR"}</span>
                </TijarahButton>

                <TijarahButton
                  type="button"
                  heroVariant="ghost"
                  size="sm"
                  onClick={() => setSelectedSignatureForDelete(sig)}
                  className="text-xs px-2 h-8 font-bold text-status-danger hover:bg-status-danger/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </TijarahButton>
              </div>
            </TijarahCard>
          ))}
        </div>
      )}

      {/* Modal Daftarkan Tanda Tangan Karyawan */}
      <CreateEsignatureModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        agents={agents}
        onSubmit={async (payload) => {
          if (onCreateSignature) {
            await onCreateSignature(payload);
          }
        }}
        isLoading={isSaving}
      />

      {/* Modal Cabut Tanda Tangan */}
      <DeleteConfirmModal
        isOpen={!!selectedSignatureForDelete}
        onClose={() => setSelectedSignatureForDelete(null)}
        onConfirm={async () => {
          if (!selectedSignatureForDelete || !onDeleteSignature) return;
          await onDeleteSignature(selectedSignatureForDelete.id);
          setSelectedSignatureForDelete(null);
        }}
        title={isEn ? "Revoke Staff Digital Signature" : "Cabut Tanda Tangan Digital Karyawan"}
        itemName={
          selectedSignatureForDelete
            ? `${selectedSignatureForDelete.signerName} (${selectedSignatureForDelete.verificationCode})`
            : "Tanda Tangan"
        }
        description={
          isEn
            ? "Revoking this signature will block the employee from performing order actions until a new signature is registered."
            : "Mencabut tanda tangan ini akan memblokir karyawan terkait dari melakukan aksi pesanan hingga tanda tangan baru didaftarkan."
        }
        isLoading={isDeleting}
      />
    </div>
  );
};

export default EsignaturePanel;

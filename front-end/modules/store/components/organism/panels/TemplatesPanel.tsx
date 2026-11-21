"use client";

import React, { useEffect, useMemo, useState } from "react";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahTextArea } from "@/components/atom/tijarahTextArea";
import { StoreReceiptPreview } from "../../molecules/StoreReceiptPreview";
import { showToast } from "@/utils/toast";
import { Printer, Save, CheckCircle2, RefreshCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReceiptTemplateConfig } from "../../../types/store.types";

const STORAGE_KEY = "store_receipt_template";

const defaultTemplate: ReceiptTemplateConfig = {
  storeName: "TIJARAH BC 3 BUKITTINGGI",
  tagline: "Business Center Resmi HNI Halal Network",
  whatsappContact: "081267890123",
  storeAddress: "Jl. Panorama No. 18, Guguk Panjang, Kota Bukittinggi",
  headerNotice: "Produk Halal & BPOM",
  footerNotes:
    "Barang yang sudah dibeli dapat ditukar jika cacat kemasan saat diterima dengan menyertakan video unboxing.",
  greetingMessage: "Terima Kasih Telah Berbelanja di BC 3",
  paperWidth: "80mm",
  showPoints: true,
  showCourier: true,
  showBarcode: true,
  showQrCode: true,
};

export const TemplatesPanel: React.FC = () => {
  const t = useTranslations("storeErp.templates");

  const [template, setTemplate] = useState<ReceiptTemplateConfig>(defaultTemplate);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ReceiptTemplateConfig;
        setTemplate((prev: ReceiptTemplateConfig) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  const previewOrder = useMemo(
    () => ({
      id: "preview",
      orderNumber: "TJ-20261026-001",
      customerName: "Pelanggan Gerai HNI",
      customerPhone: "081287654321",
      customerType: "AGEN" as const,
      totalAmount: 240000,
      totalPoints: 60,
      status: "PENDING" as const,
      paymentMethod: "Kasbon B2B (Tempo H+14)",
      paymentStatus: "PAID" as const,
      shippingMethod: "Kurir J&T Express",
      shippingAddress: "Jl. Sudirman No. 45, Bukittinggi",
      trackingNumber: "JNE-BKT-88492019",
      courierName: "JNE",
      notes: "Mohon segera dikemas ya BC, stok toko saya habis",
      createdAt: new Date().toISOString(),
      items: [
        { id: "i1", productId: "p1", productName: "MHS 100ml", quantity: 4, price: 30000, points: 40 },
        { id: "i2", productId: "p2", productName: "Extra Food 250g", quantity: 2, price: 60000, points: 40 },
      ],
    }),
    []
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(template));
      showToast.success(
        "Template Disimpan",
        "Pengaturan identitas resi thermal dan struk kasir berhasil diperbarui."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setTemplate(defaultTemplate);
    localStorage.removeItem(STORAGE_KEY);
    showToast.success("Direset", "Template sudah dikembalikan ke pengaturan awal.");
  };

  const update = <K extends keyof ReceiptTemplateConfig>(key: K, value: ReceiptTemplateConfig[K]) => {
    setTemplate((prev: ReceiptTemplateConfig) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h2 className="text-xl font-black text-text-primary tracking-tight">{t("title")}</h2>
        <p className="text-xs text-text-muted mt-0.5">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Editor */}
        <TijarahCard tijarahVariant="default" className="p-6 border border-border-subtle space-y-5 shadow-sm">
          <div className="flex items-center gap-3 pb-3 border-b border-border-subtle">
            <div className="w-10 h-10 rounded-xl bg-primary-sage/10 text-primary-sage flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-text-primary">Kustomisasi Struk Thermal 58mm & 80mm</h4>
              <p className="text-xs text-text-muted">Ubah identitas, layout, dan elemen yang ingin ditampilkan pada resi.</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-text-primary">{t("businessName")}</label>
                <TijarahInput
                  value={template.storeName}
                  onChange={(e) => update("storeName", e.target.value)}
                  placeholder="Contoh: TIJARAH BC 3 BUKITTINGGI"
                  className="w-full text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-text-primary">Tagline / Nama Layanan</label>
                <TijarahInput
                  value={template.tagline}
                  onChange={(e) => update("tagline", e.target.value)}
                  placeholder="Contoh: Pusat Herbal HNI Halal Network"
                  className="w-full text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-text-primary">{t("whatsapp")}</label>
                <TijarahInput
                  value={template.whatsappContact}
                  onChange={(e) => update("whatsappContact", e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-text-primary">Pesan Pembuka</label>
                <TijarahInput
                  value={template.greetingMessage || ""}
                  onChange={(e) => update("greetingMessage", e.target.value)}
                  placeholder="Terima kasih..."
                  className="w-full text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-text-primary">Alamat Fisik Toko BC</label>
              <TijarahInput
                value={template.storeAddress}
                onChange={(e) => update("storeAddress", e.target.value)}
                placeholder="Alamat lengkap toko BC untuk pick-up pesanan..."
                className="w-full text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-text-primary">Notices / Header</label>
              <TijarahInput
                value={template.headerNotice || ""}
                onChange={(e) => update("headerNotice", e.target.value)}
                placeholder="Contoh: Produk Halal & BPOM"
                className="w-full text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-text-primary">Catatan Kaki Resi (Footer Memo)</label>
              <TijarahTextArea
                value={template.footerNotes}
                onChange={(e) => update("footerNotes", e.target.value)}
                rows={3}
                placeholder="Tuliskan pesan terima kasih atau syarat retur..."
                className="w-full text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-text-primary">Lebar Kertas</label>
                <select
                  value={template.paperWidth || "80mm"}
                  onChange={(e) => update("paperWidth", e.target.value as ReceiptTemplateConfig["paperWidth"])}
                  className="w-full text-xs h-9 px-3 rounded-lg border border-border-subtle bg-background text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-sage"
                >
                  <option value="58mm">58mm (Thermal kecil)</option>
                  <option value="80mm">80mm (Thermal standar)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-text-primary">Visibilitas Elemen</label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <label className="flex items-center gap-2 text-text-primary cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!template.showPoints}
                      onChange={(e) => update("showPoints", e.target.checked)}
                      className="rounded border-border-subtle text-primary-sage focus:ring-primary-sage"
                    />
                    <span>Tampilkan Poin TP</span>
                  </label>
                  <label className="flex items-center gap-2 text-text-primary cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!template.showCourier}
                      onChange={(e) => update("showCourier", e.target.checked)}
                      className="rounded border-border-subtle text-primary-sage focus:ring-primary-sage"
                    />
                    <span>Resi Kurir</span>
                  </label>
                  <label className="flex items-center gap-2 text-text-primary cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!template.showBarcode}
                      onChange={(e) => update("showBarcode", e.target.checked)}
                      className="rounded border-border-subtle text-primary-sage focus:ring-primary-sage"
                    />
                    <span>Barcode</span>
                  </label>
                  <label className="flex items-center gap-2 text-text-primary cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!template.showQrCode}
                      onChange={(e) => update("showQrCode", e.target.checked)}
                      className="rounded border-border-subtle text-primary-sage focus:ring-primary-sage"
                    />
                    <span>QR Code</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border-subtle flex flex-wrap items-center justify-end gap-2">
            <TijarahButton
              type="button"
              heroVariant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs px-3 h-9"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span className="ml-1.5">Reset</span>
            </TijarahButton>
            <TijarahButton
              type="button"
              tijarahVariant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
              className="text-xs px-4 h-9 font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{t("saveBtn")}</span>
            </TijarahButton>
          </div>
        </TijarahCard>

        {/* Preview */}
        <TijarahCard tijarahVariant="flat" className="p-6 border border-border-subtle shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-text-muted" />
              <span className="text-xs font-bold text-text-primary">Preview Resi</span>
            </div>
            <span className="text-[10px] text-text-muted font-medium">
              Template langsung merender
            </span>
          </div>
          <div className="mt-4 flex justify-center">
            <StoreReceiptPreview order={previewOrder} template={template} />
          </div>
        </TijarahCard>
      </div>
    </div>
  );
};

export default TemplatesPanel;

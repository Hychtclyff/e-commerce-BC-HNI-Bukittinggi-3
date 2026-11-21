"use client";

import React, { useState, useEffect } from "react";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahSelect } from "@/components/atom/tijarahSelect";
import { TijarahSwitch } from "@/components/atom/tijarahSwitch";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { DeleteConfirmModal } from "../modals/DeleteConfirmModal";
import { showToast } from "@/utils/toast";
import { storeApi, DeliveryMethodPayload } from "@/modules/store/api/store.api";
import { StoreDeliveryMethod } from "@/modules/store/types/store.types";
import {
  Truck,
  QrCode,
  ShieldCheck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  KeyRound,
  Store,
  RotateCcw,
} from "lucide-react";

export const VERIFICATION_FLOW_OPTIONS = [
  {
    key: "CASHIER_HANDOVER",
    label: "Verifikasi & Serah Terima Langsung oleh Kasir",
    shortLabel: "Verifikasi Kasir",
    badgeVariant: "secondary" as const,
    description: "Pesanan diambil fisik di counter toko dan diverifikasi oleh kasir via QR / nomor nota.",
  },
  {
    key: "USER_VERIFY_DIRECT",
    label: "Verifikasi Langsung oleh User (Konfirmasi Terima)",
    shortLabel: "Verifikasi User",
    badgeVariant: "primary" as const,
    description: "Pembeli mengonfirmasi paket travel/ekspedisi telah sampai melalui aplikasi atau web.",
  },
  {
    key: "PIN_CONFIRMATION",
    label: "Konfirmasi 6-Digit PIN Keamanan Penerima",
    shortLabel: "PIN 6-Digit",
    badgeVariant: "success" as const,
    description: "Penerima wajib menyebutkan 6 digit PIN otentikasi sebelum paket travel diserahkan.",
  },
];

export const DELIVERY_TYPE_OPTIONS = [
  {
    key: "STORE_PICKUP",
    label: "Ambil Sendiri di Toko (Flow Pickup Kasir)",
    description: "Pesanan diambil di outlet resmi Tijarah BC 3 dan diverifikasi kasir",
  },
  {
    key: "TRAVEL_EXPEDITION",
    label: "Travel & Ekspedisi Dinamis (Rute Khusus & General)",
    description: "Pengiriman antar-kota rute Pasaman, Lubuk Basung, atau rute wilayah lainnya",
  },
];

interface ZoneRateRow {
  city: string;
  district?: string;
  cost: number;
  estimatedTime?: string;
}

interface PanelForm {
  name: string;
  code: string;
  type: string;
  verificationFlow: string;
  destinationArea: string;
  description: string;
  isActive: boolean;
  estimatedTime: string;
  baseCost: number;
  pricingMode: "FLAT" | "ZONE_TABLE" | "PROVIDER_API";
  providerCode: string;
  zoneRates: ZoneRateRow[];
}

export function DeliveryMethodPanel() {
  const [methods, setMethods] = useState<StoreDeliveryMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StoreDeliveryMethod | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [form, setForm] = useState<PanelForm>({
    name: "",
    code: "",
    type: "TRAVEL_EXPEDITION",
    verificationFlow: "USER_VERIFY_DIRECT",
    destinationArea: "",
    description: "",
    isActive: true,
    estimatedTime: "",
    baseCost: 0,
    pricingMode: "FLAT",
    providerCode: "",
    zoneRates: [],
  });

  const loadMethods = async () => {
    setLoading(true);
    try {
      const data = await storeApi.getDeliveryMethods();
      setMethods(data);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMethods();
  }, []);

  const resetForm = () => {
    setForm({
      name: "",
      code: "",
      type: "TRAVEL_EXPEDITION",
      verificationFlow: "USER_VERIFY_DIRECT",
      destinationArea: "",
      description: "",
      isActive: true,
      estimatedTime: "",
      baseCost: 0,
      pricingMode: "FLAT",
      providerCode: "",
      zoneRates: [],
    });
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (method: StoreDeliveryMethod) => {
    setForm({
      name: method.name,
      code: method.code,
      type: method.type,
      verificationFlow: method.verificationFlow,
      destinationArea: method.destinationArea || "",
      description: method.description,
      isActive: method.isActive,
      estimatedTime: method.estimatedTime,
      baseCost: method.baseCost,
      pricingMode: method.pricingMode || "FLAT",
      providerCode: method.providerCode || "",
      zoneRates: Array.isArray(method.zoneRates) ? method.zoneRates : [],
    });
    setEditingId(method.id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const toPayload = (f: PanelForm): DeliveryMethodPayload => ({
    name: f.name,
    code: f.code,
    type: f.type,
    verificationFlow: f.verificationFlow,
    destinationArea: f.destinationArea,
    description: f.description,
    isActive: f.isActive,
    estimatedTime: f.estimatedTime,
    baseCost: f.baseCost,
    pricingMode: f.pricingMode,
    providerCode: f.providerCode,
    zoneRates: f.zoneRates,
  });

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      showToast.error("Validasi Gagal", "Nama dan kode metode pengiriman wajib diisi.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        const res = await storeApi.updateDeliveryMethod(editingId, toPayload(form));
        if (res.success) {
          showToast.success("Berhasil Diperbarui", res.message);
          await loadMethods();
        } else {
          showToast.error("Gagal", res.message);
        }
      } else {
        const res = await storeApi.createDeliveryMethod(toPayload(form));
        if (res.success) {
          showToast.success("Berhasil Ditambahkan", res.message);
          await loadMethods();
        } else {
          showToast.error("Gagal", res.message);
        }
      }
      closeModal();
    } catch (err: any) {
      showToast.error("Terjadi Kesalahan", err?.message || "Gagal menyimpan metode pengiriman.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (method: StoreDeliveryMethod) => {
    setDeleteTarget(method);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await storeApi.deleteDeliveryMethod(deleteTarget.id);
      if (res.success) {
        showToast.success("Berhasil Dihapus", res.message);
        setDeleteTarget(null);
        await loadMethods();
      } else {
        showToast.error("Gagal", res.message);
      }
    } catch (err: any) {
      showToast.error("Terjadi Kesalahan", err?.message || "Gagal menghapus metode pengiriman.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetDefaults = () => {
    setResetModalOpen(true);
  };

  const confirmResetDefaults = async () => {
    setIsResetting(true);
    try {
      const res = await storeApi.resetDeliveryMethods();
      if (res.success) {
        showToast.success("Berhasil Direset", res.message);
        setResetModalOpen(false);
        await loadMethods();
      } else {
        showToast.error("Gagal", res.message);
      }
    } catch (err: any) {
      showToast.error("Terjadi Kesalahan", err?.message || "Gagal mereset metode.");
    } finally {
      setIsResetting(false);
    }
  };

  const toggleStatus = async (method: StoreDeliveryMethod) => {
    if (togglingId === method.id) return;
    setTogglingId(method.id);
    try {
      const nextActive = !method.isActive;
      const res = await storeApi.updateDeliveryMethod(method.id, {
        ...toPayload({
          name: method.name,
          code: method.code,
          type: method.type,
          verificationFlow: method.verificationFlow,
          destinationArea: method.destinationArea || "",
          description: method.description,
          isActive: nextActive,
          estimatedTime: method.estimatedTime,
          baseCost: method.baseCost,
          pricingMode: method.pricingMode || "FLAT",
          providerCode: method.providerCode || "",
          zoneRates: Array.isArray(method.zoneRates) ? method.zoneRates : [],
        }),
      });
      if (res.success) {
        showToast.success("Status Diperbarui", `${method.name} kini ${nextActive ? "aktif" : "non-aktif"}.`);
        await loadMethods();
      } else {
        showToast.error("Gagal", res.message);
      }
    } catch (err: any) {
      showToast.error("Terjadi Kesalahan", err?.message || "Gagal memperbarui status.");
    } finally {
      setTogglingId(null);
    }
  };

  const getFlowMeta = (flowKey: string) => {
    if (flowKey === "CASHIER_HANDOVER" || flowKey === "COUNTER_HANDOVER") {
      return {
        key: "CASHIER_HANDOVER",
        label: "Verifikasi & Serah Terima Langsung oleh Kasir",
        shortLabel: "Verifikasi Kasir",
        badgeVariant: "secondary" as const,
        description: "Pesanan diambil fisik di counter toko dan diverifikasi kasir via nota / QR.",
      };
    }
    return (
      VERIFICATION_FLOW_OPTIONS.find((opt) => opt.key === flowKey) || {
        key: flowKey,
        label: flowKey,
        shortLabel: flowKey,
        badgeVariant: "secondary" as const,
        description: "",
      }
    );
  };

  return (
    <div className="space-y-6">
      {!modalOpen ? (
        <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-text-primary flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary-sage" />
              Manajemen Alur Delivery &amp; Ekspedisi
            </h2>
            <TijarahBadge tijarahVariant="primary" className="text-[10px] font-bold">
              Dynamic Verification Flow
            </TijarahBadge>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Konfigurasi alur verifikasi pesanan dinamis: Scan QR Ganda, Verifikasi Pengguna, Serah Terima Kasir, atau PIN Keamanan 6-Digit.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <TijarahButton
            size="sm"
            tijarahVariant="outline"
            onClick={handleResetDefaults}
            className="font-bold flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary"
            title="Reset ke alur standar Pickup Kasir & Rute Travel Dinamis"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Standar Flow</span>
          </TijarahButton>

          <TijarahButton
            size="sm"
            tijarahVariant="primary"
            onClick={openAddModal}
            className="font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Metode</span>
          </TijarahButton>
        </div>
      </div>

      {/* Grid Metode Pengiriman Modern */}
      {loading ? (
        <div className="text-xs text-text-muted py-12 text-center">Memuat metode pengiriman…</div>
      ) : methods.length === 0 ? (
        <div className="text-xs text-text-muted py-12 text-center border border-dashed border-border-subtle rounded-3xl bg-surface/50">
          Belum ada metode pengiriman. Klik "Tambah Metode" atau "Reset Standar Flow" untuk mulai.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {methods.map((method) => {
            const flowMeta = getFlowMeta(method.verificationFlow);
            const isPickup = method.type === "STORE_PICKUP" || method.code?.includes("PICKUP");

            return (
              <TijarahCard
                key={method.id}
                className="p-5 border border-border-subtle rounded-3xl bg-surface flex flex-col justify-between hover:border-primary-sage/40 transition-colors shadow-xs"
              >
                <div className="space-y-3">
                  {/* Card Header: Nama & Switch Status Aktif */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                          isPickup
                            ? "bg-accent-gold/15 text-accent-gold"
                            : "bg-primary-sage/15 text-primary-sage"
                        }`}
                      >
                        {isPickup ? <Store className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-text-primary leading-tight">
                          {method.name}
                        </h3>
                        <p className="text-[11px] text-text-muted font-mono mt-0.5">
                          {method.code}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[11px] font-medium ${method.isActive ? "text-primary-sage" : "text-text-muted"}`}>
                        {method.isActive ? "Aktif" : "Non-Aktif"}
                      </span>
                      <TijarahSwitch
                        size="sm"
                        isSelected={method.isActive}
                        disabled={togglingId === method.id}
                        onValueChange={() => toggleStatus(method)}
                        aria-label={`Status aktif ${method.name}`}
                      />
                    </div>
                  </div>

                  {/* Deskripsi */}
                  <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
                    {method.description}
                  </p>

                  {/* Badges & Meta Info */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <TijarahBadge
                      tijarahVariant={flowMeta.badgeVariant}
                      className="text-[10px] px-2 py-0.5 font-bold flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      {flowMeta.shortLabel}
                    </TijarahBadge>

                    <TijarahBadge
                      tijarahVariant="primary"
                      className="text-[10px] px-2 py-0.5 font-bold flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3" />
                      Rute: {method.destinationArea || "Semua Area"}
                    </TijarahBadge>

                    <div className="flex items-center gap-1 text-[11px] text-text-muted ml-auto font-medium">
                      <Clock className="w-3.5 h-3.5 text-text-muted" />
                      <span>{method.estimatedTime || "1-2 Hari"}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Tarif Harga & Tombol Edit / Hapus */}
                <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-text-muted block uppercase tracking-wider font-semibold">
                      Tarif Pengiriman
                    </span>
                    <span className="text-base font-black text-text-primary">
                      {method.baseCost > 0
                        ? `Rp ${method.baseCost.toLocaleString("id-ID")}`
                        : "Gratis (Rp 0)"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <TijarahButton
                      size="sm"
                      tijarahVariant="outline"
                      onClick={() => openEditModal(method)}
                      className="h-8 px-2.5 text-xs font-semibold flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-text-muted" />
                      <span className="hidden sm:inline">Edit</span>
                    </TijarahButton>

                    <TijarahButton
                      size="sm"
                      tijarahVariant="outline"
                      onClick={() => handleDelete(method)}
                      className="h-8 w-8 p-0 text-status-error hover:bg-status-error/10 hover:border-status-error/30"
                      title="Hapus Metode"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </TijarahButton>
                  </div>
                </div>
              </TijarahCard>
            );
          })}
        </div>
      )}
        </>
      ) : (
        <TijarahCard
          tijarahVariant="default"
          className="p-6 border border-border-subtle rounded-2xl bg-surface shadow-sm space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle">
            <div>
              <h3 className="text-lg font-black text-text-primary flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary-sage" />
                {editingId ? "Edit Metode Pengiriman" : "Tambah Metode Pengiriman"}
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Atur alur verifikasi, area tujuan, dan skema perhitungan ongkos kirim metode pengantaran secara leluasa.
              </p>
            </div>
            <TijarahButton
              type="button"
              tijarahVariant="outline"
              size="sm"
              onClick={closeModal}
              className="text-xs font-bold self-start sm:self-auto"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Kembali ke Daftar
            </TijarahButton>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="text-xs font-bold text-text-primary block mb-1">Nama Metode</label>
                <TijarahInput
                  placeholder="Contoh: Travel L300 (Regional Bukittinggi - Padang)"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-primary block mb-1">Kode Unik</label>
                <TijarahInput
                  placeholder="L300-REGIONAL"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>

              <div>
                  <label className="text-xs font-bold text-text-primary block mb-1">Estimasi Waktu</label>
                  <TijarahInput
                    placeholder="1 - 2 Hari"
                    value={form.estimatedTime}
                    onChange={(e) => setForm({ ...form, estimatedTime: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-text-primary block mb-1">Biaya Dasar (Rp)</label>
                  <TijarahInput
                    type="number"
                    placeholder="20000"
                    value={String(form.baseCost)}
                    onChange={(e) => setForm({ ...form, baseCost: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-text-primary block mb-1">Tipe Pengiriman</label>
                  <TijarahSelect
                    aria-label="Pilih Tipe Pengiriman"
                    selectedKey={form.type}
                    onSelectionChange={(key) => {
                      if (key) setForm({ ...form, type: String(key) });
                    }}
                    className="w-full text-xs"
                  >
                    {DELIVERY_TYPE_OPTIONS.map((opt) => (
                      <TijarahSelect.Item id={opt.key} key={opt.key} textValue={opt.label}>
                        <div className="py-1 text-left">
                          <span className="font-bold text-xs block text-text-primary">{opt.label}</span>
                          <span className="text-[10px] text-text-muted block">{opt.description}</span>
                        </div>
                      </TijarahSelect.Item>
                    ))}
                  </TijarahSelect>
                </div>

                {/* SELECT ALUR VERIFIKASI DINAMIS (Poin 2) */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-text-primary block mb-1">
                    Alur Verifikasi Dinamis (Verification Flow)
                  </label>
                  <TijarahSelect
                    aria-label="Pilih Alur Verifikasi Dinamis"
                    selectedKey={form.verificationFlow}
                    onSelectionChange={(key) => {
                      if (key) setForm({ ...form, verificationFlow: String(key) });
                    }}
                    className="w-full text-xs font-semibold"
                  >
                    {VERIFICATION_FLOW_OPTIONS.map((opt) => (
                      <TijarahSelect.Item id={opt.key} key={opt.key} textValue={opt.label}>
                        <div className="py-1 text-left flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-text-primary">{opt.label}</span>
                            <TijarahBadge tijarahVariant={opt.badgeVariant} className="text-[9px] px-1.5 py-0.2">
                              {opt.shortLabel}
                            </TijarahBadge>
                          </div>
                          <span className="text-[10px] text-text-muted">{opt.description}</span>
                        </div>
                      </TijarahSelect.Item>
                    ))}
                  </TijarahSelect>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-text-primary block mb-1">
                    Wilayah / Rute Tujuan (Otomatis Dinamis)
                  </label>
                  <TijarahInput
                    placeholder="Contoh: Pasaman, Lubuk Basung, atau kosongkan untuk General"
                    value={form.destinationArea}
                    onChange={(e) => setForm({ ...form, destinationArea: e.target.value })}
                  />
                  <p className="text-[10px] text-text-muted mt-1">
                    Ketik nama kota/kecamatan (misal: "Pasaman" untuk Travel Bintang Terang, "Lubuk Basung" untuk Travel BSW). Sistem akan mencocokkan otomatis ke alamat checkout user.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-text-primary block mb-1">Deskripsi</label>
                  <TijarahInput
                    placeholder="Deskripsi singkat metode pengiriman dan instruksi penyerahan paket..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-bold text-text-primary block mb-1">
                      Mode Kalkulasi Ongkir Dinamis
                    </label>
                    <TijarahSelect
                      selectedKey={form.pricingMode}
                      onSelectionChange={(k) =>
                        setForm({ ...form, pricingMode: (String(k) || "FLAT") as any })
                      }
                      className="text-xs"
                    >
                      <TijarahSelect.Item id="FLAT">Tarif Dasar Flat</TijarahSelect.Item>
                      <TijarahSelect.Item id="ZONE_TABLE">Zona / Kota Tujuan Dinamis</TijarahSelect.Item>
                      <TijarahSelect.Item id="PROVIDER_API">Ekspedisi Nasional (Biteship / Fallback)</TijarahSelect.Item>
                    </TijarahSelect>
                  </div>

                  {form.pricingMode === "PROVIDER_API" && (
                    <div>
                      <label className="text-xs font-bold text-text-primary block mb-1">
                        Kode Kurir Provider (jne, jnt, sicepat)
                      </label>
                      <TijarahInput
                        placeholder="jne"
                        value={form.providerCode}
                        onChange={(e) => setForm({ ...form, providerCode: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                {form.pricingMode === "ZONE_TABLE" && (
                  <div className="sm:col-span-2 p-3 rounded-xl border border-border-subtle bg-canvas/50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary">
                        Daftar Tarif per Kota / Kecamatan Tujuan
                      </span>
                      <TijarahButton
                        type="button"
                        size="sm"
                        tijarahVariant="outline"
                        onClick={() =>
                          setForm({
                            ...form,
                            zoneRates: [
                              ...form.zoneRates,
                              { city: "", district: "", cost: form.baseCost || 20000, estimatedTime: "1-2 Hari" },
                            ],
                          })
                        }
                        className="text-[11px] h-7 px-2.5 rounded-lg flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tambah Zona</span>
                      </TijarahButton>
                    </div>
                    {form.zoneRates.length === 0 ? (
                      <p className="text-[11px] text-text-muted">
                        Belum ada zona khusus. Klik Tambah Zona untuk menetapkan ongkir per kota tujuan.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {form.zoneRates.map((zr, idx) => (
                          <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                            <div className="sm:col-span-4">
                              <TijarahInput
                                placeholder="Kota (mis. Pasaman)"
                                value={zr.city}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    zoneRates: form.zoneRates.map((row, i) =>
                                      i === idx ? { ...row, city: e.target.value } : row
                                    ),
                                  })
                                }
                                className="text-xs"
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <TijarahInput
                                placeholder="Kecamatan (opsional)"
                                value={zr.district || ""}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    zoneRates: form.zoneRates.map((row, i) =>
                                      i === idx ? { ...row, district: e.target.value } : row
                                    ),
                                  })
                                }
                                className="text-xs"
                              />
                            </div>
                            <div className="sm:col-span-4">
                              <TijarahInput
                                type="number"
                                placeholder="Ongkir (Rp)"
                                value={String(zr.cost)}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    zoneRates: form.zoneRates.map((row, i) =>
                                      i === idx ? { ...row, cost: Number(e.target.value) || 0 } : row
                                    ),
                                  })
                                }
                                className="text-xs"
                              />
                            </div>
                            <div className="sm:col-span-1 flex justify-end">
                              <TijarahButton
                                type="button"
                                heroVariant="ghost"
                                size="sm"
                                onClick={() =>
                                  setForm({
                                    ...form,
                                    zoneRates: form.zoneRates.filter((_, i) => i !== idx),
                                  })
                                }
                                className="p-1.5 h-8 w-8 min-w-0 text-status-danger hover:bg-status-danger/10 rounded-md"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </TijarahButton>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 sm:col-span-2 lg:col-span-3 p-3 rounded-xl border border-border-subtle bg-canvas/50">
                  <span className="text-xs font-bold text-text-primary">
                    Aktifkan metode ini di sistem kasir dan checkout toko
                  </span>
                  <TijarahSwitch
                    isSelected={form.isActive}
                    onValueChange={(val) => setForm({ ...form, isActive: val })}
                    size="sm"
                    aria-label="Aktifkan metode pengiriman"
                  />
                </div>
              </div>
            </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
            <TijarahButton
              type="button"
              tijarahVariant="outline"
              size="sm"
              onClick={closeModal}
              className="text-xs font-bold"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Batal
            </TijarahButton>
            <TijarahButton
              type="button"
              tijarahVariant="primary"
              size="sm"
              isLoading={isSaving}
              onClick={handleSave}
              className="text-xs font-bold shadow-sm"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              {editingId ? "Perbarui Metode" : "Simpan Metode"}
            </TijarahButton>
          </div>
        </TijarahCard>
      )}

      {/* Modal Konfirmasi Hapus (Komponen Tijarah) */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Hapus Metode Pengiriman"
        itemName={deleteTarget?.name || "Metode Pengiriman"}
        description="Metode pengiriman yang dihapus tidak akan muncul lagi di halaman kasir dan checkout pelanggan."
        isLoading={isDeleting}
      />

      {/* Modal Konfirmasi Reset Default (Komponen Tijarah) */}
      <TijarahModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Reset Standar 2-Flow"
        description="Seluruh metode pengiriman akan dikembalikan ke standar 2-flow (Ambil di Toko & Travel Dinamis). Perubahan kustom sebelumnya akan tertimpa."
        confirmText="Ya, Reset Standar"
        confirmVariant="danger"
        isConfirmLoading={isResetting}
        onConfirm={confirmResetDefaults}
        showCancelButton
        cancelText="Batal"
        maxWidth="sm"
      />
    </div>
  );
}

export default DeliveryMethodPanel;
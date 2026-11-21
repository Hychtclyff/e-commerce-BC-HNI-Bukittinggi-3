"use client";

import React, { useState, useEffect } from "react";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahTabs } from "@/components/atom/tijarahTabs";
import { storeApi } from "@/modules/store/api/store.api";
import type {
  StoreRestockRecommendation,
  StoreStockVelocity,
  StoreDiseaseTrend,
} from "../../../types/store.types";
import { showToast } from "@/utils/toast";
import { formatCurrency, formatDate } from "@/utils/formatters";
import {
  Boxes,
  TrendingUp,
  Flame,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  ScanBarcode,
  Search,
  ShoppingCart,
  Plus,
  RefreshCw,
  Clock,
  ArrowLeft,
  ArrowRight,
  PackageCheck,
  Layers,
  Activity,
  FileCheck2,
  Camera,
} from "lucide-react";
import { CameraBarcodeScannerModal } from "../../molecules/CameraBarcodeScannerModal";

export interface IProductOrderManagementPanelProps {
  velocity: StoreStockVelocity[];
  recommendations: StoreRestockRecommendation[];
  diseaseTrends?: StoreDiseaseTrend[];
  isLoading: boolean;
}

export const ProductOrderManagementPanel: React.FC<IProductOrderManagementPanelProps> = ({
  velocity,
  recommendations,
  diseaseTrends = [],
  isLoading: isParentLoading,
}) => {
  const [activeTab, setActiveTab] = useState<"po-list" | "disease-trends" | "velocity">(
    "po-list"
  );
  const [isCheckingReceive, setIsCheckingReceive] = useState(false);

  // HSIS Purchase Orders State
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [isLoadingPo, setIsLoadingPo] = useState(false);
  const [selectedPoForReceive, setSelectedPoForReceive] = useState<any | null>(null);

  // HSIS Order Sync State
  const [isSyncingHsis, setIsSyncingHsis] = useState(false);

  // Verifikasi Barang Datang State
  const [receiveMode, setReceiveMode] = useState<"BULK" | "BARCODE">("BULK");
  const [receiveItems, setReceiveItems] = useState<
    Array<{ sku: string; name: string; orderedQty: number; receivedQty: number; damagedQty: number }>
  >([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isSubmittingReceive, setIsSubmittingReceive] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);

  const loadPurchaseOrders = async () => {
    setIsLoadingPo(true);
    try {
      const data = await storeApi.getHsisPurchaseOrders();
      setPurchaseOrders(data);
      if (data.length > 0 && !selectedPoForReceive) {
        setSelectedPoForReceive(data[0]);
      }
    } catch {
      // fallback
    } finally {
      setIsLoadingPo(false);
    }
  };

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  // Update receive items when selected PO changes
  useEffect(() => {
    if (selectedPoForReceive) {
      const raw = Array.isArray(selectedPoForReceive.items) ? selectedPoForReceive.items : [];
      setReceiveItems(
        raw.map((it: any) => ({
          sku: it.sku,
          name: it.name,
          orderedQty: Number(it.orderedQty || 0),
          receivedQty: Number(it.receivedQty || it.orderedQty || 0),
          damagedQty: Number(it.damagedQty || 0),
        }))
      );
    }
  }, [selectedPoForReceive]);

  // Handle Sync to HSIS Order
  const handleSyncHsisOrders = async () => {
    setIsSyncingHsis(true);
    try {
      const res = await storeApi.syncHsisPurchaseOrders();
      if (res.success) {
        showToast.success("Sync to HSIS Order Berhasil", res.message);
        if (res.data && res.data.length > 0) {
          setPurchaseOrders(res.data);
          if (!selectedPoForReceive) {
            setSelectedPoForReceive(res.data[0]);
          }
        } else {
          await loadPurchaseOrders();
        }
      } else {
        showToast.error("Gagal Sinkronisasi", res.message);
      }
    } catch (err: any) {
      showToast.error("Terjadi Kesalahan", err?.message || "Gagal sinkronisasi order HSIS.");
    } finally {
      setIsSyncingHsis(false);
    }
  };

  // Handle Scan Barcode
  const handleScanBarcode = () => {
    if (!barcodeInput.trim()) return;
    const match = receiveItems.find(
      (it) => it.sku.toLowerCase() === barcodeInput.toLowerCase() || it.name.toLowerCase().includes(barcodeInput.toLowerCase())
    );

    if (match) {
      setReceiveItems((prev) =>
        prev.map((it) => (it.sku === match.sku ? { ...it, receivedQty: it.receivedQty + 1 } : it))
      );
      showToast.success("Barcode Terdeteksi", `+1 unit untuk ${match.name}`);
      setBarcodeInput("");
    } else {
      showToast.error("Produk Tidak Sesuai PO", `Barcode/SKU ${barcodeInput} tidak ada dalam daftar PO ini.`);
    }
  };

  const handleCameraScanResult = (scannedText: string) => {
    if (!scannedText || !scannedText.trim()) return;
    const cleanText = scannedText.trim();
    const match = receiveItems.find(
      (it) =>
        it.sku.toLowerCase() === cleanText.toLowerCase() ||
        it.name.toLowerCase().includes(cleanText.toLowerCase())
    );

    if (match) {
      setReceiveItems((prev) =>
        prev.map((it) => (it.sku === match.sku ? { ...it, receivedQty: it.receivedQty + 1 } : it))
      );
      showToast.success("Kamera Terverifikasi", `+1 unit untuk ${match.name} (${match.sku})`);
    } else {
      showToast.warning("Produk Diluar PO", `Barcode ${cleanText} tidak terdaftar di rincian PO ini.`);
    }
  };

  // Handle Konfirmasi Penerimaan & Rekonsiliasi Stok
  const handleConfirmReceiveOrder = async () => {
    if (!selectedPoForReceive) return;

    setIsSubmittingReceive(true);
    try {
      const res = await storeApi.receiveHsisOrder(selectedPoForReceive.id, {
        items: receiveItems.map((it) => ({
          sku: it.sku,
          receivedQty: it.receivedQty,
          damagedQty: it.damagedQty,
        })),
        notes: "Verifikasi barang datang dan rekonsiliasi stok selesai.",
      });

      if (res.success) {
        showToast.success("Rekonsiliasi Selesai", res.message);
        setIsCheckingReceive(false);
        await loadPurchaseOrders();
      } else {
        showToast.error("Gagal", res.message);
      }
    } catch (err: any) {
      showToast.error("Terjadi Kesalahan", err?.message || "Gagal memproses verifikasi barang datang.");
    } finally {
      setIsSubmittingReceive(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* 1. Header Toolbar (Seragam & Tidak Bergeser) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-black text-text-primary tracking-tight">
              Manajemen Pemesanan Produk &amp; Sinkronisasi HSIS
            </h2>
            <TijarahBadge tijarahVariant="primary" className="text-[10px] font-bold">
              HSIS Restock Engine
            </TijarahBadge>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Sistem pengadaan restock ke HSIS Pusat, penerimaan barang fisik (bulk/barcode), rekonsiliasi stok, dan radar tren penyakit lokal.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <TijarahButton
            type="button"
            size="sm"
            tijarahVariant="primary"
            onClick={handleSyncHsisOrders}
            isLoading={isSyncingHsis}
            className="text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer bg-primary-sage hover:bg-primary-sage/90"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingHsis ? "animate-spin" : ""}`} />
            <span>Sync to HSIS Order</span>
          </TijarahButton>
        </div>
      </div>

      {/* 2. Dedicated Tab Switcher */}
      <div className="w-full overflow-x-auto">
        <TijarahTabs
          selectedKey={activeTab}
          onSelectionChange={(key) => {
            setActiveTab(key as "po-list" | "disease-trends" | "velocity");
            if (key !== "po-list") setIsCheckingReceive(false);
          }}
          variant="segmented"
          items={[
            {
              id: "po-list",
              label: `Pemesanan PO (${purchaseOrders.length})`,
              icon: <ShoppingCart className="w-3.5 h-3.5" />,
            },
            {
              id: "disease-trends",
              label: "Tren Penyakit Medsos",
              icon: <Sparkles className="w-3.5 h-3.5 text-accent-gold" />,
            },
            {
              id: "velocity",
              label: "Velocity SKU",
              icon: <TrendingUp className="w-3.5 h-3.5" />,
            },
          ]}
        />
      </div>

      {/* ─── SUB-TAB 1: PEMESANAN PRODUK (PO HSIS SYNC) & CEK BARANG INLINE ─── */}
      {activeTab === "po-list" && !isCheckingReceive && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs text-text-muted font-bold block">
                Riwayat Purchase Order HSIS ({purchaseOrders.length} Pesanan)
              </span>
              <span className="text-[11px] text-text-muted">
                Order disinkronkan langsung dari server HSIS Pusat secara realtime. Klik &ldquo;Cek Barang Datang&rdquo; pada item PO untuk verifikasi fisik.
              </span>
            </div>
          </div>

          <div className="grid gap-3">
            {purchaseOrders.map((po) => {
              const itemsList: any[] = Array.isArray(po.items) ? po.items : [];

              return (
                <TijarahCard key={po.id} className="p-5 border border-border-subtle rounded-3xl bg-surface">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-sm text-text-primary">{po.poNumber}</span>
                        <TijarahBadge
                          tijarahVariant={
                            po.status === "RECONCILED"
                              ? "success"
                              : po.status === "SUBMITTED"
                              ? "primary"
                              : "warning"
                          }
                          className="text-[10px] font-bold"
                        >
                          {po.status === "RECONCILED"
                            ? "Selesai Direkonsiliasi"
                            : po.status === "SUBMITTED"
                            ? "Menunggu Pengiriman Pusat"
                            : po.status}
                        </TijarahBadge>
                      </div>

                      <p className="text-xs text-text-muted">
                        Pemasok: <strong className="text-text-primary">{po.supplier}</strong> • Tanggal:{" "}
                        {formatDate(po.createdAt)}
                      </p>

                      <div className="flex items-center gap-4 text-xs font-semibold text-text-muted">
                        <span>Total Item: <strong className="text-text-primary">{po.totalItems} unit</strong></span>
                        <span>Estimasi Modal PO: <strong className="text-emerald-700">{formatCurrency(po.totalAmount)}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <TijarahButton
                        size="sm"
                        heroVariant="outline"
                        onClick={() => {
                          setSelectedPoForReceive(po);
                          setIsCheckingReceive(true);
                        }}
                        className="text-xs font-bold flex items-center gap-1 text-primary-sage"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>Cek Barang Datang</span>
                      </TijarahButton>
                    </div>
                  </div>

                  {/* Ringkasan Item Pesanan */}
                  {itemsList.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border-subtle/50 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {itemsList.map((it, idx) => (
                        <div key={idx} className="bg-canvas/50 p-2 rounded-xl text-xs flex justify-between">
                          <span className="font-semibold text-text-primary truncate">{it.name}</span>
                          <span className="font-mono text-text-muted">{it.orderedQty} unit</span>
                        </div>
                      ))}
                    </div>
                  )}
                </TijarahCard>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── INLINE VIEW: PROSES CEK BARANG DATANG (BULK & BARCODE SCAN) ─── */}
      {activeTab === "po-list" && isCheckingReceive && selectedPoForReceive && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <TijarahButton
              type="button"
              size="sm"
              tijarahVariant="ghost"
              onClick={() => setIsCheckingReceive(false)}
              className="text-xs font-bold flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Daftar PO</span>
            </TijarahButton>
          </div>

          <TijarahCard className="p-5 border border-primary-sage/30 bg-primary-sage/5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-sm text-text-primary flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-primary-sage" />
                  Verifikasi Penerimaan Fisik: {selectedPoForReceive?.poNumber || "Pilih PO Terlebih Dahulu"}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Bandingkan barang yang tiba dari ekspedisi HSIS Pusat dengan rincian PO awal. Sistem otomatis menghitung selisih dan mengupdate stok toko.
                </p>
              </div>

              {/* Mode Switcher: Bulk Check vs Barcode Scan */}
              <div className="flex items-center bg-surface border border-border-subtle p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setReceiveMode("BULK")}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    receiveMode === "BULK"
                      ? "bg-primary-sage text-white shadow-xs"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Bulk Checklist</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReceiveMode("BARCODE")}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    receiveMode === "BARCODE"
                      ? "bg-primary-sage text-white shadow-xs"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  <ScanBarcode className="w-3.5 h-3.5" />
                  <span>Scan Barcode Satu-per-Satu</span>
                </button>
              </div>
            </div>

            {/* Barcode & Live Camera Scanner Bar */}
            {receiveMode === "BARCODE" && (
              <div className="p-4 bg-surface rounded-2xl border border-border-subtle flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <TijarahButton
                  type="button"
                  tijarahVariant="primary"
                  size="sm"
                  onClick={() => setIsCameraScannerOpen(true)}
                  className="h-10 px-4 font-bold flex items-center justify-center gap-2 shadow-md bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Buka Kamera Scanner (Tools Camera)</span>
                </TijarahButton>

                <div className="h-6 w-px bg-border-subtle hidden sm:block" />

                <div className="flex-1 flex items-center gap-2">
                  <ScanBarcode className="w-5 h-5 text-primary-sage shrink-0 hidden sm:block" />
                  <TijarahInput
                    placeholder="Atau ketik SKU / scan barcode fisik secara manual..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleScanBarcode();
                    }}
                    className="text-xs font-mono font-bold flex-1"
                  />
                  <TijarahButton size="sm" heroVariant="outline" onClick={handleScanBarcode} className="text-xs font-bold shrink-0">
                    Input Manual
                  </TijarahButton>
                </div>
              </div>
            )}

            {/* Tabel Perbandingan Qty PO vs Qty Diterima vs Selisih */}
            <div className="overflow-x-auto border border-border-subtle rounded-2xl bg-surface">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border-subtle bg-canvas/60 text-text-muted text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-2.5 px-3">SKU / Kode</th>
                    <th className="py-2.5 px-3">Nama Produk Herba</th>
                    <th className="py-2.5 px-3 text-center">Qty Pesanan PO</th>
                    <th className="py-2.5 px-3 text-center">Qty Diterima Riil</th>
                    <th className="py-2.5 px-3 text-center">Qty Rusak / Cacat</th>
                    <th className="py-2.5 px-3 text-center">Selisih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/50">
                  {receiveItems.map((it, idx) => {
                    const diff = it.receivedQty - it.orderedQty;

                    return (
                      <tr key={it.sku} className="hover:bg-canvas/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-text-primary">{it.sku}</td>
                        <td className="py-2.5 px-3 font-semibold text-text-primary">{it.name}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-text-muted">{it.orderedQty}</td>

                        {/* Input Qty Diterima */}
                        <td className="py-1.5 px-3 text-center w-28">
                          <input
                            type="number"
                            min="0"
                            value={String(it.receivedQty)}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 0;
                              setReceiveItems((prev) =>
                                prev.map((p, i) => (i === idx ? { ...p, receivedQty: val } : p))
                              );
                            }}
                            className="w-20 text-center text-xs font-bold border border-border-subtle rounded-lg px-2 py-1 bg-surface focus:ring-1 focus:ring-primary-sage"
                          />
                        </td>

                        {/* Input Qty Rusak */}
                        <td className="py-1.5 px-3 text-center w-28">
                          <input
                            type="number"
                            min="0"
                            value={String(it.damagedQty)}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 0;
                              setReceiveItems((prev) =>
                                prev.map((p, i) => (i === idx ? { ...p, damagedQty: val } : p))
                              );
                            }}
                            className="w-20 text-center text-xs font-bold border border-status-danger/40 text-status-danger rounded-lg px-2 py-1 bg-surface focus:ring-1 focus:ring-status-danger"
                          />
                        </td>

                        {/* Selisih Badge */}
                        <td className="py-2.5 px-3 text-center font-bold">
                          {diff === 0 ? (
                            <span className="text-status-success font-bold flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Sesuai
                            </span>
                          ) : diff < 0 ? (
                            <span className="text-status-danger font-bold">Kurang {Math.abs(diff)} unit</span>
                          ) : (
                            <span className="text-primary-sage font-bold">Lebih +{diff} unit</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Tombol Eksekusi Rekonsiliasi & Penambahan Stok */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-text-muted">
                Menekan tombol konfirmasi akan otomatis memutakhirkan stok barang fisik di etalase toko.
              </span>

              <TijarahButton
                size="sm"
                tijarahVariant="primary"
                onClick={handleConfirmReceiveOrder}
                isDisabled={isSubmittingReceive || !selectedPoForReceive}
                className="text-xs font-bold shadow-sm"
              >
                <PackageCheck className="w-4 h-4 mr-1.5" />
                {isSubmittingReceive ? "Memproses..." : "Konfirmasi Cek Fisik & Tambah ke Stok"}
              </TijarahButton>
            </div>
          </TijarahCard>
        </div>
      )}

      {/* ─── SUB-TAB 3: PENYAKIT TREN SAAT INI (RADAR AI & MEDSOS) ─── */}
      {activeTab === "disease-trends" && (
        <div className="space-y-4">
          {diseaseTrends.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl bg-canvas/30 border border-dashed border-border-subtle flex flex-col items-center justify-center">
              <Activity className="w-8 h-8 text-text-muted/40 mb-2 stroke-[1.5]" />
              <p className="text-sm font-semibold text-text-muted">Belum ada data tren penyakit &amp; tren medsos</p>
              <p className="text-xs text-text-muted/70 mt-1 max-w-md">
                Radar otomatis mendeteksi isu kesehatan masyarakat ketika data tren terintegrasi.
              </p>
            </div>
          ) : (
            <>
              <TijarahCard className="p-5 border border-accent-gold/40 bg-accent-gold/5 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-accent-gold animate-pulse" />
                  <h3 className="font-extrabold text-sm text-text-primary">
                    Radar Keluhan Kesehatan &amp; Tren Medsos Wilayah
                  </h3>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Monitoring sentimen keluhan kesehatan masyarakat. Stokis dapat menyiapkan paket sinergi herba sebelum lonjakan permintaan terjadi.
                </p>
              </TijarahCard>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {diseaseTrends.map((trend) => (
                  <TijarahCard key={trend.id} className="p-5 border border-border-subtle rounded-2xl bg-surface space-y-3">
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-bold uppercase text-primary-sage">{trend.seasonContext}</span>
                      <TijarahBadge
                        tijarahVariant={trend.urgency === "HIGH" ? "warning" : "primary"}
                        className="text-[10px] font-bold"
                      >
                        +{trend.socialMentionGrowth}% Medsos
                      </TijarahBadge>
                    </div>

                    <div>
                      <h4 className="font-black text-sm text-text-primary">{trend.diseaseName}</h4>
                      <p className="text-xs text-text-muted mt-1 leading-relaxed">{trend.aiInsight}</p>
                    </div>

                    <div className="pt-2 border-t border-border-subtle">
                      <span className="text-[10px] font-bold uppercase text-text-muted block mb-1">Paket Sinergi:</span>
                      <div className="flex flex-wrap gap-1">
                        {trend.recommendedSkus.map((sku) => (
                          <span key={sku} className="text-[10px] bg-canvas border border-border-subtle px-1.5 py-0.5 rounded font-mono font-bold">
                            {sku}
                          </span>
                        ))}
                      </div>
                    </div>
                  </TijarahCard>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── SUB-TAB 4: VELOCITY & PERPUTARAN PRODUK ─── */}
      {activeTab === "velocity" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <TijarahCard className="p-4 border border-border-subtle rounded-2xl bg-surface">
              <span className="text-xs font-semibold text-text-muted">Fast-Moving SKU (Herba Terlaris)</span>
              <span className="text-2xl font-black text-status-success block mt-1">
                {velocity.filter((v) => v.velocity === "FAST_MOVING").length} Produk
              </span>
            </TijarahCard>

            <TijarahCard className="p-4 border border-border-subtle rounded-2xl bg-surface">
              <span className="text-xs font-semibold text-text-muted">Dead Stock / Macet</span>
              <span className="text-2xl font-black text-status-danger block mt-1">
                {velocity.filter((v) => v.velocity === "DEAD_STOCK").length} Produk
              </span>
            </TijarahCard>

            <TijarahCard className="p-4 border border-border-subtle rounded-2xl bg-surface">
              <span className="text-xs font-semibold text-text-muted">Slow-Moving (Perlu Promo)</span>
              <span className="text-2xl font-black text-accent-gold block mt-1">
                {velocity.filter((v) => v.velocity === "SLOW_MOVING").length} Produk
              </span>
            </TijarahCard>
          </div>

          <div className="overflow-x-auto border border-border-subtle rounded-2xl bg-surface">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-subtle bg-canvas/60 text-text-muted text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Nama Produk</th>
                  <th className="py-2.5 px-3 text-center">Avg Harian</th>
                  <th className="py-2.5 px-3 text-center">Terakhir Terjual</th>
                  <th className="py-2.5 px-3 text-center">Klasifikasi</th>
                  <th className="py-2.5 px-3 text-center">Rekomendasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50">
                {velocity.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 px-4 text-center text-text-muted">
                      Belum ada data analisis perputaran produk (velocity).
                    </td>
                  </tr>
                ) : (
                  velocity.map((v) => (
                    <tr key={v.sku} className="hover:bg-canvas/30 transition-colors">
                      <td className="py-2 px-3 font-mono font-bold text-text-primary">{v.sku}</td>
                      <td className="py-2 px-3 font-semibold text-text-primary">{v.name}</td>
                      <td className="py-2 px-3 text-center font-bold text-text-primary">{v.avgDailySales} /hari</td>
                      <td className="py-2 px-3 text-center text-text-muted">{v.daysSinceLastSale} hari lalu</td>
                      <td className="py-2 px-3 text-center">
                        <TijarahBadge
                          tijarahVariant={
                            v.velocity === "FAST_MOVING"
                              ? "success"
                              : v.velocity === "SLOW_MOVING"
                              ? "warning"
                              : "danger"
                          }
                          className="text-[10px]"
                        >
                          {v.velocity.replace("_", " ")}
                        </TijarahBadge>
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-primary-sage">{v.recommendedQty} unit</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* Modal Scanner Barcode Kamera Live */}
      <CameraBarcodeScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanResult={handleCameraScanResult}
        targetItemsHint={receiveItems.map((it) => ({ sku: it.sku, name: it.name }))}
      />
    </div>
  );
};

export default ProductOrderManagementPanel;

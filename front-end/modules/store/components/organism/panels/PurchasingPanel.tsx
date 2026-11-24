"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Building2, Plus, PackageCheck, CreditCard, Trash2, FileSpreadsheet } from "lucide-react";
import { storeApi } from "../../../api/store.api";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { formatCurrency } from "@/utils/formatters";
import { showToast } from "@/utils/toast";

export function PurchasingPanel() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<"po" | "suppliers">("po");

  const [supName, setSupName] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supAddress, setSupAddress] = useState("");

  const [poSupplierId, setPoSupplierId] = useState("");
  const [poItemName, setPoItemName] = useState("");
  const [poItemQty, setPoItemQty] = useState("10");
  const [poItemCost, setPoItemCost] = useState("50000");
  const [poNotes, setPoNotes] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [supList, poList] = await Promise.all([
        storeApi.getSuppliers(),
        storeApi.getPurchaseOrders(),
      ]);
      setSuppliers(supList);
      setPurchaseOrders(poList);
      if (supList.length > 0 && !poSupplierId) {
        setPoSupplierId(supList[0].id);
      }
    } catch {
      // handled silently
    } finally {
      setLoading(false);
    }
  }, [poSupplierId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;
    try {
      await storeApi.createSupplier({
        name: supName.trim(),
        phone: supPhone.trim() || undefined,
        address: supAddress.trim() || undefined,
      });
      setSupName("");
      setSupPhone("");
      setSupAddress("");
      showToast.success("Supplier Ditambahkan", "Data supplier berhasil disimpan.");
      await loadData();
    } catch (err: any) {
      showToast.error("Gagal", err?.message || "Gagal menambah supplier.");
    }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poSupplierId || !poItemName.trim()) return;
    try {
      await storeApi.createPurchaseOrder({
        supplierId: poSupplierId,
        notes: poNotes.trim() || undefined,
        items: [
          {
            name: poItemName.trim(),
            qty: Number(poItemQty || 1),
            unitCost: Number(poItemCost || 0),
          },
        ],
      });
      setPoItemName("");
      setPoNotes("");
      showToast.success("Purchase Order Dibuat", "PO baru tercatat di sistem.");
      await loadData();
    } catch (err: any) {
      showToast.error("Gagal", err?.message || "Gagal membuat PO.");
    }
  };

  const handleReceivePO = async (id: string) => {
    try {
      await storeApi.receivePurchaseOrder(id);
      showToast.success("PO Diterima", "Status PO menjadi RECEIVED.");
      await loadData();
    } catch (err: any) {
      showToast.error("Gagal", err?.message || "Gagal menerima PO.");
    }
  };

  const handlePayPO = async (po: any) => {
    const remaining = Math.max(0, Number(po.totalAmount) - Number(po.paidAmount || 0));
    if (remaining <= 0) return;
    try {
      await storeApi.payPurchaseOrder(po.id, remaining);
      showToast.success("Hutang PO Lunas", `${po.poNumber} telah dilunasi.`);
      await loadData();
    } catch (err: any) {
      showToast.error("Gagal", err?.message || "Gagal mencatat pembayaran PO.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary-sage" />
            <span>Purchasing, Supplier & Hutang Dagang</span>
          </h2>
          <p className="text-xs text-text-muted">
            Kelola daftar supplier, buat Purchase Order (PO), penerimaan barang, dan pelunasan hutang supplier.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-canvas p-1 rounded-xl border border-border-subtle">
          <button
            type="button"
            onClick={() => setSubTab("po")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              subTab === "po" ? "bg-primary-sage text-white" : "text-text-muted hover:text-text-primary"
            }`}
          >
            Purchase Orders ({purchaseOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab("suppliers")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              subTab === "suppliers" ? "bg-primary-sage text-white" : "text-text-muted hover:text-text-primary"
            }`}
          >
            Supplier ({suppliers.length})
          </button>
        </div>
      </div>

      {subTab === "suppliers" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <form
            onSubmit={handleCreateSupplier}
            className="lg:col-span-4 rounded-2xl border border-border-subtle bg-surface p-5 space-y-3 h-fit"
          >
            <h3 className="text-sm font-bold text-text-primary">Tambah Supplier Baru</h3>
            <input
              type="text"
              required
              placeholder="Nama Supplier / Distributor"
              value={supName}
              onChange={(e) => setSupName(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-canvas px-3 py-2 text-xs text-text-primary"
            />
            <input
              type="text"
              placeholder="No. Telepon / WhatsApp"
              value={supPhone}
              onChange={(e) => setSupPhone(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-canvas px-3 py-2 text-xs text-text-primary"
            />
            <textarea
              rows={2}
              placeholder="Alamat Gudang / Kantor"
              value={supAddress}
              onChange={(e) => setSupAddress(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-canvas px-3 py-2 text-xs text-text-primary"
            />
            <TijarahButton type="submit" tijarahVariant="primary" size="sm" className="w-full font-bold text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Simpan Supplier
            </TijarahButton>
          </form>

          <div className="lg:col-span-8 space-y-3">
            {suppliers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border-subtle p-8 text-center text-xs text-text-muted">
                {loading ? "Memuat supplier..." : "Belum ada data supplier."}
              </div>
            ) : (
              suppliers.map((sup) => (
                <div
                  key={sup.id}
                  className="rounded-2xl border border-border-subtle bg-surface p-4 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary-sage" />
                      <span className="text-sm font-bold text-text-primary">{sup.name}</span>
                      <span className="text-[10px] font-mono text-text-muted">{sup.code}</span>
                    </div>
                    <p className="text-xs text-text-muted">
                      {sup.phone || "-"} • {sup.address || "Alamat belum diisi"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await storeApi.deleteSupplier(sup.id);
                      await loadData();
                    }}
                    className="p-2 rounded-lg text-status-danger hover:bg-status-danger/10"
                    aria-label="Hapus supplier"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <form
            onSubmit={handleCreatePO}
            className="lg:col-span-4 rounded-2xl border border-border-subtle bg-surface p-5 space-y-3 h-fit"
          >
            <h3 className="text-sm font-bold text-text-primary">Buat Purchase Order</h3>
            <select
              value={poSupplierId}
              onChange={(e) => setPoSupplierId(e.target.value)}
              required
              className="w-full rounded-lg border border-border-subtle bg-canvas px-3 py-2 text-xs text-text-primary"
            >
              <option value="">-- Pilih Supplier --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              required
              placeholder="Nama Barang / SKU"
              value={poItemName}
              onChange={(e) => setPoItemName(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-canvas px-3 py-2 text-xs text-text-primary"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={1}
                placeholder="Qty"
                value={poItemQty}
                onChange={(e) => setPoItemQty(e.target.value)}
                className="w-full rounded-lg border border-border-subtle bg-canvas px-3 py-2 text-xs text-text-primary"
              />
              <input
                type="number"
                min={0}
                placeholder="Harga Beli / Unit"
                value={poItemCost}
                onChange={(e) => setPoItemCost(e.target.value)}
                className="w-full rounded-lg border border-border-subtle bg-canvas px-3 py-2 text-xs text-text-primary"
              />
            </div>
            <input
              type="text"
              placeholder="Catatan PO (Opsional)"
              value={poNotes}
              onChange={(e) => setPoNotes(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-canvas px-3 py-2 text-xs text-text-primary"
            />
            <TijarahButton type="submit" tijarahVariant="primary" size="sm" className="w-full font-bold text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Terbitkan PO
            </TijarahButton>
          </form>

          <div className="lg:col-span-8 space-y-3">
            {purchaseOrders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border-subtle p-8 text-center text-xs text-text-muted">
                {loading ? "Memuat Purchase Order..." : "Belum ada Purchase Order."}
              </div>
            ) : (
              purchaseOrders.map((po) => (
                <div
                  key={po.id}
                  className="rounded-2xl border border-border-subtle bg-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-text-primary">{po.poNumber}</span>
                      <TijarahBadge tijarahVariant={po.status === "RECEIVED" ? "success" : "warning"}>
                        {po.status}
                      </TijarahBadge>
                      <TijarahBadge tijarahVariant={po.paymentStatus === "PAID" ? "success" : "primary"}>
                        {po.paymentStatus}
                      </TijarahBadge>
                    </div>
                    <p className="text-xs text-text-muted">
                      Supplier: <strong className="text-text-primary">{po.supplierName}</strong> • Total:{" "}
                      <span className="font-mono font-bold text-text-primary">
                        {formatCurrency(Number(po.totalAmount || 0))}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {po.status !== "RECEIVED" && (
                      <TijarahButton
                        type="button"
                        size="sm"
                        tijarahVariant="outline"
                        onClick={() => handleReceivePO(po.id)}
                        className="text-xs font-bold flex items-center gap-1"
                      >
                        <PackageCheck className="w-3.5 h-3.5" /> Terima
                      </TijarahButton>
                    )}
                    {po.paymentStatus !== "PAID" && (
                      <TijarahButton
                        type="button"
                        size="sm"
                        tijarahVariant="primary"
                        onClick={() => handlePayPO(po)}
                        className="text-xs font-bold flex items-center gap-1"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Lunasi
                      </TijarahButton>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

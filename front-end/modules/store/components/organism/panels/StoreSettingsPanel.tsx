"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Settings, Save, ShieldCheck } from "lucide-react";
import { storeApi } from "../../../api/store.api";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { showToast } from "@/utils/toast";

export function StoreSettingsPanel() {
  const [storeName, setStoreName] = useState("BC HNI Bukittinggi 3");
  const [storeTagline, setStoreTagline] = useState("Pusat Produk Halal & Herbal Terpercaya");
  const [isOpen, setIsOpen] = useState(true);
  const [taxRatePercent, setTaxRatePercent] = useState("0");
  const [serviceFee, setServiceFee] = useState("0");
  const [minOrderAmount, setMinOrderAmount] = useState("0");
  const [autoCancelMinutes, setAutoCancelMinutes] = useState("1440");
  const [saving, setSaving] = useState(false);

  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [savingRole, setSavingRole] = useState(false);

  const loadRbac = useCallback(async () => {
    try {
      const [rList, pList] = await Promise.all([
        storeApi.getRbacRoles(),
        storeApi.getRbacPermissions(),
      ]);
      setRoles(rList);
      setPermissions(pList);
      if (rList.length > 0 && !selectedRoleId) {
        setSelectedRoleId(rList[0].id);
      }
    } catch {
      // ignore if user lacks permission
    }
  }, [selectedRoleId]);

  useEffect(() => {
    storeApi
      .getStoreSettings()
      .then((s: any) => {
        if (!s) return;
        if (s.storeName) setStoreName(s.storeName);
        if (s.storeTagline) setStoreTagline(s.storeTagline);
        if (typeof s.isOpen === "boolean") setIsOpen(s.isOpen);
        if (s.taxRatePercent !== undefined) setTaxRatePercent(String(s.taxRatePercent));
        if (s.serviceFee !== undefined) setServiceFee(String(s.serviceFee));
        if (s.minOrderAmount !== undefined) setMinOrderAmount(String(s.minOrderAmount));
        if (s.autoCancelMinutes !== undefined) setAutoCancelMinutes(String(s.autoCancelMinutes));
      })
      .catch(() => {});
    loadRbac();
  }, [loadRbac]);

  const activeRole = roles.find((r) => r.id === selectedRoleId);

  const handleTogglePermission = async (permCode: string) => {
    if (!activeRole) return;
    const currentPerms: string[] = Array.isArray(activeRole.permissions) ? activeRole.permissions : [];
    const nextPerms = currentPerms.includes(permCode)
      ? currentPerms.filter((p) => p !== permCode)
      : [...currentPerms, permCode];

    setSavingRole(true);
    try {
      await storeApi.updateRolePermissions(activeRole.id, nextPerms);
      setRoles((prev) =>
        prev.map((r) => (r.id === activeRole.id ? { ...r, permissions: nextPerms } : r))
      );
      showToast.success("Permission Diperbarui", `Role ${activeRole.displayName} diperbarui.`);
    } catch (err: any) {
      showToast.error("Gagal", err?.message || "Tidak dapat memperbarui permission.");
    } finally {
      setSavingRole(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await storeApi.updateStoreSettings({
        storeName,
        storeTagline,
        isOpen,
        taxRatePercent: Number(taxRatePercent || 0),
        serviceFee: Number(serviceFee || 0),
        minOrderAmount: Number(minOrderAmount || 0),
        autoCancelMinutes: Number(autoCancelMinutes || 1440),
      });
      showToast.success("Pengaturan Disimpan", "Konfigurasi toko berhasil diperbarui.");
    } catch (err: any) {
      showToast.error("Gagal", err?.message || "Tidak dapat menyimpan pengaturan toko.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 w-full">
    <form onSubmit={handleSave} className="w-full space-y-6">
      <div>
        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary-sage" />
          <span>Pengaturan Toko Terpusat</span>
        </h2>
        <p className="text-xs text-text-muted">
          Atur identitas outlet, status buka/tutup toko, pajak/biaya layanan, dan batas waktu kedaluwarsa pesanan.
        </p>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-surface p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-primary">Nama Toko / Outlet</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-canvas px-3 py-2 text-xs text-text-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-primary">Tagline Toko</label>
            <input
              type="text"
              value={storeTagline}
              onChange={(e) => setStoreTagline(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-canvas px-3 py-2 text-xs text-text-primary"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-canvas border border-border-subtle">
          <div>
            <p className="text-xs font-bold text-text-primary">Status Operasional Toko</p>
            <p className="text-[11px] text-text-muted">Aktifkan untuk menerima pesanan online baru.</p>
          </div>
          <input
            type="checkbox"
            checked={isOpen}
            onChange={(e) => setIsOpen(e.target.checked)}
            className="w-4 h-4 accent-primary-sage cursor-pointer"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-text-muted">Pajak (%)</label>
            <input
              type="number"
              min={0}
              step="0.1"
              value={taxRatePercent}
              onChange={(e) => setTaxRatePercent(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-canvas px-3 py-2 text-xs text-text-primary font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-text-muted">Biaya Layanan (Rp)</label>
            <input
              type="number"
              min={0}
              value={serviceFee}
              onChange={(e) => setServiceFee(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-canvas px-3 py-2 text-xs text-text-primary font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-text-muted">Min. Order (Rp)</label>
            <input
              type="number"
              min={0}
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-canvas px-3 py-2 text-xs text-text-primary font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-text-muted">Auto-Cancel (Menit)</label>
            <input
              type="number"
              min={30}
              value={autoCancelMinutes}
              onChange={(e) => setAutoCancelMinutes(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-canvas px-3 py-2 text-xs text-text-primary font-mono"
            />
          </div>
        </div>

        <TijarahButton
          type="submit"
          tijarahVariant="primary"
          isLoading={saving}
          className="font-bold text-xs px-5 py-2.5 flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" /> Simpan Pengaturan
        </TijarahButton>
      </div>
    </form>

    {/* Matriks Role & Permission (RBAC) */}
    {roles.length > 0 && (
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary-sage" />
            <span>Matriks Role & Permission (RBAC)</span>
          </h3>
          <p className="text-xs text-text-muted">
            Kelola hak akses setiap role terhadap modul ERP dan Storefront dari database.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4 space-y-2">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRoleId(r.id)}
                className={`w-full text-left rounded-xl border p-3 transition-colors cursor-pointer ${
                  r.id === selectedRoleId
                    ? "border-primary-sage bg-primary-sage/10"
                    : "border-border-subtle bg-surface hover:bg-canvas"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-text-primary">{r.displayName}</span>
                  <TijarahBadge tijarahVariant="secondary">{r.userCount || 0} user</TijarahBadge>
                </div>
                <p className="text-[11px] text-text-muted mt-0.5 line-clamp-2">{r.description}</p>
              </button>
            ))}
          </div>

          <div className="lg:col-span-8 rounded-2xl border border-border-subtle bg-surface p-4 space-y-3">
            {activeRole && (
              <>
                <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
                  <div>
                    <p className="text-sm font-bold text-text-primary">{activeRole.displayName}</p>
                    <p className="text-[11px] font-mono text-text-muted">role: {activeRole.name}</p>
                  </div>
                  <TijarahBadge tijarahVariant="primary">
                    {Array.isArray(activeRole.permissions) ? activeRole.permissions.length : 0} izin aktif
                  </TijarahBadge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {permissions.map((perm) => {
                    const checked =
                      Array.isArray(activeRole.permissions) &&
                      activeRole.permissions.includes(perm.code);
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                          checked
                            ? "border-primary-sage/40 bg-primary-sage/5"
                            : "border-border-subtle bg-canvas/50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={savingRole}
                          onChange={() => handleTogglePermission(perm.code)}
                          className="mt-0.5 accent-primary-sage cursor-pointer"
                        />
                        <div className="min-w-0">
                          <div className="font-mono font-bold text-[11px] text-text-primary">
                            {perm.code}
                          </div>
                          <div className="text-[11px] text-text-muted leading-snug">
                            {perm.description}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )}
    </div>
  );
}

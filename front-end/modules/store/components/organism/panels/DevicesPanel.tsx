"use client";

import React, { useState } from "react";
import type { StoreDevice } from "../../../types/store.types";
import type { DevicePayload } from "../../../api/store.api";
import { DeviceFormModal } from "../modals/DeviceFormModal";
import { DeleteConfirmModal } from "../modals/DeleteConfirmModal";
import { DeviceStatusBadge } from "../../atom/DeviceStatusBadge";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { showToast } from "@/utils/toast";
import { storeApi } from "@/modules/store/api/store.api";
import {
  Printer,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Wifi,
  ScanBarcode,
  Activity,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

export interface IDevicesPanelProps {
  devices: StoreDevice[];
  isLoading: boolean;
  onRefresh: () => void;
  onCreateDevice?: (payload: DevicePayload) => Promise<any>;
  onUpdateDevice?: (params: { id: string; payload: DevicePayload }) => Promise<any>;
  onDeleteDevice?: (id: string) => Promise<any>;
  isSaving?: boolean;
  isDeleting?: boolean;
}

export const DevicesPanel: React.FC<IDevicesPanelProps> = ({
  devices,
  onRefresh,
  onCreateDevice,
  onUpdateDevice,
  onDeleteDevice,
  isSaving = false,
  isDeleting = false,
}) => {
  const t = useTranslations("storeErp.devices");
  const locale = useLocale();
  const isEn = locale === "en";

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDeviceForEdit, setSelectedDeviceForEdit] = useState<StoreDevice | null>(null);
  const [selectedDeviceForDelete, setSelectedDeviceForDelete] = useState<StoreDevice | null>(null);
  const [testingDeviceId, setTestingDeviceId] = useState<string | null>(null);

  const [realtimeStatuses, setRealtimeStatuses] = useState<
    Record<string, { status: "ONLINE" | "OFFLINE" | "TIMEOUT"; latencyMs?: number; lastPing?: string }>
  >({});
  const [isPingingAll, setIsPingingAll] = useState(false);

  const handleOpenCreate = () => {
    setSelectedDeviceForEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (device: StoreDevice) => {
    setSelectedDeviceForEdit(device);
    setIsFormOpen(true);
  };

  const handleSubmitForm = async (payload: DevicePayload) => {
    if (selectedDeviceForEdit && onUpdateDevice) {
      await onUpdateDevice({ id: selectedDeviceForEdit.id, payload });
    } else if (onCreateDevice) {
      await onCreateDevice(payload);
    }
    onRefresh();
  };

  const handleConfirmDelete = async () => {
    if (!selectedDeviceForDelete || !onDeleteDevice) return;
    await onDeleteDevice(selectedDeviceForDelete.id);
    setSelectedDeviceForDelete(null);
    onRefresh();
  };

  const handlePingSingle = async (device: StoreDevice) => {
    setTestingDeviceId(device.id);
    try {
      const res = await storeApi.pingDevice(device.id);
      setRealtimeStatuses((prev) => ({
        ...prev,
        [device.id]: {
          status: res.status,
          latencyMs: res.latencyMs,
          lastPing: res.lastPing,
        },
      }));
      if (res.status === "ONLINE") {
        showToast.success(
          isEn ? "Device Connected" : "Perangkat Terhubung",
          isEn
            ? `${device.name} responded with ${res.latencyMs || 0}ms latency.`
            : `${device.name} merespons dengan latency ${res.latencyMs || 0}ms.`
        );
      } else {
        showToast.error(
          isEn ? "Device Unreachable" : "Perangkat Tidak Terhubung",
          isEn
            ? `${device.name} status: ${res.status}. Check LAN cable or printer power.`
            : `${device.name} status: ${res.status}. Periksa kabel LAN atau daya printer.`
        );
      }
    } catch (err: any) {
      showToast.error(
        isEn ? "Ping Failed" : "Ping Gagal",
        err?.message || (isEn ? "Unable to reach device." : "Tidak dapat menghubungi perangkat.")
      );
    } finally {
      setTestingDeviceId(null);
    }
  };

  const handlePingAll = async () => {
    setIsPingingAll(true);
    try {
      const res = await storeApi.checkDevicesStatus();
      const newMap: Record<string, any> = {};
      (res.devices || []).forEach((d: any) => {
        newMap[d.id] = { status: d.status, latencyMs: d.latencyMs, lastPing: d.lastPing };
      });
      setRealtimeStatuses(newMap);
      showToast.success(
        isEn ? "Status Check Complete" : "Pengecekan Selesai",
        isEn
          ? `${res.onlineCount} of ${res.total} POS devices are online & ready.`
          : `${res.onlineCount} dari ${res.total} perangkat POS online & siap digunakan.`
      );
    } catch (err: any) {
      showToast.error(
        isEn ? "Failed" : "Gagal",
        err?.message || (isEn ? "Failed to check POS device status." : "Gagal memeriksa status perangkat POS.")
      );
    } finally {
      setIsPingingAll(false);
    }
  };

  const handleTestPrint = (device: StoreDevice) => {
    const printWin = window.open("", "_blank", "width=360,height=480");
    if (!printWin) {
      showToast.error(
        isEn ? "Popup Blocked" : "Popup Diblokir",
        isEn
          ? "Please allow browser popups to run a test print."
          : "Izinkan popup browser untuk menjalankan cetak uji struk."
      );
      return;
    }
    const now = new Date().toLocaleString(isEn ? "en-US" : "id-ID");
    printWin.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Test Print - ${device.name}</title>
          <style>
            body { font-family: monospace; font-size: 12px; padding: 12px; width: 280px; margin: 0 auto; color: #111; }
            .center { text-align: center; }
            .line { border-top: 1px dashed #333; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 3px 0; }
          </style>
        </head>
        <body>
          <div class="center">
            <strong>TIJARAH BC 3 BUKITTINGGI</strong><br/>
            <span>${isEn ? "POS PRINTER TEST PAGE" : "UJI CETAK PRINTER KASIR"}</span>
          </div>
          <div class="line"></div>
          <div class="row"><span>Device:</span><strong>${device.name}</strong></div>
          <div class="row"><span>Type:</span><span>${device.type}</span></div>
          <div class="row"><span>Connection:</span><span>${device.ip ? `${device.ip}:${device.port || 9100}` : "USB / Local"}</span></div>
          <div class="row"><span>Location:</span><span>${device.location || "-"}</span></div>
          <div class="row"><span>Time:</span><span>${now}</span></div>
          <div class="line"></div>
          <div class="center">${isEn ? "Print test successful." : "Cetak uji berhasil."}</div>
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    printWin.print();
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-black text-text-primary tracking-tight">{t("title")}</h2>
            <TijarahBadge tijarahVariant="primary" className="text-[10px] font-bold">
              TCP Ping &amp; Browser Print
            </TijarahBadge>
          </div>
          <p className="text-xs text-text-muted mt-0.5">{t("subtitle")}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <TijarahButton
            type="button"
            heroVariant="outline"
            size="sm"
            onClick={handlePingAll}
            isLoading={isPingingAll}
            className="text-xs font-semibold flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5 text-primary-sage" />
            <span>{isEn ? "Ping All POS" : "Ping Realtime Semua POS"}</span>
          </TijarahButton>

          <TijarahButton
            type="button"
            tijarahVariant="primary"
            size="sm"
            onClick={handleOpenCreate}
            className="text-xs px-3.5 h-9 font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{isEn ? "Add Device" : "Tambah Perangkat"}</span>
          </TijarahButton>
        </div>
      </div>

      {/* Grid Perangkat Toko */}
      {devices.length === 0 ? (
        <TijarahCard
          tijarahVariant="default"
          className="p-8 border border-border-subtle rounded-2xl text-center space-y-2"
        >
          <Printer className="w-8 h-8 text-text-muted mx-auto" />
          <p className="text-sm font-bold text-text-primary">
            {isEn ? "No POS devices registered" : "Belum ada perangkat POS terdaftar"}
          </p>
          <p className="text-xs text-text-muted">
            {isEn
              ? "Add a thermal printer, invoice printer, or barcode scanner to get started."
              : "Tambahkan printer thermal, printer faktur, atau barcode scanner untuk memulai."}
          </p>
        </TijarahCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((dev) => {
            const activeStatus =
              testingDeviceId === dev.id
                ? "CHECKING"
                : (realtimeStatuses[dev.id]?.status as any) || (dev.status as any) || "OFFLINE";

            return (
              <TijarahCard
                key={dev.id}
                tijarahVariant="default"
                className="p-5 border border-border-subtle mac-glass mac-shadow rounded-2xl flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-canvas border border-border-subtle flex items-center justify-center text-primary-sage shrink-0">
                        {dev.type === "Scanner" ? (
                          <ScanBarcode className="w-5 h-5" />
                        ) : (
                          <Printer className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-text-primary leading-tight">
                          {dev.name}
                        </h4>
                        <span className="text-[11px] text-text-muted">{dev.type} Device</span>
                      </div>
                    </div>

                    <DeviceStatusBadge
                      status={activeStatus}
                      latencyMs={realtimeStatuses[dev.id]?.latencyMs}
                      lastPing={realtimeStatuses[dev.id]?.lastPing}
                    />
                  </div>

                  <div className="text-xs text-text-muted space-y-1 bg-canvas/60 p-3 rounded-xl border border-border-subtle">
                    <div className="flex items-center justify-between">
                      <span>{isEn ? "Connection:" : "Alamat IP / Koneksi:"}</span>
                      <span className="font-mono font-bold text-text-primary">
                        {dev.ip ? `${dev.ip}${dev.port ? `:${dev.port}` : ""}` : "USB / Local"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{isEn ? "Location:" : "Lokasi Meja:"}</span>
                      <span className="font-medium text-text-primary">
                        {dev.location || (isEn ? "Main Cashier" : "Kasir Utama")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{isEn ? "Condition:" : "Kondisi Alat:"}</span>
                      <span className="font-semibold text-text-primary">
                        {activeStatus === "ONLINE"
                          ? isEn
                            ? "Ready"
                            : "Siap Beroperasi"
                          : activeStatus === "TIMEOUT"
                            ? isEn
                              ? "Connection Timeout"
                              : "Waktu Tunggu Habis (Timeout)"
                            : isEn
                              ? "Disconnected / Check Cable"
                              : "Tidak Terhubung / Cek Kabel"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Aksi Test & CRUD */}
                <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <TijarahButton
                      type="button"
                      heroVariant="outline"
                      size="sm"
                      isLoading={testingDeviceId === dev.id}
                      onClick={() => handlePingSingle(dev)}
                      className="text-[11px] px-2.5 h-7 font-bold flex items-center gap-1"
                    >
                      <Wifi className="w-3 h-3 text-primary-sage" />
                      <span>{isEn ? "Ping" : "Ping Alat"}</span>
                    </TijarahButton>

                    {dev.type !== "Scanner" && (
                      <TijarahButton
                        type="button"
                        heroVariant="outline"
                        size="sm"
                        onClick={() => handleTestPrint(dev)}
                        className="text-[11px] px-2.5 h-7 font-bold flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3 text-primary-sage" />
                        <span>{isEn ? "Test Print" : "Cetak Uji"}</span>
                      </TijarahButton>
                    )}

                    {dev.status === "ERROR" && (
                      <span className="text-[10px] text-status-danger font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {isEn ? "Paper / Error" : "Perlu Kertas"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <TijarahButton
                      type="button"
                      heroVariant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(dev)}
                      className="text-[11px] px-2 h-7 font-bold text-primary-sage"
                    >
                      <Edit2 className="w-3 h-3 mr-0.5" />
                      <span>{isEn ? "Edit" : "Edit"}</span>
                    </TijarahButton>

                    <TijarahButton
                      type="button"
                      heroVariant="ghost"
                      size="sm"
                      onClick={() => setSelectedDeviceForDelete(dev)}
                      className="text-[11px] px-2 h-7 font-bold text-status-danger hover:bg-status-danger/10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </TijarahButton>
                  </div>
                </div>
              </TijarahCard>
            );
          })}
        </div>
      )}

      {/* Modal Form Perangkat */}
      <DeviceFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        device={selectedDeviceForEdit}
        onSubmit={handleSubmitForm}
        isLoading={isSaving}
      />

      {/* Modal Hapus Perangkat */}
      <DeleteConfirmModal
        isOpen={!!selectedDeviceForDelete}
        onClose={() => setSelectedDeviceForDelete(null)}
        onConfirm={handleConfirmDelete}
        title={isEn ? "Delete POS Device" : "Hapus Perangkat POS"}
        itemName={selectedDeviceForDelete?.name || (isEn ? "Device" : "Perangkat")}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default DevicesPanel;

"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale } from "next-intl";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahSelect } from "@/components/atom/tijarahSelect";
import { deviceSchema, type DeviceFormData } from "../../../schemas/store.schema";
import type { StoreDevice } from "../../../types/store.types";
import type { DevicePayload } from "../../../api/store.api";

export interface IDeviceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: StoreDevice | null;
  onSubmit: (payload: DevicePayload) => Promise<void>;
  isLoading: boolean;
}

export const DeviceFormModal: React.FC<IDeviceFormModalProps> = ({
  isOpen,
  onClose,
  device,
  onSubmit,
  isLoading,
}) => {
  const locale = useLocale();
  const isEn = locale === "en";
  const isEdit = !!device;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any, any, DeviceFormData>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      name: "",
      type: "Thermal",
      status: "ONLINE",
      ip: "",
      port: 9100 as any,
      location: "",
    },
  });

  const watchedType = watch("type") || "Thermal";
  const watchedStatus = watch("status") || "ONLINE";

  useEffect(() => {
    if (device) {
      reset({
        name: device.name,
        type: device.type,
        status: device.status,
        ip: device.ip || "",
        port: (device.port || 9100) as any,
        location: device.location || "",
      });
    } else {
      reset({
        name: "",
        type: "Thermal",
        status: "ONLINE",
        ip: "",
        port: 9100 as any,
        location: isEn ? "Main Cashier" : "Meja Kasir",
      });
    }
  }, [device, reset, isOpen, isEn]);

  const handleFormSubmit = async (data: DeviceFormData) => {
    await onSubmit({
      name: data.name,
      type: data.type,
      status: data.status,
      ip: data.ip,
      port: data.port,
      location: data.location,
    });
    onClose();
  };

  return (
    <TijarahModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEdit
          ? `${isEn ? "Edit Device" : "Edit Perangkat"} #${device.name}`
          : isEn
            ? "Add POS Device / Printer"
            : "Tambah Perangkat POS / Printer"
      }
      description={
        isEdit
          ? isEn
            ? "Update IP configuration, device type, or workstation location."
            : "Perbarui konfigurasi IP, jenis perangkat, atau lokasi meja kerja."
          : isEn
            ? "Connect a thermal printer, barcode scanner, or invoice printer to the POS system."
            : "Hubungkan printer thermal, scanner barcode, atau printer faktur ke sistem POS BC."
      }
      confirmText={
        isEdit
          ? isEn
            ? "Save Device"
            : "Simpan Perangkat"
          : isEn
            ? "Register Device"
            : "Daftarkan Perangkat"
      }
      confirmVariant="primary"
      isConfirmLoading={isLoading}
      onConfirm={handleSubmit(handleFormSubmit)}
      showCancelButton
      cancelText={isEn ? "Cancel" : "Batal"}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3 pt-1">
        <div>
          <TijarahInput
            label={isEn ? "Device Name*" : "Nama Perangkat*"}
            placeholder={
              isEn ? "e.g. POS Thermal 80mm Cashier 1" : "Contoh: POS Thermal 80mm Kasir 3"
            }
            {...register("name")}
            isInvalid={!!errors.name}
            errorMessage={errors.name?.message as string}
            className="text-xs font-semibold"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-primary">
              {isEn ? "Device Type*" : "Tipe Perangkat*"}
            </label>
            <TijarahSelect
              selectedKey={watchedType}
              onSelectionChange={(key) => {
                if (key) setValue("type", String(key) as DeviceFormData["type"]);
              }}
              className="text-xs"
            >
              <TijarahSelect.Item id="Thermal">
                {isEn ? "Thermal Printer (58mm/80mm)" : "Printer Thermal (Resi 58mm/80mm)"}
              </TijarahSelect.Item>
              <TijarahSelect.Item id="Inkjet">
                {isEn ? "Inkjet Printer (A4 Invoice)" : "Printer Inkjet (Faktur A4)"}
              </TijarahSelect.Item>
              <TijarahSelect.Item id="Laser">
                {isEn ? "Laser Printer (Document)" : "Printer Laser (Faktur Tebal)"}
              </TijarahSelect.Item>
              <TijarahSelect.Item id="Scanner">
                {isEn ? "Barcode / 2D Scanner" : "Barcode / 2D Scanner"}
              </TijarahSelect.Item>
            </TijarahSelect>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-primary">
              {isEn ? "Initial Status*" : "Status Koneksi*"}
            </label>
            <TijarahSelect
              selectedKey={watchedStatus}
              onSelectionChange={(key) => {
                if (key) setValue("status", String(key) as DeviceFormData["status"]);
              }}
              className="text-xs"
            >
              <TijarahSelect.Item id="ONLINE">
                {isEn ? "Online (Connected)" : "Online (Terhubung)"}
              </TijarahSelect.Item>
              <TijarahSelect.Item id="OFFLINE">
                {isEn ? "Offline (Disconnected)" : "Offline (Terputus)"}
              </TijarahSelect.Item>
              <TijarahSelect.Item id="ERROR">
                {isEn ? "Error / Out of Paper" : "Error / Kertas Habis"}
              </TijarahSelect.Item>
            </TijarahSelect>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <TijarahInput
              label={
                isEn
                  ? "Network IP Address (leave blank for USB)"
                  : "Alamat IP Jaringan (kosongkan jika USB)"
              }
              placeholder="192.168.1.105"
              {...register("ip")}
              isInvalid={!!errors.ip}
              errorMessage={errors.ip?.message as string}
              className="text-xs font-mono"
            />
          </div>

          <div>
            <TijarahInput
              type="number"
              label={isEn ? "Connection Port (Default 9100)" : "Port Koneksi (Default 9100)"}
              placeholder="9100"
              {...register("port")}
              isInvalid={!!errors.port}
              errorMessage={errors.port?.message as string}
              className="text-xs font-mono"
            />
          </div>
        </div>

        <div>
          <TijarahInput
            label={isEn ? "Workstation Location" : "Lokasi Penempatan Meja"}
            placeholder={
              isEn ? "e.g. Cashier Desk 2 / Packing Area" : "Contoh: Meja Kasir 2 / Gudang Paket"
            }
            {...register("location")}
            className="text-xs"
          />
        </div>
      </form>
    </TijarahModal>
  );
};

export default DeviceFormModal;

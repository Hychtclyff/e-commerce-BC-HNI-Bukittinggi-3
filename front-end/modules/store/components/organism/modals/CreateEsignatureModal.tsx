"use client";

import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale } from "next-intl";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahTextArea } from "@/components/atom/tijarahTextArea";
import { TijarahSelect } from "@/components/atom/tijarahSelect";
import { esignatureSchema, type EsignatureFormData } from "../../../schemas/store.schema";
import type { StoreAgent } from "../../../types/store.types";
import type { EsignaturePayload } from "../../../api/store.api";
import { useAuthStore } from "@/modules/auth/services/auth.store";

export interface ICreateEsignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents?: StoreAgent[];
  onSubmit: (payload: EsignaturePayload) => Promise<void>;
  isLoading: boolean;
}

export const CreateEsignatureModal: React.FC<ICreateEsignatureModalProps> = ({
  isOpen,
  onClose,
  agents = [],
  onSubmit,
  isLoading,
}) => {
  const locale = useLocale();
  const isEn = locale === "en";
  const authUser = useAuthStore((state) => state.user);

  const staffOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; role: string }>();
    if (authUser?.id) {
      map.set(String(authUser.id), {
        id: String(authUser.id),
        name: authUser.fullName || authUser.name || "Admin Toko",
        role: authUser.role || "OWNER",
      });
    }
    for (const agent of agents) {
      if (!agent.id) continue;
      if (!map.has(String(agent.id))) {
        map.set(String(agent.id), {
          id: String(agent.id),
          name: agent.name || "Karyawan",
          role: agent.rank || "STAFF",
        });
      }
    }
    return Array.from(map.values());
  }, [authUser, agents]);

  const defaultStaff = staffOptions[0];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any, any, EsignatureFormData>({
    resolver: zodResolver(esignatureSchema),
    defaultValues: {
      userId: defaultStaff?.id || "",
      signer: "Kasir",
      signerName: defaultStaff?.name || "",
      notes: isEn
        ? "Official store staff digital authorization signature"
        : "Tanda tangan otorisasi resmi staf operasional toko",
    },
  });

  const watchedUserId = watch("userId");
  const watchedSigner = watch("signer");

  useEffect(() => {
    if (isOpen && defaultStaff) {
      setValue("userId", defaultStaff.id);
      setValue("signerName", defaultStaff.name);
    }
  }, [isOpen, defaultStaff, setValue]);

  const handleSelectStaff = (key: string) => {
    setValue("userId", key);
    const found = staffOptions.find((s) => s.id === key);
    if (found) {
      setValue("signerName", found.name);
      const upperRole = found.role.toUpperCase();
      if (upperRole.includes("OWNER") || upperRole.includes("ADMIN")) {
        setValue("signer", "Owner");
      } else if (upperRole.includes("GUDANG") || upperRole.includes("WAREHOUSE")) {
        setValue("signer", "Gudang");
      } else {
        setValue("signer", "Kasir");
      }
    }
  };

  const handleFormSubmit = async (data: EsignatureFormData) => {
    const finalSignerName = (data.signerName || defaultStaff?.name || "Kasir Toko").trim();
    await onSubmit({
      userId: data.userId,
      signer: data.signer,
      signerName: finalSignerName,
      notes: data.notes,
    });
    reset();
    onClose();
  };

  return (
    <TijarahModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEn ? "Register Employee Digital Signature" : "Daftarkan Tanda Tangan Digital Karyawan"}
      description={
        isEn
          ? "Each staff member must have an active digital signature before approving, shipping, or completing orders."
          : "Setiap karyawan wajib memiliki tanda tangan digital aktif sebelum dapat melakukan aksi persetujuan, pengiriman, atau penyelesaian pesanan."
      }
      confirmText={isEn ? "Activate Signature" : "Aktifkan Tanda Tangan"}
      confirmVariant="primary"
      isConfirmLoading={isLoading}
      onConfirm={handleSubmit(handleFormSubmit)}
      showCancelButton
      cancelText={isEn ? "Cancel" : "Batal"}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3 pt-1">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-text-primary">
            {isEn ? "Select Employee / Staff Account*" : "Pilih Akun Karyawan / Petugas*"}
          </label>
          <TijarahSelect
            selectedKey={watchedUserId || ""}
            onSelectionChange={(key) => {
              if (key) handleSelectStaff(String(key));
            }}
            placeholder={isEn ? "Choose employee..." : "Pilih karyawan..."}
            className="text-xs"
          >
            {staffOptions.map((staff) => (
              <TijarahSelect.Item key={staff.id} id={staff.id}>
                {staff.name} ({staff.role})
              </TijarahSelect.Item>
            ))}
          </TijarahSelect>
          {errors.userId && (
            <span className="text-xs text-status-danger font-medium">
              {errors.userId?.message as string}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-primary">
              {isEn ? "Operational Role*" : "Jabatan Operasional*"}
            </label>
            <TijarahSelect
              selectedKey={watchedSigner || "Kasir"}
              onSelectionChange={(key) => {
                if (key) setValue("signer", String(key) as EsignatureFormData["signer"]);
              }}
              className="text-xs"
            >
              <TijarahSelect.Item id="Kasir">
                {isEn ? "Store Cashier (Order & Receipt)" : "Kasir Toko (Layanan Nota)"}
              </TijarahSelect.Item>
              <TijarahSelect.Item id="Gudang">
                {isEn ? "Warehouse Staff (Packing & Shipping)" : "Petugas Gudang (Serah Terima Paket)"}
              </TijarahSelect.Item>
              <TijarahSelect.Item id="Owner">
                {isEn ? "Store Owner (Official Approval)" : "Owner Toko BC (Pengesahan Resmi)"}
              </TijarahSelect.Item>
            </TijarahSelect>
          </div>

          <div>
            <TijarahInput
              label={isEn ? "Employee Full Name*" : "Nama Lengkap Penandatangan*"}
              placeholder={isEn ? "e.g. Ahmad Fauzi" : "Contoh: Ahmad Fauzi"}
              {...register("signerName")}
              isInvalid={!!errors.signerName}
              errorMessage={errors.signerName?.message as string}
              className="text-xs font-semibold"
            />
          </div>
        </div>

        <div>
          <TijarahTextArea
            label={isEn ? "Authorization Notes" : "Catatan Otorisasi / Keterangan"}
            placeholder={
              isEn
                ? "Authorized to approve, pack, and verify store orders..."
                : "Berwenang melakukan persetujuan, pengemasan, dan verifikasi pesanan toko..."
            }
            {...register("notes")}
            className="text-xs min-h-[60px]"
          />
        </div>
      </form>
    </TijarahModal>
  );
};

export default CreateEsignatureModal;

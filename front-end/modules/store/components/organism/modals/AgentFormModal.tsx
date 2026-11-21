"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahSelect } from "@/components/atom/tijarahSelect";
import { agentSchema, type AgentFormData } from "../../../schemas/store.schema";
import type { StoreAgent } from "../../../types/store.types";
import type { AgentPayload } from "../../../api/store.api";

export interface IAgentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: StoreAgent | null;
  onSubmit: (payload: AgentPayload) => Promise<void>;
  isLoading: boolean;
}

export const AgentFormModal: React.FC<IAgentFormModalProps> = ({
  isOpen,
  onClose,
  agent,
  onSubmit,
  isLoading,
}) => {
  const isEdit = !!agent;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<any, any, AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: "",
      hniMemberId: "",
      phoneNumber: "081234567890",
      rank: "AB",
      tier: "AGEN_BIAYA",
      role: "Kasir",
      status: "ACTIVE",
    },
  });

  const watchedRank = watch("rank");
  const watchedTier = watch("tier");
  const watchedStatus = watch("status");

  const availableRoles: Array<"Kasir" | "Gudang" | "Owner" | "Manager" | "Admin"> = [
    "Kasir",
    "Gudang",
    "Admin",
    "Manager",
    "Owner",
  ];

  const initialRoles: Array<"Kasir" | "Gudang" | "Owner" | "Manager" | "Admin"> = (agent?.roles && agent.roles.length > 0)
    ? (agent.roles as Array<"Kasir" | "Gudang" | "Owner" | "Manager" | "Admin">)
    : agent?.role
    ? [agent.role]
    : ["Kasir"];

  const [selectedRoles, setSelectedRoles] = React.useState<Array<"Kasir" | "Gudang" | "Owner" | "Manager" | "Admin">>(initialRoles);

  const toggleRole = (r: "Kasir" | "Gudang" | "Owner" | "Manager" | "Admin") => {
    if (selectedRoles.includes(r)) {
      if (selectedRoles.length === 1) return; // minimal 1 role
      setSelectedRoles(selectedRoles.filter((item) => item !== r));
    } else {
      setSelectedRoles([...selectedRoles, r]);
    }
  };

  useEffect(() => {
    if (agent) {
      const rList = (agent.roles && agent.roles.length > 0)
        ? (agent.roles as Array<"Kasir" | "Gudang" | "Owner" | "Manager" | "Admin">)
        : [agent.role];
      setSelectedRoles(rList);
      reset({
        name: agent.name,
        hniMemberId: agent.hniMemberId || "",
        phoneNumber: agent.phoneNumber || "081234567890",
        rank: agent.rank,
        tier: agent.tier,
        role: agent.role,
        status: agent.status,
      });
    } else {
      setSelectedRoles(["Kasir"]);
      reset({
        name: "",
        hniMemberId: "",
        phoneNumber: "081234567890",
        rank: "AB",
        tier: "AGEN_BIAYA",
        role: "Kasir",
        status: "ACTIVE",
      });
    }
  }, [agent, reset, isOpen]);

  const handleFormSubmit = async (data: AgentFormData) => {
    const primaryRole = selectedRoles[0] || data.role;
    await onSubmit({
      name: data.name,
      hniMemberId: data.hniMemberId,
      phoneNumber: data.phoneNumber,
      rank: data.rank,
      tier: data.tier,
      role: primaryRole,
      roles: selectedRoles,
      status: data.status,
    });
    onClose();
  };

  return (
    <TijarahModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Mitra #${agent.name}` : "Daftarkan Agen / Petugas Baru"}
      description={
        isEdit
          ? "Perbarui jenjang keagenan, hak akses operasional, atau status keaktifan."
          : "Daftarkan mitra agen HNI atau staf operasional (Kasir/Gudang/Admin) ke Business Center."
      }
      confirmText={isEdit ? "Simpan Perubahan" : "Daftarkan Agen"}
      confirmVariant="primary"
      isConfirmLoading={isLoading}
      onConfirm={handleSubmit(handleFormSubmit)}
      showCancelButton
      cancelText="Batal"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3 pt-1">
        <div>
          <TijarahInput
            label="Nama Lengkap Agen / Staf*"
            placeholder="Contoh: Nama Lengkap Staf"
            {...register("name")}
            isInvalid={!!errors.name}
            errorMessage={errors.name?.message as string}
            className="text-xs font-semibold"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <TijarahInput
              label="Nomor ID Member HNI*"
              placeholder="Contoh: 01992834"
              {...register("hniMemberId")}
              isInvalid={!!errors.hniMemberId}
              errorMessage={errors.hniMemberId?.message as string}
              className="text-xs font-mono font-bold"
            />
          </div>

          <div>
            <TijarahInput
              label="Nomor WhatsApp / HP*"
              placeholder="081287654321"
              {...register("phoneNumber")}
              isInvalid={!!errors.phoneNumber}
              errorMessage={errors.phoneNumber?.message as string}
              className="text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-primary">Pangkat Keagenan (Rank)*</label>
            <TijarahSelect
              selectedKey={watchedRank}
              onSelectionChange={(key) => {
                if (key) setValue("rank", String(key) as any);
              }}
              className="text-xs"
            >
              <TijarahSelect.Item id="AB">Agen Baru (AB)</TijarahSelect.Item>
              <TijarahSelect.Item id="Manager">Manager</TijarahSelect.Item>
              <TijarahSelect.Item id="SM">Senior Manager (SM)</TijarahSelect.Item>
              <TijarahSelect.Item id="EM">Executive Manager (EM)</TijarahSelect.Item>
              <TijarahSelect.Item id="LED">Loyal Executive Director (LED)</TijarahSelect.Item>
            </TijarahSelect>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-primary">Tier / Level Gerai*</label>
            <TijarahSelect
              selectedKey={watchedTier}
              onSelectionChange={(key) => {
                if (key) setValue("tier", String(key) as any);
              }}
              className="text-xs"
            >
              <TijarahSelect.Item id="AGEN_BIAYA">Agen Biasa</TijarahSelect.Item>
              <TijarahSelect.Item id="STOCKIES">Stockies</TijarahSelect.Item>
              <TijarahSelect.Item id="DC">Distribution Center (DC)</TijarahSelect.Item>
              <TijarahSelect.Item id="BC">Business Center (BC)</TijarahSelect.Item>
            </TijarahSelect>
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <label className="text-xs font-semibold text-text-primary block">
            Peran Operasional User (Dukungan Multi-Role)*
          </label>
          <div className="flex flex-wrap gap-2">
            {availableRoles.map((r) => {
              const isSelected = selectedRoles.includes(r);
              return (
                <button
                  type="button"
                  key={r}
                  onClick={() => toggleRole(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-primary-sage text-surface border-primary-sage shadow-xs"
                      : "bg-surface text-text-muted border-border-subtle hover:border-primary-sage/50"
                  }`}
                >
                  {isSelected ? "✓ " : "+ "}
                  {r}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-text-muted">
            User dapat memegang beberapa role sekaligus (misal: Kasir dan Gudang, atau Owner dan Admin).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-primary">Status Akun*</label>
            <TijarahSelect
              selectedKey={watchedStatus}
              onSelectionChange={(key) => {
                if (key) setValue("status", String(key) as any);
              }}
              className="text-xs"
            >
              <TijarahSelect.Item id="ACTIVE">Aktif (Bisa Login)</TijarahSelect.Item>
              <TijarahSelect.Item id="INACTIVE">Nonaktif (Ditangguhkan)</TijarahSelect.Item>
            </TijarahSelect>
          </div>
        </div>
      </form>
    </TijarahModal>
  );
};

export default AgentFormModal;

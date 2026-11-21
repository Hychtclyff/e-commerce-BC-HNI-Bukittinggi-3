"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahTextArea } from "@/components/atom/tijarahTextArea";
import { TijarahSwitch } from "@/components/atom/tijarahSwitch";
import type { StoreHsisEndpoint, HsisControllerMeta } from "../../../types/store.types";
import { Network } from "lucide-react";

export interface IHsisEndpointFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  endpoint: StoreHsisEndpoint | null;
  controllersMeta: HsisControllerMeta[];
  onSubmit: (payload: {
    name: string;
    route: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    description?: string;
    controller: string;
    handlerAction: string;
    isActive: boolean;
  }) => Promise<void>;
  isLoading: boolean;
}

export const HsisEndpointFormModal: React.FC<IHsisEndpointFormModalProps> = ({
  isOpen,
  onClose,
  endpoint,
  controllersMeta,
  onSubmit,
  isLoading,
}) => {
  const isEdit = !!endpoint;

  const defaultControllers: HsisControllerMeta[] = [
    {
      controller: "HsisPointsController",
      description: "Sinkronisasi poin TP agen dan riwayat poin HSIS",
      actions: ["syncAgentPoints", "getPointHistory"],
    },
    {
      controller: "HsisMemberController",
      description: "Validasi status keanggotaan ID Mitra HNI",
      actions: ["verifyMember"],
    },
    {
      controller: "HsisSalesController",
      description: "Posting omzet dan penerbitan nomor RO gerai ke pusat",
      actions: ["postSales"],
    },
    {
      controller: "HsisHealthController",
      description: "Health check dan monitor latency gateway HSIS",
      actions: ["checkHealth"],
    },
    {
      controller: "HsisProxyController",
      description: "Forwarder proxy langsung ke server tujuan HSIS",
      actions: ["forwardProxy"],
    },
  ];

  const availableControllers = controllersMeta.length > 0 ? controllersMeta : defaultControllers;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      route: "/api/v1/hsis/",
      method: "POST" as "GET" | "POST" | "PUT" | "DELETE",
      description: "",
      controller: "HsisPointsController",
      handlerAction: "syncAgentPoints",
      isActive: true,
    },
  });

  const selectedController = watch("controller");
  const selectedControllerMeta = availableControllers.find((c) => c.controller === selectedController);

  useEffect(() => {
    if (endpoint) {
      reset({
        name: endpoint.name,
        route: endpoint.route,
        method: endpoint.method,
        description: endpoint.description || "",
        controller: endpoint.controller,
        handlerAction: endpoint.handlerAction,
        isActive: endpoint.isActive,
      });
    } else {
      reset({
        name: "",
        route: "/api/v1/hsis/new-route",
        method: "POST",
        description: "",
        controller: "HsisPointsController",
        handlerAction: "syncAgentPoints",
        isActive: true,
      });
    }
  }, [endpoint, reset, isOpen]);

  const handleFormSubmit = async (data: any) => {
    await onSubmit({
      name: data.name,
      route: data.route,
      method: data.method,
      description: data.description,
      controller: data.controller,
      handlerAction: data.handlerAction,
      isActive: data.isActive,
    });
    onClose();
  };

  return (
    <TijarahModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Endpoint HSIS #${endpoint.name}` : "Daftarkan Endpoint Dinamis HSIS"}
      description="Rute dan Controller akan disimpan ke database PostgreSQL dan di-handle otomatis oleh Dynamic Dispatcher Fastify."
      confirmText={isEdit ? "Simpan Perubahan" : "Daftarkan Endpoint"}
      confirmVariant="primary"
      isConfirmLoading={isLoading}
      onConfirm={handleSubmit(handleFormSubmit)}
      showCancelButton
      cancelText="Batal"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <TijarahInput
              label="Nama Endpoint / Integrasi*"
              placeholder="Contoh: Sinkronisasi Poin Agen Mitra"
              {...register("name", { required: "Nama endpoint wajib diisi" })}
              isInvalid={!!errors.name}
              errorMessage={errors.name?.message as string}
              className="text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              HTTP Method*
            </label>
            <select
              {...register("method")}
              className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-primary-sage transition-colors h-10"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
        </div>

        <div>
          <TijarahInput
            label="Route Path API (Dinamis di Database)*"
            placeholder="/api/v1/hsis/agents/sync-points"
            {...register("route", { required: "Route wajib diisi" })}
            isInvalid={!!errors.route}
            errorMessage={errors.route?.message as string}
            className="text-xs font-mono font-bold"
          />
          <p className="text-[11px] text-text-muted mt-1 flex items-center gap-1">
            <Network className="w-3.5 h-3.5 text-primary-sage shrink-0" />
            <span>Fastify Wildcard Router akan mencocokkan jalur ini secara runtime dari database.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-canvas/70 border border-border-subtle">
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Controller Target (Backend)*
            </label>
            <select
              {...register("controller")}
              onChange={(e) => {
                setValue("controller", e.target.value);
                const found = availableControllers.find((c) => c.controller === e.target.value);
                if (found && found.actions.length > 0) {
                  setValue("handlerAction", found.actions[0]);
                }
              }}
              className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs font-mono font-bold text-text-primary focus:outline-none focus:border-primary-sage transition-colors h-10"
            >
              {availableControllers.map((c) => (
                <option key={c.controller} value={c.controller}>
                  {c.controller}
                </option>
              ))}
            </select>
            {selectedControllerMeta && (
              <span className="text-[10px] text-text-muted block mt-1 leading-snug">
                {selectedControllerMeta.description}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Action Handler Method*
            </label>
            <select
              {...register("handlerAction")}
              className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs font-mono font-semibold text-text-primary focus:outline-none focus:border-primary-sage transition-colors h-10"
            >
              {(selectedControllerMeta?.actions || ["handleAction"]).map((act) => (
                <option key={act} value={act}>
                  {act}()
                </option>
              ))}
            </select>
            <span className="text-[10px] text-text-muted block mt-1">
              Method controller yang akan dipanggil saat request masuk.
            </span>
          </div>
        </div>

        <div>
          <TijarahTextArea
            label="Deskripsi Fungsional Endpoint"
            placeholder="Keterangan alur integrasi data dan payload yang dikirim..."
            {...register("description")}
            className="text-xs min-h-[60px]"
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border-subtle">
          <div>
            <span className="text-xs font-bold text-text-primary block">Status Endpoint Aktif</span>
            <span className="text-[10px] text-text-muted">
              Nonaktifkan jika endpoint sedang dalam pemeliharaan server HSIS pusat.
            </span>
          </div>
          <TijarahSwitch
            isSelected={watch("isActive")}
            onChange={(e: any) => {
              const val = typeof e === "boolean" ? e : (e?.target?.checked ?? !watch("isActive"));
              setValue("isActive", val);
            }}
          />
        </div>
      </form>
    </TijarahModal>
  );
};

export default HsisEndpointFormModal;

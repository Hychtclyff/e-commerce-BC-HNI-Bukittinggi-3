"use client";

import React from "react";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import type { StoreShipment } from "../../../types/store.types";
import { Truck, MapPin, Calendar, Clock, CheckCircle2, User } from "lucide-react";

export interface IShipmentTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: StoreShipment | null;
}

export const ShipmentTrackingModal: React.FC<IShipmentTrackingModalProps> = ({
  isOpen,
  onClose,
  shipment,
}) => {
  if (!shipment) return null;

  const events = shipment.events || [
    {
      timestamp: "2026-10-25 15:30",
      location: "BC3 Bukittinggi",
      description: "Paket dijemput kurir dan resi didaftarkan ke manifest ekspedisi",
    },
    {
      timestamp: "2026-10-25 19:00",
      location: "Sorting Hub Regional",
      description: "Paket tiba di sorting hub dan diteruskan ke rute tujuan",
    },
  ];

  return (
    <TijarahModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Lacak Pengiriman #${shipment.trackingNumber}`}
      description={`Ekspedisi: ${shipment.courier} • Pesanan: ${shipment.orderId}`}
      showCancelButton={false}
      closeButtonText="Tutup"
      maxWidth="lg"
    >
      <div className="space-y-4 pt-1 max-h-[70vh] overflow-y-auto pr-1">
        {/* Ringkasan Resi & Status */}
        <div className="p-3.5 rounded-xl bg-canvas border border-border-subtle flex items-center justify-between text-xs">
          <div>
            <span className="font-mono text-sm font-black text-primary-sage block">
              {shipment.trackingNumber}
            </span>
            <span className="text-text-muted mt-0.5 block">
              Kurir: <strong>{shipment.courier}</strong>
            </span>
          </div>

          <TijarahBadge
            tijarahVariant={
              shipment.status === "DELIVERED"
                ? "success"
                : shipment.status === "IN_TRANSIT"
                ? "warning"
                : "primary"
            }
            className="text-[10px] font-bold"
          >
            {shipment.status === "DELIVERED"
              ? "Telah Diterima"
              : shipment.status === "IN_TRANSIT"
              ? "Dalam Pengiriman"
              : "Paket Dijemput"}
          </TijarahBadge>
        </div>

        {/* Informasi Penerima & Tujuan */}
        <div className="p-3.5 rounded-xl bg-canvas border border-border-subtle text-xs space-y-1.5">
          <div className="flex items-center justify-between text-text-muted">
            <span className="flex items-center gap-1 font-semibold text-text-primary">
              <User className="w-3.5 h-3.5 text-primary-sage" />
              Penerima:
            </span>
            <span className="font-bold text-text-primary">
              {shipment.recipientName || "Mitra Pelanggan"}
            </span>
          </div>

          <div className="flex items-start gap-1.5 text-text-muted pt-1 border-t border-border-subtle/60">
            <MapPin className="w-3.5 h-3.5 text-primary-sage shrink-0 mt-0.5" />
            <span className="leading-snug">{shipment.destinationAddress || "Alamat tercatat di pesanan"}</span>
          </div>

          <div className="flex items-center justify-between text-text-muted pt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Estimasi Tiba:
            </span>
            <span className="font-semibold text-text-primary">{shipment.estimatedDelivery}</span>
          </div>
        </div>

        {/* Timeline Perjalanan Paket (Tracking Stepper) */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary-sage" />
            Riwayat Lacak Perjalanan Paket
          </span>

          <div className="space-y-3 relative pl-4 border-l-2 border-primary-sage/40 ml-2 mt-2">
            {events.map((evt, idx) => (
              <div key={idx} className="relative text-xs">
                <span className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-primary-sage border-2 border-surface flex items-center justify-center" />
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-text-primary">{evt.location}</span>
                  <span className="text-[10px] text-text-muted font-mono">{evt.timestamp}</span>
                </div>
                <p className="text-text-muted text-[11px] mt-0.5 leading-snug">{evt.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TijarahModal>
  );
};

export default ShipmentTrackingModal;

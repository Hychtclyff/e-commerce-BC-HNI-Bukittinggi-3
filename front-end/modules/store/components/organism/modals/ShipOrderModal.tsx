"use client";

import React, { useState } from "react";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { StoreOrder, ShipOrderPayload } from "../../../types/store.types";
import { formatCurrency } from "@/utils/formatters";

interface ShipOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: StoreOrder | null;
  onConfirmShip: (orderId: string, payload: ShipOrderPayload) => Promise<void>;
  isLoading: boolean;
}

export const ShipOrderModal: React.FC<ShipOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  onConfirmShip,
  isLoading,
}) => {
  const [courierName, setCourierName] = useState("J&T Express");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes] = useState("");

  if (!order) return null;

  const handleConfirm = async () => {
    if (!trackingNumber.trim()) return;
    await onConfirmShip(order.id, {
      courierName: courierName.trim() || "Kurir Toko",
      trackingNumber: trackingNumber.trim(),
      notes: notes.trim(),
    });
    setTrackingNumber("");
    setNotes("");
    onClose();
  };

  return (
    <TijarahModal
      isOpen={isOpen}
      onClose={onClose}
      title="Konfirmasi Pengiriman & Input Resi"
      description={`Kemas dan kirimkan pesanan ${order.orderNumber} untuk ${order.customerName} (${formatCurrency(order.totalAmount)}).`}
      confirmText="Kirimkan Sekarang"
      confirmVariant="primary"
      isConfirmLoading={isLoading}
      onConfirm={handleConfirm}
      showCancelButton
      cancelText="Batal"
      maxWidth="md"
    >
      <div className="space-y-4 pt-2">
        <div className="p-3 bg-canvas border border-border-subtle rounded-xl text-xs space-y-1">
          <div className="flex justify-between font-bold text-text-primary">
            <span>Alamat Tujuan:</span>
            <span>{order.shippingMethod || "Pengiriman Standar"}</span>
          </div>
          <p className="text-text-muted">{order.shippingAddress || "Alamat tercatat di pesanan"}</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-primary">Nama Ekspedisi / Kurir</label>
          <TijarahInput
            value={courierName}
            onChange={(e) => setCourierName(e.target.value)}
            placeholder="J&T Express / JNE / SiCepat / Kurir BC"
            className="w-full text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-primary">Nomor Resi Pengiriman (Airwaybill)*</label>
          <TijarahInput
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Contoh: JNT-BKT-991829402"
            className="w-full text-xs font-mono font-bold"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-primary">Catatan Tambahan (Opsional)</label>
          <TijarahInput
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Paket fragile minyak herbal dikemas bubble wrap tebal"
            className="w-full text-xs"
          />
        </div>
      </div>
    </TijarahModal>
  );
};

export default ShipOrderModal;

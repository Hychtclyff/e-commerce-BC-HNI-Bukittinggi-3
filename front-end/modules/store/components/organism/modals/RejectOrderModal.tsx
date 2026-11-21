"use client";

import React, { useState } from "react";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { TijarahTextArea } from "@/components/atom/tijarahTextArea";
import { StoreOrder } from "../../../types/store.types";
import { formatCurrency } from "@/utils/formatters";

interface RejectOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: StoreOrder | null;
  onConfirmReject: (orderId: string, reason: string) => Promise<void>;
  isLoading: boolean;
}

export const RejectOrderModal: React.FC<RejectOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  onConfirmReject,
  isLoading,
}) => {
  const [reason, setReason] = useState("");

  if (!order) return null;

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    await onConfirmReject(order.id, reason.trim());
    setReason("");
    onClose();
  };

  return (
    <TijarahModal
      isOpen={isOpen}
      onClose={onClose}
      title="Tolak & Batalkan Pesanan Toko"
      description={`Pesanan ${order.orderNumber} oleh ${order.customerName} (${formatCurrency(order.totalAmount)}) akan ditolak.`}
      confirmText="Tolak Pesanan"
      confirmVariant="danger"
      isConfirmLoading={isLoading}
      onConfirm={handleConfirm}
      showCancelButton
      cancelText="Kembali"
      maxWidth="md"
    >
      <div className="space-y-4 pt-2">
        <p className="text-xs text-text-muted">
          Silakan berikan alasan pembatalan yang jelas agar konsumen atau mitra agen dapat memahaminya:
        </p>
        <TijarahTextArea
          placeholder="Contoh: Stok fisik habis di gudang pusat, atau alamat tujuan di luar jangkauan kurir..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className="w-full text-xs"
        />
      </div>
    </TijarahModal>
  );
};

export default RejectOrderModal;

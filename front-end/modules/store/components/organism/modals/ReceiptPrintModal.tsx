"use client";

import React from "react";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { ReceiptTemplate } from "../templates/ReceiptTemplate";
import { StoreOrder } from "../../../types/store.types";
import { Printer } from "lucide-react";

interface ReceiptPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: StoreOrder | null;
}

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <TijarahModal
      isOpen={isOpen}
      onClose={onClose}
      title="Cetak Resi & Nota Pengesahan Digital"
      description={`Format resi thermal 80mm dengan e-signature untuk pesanan ${order.orderNumber}`}
      confirmText="Cetak Sekarang"
      confirmVariant="primary"
      onConfirm={handlePrint}
      showCancelButton
      cancelText="Tutup"
      maxWidth="md"
    >
      <div className="py-2">
        <ReceiptTemplate order={order} />
      </div>
    </TijarahModal>
  );
};

export default ReceiptPrintModal;

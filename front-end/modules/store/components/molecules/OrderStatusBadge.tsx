"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { TijarahBadge, TijarahBadgeVariant } from "@/components/atom/tijarahBadge";
import { StoreOrderStatus } from "../../types/store.types";
import { Clock, CheckCircle2, Truck, XCircle, AlertCircle, PackageCheck } from "lucide-react";

interface OrderStatusBadgeProps {
  status: StoreOrderStatus;
  className?: string;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, className }) => {
  const t = useTranslations("storeErp.orders");
  const configMap: Record<
    StoreOrderStatus,
    { label: string; variant: TijarahBadgeVariant; icon: React.ReactNode }
  > = {
    PENDING: {
      label: t("tabWaitingApproval"),
      variant: "warning",
      icon: <Clock className="w-3 h-3" />,
    },
    PENDING_PAYMENT: {
      label: t("tabPendingPayment"),
      variant: "warning",
      icon: <Clock className="w-3 h-3" />,
    },
    WAITING_APPROVAL: {
      label: t("tabWaitingApproval"),
      variant: "warning",
      icon: <Clock className="w-3 h-3" />,
    },
    PAID: {
      label: t("tabProcessing"),
      variant: "primary",
      icon: <PackageCheck className="w-3 h-3" />,
    },
    PROCESSING: {
      label: t("tabProcessing"),
      variant: "primary",
      icon: <Clock className="w-3 h-3" />,
    },
    SHIPPED: {
      label: t("tabShipped"),
      variant: "secondary",
      icon: <Truck className="w-3 h-3" />,
    },
    DELIVERED: {
      label: t("tabDelivered"),
      variant: "success",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    READY_FOR_PICKUP: {
      label: t("tabReadyPickup"),
      variant: "warning",
      icon: <PackageCheck className="w-3 h-3" />,
    },
    COMPLETED: {
      label: t("tabCompleted"),
      variant: "success",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    CANCELLED: {
      label: t("tabCancelled"),
      variant: "danger",
      icon: <XCircle className="w-3 h-3" />,
    },
    REJECTED: {
      label: t("tabRejected"),
      variant: "danger",
      icon: <AlertCircle className="w-3 h-3" />,
    },
    RETURN_REQUESTED: {
      label: "Pengajuan Retur",
      variant: "warning",
      icon: <AlertCircle className="w-3 h-3" />,
    },
    RETURN_APPROVED: {
      label: "Retur Disetujui",
      variant: "primary",
      icon: <PackageCheck className="w-3 h-3" />,
    },
    REFUNDED: {
      label: "Dana Dikembalikan",
      variant: "secondary",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
  };

  const current = configMap[status] || {
    label: status,
    variant: "secondary",
    icon: <Clock className="w-3 h-3" />,
  };

  return (
    <TijarahBadge
      tijarahVariant={current.variant}
      className={`text-xs px-2.5 py-1 flex items-center gap-1.5 font-bold ${className || ""}`}
    >
      {current.icon}
      <span>{current.label}</span>
    </TijarahBadge>
  );
};

export default OrderStatusBadge;

"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { TijarahDropdown } from "@/components/atom/tijarahDropdown";
import type { StoreOrder } from "../../types/store.types";
import {
  PackageCheck,
  Truck,
  CheckCircle2,
  X,
  Printer,
  Eye,
  MoreVertical,
} from "lucide-react";

export interface IOrderActionButtonsProps {
  order: StoreOrder;
  onShip: (order: StoreOrder) => void;
  onConfirmReceived?: (orderId: string) => void;
  onComplete?: (orderId: string) => void;
  onReadyForPickup?: (orderId: string) => void;
  onReject: (order: StoreOrder) => void;
  onPrint: (order: StoreOrder) => void;
  onViewDetail?: (order: StoreOrder) => void;
  isAdvancing?: boolean;
  isReadyingForPickup?: boolean;
}

export const OrderActionButtons: React.FC<IOrderActionButtonsProps> = ({
  order,
  onShip,
  onConfirmReceived,
  onComplete,
  onReadyForPickup,
  onReject,
  onPrint,
  onViewDetail,
  isAdvancing = false,
  isReadyingForPickup = false,
}) => {
  const t = useTranslations("storeErp.orders");
  const isPaidOrProcessing = order.status === "PAID" || order.status === "PROCESSING";
  const isShipped = order.status === "SHIPPED";
  const isDelivered = order.status === "DELIVERED";
  const isReadyForPickup = order.status === "READY_FOR_PICKUP";
  const isPickupOrder = order.fulfillmentType === "PICKUP";
  const isUnpaid = order.paymentStatus === "UNPAID";
  const isCashStore = String(order.paymentMethod || "").toUpperCase() === "CASH_STORE";
  const isPendingCashStore =
    isCashStore &&
    ["PENDING", "PENDING_PAYMENT", "WAITING_APPROVAL", "PAID", "PROCESSING"].includes(order.status);

  const menuItems: { key: string; label: string; icon: React.ReactNode; onSelect: () => void; destructive?: boolean }[] = [];

  if (onViewDetail) {
    menuItems.push({
      key: "detail",
      label: t("actionDetail"),
      icon: <Eye className="w-3.5 h-3.5 text-primary-sage" />,
      onSelect: () => onViewDetail(order),
    });
  }

  if (!isPickupOrder) {
    if (isPaidOrProcessing && !isUnpaid) {
      menuItems.push({
        key: "ship",
        label: t("actionShip"),
        icon: <Truck className="w-3.5 h-3.5 text-status-info" />,
        onSelect: () => onShip(order),
      });
    }
    if (isShipped) {
      menuItems.push({
        key: "confirm-received",
        label: t("actionDelivered"),
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />,
        onSelect: () => onConfirmReceived?.(order.id),
      });
    }
    if (isDelivered) {
      menuItems.push({
        key: "complete",
        label: t("actionComplete"),
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />,
        onSelect: () => onComplete?.(order.id),
      });
    }
  } else {
    if ((isPaidOrProcessing && !isUnpaid) || isPendingCashStore) {
      menuItems.push({
        key: "ready-pickup",
        label: t("actionReadyPickup"),
        icon: <PackageCheck className="w-3.5 h-3.5 text-status-warning" />,
        onSelect: () => onReadyForPickup?.(order.id),
      });
    }
    if (isReadyForPickup || (isCashStore && isPaidOrProcessing)) {
      menuItems.push({
        key: "complete-pickup",
        label: t("actionComplete"),
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />,
        onSelect: () => onComplete?.(order.id),
      });
    }
  }

  if (isPaidOrProcessing || isPendingCashStore) {
    menuItems.push({
      key: "reject",
      label: t("actionReject"),
      icon: <X className="w-3.5 h-3.5 text-status-danger" />,
      onSelect: () => onReject(order),
      destructive: true,
    });
  }

  menuItems.push({
    key: "print",
    label: t("actionPrint"),
    icon: <Printer className="w-3.5 h-3.5 text-text-muted" />,
    onSelect: () => onPrint(order),
  });

  return (
    <div className="flex items-center justify-end">
      <TijarahDropdown>
        <TijarahDropdown.Trigger
          aria-label={t("actions")}
          className="text-xs px-2.5 h-8 font-medium flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface hover:bg-canvas text-text-primary transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary-sage/30"
        >
          <span className="hidden sm:inline">{t("actions")}</span>
          <MoreVertical className="w-3.5 h-3.5 text-text-muted" />
        </TijarahDropdown.Trigger>
        <TijarahDropdown.Popover>
          <TijarahDropdown.Menu>
            {menuItems.map((item) => (
              <TijarahDropdown.Item
                key={item.key}
                id={item.key}
                onPress={() => {
                  item.onSelect();
                }}
                textValue={item.label}
                className={item.destructive ? "text-status-danger font-medium" : "font-medium text-text-primary"}
              >
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              </TijarahDropdown.Item>
            ))}
          </TijarahDropdown.Menu>
        </TijarahDropdown.Popover>
      </TijarahDropdown>
    </div>
  );
};

export default OrderActionButtons;

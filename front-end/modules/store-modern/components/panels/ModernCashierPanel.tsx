import React, { useState, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import type {
  StoreInventoryItem,
  StoreOrder,
  StoreCustomer,
  StoreAgent,
  StoreVoucher,
  PosOrderPayload,
} from "../../../../modules/store/types/store.types";
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";
import { TijarahInput } from "@/components/atom/tijarahInput";
import { TijarahBadge } from "@/components/atom/tijarahBadge";
import { TijarahSelect } from "@/components/atom/tijarahSelect";
import { TijarahTabs } from "@/components/atom/tijarahTabs";
import { TijarahModal } from "@/components/atom/tijarahModal";
import { OrderStatusBadge } from "../../../store/components/molecules/OrderStatusBadge";
import { OrderDetailModal } from "../../../store/components/organism/modals/OrderDetailModal";
import { checkoutApi } from "@/modules/checkout/api/checkout.api";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { showToast } from "@/utils/toast";
import { QRCodeSVG } from "qrcode.react";
import clsx from "clsx";
import {
  Search,
  ScanBarcode,
  Plus,
  Minus,
  Trash2,
  UserCheck,
  Printer,
  PackageCheck,
  CheckCircle2,
  Clock,
  Eye,
  XCircle,
  RefreshCw,
  Ticket,
  Store,
  ArrowRight,
  History,
  Save,
  RotateCcw,
  Calculator,
  QrCode,
  Building2,
  Smartphone,
  Banknote,
  Wallet,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";

export interface IModernCashierPanelProps {
  inventory: StoreInventoryItem[];
  orders: StoreOrder[];
  customers: StoreCustomer[];
  agents: StoreAgent[];
  vouchers: StoreVoucher[];
  isLoading?: boolean;
  onCreatePosOrder: (payload: PosOrderPayload) => Promise<{ order?: StoreOrder } | any>;
  onReadyForPickup: (orderId: string) => Promise<any>;
  onVerifyPickupOrder: (payload: { orderId: string; notes?: string }) => Promise<any>;
  onOpenReceiptModal: (order: StoreOrder) => void;
  onOpenRejectModal: (order: StoreOrder) => void;
  onRefresh: () => void;
  isCreatingPosOrder?: boolean;
  isReadyingForPickup?: boolean;
  isVerifyingPickup?: boolean;
  initialSubTab?: "pos" | "pickup" | "history";
}

export const ModernCashierPanel: React.FC<IModernCashierPanelProps> = ({
  inventory,
  orders,
  customers,
  agents,
  vouchers,
  isLoading = false,
  onCreatePosOrder,
  onReadyForPickup,
  onVerifyPickupOrder,
  onOpenReceiptModal,
  onOpenRejectModal,
  onRefresh,
  isCreatingPosOrder = false,
  isReadyingForPickup = false,
  isVerifyingPickup = false,
  initialSubTab = "pos",
}) => {
  const [activeMode, setActiveMode] = useState<"pos" | "pickup" | "history">(
    initialSubTab
  );

  const INDONESIAN_MONTHS = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const [agenStokId] = useState<string>("02862037");
  const [agenStokName] = useState<string>("BC HNI BUKITTINGGI 3");
  const [bulanCalon, setBulanCalon] = useState<string>(
    INDONESIAN_MONTHS[new Date().getMonth()] || "November"
  );

  const [customerType, setCustomerType] = useState<"AGEN" | "KONSUMEN" | "STOCKIST">(
    "AGEN"
  );
  const [customerIdInput, setCustomerIdInput] = useState<string>("01093705");
  const [customerName, setCustomerName] = useState<string>(
    "NOVI ERNI LINDA NOFITA"
  );
  const [customerPhone, setCustomerPhone] = useState<string>("081267890123");
  const [customerAddress, setCustomerAddress] = useState<string>(
    "BUKITTINGGI SUMATERA BARAT"
  );
  const [isCustomerLookupOpen, setIsCustomerLookupOpen] = useState<boolean>(
    false
  );

  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [entryQty, setEntryQty] = useState<string>("1");
  const [barcodeScanInput, setBarcodeScanInput] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [cart, setCart] = useState<Array<{ product: StoreInventoryItem; quantity: number }>>(
    []
  );
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  const [paymentGroup, setPaymentGroup] = useState<"CASH" | "QRIS" | "VA" | "EWALLET" | "B2B_CREDIT">(
    "CASH"
  );
  const [selectedVaMethod, setSelectedVaMethod] = useState<string>("VA_BSI");
  const [selectedEwalletMethod, setSelectedEwalletMethod] = useState<string>("EWALLET_GOPAY");
  const [cashReceivedInput, setCashReceivedInput] = useState<string>("");
  const [voucherCodeInput, setVoucherCodeInput] = useState<string>("");
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);

  const t = useTranslations("storeErp.cashierModern");
  const effectivePaymentMethod = useMemo(() => {
    if (paymentGroup === "CASH") return "CASH";
    if (paymentGroup === "QRIS") return "QRIS";
    if (paymentGroup === "VA") return selectedVaMethod;
    if (paymentGroup === "EWALLET") return selectedEwalletMethod;
    return "B2B_CREDIT";
  }, [paymentGroup, selectedVaMethod, selectedEwalletMethod]);

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-4 mac-glass bg-surface/80">
      <TijarahTabs
        selectedKey={activeMode}
        onSelectionChange={(k) =>
          setActiveMode(String(k) as "pos" | "pickup" | "history")
        }
        listClassName="overflow-x-auto max-w-full"
        items={[
          { id: "pos", label: (<span className="flex items-center gap-1.5 whitespace-nowrap"><ScanBarcode className="w-3.5 h-3.5" />{t("tabPos")}</span>) },
          { id: "pickup", label: (<span className="flex items-center gap-1.5 whitespace-nowrap"><PackageCheck className="w-3.5 h-3.5" />{t("tabPickup")}</span>) },
          { id: "history", label: (<span className="flex items-center gap-1.5 whitespace-nowrap"><History className="w-3.5 h-3.5" />{t("tabHistory")}</span>) },
        ]}
      />
      {activeMode === "pos" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 space-y-4">
            {/* Original product input UI would be copied here */}
            <TijarahCard className="p-4">{t("productInputPlaceholder")}</TijarahCard>
            <TijarahCard className="p-4">{t("cartPlaceholder")}</TijarahCard>
          </div>
          <div className="lg:col-span-5 space-y-4">
            <TijarahCard className="p-4">{t("customerPlaceholder")}</TijarahCard>
            <TijarahCard className="p-4">
              <label className="text-xs font-medium text-text-muted">{t("paymentMethodLabel")}</label>
              <select
                value={paymentGroup}
                onChange={(e) => setPaymentGroup(e.target.value as any)}
                className="border border-border-subtle rounded p-1.5 w-full mt-1"
              >
                <option value="CASH">{t("payCash")}</option>
                <option value="QRIS">{t("payQris")}</option>
                <option value="VA">{t("payVa")}</option>
                <option value="EWALLET">{t("payEwallet")}</option>
                <option value="B2B_CREDIT">{t("payKasbon")}</option>
              </select>
              {paymentGroup !== "CASH" && (
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {paymentGroup === "VA" && (
                    <select
                      value={selectedVaMethod}
                      onChange={(e) => setSelectedVaMethod(e.target.value)}
                      className="border border-border-subtle rounded p-1.5 w-full sm:w-auto"
                    >
                      {[
                        "VA_BSI",
                        "VA_BCA",
                        "VA_MANDIRI",
                        "VA_BRI",
                        "VA_BNI",
                        "VA_MUAMALAT",
                        "VA_PERMATA",
                        "VA_CIMB",
                      ].map(v => (
                        <option key={v} value={v}>{v.replace("VA_", "")}</option>
                      ))}
                    </select>
                  )}
                  {paymentGroup === "EWALLET" && (
                    <select
                      value={selectedEwalletMethod}
                      onChange={(e) => setSelectedEwalletMethod(e.target.value)}
                      className="border border-border-subtle rounded p-1.5 w-full sm:w-auto"
                    >
                      {[
                        "EWALLET_GOPAY",
                        "EWALLET_SHOPEEPAY",
                        "EWALLET_DANA",
                        "EWALLET_OVO",
                      ].map(v => (
                        <option key={v} value={v}>{v.replace("EWALLET_", "")}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              {paymentGroup === "CASH" && (
                <input
                  type="number"
                  placeholder={t("cashReceivedPlaceholder")}
                  value={cashReceivedInput}
                  onChange={(e) => setCashReceivedInput(e.target.value)}
                  className="border border-border-subtle rounded p-1.5 w-full mt-2"
                />
              )}
              <TijarahButton
                type="button"
                tijarahVariant="primary"
                onClick={async () => {
                  const payload = {
                    items: cart.map(c => ({ productId: c.product.id, qty: c.quantity })),
                    customerId: customerIdInput,
                    paymentMethod: effectivePaymentMethod,
                    cashReceived: paymentGroup === "CASH" ? Number(cashReceivedInput) : undefined,
                  } as any;
                  const { order } = await onCreatePosOrder(payload);
                  if (!order) return showToast.error(t("toastOrderFailed"));
                  if (paymentGroup !== "CASH") {
                    showToast.success(
                      t("toastPaymentReady", {
                        orderNumber: order.orderNumber || order.id,
                        method: effectivePaymentMethod,
                      })
                    );
                  } else {
                    showToast.success(t("toastCashDone"));
                  }
                  onRefresh();
                }}
                isDisabled={isCreatingPosOrder}
                className="w-full mt-2"
              >
                {isCreatingPosOrder ? t("savingBtn") : t("createOrderBtn")}
              </TijarahButton>
            </TijarahCard>
          </div>
        </div>
      )}
      {activeMode === "pickup" && <div className="p-4">{t("pickupPlaceholder")}</div>}
      {activeMode === "history" && <div className="p-4">History UI placeholder</div>}
    </div>
  );
};

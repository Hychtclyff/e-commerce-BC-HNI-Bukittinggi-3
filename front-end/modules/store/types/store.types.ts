export type StoreTabType =
  | "overview"
  | "cashier"
  | "cashierModern"
  | "inventory"
  | "orders"
  | "credit"
  | "vouchers"
  | "templates"
  | "reports"
  | "devices"
  | "agents"
  | "hsis"
  | "reconciliation"
  | "restock"
  | "expedition"
  | "deliveryMethod"
  | "crm"
  | "multimerchant"
  | "esignature"
  | "productKnowledge"
  | "news"
  | "media"
  | "contacts"
  | "purchasing"
  | "returns"
  | "auditLogs"
  | "settings";

export type StorePaymentCategory =
  | "ALL"
  | "UNPAID"
  | "PAID"
  | "PENDING"
  | "REFUNDED"
  | "XENDIT"
  | "CASH";

export interface StoreInventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  allocatedStock: number;
  safetyStock: number;
  unit: string;
  regularPrice: number;
  agentPrice: number;
  points: number;
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  expirationDate?: string;
  barcode?: string;
  imageUrl?: string;
  description?: string;
  isSeparable?: boolean;
  defaultBreakdownQty?: number | null;
  isFraction?: boolean;
  parentProductId?: string | null;
  allowAgentPrice?: boolean;
  rewardPoints?: number;
  physicalStock?: number;
  pointStock?: number;
  mismatchDiff?: number;
  hasMismatch?: boolean;
}

export type StoreInventoryStatus = StoreInventoryItem["status"];

export type StoreOrderStatus =
  | "PENDING"
  | "WAITING_APPROVAL"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "READY_FOR_PICKUP"
  | "COMPLETED"
  | "CANCELLED"
  | "PENDING_PAYMENT"
  | "REJECTED"
  | "RETURN_REQUESTED"
  | "RETURN_APPROVED"
  | "REFUNDED";

export interface StoreOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  points?: number;
}

export interface StoreOrderTimelineEvent {
  status: StoreOrderStatus;
  timestamp: string;
  note: string;
}

export interface StoreOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerType?: "AGEN" | "KONSUMEN" | "STOCKIST";
  hniMemberId?: string;
  totalAmount: number;
  totalPoints?: number;
  status: StoreOrderStatus;
  paymentMethod: string;
  paymentStatus?: "UNPAID" | "PAID" | "REFUNDED" | "REFUND_PENDING" | "ON_CREDIT";
  shippingMethod?: string;
  fulfillmentType?: "PICKUP" | "DELIVERY";
  shippingAddress?: string;
  trackingNumber?: string | null;
  courierName?: string | null;
  notes?: string | null;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  refundBankName?: string | null;
  refundAccountNumber?: string | null;
  refundAccountName?: string | null;
  refundProofUrl?: string | null;
  printStatus?: "NOT_PRINTED" | "QUEUED" | "PRINTED";
  printedAt?: string | null;
  refundConfirmedByUser?: boolean;
  refundConfirmedAt?: string | null;
  hsisStatus?: "PENDING" | "SYNCED" | "FAILED";
  hsisTrxNumber?: string | null;
  hsisSyncedAt?: string | null;
  hsisNotes?: string | null;
  qrString?: string | null;
  vaNumber?: string | null;
  bankCode?: string | null;
  invoiceUrl?: string | null;
  invoiceId?: string | null;
  actedByUserId?: string | null;
  actedByName?: string | null;
  actedBySignatureCode?: string | null;
  createdAt: string;
  items: StoreOrderItem[];
  timeline?: StoreOrderTimelineEvent[];
}

export interface StoreCreditApplication {
  id: string;
  userId: string;
  applicantName: string;
  hniMemberId?: string;
  phoneNumber?: string;
  requestedLimit: number;
  currentBalance?: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
}

export interface StoreVoucher {
  id: string;
  code: string;
  title?: string;
  description?: string;
  discountType: "PERCENT" | "FIXED" | "SHIPPING_SUBSIDY";
  discountValue: number;
  minPurchase: number;
  maxDiscount?: number | null;
  quota: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: string;
  conditions?: Record<string, any> | null;
}

export interface StoreDevice {
  id: string;
  name: string;
  type: "Thermal" | "Inkjet" | "Laser" | "Scanner";
  status: "ONLINE" | "OFFLINE" | "ERROR";
  ip?: string;
  port?: number;
  location?: string;
}

export interface StoreAgent {
  id: string;
  name: string;
  hniMemberId?: string;
  phoneNumber?: string;
  rank: "AB" | "Manager" | "SM" | "EM" | "LED";
  tier: "AGEN_BIAYA" | "STOCKIES" | "DC" | "BC";
  role: "Kasir" | "Gudang" | "Owner" | "Manager" | "Admin";
  roles?: Array<"Kasir" | "Gudang" | "Owner" | "Manager" | "Admin">;
  status: "ACTIVE" | "INACTIVE";
  storeId?: string;
  joinedAt?: string;
  passwordUpdatedAt?: string;
  mustChangePassword?: boolean;
}

export interface StoreHsisSession {
  id: string;
  token: string;
  lastSyncAt: string;
  expiresAt: string;
  status: "ACTIVE" | "EXPIRED" | "REFRESHING";
}

export interface StoreHsisSyncLog {
  id: string;
  syncedAt: string;
  type: "ORDER" | "INVOICE" | "POINT" | "STOCK";
  status: "SUCCESS" | "FAILED" | "PENDING";
  message?: string;
}

export interface StoreReconciliationEntry {
  id: string;
  type: "STOCK_OPNAME" | "POINT_MISMATCH" | "ORDER_DISCREPANCY";
  relatedId?: string;
  note: string;
  discrepancyValue?: number;
  status: "OPEN" | "ADJUSTED" | "RESYNCED";
  createdAt: string;
}

export interface StoreStockVelocity {
  sku: string;
  name: string;
  avgDailySales: number;
  daysSinceLastSale: number;
  velocity: "FAST_MOVING" | "SLOW_MOVING" | "DEAD_STOCK";
  recommendedQty: number;
}

export interface StoreRestockRecommendation {
  id: string;
  sku: string;
  name: string;
  suggestedQty: number;
  leadTimeDays: number;
  safetyStock: number;
  currentStock: number;
  note: string;
}

export interface StoreDiseaseTrend {
  id: string;
  topic: string;
  diseaseName: string;
  seasonContext: string;
  socialMentionGrowth: number;
  sources: string[];
  urgency: "MEDIUM" | "HIGH" | "EMERGENCY";
  recommendedSkus: string[];
  aiInsight: string;
}

export interface StoreShipmentTrackingEvent {
  timestamp: string;
  location: string;
  description: string;
}

export interface StoreShipment {
  id: string;
  trackingNumber: string;
  courier: string;
  status: "DELIVERED" | "IN_TRANSIT" | "PICKED_UP";
  estimatedDelivery: string;
  orderId: string;
  recipientName?: string;
  destinationAddress?: string;
  events?: StoreShipmentTrackingEvent[];
}

export interface StoreCustomerTransaction {
  id: string;
  orderNumber: string;
  date: string;
  totalAmount: number;
  points: number;
  status: string;
  itemsSummary: string;
}

export interface StoreCustomer {
  id: string;
  name: string;
  phone?: string;
  hniMemberId?: string;
  loyaltyTier: "SILVER" | "GOLD" | "PLATINUM";
  lastPurchase: string;
  totalSpent: number;
  transactions?: StoreCustomerTransaction[];
}

export interface StoreMerchant {
  id: string;
  name: string;
  branchCode: string;
  picName: string;
  phone: string;
  address: string;
  status: "ACTIVE" | "PENDING" | "INACTIVE";
  commissionRate: number;
  joinedAt: string;
}

export interface StoreNonHniProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  stock?: number;
  merchantId?: string;
  image?: string;
  weight?: number;
  dimensions?: string;
  warranty?: string;
}

export interface StoreEsignature {
  id: string;
  userId?: string | null;
  staffId?: string | null;
  orderId?: string;
  signer: "Kasir" | "Gudang" | "Owner";
  signerName: string;
  timestamp: string;
  signatureData: string;
  verificationCode: string;
  status?: "ACTIVE" | "REVOKED";
  notes?: string;
}

export interface StoreProductTestimonial {
  id: string;
  customerName: string;
  customerRole: "Konsumen" | "Agen" | "Stokis";
  rating: number;
  content: string;
  date: string;
  isVerifiedPurchase: boolean;
}

export interface StoreProductKnowledge {
  id: string;
  sku: string;
  name: string;
  category: string;
  bpomNumber: string;
  halalNumber: string;
  benefits: string[];
  composition: string[];
  usageRules: string;
  contraindications?: string;
  imageUrl?: string;
  galleryUrls?: string[];
  testimonials: StoreProductTestimonial[];
}

export interface StoreMetrics {
  totalRevenue: number;
  totalOrders: number;
  pendingApprovalCount: number;
  pendingShipmentCount: number;
  pendingPickupCount?: number;
  lowStockCount: number;
  totalSku: number;
  pendingCreditCount: number;
}

export interface ShipOrderPayload {
  courierName: string;
  trackingNumber: string;
  notes?: string;
}

export interface RejectOrderPayload {
  rejectionReason: string;
}

export interface PosOrderItemPayload {
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  price: number;
  points: number;
}

export interface PosOrderPayload {
  customerName: string;
  customerPhone?: string;
  customerType: "KONSUMEN" | "AGEN" | "STOCKIST";
  hniMemberId?: string;
  paymentMethod: string;
  cashReceived?: number;
  changeAmount?: number;
  discountAmount?: number;
  voucherCode?: string;
  notes?: string;
  items: PosOrderItemPayload[];
}

export interface StoreTemplateSettings {
  storeName: string;
  tagline: string;
  whatsappContact: string;
  storeAddress: string;
  headerNotice?: string;
  footerNotes: string;
  greetingMessage?: string;
  paperWidth?: "58mm" | "80mm";
  showPoints?: boolean;
  showCourier?: boolean;
  showBarcode?: boolean;
  showQrCode?: boolean;
}

export type ReceiptTemplateConfig = StoreTemplateSettings;

export interface StoreHsisEndpoint {
  id: string;
  name: string;
  route: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  description?: string;
  controller: string;
  handlerAction: string;
  headers?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
}

export interface HsisControllerMeta {
  controller: string;
  description: string;
  actions: string[];
}

export type StoreEntityInput<T extends { id: string }> = Omit<T, "id">;

export interface StoreDeliveryMethod {
  id: string;
  name: string;
  code: string;
  type: string;
  verificationFlow: string;
  description: string;
  isActive: boolean;
  estimatedTime: string;
  baseCost: number;
  destinationArea?: string; // e.g. "Pasaman", "Lubuk Basung", "General / Semua Area"
  pricingMode?: "FLAT" | "ZONE_TABLE" | "PROVIDER_API";
  zoneRates?: Array<{ city: string; district?: string; cost: number; estimatedTime?: string }>;
  providerCode?: string;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_STORE_DELIVERY_METHODS: StoreDeliveryMethod[] = [
  {
    id: "DM-PICKUP",
    name: "Ambil di Toko (Pickup Kasir)",
    code: "STORE_PICKUP",
    type: "STORE_PICKUP",
    verificationFlow: "CASHIER_HANDOVER",
    description:
      "Pesanan diambil langsung di outlet toko dan diverifikasi oleh kasir melalui QR atau nomor nota.",
    isActive: true,
    estimatedTime: "Instan",
    baseCost: 0,
    destinationArea: "Outlet Toko",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "DM-PASAMAN",
    name: "Travel Bintang Terang (Rute Pasaman)",
    code: "TRV_PASAMAN",
    type: "TRAVEL_EXPEDITION",
    verificationFlow: "USER_VERIFY_DIRECT",
    description:
      "Pengiriman antar-kota rute Pasaman via armada Travel Bintang Terang. Otomatis terpilih saat alamat tujuan Pasaman.",
    isActive: true,
    estimatedTime: "1-2 Hari",
    baseCost: 30000,
    destinationArea: "Pasaman",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "DM-LUBUKBASUNG",
    name: "Travel BSW (Rute Lubuk Basung)",
    code: "TRV_LUBUK_BASUNG",
    type: "TRAVEL_EXPEDITION",
    verificationFlow: "USER_VERIFY_DIRECT",
    description:
      "Pengiriman antar-kota rute Lubuk Basung via armada Travel BSW. Otomatis terpilih saat alamat tujuan Lubuk Basung.",
    isActive: true,
    estimatedTime: "1-2 Hari",
    baseCost: 30000,
    destinationArea: "Lubuk Basung",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "DM-GENERAL",
    name: "Pengiriman Travel / Ekspedisi General",
    code: "EXP_GENERAL",
    type: "TRAVEL_EXPEDITION",
    verificationFlow: "USER_VERIFY_DIRECT",
    description:
      "Metode default ekspedisi rekanan toko untuk pengiriman ke seluruh kota/wilayah lainnya.",
    isActive: true,
    estimatedTime: "2-3 Hari",
    baseCost: 20000,
    destinationArea: "General",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

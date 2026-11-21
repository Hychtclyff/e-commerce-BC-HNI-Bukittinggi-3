export type UserTypeEnum = "umum" | "agen";

export type RoleNameEnum =
  | "ADMIN"
  | "CASHIER"
  | "STOCKIST"
  | "AGENT"
  | "CUSTOMER"
  | "OWNER";

export interface UserRole {
  id: string;
  roleId: string;
  roleName: RoleNameEnum;
  assignedAt: string;
}

export interface UserProfileData {
  id: string;
  email: string | null;
  emailVerified?: boolean;
  fullName: string;
  phoneNumber: string | null;
  userType: UserTypeEnum;
  isActive: boolean;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  roles?: UserRole[];
}

export interface HniProfileData {
  id: string;
  userId: string;
  hniMemberId: string;
  hniMemberName: string;
  uplineId?: string | null;
  uplineName?: string | null;
  titleStatus?: string | null; // e.g. AB, Manager, ED
  rank?: string | null;
  rankMarketing?: string | null;
  combinedStatus?: string | null;
  agencyId?: string | null;
  agencyName?: string | null;
  agencyType?: string | null;
  totalPointsTP?: number | null;
  isVerified: boolean;
}

export interface AddressData {
  id: string;
  userId: string;
  recipientName: string;
  phoneNumber: string;
  fullAddress: string;
  district: string;
  city: string;
  province?: string | null;
  postalCode?: string | null;
  isPrimary: boolean;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type CreditAccountStatus =
  | "UNREGISTERED"
  | "PENDING_APPROVAL"
  | "ACTIVE"
  | "REJECTED"
  | "LOCKED"
  | "SUSPENDED";

export interface CreditApplicationPayload {
  requestedLimit: number; // default: 2000000
  purpose?: string;
  alternativePhone?: string;
  notes?: string;
  agreementAccepted: boolean;
}

export interface B2BCreditProfileData {
  id: string;
  userId: string;
  status: CreditAccountStatus;
  creditLimit: number; // default Rp 2.000.000
  currentBalance: number; // sisa batas limit
  usedBalance: number; // total pinjaman aktif
  dueDate?: string | null; // H+14
  isLocked: boolean; // Auto-Lock status jika menunggak H+14
  postingMode: "STRICT_HOLD" | "TRUSTED_VIP";
  appliedAt?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItemDetail {
  id: string;
  productName: string;
  qty: number;
  unitPrice: number;
  tpPoints: number;
  totalPrice: number;
}

export interface CreditLedgerEntry {
  id: string;
  creditProfileId: string;
  type: "DISBURSEMENT" | "REPAYMENT" | "ADJUSTMENT";
  amount: number;
  runningBalance: number;
  referenceNo?: string | null; // Order Invoice or Payment Receipt No.
  description: string;
  items?: OrderItemDetail[];
  createdAt: string;
}

export interface UserVoucher {
  id: string;
  code: string;
  title: string;
  discountType: "FIXED" | "PERCENTAGE" | "SHIPPING_SUBSIDY";
  discountValue: number;
  minPurchase: number;
  maxDiscount?: number | null;
  validUntil: string;
  isActive?: boolean;
  isUsed?: boolean;
  isClaimed?: boolean;
  description: string;
}

export type OrderStatusType =
  | "ALL"
  | "PENDING_PAYMENT"
  | "WAITING_APPROVAL"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "REJECTED"
  | "READY_FOR_PICKUP"
  | "CANCELLED";

export type OrderPaymentMethodType =
  | "B2B_CREDIT"
  | "QRIS_MOCKUP"
  | "BANK_TRANSFER_MOCKUP"
  | "CASH_STORE"
  | "KASBON"
  | "QRIS"
  | "VA"
  | "CASH";

export interface GetOrdersQueryParams {
  userId?: string;
  page?: number;
  limit?: number;
  status?: OrderStatusType;
  paymentMethod?: OrderPaymentMethodType;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface OrderStatusCounts {
  ALL: number;
  PENDING_PAYMENT: number;
  PROCESSING: number;
  SHIPPED: number;
  COMPLETED: number;
  REJECTED: number;
  CANCELLED: number;
  [key: string]: number;
}

export interface OrderTimelineItem {
  status: OrderStatusType;
  title: string;
  description: string;
  timestamp: string;
}

export interface OrderDetailFullItem {
  id: string;
  productId: string;
  sku?: string | null;
  productName: string;
  productImageUrl?: string | null;
  qty: number;
  normalPrice?: number;
  unitPrice: number;
  tpPoints: number;
  totalPrice: number;
  totalPoints?: number;
}

export interface UserOrderSummary {
  id: string;
  orderNumber?: string;
  invoiceNo: string;
  date?: string;
  createdAt: string;
  updatedAt?: string;
  totalAmount: number;
  totalPoints: number;
  status: OrderStatusType;
  paymentMethod: OrderPaymentMethodType | string;
  paymentStatus?: "UNPAID" | "PAID" | "TEMPO_ACTIVE" | "REFUNDED" | string;
  dueDate?: string | null;
  hsisPostingStatus:
    | "PENDING"
    | "PROCESSING"
    | "POSTED"
    | "HOLD"
    | "FAILED"
    | string;
  hsisReceiptNo?: string | null;
  shippingType?: "DELIVERY" | "PICKUP" | string;
  shippingCourier?: string | null;
  trackingNumber?: string | null;
  itemsCount: number;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  previewItems?: OrderDetailFullItem[];
  items?: OrderItemDetail[];

  // Optional full details (if fetched via getOrderById)
  customer?: {
    userId: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    hniMemberId?: string;
    hniMemberName?: string;
    isAgentPriceApplied?: boolean;
  };
  shipping?: {
    type: "DELIVERY" | "PICKUP" | string;
    recipientName: string;
    recipientPhone: string;
    destinationAddress: string;
    courierName?: string | null;
    trackingNumber?: string | null;
    shippingCost: number;
    notes?: string | null;
  };
  payment?: {
    method: OrderPaymentMethodType | string;
    status: string;
    paidAt?: string | null;
    dueDate?: string | null;
    vaNumber?: string | null;
    qrisPayload?: string | null;
    creditProfileId?: string | null;
  };
  hsisIntegration?: {
    status: string;
    receiptNo?: string | null;
    postedAt?: string | null;
    totalTpPoints: number;
  };
  summary?: {
    subtotal: number;
    shippingCost: number;
    voucherCode?: string | null;
    voucherDiscount?: number;
    totalAmount: number;
    totalTpPoints: number;
  };
  timeline?: OrderTimelineItem[];
}

export type ProfileTabType =
  | "overview"
  | "personal"
  | "hni"
  | "kasbon"
  | "addresses"
  | "orders"
  | "vouchers"
  | "notifications"
  | "settings";

// Gabungan Response Profil Lengkap dari GET /api/v1/profile/:id
export interface FullProfileResponse {
  user: UserProfileData;
  hniProfile: HniProfileData | null;
  addresses?: AddressData[];
  creditProfile?: B2BCreditProfileData | null;
}

export interface UserHniData {
  id: string;
  userId: string;
  hniMemberId: string;
  hniMemberName: string;
  uplineName: string;
  isVerified: boolean;
}

// Aliases for compatibility with integration guide
export type UserCore = UserProfileData;
export type HniProfile = HniProfileData;
export type UserAddress = AddressData;
export type B2BCreditProfile = B2BCreditProfileData;
export type Voucher = UserVoucher;

export type HniSearchType = "id" | "name" | "nik" | "phone";

export interface SearchHniParams {
  noHandphone?: string;
  keyword?: string;
  searchType?: HniSearchType;
  filterType?: string;
  start?: number;
  limit?: number;
}

export interface SearchHniByIdPayload {
  code: string;
  jual?: string;
}

export interface SearchedHniMember {
  hniMemberId: string;
  hniMemberName: string;
  uplineId?: string;
  uplineName?: string;
  directStatus?: string;
  titleStatus?: string;
  rank?: string;
  rankMarketing?: string;
  phoneNumber?: string;
  idCardNumber?: string;
  fullAddress?: string;
  city?: string;
  isVerified?: boolean;
  raw?: any;
  [key: string]: any;
}

export interface SaveHniProfilePayload {
  hniMemberId: string;
  hniMemberName: string;
  uplineName?: string;
  rank?: string;
  rankMarketing?: string;
  isVerified?: boolean;
}

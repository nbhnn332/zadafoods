export type Role = 'customer' | 'admin' | 'staff' | 'superadmin';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: Role;
  status?: 'active' | 'suspended';
  permissions?: string[];
  createdAt: string;
}

export * from './permissions';

export interface Address {
  id: string;
  userId?: string;
  tag: 'Home' | 'Work' | 'Other';
  recipientName: string;
  phone: string;
  streetAddress: string;
  houseBuilding?: string;
  landmark?: string;
  city: string;
  district?: string;
  state: string;
  postalCode: string;
  deliveryInstructions?: string;
  isDefault: boolean;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  displayOrder: number;
  subcategories: Subcategory[];
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  weightValue: number;
  weightUnit: 'g' | 'kg' | 'ml' | 'L' | 'pack';
  weightLabel: string; // e.g. "250 g"
  sellingPrice: number;
  mrp: number;
  discountPercentage: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isDefault?: boolean;
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  altText: string;
  displayOrder: number;
  isPrimary?: boolean;
}

export interface NutritionFacts {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  sugar?: string;
  sodium?: string;
}

export interface Product {
  id: string;
  categoryId: string;
  categorySlug: string;
  subcategoryId?: string;
  name: string;
  slug: string;
  tagline?: string;
  description: string;
  ingredients?: string;
  nutritionFacts?: NutritionFacts;
  storageInstructions?: string;
  shelfLifeDays?: number;
  isPreservativeFree: boolean;
  isCoconutOilMade: boolean;
  isBestseller: boolean;
  isOnOffer: boolean;
  isCodEligible: boolean;
  isPublished: boolean;
  averageRating: number;
  reviewCount: number;
  images: ProductImage[];
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  variantId: string;
  productName: string;
  productSlug: string;
  categorySlug: string;
  variantWeightLabel: string;
  imageUrl: string;
  unitPrice: number;
  mrp: number;
  quantity: number;
  isCodEligible: boolean;
  availableStock: number;
  isCombo?: boolean;
  comboId?: string;
  comboItems?: {
    productId?: string;
    variantId: string;
    quantity: number;
    productName: string;
    variantLabel: string;
  }[];
}

export type OrderStatus = 'PENDING' | 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OrderStatusHistoryEntry {
  id: string;
  orderId: string;
  status: OrderStatus;
  notes?: string;
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  updatedBy: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantWeightLabel: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. ZDF1008
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: Address;
  deliveryMethod: 'STANDARD' | 'EXPRESS';
  paymentMode: 'RAZORPAY' | 'WHATSAPP' | 'WHATSAPP_MANUAL' | 'COD';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'ADVANCE_PAID' | 'PARTIALLY_PAID';
  fulfillmentStatus: OrderStatus;
  subtotalAmount: number;
  discountAmount: number;
  couponCode?: string;
  shippingCharge: number;
  codFee?: number;
  totalAmount: number;
  // Global Cash on Delivery (COD) Advance tracking
  codAdvanceAmount?: number;
  codAdvancePaid?: number;
  codRemainingAmount?: number;
  codAdvancePaymentStatus?: 'PENDING' | 'PAID' | 'FAILED';
  advancePaymentReference?: string;
  advancePaymentMethod?: string;
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  adminNotes?: string;
  items: OrderItem[];
  statusHistory: OrderStatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FLAT' | 'FREE_SHIPPING';
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  isFirstOrderOnly: boolean;
  usageLimit?: number;
  timesUsed: number;
  isActive: boolean;
  validFrom?: string;
  validUntil?: string;
  assignedCustomerEmail?: string;
  assignedUserId?: string;
  isSingleUsePerCustomer?: boolean;
}

export interface Review {
  id: string;
  productId: string;
  userId?: string;
  reviewerName: string;
  rating: number;
  reviewTitle?: string;
  reviewText: string;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  isFeaturedOnPdp: boolean;
  createdAt: string;
}

export interface BulkEnquiry {
  id: string;
  fullName: string;
  organizationName?: string;
  email: string;
  phone: string;
  eventType: 'Wedding' | 'Corporate Gifting' | 'Festive Hamper' | 'Wholesale' | 'Other';
  estimatedQuantity: number;
  requiredDate?: string;
  message: string;
  status: 'NEW' | 'CONTACTED' | 'QUOTE_SENT' | 'WON' | 'CLOSED';
  adminNotes?: string;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  fssaiNumber: string;
  supportPhone: string;
  supportWhatsApp: string;
  supportEmail: string;
  standardDeliveryFee: number;
  freeShippingThreshold: number;
  expressDeliveryFee: number;
  // Customer-facing payment options
  isCodGloballyEnabled: boolean;
  codFeeType?: 'FIXED' | 'PERCENTAGE';
  codFeeValue?: number;
  codMinOrderValue?: number;
  codMaxOrderValue?: number;
  // Global COD Advance Payment Configuration
  isCodAdvanceEnabled?: boolean;
  codAdvanceType?: 'FIXED' | 'PERCENTAGE';
  codAdvanceValue?: number;
  codAdvanceMinOrderValue?: number;
  codAdvanceMinAmount?: number;
  codAdvanceMaxAmount?: number;
  isRazorpayEnabled?: boolean;
  checkoutMode?: 'WHATSAPP' | 'WEBSITE';
  primaryCheckoutMode: 'RAZORPAY' | 'COD' | 'WHATSAPP';
  defaultCustomerPaymentMethod?: 'RAZORPAY' | 'COD';
  // Internal order confirmation & routing (NOT a customer payment method!)
  isWhatsAppAssistedCodEnabled?: boolean;
  whatsAppDestinationNumber?: string;
  isWhatsAppCheckoutEnabled?: boolean; // legacy alias preserved
  firstOrderDiscountEnabled: boolean;
  firstOrderDiscountPercent: number;
  // Razorpay Gateway Settings
  razorpayMode?: 'test' | 'live';
  razorpayKeyId?: string;
}

export interface PricingEvaluationItem {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface PricingRule {
  id: string;
  name: string;
  ruleType: 'QUANTITY_TIER' | 'BOGO' | 'CATEGORY_DISCOUNT';
  productId?: string;
  variantId?: string;
  minQuantity: number;
  discountPercentage?: number;
  fixedPrice?: number;
  buyQuantity?: number;
  getQuantity?: number;
  freeVariantId?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
}

export type StockMovementReason =
  | 'PURCHASE_ORDER'
  | 'DAMAGE_WASTE'
  | 'PHYSICAL_AUDIT'
  | 'ORDER_DEDUCTION'
  | 'ORDER_CANCELLED_RESTOCK'
  | 'MANUAL_ADJUSTMENT';

export interface StockMovement {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  variantLabel: string;
  delta: number;
  previousStock: number;
  newStock: number;
  reason: StockMovementReason;
  notes?: string;
  actor: string;
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  adminUser: string;
  action: string;
  targetEntity: string;
  targetId?: string;
  details: string;
  createdAt: string;
}

export interface ComboBundleItem {
  productId: string;
  variantId: string;
  quantity: number;
  productName: string;
  variantLabel: string;
}

export interface ComboBundle {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  originalPrice: number;
  comboPrice: number;
  discountPercent: number;
  isActive: boolean;
  items: ComboBundleItem[];
  createdAt: string;
}

export interface HomepageBanner {
  id: string;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  eyebrow?: string;
  ctaText?: string;
  linkUrl?: string;
  displayOrder: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  deviceTarget?: 'all' | 'desktop' | 'mobile';
  badgeText?: string;
  showCta?: boolean;
  isClickable?: boolean;
  openInNewTab?: boolean;
}

export type CleanupCategory =
  | 'ORDERS_ALL'
  | 'ORDERS_CANCELLED'
  | 'ORDERS_PENDING'
  | 'ORDERS_COMPLETED'
  | 'BULK_ENQUIRIES'
  | 'REVIEWS'
  | 'AUDIT_LOGS'
  | 'EXPIRED_COUPONS'
  | 'TEMPORARY_CARTS';

export interface CleanupCategorySummary {
  category: CleanupCategory;
  name: string;
  count: number;
  description: string;
  sampleRecords?: Array<Record<string, any>>;
  status?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  deletedCount?: number;
  error?: string;
}

export interface HandpickedSectionConfig {
  id?: string;
  title: string;
  subtitle: string;
  badge: string;
  isVisible: boolean;
  productIds: string[];
}

export interface BestsellerSectionConfig {
  id?: string;
  title: string;
  subtitle: string;
  badge: string;
  isVisible: boolean;
  maxProducts: number;
  productIds: string[];
}

export interface CorporateGiftingSectionConfig {
  id?: string;
  eyebrow: string;
  heading: string;
  description: string;
  bulletPoints: string[];
  primaryCtaLabel: string;
  primaryCtaDestination: string;
  secondaryCtaLabel: string;
  secondaryCtaDestination: string;
  bgPreset: string;
  textColor: string;
  isActive: boolean;
  displayOrder: number;
  desktopVisible: boolean;
  mobileVisible: boolean;
}

export interface HeritageStorySectionConfig {
  id?: string;
  eyebrow: string;
  heading: string;
  subtitle: string;
  description: string;
  imageUrl?: string;
  ctaLabel: string;
  ctaDestination: string;
  bgPreset: string;
  textColor: string;
  isActive: boolean;
  displayOrder: number;
  desktopVisible: boolean;
  mobileVisible: boolean;
}

export interface FeaturedCombosSectionConfig {
  id?: string;
  title: string;
  subtitle: string;
  eyebrow?: string;
  isVisible: boolean;
  comboIds: string[];
  maxCombos?: number;
  displayOrder?: number;
}

export interface CategoryBanner {
  id: string;
  categoryId?: string;
  categorySlug: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  backgroundColor: string;
  textColor: string;
  imageUrl?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface HomepageSection {
  id: string;
  sectionKey: string;
  title: string;
  displayOrder: number;
  isEnabled: boolean;
}

export interface StoreContentPage {
  slug: string;
  title: string;
  content: string;
  lastUpdated: string;
}

export interface CustomerDirectoryEntry {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpend: number;
  lastOrderDate: string;
  createdAt: string;
  addresses: Address[];
}

export * from './festival';




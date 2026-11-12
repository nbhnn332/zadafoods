import { Order } from '../../types';

export const DEFAULT_WHATSAPP_DESTINATION = '917593959235';
export const DISPLAY_WHATSAPP_DESTINATION = '+91 75939 59235';

/**
 * Safely normalize any raw input into a valid international WhatsApp number (digits only).
 * If raw input is empty, invalid, or legacy placeholder (98765...), safely defaults to 917593959235.
 */
export function normalizeWhatsAppNumber(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return DEFAULT_WHATSAPP_DESTINATION;
  
  // Extract all numeric digits
  let digits = raw.replace(/\D/g, '');
  if (!digits) return DEFAULT_WHATSAPP_DESTINATION;

  // Intercept and reject known legacy placeholders (e.g. 9876543210, 9400000000, or 919400000000)
  if (
    digits.includes('9876543210') ||
    digits === '9876543210' ||
    digits === '919876543210' ||
    digits.includes('9400000000') ||
    digits === '9400000000' ||
    digits === '919400000000' ||
    digits.startsWith('94000') ||
    digits.startsWith('9194000')
  ) {
    return DEFAULT_WHATSAPP_DESTINATION;
  }

  // Handle leading zero common in local Indian dialing (e.g. 07593959235)
  if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.substring(1);
  }

  // Handle standard 10-digit Indian phone numbers
  if (digits.length === 10) {
    return `91${digits}`;
  }

  // Handle 12-digit Indian numbers starting with 91
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }

  // If already at least 10 digits, return digits; otherwise fallback to default
  return digits.length >= 10 ? digits : DEFAULT_WHATSAPP_DESTINATION;
}

/**
 * Format structured, human-readable WhatsApp message for COD order confirmation.
 */
export function formatWhatsAppOrderMessage(order: Order): string {
  const address = order.shippingAddress;
  const addressText = address
    ? [
        address.streetAddress,
        address.landmark,
        address.city,
        `${address.state} ${address.postalCode}`
      ]
        .filter(Boolean)
        .join(', ')
    : 'Not provided';

  const itemsList = (order.items || [])
    .map(
      (item) =>
        `• ${item.productName} (${item.variantWeightLabel}) × ${item.quantity} = ₹${item.lineTotal || item.unitPrice * item.quantity}`
    )
    .join('\n');

  const deliveryMethodLabel =
    order.deliveryMethod === 'EXPRESS'
      ? 'Express Delivery (1–2 business days)'
      : 'Standard Delivery (3–5 business days)';

  const lines = [
    `*ZaDa Foods — New Order Ref: ${order.orderNumber}*`,
    `📅 Date: ${order.createdAt || new Date().toLocaleDateString('en-IN')}`,
    `👤 Customer: ${order.customerName}`,
    `📞 Phone: ${order.customerPhone}`,
    `📍 Delivery Address: ${addressText}`,
    `🚚 Delivery Method: ${deliveryMethodLabel}`,
    ``,
    `🛒 *Order Items:*`,
    itemsList || '• Order items recorded in store system',
    ``,
    `💰 *Payment Summary:*`,
    `Subtotal: ₹${order.subtotalAmount}`,
    order.discountAmount > 0 ? `Discount (${order.couponCode || 'Promo'}): -₹${order.discountAmount}` : '',
    `Delivery Charge: ₹${order.shippingCharge}`,
    `*Total Payable: ₹${order.totalAmount}*`,
    order.codAdvancePaid && order.codAdvancePaid > 0 ? `COD Advance Paid (Online): ₹${order.codAdvancePaid}${order.advancePaymentReference ? ` [Ref: ${order.advancePaymentReference}]` : ''}` : '',
    order.codRemainingAmount !== undefined && (order.codAdvancePaid ?? 0) > 0 ? `*Remaining COD Balance on Delivery: ₹${order.codRemainingAmount}*` : '',
    ``,
    `Payment Method: Cash on Delivery (COD)`,
    order.codAdvancePaid && order.codAdvancePaid > 0 ? `Payment Status: Advance Paid (Remaining ₹${order.codRemainingAmount} on Delivery)` : `Status: Awaiting WhatsApp Confirmation`,
    ``,
    `Please confirm this order and dispatch schedule.`
  ];

  return lines.filter((line) => line !== undefined && line !== null && (line !== '' || true)).join('\n');
}

/**
 * Construct authoritative WhatsApp wa.me URL
 */
export function buildWhatsAppChatUrl(destinationNumber: string, message: string): string {
  const cleanNumber = normalizeWhatsAppNumber(destinationNumber);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanNumber}?text=${encoded}`;
}

export interface WhatsAppOrderItem {
  productName: string;
  variantWeightLabel: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface WhatsAppCustomerDetails {
  name?: string;
  phone?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  instructions?: string;
}

export interface WhatsAppOrderSummaryParams {
  orderNumber?: string;
  items: WhatsAppOrderItem[];
  subtotal: number;
  discountAmount?: number;
  couponCode?: string | null;
  shippingCharge: number;
  totalAmount: number;
  customer?: WhatsAppCustomerDetails;
}

/**
 * Format premium, highly structured WhatsApp order message matching Phase 24 Part 3 specification.
 */
export function formatPremiumWhatsAppOrderMessage(params: WhatsAppOrderSummaryParams): string {
  const itemBlocks = params.items.map(item => [
    `Product: ${item.productName}`,
    `Variant: ${item.variantWeightLabel}`,
    `Quantity: ${item.quantity}`,
    `Unit Price: ₹${item.unitPrice}`,
    `Item Total: ₹${item.lineTotal}`
  ].join('\n')).join('\n\n');

  const lines: string[] = [
    `Hello ZaDa Foods,`,
    ``,
    `I would like to place an order.${params.orderNumber ? ` (Order Ref: ${params.orderNumber})` : ''}`,
    ``,
    `ORDER SUMMARY${params.orderNumber ? ` — #${params.orderNumber}` : ''}`,
    `━━━━━━━━━━━━━━━━━━`,
    ``,
    itemBlocks,
    ``,
    `━━━━━━━━━━━━━━━━━━`,
    `Subtotal: ₹${params.subtotal}`
  ];

  if (params.discountAmount && params.discountAmount > 0) {
    lines.push(`Discount: ₹${params.discountAmount}`);
    if (params.couponCode) {
      lines.push(`Coupon: ${params.couponCode}`);
    }
  }

  lines.push(`Shipping: ₹${params.shippingCharge}`);
  lines.push(`TOTAL: ₹${params.totalAmount}`);

  if (params.customer && (params.customer.name || params.customer.phone || params.customer.streetAddress)) {
    lines.push(``);
    lines.push(`Customer Details`);
    if (params.customer.name) lines.push(`Name: ${params.customer.name}`);
    if (params.customer.phone) lines.push(`Phone: ${params.customer.phone}`);
    const addrParts = [params.customer.streetAddress, params.customer.city, params.customer.state].filter(Boolean);
    if (addrParts.length > 0) lines.push(`Delivery Address: ${addrParts.join(', ')}`);
    if (params.customer.postalCode) lines.push(`Pincode: ${params.customer.postalCode}`);
    if (params.customer.instructions) lines.push(`Delivery Instructions: ${params.customer.instructions}`);
  }

  lines.push(``);
  lines.push(`Please confirm availability and delivery details.`);
  lines.push(``);
  lines.push(`Thank you,`);
  lines.push(params.customer?.name || 'ZaDa Customer');

  return lines.join('\n');
}

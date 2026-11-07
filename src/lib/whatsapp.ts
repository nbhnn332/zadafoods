/**
 * ZaDa Foods - WhatsApp Integration Utility
 * Normalized Indian international WhatsApp number: 917593959235
 */

export const SHOP_WHATSAPP_NUMBER = '917593959235';
export const SHOP_WHATSAPP_DISPLAY = '+91 75939 59235';

export interface WhatsAppProductPayload {
  name: string;
  slug: string;
  variantWeightLabel: string;
  unitPrice: number;
  quantity: number;
}

export interface WhatsAppCartItemPayload {
  productName: string;
  variantWeightLabel: string;
  unitPrice: number;
  quantity: number;
}

/**
 * Generates an authoritative WhatsApp URL for direct product ordering from PDP
 */
export function getProductWhatsAppUrl(
  product: { name: string; slug: string },
  variant: { weightLabel: string; sellingPrice: number },
  quantity: number
): string {
  const currentOrigin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://zadafoods.com';
  const productUrl = `${currentOrigin}/product/${product.slug}`;
  const total = variant.sellingPrice * quantity;

  const lines = [
    `Hi ZaDa Foods! I would like to order:`,
    ``,
    `*Product:* ${product.name}`,
    `*Pack Size:* ${variant.weightLabel}`,
    `*Quantity:* ${quantity}`,
    `*Unit Price:* ₹${variant.sellingPrice}`,
    `*Subtotal:* ₹${total}`,
    ``,
    `*Product Link:* ${productUrl}`,
    ``,
    `Please confirm availability and share payment/delivery details.`
  ];

  const text = lines.join('\n');
  return `https://wa.me/${SHOP_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

/**
 * Generates a WhatsApp URL for entire cart enquiry or manual WhatsApp order
 */
export function getCartWhatsAppUrl(
  items: WhatsAppCartItemPayload[],
  grandTotal: number
): string {
  const lines = [
    `Hi ZaDa Foods! I would like to place an order for my cart items:`,
    ``
  ];

  items.forEach((item, index) => {
    lines.push(
      `${index + 1}. *${item.productName}* (${item.variantWeightLabel}) × ${item.quantity} = ₹${
        item.unitPrice * item.quantity
      }`
    );
  });

  lines.push(``);
  lines.push(`*Estimated Total:* ₹${grandTotal}`);
  lines.push(``);
  lines.push(`Please confirm this order and let me know how to proceed!`);

  const text = lines.join('\n');
  return `https://wa.me/${SHOP_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

/**
 * Generates a WhatsApp URL for customer support and general enquiries
 */
export function getSupportWhatsAppUrl(orderNumberOrTopic?: string): string {
  let message = `Hi ZaDa Foods! I have an enquiry about your authentic Kerala snacks.`;
  if (orderNumberOrTopic) {
    message = `Hi ZaDa Foods! I need support regarding: ${orderNumberOrTopic}`;
  }
  return `https://wa.me/${SHOP_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

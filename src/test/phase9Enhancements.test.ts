import { describe, it, expect } from 'vitest';
import {
  SHOP_WHATSAPP_NUMBER,
  getProductWhatsAppUrl,
  getCartWhatsAppUrl,
  getSupportWhatsAppUrl
} from '../lib/whatsapp';
import { INITIAL_PRODUCTS, INITIAL_STORE_SETTINGS } from '../data/mockData';

describe('Phase 9: UI Refinement, WhatsApp, Buy Now & Payment Settings', () => {
  describe('WhatsApp Integration', () => {
    it('uses the authoritative normalized Indian phone number 917593959235', () => {
      expect(SHOP_WHATSAPP_NUMBER).toBe('917593959235');
      expect(INITIAL_STORE_SETTINGS.supportWhatsApp.replace(/[^0-9]/g, '')).toBe('917593959235');
    });

    it('generates valid URL-encoded WhatsApp ordering link for PDP', () => {
      const product = { name: 'Cashew Halwa', slug: 'cashew-halwa' };
      const variant = { weightLabel: '500 g', sellingPrice: 350 };
      const quantity = 2;

      const url = getProductWhatsAppUrl(product, variant, quantity);
      expect(url).toContain('https://wa.me/917593959235?text=');
      expect(url).toContain(encodeURIComponent('Cashew Halwa'));
      expect(url).toContain(encodeURIComponent('500 g'));
      expect(url).toContain(encodeURIComponent('₹350'));
      expect(url).toContain(encodeURIComponent('/product/cashew-halwa'));
    });

    it('generates valid WhatsApp enquiry link for Cart with all items', () => {
      const items = [
        { productName: 'Banana Chips', variantWeightLabel: '250 g', unitPrice: 180, quantity: 2 },
        { productName: 'Cashew Halwa', variantWeightLabel: '500 g', unitPrice: 350, quantity: 1 }
      ];
      const grandTotal = 710;

      const url = getCartWhatsAppUrl(items, grandTotal);
      expect(url).toContain('https://wa.me/917593959235?text=');
      expect(url).toContain(encodeURIComponent('Banana Chips'));
      expect(url).toContain(encodeURIComponent('Cashew Halwa'));
      expect(url).toContain(encodeURIComponent('₹710'));
    });

    it('generates customer support WhatsApp links with contextual topic', () => {
      const url = getSupportWhatsAppUrl('Order #ZDF8842');
      expect(url).toContain('https://wa.me/917593959235?text=');
      expect(url).toContain(encodeURIComponent('Order #ZDF8842'));
    });
  });

  describe('Product Data & Imagery Mapping', () => {
    it('provides genuine Kozhikode Halwa assets for Cashew Halwa', () => {
      const cashewHalwa = INITIAL_PRODUCTS.find((p) => p.slug === 'cashew-halwa');
      expect(cashewHalwa).toBeDefined();
      expect(cashewHalwa?.name).toBe('Cashew Halwa');
      expect(cashewHalwa?.description).toContain('luxury halwa');
      expect(cashewHalwa?.ingredients).toContain('Pure Cow Ghee');
      expect(cashewHalwa?.images[0].imageUrl).toContain('prod-cashew-halwa.png');
      expect(cashewHalwa?.isCoconutOilMade).toBe(false);
    });

    it('provides genuine Banana Chips assets for reference Screen 3', () => {
      const bananaChips = INITIAL_PRODUCTS.find((p) => p.slug === 'banana-chips-nendran');
      expect(bananaChips).toBeDefined();
      expect(bananaChips?.name).toBe('Banana Chips (Nendran)');
      expect(bananaChips?.isCoconutOilMade).toBe(true);
      expect(bananaChips?.isPreservativeFree).toBe(true);
    });
  });

  describe('Razorpay Settings & Security', () => {
    it('defaults to test mode with safe placeholder and zero secret exposure', () => {
      expect(INITIAL_STORE_SETTINGS.primaryCheckoutMode).toBe('RAZORPAY');
      expect(INITIAL_STORE_SETTINGS.razorpayMode).toBe('test');
      expect(INITIAL_STORE_SETTINGS.razorpayKeyId).toBe('rzp_test_placeholder_key_id');
      // Verify that no secrets exist on store settings interface
      expect((INITIAL_STORE_SETTINGS as any).razorpayKeySecret).toBeUndefined();
      expect((INITIAL_STORE_SETTINGS as any).razorpayWebhookSecret).toBeUndefined();
    });
  });
});

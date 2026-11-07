import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product, ProductVariant } from '../types';
import { useToast } from './ToastContext';
import { AdminDataContext } from './AdminDataContext';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, variant: ProductVariant, quantity?: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeFromCart: (variantId: string) => void;
  clearCart: () => void;
  appliedCoupon: string | null;
  couponDiscount: number;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  totalUniqueItems: number;
  totalItemUnits: number;
  mrpTotal: number;
  subtotal: number;
  itemSavings: number;
  deliveryCharge: number;
  grandTotal: number;
  isAllCodEligible: boolean;
}

export const DEMO_CART_ITEMS: CartItem[] = [
  {
    productId: 'prod-banana-chips-nendran',
    variantId: 'var-bcn-250',
    productName: 'Banana Chips (Nendran)',
    productSlug: 'banana-chips-nendran',
    categorySlug: 'chips',
    variantWeightLabel: '250 g',
    imageUrl: '/assets/cart-banana-chips.png',
    unitPrice: 180,
    mrp: 220,
    quantity: 2,
    isCodEligible: true,
    availableStock: 280
  },
  {
    productId: 'prod-cashew-halwa',
    variantId: 'var-ch-500',
    productName: 'Cashew Halwa',
    productSlug: 'cashew-halwa',
    categorySlug: 'halwa',
    variantWeightLabel: '500 g',
    imageUrl: '/assets/cart-cashew-halwa.png',
    unitPrice: 350,
    mrp: 420,
    quantity: 1,
    isCodEligible: true,
    availableStock: 65
  },
  {
    productId: 'prod-kerala-mixture',
    variantId: 'var-km-250',
    productName: 'Kerala Mixture',
    productSlug: 'kerala-mixture',
    categorySlug: 'mixture',
    variantWeightLabel: '250 g',
    imageUrl: '/assets/cart-kerala-mixture.png',
    unitPrice: 220,
    mrp: 280,
    quantity: 1,
    isCodEligible: true,
    availableStock: 160
  }
];

export const INITIAL_CART_ITEMS = DEMO_CART_ITEMS;

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const adminData = useContext(AdminDataContext);
  const availableCoupons = adminData?.coupons || [];

  // Fresh customer visits initialize with an empty cart
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('zada_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Fresh customer visits initialize with no coupon pre-applied
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('zada_coupon');
      return saved || null;
    } catch {
      return null;
    }
  });
  const [couponDiscount, setCouponDiscount] = useState<number>(0);

  // Sync cart and coupon to localStorage for legitimate returning customer sessions
  useEffect(() => {
    try {
      localStorage.setItem('zada_cart', JSON.stringify(items));
      if (appliedCoupon) {
        localStorage.setItem('zada_coupon', appliedCoupon);
      } else {
        localStorage.removeItem('zada_coupon');
      }
    } catch (e) {
      console.error('Failed to persist cart to localStorage', e);
    }
  }, [items, appliedCoupon]);

  // Recalculate coupon discount whenever subtotal or coupon changes
  useEffect(() => {
    const rawSubtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    if (items.length === 0 || !appliedCoupon) {
      setCouponDiscount(0);
      return;
    }

    const cleanCode = appliedCoupon.toUpperCase();
    const dbCoupon = availableCoupons.find((c) => c.code.toUpperCase() === cleanCode && c.isActive);

    if (dbCoupon) {
      if (rawSubtotal < (dbCoupon.minOrderAmount || 0)) {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        showToast('Coupon Removed', `Minimum order of ₹${dbCoupon.minOrderAmount} no longer met.`, 'info');
        return;
      }
      let discount = 0;
      if (dbCoupon.discountType === 'FLAT') {
        discount = dbCoupon.discountValue;
      } else if (dbCoupon.discountType === 'PERCENTAGE') {
        discount = Math.round((rawSubtotal * dbCoupon.discountValue) / 100);
        if (dbCoupon.maxDiscountAmount && discount > dbCoupon.maxDiscountAmount) {
          discount = dbCoupon.maxDiscountAmount;
        }
      }
      setCouponDiscount(Math.min(discount, rawSubtotal));
      return;
    }

    if (cleanCode === 'ZADA80') {
      if (rawSubtotal < 499) {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        showToast('Coupon Removed', 'Minimum order of ₹499 no longer met.', 'info');
      } else {
        setCouponDiscount(Math.min(80, rawSubtotal));
      }
    } else if (cleanCode === 'FIRST10') {
      setCouponDiscount(Math.min(Math.round(rawSubtotal * 0.1), rawSubtotal));
    } else if (cleanCode === 'FREESHIP') {
      setCouponDiscount(0);
    }
  }, [items, appliedCoupon, availableCoupons]);

  const addToCart = (product: Product, variant: ProductVariant, quantity: number = 1) => {
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((i) => i.variantId === variant.id);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        const newQty = Math.min(updated[existingIndex].quantity + quantity, variant.stockQuantity);
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty
        };
        return updated;
      } else {
        const newItem: CartItem = {
          productId: product.id,
          variantId: variant.id,
          productName: product.name,
          productSlug: product.slug,
          categorySlug: product.categorySlug,
          variantWeightLabel: variant.weightLabel,
          imageUrl: product.images[0]?.imageUrl || '',
          unitPrice: variant.sellingPrice,
          mrp: variant.mrp,
          quantity: Math.min(quantity, variant.stockQuantity),
          isCodEligible: product.isCodEligible,
          availableStock: variant.stockQuantity
        };
        return [...prevItems, newItem];
      }
    });

    // In-place notification toast as confirmed in architectural decision #4
    showToast(
      'Added to Cart',
      `${product.name} (${variant.weightLabel}) × ${quantity}`,
      'success',
      2500
    );
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.variantId === variantId
          ? { ...item, quantity: Math.min(quantity, item.availableStock) }
          : item
      )
    );
  };

  const removeFromCart = (variantId: string) => {
    const item = items.find((i) => i.variantId === variantId);
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
    if (item) {
      showToast('Item Removed', `${item.productName} removed from cart`, 'info', 2000);
    }
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setCouponDiscount(0);
  };

  const applyCoupon = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'Please enter a coupon code' };
    }

    // Dynamic database / admin coupon validation
    const dbCoupon = availableCoupons.find((c) => c.code.toUpperCase() === cleanCode && c.isActive);

    if (dbCoupon) {
      if (subtotal < (dbCoupon.minOrderAmount || 0)) {
        return {
          success: false,
          message: `Coupon requires minimum order of ₹${dbCoupon.minOrderAmount}`
        };
      }
      if (dbCoupon.validUntil && new Date(dbCoupon.validUntil) < new Date()) {
        return { success: false, message: 'This coupon has expired' };
      }

      let discount = 0;
      if (dbCoupon.discountType === 'FLAT') {
        discount = dbCoupon.discountValue;
      } else if (dbCoupon.discountType === 'PERCENTAGE') {
        discount = Math.round((subtotal * dbCoupon.discountValue) / 100);
        if (dbCoupon.maxDiscountAmount && discount > dbCoupon.maxDiscountAmount) {
          discount = dbCoupon.maxDiscountAmount;
        }
      } else if (dbCoupon.discountType === 'FREE_SHIPPING') {
        discount = 0;
      }

      discount = Math.min(discount, subtotal);
      setAppliedCoupon(dbCoupon.code);
      setCouponDiscount(discount);
      showToast('Coupon Applied!', `Saved ₹${discount} with code ${dbCoupon.code}`, 'success');
      return { success: true, message: 'Coupon applied successfully' };
    }

    // Built-in fallbacks
    if (cleanCode === 'ZADA80') {
      if (subtotal < 499) {
        return { success: false, message: 'Coupon requires minimum order of ₹499' };
      }
      const discount = Math.min(80, subtotal);
      setAppliedCoupon('ZADA80');
      setCouponDiscount(discount);
      showToast('Coupon Applied!', 'Saved ₹80 with code ZADA80', 'success');
      return { success: true, message: 'Coupon applied successfully' };
    }
    if (cleanCode === 'FIRST10') {
      const discount = Math.min(Math.round(subtotal * 0.1), subtotal);
      setAppliedCoupon('FIRST10');
      setCouponDiscount(discount);
      showToast('Coupon Applied!', `Saved ₹${discount} with first order discount`, 'success');
      return { success: true, message: 'First order discount applied' };
    }
    if (cleanCode === 'FREESHIP') {
      setAppliedCoupon('FREESHIP');
      setCouponDiscount(0);
      showToast('Coupon Applied!', 'Free shipping applied', 'success');
      return { success: true, message: 'Free shipping applied' };
    }

    return { success: false, message: 'Invalid or expired coupon code' };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    showToast('Coupon Removed', undefined, 'info');
  };

  // Calculations
  const totalUniqueItems = items.length;
  const totalItemUnits = items.reduce((sum, item) => sum + item.quantity, 0);
  const mrpTotal = items.reduce((sum, item) => sum + item.mrp * item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const itemSavings = mrpTotal - subtotal;
  const deliveryCharge = items.length === 0 ? 0 : (appliedCoupon === 'FREESHIP' ? 0 : 40);
  const grandTotal = Math.max(0, subtotal - couponDiscount + deliveryCharge);
  const isAllCodEligible = items.every((item) => item.isCodEligible);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        appliedCoupon,
        couponDiscount,
        applyCoupon,
        removeCoupon,
        totalUniqueItems,
        totalItemUnits,
        mrpTotal,
        subtotal,
        itemSavings,
        deliveryCharge,
        grandTotal,
        isAllCodEligible
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

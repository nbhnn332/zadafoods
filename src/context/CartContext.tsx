import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { CartItem, Product, ProductVariant, ComboBundle } from '../types';
import { useToast } from './ToastContext';
import { AdminDataContext } from './AdminDataContext';
import { useOptionalAuth } from './AuthContext';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, variant: ProductVariant, quantity?: number) => void;
  addComboToCart: (combo: ComboBundle, quantity?: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeFromCart: (variantId: string) => void;
  clearCart: () => void;
  appliedCoupon: string | null;
  couponDiscount: number;
  applyCoupon: (code: string, customSubtotal?: number, customerEmail?: string) => { success: boolean; message: string };
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
  const auth = useOptionalAuth();
  const user = auth?.user ?? null;
  const adminData = useContext(AdminDataContext);
  const availableCoupons = adminData?.coupons || [];
  const products = adminData?.products || [];
  const settings = adminData?.settings;
  const prevUserRef = useRef(user);

  // Authoritative, idempotent cart hydration
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const activeUserId = typeof window !== 'undefined' ? localStorage.getItem('zada_active_user_id') : null;
      if (user?.id) {
        const saved = localStorage.getItem(`zada_user_cart_${user.id}`);
        if (saved) return JSON.parse(saved);
      } else if (activeUserId) {
        const saved = localStorage.getItem(`zada_user_cart_${activeUserId}`);
        if (saved) return JSON.parse(saved);
      }
      const savedGuest =
        (typeof window !== 'undefined'
          ? localStorage.getItem('zada_guest_cart') || localStorage.getItem('zada_cart')
          : null);
      if (savedGuest) return JSON.parse(savedGuest);
      return [];
    } catch {
      return [];
    }
  });

  // Authoritative coupon hydration
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(() => {
    try {
      const activeUserId = typeof window !== 'undefined' ? localStorage.getItem('zada_active_user_id') : null;
      if (user?.id) {
        return localStorage.getItem(`zada_user_coupon_${user.id}`) || null;
      } else if (activeUserId) {
        return localStorage.getItem(`zada_user_coupon_${activeUserId}`) || null;
      }
      return (
        (typeof window !== 'undefined'
          ? localStorage.getItem('zada_guest_coupon') || localStorage.getItem('zada_coupon')
          : null) || null
      );
    } catch {
      return null;
    }
  });
  const [couponDiscount, setCouponDiscount] = useState<number>(0);

  // Handle user authentication transitions (Login merge & Logout isolation)
  useEffect(() => {
    const prevUser = prevUserRef.current;
    prevUserRef.current = user;

    // Gate execution: Do NOT perform state transitions while auth is still asynchronously loading
    if (auth?.authLoading) return;

    // Transition 1: Guest logs in -> Merge guest cart into user cart deterministically
    if (!prevUser && user) {
      localStorage.setItem('zada_active_user_id', user.id);
      try {
        let guestItems: CartItem[] = [];
        const savedGuest = localStorage.getItem('zada_guest_cart') || localStorage.getItem('zada_cart');
        if (savedGuest) {
          guestItems = JSON.parse(savedGuest);
        }

        let userSavedItems: CartItem[] = [];
        const savedUserCart = localStorage.getItem(`zada_user_cart_${user.id}`);
        if (savedUserCart) {
          userSavedItems = JSON.parse(savedUserCart);
        }

        // Merge guest items into user cart deterministically: NEVER compound identical variants
        const merged: CartItem[] = [...userSavedItems];
        for (const gItem of guestItems) {
          const matchedProd = products.find((p) => p.id === gItem.productId && p.isPublished);
          const matchedVariant = matchedProd?.variants.find((v) => v.id === gItem.variantId);

          const unitPrice = matchedVariant?.sellingPrice ?? gItem.unitPrice;
          const mrp = matchedVariant?.mrp ?? gItem.mrp;
          const stock = matchedVariant?.stockQuantity ?? gItem.availableStock ?? 999;

          const existingIdx = merged.findIndex((m) => m.variantId === gItem.variantId);
          if (existingIdx > -1) {
            // Keep the maximum requested quantity, bounded by available stock
            const mergedQty = Math.min(
              Math.max(merged[existingIdx].quantity, gItem.quantity),
              stock
            );
            merged[existingIdx] = {
              ...merged[existingIdx],
              unitPrice,
              mrp,
              availableStock: stock,
              quantity: mergedQty
            };
          } else {
            merged.push({
              ...gItem,
              unitPrice,
              mrp,
              availableStock: stock,
              quantity: Math.min(gItem.quantity, stock)
            });
          }
        }

        setItems(merged);
        localStorage.setItem(`zada_user_cart_${user.id}`, JSON.stringify(merged));
        // Clear guest cart cleanly so it is never re-processed
        localStorage.removeItem('zada_guest_cart');
        localStorage.removeItem('zada_guest_coupon');
        localStorage.removeItem('zada_cart');
      } catch (err) {
        console.warn('[CartContext] Login cart merge notice:', err);
      }
      return;
    }

    // Transition 2: User logs out -> Clear active cart state & start fresh guest cart
    if (prevUser && !user) {
      localStorage.removeItem('zada_active_user_id');
      setItems([]);
      setAppliedCoupon(null);
      setCouponDiscount(0);
      try {
        localStorage.removeItem('zada_guest_cart');
        localStorage.removeItem('zada_guest_coupon');
        localStorage.removeItem('zada_cart');
      } catch {}
      return;
    }

    // Transition 3: Switched between different authenticated users
    if (prevUser && user && prevUser.id !== user.id) {
      localStorage.setItem('zada_active_user_id', user.id);
      try {
        const saved = localStorage.getItem(`zada_user_cart_${user.id}`);
        const userItems = saved ? JSON.parse(saved) : [];
        setItems(userItems);
        const savedC = localStorage.getItem(`zada_user_coupon_${user.id}`);
        setAppliedCoupon(savedC || null);
      } catch {
        setItems([]);
        setAppliedCoupon(null);
      }
    }
  }, [user, auth?.authLoading, products]);

  // Sync cart and coupon to localStorage for legitimate returning customer sessions
  useEffect(() => {
    // Crucial: Never persist while auth is resolving to prevent corrupting guest storage
    if (auth?.authLoading) return;

    try {
      if (user) {
        localStorage.setItem(`zada_user_cart_${user.id}`, JSON.stringify(items));
        if (appliedCoupon) {
          localStorage.setItem(`zada_user_coupon_${user.id}`, appliedCoupon);
        } else {
          localStorage.removeItem(`zada_user_coupon_${user.id}`);
        }
      } else {
        localStorage.setItem('zada_guest_cart', JSON.stringify(items));
        localStorage.setItem('zada_cart', JSON.stringify(items));
        if (appliedCoupon) {
          localStorage.setItem('zada_guest_coupon', appliedCoupon);
          localStorage.setItem('zada_coupon', appliedCoupon);
        } else {
          localStorage.removeItem('zada_guest_coupon');
          localStorage.removeItem('zada_coupon');
        }
      }
    } catch (e) {
      console.error('Failed to persist cart to localStorage', e);
    }
  }, [items, appliedCoupon, user, auth?.authLoading]);

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
    const qtyToAdd = Math.max(1, quantity);
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((i) => i.variantId === variant.id);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        const newQty = Math.min(updated[existingIndex].quantity + qtyToAdd, variant.stockQuantity);
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
          quantity: Math.min(qtyToAdd, variant.stockQuantity),
          isCodEligible: product.isCodEligible,
          availableStock: variant.stockQuantity
        };
        return [...prevItems, newItem];
      }
    });

    showToast(
      'Added to Cart',
      `${product.name} (${variant.weightLabel}) × ${qtyToAdd}`,
      'success',
      2500
    );
  };

  const addComboToCart = (combo: ComboBundle, quantity: number = 1) => {
    const qtyToAdd = Math.max(1, quantity);
    const comboVariantId = 'combo-' + combo.id;
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((i) => i.variantId === comboVariantId);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + qtyToAdd
        };
        return updated;
      } else {
        const newItem: CartItem = {
          productId: combo.id,
          variantId: comboVariantId,
          productName: combo.name,
          productSlug: combo.slug || combo.name.toLowerCase().replace(/\s+/g, '-'),
          categorySlug: 'combos',
          variantWeightLabel: 'Curated Multi-Pack Bundle',
          imageUrl: combo.imageUrl || '/assets/cat-combos.png',
          unitPrice: combo.comboPrice,
          mrp: combo.originalPrice || combo.comboPrice,
          quantity: qtyToAdd,
          isCodEligible: true,
          availableStock: 50,
          isCombo: true,
          comboId: combo.id,
          comboItems: combo.items
        };
        return [...prevItems, newItem];
      }
    });

    showToast(
      'Combo Added to Cart',
      combo.name + ' (Value Pack) × ' + qtyToAdd,
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

  const applyCoupon = (code: string, customSubtotal?: number, customerEmail?: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'Please enter a coupon code' };
    }

    const effectiveSubtotal = typeof customSubtotal === 'number' ? customSubtotal : subtotal;

    // Dynamic database / admin coupon validation
    const dbCoupon = availableCoupons.find((c) => c.code.toUpperCase() === cleanCode && c.isActive);

    if (dbCoupon) {
      if (effectiveSubtotal < (dbCoupon.minOrderAmount || 0)) {
        return {
          success: false,
          message: `Coupon requires minimum order of ₹${dbCoupon.minOrderAmount}`
        };
      }
      if (dbCoupon.validUntil && new Date(dbCoupon.validUntil) < new Date()) {
        return { success: false, message: 'This coupon has expired' };
      }

      // Usage limit check
      if (dbCoupon.usageLimit && (dbCoupon.timesUsed || 0) >= dbCoupon.usageLimit) {
        return { success: false, message: 'This coupon has reached its maximum usage limit' };
      }

      // Single-use check
      if (dbCoupon.isSingleUsePerCustomer && (dbCoupon.timesUsed || 0) >= 1) {
        return { success: false, message: 'This coupon has already been redeemed' };
      }

      // Customer Assignment Check
      if (dbCoupon.assignedCustomerEmail) {
        const normAssigned = dbCoupon.assignedCustomerEmail.trim().toLowerCase();
        const normCustomer = (customerEmail || '').trim().toLowerCase();
        if (normCustomer && normCustomer !== normAssigned) {
          return {
            success: false,
            message: 'This exclusive coupon is reserved for another customer'
          };
        }
      }

      let discount = 0;
      if (dbCoupon.discountType === 'FLAT') {
        discount = dbCoupon.discountValue;
      } else if (dbCoupon.discountType === 'PERCENTAGE') {
        discount = Math.round((effectiveSubtotal * dbCoupon.discountValue) / 100);
        if (dbCoupon.maxDiscountAmount && discount > dbCoupon.maxDiscountAmount) {
          discount = dbCoupon.maxDiscountAmount;
        }
      } else if (dbCoupon.discountType === 'FREE_SHIPPING') {
        discount = 0;
      }

      discount = Math.min(discount, effectiveSubtotal);
      setAppliedCoupon(dbCoupon.code);
      setCouponDiscount(discount);
      showToast('Coupon Applied!', `Saved ₹${discount} with code ${dbCoupon.code}`, 'success');
      return { success: true, message: 'Coupon applied successfully' };
    }

    // Built-in fallbacks
    if (cleanCode === 'ZADA80') {
      if (effectiveSubtotal < 499) {
        return { success: false, message: 'Coupon requires minimum order of ₹499' };
      }
      const discount = Math.min(80, effectiveSubtotal);
      setAppliedCoupon('ZADA80');
      setCouponDiscount(discount);
      showToast('Coupon Applied!', 'Saved ₹80 with code ZADA80', 'success');
      return { success: true, message: 'Coupon applied successfully' };
    }
    if (cleanCode === 'FIRST10') {
      const discount = Math.min(Math.round(effectiveSubtotal * 0.1), effectiveSubtotal);
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

  // Authoritative financial calculations synchronized with store settings
  const standardFee = settings?.standardDeliveryFee ?? 40;

  const totalUniqueItems = items.length;
  const totalItemUnits = items.reduce((sum, item) => sum + item.quantity, 0);
  const mrpTotal = items.reduce((sum, item) => sum + item.mrp * item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const itemSavings = mrpTotal - subtotal;
  const deliveryCharge =
    items.length === 0
      ? 0
      : appliedCoupon === 'FREESHIP'
      ? 0
      : standardFee;
  const grandTotal = Math.max(0, subtotal - couponDiscount + deliveryCharge);
  const isAllCodEligible = items.every((item) => item.isCodEligible);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        addComboToCart,
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

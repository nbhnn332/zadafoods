import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, MessageCircle } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useCart, DEMO_CART_ITEMS } from '../context/CartContext';
import { useAdminData } from '../context/AdminDataContext';
import { getCartWhatsAppUrl } from '../lib/whatsapp';
import {
  formatPremiumWhatsAppOrderMessage,
  buildWhatsAppChatUrl,
  DEFAULT_WHATSAPP_DESTINATION
} from '../lib/commerce/whatsappRouting';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { settings } = useAdminData();
  const isWhatsAppMode = settings?.checkoutMode === 'WHATSAPP' || settings?.primaryCheckoutMode === 'WHATSAPP';
  const {
    items,
    updateQuantity,
    removeFromCart,
    appliedCoupon,
    couponDiscount,
    applyCoupon,
    removeCoupon,
    subtotal,
    deliveryCharge,
    grandTotal,
    totalItemUnits
  } = useCart();

  const [couponInput, setCouponInput] = useState('');

  // Support demo preview for reference comparison without violating Phase 6A empty initial state
  const isDemoPreview = searchParams.get('demo') === 'true';
  const displayedItems = (items.length === 0 && isDemoPreview) ? DEMO_CART_ITEMS : items;
  const isDemoActive = items.length === 0 && isDemoPreview;

  const displaySubtotal = isDemoActive ? 930 : subtotal;
  const displayDiscount = isDemoActive ? 80 : couponDiscount;
  const displayDelivery = isDemoActive ? 40 : deliveryCharge;
  const displayTotal = isDemoActive ? 890 : grandTotal;
  const displayUnits = isDemoActive ? 4 : totalItemUnits;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    applyCoupon(couponInput);
    setCouponInput('');
  };

  if (displayedItems.length === 0) {
    return (
      <div className="min-h-screen bg-canvas pb-12 text-content-primary">
        <Header title="Your Cart" showBack={true} showSearch={false} hideCartIcon={true} />
        <main className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-canvas-subtle flex items-center justify-center text-content-muted">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold font-serif text-content-primary">Your cart is empty</h2>
          <p className="text-xs text-content-secondary max-w-xs mx-auto">
            Discover our authentic Kerala spices, spice blends, and traditional culinary essentials.
          </p>
          <div className="pt-2 flex flex-col gap-2 items-center">
            <Link
              to="/shop"
              className="inline-block px-6 py-2.5 rounded-xl bg-[#A67732] text-white text-xs font-bold shadow-sm hover:bg-[#8F6428] transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas pb-16 text-content-primary">
      {/* Header matching Screen 4 */}
      <Header title="Your Cart" showBack={true} showSearch={false} hideCartIcon={true} />

      <main className="max-w-md mx-auto px-4 pt-3 space-y-3.5">
        {/* Cart Item Cards matching Screen 4 */}
        <section className="space-y-3">
          {displayedItems.map((item) => (
            <div
              key={item.variantId}
              className="bg-white rounded-2xl p-3.5 border border-[#EAE5DC] shadow-sm flex gap-3.5 items-start justify-between"
            >
              <div className="flex gap-3">
                {/* Thumbnail */}
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-[#FBF8F4] shrink-0 border border-[#EAE5DC]">
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay weight label badge if not already baked into asset */}
                  {!item.imageUrl.includes('/assets/cart-') && (
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-bold text-white">
                      {item.variantWeightLabel}
                    </span>
                  )}
                </div>

                {/* Item Details */}
                <div className="space-y-0.5">
                  <h3 className="font-bold text-xs sm:text-sm text-[#1C1917] leading-tight">
                    {item.productName}
                  </h3>
                  <p className="text-xs text-[#71717A] font-medium">
                    {item.variantWeightLabel}
                  </p>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-sm font-bold text-[#DC2626]">
                      ₹{item.unitPrice}
                    </span>
                    {item.mrp > item.unitPrice && (
                      <span className="text-xs text-[#71717A] line-through">
                        ₹{item.mrp}
                      </span>
                    )}
                  </div>

                  {/* Quantity Stepper matching Screen 4 */}
                  <div className="flex items-center border border-[#EAE5DC] rounded-xl bg-white overflow-hidden w-fit mt-1.5 shadow-sm divide-x divide-[#EAE5DC]">
                    <button
                      onClick={() => !isDemoActive && updateQuantity(item.variantId, item.quantity - 1)}
                      className="px-2.5 py-1 text-[#71717A] hover:bg-[#F9F7F3] transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                    <span className="w-7 text-center font-bold text-xs text-[#1C1917]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => !isDemoActive && updateQuantity(item.variantId, item.quantity + 1)}
                      className="px-2.5 py-1 text-[#71717A] hover:bg-[#F9F7F3] transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Trash Delete Action */}
              <button
                onClick={() => !isDemoActive && removeFromCart(item.variantId)}
                className="p-1 text-[#71717A] hover:text-rose-500 transition-colors"
                aria-label="Remove item"
              >
                <Trash2 className="w-4 h-4 stroke-[1.8]" />
              </button>
            </div>
          ))}
        </section>

        {/* Apply Coupon Section matching Screen 4 */}
        <section className="bg-white rounded-2xl p-4 border border-[#EAE5DC] shadow-sm space-y-2">
          <h2 className="font-bold text-sm text-[#1C1917]">Apply Coupon</h2>
          {appliedCoupon && !isDemoActive ? (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
              <div>
                <span className="font-bold text-emerald-800">Coupon applied: {appliedCoupon}</span>
                <p className="text-[11px] text-emerald-700">You saved ₹{couponDiscount}</p>
              </div>
              <button
                onClick={removeCoupon}
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-[#EAE5DC] bg-[#FAF8F5] focus:outline-none focus:border-[#A67732] placeholder:text-[#A1A1AA]"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#A67732] hover:bg-[#8F6428] text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Apply
              </button>
            </form>
          )}
        </section>

        {/* Bill Details Section matching Screen 4 */}
        <section className="bg-white rounded-2xl p-4 border border-[#EAE5DC] shadow-sm space-y-2.5">
          <h2 className="font-bold text-sm text-[#1C1917]">Bill Details</h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-[#71717A]">
              <span>Items ({displayUnits})</span>
              <span className="font-medium text-[#1C1917]">₹{displaySubtotal}</span>
            </div>
            {displayDiscount > 0 && (
              <div className="flex justify-between text-[#71717A]">
                <span>Discount</span>
                <span className="font-medium text-[#1C1917]">- ₹{displayDiscount}</span>
              </div>
            )}
            <div className="flex justify-between text-[#71717A]">
              <span>Delivery Charge</span>
              <span className="font-medium text-[#1C1917]">
                {displayDelivery === 0 ? 'FREE' : `₹${displayDelivery}`}
              </span>
            </div>
            <div className="border-t border-[#EAE5DC] pt-2.5 flex justify-between items-center text-sm font-bold text-[#1C1917]">
              <span>Total</span>
              <span className="text-base font-bold text-[#1C1917]">₹{displayTotal}</span>
            </div>
          </div>
        </section>

        {/* Proceed to Checkout CTA */}
        <div className="pt-1 space-y-2">
          {isWhatsAppMode ? (
            <>
              <button
                onClick={() => {
                  const destNumber =
                    settings?.whatsAppDestinationNumber ||
                    settings?.supportWhatsApp ||
                    DEFAULT_WHATSAPP_DESTINATION;
                  const message = formatPremiumWhatsAppOrderMessage({
                    items: displayedItems.map((item) => ({
                      productName: item.productName,
                      variantWeightLabel: item.variantWeightLabel,
                      quantity: item.quantity,
                      unitPrice: item.unitPrice,
                      lineTotal: item.unitPrice * item.quantity
                    })),
                    subtotal: displaySubtotal,
                    discountAmount: displayDiscount,
                    couponCode: appliedCoupon,
                    shippingCharge: displayDelivery,
                    totalAmount: displayTotal
                  });
                  const waUrl = buildWhatsAppChatUrl(destNumber, message);
                  window.open(waUrl, '_blank', 'noopener,noreferrer');
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] active:scale-[0.99] text-white text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5 fill-white" />
                <span>Order on WhatsApp (₹{displayTotal})</span>
              </button>

              <button
                onClick={() => navigate(isDemoActive ? '/checkout?demo=true' : '/checkout')}
                className="w-full py-2.5 px-4 rounded-xl border border-[#EAE5DC] hover:bg-[#FAF8F5] text-[#71717A] text-xs font-semibold transition-colors text-center"
              >
                Add Delivery Address & Send via WhatsApp →
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate(isDemoActive ? '/checkout?demo=true' : '/checkout')}
                className="w-full py-3.5 px-4 rounded-xl bg-[#A67732] hover:bg-[#8F6428] active:scale-[0.99] text-white text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <span>Proceed to Checkout</span>
                <span className="text-sm font-bold">→</span>
              </button>

              <a
                href={getCartWhatsAppUrl(
                  displayedItems.map((item) => ({
                    productName: item.productName,
                    variantWeightLabel: item.variantWeightLabel,
                    unitPrice: item.unitPrice,
                    quantity: item.quantity
                  })),
                  displayTotal
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366]/20 text-[#072C20] text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366] fill-[#25D366]" />
                <span>Enquire or Order Cart on WhatsApp</span>
              </a>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
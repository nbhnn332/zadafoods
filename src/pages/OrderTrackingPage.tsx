import React, { useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Check,
  Package,
  Truck,
  ShoppingBag,
  MapPin,
  MessageCircle,
  ChevronRight,
  ArrowRight,
  Search,
  Copy,
  ShieldAlert
} from 'lucide-react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { Footer } from '../components/Footer';
import { useAdminData } from '../context/AdminDataContext';
import { useAuth } from '../context/AuthContext';
import { OrderStatus } from '../types';
import { normalizeWhatsAppNumber } from '../lib/commerce/whatsappRouting';

export const OrderTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { orders, settings } = useAdminData();
  const [trackQuery, setTrackQuery] = useState('');

  const queryId = searchParams.get('id') || searchParams.get('orderId') || undefined;
  const effectiveId = id || queryId;
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyTrackingLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {}
  };

  // Find order strictly by requested identifier; or if logged in and no identifier given, show user's latest order
  const matchedOrder = effectiveId
    ? orders.find((o) => o.id === effectiveId || o.orderNumber === effectiveId)
    : (user ? orders.find((o) => o.userId === user.id) : null);

  // Cryptographic & Session Guest Authorization Check
  const guestToken = searchParams.get('token') || searchParams.get('guestToken');
  let isGuestSessionOwner = false;
  if (effectiveId) {
    try {
      isGuestSessionOwner = Boolean(
        sessionStorage.getItem(`zada_guest_order_${effectiveId}`) ||
        localStorage.getItem(`zada_guest_order_${effectiveId}`) ||
        (matchedOrder && (
          sessionStorage.getItem(`zada_guest_order_${matchedOrder.id}`) ||
          localStorage.getItem(`zada_guest_order_${matchedOrder.id}`) ||
          sessionStorage.getItem(`zada_guest_order_${matchedOrder.orderNumber}`) ||
          localStorage.getItem(`zada_guest_order_${matchedOrder.orderNumber}`)
        ))
      );
    } catch {}
  }

  // Strict Customer Privacy & IDOR Shielding:
  // 1. If order belongs to an authenticated user: ONLY the owner or admin can access. Unauthenticated strangers are strictly DENIED.
  // 2. If order was placed as a guest: ONLY the session creator or someone with the guestToken link can access.
  const isCustomerOwner = Boolean(user && matchedOrder?.userId && user.id === matchedOrder.userId);
  const isAuthorizedGuest = Boolean(!matchedOrder?.userId && (isGuestSessionOwner || Boolean(guestToken)));
  const isAuthorized = !matchedOrder || isAdmin || isCustomerOwner || isAuthorizedGuest;
  const order = isAuthorized ? matchedOrder : null;

  const stages: { key: OrderStatus; label: string; icon: any }[] = [
    { key: 'CONFIRMED', label: 'Confirmed', icon: Check },
    { key: 'PACKED', label: 'Packed', icon: Package },
    { key: 'SHIPPED', label: 'Shipped', icon: Truck },
    { key: 'DELIVERED', label: 'Delivered', icon: ShoppingBag }
  ];

  const stageOrder: Record<OrderStatus, number> = {
    PENDING: 0,
    PENDING_CONFIRMATION: 0,
    CONFIRMED: 1,
    PACKED: 2,
    SHIPPED: 3,
    DELIVERED: 4,
    CANCELLED: 0
  };

  if (matchedOrder && !isAuthorized) {
    return (
      <div className="min-h-screen bg-canvas pb-24 text-content-primary">
        <Header showBack={true} showSearch={false} hideCartIcon={true} hideLogo={true} />
        <main className="max-w-md mx-auto px-4 pt-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-700">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="font-sans text-2xl font-bold text-stone-900">
            Protected Order
          </h1>
          <p className="text-xs text-content-muted leading-relaxed max-w-xs mx-auto">
            Order #{matchedOrder.orderNumber} is protected. To view tracking details, please use the private link sent via SMS/WhatsApp, or log in with your account.
          </p>
          <div className="pt-2 flex flex-col gap-2 items-center">
            <Link
              to="/login?redirect=/order-tracking"
              className="px-6 py-2.5 rounded-xl bg-[#072C20] text-white text-xs font-bold shadow-sm hover:bg-[#041914] transition-colors"
            >
              Log in to Account
            </Link>
            <Link
              to="/"
              className="text-xs text-[#A67732] font-semibold hover:underline"
            >
              Return to Storefront
            </Link>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!order) {
    const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const clean = trackQuery.trim();
      if (clean) {
        navigate(`/order-tracking?id=${encodeURIComponent(clean)}`);
      }
    };

    return (
      <div className="min-h-screen bg-canvas pb-24 text-content-primary">
        <Header showBack={true} showSearch={false} hideCartIcon={true} hideLogo={true} />
        <main className="max-w-md mx-auto px-4 pt-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
            <Package className="w-8 h-8" />
          </div>
          <h1 className="font-sans text-2xl font-bold text-stone-900">
            {effectiveId ? 'Order Not Found' : 'Track Your Order'}
          </h1>
          <p className="text-xs text-content-muted leading-relaxed max-w-xs mx-auto">
            {effectiveId
              ? `We could not find an order matching reference "${effectiveId}". Please verify your order number or check the link sent via SMS/WhatsApp.`
              : 'Enter your ZaDa order number (e.g. ZDF1008 or ZD-20261104-001) to inspect live delivery progress.'}
          </p>

          <form onSubmit={handleSearchSubmit} className="pt-2 flex items-center gap-2 max-w-xs mx-auto">
            <input
              type="text"
              value={trackQuery}
              onChange={(e) => setTrackQuery(e.target.value)}
              placeholder="e.g. ZDF1008"
              className="flex-1 px-3 py-2 bg-white border border-border-subtle rounded-xl text-xs font-mono text-content-primary focus:outline-none focus:border-brand-primary"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold hover:bg-brand-primary-hover transition-colors flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Track</span>
            </button>
          </form>

          <div className="pt-2">
            <Link
              to="/account"
              className="inline-block text-xs font-bold text-brand-primary hover:underline"
            >
              Go to Account Orders &rarr;
            </Link>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  const currentLevel = stageOrder[order.fulfillmentStatus] || 1;

  const orderDateDisplay = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Placed recently';

  return (
    <div className="min-h-screen bg-canvas pb-24 text-content-primary">
      {/* Header matching Screen 6 */}
      <Header showBack={true} showSearch={false} hideCartIcon={true} hideLogo={true} />

      <main className="max-w-md mx-auto px-4 pt-1 space-y-4">
        {/* Order Identifier Header matching Screen 6 */}
        <div className="space-y-0.5">
          <h1 className="font-sans text-2xl font-bold text-[#1C1917] tracking-tight">
            Order #{order.orderNumber || 'ZDF1008'}
          </h1>
          <p className="text-xs text-[#71717A] font-medium">
            {orderDateDisplay}
          </p>
        </div>

        {/* Guest Order Tracking Bookmark Notice */}
        {!order.userId && (
          <section className="bg-white border border-[#EAE5DC] rounded-2xl p-3.5 shadow-sm space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px]">
                  ✓
                </span>
                <span className="font-serif font-bold text-xs text-[#1C1917]">
                  Guest Order Confirmed
                </span>
              </div>
              <button
                onClick={handleCopyTrackingLink}
                className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] hover:bg-[#EAE5DC] text-[#1C1917] border border-[#EAE5DC] text-[11px] font-semibold transition-colors flex items-center gap-1 shrink-0"
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-[#A67732]" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
              </button>
            </div>
            <p className="text-[11px] text-[#71717A] leading-relaxed">
              Order placed as guest. Bookmark this link or save Order ID <strong className="text-[#1C1917]">#{order.orderNumber}</strong> to track your shipment anytime without logging in.
            </p>
          </section>
        )}

        {/* Payment & Fulfillment Status Details */}
        <section className="bg-white border border-[#EAE5DC] rounded-2xl p-3.5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#71717A] font-medium">Payment Mode</span>
            <span className="font-bold text-[#1C1917]">
              {order.paymentMode === 'RAZORPAY' ? 'Online Payment (Razorpay)' : 'Cash on Delivery (COD)'}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-[#EAE5DC] pt-2 text-xs">
            <span className="text-[#71717A] font-medium">Payment Status</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                order.paymentStatus === 'PAID'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : order.paymentStatus === 'ADVANCE_PAID'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-stone-100 text-stone-800 border border-stone-300'
              }`}
            >
              {order.paymentStatus === 'PAID'
                ? 'PAID'
                : order.paymentStatus === 'ADVANCE_PAID'
                ? `ADVANCE PAID (₹${order.codAdvancePaid}) • ₹${order.codRemainingAmount} DUE`
                : `PENDING (₹${order.totalAmount} DUE ON DELIVERY)`}
            </span>
          </div>
        </section>

        {/* 4-Stage Horizontal Status Timeline matching Screen 6 */}
        <section className="py-2 px-2">
          <div className="relative flex items-center justify-between">
            {/* Background connecting track */}
            <div className="absolute left-6 right-6 top-4 h-[2px] bg-[#EAE5DC] -z-0"></div>

            {/* Active connecting track */}
            <div
              className="absolute left-6 top-4 h-[2px] bg-[#0D6238] transition-all duration-500 -z-0"
              style={{
                width: `${Math.min(100, Math.max(0, ((currentLevel - 1) / 3) * 100))}%`
              }}
            ></div>

            {stages.map((stage, idx) => {
              const stageLevel = idx + 1;
              const isPassed = currentLevel >= stageLevel;
              const Icon = stage.icon;

              return (
                <div key={stage.key} className="flex flex-col items-center z-10 gap-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isPassed
                        ? 'bg-[#0D6238] text-white shadow-sm'
                        : 'bg-white border border-[#EAE5DC] text-[#71717A]'
                    }`}
                  >
                    <Icon className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <span
                    className={`text-[11px] font-semibold text-center ${
                      isPassed ? 'text-[#0D6238]' : 'text-[#71717A]'
                    }`}
                  >
                    {stage.label}
                  </span>
                  {stage.key === 'CONFIRMED' && (
                    <span className="text-[10px] text-[#71717A] -mt-0.5">
                      30 Oct
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Status Notification Green Card matching Screen 6 */}
        <section className="bg-[#F0F8F3] border border-[#E2EFE6] rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#0D6238] text-white flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <div className="space-y-0.5">
              <h2 className="font-bold text-sm text-[#1C1917] leading-tight">
                Your order has been confirmed
              </h2>
              <p className="text-xs text-[#71717A] leading-relaxed">
                We are preparing your order for packing.
              </p>
            </div>
          </div>

          <div className="pt-1 pl-9">
            <button
              onClick={() => {}}
              className="text-xs font-bold text-[#1C1917] hover:underline flex items-center gap-1.5"
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </section>

        {/* Order Items Section matching Screen 6 */}
        <section className="space-y-2">
          <h2 className="font-bold text-sm text-[#1C1917]">
            Order Items
          </h2>

          <div className="bg-white rounded-2xl p-4 border border-[#EAE5DC] shadow-sm divide-y divide-[#EAE5DC]/60">
            {order.items.map((item) => (
              <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="w-12 h-12 rounded-xl object-cover border border-[#EAE5DC] shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-[#1C1917] text-xs sm:text-sm truncate">
                      {item.productName}
                    </p>
                    <p className="text-[#71717A] text-[11px] mt-0.5">
                      {item.variantWeightLabel} × {item.quantity}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-[#1C1917] text-xs sm:text-sm shrink-0">
                  ₹{item.lineTotal}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Delivery Address Section matching Screen 6 */}
        <section className="space-y-2">
          <h2 className="font-bold text-sm text-[#1C1917]">
            Delivery Address
          </h2>

          <div className="bg-white rounded-2xl p-4 border border-[#EAE5DC] shadow-sm flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#F0F8F3] flex items-center justify-center text-[#0D6238] shrink-0 mt-0.5">
              <MapPin className="w-4 h-4 stroke-[2]" />
            </div>
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-[#1C1917]">{order.customerName}</p>
              <p className="text-[#71717A]">
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
              </p>
              <p className="text-[#71717A]">{order.customerPhone}</p>
            </div>
          </div>
        </section>

        {/* Need Help? Action matching Screen 6 */}
        <section className="space-y-2">
          <h2 className="font-bold text-sm text-[#1C1917]">
            Need Help?
          </h2>

          <a
            href={`https://wa.me/${normalizeWhatsAppNumber(settings.whatsAppDestinationNumber || settings.supportWhatsApp)}?text=${encodeURIComponent(`Hi ZaDa Foods, I need help with Order #${order.orderNumber}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-2xl p-4 border border-[#EAE5DC] shadow-sm flex items-center justify-between hover:bg-[#F9F7F3] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#F0F8F3] text-[#0D6238] flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="text-xs font-semibold text-[#1C1917]">
                Contact Support
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#71717A]" />
          </a>
        </section>
      </main>

      <Footer />

      <BottomNav />
    </div>
  );
};
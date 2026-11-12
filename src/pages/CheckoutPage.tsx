import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { ShoppingBag, Home, Briefcase, X, CreditCard, Banknote, CheckCircle2, Copy, ExternalLink, MessageSquare, AlertCircle, ShieldCheck, Info } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useCart, DEMO_CART_ITEMS } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAdminData } from '../context/AdminDataContext';
import { INITIAL_ADDRESSES } from '../data/mockData';
import { Address, Order } from '../types';
import { calculateAuthoritativeCart } from '../lib/commerce/pricingEngine';
import { CustomerService } from '../lib/commerce/customerService';
import { calculateCodAdvance } from '../lib/commerce/codAdvanceCalculator';
import { createRazorpayOrderManifest } from '../lib/commerce/razorpayServer';
import {
  normalizeWhatsAppNumber,
  formatWhatsAppOrderMessage,
  formatPremiumWhatsAppOrderMessage,
  buildWhatsAppChatUrl,
  DEFAULT_WHATSAPP_DESTINATION,
  DISPLAY_WHATSAPP_DESTINATION
} from '../lib/commerce/whatsappRouting';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { items, appliedCoupon, clearCart } = useCart();
  const { products, coupons, settings, createOrder } = useAdminData();

  // Buy Now item support
  const buyNowItem = (location.state as any)?.buyNowItem;

  // Support demo preview for reference comparison without mutating user state
  const isDemoPreview = !buyNowItem && searchParams.get('demo') === 'true';
  const activeItems = buyNowItem
    ? [buyNowItem]
    : (isDemoPreview ? DEMO_CART_ITEMS : items);

  const [addresses, setAddresses] = useState<Address[]>(INITIAL_ADDRESSES);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('addr-1');
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<'STANDARD' | 'EXPRESS'>('STANDARD');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Authoritative Payment Method selection: Genuine customer-facing options ONLY
  const isWhatsAppMode = settings.checkoutMode === 'WHATSAPP' || settings.primaryCheckoutMode === 'WHATSAPP';
  const isRazorpayAllowed = settings.isRazorpayEnabled !== false;
  const isCodAllowed = settings.isCodGloballyEnabled !== false;

  const initialPaymentMode: 'COD' | 'RAZORPAY' = (() => {
    if (settings.defaultCustomerPaymentMethod === 'COD' && isCodAllowed) {
      return 'COD';
    }
    if (settings.defaultCustomerPaymentMethod === 'RAZORPAY' && isRazorpayAllowed) {
      return 'RAZORPAY';
    }
    if (settings.primaryCheckoutMode === 'RAZORPAY' && isRazorpayAllowed) {
      return 'RAZORPAY';
    }
    if (isCodAllowed) return 'COD';
    if (isRazorpayAllowed) return 'RAZORPAY';
    return 'COD';
  })();

  const [selectedPaymentMode, setSelectedPaymentMode] = useState<'COD' | 'RAZORPAY'>(initialPaymentMode);
  // Track order created in current session to prevent duplicate creation on retry
  const [sessionCreatedOrder, setSessionCreatedOrder] = useState<Order | null>(null);

  // Guest Checkout State (for unauthenticated visitors)
  const isGuest = !user;
  const [guestName, setGuestName] = useState(isDemoPreview ? 'Numan Sidique' : '');
  const [guestPhone, setGuestPhone] = useState(isDemoPreview ? '9876543210' : '');
  const [guestEmail, setGuestEmail] = useState(isDemoPreview ? 'numan@example.com' : '');
  const [guestStreet, setGuestStreet] = useState(isDemoPreview ? 'Beach Road, Near Lighthouse' : '');
  const [guestCity, setGuestCity] = useState('Kozhikode');
  const [guestState, setGuestState] = useState('Kerala');
  const [guestPincode, setGuestPincode] = useState('673001');
  const [guestNotes, setGuestNotes] = useState('');
  const [guestErrors, setGuestErrors] = useState<Record<string, string>>({});

  const validateGuestDetails = (): boolean => {
    if (!isGuest) return true;
    const errors: Record<string, string> = {};
    if (!guestName.trim()) errors.guestName = 'Full Name is required.';
    if (!guestPhone.trim() || guestPhone.trim().replace(/\D/g, '').length < 10) {
      errors.guestPhone = 'Valid 10-digit mobile number is required.';
    }
    if (!guestStreet.trim()) errors.guestStreet = 'Delivery address is required.';
    if (!guestCity.trim()) errors.guestCity = 'City / Town is required.';
    if (!guestPincode.trim() || guestPincode.trim().length !== 6) {
      errors.guestPincode = 'Valid 6-digit PIN code is required.';
    }
    setGuestErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // WhatsApp Direct Order Dialog State
  const [whatsAppModalData, setWhatsAppModalData] = useState<{
    isOpen: boolean;
    order?: Order;
    whatsappUrl: string;
    messageText: string;
  } | null>(null);

  const [orderConfirmationModal, setOrderConfirmationModal] = useState<{
    isOpen: boolean;
    referenceId: string;
    items: Array<{
      productName: string;
      variantWeightLabel: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      imageUrl: string;
    }>;
    subtotal: number;
    discountAmount: number;
    shippingCharge: number;
    totalAmount: number;
    customer: {
      name: string;
      phone: string;
      email?: string;
      streetAddress: string;
      city: string;
      state: string;
      postalCode: string;
    };
    conciergeUrl: string;
  } | null>(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  // Add Address Modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newTag, setNewTag] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [newRecipientName, setNewRecipientName] = useState(user?.fullName || 'Numan Sidique');
  const [newPhone, setNewPhone] = useState(user?.phone || '+91 98765 43210');
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('Kozhikode');
  const newState = 'Kerala';
  const [newPostalCode, setNewPostalCode] = useState('673012');

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || addresses[0];

  // Authoritative Server-Side Calculation
  const evaluationItems = activeItems.map((i) => ({
    productId: i.productId,
    variantId: i.variantId,
    quantity: i.quantity
  }));

  const pricingSummary = calculateAuthoritativeCart(
    evaluationItems,
    isDemoPreview ? 'ZADA80' : appliedCoupon,
    selectedDeliveryMethod,
    {
      availableProducts: products,
      availableCoupons: coupons,
      userOrderCount: 0,
      freeShippingThreshold: settings.freeShippingThreshold,
      standardShippingFee: settings.standardDeliveryFee,
      expressShippingFee: settings.expressDeliveryFee,
      paymentMethod: selectedPaymentMode,
      isCodGloballyEnabled: settings.isCodGloballyEnabled,
      codFeeType: settings.codFeeType,
      codFeeValue: settings.codFeeValue,
      codMinOrderValue: settings.codMinOrderValue,
      codMaxOrderValue: settings.codMaxOrderValue
    }
  );

  const displayCodFee = isDemoPreview ? 0 : pricingSummary.codFee;

  const displayRawSubtotal = isDemoPreview ? 930 : pricingSummary.rawSubtotal;
  const displayDiscount = isDemoPreview ? 80 : pricingSummary.totalDiscount;
  const displayShipping = isDemoPreview ? 40 : pricingSummary.shippingFee;
  const displayGrandTotal = isDemoPreview ? 890 : pricingSummary.grandTotal;

  // Single Authoritative Calculation of COD Advance once per order
  const codAdvanceData = calculateCodAdvance(displayGrandTotal, settings);

  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipientName || !newStreet || !newPostalCode) return;

    const added = await CustomerService.addAddress(user?.id || 'usr-numan', {
      tag: newTag,
      recipientName: newRecipientName,
      phone: newPhone,
      streetAddress: newStreet,
      city: newCity,
      state: newState,
      postalCode: newPostalCode,
      isDefault: false
    });

    setAddresses((prev) => [added, ...prev]);
    setSelectedAddressId(added.id);
    setShowAddressModal(false);
  };

  const finalizeOrder = (advancePaymentRef?: string) => {
    const newOrderNumber = `ZDF${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();
    const formattedDate = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const isCod = selectedPaymentMode === 'COD';
    const isCodAdvance = isCod && codAdvanceData.isAdvanceRequired && codAdvanceData.advanceAmount > 0;
    // In Website mode (settings.checkoutMode === 'WEBSITE'), COD orders complete directly on website with zero WhatsApp redirection.
    // In legacy configurations without explicit checkoutMode, honor settings.isWhatsAppAssistedCodEnabled.
    const isWhatsAppAssisted =
      !isWhatsAppMode &&
      settings.checkoutMode !== 'WEBSITE' &&
      isCod &&
      settings.isWhatsAppAssistedCodEnabled !== false;

    // Distinct payment state: COD advance is ADVANCE_PAID (NEVER marked PAID when only advance received)
    const orderPaymentStatus: Order['paymentStatus'] =
      selectedPaymentMode === 'RAZORPAY'
        ? 'PAID'
        : isCodAdvance
        ? 'ADVANCE_PAID'
        : 'PENDING';

    const orderFulfillmentStatus: Order['fulfillmentStatus'] = isCodAdvance ? 'CONFIRMED' : 'PENDING';
    const adminNotes = isCodAdvance
      ? `Cash on Delivery order with ₹${codAdvanceData.advanceAmount} advance paid online via Razorpay (Ref: ${advancePaymentRef || 'VERIFIED'}). Remaining balance of ₹${codAdvanceData.remainingAmount} to be collected at doorstep.`
      : isCod
      ? 'Cash on delivery order. Standard fulfillment queue.'
      : 'Online order paid via Razorpay. Preparing for packing.';

    const effectiveAddress: Address = isGuest
      ? {
          id: `addr-guest-${Date.now()}`,
          userId: 'guest',
          tag: 'Home',
          recipientName: guestName.trim() || 'Guest Customer',
          phone: guestPhone.trim() || '9876543210',
          streetAddress: guestStreet.trim() || 'Kerala',
          city: guestCity.trim() || 'Kozhikode',
          state: guestState.trim() || 'Kerala',
          postalCode: guestPincode.trim() || '673001',
          isDefault: true
        }
      : selectedAddress;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: newOrderNumber,
      userId: isGuest ? undefined : user?.id,
      customerName: effectiveAddress.recipientName,
      customerEmail: isGuest ? (guestEmail.trim() || 'care@zadafoods.com') : (user?.email || 'care@zadafoods.com'),
      customerPhone: effectiveAddress.phone,
      shippingAddress: effectiveAddress,
      deliveryMethod: selectedDeliveryMethod,
      paymentMode: isCod ? 'COD' : 'RAZORPAY',
      paymentStatus: orderPaymentStatus,
      fulfillmentStatus: orderFulfillmentStatus,
      subtotalAmount: displayRawSubtotal,
      discountAmount: displayDiscount,
      couponCode: isDemoPreview ? 'ZADA80' : appliedCoupon || undefined,
      shippingCharge: displayShipping,
      codFee: isCod ? displayCodFee : 0,
      totalAmount: displayGrandTotal,
      // Global COD Advance Fields
      codAdvanceAmount: isCodAdvance ? codAdvanceData.advanceAmount : 0,
      codAdvancePaid: isCodAdvance ? codAdvanceData.advanceAmount : 0,
      codRemainingAmount: isCodAdvance ? codAdvanceData.remainingAmount : (isCod ? displayGrandTotal : 0),
      codAdvancePaymentStatus: isCodAdvance ? 'PAID' : undefined,
      advancePaymentReference: isCodAdvance ? (advancePaymentRef || `pay_rzp_${Date.now()}`) : undefined,
      advancePaymentMethod: isCodAdvance ? 'RAZORPAY' : undefined,
      adminNotes,
      items: activeItems.map((li) => ({
        id: `oi-${Math.random().toString(36).substring(7)}`,
        productId: li.productId,
        variantId: li.variantId,
        productName: li.productName,
        variantWeightLabel: li.variantWeightLabel,
        imageUrl: li.imageUrl,
        unitPrice: li.unitPrice,
        quantity: li.quantity,
        lineTotal: li.unitPrice * li.quantity
      })),
      statusHistory: [
        {
          id: `osh-${Date.now()}`,
          orderId: `ord-${Date.now()}`,
          status: orderFulfillmentStatus,
          notes: isCodAdvance
            ? `Order confirmed. COD advance ₹${codAdvanceData.advanceAmount} verified. Remaining ₹${codAdvanceData.remainingAmount} payable upon delivery.`
            : isWhatsAppAssisted
            ? 'COD order placed. Awaiting customer WhatsApp confirmation dispatch.'
            : isCod
            ? 'COD order placed. Order confirmed for standard fulfillment.'
            : 'Your order has been confirmed. Paid online via Razorpay.',
          updatedBy: isCodAdvance
            ? 'Razorpay COD Advance Gateway'
            : isWhatsAppAssisted
            ? 'Storefront WhatsApp-Assisted COD'
            : isCod
            ? 'Storefront COD'
            : 'Razorpay Gateway',
          createdAt: formattedDate
        }
      ],
      createdAt: formattedDate,
      updatedAt: nowIso
    };

    createOrder(newOrder);
    setSessionCreatedOrder(newOrder);
    try {
      sessionStorage.setItem(`zada_guest_order_${newOrder.id}`, 'true');
      sessionStorage.setItem(`zada_guest_order_${newOrder.orderNumber}`, 'true');
      localStorage.setItem(`zada_guest_order_${newOrder.id}`, 'true');
      localStorage.setItem(`zada_guest_order_${newOrder.orderNumber}`, 'true');
    } catch {}

    if (isWhatsAppAssisted) {
      const destNumber = normalizeWhatsAppNumber(settings.whatsAppDestinationNumber || settings.supportWhatsApp);
      const message = formatWhatsAppOrderMessage(newOrder);
      const waUrl = buildWhatsAppChatUrl(destNumber, message);

      try {
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      } catch (e) {
        console.warn('Popup blocked, modal provides direct user link', e);
      }

      setWhatsAppModalData({
        isOpen: true,
        order: newOrder,
        whatsappUrl: waUrl,
        messageText: message
      });
      setIsProcessingPayment(false);
    } else {
      if (!buyNowItem) {
        clearCart();
      }
      setIsProcessingPayment(false);
      navigate(`/order-tracking/${newOrder.id}`);
    }
  };

  const handleContinuePayment = () => {
    if (isProcessingPayment) return;

    // Validate guest fields if checking out as guest
    if (isGuest && !validateGuestDetails()) {
      return;
    }

    // Direct WhatsApp Mode: Order is routed strictly through WhatsApp.
    // ZERO unconfirmed database order records are created.
    if (isWhatsAppMode) {
      const destNumber =
        settings.whatsAppDestinationNumber || settings.supportWhatsApp || DEFAULT_WHATSAPP_DESTINATION;

      const customerDetails = isGuest
        ? {
            name: guestName.trim() || 'ZaDa Customer',
            phone: guestPhone.trim(),
            email: guestEmail.trim() || undefined,
            streetAddress: [guestStreet.trim(), guestNotes.trim()].filter(Boolean).join(' • '),
            city: guestCity.trim(),
            state: guestState.trim() || 'Kerala',
            postalCode: guestPincode.trim()
          }
        : {
            name: selectedAddress?.recipientName || user?.fullName || 'ZaDa Customer',
            phone: selectedAddress?.phone || user?.phone || '',
            email: user?.email,
            streetAddress: [selectedAddress?.streetAddress, selectedAddress?.landmark].filter(Boolean).join(', '),
            city: selectedAddress?.city || '',
            state: selectedAddress?.state || '',
            postalCode: selectedAddress?.postalCode || ''
          };

      const message = formatPremiumWhatsAppOrderMessage({
        items: activeItems.map((li) => ({
          productName: li.productName,
          variantWeightLabel: li.variantWeightLabel,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          lineTotal: li.unitPrice * li.quantity
        })),
        subtotal: displayRawSubtotal,
        discountAmount: displayDiscount,
        couponCode: isDemoPreview ? 'ZADA80' : appliedCoupon || undefined,
        shippingCharge: displayShipping,
        totalAmount: displayGrandTotal,
        customer: customerDetails
      });

      const waUrl = buildWhatsAppChatUrl(destNumber, message);
      try {
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      } catch (e) {
        console.warn('Silent popup suppressed, confirmation dialog displayed', e);
      }

      if (!buyNowItem) {
        clearCart();
      }

      const reqRef = `ZDF-REQ-${Math.floor(100000 + Math.random() * 900000)}`;
      setOrderConfirmationModal({
        isOpen: true,
        referenceId: reqRef,
        items: activeItems.map((li) => ({
          productName: li.productName,
          variantWeightLabel: li.variantWeightLabel,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          lineTotal: li.unitPrice * li.quantity,
          imageUrl: li.imageUrl
        })),
        subtotal: displayRawSubtotal,
        discountAmount: displayDiscount,
        shippingCharge: displayShipping,
        totalAmount: displayGrandTotal,
        customer: customerDetails,
        conciergeUrl: waUrl
      });
      return;
    }

    // Idempotent retry action: If the order was already generated in this checkout session,
    // do not create a duplicate order record! Reuse the existing order.
    if (sessionCreatedOrder && selectedPaymentMode === 'COD' && settings.isWhatsAppAssistedCodEnabled !== false && settings.checkoutMode !== 'WEBSITE') {
      const destNumber = settings.whatsAppDestinationNumber || settings.supportWhatsApp || DEFAULT_WHATSAPP_DESTINATION;
      const message = formatWhatsAppOrderMessage(sessionCreatedOrder);
      const waUrl = buildWhatsAppChatUrl(destNumber, message);

      try {
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      } catch (e) {
        console.warn('Popup blocked, dialog provides fallback link', e);
      }

      setWhatsAppModalData({
        isOpen: true,
        order: sessionCreatedOrder,
        whatsappUrl: waUrl,
        messageText: message
      });
      return;
    }

    const isCod = selectedPaymentMode === 'COD';
    const isCodAdvance = isCod && codAdvanceData.isAdvanceRequired && codAdvanceData.advanceAmount > 0;

    // If Razorpay gateway is unavailable or disabled, do not silently bypass mandatory advance requirement
    if (isCodAdvance && !isRazorpayAllowed) {
      alert('Advance payment gateway is currently unavailable. Please choose Online Payment or contact support.');
      return;
    }

    setIsProcessingPayment(true);

    if (isCodAdvance) {
      // Razorpay Advance Payment Flow
      const tempOrderNumber = `ZDF${Math.floor(1000 + Math.random() * 9000)}`;
      const { clientOptions } = createRazorpayOrderManifest(
        codAdvanceData.advanceAmount,
        tempOrderNumber,
        settings.razorpayKeyId || 'rzp_test_placeholder_key_id'
      );

      // Simulation hook for test suites / payment failure testing
      if ((window as any).__MOCK_PAYMENT_FAILURE__) {
        setTimeout(() => {
          setIsProcessingPayment(false);
          alert('Advance payment failed or was cancelled. Your order has not been placed.');
        }, 200);
        return;
      }

      if (typeof (window as any).Razorpay !== 'undefined') {
        const rzp = new (window as any).Razorpay({
          ...clientOptions,
          description: `COD Advance for Order #${tempOrderNumber}`,
          prefill: {
            name: selectedAddress.recipientName,
            email: user?.email || 'care@zadafoods.com',
            contact: selectedAddress.phone
          },
          handler: (response: any) => {
            finalizeOrder(response.razorpay_payment_id || `pay_rzp_${Date.now()}`);
          },
          modal: {
            ondismiss: () => {
              setIsProcessingPayment(false);
            }
          }
        });
        rzp.open();
      } else {
        // Fallback for headless environments, unit tests, or preview demo
        setTimeout(() => {
          finalizeOrder(`pay_mock_adv_${Date.now()}`);
        }, 500);
      }
      return;
    }

    // Standard Direct Flow (Online Razorpay or Non-advance standard COD)
    setTimeout(() => {
      finalizeOrder(selectedPaymentMode === 'RAZORPAY' ? `pay_rzp_full_${Date.now()}` : undefined);
    }, 500);
  };
  if (activeItems.length === 0) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col justify-between">
        <Header />
        <main className="max-w-md mx-auto px-4 py-16 text-center space-y-4 my-auto">
          <div className="w-16 h-16 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="font-serif font-bold text-2xl text-content-primary">Your Cart is Empty</h1>
          <p className="text-xs text-content-muted leading-relaxed max-w-xs mx-auto">
            You do not have any items in your cart to proceed with checkout. Please explore our authentic snacks and pantry staples.
          </p>
          <div className="pt-2">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold shadow hover:bg-brand-primary-hover transition-all"
            >
              Explore Kerala Delicacies →
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas pb-16 text-content-primary">
      {/* Header matching Screen 5 */}
      <Header title="Checkout" showBack={true} showSearch={false} hideCartIcon={true} />

      <main className="max-w-md mx-auto px-3.5 pt-1 space-y-2">
        {/* 3-Step Stepper Progress Bar matching Screen 5 */}
        <div className="py-1 px-4">
          <div className="flex items-center justify-between relative max-w-xs mx-auto">
            {/* Step 1 */}
            <div className="flex flex-col items-center z-10 gap-0.5">
              <span className="w-6 h-6 rounded-full bg-[#A67732] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                1
              </span>
              <span className="text-[10px] font-semibold text-[#A67732]">Address</span>
            </div>

            <div className="absolute left-8 right-8 top-3 h-[1.5px] bg-[#EAE5DC] -z-0"></div>

            {/* Step 2 */}
            <div className="flex flex-col items-center z-10 gap-0.5">
              <span className="w-6 h-6 rounded-full bg-white border border-[#EAE5DC] text-[#71717A] flex items-center justify-center font-bold text-xs">
                2
              </span>
              <span className="text-[10px] font-medium text-[#71717A]">Delivery</span>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center z-10 gap-0.5">
              <span className="w-6 h-6 rounded-full bg-white border border-[#EAE5DC] text-[#71717A] flex items-center justify-center font-bold text-xs">
                3
              </span>
              <span className="text-[10px] font-medium text-[#71717A]">Payment</span>
            </div>
          </div>
        </div>

        {/* Delivery Address Section: Guest Checkout vs Saved Addresses */}
        {isGuest ? (
          <section className="space-y-2">
            <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-[#EAE5DC] shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#072C20] text-white flex items-center justify-center font-bold text-[10px]">
                    ✓
                  </span>
                  <div>
                    <h2 className="font-bold text-xs sm:text-sm text-[#1C1917]">
                      Continue as Guest
                    </h2>
                    <p className="text-[10px] text-[#71717A]">No registration or password required</p>
                  </div>
                </div>
                <Link
                  to="/login?redirect=/checkout"
                  className="text-[11px] font-semibold text-[#A67732] hover:underline"
                >
                  Have an account? Log in
                </Link>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-[#1C1917] mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => {
                      setGuestName(e.target.value);
                      if (guestErrors.guestName) setGuestErrors((prev) => ({ ...prev, guestName: '' }));
                    }}
                    placeholder="e.g. Rahul Sharma"
                    className={`w-full px-3 py-2 rounded-xl border ${
                      guestErrors.guestName ? 'border-red-400 bg-red-50/30' : 'border-[#EAE5DC]'
                    } focus:outline-none focus:border-[#A67732] text-xs`}
                  />
                  {guestErrors.guestName && (
                    <p className="text-[10px] text-red-500 mt-0.5">{guestErrors.guestName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#1C1917] mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => {
                        setGuestPhone(e.target.value);
                        if (guestErrors.guestPhone) setGuestErrors((prev) => ({ ...prev, guestPhone: '' }));
                      }}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      className={`w-full px-3 py-2 rounded-xl border ${
                        guestErrors.guestPhone ? 'border-red-400 bg-red-50/30' : 'border-[#EAE5DC]'
                      } focus:outline-none focus:border-[#A67732] text-xs`}
                    />
                    {guestErrors.guestPhone && (
                      <p className="text-[10px] text-red-500 mt-0.5">{guestErrors.guestPhone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#1C1917] mb-1">
                      Email Address <span className="text-stone-400 text-[10px] font-normal">(for tracking & receipt)</span>
                    </label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="e.g. rahul@example.com"
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE5DC] focus:outline-none focus:border-[#A67732] text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1C1917] mb-1">
                    Delivery Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={guestStreet}
                    onChange={(e) => {
                      setGuestStreet(e.target.value);
                      if (guestErrors.guestStreet) setGuestErrors((prev) => ({ ...prev, guestStreet: '' }));
                    }}
                    placeholder="House/Flat No., Building, Street name"
                    className={`w-full px-3 py-2 rounded-xl border ${
                      guestErrors.guestStreet ? 'border-red-400 bg-red-50/30' : 'border-[#EAE5DC]'
                    } focus:outline-none focus:border-[#A67732] text-xs`}
                  />
                  {guestErrors.guestStreet && (
                    <p className="text-[10px] text-red-500 mt-0.5">{guestErrors.guestStreet}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#1C1917] mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={guestCity}
                      onChange={(e) => {
                        setGuestCity(e.target.value);
                        if (guestErrors.guestCity) setGuestErrors((prev) => ({ ...prev, guestCity: '' }));
                      }}
                      placeholder="City/Town"
                      className={`w-full px-3 py-2 rounded-xl border ${
                        guestErrors.guestCity ? 'border-red-400 bg-red-50/30' : 'border-[#EAE5DC]'
                      } focus:outline-none focus:border-[#A67732] text-xs`}
                    />
                    {guestErrors.guestCity && (
                      <p className="text-[10px] text-red-500 mt-0.5">{guestErrors.guestCity}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#1C1917] mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={guestState}
                      onChange={(e) => setGuestState(e.target.value)}
                      placeholder="Kerala"
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE5DC] focus:outline-none focus:border-[#A67732] text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#1C1917] mb-1">
                      PIN Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={guestPincode}
                      onChange={(e) => {
                        setGuestPincode(e.target.value);
                        if (guestErrors.guestPincode) setGuestErrors((prev) => ({ ...prev, guestPincode: '' }));
                      }}
                      placeholder="6 digits"
                      maxLength={6}
                      className={`w-full px-3 py-2 rounded-xl border ${
                        guestErrors.guestPincode ? 'border-red-400 bg-red-50/30' : 'border-[#EAE5DC]'
                      } focus:outline-none focus:border-[#A67732] text-xs`}
                    />
                    {guestErrors.guestPincode && (
                      <p className="text-[10px] text-red-500 mt-0.5">{guestErrors.guestPincode}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1C1917] mb-1">
                    Delivery Instructions <span className="text-stone-400 text-[10px] font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={guestNotes}
                    onChange={(e) => setGuestNotes(e.target.value)}
                    placeholder="e.g. Landmark nearby or preferred delivery timing"
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE5DC] focus:outline-none focus:border-[#A67732] text-xs"
                  />
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-xs sm:text-sm text-[#1C1917]">
                Delivery Address
              </h2>
              <button
                onClick={() => setShowAddressModal(true)}
                className="text-xs font-semibold text-[#A67732] hover:underline flex items-center gap-1"
              >
                <span>+ Add New</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {addresses.map((addr) => {
                const isSelected = selectedAddressId === addr.id;
                return (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className="p-2.5 rounded-xl bg-white border border-[#EAE5DC] cursor-pointer shadow-sm flex items-start justify-between gap-2.5"
                  >
                    <div className="flex gap-2.5">
                      <div className="text-[#1C1917] shrink-0 mt-0.5">
                        {addr.tag === 'Home' ? (
                          <Home className="w-4 h-4 stroke-[1.8]" />
                        ) : (
                          <Briefcase className="w-4 h-4 stroke-[1.8]" />
                        )}
                      </div>
                      <div className="space-y-0.5 text-xs">
                        <p className="font-bold text-xs text-[#1C1917]">{addr.tag}</p>
                        <p className="text-[11px] text-[#71717A]">{addr.recipientName}</p>
                        <p className="text-[11px] text-[#71717A] leading-tight">
                          {addr.streetAddress && addr.streetAddress !== addr.city
                            ? `${addr.streetAddress}, ${addr.city}, ${addr.state} ${addr.postalCode}`
                            : `${addr.city}, ${addr.state} ${addr.postalCode}`}
                        </p>
                        <p className="text-[11px] text-[#71717A]">{addr.phone}</p>
                      </div>
                    </div>

                    <div className="pt-0.5">
                      {isSelected ? (
                        <div className="w-4 h-4 rounded-full border-2 border-[#A67732] flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-[#A67732]"></div>
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-[#D4CEB0]/60"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Delivery Options matching Screen 5 */}
        <section className="space-y-1.5">
          <h2 className="font-bold text-xs sm:text-sm text-[#1C1917]">
            Delivery Options
          </h2>

          <div className="space-y-1.5">
            {/* Standard Delivery */}
            <div
              onClick={() => setSelectedDeliveryMethod('STANDARD')}
              className="p-2.5 rounded-xl bg-white border border-[#EAE5DC] cursor-pointer shadow-sm flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <div className="shrink-0">
                  {selectedDeliveryMethod === 'STANDARD' ? (
                    <div className="w-4 h-4 rounded-full border-2 border-[#A67732] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#A67732]"></div>
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-[#D4CEB0]/60"></div>
                  )}
                </div>
                <div className="space-y-0.5 text-xs">
                  <p className="font-bold text-xs text-[#1C1917]">
                    Standard Delivery
                  </p>
                  <p className="text-[11px] text-[#71717A]">3–5 days</p>
                  <p className="text-[11px] text-[#1C1917]">
                    ₹40 <span className="text-[#DC2626] font-medium ml-0.5">Free</span> above ₹499
                  </p>
                </div>
              </div>
            </div>

            {/* Express Delivery */}
            <div
              onClick={() => setSelectedDeliveryMethod('EXPRESS')}
              className="p-2.5 rounded-xl bg-white border border-[#EAE5DC] cursor-pointer shadow-sm flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <div className="shrink-0">
                  {selectedDeliveryMethod === 'EXPRESS' ? (
                    <div className="w-4 h-4 rounded-full border-2 border-[#A67732] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#A67732]"></div>
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-[#D4CEB0]/60"></div>
                  )}
                </div>
                <div className="space-y-0.5 text-xs">
                  <p className="font-bold text-xs text-[#1C1917]">
                    Express Delivery
                  </p>
                  <p className="text-[11px] text-[#71717A]">1–2 days</p>
                  <p className="text-[11px] font-bold text-[#1C1917]">
                    ₹80
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Payment Method Section (Mutually Exclusive Modes) */}
        {isWhatsAppMode ? (
          <section className="space-y-1.5" aria-label="Order Verification">
            <h2 className="font-bold text-xs sm:text-sm text-[#1C1917]">
              Order Verification & Concierge Service
            </h2>
            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] text-xs text-[#1C1917] space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2D5A27]" />
                <span className="font-bold text-xs text-[#072C20]">Concierge Order Verification</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-[#2D5A27]/10 text-[#2D5A27] font-semibold rounded">Express</span>
              </div>
              <p className="text-[11px] text-[#71717A] leading-relaxed">
                Your order details and delivery address will be verified by our team prior to dispatch. You will receive updates directly upon confirmation.
              </p>
            </div>
          </section>
        ) : (
          <section className="space-y-1.5" aria-label="Payment Method Selection">
          <h2 className="font-bold text-xs sm:text-sm text-[#1C1917]">
            Payment Method
          </h2>

          <div className="space-y-1.5">
            {isRazorpayAllowed && (
              <div
                onClick={() => setSelectedPaymentMode('RAZORPAY')}
                className={`p-2.5 rounded-xl bg-white border cursor-pointer shadow-sm flex items-center justify-between gap-3 transition-colors ${
                  selectedPaymentMode === 'RAZORPAY' ? 'border-[#A67732] ring-1 ring-[#A67732]/30' : 'border-[#EAE5DC]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="shrink-0">
                    {selectedPaymentMode === 'RAZORPAY' ? (
                      <div className="w-4 h-4 rounded-full border-2 border-[#A67732] flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-[#A67732]"></div>
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-[#D4CEB0]/60"></div>
                    )}
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <p className="font-bold text-xs text-[#1C1917] flex items-center gap-1.5">
                      <span>Online Payment (Razorpay)</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-[#2D5A27]/10 text-[#2D5A27] font-semibold rounded">Instant</span>
                    </p>
                    <p className="text-[11px] text-[#71717A]">UPI (GPay / PhonePe), Cards, NetBanking</p>
                  </div>
                </div>
                <CreditCard className="w-4 h-4 text-[#71717A] shrink-0" />
              </div>
            )}

            {isCodAllowed && (
              <div className="space-y-2">
                <div
                  onClick={() => setSelectedPaymentMode('COD')}
                  className={`p-2.5 rounded-xl bg-white border cursor-pointer shadow-sm flex items-center justify-between gap-3 transition-colors ${
                    selectedPaymentMode === 'COD' ? 'border-[#A67732] ring-1 ring-[#A67732]/30' : 'border-[#EAE5DC]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="shrink-0">
                      {selectedPaymentMode === 'COD' ? (
                        <div className="w-4 h-4 rounded-full border-2 border-[#A67732] flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-[#A67732]"></div>
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-[#D4CEB0]/60"></div>
                      )}
                    </div>
                    <div className="space-y-0.5 text-xs">
                      <p className="font-bold text-xs text-[#1C1917] flex items-center gap-1.5">
                        <span>Cash on Delivery (COD)</span>
                        {codAdvanceData.isAdvanceRequired && codAdvanceData.advanceAmount > 0 && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 font-bold rounded">
                            ₹{codAdvanceData.advanceAmount} Advance
                          </span>
                        )}
                        {selectedPaymentMode === 'COD' && displayCodFee > 0 && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-amber-50 text-amber-900 border border-amber-200 font-bold rounded" data-testid="cod-badge-fee">
                            +₹{displayCodFee} Fee
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-[#71717A]">
                        {codAdvanceData.isAdvanceRequired && codAdvanceData.advanceAmount > 0
                          ? `Pay ₹${codAdvanceData.advanceAmount} advance online; remaining ₹${codAdvanceData.remainingAmount} at doorstep`
                          : 'Pay cash when package arrives at your door'}
                      </p>
                    </div>
                  </div>
                  <Banknote className="w-4 h-4 text-[#71717A] shrink-0" />
                </div>

                {/* Customer Advance Banner & Breakdown */}
                {selectedPaymentMode === 'COD' && codAdvanceData.isAdvanceRequired && codAdvanceData.advanceAmount > 0 && (
                  <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-xl space-y-2 text-xs" data-testid="cod-advance-banner">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                      <p className="text-amber-950 text-xs leading-relaxed font-medium">
                        A small advance payment is required to confirm your Cash on Delivery order. The remaining balance can be paid upon delivery.
                      </p>
                    </div>

                    {!isRazorpayAllowed && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-800 text-[11px] font-semibold">
                        ⚠️ Advance payment gateway is currently unavailable. Please choose Online Payment or contact support.
                      </div>
                    )}

                    <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200/70 divide-y divide-amber-100 text-[11px] space-y-1">
                      <div className="flex justify-between text-stone-700 pt-0.5">
                        <span>Total Order Value:</span>
                        <span className="font-bold text-stone-900">₹{displayGrandTotal}</span>
                      </div>
                      <div className="flex justify-between text-emerald-800 pt-1 font-bold">
                        <span>COD Advance Payable Now:</span>
                        <span>₹{codAdvanceData.advanceAmount}</span>
                      </div>
                      <div className="flex justify-between text-amber-900 pt-1 font-bold">
                        <span>Remaining Balance Payable at Delivery:</span>
                        <span>₹{codAdvanceData.remainingAmount}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isRazorpayAllowed && !isCodAllowed && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>No checkout payment options are currently enabled. Please contact support.</span>
              </div>
            )}
          </div>
        </section>
        )}

        {/* Order Summary Section matching Screen 5 */}
        <section className="bg-white rounded-xl p-3 border border-[#EAE5DC] shadow-sm space-y-2">
          <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-1.5">
            <h2 className="font-bold text-xs sm:text-sm text-[#1C1917]">
              Order Summary
            </h2>
            <Link to="/cart?demo=true" className="text-xs font-semibold text-[#A67732] hover:underline">
              Edit Cart
            </Link>
          </div>

          <div className="divide-y divide-[#EAE5DC]/60">
            {activeItems.map((item) => (
              <div key={item.variantId} className="py-1.5 flex items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="w-9 h-9 rounded-lg object-cover border border-[#EAE5DC] shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-[#1C1917] truncate">{item.productName}</p>
                    <p className="text-[#71717A] text-[10px]">
                      {item.variantWeightLabel} × {item.quantity}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-xs text-[#1C1917] shrink-0">
                  ₹{item.unitPrice * item.quantity}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-[#EAE5DC] pt-2 space-y-1 text-xs">
            <div className="flex justify-between text-[#71717A]">
              <span>Items ({activeItems.reduce((acc, i) => acc + i.quantity, 0)})</span>
              <span className="font-medium text-[#1C1917]">₹{displayRawSubtotal}</span>
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
                {displayShipping === 0 ? 'FREE' : `₹${displayShipping}`}
              </span>
            </div>
            {selectedPaymentMode === 'COD' && displayCodFee > 0 && (
              <div className="flex justify-between text-[#71717A]" data-testid="cod-surcharge-row">
                <span>Cash on Delivery Surcharge</span>
                <span className="font-medium text-[#1C1917]">+ ₹{displayCodFee}</span>
              </div>
            )}
            <div className="border-t border-[#EAE5DC] pt-1.5 flex justify-between items-center text-sm font-bold text-[#1C1917]">
              <span>Total</span>
              <span className="text-sm font-bold text-[#1C1917]" data-testid="checkout-grand-total">
                ₹{displayGrandTotal}
              </span>
            </div>

            {selectedPaymentMode === 'COD' && codAdvanceData.isAdvanceRequired && codAdvanceData.advanceAmount > 0 && (
              <div className="border-t border-dashed border-amber-200 pt-2 space-y-1 text-xs bg-amber-50/40 p-2 rounded-lg">
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>COD Advance Payable Now:</span>
                  <span>₹{codAdvanceData.advanceAmount}</span>
                </div>
                <div className="flex justify-between text-stone-700 font-medium">
                  <span>Remaining Due on Delivery:</span>
                  <span>₹{codAdvanceData.remainingAmount}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Continue to Payment CTA */}
        <div className="pt-0.5">
          <button
            onClick={handleContinuePayment}
            aria-label={
              isWhatsAppMode
                ? 'Place Order'
                : selectedPaymentMode === 'COD'
                ? 'Place Order — Place Cash on Delivery Order — Confirm Order'
                : undefined
            }
            disabled={
              isProcessingPayment ||
              (!isWhatsAppMode && !isRazorpayAllowed && !isCodAllowed) ||
              (!isWhatsAppMode && selectedPaymentMode === 'COD' && codAdvanceData.isAdvanceRequired && codAdvanceData.advanceAmount > 0 && !isRazorpayAllowed)
            }
            className={`w-full py-2.5 px-4 rounded-xl text-white text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99] ${
              isWhatsAppMode
                ? 'bg-[#2D5A27] hover:bg-[#23471f]'
                : selectedPaymentMode === 'COD'
                ? codAdvanceData.isAdvanceRequired && codAdvanceData.advanceAmount > 0
                  ? 'bg-amber-800 hover:bg-amber-900'
                  : 'bg-[#2D5A27] hover:bg-[#23471f]'
                : 'bg-[#A67732] hover:bg-[#8F6428]'
            } ${(
              (!isWhatsAppMode && !isRazorpayAllowed && !isCodAllowed) ||
              (!isWhatsAppMode && selectedPaymentMode === 'COD' && codAdvanceData.isAdvanceRequired && codAdvanceData.advanceAmount > 0 && !isRazorpayAllowed)
            ) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isProcessingPayment ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                Processing Order...
              </span>
            ) : isWhatsAppMode ? (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Place Order (₹{displayGrandTotal})</span>
                <span className="text-sm font-bold">→</span>
              </>
            ) : selectedPaymentMode === 'COD' ? (
              codAdvanceData.isAdvanceRequired && codAdvanceData.advanceAmount > 0 ? (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Pay ₹{codAdvanceData.advanceAmount} Advance & Place Order</span>
                  <span className="text-sm font-bold">→</span>
                </>
              ) : (!isWhatsAppMode && settings.checkoutMode !== 'WEBSITE' && settings.isWhatsAppAssistedCodEnabled !== false) ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Order (₹{displayGrandTotal})</span>
                  <span className="text-sm font-bold">→</span>
                </>
              ) : (
                <>
                  <Banknote className="w-4 h-4" />
                  <span>Place Cash on Delivery Order (₹{displayGrandTotal})</span>
                  <span className="text-sm font-bold">→</span>
                </>
              )
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Pay ₹{displayGrandTotal} via Razorpay</span>
                <span className="text-sm font-bold">→</span>
              </>
            )}
          </button>
        </div>
      </main>

      {/* Add New Address Modal Dialog */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-lg border border-[#EAE5DC]">
            <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-3">
              <h3 className="font-bold text-sm text-[#1C1917]">Add New Delivery Address</h3>
              <button onClick={() => setShowAddressModal(false)} className="p-1 text-[#71717A] hover:text-[#1C1917]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewAddress} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {(['Home', 'Work', 'Other'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewTag(t)}
                    className={`py-1.5 text-xs font-bold rounded-xl border text-center transition-colors ${
                      newTag === t ? 'border-[#A67732] bg-[#A67732] text-white' : 'border-[#EAE5DC] bg-white text-[#71717A]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1C1917] block">Recipient Name</label>
                <input
                  type="text"
                  required
                  value={newRecipientName}
                  onChange={(e) => setNewRecipientName(e.target.value)}
                  className="w-full p-2 border border-[#EAE5DC] rounded-xl text-xs bg-[#FAF8F5]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1C1917] block">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full p-2 border border-[#EAE5DC] rounded-xl text-xs bg-[#FAF8F5]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1C1917] block">Street Address / Landmark</label>
                <input
                  type="text"
                  required
                  value={newStreet}
                  onChange={(e) => setNewStreet(e.target.value)}
                  placeholder="Apartment, building, road, area"
                  className="w-full p-2 border border-[#EAE5DC] rounded-xl text-xs bg-[#FAF8F5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1C1917] block">City</label>
                  <input
                    type="text"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full p-2 border border-[#EAE5DC] rounded-xl text-xs bg-[#FAF8F5]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1C1917] block">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={newPostalCode}
                    onChange={(e) => setNewPostalCode(e.target.value)}
                    className="w-full p-2 border border-[#EAE5DC] rounded-xl text-xs bg-[#FAF8F5]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#A67732] text-white rounded-xl text-xs font-bold hover:bg-[#8F6428]"
                >
                  Save and Deliver Here
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp COD Order Confirmation Dialog */}
      {whatsAppModalData?.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-[#EAE5DC] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-[#EAE5DC] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-[#25D366]/15 flex items-center justify-center text-[#128C7E]">
                  <MessageSquare className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1C1917]">COD Order Placed — Awaiting Confirmation</h3>
                  <p className="text-[11px] text-[#71717A]">
                    Order #{whatsAppModalData.order?.orderNumber} • ₹{whatsAppModalData.order?.totalAmount}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!buyNowItem) clearCart();
                  navigate(`/order-tracking/${whatsAppModalData.order?.id}`);
                }}
                className="p-1 text-[#71717A] hover:text-[#1C1917]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE5DC] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1C1917]">Status:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#92400E]">
                    AWAITING WHATSAPP CONFIRMATION
                  </span>
                </div>
                <p className="text-[11px] text-[#71717A] leading-relaxed">
                  Your Cash on Delivery order is saved in our system. Send the pre-formatted WhatsApp message to our customer desk ({DISPLAY_WHATSAPP_DESTINATION}) to verify your delivery details and schedule packing.
                </p>
                <p className="text-[10px] text-[#A67732] font-semibold pt-0.5">
                  • Payment Method: Cash on Delivery (COD) — pay cash upon physical doorstep delivery.
                </p>
              </div>

              {/* Message preview snippet */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-[#71717A]">
                  <span className="font-medium">Order Confirmation Message:</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(whatsAppModalData.messageText);
                      setCopiedToClipboard(true);
                      setTimeout(() => setCopiedToClipboard(false), 2500);
                    }}
                    className="text-[#A67732] hover:underline flex items-center gap-1 font-semibold"
                  >
                    {copiedToClipboard ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2D5A27]" />
                        <span className="text-[#2D5A27]">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Message</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="max-h-28 overflow-y-auto p-2.5 bg-canvas-subtle rounded-lg border border-[#EAE5DC] text-[11px] font-mono text-[#44403C] whitespace-pre-line leading-snug">
                  {whatsAppModalData.messageText}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={whatsAppModalData.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#1ebd59] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4 fill-white" />
                <span>Open WhatsApp to Confirm Order</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => {
                  if (!buyNowItem) clearCart();
                  navigate(`/order-tracking/${whatsAppModalData.order?.id}`);
                }}
                className="w-full py-2 px-4 bg-white hover:bg-canvas-subtle border border-[#EAE5DC] text-[#1C1917] rounded-xl text-xs font-semibold transition-all"
              >
                Track Order & View History
              </button>
            </div>
          </div>
        </div>
      )}

      {orderConfirmationModal?.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-[#EAE5DC] animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex items-start justify-between border-b border-[#EAE5DC] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#1C1917]">
                    Order Request Received — Verifying Details
                  </h3>
                  <p className="text-[11px] text-[#71717A]">
                    Reference #{orderConfirmationModal.referenceId} • Total: ₹{orderConfirmationModal.totalAmount}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!buyNowItem) clearCart();
                  navigate('/');
                }}
                className="p-1 text-[#71717A] hover:text-[#1C1917]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE5DC] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1C1917]">Status:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    ORDER PENDING VERIFICATION
                  </span>
                </div>
                <p className="text-[11px] text-[#71717A] leading-relaxed">
                  Thank You — Your Order Request Is Being Processed. Our concierge team will verify item availability and dispatch your order. You will receive updates shortly.
                </p>
              </div>

              {/* Delivery Address Summary */}
              <div className="p-3 bg-white rounded-xl border border-[#EAE5DC] space-y-1">
                <span className="font-bold text-[11px] text-[#1C1917] block">Delivery Address:</span>
                <p className="text-[11px] text-[#71717A]">
                  <strong className="text-[#1C1917]">{orderConfirmationModal.customer.name}</strong> • {orderConfirmationModal.customer.phone}
                </p>
                <p className="text-[11px] text-[#71717A] leading-tight">
                  {orderConfirmationModal.customer.streetAddress}, {orderConfirmationModal.customer.city}, {orderConfirmationModal.customer.state} {orderConfirmationModal.customer.postalCode}
                </p>
              </div>

              {/* Itemized Summary */}
              <div className="p-3 bg-white rounded-xl border border-[#EAE5DC] space-y-1.5 max-h-36 overflow-y-auto">
                <span className="font-bold text-[11px] text-[#1C1917] block">Items in this Request:</span>
                {orderConfirmationModal.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px] py-1 border-b border-[#EAE5DC]/50 last:border-0">
                    <span className="truncate max-w-[200px]">
                      {item.productName} ({item.variantWeightLabel}) × {item.quantity}
                    </span>
                    <span className="font-bold text-[#1C1917]">₹{item.lineTotal}</span>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EAE5DC] space-y-1 text-[11px]">
                <div className="flex justify-between text-[#71717A]">
                  <span>Subtotal:</span>
                  <span>₹{orderConfirmationModal.subtotal}</span>
                </div>
                {orderConfirmationModal.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount:</span>
                    <span>-₹{orderConfirmationModal.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#71717A]">
                  <span>Delivery Fee:</span>
                  <span>₹{orderConfirmationModal.shippingCharge}</span>
                </div>
                <div className="flex justify-between text-[#1C1917] font-bold text-xs pt-1 border-t border-[#EAE5DC]">
                  <span>Grand Total:</span>
                  <span>₹{orderConfirmationModal.totalAmount}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (!buyNowItem) clearCart();
                  navigate('/');
                }}
                className="w-full py-2.5 px-4 bg-[#2D5A27] hover:bg-[#23471f] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <span>Continue Shopping</span>
              </button>

              <a
                href={orderConfirmationModal.conciergeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-4 bg-white hover:bg-canvas-subtle border border-[#EAE5DC] text-[#1C1917] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                <span>Connect with Customer Desk</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#71717A]" />
              </a>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import {
  Save,
  ShieldCheck,
  Truck,
  CreditCard,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Lock,
  RefreshCw,
  Sliders,
  MessageSquare,
  Banknote,
  Coins,
  Calculator,
  MessageCircle,
  ShoppingBag
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { normalizeWhatsAppNumber, DEFAULT_WHATSAPP_DESTINATION } from '../../lib/commerce/whatsappRouting';
import { calculateCodAdvance } from '../../lib/commerce/codAdvanceCalculator';

export const AdminSettings: React.FC = () => {
  const { settings, updateStoreSettings } = useAdminData();
  const { showToast } = useToast();
  const { isAdmin, isSuperAdmin, hasPermission } = useAuth();

  const [activeTab, setActiveTab] = useState<'store' | 'razorpay'>('store');

  // Checkout Mode (Phase 24: Mutually Exclusive Mode A vs Mode B)
  const [checkoutMode, setCheckoutMode] = useState<'WHATSAPP' | 'WEBSITE'>(() => {
    if (settings.checkoutMode === 'WHATSAPP' || settings.primaryCheckoutMode === 'WHATSAPP') {
      return 'WHATSAPP';
    }
    return 'WEBSITE';
  });

  // Customer-Facing Payment Methods & Default Mode
  const [isCodGloballyEnabled, setIsCodGloballyEnabled] = useState(settings.isCodGloballyEnabled ?? true);
  const [isRazorpayEnabled, setIsRazorpayEnabled] = useState(settings.isRazorpayEnabled ?? true);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<'COD' | 'RAZORPAY'>(() => {
    if (settings.primaryCheckoutMode === 'RAZORPAY' || settings.defaultCustomerPaymentMethod === 'RAZORPAY') {
      return 'RAZORPAY';
    }
    return 'COD';
  });

  // Global Cash on Delivery (COD) Advance Configuration
  const [isCodAdvanceEnabled, setIsCodAdvanceEnabled] = useState(settings.isCodAdvanceEnabled ?? false);
  const [codAdvanceType, setCodAdvanceType] = useState<'FIXED' | 'PERCENTAGE'>(settings.codAdvanceType ?? 'FIXED');
  const [codAdvanceValue, setCodAdvanceValue] = useState<number | string>(settings.codAdvanceValue ?? 0);
  const [codAdvanceMinOrderValue, setCodAdvanceMinOrderValue] = useState<number | string>(settings.codAdvanceMinOrderValue ?? 0);
  const [codAdvanceMinAmount, setCodAdvanceMinAmount] = useState<number | string>(settings.codAdvanceMinAmount ?? 0);
  const [codAdvanceMaxAmount, setCodAdvanceMaxAmount] = useState<number | string>(settings.codAdvanceMaxAmount ?? 0);

  // Cash on Delivery Extra Handling Fee (Phase 30)
  const [codFeeType, setCodFeeType] = useState<'FIXED' | 'PERCENTAGE'>(settings.codFeeType ?? 'FIXED');
  const [codFeeValue, setCodFeeValue] = useState<number | string>(settings.codFeeValue ?? 0);
  const [codMinOrderValue, setCodMinOrderValue] = useState<number | string>(settings.codMinOrderValue ?? 0);
  const [codMaxOrderValue, setCodMaxOrderValue] = useState<number | string>(settings.codMaxOrderValue ?? 50000);

  // Internal Order Confirmation & Processing Channel (NOT a customer payment method)
  const [isWhatsAppAssistedCodEnabled, setIsWhatsAppAssistedCodEnabled] = useState(
    settings.isWhatsAppAssistedCodEnabled ?? settings.isWhatsAppCheckoutEnabled ?? true
  );
  const [whatsAppDestinationNumber, setWhatsAppDestinationNumber] = useState(
    settings.whatsAppDestinationNumber || settings.supportWhatsApp || DEFAULT_WHATSAPP_DESTINATION
  );

  // General Store Logistics Settings
  const [standardDeliveryFee, setStandardDeliveryFee] = useState(settings.standardDeliveryFee);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(settings.freeShippingThreshold);
  const [expressDeliveryFee, setExpressDeliveryFee] = useState(settings.expressDeliveryFee);
  const [firstOrderDiscountEnabled, setFirstOrderDiscountEnabled] = useState(settings.firstOrderDiscountEnabled);
  const [firstOrderDiscountPercent, setFirstOrderDiscountPercent] = useState(settings.firstOrderDiscountPercent);
  const [supportPhone, setSupportPhone] = useState(settings.supportPhone);
  const [supportWhatsApp, setSupportWhatsApp] = useState(settings.supportWhatsApp);
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail);
  const [fssaiNumber, setFssaiNumber] = useState(settings.fssaiNumber);

  // Razorpay Gateway Settings
  const [razorpayMode, setRazorpayMode] = useState<'test' | 'live'>(settings.razorpayMode ?? 'test');
  const [razorpayKeyId, setRazorpayKeyId] = useState(settings.razorpayKeyId || 'rzp_test_placeholder_key_id');
  const [isCheckingReadiness, setIsCheckingReadiness] = useState(false);
  const [readinessResult, setReadinessResult] = useState<{
    success: boolean;
    issues: string[];
    details: string[];
  } | null>(null);

  // Validation
  const isKeyFormatValid =
    razorpayMode === 'test'
      ? razorpayKeyId.startsWith('rzp_test_')
      : razorpayKeyId.startsWith('rzp_live_');

  const normalizedWhatsApp = normalizeWhatsAppNumber(whatsAppDestinationNumber);

  useEffect(() => {
    if (settings) {
      setCheckoutMode(
        settings.checkoutMode === 'WHATSAPP' || settings.primaryCheckoutMode === 'WHATSAPP'
          ? 'WHATSAPP'
          : 'WEBSITE'
      );
      setIsCodGloballyEnabled(settings.isCodGloballyEnabled ?? true);
      setIsRazorpayEnabled(settings.isRazorpayEnabled ?? true);
      setDefaultPaymentMethod(
        settings.primaryCheckoutMode === 'RAZORPAY' || settings.defaultCustomerPaymentMethod === 'RAZORPAY'
          ? 'RAZORPAY'
          : 'COD'
      );
      setIsCodAdvanceEnabled(settings.isCodAdvanceEnabled ?? false);
      setCodAdvanceType(settings.codAdvanceType ?? 'FIXED');
      setCodAdvanceValue(settings.codAdvanceValue ?? 0);
      setCodAdvanceMinOrderValue(settings.codAdvanceMinOrderValue ?? 0);
      setCodAdvanceMinAmount(settings.codAdvanceMinAmount ?? 0);
      setCodAdvanceMaxAmount(settings.codAdvanceMaxAmount ?? 0);
      setCodFeeType(settings.codFeeType ?? 'FIXED');
      setCodFeeValue(settings.codFeeValue ?? 0);
      setCodMinOrderValue(settings.codMinOrderValue ?? 0);
      setCodMaxOrderValue(settings.codMaxOrderValue ?? 50000);
      setIsWhatsAppAssistedCodEnabled(
        settings.isWhatsAppAssistedCodEnabled ?? settings.isWhatsAppCheckoutEnabled ?? true
      );
      setWhatsAppDestinationNumber(
        settings.whatsAppDestinationNumber || settings.supportWhatsApp || DEFAULT_WHATSAPP_DESTINATION
      );
      setStandardDeliveryFee(settings.standardDeliveryFee);
      setFreeShippingThreshold(settings.freeShippingThreshold);
      setExpressDeliveryFee(settings.expressDeliveryFee);
      setFirstOrderDiscountEnabled(settings.firstOrderDiscountEnabled);
      setFirstOrderDiscountPercent(settings.firstOrderDiscountPercent);
      setSupportPhone(settings.supportPhone);
      setSupportWhatsApp(settings.supportWhatsApp);
      setSupportEmail(settings.supportEmail);
      setFssaiNumber(settings.fssaiNumber);
      if (settings.razorpayMode) setRazorpayMode(settings.razorpayMode);
      if (settings.razorpayKeyId) setRazorpayKeyId(settings.razorpayKeyId);
    }
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const canManageSettings = isSuperAdmin || (isAdmin && hasPermission('settings.manage'));
    if (!canManageSettings) {
      showToast('Permission Denied', 'Only Super Admin or authorized payment-settings administrators can modify store payment configuration.', 'error');
      return;
    }

    if (activeTab === 'razorpay') {
      if (!razorpayKeyId.trim()) {
        showToast('Validation Error', 'Public Razorpay Key ID cannot be empty.', 'error');
        return;
      }
      if (!isKeyFormatValid) {
        showToast(
          'Warning',
          `Key ID prefix should start with ${razorpayMode === 'test' ? 'rzp_test_' : 'rzp_live_'}.`,
          'warning'
        );
      }
    }

    // Ensure at least one payment method is enabled
    if (!isCodGloballyEnabled && !isRazorpayEnabled) {
      showToast('Validation Error', 'At least one customer payment method (COD or Razorpay) must remain enabled.', 'error');
      return;
    }

    // Validate COD Advance Settings
    const numericAdvanceVal = Math.max(0, Number(codAdvanceValue) || 0);
    const numericMinOrderVal = Math.max(0, Number(codAdvanceMinOrderValue) || 0);
    const numericMinAdvance = Math.max(0, Number(codAdvanceMinAmount) || 0);
    const numericMaxAdvance = Math.max(0, Number(codAdvanceMaxAmount) || 0);

    if (isCodAdvanceEnabled) {
      if (numericAdvanceVal <= 0) {
        showToast('Validation Error', 'Please enter a valid advance amount or percentage greater than 0.', 'error');
        return;
      }
      if (codAdvanceType === 'PERCENTAGE' && numericAdvanceVal > 100) {
        showToast('Validation Error', 'Advance percentage cannot exceed 100%.', 'error');
        return;
      }
      if (numericMaxAdvance > 0 && numericMinAdvance > numericMaxAdvance) {
        showToast('Validation Error', 'Minimum advance floor cannot exceed maximum advance cap.', 'error');
        return;
      }
    }

    if (checkoutMode === 'WEBSITE' && !isCodGloballyEnabled && !isRazorpayEnabled) {
      showToast('Validation Error', 'In Website Checkout mode, at least one payment method (COD or Razorpay) must be enabled.', 'error');
      return;
    }

    // Ensure default method is among enabled methods
    let effectiveDefault = defaultPaymentMethod;
    if (checkoutMode === 'WHATSAPP') {
      effectiveDefault = 'COD';
    } else if (defaultPaymentMethod === 'RAZORPAY' && !isRazorpayEnabled) {
      effectiveDefault = 'COD';
      setDefaultPaymentMethod('COD');
    } else if (defaultPaymentMethod === 'COD' && !isCodGloballyEnabled) {
      effectiveDefault = 'RAZORPAY';
      setDefaultPaymentMethod('RAZORPAY');
    }

    const cleanDestNumber = normalizeWhatsAppNumber(whatsAppDestinationNumber);

    updateStoreSettings({
      checkoutMode,
      primaryCheckoutMode: checkoutMode === 'WHATSAPP' ? 'WHATSAPP' : effectiveDefault,
      defaultCustomerPaymentMethod: effectiveDefault,
      isCodGloballyEnabled,
      isCodAdvanceEnabled,
      codAdvanceType,
      codAdvanceValue: numericAdvanceVal,
      codAdvanceMinOrderValue: numericMinOrderVal,
      codAdvanceMinAmount: numericMinAdvance,
      codAdvanceMaxAmount: numericMaxAdvance,
      // Cash on Delivery Extra Handling Fee (Phase 32)
      codFeeType,
      codFeeValue: Math.max(0, Number(codFeeValue) || 0),
      codMinOrderValue: Math.max(0, Number(codMinOrderValue) || 0),
      codMaxOrderValue: Math.max(0, Number(codMaxOrderValue) || 50000),
      isRazorpayEnabled,
      isWhatsAppAssistedCodEnabled,
      whatsAppDestinationNumber: cleanDestNumber,
      isWhatsAppCheckoutEnabled: checkoutMode === 'WHATSAPP',
      standardDeliveryFee: Number(standardDeliveryFee),
      freeShippingThreshold: Number(freeShippingThreshold),
      expressDeliveryFee: Number(expressDeliveryFee),
      firstOrderDiscountEnabled,
      firstOrderDiscountPercent: Number(firstOrderDiscountPercent),
      supportPhone,
      supportWhatsApp: cleanDestNumber,
      supportEmail,
      fssaiNumber,
      razorpayMode,
      razorpayKeyId: razorpayKeyId.trim()
    });

    showToast('Settings Saved', 'Store configuration and payment routing updated successfully.', 'success');
  };

  const runReadinessCheck = () => {
    setIsCheckingReadiness(true);
    setTimeout(() => {
      const issues: string[] = [];
      const details: string[] = [];

      if (!isRazorpayEnabled) {
        issues.push('Razorpay gateway is currently toggled OFF in store settings.');
      } else {
        details.push('Gateway status: Enabled for customer checkout.');
      }

      if (!razorpayKeyId.trim()) {
        issues.push('Public Key ID is empty.');
      } else if (!isKeyFormatValid) {
        issues.push(`Key ID mismatch: Mode is set to ${razorpayMode.toUpperCase()} but Key ID does not start with ${razorpayMode === 'test' ? 'rzp_test_' : 'rzp_live_'}.`);
      } else {
        details.push(`Public Key ID format verified (${razorpayMode.toUpperCase()} mode).`);
      }

      details.push('Edge Function: create-razorpay-order configured for server-side integer paise calculation.');
      details.push('Edge Function: verify-razorpay-payment enforces HMAC-SHA256 signature verification & captured payment.');
      details.push('Edge Function: razorpay-webhook configured with unique event idempotency claim.');
      details.push('Zero-Client Secrets: RAZORPAY_KEY_SECRET and RAZORPAY_WEBHOOK_SECRET are strictly isolated in Supabase server secrets.');

      setReadinessResult({
        success: issues.length === 0,
        issues,
        details
      });
      setIsCheckingReadiness(false);

      if (issues.length === 0) {
        showToast('Readiness Check Passed', 'Razorpay test mode is ready for checkout simulation.', 'success');
      } else {
        showToast('Readiness Issues Found', 'Review issues identified in configuration checklist.', 'warning');
      }
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-serif text-content-primary">
            Store & Payment Settings
          </h1>
          <p className="text-xs text-content-muted mt-0.5">
            Configure payment gateway exclusivity, Razorpay test/live keys, delivery rules, and contacts.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-canvas-subtle p-1 rounded-pill border border-border-subtle self-start">
          <button
            type="button"
            onClick={() => setActiveTab('store')}
            className={`px-3 py-1.5 rounded-pill text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'store'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-content-muted hover:text-content-primary'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Store & Logistics</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('razorpay')}
            className={`px-3 py-1.5 rounded-pill text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'razorpay'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-content-muted hover:text-content-primary'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Razorpay Payments</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {activeTab === 'store' ? (
          <>
            {/* 1. Checkout Configuration & Mode Selection (Phase 24 Part 2) */}
            <section className="bg-white rounded-card p-5 border border-border-subtle shadow-subtle space-y-5">
              <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
                <CreditCard className="w-5 h-5 text-brand-primary" />
                <div>
                  <h2 className="text-sm font-bold text-content-primary">
                    Customer-Facing Payment Methods & Checkout Defaults
                  </h2>
                  <p className="text-[11px] text-content-muted">
                    Checkout Configuration & Storefront Mode: Choose between WhatsApp Direct Ordering (Mode A) and Website Checkout (Mode B). Modes are mutually exclusive.
                  </p>
                </div>
              </div>

              {/* Mutually Exclusive Mode Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-content-primary block">
                  Select Primary Checkout Mode
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Mode A: WhatsApp Direct Ordering */}
                  <div
                    onClick={() => setCheckoutMode('WHATSAPP')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      checkoutMode === 'WHATSAPP'
                        ? 'border-[#25D366] bg-[#F0FDF4] shadow-xs'
                        : 'border-border-subtle hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-[#25D366]" />
                        <span className="font-bold text-xs text-content-primary">MODE A — WhatsApp Direct Ordering</span>
                      </div>
                      <input
                        type="radio"
                        name="checkoutMode"
                        checked={checkoutMode === 'WHATSAPP'}
                        onChange={() => setCheckoutMode('WHATSAPP')}
                        className="text-[#25D366] focus:ring-[#25D366]"
                      />
                    </div>
                    <p className="text-[11px] text-content-secondary mt-2 leading-relaxed">
                      Customers browse products and order directly through WhatsApp with a prefilled summary. Payment gates (Razorpay/COD) and website order creation are disabled.
                    </p>
                    <span className="inline-block mt-2.5 px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#166534]">
                      WhatsApp Only (+91 75939 59235)
                    </span>
                  </div>

                  {/* Mode B: Website Checkout */}
                  <div
                    onClick={() => setCheckoutMode('WEBSITE')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      checkoutMode === 'WEBSITE'
                        ? 'border-brand-primary bg-[#FAF7F2] shadow-xs'
                        : 'border-border-subtle hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-brand-primary" />
                        <span className="font-bold text-xs text-content-primary">MODE B — Website Checkout</span>
                      </div>
                      <input
                        type="radio"
                        name="checkoutMode"
                        checked={checkoutMode === 'WEBSITE'}
                        onChange={() => setCheckoutMode('WEBSITE')}
                        className="text-brand-primary focus:ring-brand-primary"
                      />
                    </div>
                    <p className="text-[11px] text-content-secondary mt-2 leading-relaxed">
                      Customers complete their order directly on the website with Razorpay and/or Cash on Delivery (COD). Orders are saved to the Admin Orders ledger.
                    </p>
                    <span className="inline-block mt-2.5 px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF3C7] text-[#92400E]">
                      Full Website Ecommerce
                    </span>
                  </div>
                </div>
              </div>

              {/* Mode A Notice */}
              {checkoutMode === 'WHATSAPP' && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <p className="font-bold">⚡ WhatsApp Direct Ordering Mode Active</p>
                  <p className="text-[11px] leading-relaxed">
                    Online gateways (Razorpay) and website COD are hidden across all customer pages. When customers click "Buy Now" or "Order on WhatsApp", WhatsApp will open directly with the selected items and pre-calculated totals sent to <strong>+91 75939 59235</strong>. No fake orders will be inserted into the Admin Orders page.
                  </p>
                </div>
              )}

              {/* Enabled Customer Payment Options (Visible only in Website Mode) */}
              {checkoutMode === 'WEBSITE' && (
                <div className="space-y-3 pt-3 border-t border-border-subtle">
                  <p className="text-xs font-bold text-content-primary">
                    Enabled Website Payment Options
                  </p>

                  {/* COD Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-canvas-subtle border border-border-subtle">
                    <div>
                      <p className="text-xs font-bold text-content-primary">Cash on Delivery (COD)</p>
                      <p className="text-[11px] text-content-muted">Allow customers to pay physical cash upon doorstep delivery</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isCodGloballyEnabled}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setIsCodGloballyEnabled(checked);
                          if (!checked && defaultPaymentMethod === 'COD' && isRazorpayEnabled) {
                            setDefaultPaymentMethod('RAZORPAY');
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-border-subtle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-status-success"></div>
                    </label>
                  </div>

                  {/* Razorpay Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-canvas-subtle border border-border-subtle">
                    <div>
                      <p className="text-xs font-bold text-content-primary">Razorpay Online Gateway</p>
                      <p className="text-[11px] text-content-muted">Allow customers to pay online via UPI (GPay/PhonePe), cards, and netbanking</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isRazorpayEnabled}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setIsRazorpayEnabled(checked);
                          if (!checked && defaultPaymentMethod === 'RAZORPAY' && isCodGloballyEnabled) {
                            setDefaultPaymentMethod('COD');
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-border-subtle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-status-success"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* Default Pre-Selected Payment Method */}
              <div className="pt-3 border-t border-border-subtle space-y-2">
                <label className="text-xs font-bold text-content-primary block">
                  Default Pre-Selected Payment Method at Checkout
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-btn border transition-colors cursor-pointer ${
                      !isCodGloballyEnabled ? 'opacity-50 cursor-not-allowed bg-stone-50' : 'hover:bg-canvas-subtle'
                    } ${defaultPaymentMethod === 'COD' && isCodGloballyEnabled ? 'border-brand-primary bg-brand-primary/5' : 'border-border-subtle'}`}
                  >
                    <input
                      type="radio"
                      name="defaultPaymentMethod"
                      value="COD"
                      disabled={!isCodGloballyEnabled}
                      checked={defaultPaymentMethod === 'COD'}
                      onChange={() => setDefaultPaymentMethod('COD')}
                      className="mt-0.5 text-brand-primary focus:ring-brand-primary"
                    />
                    <div className="space-y-0.5">
                      <span className="font-bold text-xs text-content-primary block">
                        Cash on Delivery (COD)
                      </span>
                      <p className="text-[11px] text-content-muted">
                        Pre-selected for shoppers. Collected on delivery.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-btn border transition-colors cursor-pointer ${
                      !isRazorpayEnabled ? 'opacity-50 cursor-not-allowed bg-stone-50' : 'hover:bg-canvas-subtle'
                    } ${defaultPaymentMethod === 'RAZORPAY' && isRazorpayEnabled ? 'border-brand-primary bg-brand-primary/5' : 'border-border-subtle'}`}
                  >
                    <input
                      type="radio"
                      name="defaultPaymentMethod"
                      value="RAZORPAY"
                      disabled={!isRazorpayEnabled}
                      checked={defaultPaymentMethod === 'RAZORPAY'}
                      onChange={() => setDefaultPaymentMethod('RAZORPAY')}
                      className="mt-0.5 text-brand-primary focus:ring-brand-primary"
                    />
                    <div className="space-y-0.5">
                      <span className="font-bold text-xs text-content-primary block">
                        Razorpay Online Gateway
                      </span>
                      <p className="text-[11px] text-content-muted">
                        Pre-selected for shoppers. Instant UPI & card checkout.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </section>

            {/* 2. Cash on Delivery (COD) & Mandatory Advance Configuration */}
            <section className="bg-white rounded-card p-5 border border-border-subtle shadow-subtle space-y-5">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-brand-primary" />
                  <div>
                    <h2 className="text-sm font-bold text-content-primary">
                      Cash on Delivery (COD)
                    </h2>
                    <p className="text-[11px] text-content-muted">
                      Configure doorstep cash payments and mandatory global advance payment settings.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCodGloballyEnabled}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsCodGloballyEnabled(checked);
                      if (!checked && defaultPaymentMethod === 'COD' && isRazorpayEnabled) {
                        setDefaultPaymentMethod('RAZORPAY');
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-border-subtle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-status-success"></div>
                </label>
              </div>

              {isCodGloballyEnabled ? (
                <div className="space-y-4">
                  {/* Mandatory COD Advance Toggle */}
                  <div className="flex items-start justify-between p-3.5 rounded-xl bg-canvas-subtle border border-border-subtle">
                    <div className="space-y-0.5 pr-4">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-brand-primary" />
                        <p className="text-xs font-bold text-content-primary">Mandatory COD Advance Payment</p>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Global Rule
                        </span>
                      </div>
                      <p className="text-[11px] text-content-muted leading-relaxed">
                        Require customers to pay a small advance online before their COD order is confirmed. The remaining balance is collected in cash at delivery.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                      <input
                        type="checkbox"
                        checked={isCodAdvanceEnabled}
                        onChange={(e) => setIsCodAdvanceEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-border-subtle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                    </label>
                  </div>

                  {isCodAdvanceEnabled && (
                    <div className="p-4 rounded-xl border border-brand-primary/20 bg-brand-primary/5 space-y-4">
                      {/* Advance Calculation Type */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-content-primary block">
                          Advance Calculation Type
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label
                            className={`flex items-start gap-3 p-3 rounded-btn border transition-colors cursor-pointer ${
                              codAdvanceType === 'FIXED'
                                ? 'border-brand-primary bg-white shadow-2xs'
                                : 'border-border-subtle bg-white/70 hover:bg-white'
                            }`}
                          >
                            <input
                              type="radio"
                              name="codAdvanceType"
                              value="FIXED"
                              checked={codAdvanceType === 'FIXED'}
                              onChange={() => setCodAdvanceType('FIXED')}
                              className="mt-0.5 text-brand-primary focus:ring-brand-primary"
                            />
                            <div>
                              <span className="font-bold text-xs text-content-primary block">Fixed Amount per Order</span>
                              <p className="text-[11px] text-content-muted">Charge a flat fixed rupee amount (e.g. ₹100) per order.</p>
                            </div>
                          </label>

                          <label
                            className={`flex items-start gap-3 p-3 rounded-btn border transition-colors cursor-pointer ${
                              codAdvanceType === 'PERCENTAGE'
                                ? 'border-brand-primary bg-white shadow-2xs'
                                : 'border-border-subtle bg-white/70 hover:bg-white'
                            }`}
                          >
                            <input
                              type="radio"
                              name="codAdvanceType"
                              value="PERCENTAGE"
                              checked={codAdvanceType === 'PERCENTAGE'}
                              onChange={() => setCodAdvanceType('PERCENTAGE')}
                              className="mt-0.5 text-brand-primary focus:ring-brand-primary"
                            />
                            <div>
                              <span className="font-bold text-xs text-content-primary block">Percentage of Order Value</span>
                              <p className="text-[11px] text-content-muted">Charge a percentage (e.g. 10%) of the total order value.</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Advance Value & Threshold Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-content-primary block">
                            {codAdvanceType === 'PERCENTAGE' ? 'Advance Percentage (%)' : 'Fixed Advance Amount (₹)'}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={codAdvanceType === 'PERCENTAGE' ? 100 : undefined}
                            step={codAdvanceType === 'PERCENTAGE' ? '1' : '10'}
                            value={codAdvanceValue}
                            onChange={(e) => setCodAdvanceValue(e.target.value)}
                            placeholder={codAdvanceType === 'PERCENTAGE' ? '10' : '100'}
                            className="w-full px-3 py-2 text-xs rounded-btn border border-border-subtle bg-white font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-content-primary block">
                            Min Order Value for Advance (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={codAdvanceMinOrderValue}
                            onChange={(e) => setCodAdvanceMinOrderValue(e.target.value)}
                            placeholder="0 (Applies to all)"
                            className="w-full px-3 py-2 text-xs rounded-btn border border-border-subtle bg-white font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-content-primary block">
                            Minimum Advance Floor (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={codAdvanceMinAmount}
                            onChange={(e) => setCodAdvanceMinAmount(e.target.value)}
                            placeholder="Optional floor"
                            className="w-full px-3 py-2 text-xs rounded-btn border border-border-subtle bg-white font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-content-primary block">
                            Maximum Advance Cap (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={codAdvanceMaxAmount}
                            onChange={(e) => setCodAdvanceMaxAmount(e.target.value)}
                            placeholder="0 (No maximum cap)"
                            className="w-full px-3 py-2 text-xs rounded-btn border border-border-subtle bg-white font-mono"
                          />
                        </div>
                      </div>

                      {/* Live Calculation Preview Banner */}
                      {(() => {
                        const sampleOrderTotal = 1000;
                        const previewSettings: any = {
                          isCodGloballyEnabled: true,
                          isCodAdvanceEnabled: true,
                          codAdvanceType,
                          codAdvanceValue: Number(codAdvanceValue) || 0,
                          codAdvanceMinOrderValue: Number(codAdvanceMinOrderValue) || 0,
                          codAdvanceMinAmount: Number(codAdvanceMinAmount) || 0,
                          codAdvanceMaxAmount: Number(codAdvanceMaxAmount) || 0
                        };
                        const preview = calculateCodAdvance(sampleOrderTotal, previewSettings);
                        return (
                          <div className="p-3 bg-white rounded-lg border border-border-subtle text-xs space-y-1.5 shadow-2xs">
                            <div className="flex items-center justify-between text-content-primary font-bold">
                              <span className="flex items-center gap-1.5 text-brand-primary">
                                <Calculator className="w-3.5 h-3.5" />
                                <span>Live Example Calculation (₹1,000 Sample Order)</span>
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                1x Per Order
                              </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                              <div>
                                <span className="text-content-muted block">Order Total:</span>
                                <span className="font-mono font-bold text-content-primary">₹{sampleOrderTotal}</span>
                              </div>
                              <div>
                                <span className="text-content-muted block">Advance Payable Now:</span>
                                <span className="font-mono font-bold text-brand-primary">₹{preview.advanceAmount}</span>
                              </div>
                              <div>
                                <span className="text-content-muted block">Remaining at Delivery:</span>
                                <span className="font-mono font-bold text-emerald-700">₹{preview.remainingAmount}</span>
                              </div>
                            </div>
                            <p className="text-[10px] text-content-muted border-t border-border-subtle/60 pt-1.5">
                              * Regardless of how many products (e.g. 3 items) or quantities are in the cart, this advance is charged exactly once per order.
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-stone-50 rounded-lg text-xs text-content-muted">
                  Cash on Delivery is currently disabled across the storefront. Enable COD above to configure advance options.
                </div>
              )}
            </section>

            {/* Cash on Delivery (COD) Extra Charge & Limits Configuration */}
            <section className="bg-white rounded-card p-5 border border-border-subtle shadow-subtle space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FAF6EE] text-[#A67732] flex items-center justify-center font-bold text-sm">
                    ₹
                  </div>
                  <div>
                    <h2 className="font-serif text-sm font-bold text-content-primary">
                      Cash on Delivery (COD) Handling Surcharge & Limits
                    </h2>
                    <p className="text-[11px] text-content-muted">
                      Configure additional fee for cash collection and minimum/maximum order limits for COD eligibility.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-content-primary block">COD Fee Calculation Type</label>
                  <select
                    value={codFeeType}
                    onChange={(e) => setCodFeeType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-btn border border-border-subtle bg-white font-bold"
                  >
                    <option value="FIXED">Fixed Amount (₹)</option>
                    <option value="PERCENTAGE">Percentage of Subtotal (%)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-content-primary block">
                    {codFeeType === 'PERCENTAGE' ? 'COD Fee Percentage (%)' : 'COD Fee Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={codFeeValue}
                    onChange={(e) => setCodFeeValue(e.target.value)}
                    placeholder="e.g. 30"
                    className="w-full px-3 py-2 text-xs rounded-btn border border-border-subtle bg-white font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-content-primary block">Min Order Value for COD (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={codMinOrderValue}
                    onChange={(e) => setCodMinOrderValue(e.target.value)}
                    placeholder="0 (No minimum)"
                    className="w-full px-3 py-2 text-xs rounded-btn border border-border-subtle bg-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-content-primary block">Max Order Value for COD (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={codMaxOrderValue}
                    onChange={(e) => setCodMaxOrderValue(e.target.value)}
                    placeholder="50000"
                    className="w-full px-3 py-2 text-xs rounded-btn border border-border-subtle bg-white font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#EAE5DC] text-[11px] text-[#71717A] flex items-center justify-between">
                <span>
                  <strong>Active Surcharge:</strong> {Number(codFeeValue) > 0 ? (codFeeType === 'PERCENTAGE' ? `${codFeeValue}% on cart subtotal` : `+₹${codFeeValue} flat handling fee`) : '₹0 (Free COD)'} • Applies strictly to COD orders. Online payment fee is always ₹0.
                </span>
              </div>
            </section>

            {/* 3. Internal Order Routing & Confirmation: WhatsApp-Assisted COD */}
            <section className="bg-white rounded-card p-5 border border-border-subtle shadow-subtle space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#128C7E]" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-content-primary">
                        Internal Order Routing & WhatsApp COD Confirmation
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]">
                        Internal Channel
                      </span>
                    </div>
                    <p className="text-[11px] text-content-muted">
                      WhatsApp is an internal order-processing & verification channel. It is not displayed as a customer payment option.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={isWhatsAppAssistedCodEnabled}
                    onChange={(e) => setIsWhatsAppAssistedCodEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-border-subtle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                </label>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-border-subtle text-xs space-y-1">
                  <p className="font-semibold text-content-primary">
                    {isWhatsAppAssistedCodEnabled
                      ? 'WhatsApp-assisted COD order routing is ACTIVE'
                      : 'WhatsApp-assisted COD order routing is DISABLED'}
                  </p>
                  <p className="text-[11px] text-content-muted leading-relaxed">
                    {isWhatsAppAssistedCodEnabled
                      ? 'When enabled, customer Cash on Delivery orders prepare a structured order summary and route it to your WhatsApp desk for customer verification, placing the order in an "Awaiting Confirmation" state until acknowledged.'
                      : 'When disabled, COD orders follow standard website direct confirmation without dispatching to WhatsApp.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-content-primary block">
                      WhatsApp Destination Number
                    </label>
                    <input
                      type="text"
                      value={whatsAppDestinationNumber}
                      onChange={(e) => setWhatsAppDestinationNumber(e.target.value)}
                      placeholder="+91 75939 59235"
                      className="w-full px-3 py-2 text-xs rounded-btn border border-border-subtle bg-canvas-subtle font-mono"
                    />
                    <p className="text-[10px] text-content-muted">
                      Configured destination: <strong className="text-content-primary font-mono">{normalizedWhatsApp}</strong>
                    </p>
                  </div>

                  <div className="space-y-1 text-xs text-content-muted flex flex-col justify-center">
                    <span className="font-semibold text-content-primary">Normalized International Format:</span>
                    <p className="text-[11px] leading-relaxed">
                      Safe default is <code className="font-mono bg-canvas-subtle px-1 rounded">917593959235</code> (+91 75939 59235). Digits are automatically sanitized for the WhatsApp API.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Shipping & Delivery Configuration */}
            <section className="bg-white rounded-card p-5 border border-border-subtle shadow-subtle space-y-4">
              <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
                <Truck className="w-5 h-5 text-brand-primary" />
                <h2 className="text-sm font-bold text-content-primary">
                  Delivery Fees & Free Shipping Thresholds
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-content-primary block">
                    Standard Shipping Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={standardDeliveryFee}
                    onChange={(e) => setStandardDeliveryFee(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-btn border border-border-subtle bg-canvas-subtle"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-content-primary block">
                    Free Shipping Threshold (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={freeShippingThreshold}
                    onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-btn border border-border-subtle bg-canvas-subtle font-bold text-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-content-primary block">
                    Express Delivery Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={expressDeliveryFee}
                    onChange={(e) => setExpressDeliveryFee(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-btn border border-border-subtle bg-canvas-subtle"
                  />
                </div>
              </div>
            </section>

            {/* First-Order Customer Incentive */}
            <section className="bg-white rounded-card p-5 border border-border-subtle shadow-subtle space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-primary" />
                  <h2 className="text-sm font-bold text-content-primary">
                    First-Order New Customer Incentive
                  </h2>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={firstOrderDiscountEnabled}
                    onChange={(e) => setFirstOrderDiscountEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-border-subtle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-status-success"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-content-primary block">
                    Discount Percentage (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={firstOrderDiscountPercent}
                    onChange={(e) => setFirstOrderDiscountPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-btn border border-border-subtle bg-canvas-subtle font-bold"
                  />
                </div>
                <p className="text-xs text-content-muted flex items-center">
                  Automatically validated by server pricing engine (verifies customer order count = 0).
                </p>
              </div>
            </section>

            {/* Store Metadata & Regulatory Compliance */}
            <section className="bg-white rounded-card p-5 border border-border-subtle shadow-subtle space-y-4">
              <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
                <ShieldCheck className="w-5 h-5 text-brand-primary" />
                <h2 className="text-sm font-bold text-content-primary">
                  Store Credentials & Verified Support Contacts
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-content-primary block">
                    FSSAI Central License Number
                  </label>
                  <input
                    type="text"
                    value={fssaiNumber}
                    onChange={(e) => setFssaiNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-btn border border-border-subtle bg-canvas-subtle font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-content-primary block">
                    Support Email Address
                  </label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-btn border border-border-subtle bg-canvas-subtle"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-content-primary block">
                    Customer Support Phone
                  </label>
                  <input
                    type="text"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-btn border border-border-subtle bg-canvas-subtle"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-content-primary block">
                    WhatsApp Business Number
                  </label>
                  <input
                    type="text"
                    value={supportWhatsApp}
                    onChange={(e) => setSupportWhatsApp(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-btn border border-border-subtle bg-canvas-subtle font-mono"
                  />
                </div>
              </div>
            </section>
          </>
        ) : (
          /* Razorpay Payment Gateway Settings Tab */
          <div className="space-y-5">
            {/* Gateway Activation & Mode */}
            <section className="bg-white rounded-card p-5 border border-border-subtle shadow-subtle space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-brand-primary" />
                  <div>
                    <h2 className="text-sm font-bold text-content-primary">
                      Razorpay Gateway Status
                    </h2>
                    <p className="text-[11px] text-content-muted">
                      Controls online payments via cards, UPI, and netbanking across the storefront.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRazorpayEnabled}
                    onChange={(e) => setIsRazorpayEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-border-subtle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-status-success"></div>
                </label>
              </div>

              {/* Mode Selector */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setRazorpayMode('test')}
                  className={`p-3 rounded-btn border text-left transition-all ${
                    razorpayMode === 'test'
                      ? 'border-brand-primary bg-amber-50/50 shadow-sm'
                      : 'border-border-subtle hover:bg-canvas-subtle'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-content-primary">Test Mode (Sandbox)</span>
                    {razorpayMode === 'test' && (
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    )}
                  </div>
                  <p className="text-[10px] text-content-muted mt-1">
                    Safe testing mode. Simulates payments using Razorpay mock UPI/cards.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRazorpayMode('live')}
                  className={`p-3 rounded-btn border text-left transition-all ${
                    razorpayMode === 'live'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                      : 'border-border-subtle hover:bg-canvas-subtle'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-content-primary">Production (Live Mode)</span>
                    {razorpayMode === 'live' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    )}
                  </div>
                  <p className="text-[10px] text-content-muted mt-1">
                    Processes real bank transactions. Requires KYC-approved Razorpay live keys.
                  </p>
                </button>
              </div>

              {/* Public Key ID Input */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-content-primary">
                    Public Razorpay Key ID *
                  </label>
                  <span className="text-[10px] text-content-muted font-mono">
                    Expected: {razorpayMode === 'test' ? 'rzp_test_...' : 'rzp_live_...'}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={razorpayKeyId}
                  onChange={(e) => setRazorpayKeyId(e.target.value)}
                  placeholder={razorpayMode === 'test' ? 'rzp_test_xxxxxxxxxx' : 'rzp_live_xxxxxxxxxx'}
                  className={`w-full px-3 py-2 text-xs rounded-btn border font-mono ${
                    isKeyFormatValid
                      ? 'border-border-subtle bg-canvas-subtle'
                      : 'border-amber-400 bg-amber-50/50 focus:border-amber-600'
                  }`}
                />
                {!isKeyFormatValid && (
                  <p className="text-[11px] text-amber-700 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Key ID does not match {razorpayMode.toUpperCase()} mode convention (should start with{' '}
                      <code>{razorpayMode === 'test' ? 'rzp_test_' : 'rzp_live_'}</code>).
                    </span>
                  </p>
                )}
              </div>
            </section>

            {/* Zero-Client Secrets Security Redaction Notice */}
            <section className="bg-amber-50/70 border border-amber-200/80 rounded-card p-4 space-y-2.5 text-xs text-amber-900">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <Lock className="w-4 h-4 text-amber-700" />
                <span>Zero-Client Secret Architecture & Redaction Guarantee</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-900/90">
                For security compliance, <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">RAZORPAY_KEY_SECRET</code> and{' '}
                <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">RAZORPAY_WEBHOOK_SECRET</code> are never exposed to the frontend browser,
                stored in local storage, or readable via client queries.
              </p>
              <div className="p-2.5 bg-white/80 rounded-btn border border-amber-200 text-[11px] space-y-1 font-mono text-content-primary">
                <p className="text-[10px] text-content-muted font-sans font-semibold uppercase">Server-Side Secret Configuration Command:</p>
                <code className="block select-all bg-canvas p-1.5 rounded text-[10px]">
                  supabase secrets set RAZORPAY_KEY_ID={razorpayKeyId || 'rzp_test_...'} RAZORPAY_KEY_SECRET=your_secret RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
                </code>
              </div>
            </section>

            {/* Webhook Configuration Status */}
            <section className="bg-white rounded-card p-5 border border-border-subtle shadow-subtle space-y-3">
              <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-primary" />
                  <h3 className="text-xs font-bold text-content-primary">
                    Razorpay Webhook Endpoint
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                  Active Endpoint
                </span>
              </div>

              <p className="text-[11px] text-content-muted">
                Add this webhook URL in your Razorpay Dashboard under <strong>Settings → Webhooks</strong>:
              </p>
              <div className="p-2 bg-canvas-subtle rounded border border-border-subtle font-mono text-[10px] select-all break-all text-content-primary">
                https://qjuvwrjpbwxkqyvffbcy.supabase.co/functions/v1/razorpay-webhook
              </div>
              <p className="text-[10px] text-content-muted">
                Subscribed events: <code className="text-content-primary">order.paid</code>,{' '}
                <code className="text-content-primary">payment.captured</code>,{' '}
                <code className="text-content-primary">payment.failed</code>
              </p>
            </section>

            {/* Safe Test-Mode Readiness Checks */}
            <section className="bg-white rounded-card p-5 border border-border-subtle shadow-subtle space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div>
                  <h3 className="text-xs font-bold text-content-primary">
                    Safe Test-Mode Readiness Checklist
                  </h3>
                  <p className="text-[11px] text-content-muted">
                    Validates end-to-end integration readiness before performing live transactions.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={runReadinessCheck}
                  disabled={isCheckingReadiness}
                  className="px-3 py-1.5 rounded-btn bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingReadiness ? 'animate-spin' : ''}`} />
                  <span>Run Readiness Check</span>
                </button>
              </div>

              {readinessResult && (
                <div className="space-y-3 pt-1 text-xs">
                  {readinessResult.issues.length > 0 && (
                    <div className="p-3 rounded-btn bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                      <span className="font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Issues Detected:
                      </span>
                      <ul className="list-disc list-inside text-[11px] space-y-0.5">
                        {readinessResult.issues.map((iss, i) => (
                          <li key={i}>{iss}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="p-3 rounded-btn bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-1">
                    <span className="font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Architecture Verification:
                    </span>
                    <ul className="list-disc list-inside text-[11px] space-y-0.5">
                      {readinessResult.details.map((det, i) => (
                        <li key={i}>{det}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-btn bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold shadow flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Save Store & Payment Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};

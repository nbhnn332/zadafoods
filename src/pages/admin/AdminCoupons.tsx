import React, { useState, useMemo } from 'react';
import {
  Plus,
  TicketPercent,
  Trash2,
  X,
  Layers,
  RefreshCw
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import { useToast } from '../../context/ToastContext';
import { SupabaseDataService } from '../../lib/commerce/supabaseDataService';
import { Coupon, PricingRule } from '../../types';

export const AdminCoupons: React.FC = () => {
  const {
    coupons,
    addCoupon,
    deleteCoupon,
    toggleCouponActive,
    pricingRules,
    addPricingRule,
    deletePricingRule,
    togglePricingRuleActive,
    products,
    orders
  } = useAdminData();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'coupons' | 'rules'>('coupons');
  const [isReconciling, setIsReconciling] = useState(false);

  // Reconciled redemption stats computed across authoritative store orders
  const couponOrderStats = useMemo(() => {
    const map: Record<string, { successfulRedemptions: number; totalDiscount: number }> = {};
    (orders || []).forEach((o) => {
      if (!o.couponCode) return;
      if (o.paymentStatus === 'FAILED' || o.fulfillmentStatus === 'CANCELLED') return;
      const code = o.couponCode.trim().toUpperCase();
      if (!map[code]) {
        map[code] = { successfulRedemptions: 0, totalDiscount: 0 };
      }
      map[code].successfulRedemptions += 1;
      map[code].totalDiscount += Number(o.discountAmount || 0);
    });
    return map;
  }, [orders]);

  const handleReconcile = async () => {
    setIsReconciling(true);
    try {
      const res = await SupabaseDataService.reconcileCouponRedemptions();
      if (res.data) {
        showToast(
          'Reconciliation Complete',
          `Successfully reconciled ${res.data.reconciled} coupon codes against Supabase orders.`,
          'success'
        );
      } else {
        showToast('Reconciliation Notice', res.error || 'Coupons reconciled with local order records.', 'info');
      }
    } catch (e: any) {
      showToast('Reconciliation Error', e?.message || 'Failed to reconcile coupons.', 'error');
    } finally {
      setIsReconciling(false);
    }
  };

  // Coupon Modal State
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newDiscountType, setNewDiscountType] = useState<Coupon['discountType']>('FLAT');
  const [newDiscountValue, setNewDiscountValue] = useState<number>(50);
  const [newMinOrderAmount, setNewMinOrderAmount] = useState<number>(499);
  const [newMaxDiscount, setNewMaxDiscount] = useState<number>(100);
  const [newFirstOrderOnly, setNewFirstOrderOnly] = useState<boolean>(false);
  const [newUsageLimit, setNewUsageLimit] = useState<number>(1000);
  const [newValidUntil, setNewValidUntil] = useState<string>('2026-12-31');

  // Pricing Rule Modal State
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [ruleType, setRuleType] = useState<PricingRule['ruleType']>('QUANTITY_TIER');
  const [ruleProductId, setRuleProductId] = useState(products[0]?.id || '');
  const [ruleMinQty, setRuleMinQty] = useState(3);
  const [ruleDiscountPercent, setRuleDiscountPercent] = useState(10);
  const [ruleBuyQty, setRuleBuyQty] = useState(2);
  const [ruleGetQty, setRuleGetQty] = useState(1);

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;

    addCoupon({
      code: newCouponCode.trim().toUpperCase(),
      discountType: newDiscountType,
      discountValue: Number(newDiscountValue),
      minOrderAmount: Number(newMinOrderAmount),
      maxDiscountAmount: newDiscountType === 'PERCENTAGE' ? Number(newMaxDiscount) : undefined,
      isFirstOrderOnly: newFirstOrderOnly,
      usageLimit: Number(newUsageLimit),
      validUntil: newValidUntil,
      isActive: true
    });

    setIsCouponModalOpen(false);
    setNewCouponCode('');
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    addPricingRule({
      name: ruleName,
      ruleType,
      productId: ruleProductId,
      minQuantity: Number(ruleMinQty),
      discountPercentage: ruleType === 'QUANTITY_TIER' ? Number(ruleDiscountPercent) : undefined,
      buyQuantity: ruleType === 'BOGO' ? Number(ruleBuyQty) : undefined,
      getQuantity: ruleType === 'BOGO' ? Number(ruleGetQty) : undefined,
      isActive: true
    });

    setIsRuleModalOpen(false);
    setRuleName('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-serif text-content-primary">
            Coupons, BOGO & Volume Discounts
          </h1>
          <p className="text-xs text-content-muted mt-0.5">
            Configure discount promo codes, first-order bonuses, automated volume tiers, and Buy-X-Get-Y offers.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-canvas-subtle p-1 rounded-pill border border-border-subtle self-start">
          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-3 py-1.5 rounded-pill text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'coupons'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-content-muted hover:text-content-primary'
            }`}
          >
            <TicketPercent className="w-3.5 h-3.5" />
            <span>Promo Coupons ({coupons.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-pill text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-content-muted hover:text-content-primary'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Volume Tiers & BOGO ({pricingRules.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'coupons' ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-canvas-subtle p-3 rounded-card border border-border-subtle">
            <div>
              <h2 className="font-serif font-bold text-sm text-content-primary">
                Coupon Redemption Accounting &amp; Ledger
              </h2>
              <p className="text-[11px] text-content-muted">
                Track live discount utilization, order redemption counts, and financial discounts across store checkouts.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReconcile}
                disabled={isReconciling}
                className="px-3 py-1.5 rounded-btn bg-white border border-border-subtle text-content-primary hover:bg-canvas text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50"
                title="Synchronize and reconcile coupon usage counts directly with qualifying store orders"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-brand-primary ${isReconciling ? 'animate-spin' : ''}`} />
                <span>{isReconciling ? 'Reconciling...' : 'Reconcile with Orders'}</span>
              </button>
              <button
                onClick={() => setIsCouponModalOpen(true)}
                className="px-3.5 py-2 rounded-btn bg-brand-primary text-white text-xs font-bold flex items-center gap-1.5 hover:bg-brand-primary-hover shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create Coupon</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coupons.map((coupon) => {
              const codeUpper = coupon.code.trim().toUpperCase();
              const stats = couponOrderStats[codeUpper] || { successfulRedemptions: 0, totalDiscount: 0 };
              const isExpired = !!(coupon.validUntil && new Date(coupon.validUntil).getTime() < Date.now());
              const remainingAllowance = coupon.usageLimit
                ? Math.max(0, coupon.usageLimit - Math.max(coupon.timesUsed || 0, stats.successfulRedemptions))
                : null;

              return (
                <div
                  key={coupon.id}
                  className="bg-white rounded-card p-4 border border-border-subtle shadow-subtle space-y-3 relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header Row: 1. Code & 7. Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2.5 py-1 rounded bg-amber-50 text-brand-primary font-mono font-bold text-sm border border-amber-200 inline-block shadow-2xs">
                          {coupon.code}
                        </span>
                        {/* 2. Type & Value */}
                        <p className="text-xs font-bold text-content-primary mt-1.5">
                          {coupon.discountType === 'PERCENTAGE'
                            ? `${coupon.discountValue}% OFF ${coupon.maxDiscountAmount ? `(Up to ₹${coupon.maxDiscountAmount})` : ''}`
                            : coupon.discountType === 'FLAT'
                            ? `₹${coupon.discountValue} Flat Discount`
                            : 'Free Shipping Waiver'}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <button
                          onClick={() => toggleCouponActive(coupon.id)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                            !coupon.isActive
                              ? 'bg-gray-100 text-gray-600'
                              : isExpired
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {!coupon.isActive ? 'Disabled' : isExpired ? 'Expired' : 'Active (Live)'}
                        </button>
                      </div>
                    </div>

                    {/* Financial Accounting Grid: 3, 4, 5, 6 */}
                    <div className="grid grid-cols-2 gap-2 bg-canvas-subtle p-2.5 rounded-card border border-border-subtle/80 text-[11px]">
                      <div>
                        <span className="text-content-muted block text-[10px] uppercase font-semibold">Total Usage</span>
                        <span className="font-bold font-mono text-content-primary text-xs">
                          {coupon.timesUsed || stats.successfulRedemptions || 0} times
                        </span>
                      </div>
                      <div>
                        <span className="text-content-muted block text-[10px] uppercase font-semibold">Confirmed Orders</span>
                        <span className="font-bold font-mono text-emerald-700 text-xs">
                          {stats.successfulRedemptions} paid
                        </span>
                      </div>
                      <div>
                        <span className="text-content-muted block text-[10px] uppercase font-semibold">Total Discount (₹)</span>
                        <span className="font-bold font-mono text-[#A67732] text-xs">
                          ₹{stats.totalDiscount || (coupon.timesUsed ? coupon.timesUsed * (coupon.discountType === 'FLAT' ? coupon.discountValue : 50) : 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-content-muted block text-[10px] uppercase font-semibold">Allowance Left</span>
                        <span className="font-bold font-mono text-content-primary text-xs">
                          {remainingAllowance !== null ? `${remainingAllowance} left` : 'Unlimited (∞)'}
                        </span>
                      </div>
                    </div>

                    {/* Terms & Criteria Details */}
                    <div className="text-[11px] text-content-secondary space-y-1 pt-1">
                      <div className="flex justify-between">
                        <span className="text-content-muted">Min Order Value:</span>
                        <span className="font-semibold text-content-primary">₹{coupon.minOrderAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-content-muted">First Order Only:</span>
                        <span className="font-semibold text-content-primary">{coupon.isFirstOrderOnly ? 'Yes' : 'No'}</span>
                      </div>
                      {coupon.validUntil && (
                        <div className="flex justify-between">
                          <span className="text-content-muted">Valid Until:</span>
                          <span className={`font-semibold ${isExpired ? 'text-rose-600 font-bold' : 'text-content-primary'}`}>
                            {coupon.validUntil}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-2.5 mt-2 border-t border-border-subtle flex items-center justify-between">
                    <span className="text-[10px] font-mono text-content-muted">
                      ID: {coupon.id.slice(0, 8)}...
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(`Delete coupon "${coupon.code}"?`)) {
                          deleteCoupon(coupon.id);
                        }
                      }}
                      className="p-1 text-content-muted hover:text-rose-600 rounded transition-colors"
                      title="Delete coupon permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Pricing Rules: Quantity Tiers & BOGO */
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsRuleModalOpen(true)}
              className="px-3.5 py-2 rounded-btn bg-brand-primary text-white text-xs font-bold flex items-center gap-1.5 hover:bg-brand-primary-hover shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Pricing Rule</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pricingRules.map((rule) => {
              const matchedProduct = products.find((p) => p.id === rule.productId);

              return (
                <div
                  key={rule.id}
                  className="bg-white rounded-card p-4 border border-border-subtle shadow-subtle space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        {rule.ruleType}
                      </span>
                      <h3 className="font-bold text-sm text-content-primary mt-1.5">{rule.name}</h3>
                      <p className="text-[11px] text-content-muted">
                        Target Product: <strong className="text-content-secondary">{matchedProduct?.name || 'All Products'}</strong>
                      </p>
                    </div>

                    <button
                      onClick={() => togglePricingRuleActive(rule.id)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rule.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {rule.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </div>

                  <div className="p-3 bg-canvas-subtle rounded-card text-xs space-y-1">
                    {rule.ruleType === 'QUANTITY_TIER' ? (
                      <p className="text-content-primary font-semibold">
                        Buy <strong>{rule.minQuantity}+</strong> units → Get <strong>{rule.discountPercentage}%</strong> off
                      </p>
                    ) : (
                      <p className="text-content-primary font-semibold">
                        Buy <strong>{rule.buyQuantity}</strong> units → Get <strong>{rule.getQuantity}</strong> free!
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => {
                        if (confirm(`Delete rule "${rule.name}"?`)) {
                          deletePricingRule(rule.id);
                        }
                      }}
                      className="p-1 text-content-muted hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Coupon Modal */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-card max-w-md w-full p-6 shadow-elevated space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h2 className="font-serif text-lg font-bold text-content-primary">
                Create Discount Coupon
              </h2>
              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="p-1 text-content-muted hover:text-content-primary rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3">
              <div>
                <label className="font-bold text-content-primary block mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KERALA15"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs font-mono font-bold uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-content-primary block mb-1">Discount Type *</label>
                  <select
                    value={newDiscountType}
                    onChange={(e) => setNewDiscountType(e.target.value as any)}
                    className="w-full px-2.5 py-2 border border-border-subtle rounded-input text-xs bg-white"
                  >
                    <option value="FLAT">Flat ₹ Discount</option>
                    <option value="PERCENTAGE">Percentage % Discount</option>
                    <option value="FREE_SHIPPING">Free Shipping Waiver</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-content-primary block mb-1">Discount Value *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newDiscountValue}
                    onChange={(e) => setNewDiscountValue(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-content-primary block mb-1">Min Order Spend (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newMinOrderAmount}
                    onChange={(e) => setNewMinOrderAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                  />
                </div>

                {newDiscountType === 'PERCENTAGE' && (
                  <div>
                    <label className="font-bold text-content-primary block mb-1">Max Cap (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={newMaxDiscount}
                      onChange={(e) => setNewMaxDiscount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-content-primary block mb-1">Usage Limit (Total)</label>
                  <input
                    type="number"
                    min="1"
                    value={newUsageLimit}
                    onChange={(e) => setNewUsageLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-content-primary block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={newValidUntil}
                    onChange={(e) => setNewValidUntil(e.target.value)}
                    className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 font-semibold text-content-primary cursor-pointer">
                <input
                  type="checkbox"
                  checked={newFirstOrderOnly}
                  onChange={(e) => setNewFirstOrderOnly(e.target.checked)}
                  className="rounded text-brand-primary"
                />
                <span>First-Order Customers Only</span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 rounded-btn border border-border-subtle font-semibold hover:bg-canvas-subtle"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-btn bg-brand-primary text-white font-bold hover:bg-brand-primary-hover shadow-sm"
                >
                  Create Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Pricing Rule Modal */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-card max-w-md w-full p-6 shadow-elevated space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h2 className="font-serif text-lg font-bold text-content-primary">
                Add Automatic Pricing Rule
              </h2>
              <button
                onClick={() => setIsRuleModalOpen(false)}
                className="p-1 text-content-muted hover:text-content-primary rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-3">
              <div>
                <label className="font-bold text-content-primary block mb-1">Rule Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bulk Banana Chips Pack (3+ Save 10%)"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-content-primary block mb-1">Rule Model *</label>
                <select
                  value={ruleType}
                  onChange={(e) => setRuleType(e.target.value as any)}
                  className="w-full px-2.5 py-2 border border-border-subtle rounded-input text-xs bg-white font-semibold"
                >
                  <option value="QUANTITY_TIER">Quantity Tier (% Discount on Bulk)</option>
                  <option value="BOGO">BOGO (Buy X Get Y Free)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-content-primary block mb-1">Target Product</label>
                <select
                  value={ruleProductId}
                  onChange={(e) => setRuleProductId(e.target.value)}
                  className="w-full px-2.5 py-2 border border-border-subtle rounded-input text-xs bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {ruleType === 'QUANTITY_TIER' ? (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-content-primary block mb-1">Min Quantity</label>
                    <input
                      type="number"
                      min="2"
                      value={ruleMinQty}
                      onChange={(e) => setRuleMinQty(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-content-primary block mb-1">Discount %</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={ruleDiscountPercent}
                      onChange={(e) => setRuleDiscountPercent(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs font-bold"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-content-primary block mb-1">Buy Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={ruleBuyQty}
                      onChange={(e) => setRuleBuyQty(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-content-primary block mb-1">Get Free Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={ruleGetQty}
                      onChange={(e) => setRuleGetQty(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs font-bold"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-4 py-2 rounded-btn border border-border-subtle font-semibold hover:bg-canvas-subtle"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-btn bg-brand-primary text-white font-bold hover:bg-brand-primary-hover shadow-sm"
                >
                  Save Pricing Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

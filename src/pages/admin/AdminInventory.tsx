import React, { useState } from 'react';
import {
  AlertTriangle,
  Boxes,
  History,
  Search,
  Plus,
  Minus,
  X,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import { StockMovementReason } from '../../types';

export const AdminInventory: React.FC = () => {
  const { products, stockMovements, adjustVariantStock } = useAdminData();

  const [activeTab, setActiveTab] = useState<'inventory' | 'movements'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  // Stock Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<{
    variantId: string;
    productName: string;
    weightLabel: string;
    sku: string;
    currentStock: number;
  } | null>(null);

  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'DEDUCT' | 'OVERRIDE'>('ADD');
  const [adjustmentQty, setAdjustmentQty] = useState<number>(10);
  const [adjustmentReason, setAdjustmentReason] = useState<StockMovementReason>('PURCHASE_ORDER');
  const [adjustmentNotes, setAdjustmentNotes] = useState<string>('');

  const allVariants = products.flatMap((p) =>
    p.variants.map((v) => ({
      ...v,
      productId: p.id,
      productName: p.name,
      productCategory: p.categorySlug
    }))
  );

  const filteredVariants = allVariants.filter((v) => {
    const matchesSearch =
      v.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.weightLabel.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLowStock = !filterLowStockOnly || v.stockQuantity <= v.lowStockThreshold;

    return matchesSearch && matchesLowStock;
  });

  const openAdjustmentModal = (variant: typeof allVariants[0]) => {
    setSelectedVariant({
      variantId: variant.id,
      productName: variant.productName,
      weightLabel: variant.weightLabel,
      sku: variant.sku,
      currentStock: variant.stockQuantity
    });
    setAdjustmentType('ADD');
    setAdjustmentQty(20);
    setAdjustmentReason('PURCHASE_ORDER');
    setAdjustmentNotes('');
    setIsAdjustModalOpen(true);
  };

  const handleConfirmAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant) return;

    let delta = 0;
    if (adjustmentType === 'ADD') {
      delta = Math.abs(adjustmentQty);
    } else if (adjustmentType === 'DEDUCT') {
      delta = -Math.abs(adjustmentQty);
    } else {
      // OVERRIDE: pass target new stock with MANUAL_ADJUSTMENT
      delta = Math.max(0, adjustmentQty);
    }

    const reasonToUse = adjustmentType === 'OVERRIDE' ? 'MANUAL_ADJUSTMENT' : adjustmentReason;

    adjustVariantStock(
      selectedVariant.variantId,
      delta,
      reasonToUse,
      adjustmentNotes || `Stock adjustment for ${selectedVariant.productName}`
    );

    setIsAdjustModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-serif text-content-primary">
            Inventory & Stock Operations
          </h1>
          <p className="text-xs text-content-muted mt-0.5">
            Audit-logged variant stock management, threshold enforcement, and movement history tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-canvas-subtle p-1 rounded-pill border border-border-subtle self-start">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-1.5 rounded-pill text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'inventory'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-content-muted hover:text-content-primary'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Active SKUs ({allVariants.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-3 py-1.5 rounded-pill text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'movements'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-content-muted hover:text-content-primary'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Movement Audit Trail ({stockMovements.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <div className="space-y-4">
          {/* Search & Low Stock Quick Filter */}
          <div className="bg-white rounded-card p-3 border border-border-subtle shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by SKU code, product, or pack size..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-input border border-border-subtle focus:border-brand-primary focus:outline-none"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-content-primary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterLowStockOnly}
                onChange={(e) => setFilterLowStockOnly(e.target.checked)}
                className="rounded text-brand-primary"
              />
              <span className="flex items-center gap-1 text-rose-600 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Show Low-Stock Only</span>
              </span>
            </label>
          </div>

          {/* Variants Table */}
          <div className="bg-white rounded-card border border-border-subtle shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-canvas-subtle text-content-muted uppercase font-bold border-b border-border-subtle">
                  <tr>
                    <th className="py-3 px-4">SKU Code</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Weight Pack</th>
                    <th className="py-3 px-4">Selling / MRP</th>
                    <th className="py-3 px-4">Current Stock</th>
                    <th className="py-3 px-4">Threshold</th>
                    <th className="py-3 px-4">Health Status</th>
                    <th className="py-3 px-4 text-right">Adjustment Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filteredVariants.map((variant) => {
                    const isLow = variant.stockQuantity <= variant.lowStockThreshold;

                    return (
                      <tr key={variant.id} className="hover:bg-canvas-subtle/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-content-primary">
                          {variant.sku}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-content-primary">
                          {variant.productName}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-content-secondary">
                          {variant.weightLabel}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-content-primary">₹{variant.sellingPrice}</span>
                          <span className="text-[10px] text-content-muted line-through ml-1.5">
                            ₹{variant.mrp}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`font-bold text-sm ${
                              isLow ? 'text-rose-600' : 'text-emerald-700'
                            }`}
                          >
                            {variant.stockQuantity} units
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-content-muted">
                          {variant.lowStockThreshold} units
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isLow
                                ? 'bg-rose-100 text-rose-800 flex items-center gap-1 w-fit'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isLow && <AlertTriangle className="w-3 h-3" />}
                            <span>{isLow ? 'Low Stock' : 'Optimal'}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => openAdjustmentModal(variant)}
                            className="px-3 py-1.5 rounded-btn bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover shadow-sm"
                          >
                            Adjust Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Movement Audit Trail View */
        <div className="bg-white rounded-card border border-border-subtle shadow-subtle overflow-hidden">
          <div className="p-4 border-b border-border-subtle flex items-center justify-between">
            <h2 className="font-serif font-bold text-sm text-content-primary">
              Immutable Stock Movement Log
            </h2>
            <p className="text-[11px] text-content-muted">
              Auto-recorded for purchase orders, customer purchases, cancellations, and physical audits.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas-subtle text-content-muted uppercase font-bold border-b border-border-subtle">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Product & Pack</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Quantity Delta</th>
                  <th className="py-3 px-4">Stock Progression</th>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {stockMovements.map((mov) => {
                  const isPositive = mov.delta > 0;

                  return (
                    <tr key={mov.id} className="hover:bg-canvas-subtle/50 transition-colors">
                      <td className="py-3 px-4 text-content-muted font-mono text-[11px]">
                        {new Date(mov.createdAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-bold text-content-primary">{mov.productName}</p>
                        <p className="text-[10px] text-content-muted">{mov.variantLabel}</p>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-canvas-subtle text-content-secondary">
                          {mov.reason}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`font-bold inline-flex items-center gap-0.5 text-xs ${
                            isPositive ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          <span>{isPositive ? `+${mov.delta}` : mov.delta}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-content-secondary">
                        <span className="text-content-muted">{mov.previousStock}</span>
                        <span className="mx-1">→</span>
                        <strong className="text-content-primary">{mov.newStock}</strong>
                      </td>

                      <td className="py-3 px-4 text-content-secondary">
                        {mov.actor}
                      </td>

                      <td className="py-3 px-4 text-content-muted text-[11px] max-w-xs truncate">
                        {mov.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && selectedVariant && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-card max-w-md w-full p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h2 className="font-serif text-lg font-bold text-content-primary">
                  Adjust Variant Stock
                </h2>
                <p className="text-xs text-content-muted">
                  {selectedVariant.productName} ({selectedVariant.weightLabel})
                </p>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1 text-content-muted hover:text-content-primary rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjustment} className="space-y-4 text-xs">
              <div className="p-3 bg-canvas-subtle rounded-card flex items-center justify-between">
                <span className="text-content-secondary font-semibold">Current Stock on Hand:</span>
                <span className="font-bold text-sm text-content-primary">{selectedVariant.currentStock} units</span>
              </div>

              {/* Adjustment Mode Selector */}
              <div>
                <label className="font-bold text-content-primary block mb-1.5">Adjustment Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('ADD')}
                    className={`py-2 text-xs font-bold rounded-btn flex items-center justify-center gap-1 border ${
                      adjustmentType === 'ADD'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-border-subtle bg-white text-content-primary hover:bg-canvas-subtle'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Stock</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustmentType('DEDUCT')}
                    className={`py-2 text-xs font-bold rounded-btn flex items-center justify-center gap-1 border ${
                      adjustmentType === 'DEDUCT'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'border-border-subtle bg-white text-content-primary hover:bg-canvas-subtle'
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>Deduct Stock</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustmentType('OVERRIDE')}
                    className={`py-2 text-xs font-bold rounded-btn flex items-center justify-center gap-1 border ${
                      adjustmentType === 'OVERRIDE'
                        ? 'bg-brand-secondary text-white border-brand-secondary'
                        : 'border-border-subtle bg-white text-content-primary hover:bg-canvas-subtle'
                    }`}
                  >
                    <span>Override Total</span>
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="font-bold text-content-primary block mb-1">
                  {adjustmentType === 'OVERRIDE' ? 'New Exact Stock Level *' : 'Quantity Units *'}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjustmentQty}
                  onChange={(e) => setAdjustmentQty(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs font-bold"
                />
              </div>

              {/* Reason */}
              {adjustmentType !== 'OVERRIDE' && (
                <div>
                  <label className="font-bold text-content-primary block mb-1">Reason for Stock Delta *</label>
                  <select
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value as StockMovementReason)}
                    className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs bg-white"
                  >
                    <option value="PURCHASE_ORDER">Purchase Order / Batch Arrival</option>
                    <option value="DAMAGE_WASTE">Damage, Waste or Spoilage</option>
                    <option value="PHYSICAL_AUDIT">Physical Audit Count Reconciliation</option>
                    <option value="MANUAL_ADJUSTMENT">Manual Administrative Correction</option>
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="font-bold text-content-primary block mb-1">Internal Reference Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Batch #KZD-2026-99 or Quality Inspection deduction"
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-btn border border-border-subtle text-xs font-semibold text-content-primary hover:bg-canvas-subtle"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-btn bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover shadow-sm"
                >
                  Confirm & Update Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

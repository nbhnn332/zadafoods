import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  Search,
  Filter,
  Truck,
  CreditCard,
  X,
  Printer,
  FileText,
  Lock
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Order, OrderStatus } from '../../types';

export const AdminOrders: React.FC = () => {
  const { orders, updateOrderStatus, updatePaymentStatus, settings } = useAdminData();
  const { hasPermission, isSuperAdmin } = useAuth();
  const { showToast } = useToast();
  const canManageOrders = isSuperAdmin || hasPermission('orders.manage');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPaymentMode, setFilterPaymentMode] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Order for Details & Update Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Selected Order for Printing Invoice / Bill
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  // Status update inputs
  const [newStatus, setNewStatus] = useState<OrderStatus>('PACKED');
  const [courierName, setCourierName] = useState('DTDC Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [statusNotes, setStatusNotes] = useState('');

  // Payment status updater
  const [newPaymentStatus, setNewPaymentStatus] = useState<Order['paymentStatus']>('PAID');
  const [paymentNotes, setPaymentNotes] = useState('');

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerPhone.includes(searchTerm) ||
      o.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'ALL' || o.fulfillmentStatus === filterStatus;
    const matchesPayment = filterPaymentMode === 'ALL' || o.paymentMode === filterPaymentMode;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const handleOpenDetails = (order: Order) => {
    setSelectedOrder(order);
    setNewPaymentStatus(order.paymentStatus);
    setCourierName(order.courierName || 'Delhivery');
    setTrackingNumber(order.trackingNumber || '');
    setTrackingUrl(order.trackingUrl || '');
    setStatusNotes('');

    // Suggest next natural fulfillment step
    if (order.fulfillmentStatus === 'CONFIRMED') setNewStatus('PACKED');
    else if (order.fulfillmentStatus === 'PACKED') setNewStatus('SHIPPED');
    else if (order.fulfillmentStatus === 'SHIPPED') setNewStatus('DELIVERED');
    else setNewStatus(order.fulfillmentStatus);
  };

  const handleSaveFulfillment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageOrders) {
      showToast('Permission Denied', 'Your administrator account lacks the "Order & Courier Management" (orders.manage) permission.', 'error');
      return;
    }
    if (!selectedOrder) return;

    const success = updateOrderStatus(
      selectedOrder.id,
      newStatus,
      newStatus === 'SHIPPED' || newStatus === 'DELIVERED' ? courierName : undefined,
      newStatus === 'SHIPPED' || newStatus === 'DELIVERED' ? trackingNumber : undefined,
      statusNotes,
      newStatus === 'SHIPPED' || newStatus === 'DELIVERED' ? trackingUrl : undefined
    );

    if (success) {
      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              fulfillmentStatus: newStatus,
              courierName: courierName || prev.courierName,
              trackingNumber: trackingNumber || prev.trackingNumber,
              trackingUrl: trackingUrl || prev.trackingUrl
            }
          : null
      );
    }
  };

  const handleSavePaymentStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageOrders) {
      showToast('Permission Denied', 'Your administrator account lacks the "Order & Courier Management" (orders.manage) permission.', 'error');
      return;
    }
    if (!selectedOrder) return;

    updatePaymentStatus(selectedOrder.id, newPaymentStatus, paymentNotes);
    setSelectedOrder((prev) => (prev ? { ...prev, paymentStatus: newPaymentStatus } : null));
  };

  return (
    <div className="space-y-6">
      {!canManageOrders && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Read-Only Mode:</strong> Your account does not have the <code>orders.manage</code> permission. You may view existing orders, but status updates and payment modifications are restricted.
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-serif text-content-primary">
            Order Fulfillment & Courier Dispatch
          </h1>
          <p className="text-xs text-content-muted mt-0.5">
            Manage dispatch pipelines, assign courier tracking numbers (AWB), and separate payment states from fulfillment.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {['ALL', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-btn text-xs font-bold transition-colors whitespace-nowrap ${
                filterStatus === st
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'bg-white border border-border-subtle text-content-secondary hover:bg-canvas-subtle'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Payment Filter Bar */}
      <div className="bg-white rounded-card p-3 border border-border-subtle shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order #, customer name, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-input border border-border-subtle focus:border-brand-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-content-muted" />
          <select
            value={filterPaymentMode}
            onChange={(e) => setFilterPaymentMode(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-input border border-border-subtle text-content-primary bg-white focus:outline-none"
          >
            <option value="ALL">All Payment Modes</option>
            <option value="RAZORPAY">Razorpay Prepaid</option>
            <option value="COD">Cash on Delivery</option>
            <option value="WHATSAPP_MANUAL">WhatsApp Order</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-card border border-border-subtle shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas-subtle text-content-muted uppercase font-bold border-b border-border-subtle">
              <tr>
                <th className="py-3 px-4">Order ID & Date</th>
                <th className="py-3 px-4">Customer & City</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4">Fulfillment Stage</th>
                <th className="py-3 px-4">Courier / AWB</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-content-muted">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  return (
                    <tr key={order.id} className="hover:bg-canvas-subtle/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-content-primary block text-sm">
                          {order.orderNumber}
                        </span>
                        <span className="text-[10px] text-content-muted">{order.createdAt}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-content-primary">{order.customerName}</p>
                        <p className="text-[11px] text-content-muted">
                          {order.shippingAddress.city}, {order.shippingAddress.state}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold block w-fit ${
                            order.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.paymentStatus === 'FAILED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                        <span className="text-[10px] text-content-muted font-mono mt-0.5 block">
                          {order.paymentMode}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            order.fulfillmentStatus === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.fulfillmentStatus === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-800'
                              : order.fulfillmentStatus === 'SHIPPED'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <span>{order.fulfillmentStatus}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {order.trackingNumber ? (
                          <div>
                            <span className="font-bold text-content-primary block">{order.courierName}</span>
                            <span className="text-content-secondary">{order.trackingNumber}</span>
                          </div>
                        ) : (
                          <span className="text-content-muted italic">Pending Dispatch</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-sm text-content-primary">
                          ₹{order.totalAmount}
                        </span>
                        <span className="text-[10px] text-content-muted block">
                          {order.items.length} items
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInvoiceOrder(order)}
                            className="px-2.5 py-1.5 rounded-btn border border-border-subtle bg-white text-content-primary hover:text-brand-primary text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
                            title={`Print Bill / Invoice for order ${order.orderNumber}`}
                          >
                            <Printer className="w-3.5 h-3.5 text-brand-primary" />
                            <span>Print Bill</span>
                          </button>
                          <Link
                            to={`/order-tracking/${order.id}`}
                            target="_blank"
                            className="p-1.5 rounded text-content-muted hover:text-brand-primary hover:bg-canvas-subtle"
                            title="Preview Customer Tracking Screen"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleOpenDetails(order)}
                            className="px-3 py-1.5 rounded-btn bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover shadow-sm"
                          >
                            Manage Order
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Order Management & Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-card max-w-3xl w-full p-6 shadow-elevated space-y-5 my-8 max-h-[90vh] overflow-y-auto text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-lg font-bold text-content-primary">
                    Order Details: {selectedOrder.orderNumber}
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedOrder.fulfillmentStatus === 'DELIVERED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedOrder.fulfillmentStatus === 'CANCELLED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedOrder.fulfillmentStatus}
                  </span>
                </div>
                <p className="text-xs text-content-muted">Placed on {selectedOrder.createdAt}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInvoiceOrder(selectedOrder)}
                  className="px-3 py-1.5 rounded-btn border border-border-subtle bg-white hover:bg-canvas-subtle text-content-primary text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                  title="Print Bill / Invoice"
                >
                  <Printer className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Print Bill</span>
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 text-content-muted hover:text-content-primary rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Customer & Shipping Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-canvas-subtle rounded-card">
              <div>
                <h3 className="font-bold text-content-primary mb-1 uppercase text-[10px] tracking-wider">
                  Customer Information
                </h3>
                <p className="font-semibold text-content-primary">{selectedOrder.customerName}</p>
                <p className="text-content-muted">{selectedOrder.customerEmail}</p>
                <p className="text-content-muted">{selectedOrder.customerPhone}</p>
              </div>

              <div>
                <h3 className="font-bold text-content-primary mb-1 uppercase text-[10px] tracking-wider">
                  Shipping Address ({selectedOrder.shippingAddress.tag})
                </h3>
                <p className="text-content-secondary leading-relaxed">
                  {selectedOrder.shippingAddress.streetAddress}
                  {selectedOrder.shippingAddress.landmark && `, near ${selectedOrder.shippingAddress.landmark}`}
                  <br />
                  {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} -{' '}
                  <span className="font-bold">{selectedOrder.shippingAddress.postalCode}</span>
                </p>
              </div>
            </div>

            {/* Order Items Table */}
            <div>
              <h3 className="font-bold text-content-primary mb-2 uppercase text-[10px] tracking-wider">
                Order Items ({selectedOrder.items.length})
              </h3>
              <div className="border border-border-subtle rounded-card overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-canvas-subtle text-content-muted font-bold border-b border-border-subtle">
                    <tr>
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5">Pack</th>
                      <th className="p-2.5">Unit Price</th>
                      <th className="p-2.5">Qty</th>
                      <th className="p-2.5 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td className="p-2.5 flex items-center gap-2">
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="w-8 h-8 rounded object-cover bg-canvas border border-border-subtle"
                          />
                          <span className="font-bold text-content-primary">{item.productName}</span>
                        </td>
                        <td className="p-2.5 text-content-secondary">{item.variantWeightLabel}</td>
                        <td className="p-2.5">₹{item.unitPrice}</td>
                        <td className="p-2.5 font-bold">{item.quantity}</td>
                        <td className="p-2.5 text-right font-bold text-content-primary">
                          ₹{item.lineTotal}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Tally */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1 text-xs">
                  <div className="flex justify-between text-content-muted">
                    <span>Subtotal:</span>
                    <span>₹{selectedOrder.subtotalAmount}</span>
                  </div>
                  {selectedOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Discount ({selectedOrder.couponCode || 'Promo'}):</span>
                      <span>-₹{selectedOrder.discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-content-muted">
                    <span>Shipping Fee:</span>
                    <span>₹{selectedOrder.shippingCharge}</span>
                  </div>
                  {selectedOrder.codFee && selectedOrder.codFee > 0 ? (
                    <div className="flex justify-between text-content-muted" data-testid="admin-cod-surcharge">
                      <span>COD Surcharge:</span>
                      <span>+₹{selectedOrder.codFee}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-sm font-bold text-content-primary border-t border-border-subtle pt-1">
                    <span>Total Amount:</span>
                    <span>₹{selectedOrder.totalAmount}</span>
                  </div>
                  {((selectedOrder.codAdvancePaid && selectedOrder.codAdvancePaid > 0) || (selectedOrder.codAdvanceAmount && selectedOrder.codAdvanceAmount > 0)) && (
                    <div className="pt-2 border-t border-dashed border-border-subtle space-y-1 bg-amber-50/50 p-2 rounded">
                      <div className="flex justify-between text-[11px] text-amber-900 font-semibold">
                        <span>COD Advance Required:</span>
                        <span>₹{selectedOrder.codAdvanceAmount || 0}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-emerald-800 font-semibold">
                        <span>Advance Paid ({selectedOrder.advancePaymentMethod || 'Razorpay'}):</span>
                        <span>₹{selectedOrder.codAdvancePaid || 0}</span>
                      </div>
                      {selectedOrder.advancePaymentReference && (
                        <div className="flex justify-between text-[10px] text-content-muted font-mono">
                          <span>Ref:</span>
                          <span className="truncate max-w-[140px]">{selectedOrder.advancePaymentReference}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs font-bold text-stone-900 pt-1 border-t border-amber-200">
                        <span>Collect at Delivery (COD):</span>
                        <span className="text-amber-800 font-mono font-bold">₹{selectedOrder.codRemainingAmount ?? (selectedOrder.totalAmount - (selectedOrder.codAdvancePaid || 0))}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status Update Forms (Fulfillment & Payment Separated) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-border-subtle">
              {/* Fulfillment Status Form */}
              <form onSubmit={handleSaveFulfillment} className="space-y-3 p-3 bg-canvas-subtle rounded-card">
                <h4 className="font-bold text-content-primary uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Update Fulfillment Stage</span>
                </h4>

                <div>
                  <label className="text-content-muted block mb-1">Target Stage</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                    className="w-full px-2.5 py-1.5 border border-border-subtle rounded text-xs bg-white font-bold"
                  >
                    <option value="CONFIRMED">CONFIRMED (Awaiting Packing)</option>
                    <option value="PACKED">PACKED (Ready for Pickup)</option>
                    <option value="SHIPPED">SHIPPED (In Transit with Courier)</option>
                    <option value="DELIVERED">DELIVERED (Successfully Handed Over)</option>
                    <option value="CANCELLED">CANCELLED (Restock Items)</option>
                  </select>
                </div>

                {(newStatus === 'SHIPPED' || newStatus === 'DELIVERED') && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-content-muted block mb-1">Courier Partner</label>
                      <select
                        value={courierName}
                        onChange={(e) => setCourierName(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-border-subtle rounded text-xs bg-white"
                      >
                        <option value="Delhivery">Delhivery</option>
                        <option value="DTDC Express">DTDC Express</option>
                        <option value="Blue Dart">Blue Dart</option>
                        <option value="Speed Post">India Post Speed Post</option>
                        <option value="Manual / Local">Local Hand Delivery</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-content-muted block mb-1">AWB / Tracking Number</label>
                      <input
                        type="text"
                        placeholder="e.g. DELH8923719"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-border-subtle rounded text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-content-muted block mb-1">Tracking URL (Optional)</label>
                      <input
                        type="text"
                        placeholder="https://delhivery.com/track/..."
                        value={trackingUrl}
                        onChange={(e) => setTrackingUrl(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-border-subtle rounded text-xs"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-content-muted block mb-1">Status Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Dispatched via Kozhikode Hub"
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-border-subtle rounded text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-brand-primary text-white font-bold rounded-btn text-xs hover:bg-brand-primary-hover shadow-sm"
                >
                  Save Fulfillment Status
                </button>
              </form>

              {/* Payment Status Form */}
              <form onSubmit={handleSavePaymentStatus} className="space-y-3 p-3 bg-canvas-subtle rounded-card">
                <h4 className="font-bold text-content-primary uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Update Payment Ledger</span>
                </h4>

                <div className="p-2 bg-white rounded border border-border-subtle">
                  <p className="text-[11px] text-content-muted">Payment Mode: <strong className="text-content-primary">{selectedOrder.paymentMode}</strong></p>
                  <p className="text-[11px] text-content-muted">Current Ledger State: <strong className="text-content-primary">{selectedOrder.paymentStatus}</strong></p>
                </div>

                <div>
                  <label className="text-content-muted block mb-1">Payment State</label>
                  <select
                    value={newPaymentStatus}
                    onChange={(e) => setNewPaymentStatus(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-border-subtle rounded text-xs bg-white font-bold"
                  >
                    <option value="PENDING">PENDING (Awaiting settlement / COD)</option>
                    <option value="ADVANCE_PAID">ADVANCE_PAID (COD Advance Settled, Balance on Delivery)</option>
                    <option value="PARTIALLY_PAID">PARTIALLY_PAID (Partial Payment Settled)</option>
                    <option value="PAID">PAID (Settled & Verified)</option>
                    <option value="FAILED">FAILED (Gateway rejection)</option>
                    <option value="REFUNDED">REFUNDED (Returned to customer)</option>
                  </select>
                </div>

                <div>
                  <label className="text-content-muted block mb-1">Payment Audit Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. Bank UTR or WhatsApp payment confirmation screenshot verified"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-border-subtle rounded text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-brand-secondary text-white font-bold rounded-btn text-xs hover:bg-black shadow-sm"
                >
                  Save Payment Status
                </button>
              </form>
            </div>

            {/* Timeline Audit History */}
            <div className="pt-3 border-t border-border-subtle">
              <h3 className="font-bold text-content-primary mb-2 uppercase text-[10px] tracking-wider">
                Fulfillment Timeline History
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedOrder.statusHistory.map((entry) => (
                  <div key={entry.id} className="p-2 bg-canvas-subtle rounded flex items-center justify-between text-[11px]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-content-primary">{entry.status}</span>
                        {entry.courierName && (
                          <span className="text-brand-primary font-mono text-[10px]">
                            ({entry.courierName} - {entry.trackingNumber})
                          </span>
                        )}
                      </div>
                      <p className="text-content-muted text-[10px]">{entry.notes}</p>
                    </div>
                    <span className="text-content-muted text-[10px]">{entry.createdAt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Tax Invoice Modal & Document Preview */}
      {invoiceOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-card max-w-3xl w-full p-6 shadow-elevated space-y-4 my-6 max-h-[95vh] overflow-y-auto text-xs">
            {/* On-Screen Action Bar (Hidden during actual window.print()) */}
            <div className="no-print flex items-center justify-between border-b border-border-subtle pb-3 bg-canvas-subtle -mx-6 -mt-6 p-4 rounded-t-card">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-primary" />
                <div>
                  <h3 className="font-bold text-sm text-content-primary">
                    Tax Invoice Preview: {invoiceOrder.orderNumber}
                  </h3>
                  <p className="text-[11px] text-content-muted">
                    Formatted for standard A4 printing. Navigation and admin controls will be excluded.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-btn bg-brand-primary text-white font-bold hover:bg-brand-primary-hover shadow-sm flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document (A4)</span>
                </button>
                <button
                  onClick={() => setInvoiceOrder(null)}
                  className="p-1.5 rounded-full hover:bg-white text-content-muted hover:text-content-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Authoritative Printable Document Content */}
            <div id="printable-invoice" className="bg-white text-black p-4 sm:p-8 space-y-6">
              {/* Invoice Header */}
              <div className="flex justify-between items-start border-b-2 border-stone-800 pb-5">
                <div className="flex items-start gap-4">
                  <img
                    src="/assets/brand-emblem.png"
                    alt="ZaDa Foods Logo"
                    className="w-16 h-16 object-contain mt-0.5 print:w-16 print:h-16"
                  />
                  <div>
                    <h1 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-950">
                      ZaDa Foods
                    </h1>
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                      Authentic Kerala Flavours, Rooted in Tradition
                    </p>
                    <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                      Manufactured by: <strong className="text-stone-900">ZADA FOODS</strong><br />
                      Punalur, Kollam (Dist), Kerala – 691305<br />
                      Central FSSAI Lic. No: <strong className="text-stone-900">{settings.fssaiNumber || '21326145000345'}</strong><br />
                      Help: {settings.supportPhone || '+91 8891537982'} / +91 75939 59235 | {settings.supportEmail || 'Zadafoods4@gmail.com'}
                    </p>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span className="inline-block px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider bg-stone-100 text-stone-900 border border-stone-300">
                    {invoiceOrder.paymentStatus === 'PAID' ? 'TAX INVOICE & RECEIPT' : 'TAX INVOICE / ORDER BILL'}
                  </span>
                  <p className="text-xs font-mono font-bold text-stone-900">
                    INV-{invoiceOrder.orderNumber}
                  </p>
                  <p className="text-[11px] text-stone-600">
                    Order Ref: #{invoiceOrder.orderNumber}
                  </p>
                  <p className="text-[11px] text-stone-600">
                    Date: {invoiceOrder.createdAt}
                  </p>
                </div>
              </div>

              {/* Customer & Billing Summary */}
              <div className="grid grid-cols-2 gap-6 text-[11px] border-b border-stone-200 pb-4">
                <div>
                  <p className="font-bold text-stone-900 uppercase text-[10px] tracking-wider mb-1">
                    Billed & Shipped To:
                  </p>
                  <p className="font-bold text-stone-900 text-xs">{invoiceOrder.customerName}</p>
                  <p className="text-stone-700">{invoiceOrder.customerPhone}</p>
                  <p className="text-stone-700">{invoiceOrder.customerEmail}</p>
                  <p className="text-stone-700 mt-1 leading-relaxed">
                    {invoiceOrder.shippingAddress.streetAddress}
                    {invoiceOrder.shippingAddress.landmark && `, near ${invoiceOrder.shippingAddress.landmark}`}
                    <br />
                    {invoiceOrder.shippingAddress.city}, {invoiceOrder.shippingAddress.state} - <strong>{invoiceOrder.shippingAddress.postalCode}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-stone-900 uppercase text-[10px] tracking-wider mb-1">
                    Payment & Fulfillment:
                  </p>
                  <p className="text-stone-800">
                    Method: <strong className="text-stone-900">{invoiceOrder.paymentMode}</strong>
                  </p>
                  <p className="text-stone-800">
                    Payment Status:{' '}
                    <span className={`font-bold ${invoiceOrder.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {invoiceOrder.paymentStatus}
                    </span>
                  </p>
                  <p className="text-stone-800">
                    Fulfillment Status: <strong>{invoiceOrder.fulfillmentStatus}</strong>
                  </p>
                  <p className="text-stone-800">
                    Delivery Speed: {invoiceOrder.deliveryMethod === 'EXPRESS' ? 'Express Air' : 'Standard Surface'}
                  </p>
                </div>
              </div>

              {/* Order Items Table */}
              <div>
                <table className="w-full text-left text-xs border border-stone-200">
                  <thead className="bg-stone-100 text-stone-800 font-bold border-b border-stone-200">
                    <tr>
                      <th className="p-2.5 w-10 text-center">#</th>
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5">Pack</th>
                      <th className="p-2.5 text-right">Price</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-stone-800">
                    {invoiceOrder.items.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="p-2.5 text-center text-stone-500">{idx + 1}</td>
                        <td className="p-2.5 font-semibold text-stone-900">{item.productName}</td>
                        <td className="p-2.5 text-stone-600">{item.variantWeightLabel}</td>
                        <td className="p-2.5 text-right font-mono">₹{item.unitPrice.toFixed(2)}</td>
                        <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                        <td className="p-2.5 text-right font-mono font-bold">₹{item.lineTotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Snapshot */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1.5 text-xs text-stone-800">
                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-600">Subtotal:</span>
                    <span className="font-mono font-semibold">₹{invoiceOrder.subtotalAmount.toFixed(2)}</span>
                  </div>
                  {invoiceOrder.discountAmount > 0 && (
                    <div className="flex justify-between py-1 border-b border-stone-100 text-emerald-800">
                      <span>Discount {invoiceOrder.couponCode ? `(${invoiceOrder.couponCode})` : ''}:</span>
                      <span className="font-mono font-semibold">-₹{invoiceOrder.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-600">Shipping Fee:</span>
                    <span className="font-mono font-semibold">
                      {invoiceOrder.shippingCharge === 0 ? 'FREE' : `₹${invoiceOrder.shippingCharge.toFixed(2)}`}
                    </span>
                  </div>
                  {invoiceOrder.codFee && invoiceOrder.codFee > 0 ? (
                    <div className="flex justify-between py-1 border-b border-stone-100">
                      <span className="text-stone-600">COD Surcharge:</span>
                      <span className="font-mono font-semibold">+₹{invoiceOrder.codFee.toFixed(2)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between py-2 border-t-2 border-stone-800 text-sm font-extrabold text-stone-900">
                    <span>Grand Total:</span>
                    <span className="font-mono">₹{invoiceOrder.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1 text-[11px]">
                    <span className="text-stone-600">Amount Paid:</span>
                    <span className="font-mono font-bold text-stone-900">
                      ₹{invoiceOrder.paymentStatus === 'PAID'
                        ? invoiceOrder.totalAmount.toFixed(2)
                        : (invoiceOrder.codAdvancePaid && invoiceOrder.codAdvancePaid > 0)
                        ? `${invoiceOrder.codAdvancePaid.toFixed(2)} (Advance)`
                        : '0.00'}
                    </span>
                  </div>
                  {invoiceOrder.paymentStatus !== 'PAID' && (
                    <div className="flex justify-between text-[11px] text-amber-800 font-bold">
                      <span>{invoiceOrder.codAdvancePaid && invoiceOrder.codAdvancePaid > 0 ? 'Balance to Collect on Delivery (COD):' : 'Balance Due:'}</span>
                      <span className="font-mono">
                        ₹{(invoiceOrder.codRemainingAmount !== undefined
                          ? invoiceOrder.codRemainingAmount
                          : (invoiceOrder.totalAmount - (invoiceOrder.codAdvancePaid || 0))).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Legal Notice & Verification */}
              <div className="pt-6 border-t border-stone-200 text-[10px] text-stone-500 leading-relaxed flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <p className="font-bold text-stone-700 uppercase tracking-wider mb-0.5">Terms & Quality Assurance</p>
                  <p>
                    All ZaDa Foods delicacies are freshly prepared and nitrogen-sealed without artificial preservatives.<br />
                    Report damaged packages within 48 hours to care@zadafoods.com with photographic proof for instant replacement.
                  </p>
                </div>
                <div className="text-right sm:self-end">
                  <p className="font-bold text-stone-800 uppercase">Authorised Signatory</p>
                  <p className="italic text-stone-600">ZaDa Foods Operations Console</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

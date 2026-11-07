import React, { useState } from 'react';
import { Download, TrendingUp, Filter } from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';

export const AdminReports: React.FC = () => {
  const { orders } = useAdminData();
  const [dateRange, setDateRange] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Filter orders by date range
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = startOfToday - 30 * 24 * 60 * 60 * 1000;

  const filteredOrders = orders.filter((o) => {
    const orderTime = new Date(o.createdAt).getTime();

    let matchesDate = true;
    if (dateRange === 'TODAY') matchesDate = orderTime >= startOfToday;
    else if (dateRange === 'WEEK') matchesDate = orderTime >= sevenDaysAgo;
    else if (dateRange === 'MONTH') matchesDate = orderTime >= thirtyDaysAgo;

    const matchesStatus = statusFilter === 'ALL' || o.fulfillmentStatus === statusFilter;

    return matchesDate && matchesStatus;
  });

  // Financial aggregates
  const totalGrossSales = filteredOrders.reduce((sum, o) => sum + o.subtotalAmount, 0);
  const totalDiscounts = filteredOrders.reduce((sum, o) => sum + o.discountAmount, 0);
  const totalShipping = filteredOrders.reduce((sum, o) => sum + o.shippingCharge, 0);
  const totalNetRevenue = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // CSV Export Engine
  const exportToCSV = () => {
    const headers = [
      'Order Number',
      'Date',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'City',
      'State',
      'Postal Code',
      'Payment Mode',
      'Payment Status',
      'Fulfillment Status',
      'Courier',
      'Tracking Number',
      'Items Count',
      'Subtotal',
      'Discount',
      'Shipping Charge',
      'Total Amount'
    ];

    const rows = filteredOrders.map((o) => [
      `"${o.orderNumber}"`,
      `"${o.createdAt}"`,
      `"${o.customerName}"`,
      `"${o.customerEmail}"`,
      `"${o.customerPhone}"`,
      `"${o.shippingAddress.city}"`,
      `"${o.shippingAddress.state}"`,
      `"${o.shippingAddress.postalCode}"`,
      `"${o.paymentMode}"`,
      `"${o.paymentStatus}"`,
      `"${o.fulfillmentStatus}"`,
      `"${o.courierName || ''}"`,
      `"${o.trackingNumber || ''}"`,
      o.items.length,
      o.subtotalAmount,
      o.discountAmount,
      o.shippingCharge,
      o.totalAmount
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ZaDa_Foods_Orders_${dateRange}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-serif text-content-primary">
            Sales, Tax & Operations Reports
          </h1>
          <p className="text-xs text-content-muted mt-0.5">
            Audit revenue, discount deductions, shipping fees, and export data in clean CSV format.
          </p>
        </div>

        <button
          onClick={exportToCSV}
          className="px-4 py-2 rounded-btn bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover shadow-sm flex items-center gap-2 self-start"
        >
          <Download className="w-4 h-4" />
          <span>Export Filtered CSV ({filteredOrders.length} records)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-card p-3.5 border border-border-subtle shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto">
          {(['ALL', 'TODAY', 'WEEK', 'MONTH'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 rounded-pill text-xs font-bold transition-colors ${
                dateRange === r
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'bg-canvas-subtle text-content-secondary hover:text-content-primary'
              }`}
            >
              {r === 'ALL' ? 'All Time' : r === 'TODAY' ? 'Today' : r === 'WEEK' ? 'Last 7 Days' : 'Last 30 Days'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-content-muted" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-input border border-border-subtle text-content-primary bg-white focus:outline-none"
          >
            <option value="ALL">All Fulfillment Statuses</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PACKED">PACKED</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-card p-4 border border-border-subtle shadow-subtle">
          <p className="text-xs font-semibold text-content-muted">Total Gross Product Sales</p>
          <p className="text-xl font-bold text-content-primary mt-1">₹{totalGrossSales.toLocaleString()}</p>
          <p className="text-[10px] text-content-muted mt-0.5">Before discount deductions</p>
        </div>

        <div className="bg-white rounded-card p-4 border border-border-subtle shadow-subtle">
          <p className="text-xs font-semibold text-content-muted">Discount Deductions</p>
          <p className="text-xl font-bold text-rose-600 mt-1">-₹{totalDiscounts.toLocaleString()}</p>
          <p className="text-[10px] text-content-muted mt-0.5">Coupons & first-order incentives</p>
        </div>

        <div className="bg-white rounded-card p-4 border border-border-subtle shadow-subtle">
          <p className="text-xs font-semibold text-content-muted">Shipping Charges Collected</p>
          <p className="text-xl font-bold text-content-primary mt-1">₹{totalShipping.toLocaleString()}</p>
          <p className="text-[10px] text-content-muted mt-0.5">Standard & express logistics fees</p>
        </div>

        <div className="bg-white rounded-card p-4 border border-border-subtle shadow-subtle">
          <p className="text-xs font-semibold text-content-muted">Net Collected Revenue</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">₹{totalNetRevenue.toLocaleString()}</p>
          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Final realized value</span>
          </p>
        </div>
      </div>

      {/* Filtered Orders Table Preview */}
      <div className="bg-white rounded-card border border-border-subtle shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-border-subtle flex items-center justify-between">
          <h2 className="font-serif font-bold text-sm text-content-primary">
            Export Preview Table ({filteredOrders.length} orders)
          </h2>
          <span className="text-xs text-content-muted">Sorted chronologically</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas-subtle text-content-muted uppercase font-bold border-b border-border-subtle">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Fulfillment</th>
                <th className="py-3 px-4 text-right">Net Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredOrders.map((o) => (
                <tr key={o.id} className="hover:bg-canvas-subtle/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-content-primary">
                    {o.orderNumber}
                  </td>
                  <td className="py-3 px-4 text-content-muted">{o.createdAt}</td>
                  <td className="py-3 px-4 font-semibold text-content-primary">{o.customerName}</td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[11px] text-content-secondary">{o.paymentMode}</span>
                    <span className="text-content-muted ml-1">({o.paymentStatus})</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-canvas-subtle">
                      {o.fulfillmentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-content-primary">
                    ₹{o.totalAmount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Truck,
  Plus
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';

export const AdminDashboard: React.FC = () => {
  const { orders, products, adjustVariantStock } = useAdminData();
  const [quickRestockVariantId, setQuickRestockVariantId] = useState<string | null>(null);
  const [quickRestockQty, setQuickRestockQty] = useState<number>(20);

  // Time-based calculations
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = startOfToday - 30 * 24 * 60 * 60 * 1000;

  // Revenue metrics
  const paidOrders = orders.filter((o) => o.paymentStatus === 'PAID');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const todayRevenue = paidOrders
    .filter((o) => new Date(o.createdAt).getTime() >= startOfToday)
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const weekRevenue = paidOrders
    .filter((o) => new Date(o.createdAt).getTime() >= sevenDaysAgo)
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const monthRevenue = paidOrders
    .filter((o) => new Date(o.createdAt).getTime() >= thirtyDaysAgo)
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const averageOrderValue = paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;

  // Fulfillment metrics
  const pendingFulfillment = orders.filter(
    (o) => o.fulfillmentStatus === 'CONFIRMED' || o.fulfillmentStatus === 'PACKED'
  ).length;

  const shippedOrders = orders.filter((o) => o.fulfillmentStatus === 'SHIPPED').length;
  const deliveredOrders = orders.filter((o) => o.fulfillmentStatus === 'DELIVERED').length;

  // Low stock SKUs
  const lowStockVariants = products.flatMap((p) =>
    p.variants
      .filter((v) => v.stockQuantity <= v.lowStockThreshold)
      .map((v) => ({ ...v, productName: p.name, categorySlug: p.categorySlug }))
  );

  // 7-day revenue trend dataset
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    const dayTotal = paidOrders
      .filter((o) => {
        const orderTime = new Date(o.createdAt).getTime();
        return orderTime >= dayStart && orderTime < dayEnd;
      })
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return { label: dayStr, total: dayTotal };
  });

  const maxDailyRevenue = Math.max(...last7Days.map((d) => d.total), 500);

  const handleQuickRestock = (variantId: string) => {
    adjustVariantStock(
      variantId,
      quickRestockQty,
      'PURCHASE_ORDER',
      `Quick restock batch from dashboard (+${quickRestockQty} units)`
    );
    setQuickRestockVariantId(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-serif text-content-primary">
            Operations & Analytics Dashboard
          </h1>
          <p className="text-xs text-content-muted mt-0.5">
            Real-time fulfillment, revenue trends, inventory alerts, and quick actions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/reports"
            className="px-3 py-1.5 rounded-btn border border-border-subtle bg-white text-content-primary text-xs font-semibold hover:bg-canvas-subtle"
          >
            Export CSV
          </Link>
          <Link
            to="/admin/orders"
            className="px-3 py-1.5 rounded-btn bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover shadow-sm flex items-center gap-1"
          >
            <span>Fulfill Orders ({pendingFulfillment})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Revenue & Period KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white rounded-card p-4 border border-border-subtle shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-content-muted">Total Gross Revenue</p>
            <p className="text-xl font-bold text-content-primary mt-1">₹{totalRevenue.toLocaleString()}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-content-secondary">
              <span>Today: <strong className="text-emerald-700">₹{todayRevenue}</strong></span>
              <span>•</span>
              <span>Week: <strong>₹{weekRevenue}</strong></span>
              <span>•</span>
              <span>Month: <strong>₹{monthRevenue}</strong></span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Orders Count & AOV */}
        <div className="bg-white rounded-card p-4 border border-border-subtle shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-content-muted">Total Orders Placed</p>
            <p className="text-xl font-bold text-content-primary mt-1">{orders.length}</p>
            <p className="text-[11px] text-content-secondary mt-1">
              Avg. Order Value (AOV): <strong className="text-content-primary">₹{averageOrderValue}</strong>
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Fulfillment */}
        <div className="bg-white rounded-card p-4 border border-border-subtle shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-content-muted">Pending Fulfillment</p>
            <p className="text-xl font-bold text-amber-700 mt-1">{pendingFulfillment}</p>
            <p className="text-[11px] text-content-muted mt-1">
              {shippedOrders} in transit • {deliveredOrders} delivered
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Low Stock SKU Alert */}
        <div className="bg-white rounded-card p-4 border border-border-subtle shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-content-muted">Low Stock SKUs</p>
            <p className="text-xl font-bold text-rose-600 mt-1">{lowStockVariants.length}</p>
            <p className="text-[11px] text-rose-500 font-medium mt-1">
              {lowStockVariants.length > 0 ? 'Urgent replenishment required' : 'All SKUs healthy'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid: 7-Day Revenue Trend & Fulfillment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-card p-5 border border-border-subtle shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-content-primary flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-brand-primary" />
                <span>Daily Revenue (Last 7 Days)</span>
              </h2>
              <p className="text-[11px] text-content-muted">Aggregated paid orders</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-pill">
              ₹{weekRevenue} this week
            </span>
          </div>

          <div className="h-44 flex items-end gap-3 pt-4 border-b border-border-subtle/60 pb-2">
            {last7Days.map((day, idx) => {
              const heightPercent = Math.max(8, Math.round((day.total / maxDailyRevenue) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[10px] font-bold text-content-primary">
                    {day.total > 0 ? `₹${day.total}` : '₹0'}
                  </span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[42px] rounded-t-md transition-all ${
                      day.total > 0
                        ? 'bg-gradient-to-t from-brand-secondary to-brand-primary'
                        : 'bg-canvas-subtle'
                    }`}
                  />
                  <span className="text-[10px] text-content-muted truncate max-w-full">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fulfillment Status Breakdown */}
        <div className="bg-white rounded-card p-5 border border-border-subtle shadow-subtle space-y-4">
          <div>
            <h2 className="text-sm font-bold text-content-primary flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-brand-primary" />
              <span>Fulfillment Pipeline</span>
            </h2>
            <p className="text-[11px] text-content-muted">Current order dispatch health</p>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-amber-700">Confirmed / Awaiting Packing</span>
                <span className="font-bold">{orders.filter((o) => o.fulfillmentStatus === 'CONFIRMED').length}</span>
              </div>
              <div className="w-full h-2 bg-canvas-subtle rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{
                    width: `${orders.length ? (orders.filter((o) => o.fulfillmentStatus === 'CONFIRMED').length / orders.length) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-blue-700">Packed / Ready for Dispatch</span>
                <span className="font-bold">{orders.filter((o) => o.fulfillmentStatus === 'PACKED').length}</span>
              </div>
              <div className="w-full h-2 bg-canvas-subtle rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{
                    width: `${orders.length ? (orders.filter((o) => o.fulfillmentStatus === 'PACKED').length / orders.length) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-purple-700">Shipped with AWB</span>
                <span className="font-bold">{shippedOrders}</span>
              </div>
              <div className="w-full h-2 bg-canvas-subtle rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{
                    width: `${orders.length ? (shippedOrders / orders.length) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-700">Delivered</span>
                <span className="font-bold">{deliveredOrders}</span>
              </div>
              <div className="w-full h-2 bg-canvas-subtle rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${orders.length ? (deliveredOrders / orders.length) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Section: Low Stock SKU Alerts & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Replenishment Action Card */}
        <div className="bg-white rounded-card p-5 border border-border-subtle shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-content-primary flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Low-Stock Inventory Alerts ({lowStockVariants.length})</span>
            </h2>
            <Link
              to="/admin/inventory"
              className="text-xs text-brand-primary font-bold hover:underline"
            >
              Full Inventory →
            </Link>
          </div>

          {lowStockVariants.length === 0 ? (
            <div className="p-6 text-center text-xs text-content-muted bg-canvas-subtle rounded-card flex flex-col items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <span>All product variants are above safety threshold levels.</span>
            </div>
          ) : (
            <div className="divide-y divide-border-subtle/60 max-h-64 overflow-y-auto">
              {lowStockVariants.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-content-primary">{item.productName}</p>
                    <p className="text-[11px] text-content-muted">
                      Pack: <span className="font-semibold text-content-secondary">{item.weightLabel}</span> • SKU: {item.sku}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px]">
                      {item.stockQuantity} in stock (Min: {item.lowStockThreshold})
                    </span>

                    {quickRestockVariantId === item.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={quickRestockQty}
                          onChange={(e) => setQuickRestockQty(Number(e.target.value))}
                          className="w-14 px-1.5 py-0.5 text-xs border border-border-subtle rounded text-center"
                          min="1"
                        />
                        <button
                          onClick={() => handleQuickRestock(item.id)}
                          className="px-2 py-0.5 bg-emerald-600 text-white font-bold rounded text-[11px]"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setQuickRestockVariantId(null)}
                          className="px-1.5 py-0.5 text-content-muted text-[11px]"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setQuickRestockVariantId(item.id);
                          setQuickRestockQty(25);
                        }}
                        className="px-2 py-1 rounded bg-canvas-subtle hover:bg-canvas-subtle/80 text-[11px] font-semibold text-content-primary flex items-center gap-1 border border-border-subtle"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Restock</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders Overview */}
        <div className="bg-white rounded-card p-5 border border-border-subtle shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-content-primary flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-brand-primary" />
              <span>Recent Orders</span>
            </h2>
            <Link
              to="/admin/orders"
              className="text-xs text-brand-primary font-bold hover:underline"
            >
              View All ({orders.length}) →
            </Link>
          </div>

          <div className="divide-y divide-border-subtle/60 max-h-64 overflow-y-auto">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-content-primary">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        order.fulfillmentStatus === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : order.fulfillmentStatus === 'CANCELLED'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {order.fulfillmentStatus}
                    </span>
                  </div>
                  <p className="text-[11px] text-content-muted mt-0.5">
                    {order.customerName} • {order.items.length} items • {order.paymentMode}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-content-primary">₹{order.totalAmount}</p>
                  <p className="text-[10px] text-content-muted">{order.createdAt.split(',')[0]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

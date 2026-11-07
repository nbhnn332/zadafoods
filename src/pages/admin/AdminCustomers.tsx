import React, { useState } from 'react';
import { Search, ShoppingBag, MapPin, X } from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import { CustomerDirectoryEntry } from '../../types';
import { Link } from 'react-router-dom';

export const AdminCustomers: React.FC = () => {
  const { customers, orders } = useAdminData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDirectoryEntry | null>(null);

  const filteredCustomers = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  const customerOrders = selectedCustomer
    ? orders.filter(
        (o) =>
          o.customerEmail.toLowerCase().trim() === selectedCustomer.email.toLowerCase().trim() ||
          o.userId === selectedCustomer.id
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-serif text-content-primary">
            Customer Directory & Accounts
          </h1>
          <p className="text-xs text-content-muted mt-0.5">
            Registered customer accounts, lifetime order frequencies, delivery addresses, and purchase histories.
          </p>
        </div>
        <div className="text-xs font-semibold text-content-secondary bg-white px-3 py-1.5 rounded-pill border border-border-subtle shadow-sm">
          Total Customers: <strong className="text-brand-primary">{customers.length}</strong>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-card p-3 border border-border-subtle shadow-subtle flex items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, email address, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-input border border-border-subtle focus:border-brand-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-card border border-border-subtle shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas-subtle text-content-muted uppercase font-bold border-b border-border-subtle">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Total Orders</th>
                <th className="py-3 px-4">Lifetime Spend</th>
                <th className="py-3 px-4">Last Order</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-content-muted">
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-canvas-subtle/50 transition-colors">
                    <td className="py-3.5 px-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-secondary text-white font-bold flex items-center justify-center shrink-0 text-xs">
                        {cust.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-content-primary">{cust.fullName}</p>
                        <p className="text-[11px] text-content-muted">ID: {cust.id.slice(0, 10)}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="text-content-primary">{cust.email}</p>
                      <p className="text-content-muted text-[11px]">{cust.phone}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-content-primary px-2 py-0.5 rounded bg-canvas-subtle border border-border-subtle">
                        {cust.totalOrders} {cust.totalOrders === 1 ? 'order' : 'orders'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-emerald-700 text-sm">
                        ₹{cust.totalSpend.toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-content-muted text-[11px]">
                      {cust.lastOrderDate}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedCustomer(cust)}
                        className="px-3 py-1.5 rounded-btn bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover shadow-sm"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Profile & Past Orders Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-card max-w-2xl w-full p-6 shadow-elevated space-y-4 max-h-[85vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-secondary text-white font-bold flex items-center justify-center text-sm">
                  {selectedCustomer.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-content-primary">
                    {selectedCustomer.fullName}
                  </h2>
                  <p className="text-xs text-content-muted">{selectedCustomer.email} • {selectedCustomer.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 text-content-muted hover:text-content-primary rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-canvas-subtle rounded-card text-center">
              <div>
                <p className="text-[10px] uppercase font-bold text-content-muted">Total Lifetime Purchases</p>
                <p className="text-xl font-bold text-emerald-700 mt-0.5">
                  ₹{selectedCustomer.totalSpend.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-content-muted">Completed Orders</p>
                <p className="text-xl font-bold text-content-primary mt-0.5">
                  {selectedCustomer.totalOrders}
                </p>
              </div>
            </div>

            {/* Address Book */}
            <div>
              <h3 className="font-bold text-content-primary uppercase text-[10px] tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                <span>Saved Addresses</span>
              </h3>
              <div className="space-y-2">
                {selectedCustomer.addresses.map((addr, idx) => (
                  <div key={idx} className="p-2.5 border border-border-subtle rounded-card text-xs">
                    <div className="flex items-center justify-between font-bold text-content-primary mb-1">
                      <span>{addr.recipientName} ({addr.tag})</span>
                      <span className="text-[10px] text-content-muted">{addr.phone}</span>
                    </div>
                    <p className="text-content-secondary leading-relaxed">
                      {addr.streetAddress}{addr.landmark ? `, near ${addr.landmark}` : ''}<br />
                      {addr.city}, {addr.state} - {addr.postalCode}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Past Orders History */}
            <div>
              <h3 className="font-bold text-content-primary uppercase text-[10px] tracking-wider mb-2 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-brand-primary" />
                <span>Customer Order History ({customerOrders.length})</span>
              </h3>
              <div className="border border-border-subtle rounded-card divide-y divide-border-subtle overflow-hidden">
                {customerOrders.length === 0 ? (
                  <p className="p-4 text-center text-content-muted">No orders on record.</p>
                ) : (
                  customerOrders.map((ord) => (
                    <div key={ord.id} className="p-3 flex items-center justify-between hover:bg-canvas-subtle/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-content-primary">{ord.orderNumber}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              ord.fulfillmentStatus === 'DELIVERED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-800'
                            }`}
                          >
                            {ord.fulfillmentStatus}
                          </span>
                        </div>
                        <p className="text-[11px] text-content-muted mt-0.5">
                          {ord.items.length} items • Placed on {ord.createdAt}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-content-primary block">₹{ord.totalAmount}</span>
                        <Link
                          to={`/order-tracking/${ord.id}`}
                          target="_blank"
                          className="text-[10px] text-brand-primary hover:underline font-semibold"
                        >
                          View Tracking →
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

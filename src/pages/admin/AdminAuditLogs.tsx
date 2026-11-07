import React, { useState } from 'react';
import { History, ShieldCheck, Search, Filter, Lock } from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import { useAuth } from '../../context/AuthContext';

export const AdminAuditLogs: React.FC = () => {
  const { auditLogs } = useAdminData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.targetEntity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.adminUser.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = filterAction === 'ALL' || log.targetEntity === filterAction;

    return matchesSearch && matchesAction;
  });

  const roles = [
    {
      role: 'Super Admin',
      description: 'Unrestricted full access across database, payments, inventory overrides, settings, and staff credentials.',
      assignedEmails: ['admin@zadafoods.com', 'superadmin@zadafoods.com']
    },
    {
      role: 'Operations & Inventory Manager',
      description: 'Manage SKU catalogs, variant pricing, supplier purchase orders, and stock adjustments.',
      assignedEmails: ['inventory@zadafoods.com']
    },
    {
      role: 'Fulfillment & Support Specialist',
      description: 'Manage customer orders, courier dispatch tracking numbers, reviews, and bulk enquiry leads.',
      assignedEmails: ['support@zadafoods.com']
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-serif text-content-primary">
            Security, Roles & Audit Trail
          </h1>
          <p className="text-xs text-content-muted mt-0.5">
            Cryptographic action logs, administrative privilege boundaries, and access audit records.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-pill text-xs font-bold border border-emerald-200">
          <ShieldCheck className="w-4 h-4" />
          <span>Active Operator: {user?.email || 'admin@zadafoods.com'}</span>
        </div>
      </div>

      {/* Role Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map((r, idx) => (
          <div
            key={idx}
            className="bg-white rounded-card p-4 border border-border-subtle shadow-subtle space-y-2"
          >
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-brand-primary" />
              <h3 className="font-bold text-xs text-content-primary uppercase tracking-wider">{r.role}</h3>
            </div>
            <p className="text-xs text-content-muted leading-relaxed">{r.description}</p>
            <div className="pt-2 border-t border-border-subtle">
              <p className="text-[10px] text-content-secondary font-mono">
                Assigned: {r.assignedEmails.join(', ')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Action Filters */}
      <div className="bg-white rounded-card p-3 border border-border-subtle shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit trail by action, entity, user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-input border border-border-subtle focus:border-brand-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-content-muted" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-input border border-border-subtle text-content-primary bg-white focus:outline-none"
          >
            <option value="ALL">All Entity Target Types</option>
            <option value="PRODUCT">PRODUCT</option>
            <option value="INVENTORY">INVENTORY</option>
            <option value="ORDER">ORDER</option>
            <option value="COUPON">COUPON</option>
            <option value="COMBO">COMBO</option>
            <option value="HOMEPAGE_CMS">HOMEPAGE_CMS</option>
            <option value="REVIEW">REVIEW</option>
            <option value="STORE_SETTINGS">STORE_SETTINGS</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-card border border-border-subtle shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-border-subtle flex items-center justify-between">
          <h2 className="font-serif font-bold text-sm text-content-primary flex items-center gap-2">
            <History className="w-4 h-4 text-brand-primary" />
            <span>Immutable Administrative Audit Records ({filteredLogs.length})</span>
          </h2>
          <span className="text-[11px] text-content-muted font-mono">Enforced by backend service</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas-subtle text-content-muted uppercase font-bold border-b border-border-subtle">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity Target</th>
                <th className="py-3 px-4">Action Payload Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-content-muted">
                    No audit records match the selected query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-canvas-subtle/50 transition-colors">
                    <td className="py-3 px-4 text-content-muted font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>

                    <td className="py-3 px-4 font-semibold text-content-primary">
                      {log.adminUser}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-brand-primary border border-amber-200">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-canvas-subtle text-content-secondary">
                        {log.targetEntity}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-content-secondary leading-relaxed">
                      {log.details}
                      {log.targetId && (
                        <span className="block text-[10px] font-mono text-content-muted mt-0.5">
                          ID: {log.targetId}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Phone, Mail, MessageSquare, Calendar, Search, Check, Edit2 } from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import { BulkEnquiry } from '../../types';

export const AdminEnquiries: React.FC = () => {
  const { enquiries, updateEnquiryStatus, updateEnquiryNotes } = useAdminData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Notes editing state
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');

  const filteredEnquiries = enquiries.filter((enq) => {
    const matchesSearch =
      enq.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (enq.organizationName && enq.organizationName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      enq.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enq.phone.includes(searchTerm);

    const matchesStatus = filterStatus === 'ALL' || enq.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getWhatsAppLink = (enq: BulkEnquiry) => {
    const cleanPhone = enq.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const text = `Hello ${enq.fullName}, thank you for reaching out to ZaDa Foods regarding your ${enq.eventType} enquiry (${enq.estimatedQuantity} units). How may our corporate gifting team assist you?`;
    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
  };

  const handleSaveNotes = (id: string) => {
    updateEnquiryNotes(id, tempNotes);
    setEditingNotesId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-serif text-content-primary">
            Corporate & Bulk Gifting Enquiries
          </h1>
          <p className="text-xs text-content-muted mt-0.5">
            Manage wedding hamper orders, corporate festive packages, wholesale volume leads, and follow-up pipelines.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {['ALL', 'NEW', 'CONTACTED', 'QUOTE_SENT', 'WON', 'CLOSED'].map((st) => (
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

      {/* Search Bar */}
      <div className="bg-white rounded-card p-3 border border-border-subtle shadow-subtle flex items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search enquiries by name, company, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-input border border-border-subtle focus:border-brand-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="bg-white rounded-card border border-border-subtle shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas-subtle text-content-muted uppercase font-bold border-b border-border-subtle">
              <tr>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Organization & Event</th>
                <th className="py-3 px-4">Estimated Qty</th>
                <th className="py-3 px-4">Requirements & Message</th>
                <th className="py-3 px-4">Internal Admin Notes</th>
                <th className="py-3 px-4">Pipeline Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredEnquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-content-muted">
                    No bulk enquiries match the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEnquiries.map((enq) => (
                  <tr key={enq.id} className="hover:bg-canvas-subtle/50 transition-colors">
                    <td className="py-3.5 px-4 space-y-0.5">
                      <p className="font-bold text-content-primary">{enq.fullName}</p>
                      <p className="text-[11px] text-content-muted flex items-center gap-1">
                        <Phone className="w-3 h-3 text-content-muted" />
                        <span>{enq.phone}</span>
                      </p>
                      <p className="text-[11px] text-content-muted flex items-center gap-1">
                        <Mail className="w-3 h-3 text-content-muted" />
                        <span>{enq.email}</span>
                      </p>
                    </td>

                    <td className="py-3.5 px-4 space-y-0.5">
                      <p className="font-bold text-content-primary">
                        {enq.organizationName || 'Private Client'}
                      </p>
                      <span className="inline-block px-1.5 py-0.5 rounded bg-canvas-subtle text-[10px] font-semibold text-content-secondary">
                        {enq.eventType}
                      </span>
                      {enq.requiredDate && (
                        <p className="text-[10px] text-content-muted flex items-center gap-1 mt-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>Needed by: {enq.requiredDate}</span>
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-sm text-content-primary">
                        {enq.estimatedQuantity}
                      </span>{' '}
                      <span className="text-[10px] text-content-muted">units</span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs text-content-secondary leading-relaxed">
                      {enq.message}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      {editingNotesId === enq.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={tempNotes}
                            onChange={(e) => setTempNotes(e.target.value)}
                            className="px-2 py-1 text-xs border border-border-subtle rounded w-full"
                            placeholder="Add notes..."
                          />
                          <button
                            onClick={() => handleSaveNotes(enq.id)}
                            className="p-1 bg-brand-primary text-white rounded text-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setEditingNotesId(enq.id);
                            setTempNotes(enq.adminNotes || '');
                          }}
                          className="cursor-pointer group flex items-center gap-1 text-[11px] text-content-muted hover:text-content-primary"
                        >
                          <span className="truncate">{enq.adminNotes || 'Click to add follow-up notes...'}</span>
                          <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 shrink-0" />
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={enq.status}
                        onChange={(e) => updateEnquiryStatus(enq.id, e.target.value as any)}
                        className={`text-xs px-2 py-1 rounded border font-semibold bg-white ${
                          enq.status === 'WON'
                            ? 'border-emerald-300 text-emerald-800'
                            : enq.status === 'QUOTE_SENT'
                            ? 'border-blue-300 text-blue-800'
                            : enq.status === 'CONTACTED'
                            ? 'border-amber-300 text-amber-800'
                            : 'border-border-subtle text-content-primary'
                        }`}
                      >
                        <option value="NEW">NEW</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="QUOTE_SENT">QUOTE SENT</option>
                        <option value="WON">WON</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <a
                        href={getWhatsAppLink(enq)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
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

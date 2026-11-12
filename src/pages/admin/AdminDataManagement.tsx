import React, { useState } from 'react';
import {
  ShieldAlert,
  Trash2,
  Lock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Search,
  KeyRound,
  Download,
  Eye,
  X,
  ShieldCheck,
  Filter
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SupabaseDataService } from '../../lib/commerce/supabaseDataService';
import { supabase } from '../../lib/supabase';
import { CleanupCategory, CleanupCategorySummary } from '../../types';

interface CategoryOption {
  id: CleanupCategory;
  name: string;
  group: 'Orders' | 'Operations' | 'Marketing' | 'System';
  description: string;
  dangerLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

const CLEANUP_OPTIONS: CategoryOption[] = [
  {
    id: 'ORDERS_CANCELLED',
    name: 'Cancelled & Failed Orders',
    group: 'Orders',
    description: 'Orders with payment_status=FAILED or fulfillment_status=CANCELLED. Safely cascades to order_items.',
    dangerLevel: 'LOW'
  },
  {
    id: 'ORDERS_PENDING',
    name: 'Pending & Processing Orders',
    group: 'Orders',
    description: 'Unfulfilled test orders. Cascades to associated items and status logs.',
    dangerLevel: 'MEDIUM'
  },
  {
    id: 'ORDERS_COMPLETED',
    name: 'Delivered / Completed Orders',
    group: 'Orders',
    description: 'Historical delivered orders. Preserves customer profiles and inventory counts.',
    dangerLevel: 'HIGH'
  },
  {
    id: 'ORDERS_ALL',
    name: 'All Orders (Full Order Cleanup)',
    group: 'Orders',
    description: 'All orders in date range. Cascades to order_items and order_status_history.',
    dangerLevel: 'HIGH'
  },
  {
    id: 'BULK_ENQUIRIES',
    name: 'Bulk Corporate Enquiries',
    group: 'Operations',
    description: 'Corporate gifting and wedding bulk order enquiry submissions.',
    dangerLevel: 'LOW'
  },
  {
    id: 'REVIEWS',
    name: 'Customer Product Reviews',
    group: 'Marketing',
    description: 'Submitted customer reviews and ratings in the reviews table.',
    dangerLevel: 'MEDIUM'
  },
  {
    id: 'AUDIT_LOGS',
    name: 'Administrative Audit Logs',
    group: 'System',
    description: 'Prunes admin_audit_logs entries outside retention period.',
    dangerLevel: 'LOW'
  },
  {
    id: 'EXPIRED_COUPONS',
    name: 'Expired Promotion Coupons',
    group: 'Marketing',
    description: 'Coupons with valid_until past current time. Active coupons remain untouched.',
    dangerLevel: 'LOW'
  },
  {
    id: 'TEMPORARY_CARTS',
    name: 'Abandoned & Temporary Carts',
    group: 'Operations',
    description: 'Temporary customer and guest cart sessions and cart_items.',
    dangerLevel: 'LOW'
  }
];

export const AdminDataManagement: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const { showToast } = useToast();

  const [selectedCategories, setSelectedCategories] = useState<CleanupCategory[]>([
    'ORDERS_CANCELLED',
    'TEMPORARY_CARTS'
  ]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isRunningPreview, setIsRunningPreview] = useState(false);

  const [previewResult, setPreviewResult] = useState<{
    affectedRecords: number;
    details: string;
    breakdown: CleanupCategorySummary[];
    categories: CleanupCategory[];
    startDate?: string;
    endDate?: string;
  } | null>(null);

  // Sample inspection drawer/modal
  const [inspectingCategory, setInspectingCategory] = useState<CleanupCategorySummary | null>(null);

  // Destructive Confirmation Modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [hasConfirmedCheckbox, setHasConfirmedCheckbox] = useState(false);
  const [isExecutingDelete, setIsExecutingDelete] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isSuperAdmin) {
    return (
      <div className="p-8 bg-white rounded-card border border-rose-200 text-center space-y-3">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-content-primary">Super Admin Access Required</h2>
        <p className="text-xs text-content-muted max-w-md mx-auto">
          Bulk operational data cleanup is restricted to authorized Super Administrators only. Customer profiles, accounts, products, inventory, and payment settings are strictly protected and cannot be deleted here.
        </p>
      </div>
    );
  }

  const expectedTypedPhrase = 'CONFIRM BULK CLEANUP';

  const handleToggleCategory = (catId: CleanupCategory) => {
    setSelectedCategories((prev) => {
      if (prev.includes(catId)) {
        return prev.filter((c) => c !== catId);
      } else {
        return [...prev, catId];
      }
    });
    setPreviewResult(null);
  };

  const handleSelectAll = () => {
    setSelectedCategories(CLEANUP_OPTIONS.map((c) => c.id));
    setPreviewResult(null);
  };

  const handleClearAll = () => {
    setSelectedCategories([]);
    setPreviewResult(null);
  };

  const handleRunPreview = async () => {
    if (selectedCategories.length === 0) {
      showToast('Selection Required', 'Please select at least one record category to evaluate.', 'warning');
      return;
    }

    setIsRunningPreview(true);
    setPreviewResult(null);

    const startIso = startDate ? new Date(startDate).toISOString() : undefined;
    const endIso = endDate ? new Date(endDate + 'T23:59:59.999Z').toISOString() : undefined;

    const res = await SupabaseDataService.cleanupOperationalRecords({
      categories: selectedCategories,
      startDate: startIso,
      endDate: endIso,
      dryRun: true,
      adminEmail: user?.email || 'superadmin@zadafoods.com'
    });

    setIsRunningPreview(false);
    if (res.error) {
      showToast('Preview Error', res.error, 'error');
      return;
    }

    if (res.data) {
      setPreviewResult({
        affectedRecords: res.data.affectedRecords,
        details: res.data.details,
        breakdown: res.data.breakdown as CleanupCategorySummary[],
        categories: [...selectedCategories],
        startDate: startDate || 'Beginning of time',
        endDate: endDate || 'Present'
      });
      showToast(
        'Dry-Run Completed',
        `Evaluated ${selectedCategories.length} categories. Found ${res.data.affectedRecords} matching records. Zero database modifications made.`,
        'info'
      );
    }
  };

  const handleExportCsv = () => {
    if (!previewResult) return;
    const rows = [
      ['Category ID', 'Category Name', 'Matching Records', 'Status', 'Description'],
      ...previewResult.breakdown.map((b) => [
        b.category,
        `"${b.name}"`,
        b.count,
        b.status || 'PENDING',
        `"${b.description.replace(/"/g, '""')}"`
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `zada_bulk_cleanup_preview_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export Ready', 'Preview summary downloaded as CSV.', 'success');
  };

  const handleOpenConfirmModal = () => {
    if (!previewResult || previewResult.affectedRecords === 0) return;
    setReauthPassword('');
    setTypedConfirmation('');
    setHasConfirmedCheckbox(false);
    setAuthError(null);
    setIsConfirmModalOpen(true);
  };

  const handleExecuteDestructiveCleanup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (typedConfirmation.trim() !== expectedTypedPhrase) {
      setAuthError(`You must type "${expectedTypedPhrase}" exactly to confirm.`);
      return;
    }

    if (!hasConfirmedCheckbox) {
      setAuthError('Please acknowledge that this action cannot be undone.');
      return;
    }

    if (!reauthPassword.trim()) {
      setAuthError('Please enter your Supabase password to re-authenticate.');
      return;
    }

    setIsExecutingDelete(true);

    try {
      // 1. Fresh cryptographic re-authentication against Supabase Auth directly.
      const currentEmail = user?.email || 'superadmin@zadafoods.com';
      const { data: authData, error: aErr } = await supabase.auth.signInWithPassword({
        email: currentEmail,
        password: reauthPassword.trim()
      });

      if (aErr || !authData.session) {
        setIsExecutingDelete(false);
        setAuthError('Re-authentication failed: Invalid password. Destructive action rejected.');
        return;
      }

      // 2. Execute deletion safely in cascade
      const startIso = startDate ? new Date(startDate).toISOString() : undefined;
      const endIso = endDate ? new Date(endDate + 'T23:59:59.999Z').toISOString() : undefined;

      const res = await SupabaseDataService.cleanupOperationalRecords({
        categories: selectedCategories,
        startDate: startIso,
        endDate: endIso,
        dryRun: false,
        adminEmail: currentEmail
      });

      setIsExecutingDelete(false);

      if (res.error) {
        setAuthError('Deletion failed: ' + res.error);
        return;
      }

      setIsConfirmModalOpen(false);
      setPreviewResult(null);
      showToast(
        'Bulk Cleanup Completed',
        `Successfully deleted ${res.data?.affectedRecords} records across selected categories. Logged to admin audit logs.`,
        'success'
      );
    } catch (err: any) {
      setIsExecutingDelete(false);
      setAuthError(err.message || 'An unexpected error occurred during execution.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-content-primary flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-rose-600" />
          <span>Admin-Controlled Bulk Data Management</span>
        </h1>
        <p className="text-xs text-content-muted mt-1">
          Safely manage and purge operational, staging, and expired test records with strict guardrails.
          Core business assets (products, categories, inventory, customer profiles, payment settings) are permanently protected.
        </p>
      </div>

      {/* Strict Protection Callout Banner */}
      <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold block">Protected Core Entities (Strict Exemption)</span>
            <span className="text-[11px] text-emerald-800">
              Products, Product Variants, Categories, Inventory Batches, Customer Accounts, Store &amp; Payment Settings are strictly exempt from bulk cleanup.
            </span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded bg-white text-emerald-700 font-mono text-[10px] font-bold border border-emerald-200 shrink-0">
          Immutable Protection ON
        </span>
      </div>

      {/* Multi-Category Selection Card */}
      <div className="bg-white rounded-card border border-border-subtle p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
          <div>
            <h2 className="font-bold text-sm text-content-primary flex items-center gap-2">
              <Filter className="w-4 h-4 text-brand-primary" />
              <span>1. Select Operational Categories to Evaluate</span>
            </h2>
            <p className="text-[11px] text-content-muted">
              Choose one or multiple operational record categories for cleanup evaluation.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-2.5 py-1 rounded text-[11px] font-semibold text-brand-primary hover:bg-canvas-subtle"
            >
              Select All
            </button>
            <span className="text-border-subtle">|</span>
            <button
              type="button"
              onClick={handleClearAll}
              className="px-2.5 py-1 rounded text-[11px] font-semibold text-content-muted hover:text-content-primary"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {CLEANUP_OPTIONS.map((opt) => {
            const isSelected = selectedCategories.includes(opt.id);
            return (
              <label
                key={opt.id}
                className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-2.5 ${
                  isSelected
                    ? 'border-brand-primary bg-amber-50/40 shadow-xs'
                    : 'border-border-subtle bg-white hover:bg-canvas-subtle/40'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggleCategory(opt.id)}
                  className="mt-0.5 rounded text-brand-primary focus:ring-brand-primary shrink-0"
                />
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-xs text-content-primary">{opt.name}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        opt.dangerLevel === 'HIGH'
                          ? 'bg-rose-100 text-rose-700'
                          : opt.dangerLevel === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {opt.dangerLevel}
                    </span>
                  </div>
                  <p className="text-[10px] text-content-muted leading-relaxed line-clamp-2">
                    {opt.description}
                  </p>
                </div>
              </label>
            );
          })}
        </div>

        {/* Date Range Filters */}
        <div className="p-4 bg-canvas-subtle rounded-xl border border-border-subtle space-y-2">
          <label className="block text-xs font-bold text-content-primary flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-brand-primary" />
            <span>2. Optional Date Range Filter</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] text-content-secondary mb-1">Created On or After</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPreviewResult(null);
                }}
                className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs bg-white font-medium outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-content-secondary mb-1">Created On or Before</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPreviewResult(null);
                }}
                className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs bg-white font-medium outline-none"
              />
            </div>
          </div>
          <p className="text-[10px] text-content-muted">
            Leave dates blank to evaluate all historical records in the selected categories.
          </p>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-border-subtle">
          <button
            type="button"
            onClick={handleRunPreview}
            disabled={isRunningPreview || selectedCategories.length === 0}
            className="px-4 py-2.5 rounded-btn bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            <span>
              {isRunningPreview
                ? 'Evaluating Selected Categories...'
                : `1. Run Dry-Run Preview (${selectedCategories.length} Categories)`}
            </span>
          </button>

          {previewResult && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCsv}
                className="px-3.5 py-2.5 rounded-btn bg-canvas-subtle border border-border-subtle text-content-secondary hover:text-content-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              {previewResult.affectedRecords > 0 && (
                <button
                  type="button"
                  onClick={handleOpenConfirmModal}
                  className="px-4 py-2.5 rounded-btn bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Lock className="w-4 h-4" />
                  <span>2. Proceed to Secure Cleanup ({previewResult.affectedRecords} Records)</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Preview Summary Table */}
      {previewResult && (
        <div className="bg-white rounded-card border border-border-subtle p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-sm text-content-primary">
                  Dry-Run Preview Breakdown
                </h3>
                <p className="text-[11px] text-content-muted">
                  Date Range: {previewResult.startDate} → {previewResult.endDate}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                Safe Mode • Zero Changes Made
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                Total: {previewResult.affectedRecords} Records
              </span>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="overflow-x-auto rounded-xl border border-border-subtle">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas-subtle text-content-secondary font-bold border-b border-border-subtle">
                <tr>
                  <th className="py-2.5 px-3.5">Category</th>
                  <th className="py-2.5 px-3.5">Scope Description</th>
                  <th className="py-2.5 px-3.5 text-right">Matching Records</th>
                  <th className="py-2.5 px-3.5 text-center">Sample Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {previewResult.breakdown.map((row) => (
                  <tr key={row.category} className="hover:bg-canvas-subtle/30 transition-colors">
                    <td className="py-2.5 px-3.5 font-bold text-content-primary">
                      {row.name}
                    </td>
                    <td className="py-2.5 px-3.5 text-content-muted text-[11px]">
                      {row.description}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold">
                      <span className={row.count > 0 ? 'text-rose-600' : 'text-stone-400'}>
                        {row.count}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      {row.sampleRecords && row.sampleRecords.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setInspectingCategory(row)}
                          className="px-2.5 py-1 rounded bg-canvas-subtle border border-border-subtle hover:bg-white text-content-secondary font-medium text-[10px] inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-brand-primary" />
                          <span>Inspect ({row.sampleRecords.length})</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-content-muted font-mono">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sample Inspection Modal */}
      {inspectingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-card border border-border-subtle max-w-lg w-full p-5 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h3 className="font-bold text-sm text-content-primary">
                  Sample Inspection: {inspectingCategory.name}
                </h3>
                <p className="text-[11px] text-content-muted">
                  First 5 sample records identified for cleanup evaluation
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingCategory(null)}
                className="p-1 rounded text-content-muted hover:text-content-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {inspectingCategory.sampleRecords?.map((sample, idx) => (
                <div
                  key={sample.id || idx}
                  className="p-3 rounded-lg border border-border-subtle bg-canvas-subtle space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-content-primary font-mono text-[11px]">
                      {sample.reference}
                    </span>
                    <span className="text-[10px] text-content-muted">
                      {sample.createdAt ? new Date(sample.createdAt).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <p className="text-[11px] text-content-secondary">{sample.details}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setInspectingCategory(null)}
                className="px-3.5 py-1.5 rounded-btn bg-canvas-subtle border border-border-subtle text-xs font-semibold text-content-secondary hover:bg-canvas"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Two-Step Destructive Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-card border border-rose-300 max-w-lg w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3 border-b border-border-subtle pb-3">
              <div className="p-2 rounded-full bg-rose-100 text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-content-primary">
                  Confirm Permanent Record Deletion
                </h3>
                <p className="text-xs text-rose-600 font-semibold mt-0.5">
                  {previewResult?.affectedRecords} records across {selectedCategories.length} categories will be permanently purged
                </p>
              </div>
            </div>

            <form onSubmit={handleExecuteDestructiveCleanup} className="space-y-4">
              {authError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {authError}
                </div>
              )}

              {/* Requirement 1: Supabase Re-Authentication */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-content-primary flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-stone-500" />
                  <span>1. Enter Your Supabase Password to Re-authenticate *</span>
                </label>
                <input
                  type="password"
                  value={reauthPassword}
                  onChange={(e) => setReauthPassword(e.target.value)}
                  placeholder="Enter current Super Admin password"
                  required
                  className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs font-mono bg-white focus:ring-1 focus:ring-rose-500"
                />
                <p className="text-[10px] text-content-muted">
                  Cryptographically verified against Supabase Auth for account <code className="font-mono bg-canvas-subtle px-1 rounded">{user?.email}</code>.
                </p>
              </div>

              {/* Requirement 2: Typed Phrase */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-content-primary">
                  2. Type <span className="font-mono text-rose-600 font-bold select-all">&quot;{expectedTypedPhrase}&quot;</span> to confirm *
                </label>
                <input
                  type="text"
                  value={typedConfirmation}
                  onChange={(e) => setTypedConfirmation(e.target.value)}
                  placeholder={expectedTypedPhrase}
                  required
                  className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs font-mono bg-white focus:ring-1 focus:ring-rose-500"
                />
              </div>

              {/* Requirement 3: Checkbox */}
              <label className="flex items-start gap-2 text-xs text-content-primary cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasConfirmedCheckbox}
                  onChange={(e) => setHasConfirmedCheckbox(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                />
                <span>
                  I understand that this action is irreversible and will permanently delete <strong>{previewResult?.affectedRecords} records</strong> and cascade to associated dependencies.
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(false)}
                  disabled={isExecutingDelete}
                  className="px-3.5 py-2 rounded-btn border border-border-subtle text-xs font-semibold text-content-secondary hover:bg-canvas-subtle"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isExecutingDelete ||
                    typedConfirmation.trim() !== expectedTypedPhrase ||
                    !hasConfirmedCheckbox ||
                    !reauthPassword
                  }
                  className="px-4 py-2 rounded-btn bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isExecutingDelete ? 'Executing Deletion...' : 'Permanently Delete Records'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  ShieldAlert,
  Trash2,
  Lock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Search,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SupabaseDataService } from '../../lib/commerce/supabaseDataService';
import { supabase } from '../../lib/supabase';

type CleanupScope = 'ORDERS' | 'TEST_CHECKOUTS' | 'ENQUIRIES';

export const AdminDataManagement: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const { showToast } = useToast();

  const [selectedScope, setSelectedScope] = useState<CleanupScope>('ORDERS');
  const [beforeDate, setBeforeDate] = useState<string>('');
  const [isRunningPreview, setIsRunningPreview] = useState(false);
  const [previewResult, setPreviewResult] = useState<{
    affectedRecords: number;
    details: string;
    scope: CleanupScope;
    dateUsed?: string;
  } | null>(null);

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

  const expectedTypedPhrase =
    selectedScope === 'ENQUIRIES' ? 'DELETE ELIGIBLE ENQUIRIES' : 'DELETE ELIGIBLE ORDERS';

  const handleRunPreview = async () => {
    setIsRunningPreview(true);
    setPreviewResult(null);

    const dateFilter = beforeDate ? new Date(beforeDate).toISOString() : undefined;
    const res = await SupabaseDataService.cleanupOperationalRecords({
      scope: selectedScope,
      beforeDate: dateFilter,
      dryRun: true,
      adminEmail: user?.email || 'superadmin@zadafoods.com'
    });

    setIsRunningPreview(false);
    if (res.error) {
      showToast('Preview Notice', res.error, 'warning');
      return;
    }

    if (res.data) {
      setPreviewResult({
        affectedRecords: res.data.affectedRecords,
        details: res.data.details,
        scope: selectedScope,
        dateUsed: beforeDate || 'All historical records'
      });
      showToast('Dry-Run Completed', `Preview found ${res.data.affectedRecords} matching records.`, 'info');
    }
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
      // Strictly zero hardcoded passwords!
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
      const dateFilter = beforeDate ? new Date(beforeDate).toISOString() : undefined;
      const res = await SupabaseDataService.cleanupOperationalRecords({
        scope: selectedScope,
        beforeDate: dateFilter,
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
        'Cleanup Completed',
        `Successfully cleaned up operational records: ${res.data?.affectedRecords} records deleted.`,
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
          <span>Secure Bulk Data Management</span>
        </h1>
        <p className="text-xs text-content-muted mt-1">
          Safely purge operational and test records after QA or when business records are no longer required.
          Products, categories, inventory, customer profiles, and admin accounts are strictly safeguarded and cannot be deleted.
        </p>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-amber-950">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Strict Safety Guardrails &amp; Two-Step Verification</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          The default action is always <strong>Dry-Run Preview</strong>. Zero records will be deleted without a fresh Supabase password re-authentication, explicit typed phrase verification, and second confirmation checkbox.
        </p>
      </div>

      {/* Configuration Card */}
      <div className="bg-white rounded-card border border-border-subtle p-5 shadow-2xs space-y-4">
        <h2 className="font-bold text-sm text-content-primary">Cleanup Configuration</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Select Record Scope *
            </label>
            <select
              value={selectedScope}
              onChange={(e) => {
                setSelectedScope(e.target.value as CleanupScope);
                setPreviewResult(null);
              }}
              className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs bg-white font-medium focus:ring-1 focus:ring-brand-primary"
            >
              <option value="ORDERS">Test &amp; Operational Orders (with cascading Order Items)</option>
              <option value="TEST_CHECKOUTS">Cancelled &amp; Failed Checkout Records Only</option>
              <option value="ENQUIRIES">Bulk Enquiries &amp; Contact Inquiries</option>
            </select>
            <p className="text-[10px] text-content-muted mt-1">
              {selectedScope === 'ORDERS' && 'Targets orders and deletes associated order items and status history. Preserves customer profiles and inventory counts.'}
              {selectedScope === 'TEST_CHECKOUTS' && 'Targets only abandoned or failed test checkouts. Leaves valid completed orders untouched.'}
              {selectedScope === 'ENQUIRIES' && 'Targets corporate and wedding bulk order inquiries.'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-content-muted" />
              <span>Created On or Before (Optional)</span>
            </label>
            <input
              type="date"
              value={beforeDate}
              onChange={(e) => {
                setBeforeDate(e.target.value);
                setPreviewResult(null);
              }}
              className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs bg-white font-medium focus:ring-1 focus:ring-brand-primary"
            />
            <p className="text-[10px] text-content-muted mt-1">
              Leave blank to evaluate all historical records within the selected scope.
            </p>
          </div>
        </div>

        {/* Action Button: Run Dry-Run Preview */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-border-subtle">
          <button
            onClick={handleRunPreview}
            disabled={isRunningPreview}
            className="px-4 py-2 rounded-btn bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            <span>{isRunningPreview ? 'Analyzing Records...' : '1. Run Dry-Run Preview (Safe)'}</span>
          </button>

          {previewResult && previewResult.affectedRecords > 0 && (
            <button
              onClick={handleOpenConfirmModal}
              className="px-4 py-2 rounded-btn bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Lock className="w-4 h-4" />
              <span>2. Proceed to Secure Cleanup ({previewResult.affectedRecords} Records)</span>
            </button>
          )}
        </div>
      </div>

      {/* Preview Results Table */}
      {previewResult && (
        <div className="bg-white rounded-card border border-border-subtle p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-content-primary flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Dry-Run Preview Result</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
              Zero Changes Made
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-canvas-subtle p-3.5 rounded-xl border border-border-subtle">
            <div>
              <span className="text-content-muted block text-[10px]">Target Scope</span>
              <span className="font-bold text-content-primary">{previewResult.scope}</span>
            </div>
            <div>
              <span className="text-content-muted block text-[10px]">Date Range</span>
              <span className="font-bold text-content-primary">{previewResult.dateUsed}</span>
            </div>
            <div>
              <span className="text-content-muted block text-[10px]">Eligible Records</span>
              <span className="font-bold text-rose-700 text-sm">{previewResult.affectedRecords}</span>
            </div>
          </div>

          <p className="text-xs text-content-secondary leading-relaxed">
            {previewResult.details}
          </p>

          {previewResult.affectedRecords === 0 && (
            <div className="p-3 bg-stone-50 rounded-lg text-stone-600 text-xs text-center">
              No records found matching your selected criteria. Your database is already clean.
            </div>
          )}
        </div>
      )}

      {/* Destructive Confirmation Modal */}
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
                  Scope: {selectedScope} • {previewResult?.affectedRecords} records will be purged
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
                  I understand that this action is irreversible and will permanently delete <strong>{previewResult?.affectedRecords} records</strong> and cascade to associated order items.
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

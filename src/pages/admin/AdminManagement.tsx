import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Edit2,
  UserCheck,
  UserX,
  Eye,
  Trash2,
  X,
  Save,
  Check,
  Shield
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  AdminAccount,
  AdminPermission,
  PERMISSION_GROUPS,
  ALL_ADMIN_PERMISSIONS,
  isSuperAdminEmail
} from '../../types/permissions';

export const AdminManagement: React.FC = () => {
  const { admins, createAdminAccount, updateAdminPermissions, toggleAdminSuspension, removeAdminAccount } = useAdminData();
  const { isSuperAdmin } = useAuth();
  const { showToast } = useToast();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'suspended'>('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'superadmin' | 'admin'>('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPermissionsAdmin, setEditingPermissionsAdmin] = useState<AdminAccount | null>(null);
  const [viewingDetailsAdmin, setViewingDetailsAdmin] = useState<AdminAccount | null>(null);
  const [suspendConfirmAdmin, setSuspendConfirmAdmin] = useState<AdminAccount | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [deleteConfirmAdmin, setDeleteConfirmAdmin] = useState<AdminAccount | null>(null);

  // Create Form State
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<AdminPermission[]>([
    'dashboard.view',
    'orders.manage',
    'products.manage'
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Permissions State
  const [editPermissionsSet, setEditPermissionsSet] = useState<AdminPermission[]>([]);

  // Filtered Admins
  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const matchesSearch =
        admin.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || admin.status === statusFilter;
      const matchesRole = roleFilter === 'ALL' || admin.role === roleFilter;
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [admins, searchTerm, statusFilter, roleFilter]);

  // Metrics
  const totalAdmins = admins.length;
  const activeAdmins = admins.filter((a) => a.status === 'active').length;
  const suspendedAdmins = admins.filter((a) => a.status === 'suspended').length;

  // Open Create Modal
  const handleOpenCreateModal = () => {
    if (!isSuperAdmin) {
      showToast('Permission Denied', 'Only the Super Administrator can create new admin accounts.', 'error');
      return;
    }
    setNewFullName('');
    setNewEmail('');
    setNewPassword('');
    setSelectedPermissions(['dashboard.view', 'orders.manage', 'products.manage']);
    setIsCreateModalOpen(true);
  };

  // Open Edit Permissions Modal
  const handleOpenEditPermissions = (admin: AdminAccount) => {
    if (!isSuperAdmin) {
      showToast('Permission Denied', 'Only the Super Administrator can modify admin permissions.', 'error');
      return;
    }
    if (admin.role === 'superadmin') {
      showToast('Notice', 'Super Administrator possesses full governance permissions by design.', 'info');
      return;
    }
    setEditingPermissionsAdmin(admin);
    setEditPermissionsSet([...admin.permissions]);
  };

  // Submit Create Admin
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      showToast('Permission Denied', 'Only the Super Administrator can create admin accounts.', 'error');
      return;
    }
    if (!newFullName.trim() || !newEmail.trim() || !newPassword) {
      showToast('Validation Error', 'Full Name, Email Address, and Password are mandatory.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('Weak Password', 'Password must be at least 8 characters long for security compliance.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createAdminAccount({
        fullName: newFullName.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        permissions: selectedPermissions
      });

      if (res.success) {
        setIsCreateModalOpen(false);
      } else {
        showToast('Error', res.error || 'Failed to create administrator account.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Updated Permissions
  const handleSavePermissions = async () => {
    if (!editingPermissionsAdmin) return;
    setIsSubmitting(true);
    try {
      const res = await updateAdminPermissions(editingPermissionsAdmin.id, editPermissionsSet);
      if (res.success) {
        setEditingPermissionsAdmin(null);
      } else {
        showToast('Error', res.error || 'Failed to update admin permissions.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Suspend / Reactivate
  const handleConfirmToggleSuspend = async () => {
    if (!suspendConfirmAdmin) return;
    setIsSubmitting(true);
    try {
      const res = await toggleAdminSuspension(suspendConfirmAdmin.id, suspendReason);
      if (res.success) {
        setSuspendConfirmAdmin(null);
        setSuspendReason('');
      } else {
        showToast('Error', res.error || 'Action could not be executed.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Removal of Administrator
  const handleConfirmDeleteAdmin = async () => {
    if (!deleteConfirmAdmin) return;
    setIsSubmitting(true);
    try {
      const res = await removeAdminAccount(deleteConfirmAdmin.id);
      if (res.success) {
        setDeleteConfirmAdmin(null);
      } else {
        showToast('Error', res.error || 'Failed to remove administrator account.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Checkbox helpers for permissions
  const togglePermission = (perm: AdminPermission, list: AdminPermission[], setList: (l: AdminPermission[]) => void) => {
    if (list.includes(perm)) {
      setList(list.filter((p) => p !== perm));
    } else {
      setList([...list, perm]);
    }
  };

  const selectAllGroup = (groupPerms: AdminPermission[], list: AdminPermission[], setList: (l: AdminPermission[]) => void) => {
    const next = Array.from(new Set([...list, ...groupPerms]));
    setList(next);
  };

  const clearGroup = (groupPerms: AdminPermission[], list: AdminPermission[], setList: (l: AdminPermission[]) => void) => {
    setList(list.filter((p) => !groupPerms.includes(p)));
  };

  const selectAll = (setList: (l: AdminPermission[]) => void) => {
    setList([...ALL_ADMIN_PERMISSIONS]);
  };

  const clearAll = (setList: (l: AdminPermission[]) => void) => {
    setList([]);
  };

  // Render Checkbox Permission Selector
  const renderPermissionSelector = (
    currentList: AdminPermission[],
    setList: (l: AdminPermission[]) => void
  ) => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-canvas-subtle p-2.5 rounded-lg border border-border-subtle">
          <div className="text-xs">
            Selected: <strong className="text-brand-primary">{currentList.length}</strong> of{' '}
            {ALL_ADMIN_PERMISSIONS.length} permissions
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => selectAll(setList)}
              className="text-[11px] font-bold text-brand-primary hover:underline"
            >
              Select All
            </button>
            <span className="text-border-subtle">•</span>
            <button
              type="button"
              onClick={() => clearAll(setList)}
              className="text-[11px] font-bold text-rose-600 hover:underline"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          {PERMISSION_GROUPS.map((group) => {
            const groupPermKeys = group.permissions.map((p) => p.key);
            const allChecked = groupPermKeys.every((k) => currentList.includes(k));

            return (
              <div
                key={group.id}
                className="rounded-xl border border-border-subtle bg-white overflow-hidden shadow-2xs"
              >
                {/* Group Header */}
                <div className="bg-canvas-subtle/80 px-3.5 py-2.5 border-b border-border-subtle flex items-center justify-between">
                  <div>
                    <h4 className="font-serif font-bold text-xs text-content-primary">
                      {group.name}
                    </h4>
                    <p className="text-[10px] text-content-muted">{group.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => (allChecked ? clearGroup(groupPermKeys, currentList, setList) : selectAllGroup(groupPermKeys, currentList, setList))}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-border-subtle text-content-secondary hover:text-brand-primary"
                    >
                      {allChecked ? 'Deselect Group' : 'Select Group'}
                    </button>
                  </div>
                </div>

                {/* Individual Checkboxes */}
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {group.permissions.map((perm) => {
                    const isChecked = currentList.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all cursor-pointer ${
                          isChecked
                            ? 'border-brand-primary/40 bg-brand-primary/5 text-content-primary'
                            : 'border-border-subtle/60 hover:bg-canvas-subtle text-content-secondary'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(perm.key, currentList, setList)}
                          className="mt-0.5 w-3.5 h-3.5 text-brand-primary rounded border-border-subtle focus:ring-brand-primary"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[11px] leading-tight">{perm.label}</p>
                          <p className="text-[10px] text-content-muted leading-tight mt-0.5">
                            {perm.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-card border border-rose-200 shadow-card text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold font-serif text-rose-900">Access Restricted</h2>
          <p className="text-xs text-content-muted leading-relaxed">
            The Admin &amp; Permission Management console is strictly restricted to the Super Administrator. Ordinary administrators are not authorized to view the administrator directory or modify role permissions.
          </p>
          <div className="pt-2">
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white rounded-btn text-xs font-bold hover:bg-brand-primary-hover shadow-sm transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-serif text-content-primary">
              Admin & Permission Management
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-400/20 text-amber-800 border border-amber-300">
              Super Admin Exclusive
            </span>
          </div>
          <p className="text-xs text-content-muted mt-0.5">
            Create administrative accounts, assign granular role permissions, and govern active operational sessions.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-btn bg-brand-primary text-white text-xs font-bold flex items-center gap-2 hover:bg-brand-primary-hover shadow-sm self-start"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create Admin</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-card border border-border-subtle shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-content-muted uppercase tracking-wider">Total Administrators</p>
            <p className="text-2xl font-serif font-bold text-content-primary mt-1">{totalAdmins}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-card border border-border-subtle shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Active Admins</p>
            <p className="text-2xl font-serif font-bold text-emerald-800 mt-1">{activeAdmins}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-card border border-border-subtle shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Suspended Admins</p>
            <p className="text-2xl font-serif font-bold text-rose-800 mt-1">{suspendedAdmins}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-3 rounded-card border border-border-subtle shadow-subtle flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-content-muted absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search admins by name or email address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-input border border-border-subtle focus:border-brand-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-input border border-border-subtle bg-white focus:border-brand-primary focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-input border border-border-subtle bg-white focus:border-brand-primary focus:outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="superadmin">Super Admin</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-card border border-border-subtle shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas-subtle text-content-muted uppercase font-bold border-b border-border-subtle">
              <tr>
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Role & Status</th>
                <th className="py-3 px-4">Assigned Permissions</th>
                <th className="py-3 px-4">Created / Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-content-muted">
                    No administrator accounts match your criteria.
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => {
                  const isRoot = isSuperAdminEmail(admin.email) || admin.role === 'superadmin';
                  return (
                    <tr
                      key={admin.id}
                      className={`hover:bg-canvas-subtle/50 transition-colors ${
                        admin.status === 'suspended' ? 'bg-rose-50/20 opacity-80' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isRoot
                              ? 'bg-amber-400 text-brand-secondary shadow-xs'
                              : 'bg-brand-primary text-white'
                          }`}
                        >
                          {admin.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-content-primary truncate flex items-center gap-1.5">
                            <span>{admin.fullName}</span>
                            {isRoot && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                Protected
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-content-muted font-mono truncate">{admin.email}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              isRoot
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {admin.role === 'superadmin' ? 'Super Administrator' : 'Administrator'}
                          </span>
                          <div>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                admin.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  admin.status === 'active' ? 'bg-emerald-600' : 'bg-rose-600'
                                }`}
                              />
                              {admin.status === 'active' ? 'Active' : 'Suspended'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1 max-w-xs">
                          {isRoot ? (
                            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                              All Permissions (Root Governance)
                            </span>
                          ) : (
                            <div>
                              <span className="text-[11px] font-bold text-content-primary">
                                {admin.permissions.length} of {ALL_ADMIN_PERMISSIONS.length} Granted
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {admin.permissions.slice(0, 3).map((p) => (
                                  <span
                                    key={p}
                                    className="px-1.5 py-0.5 rounded text-[9px] bg-canvas-subtle border border-border-subtle text-content-secondary font-mono"
                                  >
                                    {p.split('.')[0]}
                                  </span>
                                ))}
                                {admin.permissions.length > 3 && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-canvas-subtle border border-border-subtle text-content-muted font-bold">
                                    +{admin.permissions.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-content-muted space-y-0.5 text-[11px]">
                        <div>
                          Created: <strong>{new Date(admin.createdAt).toLocaleDateString()}</strong>
                        </div>
                        {admin.lastLoginAt ? (
                          <div className="text-[10px]">
                            Last Active: {new Date(admin.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        ) : null}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingDetailsAdmin(admin)}
                            className="p-1.5 rounded border border-border-subtle hover:bg-canvas-subtle text-content-muted hover:text-content-primary"
                            title="View Account Details & Audit Trail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            disabled={isRoot}
                            onClick={() => handleOpenEditPermissions(admin)}
                            className="px-2.5 py-1 rounded text-xs font-semibold text-content-muted hover:text-brand-primary hover:bg-canvas-subtle border border-border-subtle flex items-center gap-1 disabled:opacity-40"
                            title={isRoot ? 'Super Admin permissions are immutable' : 'Edit Granular Permissions'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Permissions</span>
                          </button>

                          <button
                            disabled={isRoot}
                            onClick={() => {
                              setSuspendConfirmAdmin(admin);
                              setSuspendReason('');
                            }}
                            className={`px-2.5 py-1 rounded text-xs font-bold border flex items-center gap-1 disabled:opacity-40 ${
                              admin.status === 'active'
                                ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title={isRoot ? 'Root Super Admin cannot be suspended' : undefined}
                          >
                            {admin.status === 'active' ? (
                              <>
                                <UserX className="w-3.5 h-3.5" />
                                <span>Suspend</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Reactivate</span>
                              </>
                            )}
                          </button>

                          <button
                            disabled={isRoot || !isSuperAdmin}
                            onClick={() => setDeleteConfirmAdmin(admin)}
                            className="p-1.5 rounded border border-rose-200 text-rose-600 hover:text-white hover:bg-rose-600 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                            title={
                              isRoot
                                ? 'Root Super Admin cannot be removed'
                                : !isSuperAdmin
                                ? 'Super Admin authority required to remove administrators'
                                : 'Remove Administrator'
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* CREATE ADMIN MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-card max-w-2xl w-full p-6 shadow-elevated space-y-4 my-6 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h2 className="font-serif text-lg font-bold text-content-primary flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-brand-primary" />
                  <span>Create Administrator Account</span>
                </h2>
                <p className="text-[11px] text-content-muted">
                  Assign administrative credentials and configure checkbox-based permissions.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-content-muted hover:text-content-primary rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-content-primary block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Varma"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-content-primary block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. ramesh@zadafoods.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-content-primary block mb-1">Initial Password * (Minimum 8 chars)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs font-mono"
                />
                <p className="text-[10px] text-content-muted mt-0.5">
                  Secure server-side hash via Supabase Auth. Never exposed to browser logs or client storage.
                </p>
              </div>

              {/* Permissions Checkbox Group */}
              <div>
                <label className="font-bold text-content-primary block mb-1.5">
                  Granular Operational Permissions *
                </label>
                {renderPermissionSelector(selectedPermissions, setSelectedPermissions)}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-btn border border-border-subtle font-semibold hover:bg-canvas-subtle"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-btn bg-brand-primary text-white font-bold hover:bg-brand-primary-hover shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Create Administrator</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PERMISSIONS MODAL */}
      {editingPermissionsAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-card max-w-2xl w-full p-6 shadow-elevated space-y-4 my-6 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h2 className="font-serif text-lg font-bold text-content-primary flex items-center gap-2">
                  <Shield className="w-5 h-5 text-brand-primary" />
                  <span>Edit Permissions: {editingPermissionsAdmin.fullName}</span>
                </h2>
                <p className="text-[11px] text-content-muted">
                  Update active operational grants for <code className="font-mono text-content-primary">{editingPermissionsAdmin.email}</code>
                </p>
              </div>
              <button
                onClick={() => setEditingPermissionsAdmin(null)}
                className="p-1 text-content-muted hover:text-content-primary rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>{renderPermissionSelector(editPermissionsSet, setEditPermissionsSet)}</div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setEditingPermissionsAdmin(null)}
                className="px-4 py-2 rounded-btn border border-border-subtle font-semibold hover:bg-canvas-subtle"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSavePermissions}
                className="px-4 py-2 rounded-btn bg-brand-primary text-white font-bold hover:bg-brand-primary-hover shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                    <span>Saving Permissions...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Permissions</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUSPEND / REACTIVATE CONFIRMATION MODAL */}
      {suspendConfirmAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-card max-w-sm w-full p-5 shadow-elevated space-y-3 text-xs">
            <div className="flex items-center gap-2">
              {suspendConfirmAdmin.status === 'active' ? (
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
              <h3 className="font-serif text-base font-bold text-content-primary">
                {suspendConfirmAdmin.status === 'active'
                  ? `Suspend ${suspendConfirmAdmin.fullName}?`
                  : `Reactivate ${suspendConfirmAdmin.fullName}?`}
              </h3>
            </div>

            <p className="text-content-muted leading-relaxed">
              {suspendConfirmAdmin.status === 'active'
                ? 'Suspension immediately terminates active admin access and prevents access to all operations. Historical customer orders, reviews, and audit records remain preserved.'
                : 'Reactivating this administrator will restore access strictly according to their assigned permissions.'}
            </p>

            {suspendConfirmAdmin.status === 'active' && (
              <div>
                <label className="font-bold text-content-primary block mb-1">Reason for Suspension (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Temporary leave / Role reassignment"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full px-3 py-1.5 border border-border-subtle rounded-input text-xs"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
              <button
                disabled={isSubmitting}
                onClick={() => setSuspendConfirmAdmin(null)}
                className="px-3.5 py-1.5 rounded-btn border border-border-subtle font-semibold hover:bg-canvas-subtle"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleConfirmToggleSuspend}
                className={`px-3.5 py-1.5 rounded-btn text-white font-bold shadow-sm flex items-center gap-1.5 ${
                  suspendConfirmAdmin.status === 'active'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isSubmitting ? (
                  <span>Executing...</span>
                ) : suspendConfirmAdmin.status === 'active' ? (
                  <span>Confirm Suspension</span>
                ) : (
                  <span>Confirm Reactivation</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REMOVE / DELETE ADMIN CONFIRMATION MODAL */}
      {deleteConfirmAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-card max-w-sm w-full p-5 shadow-elevated space-y-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <h3 className="font-serif text-base font-bold text-content-primary">
                Remove Administrator?
              </h3>
            </div>

            <p className="text-content-muted leading-relaxed">
              Are you sure you want to permanently remove <strong className="text-content-primary">{deleteConfirmAdmin.fullName}</strong> (<span className="font-mono text-[11px]">{deleteConfirmAdmin.email}</span>)?
            </p>

            <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] space-y-1">
              <p className="font-semibold">⚠️ Irreversible Security Action:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-amber-900">
                <li>All administrative permissions will be revoked immediately.</li>
                <li>Access to the Admin Operations Console will be blocked.</li>
                <li>Historical orders, reviews, and audit logs are safely preserved.</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
              <button
                disabled={isSubmitting}
                onClick={() => setDeleteConfirmAdmin(null)}
                className="px-3.5 py-1.5 rounded-btn border border-border-subtle font-semibold hover:bg-canvas-subtle"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleConfirmDeleteAdmin}
                className="px-3.5 py-1.5 rounded-btn text-white font-bold bg-rose-600 hover:bg-rose-700 shadow-sm flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <span>Removing...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Removal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewingDetailsAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-card max-w-lg w-full p-6 shadow-elevated space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h3 className="font-serif text-base font-bold text-content-primary">
                  Administrator Profile Details
                </h3>
                <p className="text-[11px] text-content-muted">Account metadata and security status</p>
              </div>
              <button
                onClick={() => setViewingDetailsAdmin(null)}
                className="p-1 text-content-muted hover:text-content-primary rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-canvas-subtle border border-border-subtle space-y-1">
                <p className="font-bold text-sm text-content-primary">{viewingDetailsAdmin.fullName}</p>
                <p className="font-mono text-content-muted">{viewingDetailsAdmin.email}</p>
                <div className="pt-1 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                    {viewingDetailsAdmin.role.toUpperCase()}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      viewingDetailsAdmin.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {viewingDetailsAdmin.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-content-muted block">Account Created:</span>
                  <span className="font-bold text-content-primary">
                    {new Date(viewingDetailsAdmin.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-content-muted block">Last Active Session:</span>
                  <span className="font-bold text-content-primary">
                    {viewingDetailsAdmin.lastLoginAt ? new Date(viewingDetailsAdmin.lastLoginAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>

              {viewingDetailsAdmin.status === 'suspended' && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                  <p className="font-bold">Account Suspended</p>
                  <p className="text-[11px]">Reason: {viewingDetailsAdmin.suspendedReason || 'Administrative suspension'}</p>
                </div>
              )}

              <div>
                <span className="font-bold text-content-primary block mb-1.5">
                  Granted Permissions ({viewingDetailsAdmin.permissions.length})
                </span>
                <div className="max-h-36 overflow-y-auto p-2 bg-canvas-subtle rounded border border-border-subtle flex flex-wrap gap-1">
                  {viewingDetailsAdmin.permissions.map((p) => (
                    <span
                      key={p}
                      className="px-2 py-0.5 rounded text-[10px] bg-white border border-border-subtle text-content-secondary font-mono"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border-subtle">
              <button
                onClick={() => setViewingDetailsAdmin(null)}
                className="px-4 py-1.5 rounded-btn bg-brand-primary text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

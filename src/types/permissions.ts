export type AdminPermission =
  // Core Operations
  | 'dashboard.view'
  | 'products.manage'
  | 'categories.manage'
  | 'subcategories.manage'
  | 'inventory.manage'
  | 'orders.manage'
  | 'courier.manage'
  | 'customers.view'
  // Promotions
  | 'coupons.manage'
  | 'combos.manage'
  // Marketing & Content
  | 'cms.homepage'
  | 'cms.hero_banners'
  | 'cms.category_banners'
  | 'cms.sections'
  | 'cms.festivals'
  | 'reviews.moderate'
  | 'enquiries.manage'
  | 'content.manage'
  // Finance & Governance
  | 'reports.export'
  | 'audit_logs.view'
  | 'settings.manage'
  // Super Admin Exclusive
  | 'admins.manage';

export type AdminRoleType = 'superadmin' | 'admin' | 'staff' | 'customer';

export type AdminStatus = 'active' | 'suspended';

export interface AdminAccount {
  id: string;
  email: string;
  fullName: string;
  role: 'superadmin' | 'admin';
  status: AdminStatus;
  permissions: AdminPermission[];
  createdAt: string;
  lastLoginAt?: string;
  suspendedAt?: string;
  suspendedReason?: string;
}

export interface PermissionGroup {
  id: string;
  name: string;
  description: string;
  permissions: {
    key: AdminPermission;
    label: string;
    description: string;
  }[];
}

export const ALL_ADMIN_PERMISSIONS: AdminPermission[] = [
  'dashboard.view',
  'products.manage',
  'categories.manage',
  'subcategories.manage',
  'inventory.manage',
  'orders.manage',
  'courier.manage',
  'customers.view',
  'coupons.manage',
  'combos.manage',
  'cms.homepage',
  'cms.hero_banners',
  'cms.category_banners',
  'cms.sections',
  'cms.festivals',
  'reviews.moderate',
  'enquiries.manage',
  'content.manage',
  'reports.export',
  'audit_logs.view',
  'settings.manage'
];

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'core_operations',
    name: 'Core Operations',
    description: 'Catalog, orders, customers, and fulfillment workflows',
    permissions: [
      { key: 'dashboard.view', label: 'Dashboard', description: 'View overall business revenue and fulfillment metrics' },
      { key: 'products.manage', label: 'Products Management', description: 'Create, edit, pricing, and delete catalog products' },
      { key: 'categories.manage', label: 'Categories Management', description: 'Create and reorder product categories' },
      { key: 'subcategories.manage', label: 'Subcategories Management', description: 'Manage parent category chip filters' },
      { key: 'inventory.manage', label: 'Inventory Management', description: 'Adjust physical stock levels and view audit logs' },
      { key: 'orders.manage', label: 'Orders Management', description: 'Advance order lifecycle, confirm payments, print invoices' },
      { key: 'courier.manage', label: 'Courier / AWB Management', description: 'Assign tracking numbers and courier providers' },
      { key: 'customers.view', label: 'Customer Management', description: 'View customer directory and purchase histories' }
    ]
  },
  {
    id: 'promotions',
    name: 'Promotions',
    description: 'Discount coupons, festive deals, and bundle builder',
    permissions: [
      { key: 'coupons.manage', label: 'Coupons Management', description: 'Create discount vouchers and promo codes' },
      { key: 'combos.manage', label: 'Combo Builder', description: 'Create curated multi-pack combos with fixed savings' }
    ]
  },
  {
    id: 'marketing_content',
    name: 'Marketing & Content',
    description: 'Storefront banners, landing layout, reviews, and editorial content',
    permissions: [
      { key: 'cms.homepage', label: 'Homepage CMS', description: 'Access homepage marketing manager' },
      { key: 'cms.hero_banners', label: 'Hero Banner Management', description: 'Create, edit, reorder, and delete hero slides' },
      { key: 'cms.category_banners', label: 'Category Banner Management', description: 'Customize category-specific shop banners' },
      { key: 'cms.sections', label: 'Homepage Section Management', description: 'Reorder and toggle landing page blocks' },
      { key: 'cms.festivals', label: 'Festival Themes & Promotions', description: 'Configure festive decorative overlays, seasonal banners, and announcement greetings' },
      { key: 'reviews.moderate', label: 'Reviews Moderation', description: 'Approve, feature, or remove customer feedback' },
      { key: 'enquiries.manage', label: 'Bulk Enquiries', description: 'Manage corporate gifting and wholesale leads' },
      { key: 'content.manage', label: 'Store Content & Policies', description: 'Edit Our Story, shipping terms, and FSSAI policies' }
    ]
  },
  {
    id: 'finance_governance',
    name: 'Finance & Governance',
    description: 'Executive reporting, administrative audit trail, and system configuration',
    permissions: [
      { key: 'reports.export', label: 'Reports & CSV Export', description: 'Download financial, sales, and inventory exports' },
      { key: 'audit_logs.view', label: 'Audit Logs', description: 'Inspect chronological administrative actions' },
      { key: 'settings.manage', label: 'Store & Payment Settings', description: 'Configure COD switches and payment routing' }
    ]
  }
];

export const SUPER_ADMIN_EMAIL = 'admin.zadafoods.superad@gmail.com';

export const isSuperAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return (
    normalized === SUPER_ADMIN_EMAIL ||
    normalized === 'superadmin@zadafoods.com' ||
    normalized === 'legacy@zadafoods.com'
  );
};

export const PROTECTED_SUPER_ADMIN: AdminAccount = {
  id: 'usr-superadmin-root',
  email: 'admin.zadafoods.superad@gmail.com',
  fullName: 'ZaDa Super Administrator',
  role: 'superadmin',
  status: 'active',
  permissions: [...ALL_ADMIN_PERMISSIONS, 'admins.manage'],
  createdAt: '2026-01-01T00:00:00Z',
  lastLoginAt: '2026-10-30T10:00:00Z'
};

export const INITIAL_ADMINS: AdminAccount[] = [
  PROTECTED_SUPER_ADMIN,
  {
    id: 'usr-superadmin-legacy',
    email: 'superadmin@zadafoods.com',
    fullName: 'ZaDa Super Administrator (Legacy Alias)',
    role: 'superadmin',
    status: 'active',
    permissions: [...ALL_ADMIN_PERMISSIONS, 'admins.manage'],
    createdAt: '2026-01-01T00:00:00Z',
    lastLoginAt: '2026-10-30T10:00:00Z'
  },
  {
    id: 'usr-admin-ops',
    email: 'admin@zadafoods.com',
    fullName: 'Operations Administrator',
    role: 'admin',
    status: 'active',
    permissions: [
      'dashboard.view',
      'products.manage',
      'categories.manage',
      'subcategories.manage',
      'inventory.manage',
      'orders.manage',
      'courier.manage',
      'customers.view',
      'coupons.manage',
      'combos.manage',
      'cms.homepage',
      'cms.hero_banners',
      'cms.category_banners',
      'cms.sections',
      'reviews.moderate',
      'enquiries.manage',
      'content.manage',
      'reports.export',
      'audit_logs.view',
      'settings.manage'
    ],
    createdAt: '2026-01-15T00:00:00Z',
    lastLoginAt: '2026-10-30T09:30:00Z'
  },
  {
    id: 'usr-admin-cms',
    email: 'content.admin@zadafoods.com',
    fullName: 'Content & Marketing Admin',
    role: 'admin',
    status: 'active',
    permissions: [
      'dashboard.view',
      'cms.homepage',
      'cms.hero_banners',
      'cms.category_banners',
      'cms.sections',
      'reviews.moderate',
      'content.manage'
    ],
    createdAt: '2026-02-01T00:00:00Z',
    lastLoginAt: '2026-10-29T14:15:00Z'
  },
  {
    id: 'usr-admin-orders',
    email: 'orders.staff@zadafoods.com',
    fullName: 'Order Fulfillment Officer',
    role: 'admin',
    status: 'active',
    permissions: [
      'dashboard.view',
      'orders.manage',
      'courier.manage',
      'inventory.manage',
      'customers.view'
    ],
    createdAt: '2026-03-01T00:00:00Z',
    lastLoginAt: '2026-10-30T08:00:00Z'
  },
  {
    id: 'usr-admin-suspended',
    email: 'suspended.admin@zadafoods.com',
    fullName: 'Suspended Administrator',
    role: 'admin',
    status: 'suspended',
    permissions: [],
    createdAt: '2026-03-15T00:00:00Z',
    suspendedAt: '2026-10-30T00:00:00Z',
    suspendedReason: 'Account suspended by Super Administrator.'
  }
];

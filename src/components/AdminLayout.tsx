import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation, Navigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Boxes,
  TicketPercent,
  Star,
  Users,
  Settings,
  Store,
  Menu,
  X,
  ShieldCheck,
  LogOut,
  Gift,
  Palette,
  FileText,
  BarChart3,
  History,
  UserCheck,
  FolderTree,
  AlertOctagon,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AdminPermission } from '../types/permissions';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: AdminPermission;
  superAdminOnly?: boolean;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export const AdminLayout: React.FC = () => {
  const { user, logout, isSuperAdmin, hasPermission, isSuspended, isAdmin, authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // If session or role is loading asynchronously, render loading spinner
  if (authLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // If suspended
  if (isSuspended) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-6 rounded-card border border-rose-200 shadow-card text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-serif text-rose-900">Account Suspended</h2>
          <p className="text-xs text-content-muted leading-relaxed">
            Your administrative account has been suspended by the Super Administrator. Access to administrative tools, inventory, orders, and CMS consoles has been revoked.
          </p>
          <div className="pt-2">
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-brand-secondary text-white rounded-btn text-xs font-bold hover:bg-black transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If logged in as ordinary customer without admin role
  if (user.role === 'customer' || (!isAdmin && !isSuperAdmin)) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-6 rounded-card border border-amber-200 shadow-card text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-serif text-content-primary">Administrator Access Required</h2>
          <p className="text-xs text-content-muted leading-relaxed">
            Your account ({user.email}) does not possess administrative privileges to access the ZaDa Operations Console.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to="/"
              className="px-4 py-2 bg-brand-primary text-white rounded-btn text-xs font-bold hover:bg-brand-primary-hover transition-colors"
            >
              Return to Storefront
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-canvas-subtle border border-border text-content-secondary rounded-btn text-xs font-medium hover:bg-canvas transition-colors"
            >
              Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navSections: NavGroup[] = [
    {
      group: 'Core Operations',
      items: [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
        { name: 'Products & Categories', path: '/admin/products', icon: Package, permission: 'products.manage' },
        { name: 'Subcategories', path: '/admin/subcategories', icon: FolderTree, permission: 'subcategories.manage' },
        { name: 'Inventory & Stock', path: '/admin/inventory', icon: Boxes, permission: 'inventory.manage' },
        { name: 'Orders & Courier AWB', path: '/admin/orders', icon: ShoppingBag, permission: 'orders.manage' },
        { name: 'Customers Directory', path: '/admin/customers', icon: UserCheck, permission: 'customers.view' }
      ]
    },
    {
      group: 'Promotions & Bundles',
      items: [
        { name: 'Coupons & Tiers', path: '/admin/coupons', icon: TicketPercent, permission: 'coupons.manage' },
        { name: 'Combo Builder', path: '/admin/combos', icon: Gift, permission: 'combos.manage' }
      ]
    },
    {
      group: 'Marketing & Content',
      items: [
        { name: 'Homepage CMS', path: '/admin/cms', icon: Palette, permission: 'cms.homepage' },
        { name: 'Festival Themes & Promotions', path: '/admin/festivals', icon: Sparkles, permission: 'cms.homepage' },
        { name: 'Reviews Moderation', path: '/admin/reviews', icon: Star, permission: 'reviews.moderate' },
        { name: 'Bulk Enquiries', path: '/admin/enquiries', icon: Users, permission: 'enquiries.manage' },
        { name: 'Store Content & Policies', path: '/admin/content', icon: FileText, permission: 'content.manage' }
      ]
    },
    {
      group: 'Governance & Analytics',
      items: [
        { name: 'Admin Management', path: '/admin/admins', icon: ShieldCheck, permission: 'admins.manage', superAdminOnly: true },
        { name: 'Reports & CSV Export', path: '/admin/reports', icon: BarChart3, permission: 'reports.export' },
        { name: 'Audit Logs', path: '/admin/audit-logs', icon: History, permission: 'audit_logs.view' },
        { name: 'Store & Payment Settings', path: '/admin/settings', icon: Settings, permission: 'settings.manage' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-canvas flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-brand-secondary text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 text-white hover:text-amber-300"
            aria-label="Toggle navigation menu"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <img src="/assets/brand-emblem.png" alt="ZaDa" className="w-7 h-7 object-contain" />
          <span className="font-serif font-bold text-lg text-amber-300">ZaDa Admin</span>
        </div>
        <Link
          to="/"
          className="text-xs bg-white/10 px-2.5 py-1 rounded text-white flex items-center gap-1 hover:bg-white/20"
        >
          <Store className="w-3.5 h-3.5" />
          <span>Storefront</span>
        </Link>
      </div>

      {/* Admin Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-brand-secondary text-white flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 overflow-y-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo & Brand Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-brand-secondary z-10">
            <Link to="/admin/dashboard" className="flex items-center gap-3 group">
              <img
                src="/assets/brand-emblem.png"
                alt="ZaDa Foods Logo"
                className="w-10 h-10 object-contain drop-shadow group-hover:scale-105 transition-transform"
              />
              <div>
                <span className="font-serif text-2xl font-bold tracking-tight text-amber-400 block leading-tight">
                  ZaDa
                </span>
                <span className="text-[9px] tracking-widest text-white/70 block font-sans uppercase">
                  OPERATIONS CONSOLE
                </span>
              </div>
            </Link>
            <ShieldCheck className="w-5 h-5 text-amber-400" />
          </div>

          {/* Navigation Sections */}
          <nav className="p-3 space-y-4">
            {navSections.map((sec, secIdx) => {
              const visibleItems = sec.items.filter((item) => {
                if (item.superAdminOnly) return isSuperAdmin;
                if (!item.permission) return true;
                return hasPermission(item.permission);
              });

              if (visibleItems.length === 0) return null;

              return (
                <div key={secIdx} className="space-y-1">
                  <p className="px-3 text-[10px] font-bold text-white/40 uppercase tracking-wider">
                    {sec.group}
                  </p>
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-3 py-2 rounded-btn text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-brand-primary text-white font-bold shadow-sm'
                              : 'text-white/80 hover:bg-white/10 hover:text-white'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 stroke-[2] shrink-0" />
                        <span>{item.name}</span>
                      </NavLink>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </div>

        {/* User Status & Return Link */}
        <div className="p-4 border-t border-white/10 space-y-3 bg-black/20 sticky bottom-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-400 text-brand-secondary flex items-center justify-center font-bold text-xs shrink-0">
              {user ? user.fullName[0] : 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {user ? user.fullName : 'Admin User'}
              </p>
              <p className="text-[10px] text-amber-300/80 font-mono">Role: {user?.role || 'admin'}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <Link
              to="/"
              className="text-xs text-white/70 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Storefront</span>
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs text-rose-300 hover:text-rose-200 flex items-center gap-1 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

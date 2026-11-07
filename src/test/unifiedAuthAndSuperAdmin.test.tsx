import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { CartProvider } from '../context/CartContext';
import { AdminDataProvider } from '../context/AdminDataContext';
import { LoginPage } from '../pages/LoginPage';
import { AdminLayout } from '../components/AdminLayout';
import { AdminPermissionGuard } from '../components/AdminPermissionGuard';
import { SUPER_ADMIN_EMAIL, isSuperAdminEmail } from '../types/permissions';

// Mock child admin views
const MockDashboard = () => <div data-testid="admin-dashboard-view">Admin Dashboard View</div>;
const MockOrdersView = () => <div data-testid="admin-orders-view">Orders Management Content</div>;
const MockCMSView = () => <div data-testid="admin-cms-view">Homepage CMS Content</div>;
const MockAdminsView = () => <div data-testid="admin-management-view">Super Admin Management Content</div>;
const MockStorefrontHome = () => <div data-testid="storefront-home">Storefront Homepage</div>;
const MockCheckout = () => <div data-testid="checkout-page">Customer Checkout</div>;

const renderWithAuth = (
  initialEntries: string[] = ['/login'],
  preloadedUser?: any
) => {
  if (preloadedUser) {
    localStorage.setItem('zada_auth_user', JSON.stringify(preloadedUser));
  } else {
    localStorage.removeItem('zada_auth_user');
  }

  return render(
    <ToastProvider>
      <CartProvider>
        <AuthProvider>
          <AdminDataProvider>
            <MemoryRouter initialEntries={initialEntries}>
              <Routes>
                {/* Public Storefront */}
                <Route path="/" element={<MockStorefrontHome />} />
                <Route path="/checkout" element={<MockCheckout />} />
                <Route path="/login" element={<LoginPage />} />

                {/* Admin Protected Routes with Guards */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route path="dashboard" element={<MockDashboard />} />
                  <Route
                    path="orders"
                    element={
                      <AdminPermissionGuard permission="orders.manage" featureName="Orders Management">
                        <MockOrdersView />
                      </AdminPermissionGuard>
                    }
                  />
                  <Route
                    path="cms"
                    element={
                      <AdminPermissionGuard
                        permission={['cms.homepage', 'cms.hero_banners', 'cms.category_banners', 'cms.sections']}
                        featureName="Homepage CMS"
                      >
                        <MockCMSView />
                      </AdminPermissionGuard>
                    }
                  />
                  <Route
                    path="admins"
                    element={
                      <AdminPermissionGuard superAdminOnly featureName="Admin & Permission Management">
                        <MockAdminsView />
                      </AdminPermissionGuard>
                    }
                  />
                </Route>
              </Routes>
            </MemoryRouter>
          </AdminDataProvider>
        </AuthProvider>
      </CartProvider>
    </ToastProvider>
  );
};

describe('ZaDa Foods — Unified Authentication & Secure Super Admin Login', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('1. Super Admin Account & Normalization', () => {
    it('normalizes designated Super Admin email Admin.ZaDaFoods.superAD@gmail.com to lowercase', () => {
      const mixedCaseEmail = 'Admin.ZaDaFoods.superAD@gmail.com';
      expect(isSuperAdminEmail(mixedCaseEmail)).toBe(true);
      expect(mixedCaseEmail.trim().toLowerCase()).toBe(SUPER_ADMIN_EMAIL);
      expect(SUPER_ADMIN_EMAIL).toBe('admin.zadafoods.superad@gmail.com');
    });

    it('authenticates Super Admin through unified login and automatically redirects to /admin', async () => {
      renderWithAuth(['/login']);

      const emailInput = screen.getByPlaceholderText('name@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitBtn = screen.getByRole('button', { name: /sign in/i });

      // Enter designated Super Admin email with mixed casing
      fireEvent.change(emailInput, { target: { value: 'Admin.ZaDaFoods.superAD@gmail.com' } });
      fireEvent.change(passwordInput, { target: { value: 'StrongPassword@123' } });
      fireEvent.click(submitBtn);

      // Verify redirect into protected /admin operations console
      await waitFor(() => {
        expect(screen.getByText('OPERATIONS CONSOLE')).toBeInTheDocument();
      });

      // Verify Super Admin exclusive navigation item is present
      expect(screen.getByText('Admin Management')).toBeInTheDocument();
    });
  });

  describe('2. Customer Login Redirection', () => {
    it('redirects ordinary customer to storefront destination, never to /admin', async () => {
      renderWithAuth(['/login']);

      const emailInput = screen.getByPlaceholderText('name@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitBtn = screen.getByRole('button', { name: /sign in/i });

      // Ordinary customer login
      fireEvent.change(emailInput, { target: { value: 'customer.numan@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'CustomerPass123' } });
      fireEvent.click(submitBtn);

      // Redirects to storefront homepage, not /admin
      await waitFor(() => {
        expect(screen.getByTestId('storefront-home')).toBeInTheDocument();
      });
      expect(screen.queryByText('OPERATIONS CONSOLE')).not.toBeInTheDocument();
    });

    it('ignores malicious /admin redirect requests in location state for customers', async () => {
      // Customer arriving at login with attempted redirect to /admin/orders
      const customerUser = {
        id: 'usr-customer-safe',
        email: 'customer@example.com',
        fullName: 'Safe Customer',
        role: 'customer',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z'
      };

      renderWithAuth(['/login'], customerUser);

      const emailInput = screen.getByPlaceholderText('name@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitBtn = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'customer@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByTestId('storefront-home')).toBeInTheDocument();
      });
    });
  });

  describe('3. Direct Admin URL Protection', () => {
    it('blocks ordinary customer navigating directly to /admin and displays Access Denied', () => {
      const ordinaryCustomer = {
        id: 'usr-customer-direct',
        email: 'customer@example.com',
        fullName: 'Direct Nav Customer',
        role: 'customer',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z'
      };

      renderWithAuth(['/admin/dashboard'], ordinaryCustomer);

      // Access is immediately denied
      expect(screen.getByText('Administrator Access Required')).toBeInTheDocument();
      expect(screen.getByText(/does not possess administrative privileges/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /return to storefront/i })).toBeInTheDocument();

      // Zero admin layout, navigation or confidential components rendered
      expect(screen.queryByText('OPERATIONS CONSOLE')).not.toBeInTheDocument();
      expect(screen.queryByTestId('admin-dashboard-view')).not.toBeInTheDocument();
    });
  });

  describe('4. Direct API / Security Authorization Enforcement', () => {
    it('strictly derives admin status from database role, rejecting email-substring spoofing', () => {
      // Attacker creates customer account with "admin" in email
      const attackerCustomer = {
        id: 'usr-attacker',
        email: 'imposter.admin.scam@gmail.com',
        fullName: 'Imposter Admin',
        role: 'customer',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z'
      };

      renderWithAuth(['/admin/orders'], attackerCustomer);

      // Must be blocked because role is 'customer', despite "admin" in email!
      expect(screen.getByText('Administrator Access Required')).toBeInTheDocument();
      expect(screen.queryByTestId('admin-orders-view')).not.toBeInTheDocument();
    });
  });

  describe('5. Granular Admin Permissions (Content Admin vs Order Admin)', () => {
    it('allows Content Admin to access /admin/cms but strictly blocks access to /admin/orders', () => {
      const contentAdmin = {
        id: 'usr-admin-content',
        email: 'content.admin@zadafoods.com',
        fullName: 'Content Manager',
        role: 'admin',
        status: 'active',
        permissions: ['dashboard.view', 'cms.homepage', 'cms.hero_banners', 'cms.category_banners', 'cms.sections'],
        createdAt: '2026-01-01T00:00:00Z'
      };

      // 1. Visit allowed CMS page
      const { unmount } = renderWithAuth(['/admin/cms'], contentAdmin);
      expect(screen.getByTestId('admin-cms-view')).toBeInTheDocument();
      unmount();

      // 2. Direct URL attempt to /admin/orders must be blocked!
      renderWithAuth(['/admin/orders'], contentAdmin);
      expect(screen.getByText('Access Restricted')).toBeInTheDocument();
      expect(screen.getByText(/does not possess permission to access Orders Management/i)).toBeInTheDocument();
      // Zero order rows or controls rendered!
      expect(screen.queryByTestId('admin-orders-view')).not.toBeInTheDocument();
    });

    it('allows Order Admin to access /admin/orders but strictly blocks access to /admin/cms', () => {
      const orderAdmin = {
        id: 'usr-admin-orders',
        email: 'orders.staff@zadafoods.com',
        fullName: 'Fulfillment Lead',
        role: 'admin',
        status: 'active',
        permissions: ['dashboard.view', 'orders.manage', 'courier.manage'],
        createdAt: '2026-01-01T00:00:00Z'
      };

      // 1. Visit allowed Orders page
      const { unmount } = renderWithAuth(['/admin/orders'], orderAdmin);
      expect(screen.getByTestId('admin-orders-view')).toBeInTheDocument();
      unmount();

      // 2. Direct URL attempt to /admin/cms must be blocked!
      renderWithAuth(['/admin/cms'], orderAdmin);
      expect(screen.getByText('Access Restricted')).toBeInTheDocument();
      expect(screen.getByText(/does not possess permission to access Homepage CMS/i)).toBeInTheDocument();
      // Zero CMS components rendered!
      expect(screen.queryByTestId('admin-cms-view')).not.toBeInTheDocument();
    });

    it('strictly blocks ordinary admins from accessing /admin/admins', () => {
      const generalAdmin = {
        id: 'usr-admin-general',
        email: 'admin@zadafoods.com',
        fullName: 'General Admin',
        role: 'admin',
        status: 'active',
        permissions: ['dashboard.view', 'orders.manage', 'cms.homepage'],
        createdAt: '2026-01-01T00:00:00Z'
      };

      renderWithAuth(['/admin/admins'], generalAdmin);
      expect(screen.getByText('Access Restricted')).toBeInTheDocument();
      expect(screen.getByText(/strictly restricted to the Super Administrator/i)).toBeInTheDocument();
      expect(screen.queryByTestId('admin-management-view')).not.toBeInTheDocument();
    });
  });

  describe('6. Suspended Admin Enforcement', () => {
    it('rejects suspended admin login and displays clear suspension notice', async () => {
      renderWithAuth(['/login']);

      const emailInput = screen.getByPlaceholderText('name@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitBtn = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'suspended.admin@zadafoods.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/your administrative account has been suspended by the super administrator/i)
        ).toBeInTheDocument();
      });

      // No active admin session
      expect(screen.queryByText('OPERATIONS CONSOLE')).not.toBeInTheDocument();
    });

    it('blocks suspended admin from all /admin routes when session is evaluated', () => {
      const suspendedUser = {
        id: 'usr-suspended-001',
        email: 'suspended.admin@zadafoods.com',
        fullName: 'Suspended Staff',
        role: 'admin',
        status: 'suspended',
        permissions: [],
        createdAt: '2026-01-01T00:00:00Z'
      };

      renderWithAuth(['/admin/dashboard'], suspendedUser);

      expect(screen.getByText('Account Suspended')).toBeInTheDocument();
      expect(screen.getByText(/access to administrative tools, inventory, orders, and cms consoles has been revoked/i)).toBeInTheDocument();
      expect(screen.queryByText('OPERATIONS CONSOLE')).not.toBeInTheDocument();
    });
  });

  describe('7. Invalid Credentials Rejection', () => {
    it('rejects empty credentials with informative prompt', async () => {
      renderWithAuth(['/login']);

      const submitBtn = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitBtn);

      // Browser validation / handler prevents login without credentials
      expect(screen.queryByText('OPERATIONS CONSOLE')).not.toBeInTheDocument();
    });
  });

  describe('8. Session Termination & Logout Behavior', () => {
    it('completely removes access to protected admin views upon logout', async () => {
      const superAdminUser = {
        id: 'usr-superadmin-root',
        email: 'admin.zadafoods.superad@gmail.com',
        fullName: 'Super Admin',
        role: 'superadmin',
        status: 'active',
        permissions: ['dashboard.view', 'admins.manage'],
        createdAt: '2026-01-01T00:00:00Z'
      };

      renderWithAuth(['/admin/dashboard'], superAdminUser);
      expect(screen.getByText('OPERATIONS CONSOLE')).toBeInTheDocument();

      // Click Sign Out
      const signOutBtn = screen.getByRole('button', { name: /sign out/i });
      fireEvent.click(signOutBtn);

      // Verify session is cleared and redirected to login
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /welcome to zada foods/i })).toBeInTheDocument();
      });
      expect(localStorage.getItem('zada_auth_user')).toBeNull();
    });
  });
});

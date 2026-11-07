import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { CartProvider } from '../context/CartContext';
import { AdminDataProvider, useAdminData } from '../context/AdminDataContext';
import { LoginPage } from '../pages/LoginPage';
import { AdminLayout } from '../components/AdminLayout';
import { AdminPermissionGuard } from '../components/AdminPermissionGuard';
import { AdminManagement } from '../pages/admin/AdminManagement';
import { INITIAL_ADMINS } from '../types/permissions';

const MockDashboard = () => <div data-testid="admin-dashboard-view">Admin Dashboard View</div>;
const MockOrdersView = () => <div data-testid="admin-orders-view">Orders Management Content</div>;
const MockCMSView = () => <div data-testid="admin-cms-view">Homepage CMS Content</div>;
const MockAdminsView = () => <div data-testid="admin-management-view">Super Admin Management Content</div>;
const MockStorefrontHome = () => <div data-testid="storefront-home">Storefront Homepage</div>;

const TestAdminCreationComponent = () => {
  const { createAdminAccount, admins } = useAdminData();
  const [createdAdmin, setCreatedAdmin] = React.useState<any>(null);
  const [errorMsg, setErrorMsg] = React.useState<string>('');

  const handleCreate = async (password: string, email: string = 'new.verified.admin@zadafoods.com') => {
    setErrorMsg('');
    const res = await createAdminAccount({
      fullName: 'New Verified Admin',
      email,
      password,
      permissions: ['dashboard.view', 'cms.homepage', 'cms.hero_banners']
    });
    if (res.success) {
      setCreatedAdmin(res.data);
    } else {
      setErrorMsg(res.error || 'Failed');
    }
  };

  return (
    <div>
      <button onClick={() => handleCreate('Short1!')} data-testid="create-short-pass-btn">
        Create Short Password
      </button>
      <button onClick={() => handleCreate('ValidPassword123!')} data-testid="create-valid-admin-btn">
        Create Valid Admin
      </button>
      {errorMsg && <div data-testid="creation-error">{errorMsg}</div>}
      {createdAdmin && <div data-testid="creation-success">{createdAdmin.email}</div>}
      <div data-testid="total-admins-count">{admins.length}</div>
    </div>
  );
};

const TestAdminRemovalComponent = () => {
  const { removeAdminAccount, admins } = useAdminData();
  const [result, setResult] = React.useState<any>(null);

  return (
    <div>
      <button
        onClick={async () => {
          const res = await removeAdminAccount('usr-superadmin-root');
          setResult(res);
        }}
        data-testid="remove-superadmin-btn"
      >
        Remove SuperAdmin
      </button>

      <button
        onClick={async () => {
          const res = await removeAdminAccount('usr-admin-ops');
          setResult(res);
        }}
        data-testid="remove-ops-btn"
      >
        Remove Ops Admin
      </button>

      {result && <div data-testid="remove-result">{JSON.stringify(result)}</div>}
      <div data-testid="admins-list">
        {admins.map((a) => (
          <span key={a.id} data-testid={`admin-item-${a.id}`}>
            {a.fullName}
          </span>
        ))}
      </div>
    </div>
  );
};

const renderWithAllProviders = (
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
                <Route path="/" element={<MockStorefrontHome />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/test-create-admin" element={<TestAdminCreationComponent />} />
                <Route path="/test-remove-admin" element={<TestAdminRemovalComponent />} />
                <Route path="/admin/admins-manage" element={<AdminManagement />} />

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

describe('ZaDa Foods — Phase 16: Admin Account Creation, Login & Role-Based Redirection', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('1. Admin Account Creation & Password Enforcement', () => {
    it('strictly rejects admin passwords shorter than 8 characters', async () => {
      renderWithAllProviders(['/test-create-admin']);

      fireEvent.click(screen.getByTestId('create-short-pass-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('creation-error')).toHaveTextContent(/at least 8 characters/i);
      });
      expect(screen.queryByTestId('creation-success')).not.toBeInTheDocument();
    });

    it('creates a new administrator with valid Supabase Auth identity structure and active status', async () => {
      renderWithAllProviders(['/test-create-admin']);

      fireEvent.click(screen.getByTestId('create-valid-admin-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('creation-success')).toHaveTextContent('new.verified.admin@zadafoods.com');
      });

      // Verify account was persistently registered in administrator list
      const savedList = JSON.parse(localStorage.getItem('zada_admin_accounts_list') || '[]');
      const newlyCreated = savedList.find((a: any) => a.email === 'new.verified.admin@zadafoods.com');
      expect(newlyCreated).toBeDefined();
      expect(newlyCreated.status).toBe('active');
      expect(newlyCreated.role).toBe('admin');
      expect(newlyCreated.permissions).toContain('cms.homepage');
    });
  });

  describe('2. Login & Role-Based Redirection to /admin', () => {
    it('authenticates Content Admin and redirects to /admin, NOT the customer homepage', async () => {
      renderWithAllProviders(['/login']);

      const emailInput = screen.getByPlaceholderText('name@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitBtn = screen.getByRole('button', { name: /sign in/i });

      // Login using Content Admin test account
      fireEvent.change(emailInput, { target: { value: 'content.admin@zadafoods.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitBtn);

      // Must redirect to /admin Operations Console
      await waitFor(() => {
        expect(screen.getByText('OPERATIONS CONSOLE')).toBeInTheDocument();
      });
      // Storefront home must NOT be rendered
      expect(screen.queryByTestId('storefront-home')).not.toBeInTheDocument();
    });

    it('authenticates Order Admin and redirects to /admin, NOT the customer homepage', async () => {
      renderWithAllProviders(['/login']);

      const emailInput = screen.getByPlaceholderText('name@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitBtn = screen.getByRole('button', { name: /sign in/i });

      // Login using Order Admin test account
      fireEvent.change(emailInput, { target: { value: 'orders.staff@zadafoods.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('OPERATIONS CONSOLE')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('storefront-home')).not.toBeInTheDocument();
    });

    it('authenticates Operations Admin (admin@zadafoods.com) and redirects to /admin', async () => {
      renderWithAllProviders(['/login']);

      const emailInput = screen.getByPlaceholderText('name@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitBtn = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'admin@zadafoods.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('OPERATIONS CONSOLE')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('storefront-home')).not.toBeInTheDocument();
    });

    it('authenticates Super Admin and redirects to /admin with full Admin Management authority', async () => {
      renderWithAllProviders(['/login']);

      const emailInput = screen.getByPlaceholderText('name@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitBtn = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'Admin.ZaDaFoods.superAD@gmail.com' } });
      fireEvent.change(passwordInput, { target: { value: 'admin123' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('OPERATIONS CONSOLE')).toBeInTheDocument();
      });
      expect(screen.getByText('Admin Management')).toBeInTheDocument();
    });

    it('authenticates newly created administrator and redirects directly to /admin', async () => {
      // Pre-seed a newly created admin in the registry
      const customNewAdmin = {
        id: 'usr-admin-custom-001',
        email: 'ramesh.manager@zadafoods.com',
        fullName: 'Ramesh Manager',
        role: 'admin',
        status: 'active',
        permissions: ['dashboard.view', 'products.manage'],
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('zada_admin_accounts_list', JSON.stringify([...INITIAL_ADMINS, customNewAdmin]));

      renderWithAllProviders(['/login']);

      const emailInput = screen.getByPlaceholderText('name@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitBtn = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'ramesh.manager@zadafoods.com' } });
      fireEvent.change(passwordInput, { target: { value: 'ManagerSecure2026!' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('OPERATIONS CONSOLE')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('storefront-home')).not.toBeInTheDocument();
    });
  });

  describe('3. Permission Enforcement & Route Guards', () => {
    it('Content Admin can access /admin/cms but is strictly blocked from /admin/orders', () => {
      const contentAdmin = {
        id: 'usr-admin-cms',
        email: 'content.admin@zadafoods.com',
        fullName: 'Content Admin',
        role: 'admin',
        status: 'active',
        permissions: ['dashboard.view', 'cms.homepage', 'cms.hero_banners'],
        createdAt: '2026-01-01T00:00:00Z'
      };

      // 1. CMS Allowed
      const { unmount } = renderWithAllProviders(['/admin/cms'], contentAdmin);
      expect(screen.getByTestId('admin-cms-view')).toBeInTheDocument();
      unmount();

      // 2. Orders Blocked
      renderWithAllProviders(['/admin/orders'], contentAdmin);
      expect(screen.getByText('Access Restricted')).toBeInTheDocument();
      expect(screen.queryByTestId('admin-orders-view')).not.toBeInTheDocument();
    });

    it('Order Admin can access /admin/orders but is strictly blocked from /admin/cms', () => {
      const orderAdmin = {
        id: 'usr-admin-orders',
        email: 'orders.staff@zadafoods.com',
        fullName: 'Order Admin',
        role: 'admin',
        status: 'active',
        permissions: ['dashboard.view', 'orders.manage'],
        createdAt: '2026-01-01T00:00:00Z'
      };

      // 1. Orders Allowed
      const { unmount } = renderWithAllProviders(['/admin/orders'], orderAdmin);
      expect(screen.getByTestId('admin-orders-view')).toBeInTheDocument();
      unmount();

      // 2. CMS Blocked
      renderWithAllProviders(['/admin/cms'], orderAdmin);
      expect(screen.getByText('Access Restricted')).toBeInTheDocument();
      expect(screen.queryByTestId('admin-cms-view')).not.toBeInTheDocument();
    });
  });

  describe('4. Suspended Admin & Customer Protections', () => {
    it('completely denies suspended admin login and creates zero admin session', async () => {
      renderWithAllProviders(['/login']);

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
      expect(screen.queryByText('OPERATIONS CONSOLE')).not.toBeInTheDocument();
    });

    it('blocks ordinary customers attempting direct navigation to /admin', () => {
      const ordinaryCustomer = {
        id: 'usr-customer-shopper',
        email: 'shopper@example.com',
        fullName: 'Store Shopper',
        role: 'customer',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z'
      };

      renderWithAllProviders(['/admin/dashboard'], ordinaryCustomer);
      expect(screen.getByText('Administrator Access Required')).toBeInTheDocument();
      expect(screen.queryByText('OPERATIONS CONSOLE')).not.toBeInTheDocument();
    });
  });

  describe('5. Admin Account Removal & Super Admin Immunity', () => {
    it('strictly forbids removing the Root Super Admin account', async () => {
      renderWithAllProviders(['/test-remove-admin']);

      const removeSuperAdminBtn = screen.getByTestId('remove-superadmin-btn');
      fireEvent.click(removeSuperAdminBtn);

      await waitFor(() => {
        expect(screen.getByTestId('remove-result')).toHaveTextContent(
          'The Super Administrator account cannot be removed or deleted.'
        );
      });

      // Verify Super Admin is still in list
      expect(screen.getByTestId('admin-item-usr-superadmin-root')).toBeInTheDocument();
    });

    it('successfully removes an ordinary admin and updates persistent directory', async () => {
      renderWithAllProviders(['/test-remove-admin']);

      expect(screen.getByTestId('admin-item-usr-admin-ops')).toBeInTheDocument();

      const removeOpsBtn = screen.getByTestId('remove-ops-btn');
      fireEvent.click(removeOpsBtn);

      await waitFor(() => {
        expect(screen.queryByTestId('admin-item-usr-admin-ops')).not.toBeInTheDocument();
      });

      // Verify localStorage was updated
      const stored = JSON.parse(localStorage.getItem('zada_admin_accounts_list') || '[]');
      expect(stored.some((a: any) => a.id === 'usr-admin-ops')).toBe(false);
    });

    it('renders remove button in AdminManagement UI with super admin protection and confirmation modal', async () => {
      const superAdminUser = {
        id: 'usr-superadmin-root',
        email: 'admin.zadafoods.superad@gmail.com',
        fullName: 'ZaDa Super Administrator',
        role: 'superadmin',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z'
      };

      renderWithAllProviders(['/admin/admins-manage'], superAdminUser);

      // Verify Super Admin remove buttons are disabled
      const rootRemoveBtns = screen.getAllByTitle('Root Super Admin cannot be removed');
      expect(rootRemoveBtns.length).toBeGreaterThan(0);
      rootRemoveBtns.forEach((btn) => expect(btn).toBeDisabled());

      // Find an enabled remove button for ordinary admin
      const removeBtns = screen.getAllByTitle('Remove Administrator');
      expect(removeBtns.length).toBeGreaterThan(0);

      // Click remove on the first removable admin
      fireEvent.click(removeBtns[0]);

      // Expect confirmation modal to open
      expect(screen.getByText('Remove Administrator?')).toBeInTheDocument();
      expect(screen.getByText(/⚠️ Irreversible Security Action:/i)).toBeInTheDocument();

      // Click Confirm Removal
      const confirmBtn = screen.getByRole('button', { name: /confirm removal/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.queryByText('Remove Administrator?')).not.toBeInTheDocument();
      });
    });
  });
});

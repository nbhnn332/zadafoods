import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminManagement } from '../pages/admin/AdminManagement';
import { AdminCMS } from '../pages/admin/AdminCMS';
import { AdminOrders } from '../pages/admin/AdminOrders';
import { AdminLayout } from '../components/AdminLayout';
import { AdminDataProvider } from '../context/AdminDataContext';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { CartProvider } from '../context/CartContext';
import { ToastContainer } from '../components/ToastContainer';
import { ALL_ADMIN_PERMISSIONS } from '../types/permissions';
import { SupabaseDataService } from '../lib/commerce/supabaseDataService';
import { HomepageBanner } from '../types';

const renderWithProviders = (
  ui: React.ReactElement,
  initialEntries = ['/admin/admins']
) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <AdminDataProvider>
              {ui}
              <ToastContainer />
            </AdminDataProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
};

describe('Phase 16: Super Admin & RBAC System Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    // Mock fetch for Edge Function calls (manage-admins)
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    } as any);

    // Mock fetchBanners to return default initial banners
    vi.spyOn(SupabaseDataService, 'fetchBanners').mockResolvedValue({
      data: [
        {
          id: 'ban-1',
          title: 'Authentic Kerala Flavours Delivered to Your Home',
          subtitle: 'Harvested from Wayanad farms, thinly sliced & fried fresh in 100% pure cold-pressed coconut oil.',
          imageUrl: '',
          linkUrl: '/category/chips',
          displayOrder: 1,
          isActive: true
        },
        {
          id: 'ban-2',
          title: 'Festive Malabar Sweet Gift Boxes',
          subtitle: 'Handcrafted Kozhikode Halwa and Ghee Sweets packed in luxury heritage gifting boxes.',
          imageUrl: '',
          linkUrl: '/category/halwa',
          displayOrder: 2,
          isActive: true
        }
      ],
      error: null,
      source: 'SUPABASE'
    });

    // Mock banner saving to simulate reliable persistence
    vi.spyOn(SupabaseDataService, 'saveBanner').mockImplementation(async (banner) => ({
      data: {
        id: `ban-${Date.now()}`,
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        imageUrl: banner.imageUrl || '',
        backgroundColor: banner.backgroundColor || '#072C20',
        textColor: banner.textColor || '#FFFFFF',
        eyebrow: banner.eyebrow,
        ctaText: banner.ctaText || 'Shop Now',
        linkUrl: banner.linkUrl || '/category/chips',
        displayOrder: banner.displayOrder ?? 1,
        isActive: banner.isActive ?? true,
        createdAt: new Date().toISOString()
      } as HomepageBanner,
      error: null,
      source: 'SUPABASE'
    }));
  });

  describe('1. Super Admin Capabilities & Governance', () => {
    beforeEach(() => {
      localStorage.setItem(
        'zada_auth_user',
        JSON.stringify({
          id: 'usr-superadmin-root',
          email: 'superadmin@zadafoods.com',
          fullName: 'Root Super Administrator',
          phone: '+91 75939 59235',
          role: 'superadmin',
          status: 'active',
          permissions: ALL_ADMIN_PERMISSIONS,
          createdAt: '2026-01-01T00:00:00Z'
        })
      );
    });

    it('allows Super Admin to view the Admin Management dashboard and metrics', () => {
      renderWithProviders(<AdminManagement />);

      expect(screen.getByText(/Admin & Permission Management/i)).toBeInTheDocument();
      expect(screen.getByText(/Super Admin Exclusive/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Admin/i })).toBeInTheDocument();

      // Metrics cards
      expect(screen.getByText(/Total Administrators/i)).toBeInTheDocument();
      expect(screen.getByText(/Active Admins/i)).toBeInTheDocument();
      expect(screen.getByText(/Suspended Admins/i)).toBeInTheDocument();

      // Root superadmin is displayed in the list
      expect(screen.getByText('superadmin@zadafoods.com')).toBeInTheDocument();
    });

    it('allows Super Admin to open Create Admin modal with checkbox groups and create an account', async () => {
      renderWithProviders(<AdminManagement />);

      const createBtn = screen.getByRole('button', { name: /Create Admin/i });
      fireEvent.click(createBtn);

      expect(screen.getByText(/Create Administrator Account/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e\.g\. Ramesh Varma/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e\.g\. ramesh@zadafoods\.com/i)).toBeInTheDocument();

      // Checkbox groups are displayed
      expect(screen.getByText('Core Operations')).toBeInTheDocument();
      expect(screen.getByText('Promotions')).toBeInTheDocument();
      expect(screen.getByText('Marketing & Content')).toBeInTheDocument();
      expect(screen.getByText('Finance & Governance')).toBeInTheDocument();

      // Fill in valid details
      fireEvent.change(screen.getByPlaceholderText(/e\.g\. Ramesh Varma/i), {
        target: { value: 'Marketing Executive' }
      });
      fireEvent.change(screen.getByPlaceholderText(/e\.g\. ramesh@zadafoods\.com/i), {
        target: { value: 'marketing@zadafoods.com' }
      });
      fireEvent.change(screen.getByPlaceholderText(/••••••••••••/i), {
        target: { value: 'SecurePass2026!' }
      });

      // Submit form
      const submitBtn = screen.getByRole('button', { name: /Create Administrator/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('marketing@zadafoods.com')).toBeInTheDocument();
      });
    });

    it('allows Super Admin to edit permissions of an existing admin account', async () => {
      renderWithProviders(<AdminManagement />);

      // Find edit permissions button for an ordinary admin (e.g. Operations Manager)
      const editButtons = screen.getAllByTitle(/Edit Granular Permissions/i);
      expect(editButtons.length).toBeGreaterThan(0);
      fireEvent.click(editButtons[0]);

      expect(screen.getByText(/Edit Permissions:/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Select All/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Clear All/i })).toBeInTheDocument();

      // Click Select All
      fireEvent.click(screen.getByRole('button', { name: /Select All/i }));

      // Click Save Changes
      const saveBtn = screen.getByRole('button', { name: /Save Permissions/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.queryByText(/Edit Permissions:/i)).toBeNull();
      });
    });

    it('prevents suspension or demotion of the Root Super Admin', () => {
      renderWithProviders(<AdminManagement />);

      // Look at root Super Admin row: Suspend button should be disabled with protective tooltip
      const protectedRow = screen.getByText('superadmin@zadafoods.com').closest('tr');
      expect(protectedRow).not.toBeNull();

      const suspendBtn = protectedRow!.querySelector('button[title*="Root Super Admin cannot be suspended"]');
      expect(suspendBtn).toBeDisabled();
    });

    it('allows Super Admin to suspend and reactivate an ordinary admin account', async () => {
      renderWithProviders(<AdminManagement />);

      // Find an active ordinary admin row (e.g. admin@zadafoods.com)
      const targetRow = screen.getByText('admin@zadafoods.com').closest('tr');
      expect(targetRow).not.toBeNull();

      // Click the suspend button
      const suspendBtn = targetRow!.querySelector('button.text-rose-700');
      expect(suspendBtn).not.toBeNull();
      fireEvent.click(suspendBtn!);

      // Confirm modal opens
      expect(screen.getByText(/Suspend Operations Administrator\?/i)).toBeInTheDocument();
      const confirmBtn = screen.getByRole('button', { name: /Confirm Suspension/i });
      fireEvent.click(confirmBtn);

      // Now the row should reflect Suspended
      await waitFor(() => {
        expect(screen.getAllByText('Suspended').length).toBeGreaterThan(0);
      });
    });
  });

  describe('2. CMS Admin Permissions & Enforcement', () => {
    beforeEach(() => {
      localStorage.setItem(
        'zada_auth_user',
        JSON.stringify({
          id: 'usr-admin-cms',
          email: 'cms@zadafoods.com',
          fullName: 'CMS Content Editor',
          phone: '+91 75939 59235',
          role: 'admin',
          status: 'active',
          permissions: ['cms.homepage', 'cms.hero_banners', 'cms.category_banners'],
          createdAt: '2026-01-01T00:00:00Z'
        })
      );
    });

    it('allows CMS Admin to view and modify Homepage CMS banners without authorization error', async () => {
      renderWithProviders(<AdminCMS />, ['/admin/cms']);

      expect(screen.getByText(/Storefront CMS & Layout Manager/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add Hero Banner/i })).toBeInTheDocument();

      // Open create banner modal
      fireEvent.click(screen.getByRole('button', { name: /Add Hero Banner/i }));
      expect(screen.getByText(/Create Hero Banner/i)).toBeInTheDocument();

      // Enter headline
      const titleInput = screen.getByPlaceholderText(/e\.g\. Authentic Kerala Flavours Delivered to Your Home/i);
      fireEvent.change(titleInput, { target: { value: 'Authentic Festive Delight' } });

      // Save banner - should succeed without "Only authorized admin can..." error
      const saveBtn = screen.getByRole('button', { name: /Create Banner/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getAllByText('Authentic Festive Delight').length).toBeGreaterThan(0);
      });
    });

    it('blocks CMS Admin from accessing the Super Admin Admin Management console', () => {
      renderWithProviders(<AdminManagement />, ['/admin/admins']);

      expect(screen.getByText(/Access Restricted/i)).toBeInTheDocument();
      expect(screen.getByText(/strictly restricted to the Super Administrator/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Create Admin/i })).toBeNull();
    });
  });

  describe('3. Order Admin Permissions & Enforcement', () => {
    beforeEach(() => {
      localStorage.setItem(
        'zada_auth_user',
        JSON.stringify({
          id: 'usr-admin-orders',
          email: 'orders@zadafoods.com',
          fullName: 'Order Fulfillment Officer',
          phone: '+91 75939 59235',
          role: 'admin',
          status: 'active',
          permissions: ['orders.manage', 'dashboard.view'],
          createdAt: '2026-01-01T00:00:00Z'
        })
      );
    });

    it('allows Order Admin to view orders and update dispatch status', () => {
      renderWithProviders(<AdminOrders />, ['/admin/orders']);

      expect(screen.getByText(/Order Fulfillment & Courier Dispatch/i)).toBeInTheDocument();
      expect(screen.queryByText(/Read-Only Mode/i)).toBeNull();
    });

    it('blocks Order Admin from modifying Homepage CMS banners with explicit permission error', () => {
      renderWithProviders(<AdminCMS />, ['/admin/cms']);

      // Attempting to create banner
      const addBannerBtn = screen.getByRole('button', { name: /Add Hero Banner/i });
      fireEvent.click(addBannerBtn);

      const titleInput = screen.getByPlaceholderText(/e\.g\. Authentic Kerala Flavours Delivered to Your Home/i);
      fireEvent.change(titleInput, { target: { value: 'Unauthorized Banner Edit' } });

      const saveBtn = screen.getByRole('button', { name: /Create Banner/i });
      fireEvent.click(saveBtn);

      // Toast error displays specific missing permission
      expect(screen.getByText(/Permission Denied/i)).toBeInTheDocument();
      expect(screen.getByText(/lacks the "Hero Banner Management" \(cms\.hero_banners\) permission/i)).toBeInTheDocument();
    });

    it('blocks Order Admin from accessing the Admin Management page', () => {
      renderWithProviders(<AdminManagement />, ['/admin/admins']);

      expect(screen.getByText(/Access Restricted/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Create Admin/i })).toBeNull();
    });
  });

  describe('4. Suspended Admin Enforcement', () => {
    beforeEach(() => {
      localStorage.setItem(
        'zada_auth_user',
        JSON.stringify({
          id: 'usr-admin-suspended',
          email: 'suspended@zadafoods.com',
          fullName: 'Suspended Staff Member',
          phone: '+91 75939 59235',
          role: 'admin',
          status: 'suspended',
          permissions: [],
          createdAt: '2026-01-01T00:00:00Z'
        })
      );
    });

    it('blocks suspended admin at layout level with Account Suspended screen', () => {
      renderWithProviders(
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<div>Dashboard Content</div>} />
          </Route>
        </Routes>,
        ['/admin/dashboard']
      );

      expect(screen.getByText(/Account Suspended/i)).toBeInTheDocument();
      expect(screen.getByText(/Your administrative account has been suspended/i)).toBeInTheDocument();
      expect(screen.queryByText('Dashboard Content')).toBeNull();
    });
  });

  describe('5. Ordinary Customer Enforcement', () => {
    beforeEach(() => {
      localStorage.setItem(
        'zada_auth_user',
        JSON.stringify({
          id: 'usr-customer-1',
          email: 'customer@gmail.com',
          fullName: 'Customer Ananya',
          phone: '+91 98765 00000',
          role: 'customer',
          status: 'active',
          permissions: [],
          createdAt: '2026-01-01T00:00:00Z'
        })
      );
    });

    it('blocks ordinary customer from accessing admin console with access required message', () => {
      renderWithProviders(
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<div>Dashboard Content</div>} />
          </Route>
        </Routes>,
        ['/admin/dashboard']
      );

      expect(screen.getByText(/Administrator Access Required/i)).toBeInTheDocument();
      expect(screen.getByText(/does not possess administrative privileges/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Return to Storefront/i })).toBeInTheDocument();
      expect(screen.queryByText('Dashboard Content')).toBeNull();
    });
  });
});

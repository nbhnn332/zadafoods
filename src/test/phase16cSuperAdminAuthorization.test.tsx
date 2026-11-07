import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminCMS } from '../pages/admin/AdminCMS';
import { AdminDataProvider } from '../context/AdminDataContext';
import { CartProvider } from '../context/CartContext';
import { AuthProvider, resolveUserRoleAndPermissions } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { ToastContainer } from '../components/ToastContainer';
import * as supabaseModule from '../lib/supabase';
import { SupabaseDataService } from '../lib/commerce/supabaseDataService';
import { HomepageBanner } from '../types';

const renderWithProviders = (ui: React.ReactElement, initialEntries = ['/admin/cms']) => {
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

describe('Phase 16C: Central Super Admin Authorization & CMS Permission Mapping', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. Central Authoritative Permission Resolver', () => {
    it('grants full administrative permissions to an active superadmin (both superadmin and super_admin aliases)', async () => {
      const res1 = await resolveUserRoleAndPermissions('usr-super-1', 'admin.zadafoods.superad@gmail.com', {
        role: 'superadmin'
      });
      expect(res1.role).toBe('superadmin');
      expect(res1.status).toBe('active');
      expect(res1.permissions).toContain('cms.hero_banners');
      expect(res1.permissions).toContain('admins.manage');

      const res2 = await resolveUserRoleAndPermissions('usr-super-2', 'legacy@zadafoods.com', {
        role: 'super_admin'
      });
      expect(res2.role).toBe('superadmin');
      expect(res2.status).toBe('active');
      expect(res2.permissions).toContain('cms.hero_banners');
    });

    it('grants only explicitly assigned permissions to an active regular admin', async () => {
      const res = await resolveUserRoleAndPermissions('usr-admin-orders', 'orders@zadafoods.com', {
        role: 'admin',
        permissions: ['orders.manage', 'courier.manage']
      });
      expect(res.role).toBe('admin');
      expect(res.status).toBe('active');
      expect(res.permissions).toEqual(['orders.manage', 'courier.manage']);
      expect(res.permissions).not.toContain('cms.hero_banners');
      expect(res.permissions).not.toContain('admins.manage');
    });

    it('denies all administrative permissions to a suspended admin', async () => {
      const res = await resolveUserRoleAndPermissions('usr-suspended-1', 'suspended@zadafoods.com', {
        role: 'admin',
        status: 'suspended',
        permissions: ['orders.manage']
      });
      expect(res.status).toBe('suspended');
      expect(res.permissions).toEqual([]);
    });

    it('denies all administrative permissions to an ordinary customer', async () => {
      const res = await resolveUserRoleAndPermissions('usr-cust-1', 'customer@example.com', {
        role: 'customer'
      });
      expect(res.role).toBe('customer');
      expect(res.permissions).toEqual([]);
    });
  });

  describe('2. Super Admin Complete Hero Banner Lifecycle in CMS', () => {
    beforeEach(() => {
      localStorage.setItem(
        'zada_auth_user',
        JSON.stringify({
          id: 'usr-superadmin-root',
          email: 'admin.zadafoods.superad@gmail.com',
          fullName: 'ZaDa Super Administrator',
          role: 'superadmin',
          status: 'active',
          permissions: ['dashboard.view', 'cms.homepage', 'cms.hero_banners', 'cms.category_banners'],
          createdAt: '2026-01-01T00:00:00Z'
        })
      );
    });

    it('allows Super Admin to create a banner without Database Permission Denied error', async () => {
      vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      const savedBanner: HomepageBanner = {
        id: 'ban-super-created-1',
        title: 'Kerala Ghee Roasted Plantain',
        subtitle: 'Authentic taste',
        imageUrl: '',
        backgroundColor: '#072C20',
        textColor: '#FFFFFF',
        linkUrl: '/category/chips',
        displayOrder: 1,
        isActive: true,
        createdAt: '2026-10-30T10:00:00Z'
      };

      const saveSpy = vi.spyOn(SupabaseDataService, 'saveBanner').mockResolvedValue({
        data: savedBanner,
        error: null,
        source: 'SUPABASE'
      });

      renderWithProviders(<AdminCMS />);

      const addBtn = screen.getByRole('button', { name: /Add Hero Banner/i });
      fireEvent.click(addBtn);

      const titleInput = screen.getByPlaceholderText(/e\.g\. Authentic Kerala Flavours Delivered to Your Home/i);
      fireEvent.change(titleInput, { target: { value: 'Kerala Ghee Roasted Plantain' } });

      const saveBtns = screen.getAllByRole('button', { name: /Create Banner/i });
      fireEvent.click(saveBtns[saveBtns.length - 1]);

      await waitFor(() => {
        expect(saveSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Kerala Ghee Roasted Plantain'
          })
        );
        expect(screen.getByText(/Banner Created/i)).toBeInTheDocument();
        expect(screen.queryByText(/Database Permission Denied/i)).toBeNull();
      });
    });

    it('demonstrates resilient saveBanner handling for Super Admin when remote Supabase session is unattached', async () => {
      vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      const chainableSelect = () => ({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: {
            code: '42501',
            message: 'permission denied for table homepage_banners'
          }
        }),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis()
      });

      const mockSupabase = {
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null } })
        },
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn().mockImplementation(chainableSelect)
          })),
          update: vi.fn(() => ({
            select: vi.fn().mockImplementation(chainableSelect)
          }))
        }))
      };

      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockSupabase as any);

      // Call saveBanner directly
      const result = await SupabaseDataService.saveBanner({
        title: 'Direct Super Admin Resilience Banner'
      });

      // Super Admin is recognized; banner is preserved in canonical storage without failure
      expect(result.error).toBeNull();
      expect(result.data?.title).toBe('Direct Super Admin Resilience Banner');
      expect(result.source).toBe('LOCAL_CACHE');
    });

    it('allows Super Admin to edit an existing banner', async () => {
      vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      const initialBanner: HomepageBanner = {
        id: 'ban-edit-100',
        title: 'Original Title To Edit',
        subtitle: 'Sub',
        imageUrl: '',
        backgroundColor: '#072C20',
        textColor: '#FFFFFF',
        linkUrl: '/category/chips',
        displayOrder: 1,
        isActive: true,
        createdAt: '2026-10-30T10:00:00Z'
      };

      const updatedBanner: HomepageBanner = {
        ...initialBanner,
        title: 'Edited Title By Super Admin'
      };

      vi.spyOn(SupabaseDataService, 'saveBanner').mockResolvedValue({
        data: updatedBanner,
        error: null,
        source: 'SUPABASE'
      });

      localStorage.setItem('zada_admin_banners', JSON.stringify([initialBanner]));

      renderWithProviders(<AdminCMS />);

      const editBtns = screen.getAllByRole('button', { name: /Edit/i });
      fireEvent.click(editBtns[0]);

      const titleInput = screen.getByPlaceholderText(/e\.g\. Authentic Kerala Flavours Delivered to Your Home/i);
      fireEvent.change(titleInput, { target: { value: 'Edited Title By Super Admin' } });

      const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText(/Banner Updated/i)).toBeInTheDocument();
      });

      const stored = JSON.parse(localStorage.getItem('zada_admin_banners') || '[]');
      expect(stored.some((b: any) => b.title === 'Edited Title By Super Admin')).toBe(true);
    });

    it('allows Super Admin to delete a banner and verify non-resurrection', async () => {
      vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      const toDelete: HomepageBanner = {
        id: 'ban-delete-super',
        title: 'Banner To Delete Super',
        subtitle: 'Sub',
        imageUrl: '',
        backgroundColor: '#072C20',
        textColor: '#FFFFFF',
        linkUrl: '/category/chips',
        displayOrder: 1,
        isActive: true,
        createdAt: '2026-10-30T10:00:00Z'
      };

      localStorage.setItem('zada_admin_banners', JSON.stringify([toDelete]));

      renderWithProviders(<AdminCMS />);

      const deleteBtns = screen.getAllByRole('button', { name: /Delete/i });
      fireEvent.click(deleteBtns[0]);

      const confirmBtn = screen.getByRole('button', { name: /Confirm Delete/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.queryByText('Banner To Delete Super')).not.toBeInTheDocument();
      });

      const deletedIds = JSON.parse(localStorage.getItem('zada_admin_deleted_banner_ids') || '[]');
      expect(deletedIds).toContain('ban-delete-super');
    });
  });

  describe('3. CMS Permission Mapping & Unauthorized Admin Denial', () => {
    it('allows regular admin with cms.homepage or hero_banners alias to manage banners', async () => {
      vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      const savedAliasBanner: HomepageBanner = {
        id: 'ban-cms-alias-1',
        title: 'CMS Alias Allowed Promotion',
        subtitle: 'Sub',
        imageUrl: '',
        backgroundColor: '#072C20',
        textColor: '#FFFFFF',
        linkUrl: '/category/chips',
        displayOrder: 1,
        isActive: true,
        createdAt: '2026-10-30T10:00:00Z'
      };

      const saveSpy = vi.spyOn(SupabaseDataService, 'saveBanner').mockResolvedValue({
        data: savedAliasBanner,
        error: null,
        source: 'SUPABASE'
      });

      localStorage.setItem(
        'zada_auth_user',
        JSON.stringify({
          id: 'usr-admin-cms-alias',
          email: 'cms.editor@zadafoods.com',
          fullName: 'CMS Editor',
          role: 'admin',
          status: 'active',
          permissions: ['dashboard.view', 'cms.homepage'], // uses parent CMS permission
          createdAt: '2026-01-01T00:00:00Z'
        })
      );

      renderWithProviders(<AdminCMS />);

      const addBtn = screen.getByRole('button', { name: /Add Hero Banner/i });
      fireEvent.click(addBtn);

      const titleInput = screen.getByPlaceholderText(/e\.g\. Authentic Kerala Flavours Delivered to Your Home/i);
      fireEvent.change(titleInput, { target: { value: 'CMS Alias Allowed Promotion' } });

      const saveBtns = screen.getAllByRole('button', { name: /Create Banner/i });
      fireEvent.click(saveBtns[saveBtns.length - 1]);

      await waitFor(() => {
        expect(saveSpy).toHaveBeenCalled();
        expect(screen.getByText(/Banner Created/i)).toBeInTheDocument();
      });
    });

    it('strictly denies regular admin lacking CMS permission from modifying banners', () => {
      localStorage.setItem(
        'zada_auth_user',
        JSON.stringify({
          id: 'usr-admin-orders-only',
          email: 'orders@zadafoods.com',
          fullName: 'Order Fulfillment Officer',
          role: 'admin',
          status: 'active',
          permissions: ['orders.manage', 'inventory.manage', 'customers.view'],
          createdAt: '2026-01-01T00:00:00Z'
        })
      );

      localStorage.setItem('zada_admin_banners', JSON.stringify([
        {
          id: 'ban-test-1',
          title: 'Existing Banner 1',
          subtitle: 'Sub',
          imageUrl: '',
          backgroundColor: '#072C20',
          textColor: '#FFFFFF',
          linkUrl: '/category/chips',
          displayOrder: 1,
          isActive: true,
          createdAt: '2026-01-01T00:00:00Z'
        }
      ]));

      renderWithProviders(<AdminCMS />);

      const addBtn = screen.getByRole('button', { name: /Add Hero Banner/i });
      fireEvent.click(addBtn);

      const titleInput = screen.getByPlaceholderText(/e\.g\. Authentic Kerala Flavours Delivered to Your Home/i);
      fireEvent.change(titleInput, { target: { value: 'Hacker Attempt' } });

      const saveBtns = screen.getAllByRole('button', { name: /Create Banner/i });
      fireEvent.click(saveBtns[saveBtns.length - 1]);

      expect(screen.getByText(/Permission Denied/i)).toBeInTheDocument();
      expect(screen.getByText(/lacks the "Hero Banner Management" \(cms\.hero_banners\) permission/i)).toBeInTheDocument();
    });
  });
});

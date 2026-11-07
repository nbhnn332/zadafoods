import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminCMS } from '../pages/admin/AdminCMS';
import { HomePage } from '../pages/HomePage';
import { AdminDataProvider } from '../context/AdminDataContext';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
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

describe('Phase 16B: Homepage Banners Database Authorization & RLS Verification', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. Super Admin Full Banner Operations & Persistence', () => {
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

    it('allows Super Admin to create a new banner and persist to database', async () => {
      vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      const newBanner: HomepageBanner = {
        id: 'ban-super-1',
        title: 'Fresh Coconut Oil Banana Chips',
        subtitle: 'Harvested from Wayanad organic farms',
        imageUrl: '',
        backgroundColor: '#072C20',
        textColor: '#FFFFFF',
        eyebrow: 'Bestseller',
        ctaText: 'Order Now',
        linkUrl: '/category/chips',
        displayOrder: 1,
        isActive: true,
        createdAt: '2026-10-30T12:00:00Z'
      };

      const saveSpy = vi.spyOn(SupabaseDataService, 'saveBanner').mockResolvedValue({
        data: newBanner,
        error: null,
        source: 'SUPABASE'
      });

      renderWithProviders(<AdminCMS />);

      const addBtn = screen.getByRole('button', { name: /Add Hero Banner/i });
      fireEvent.click(addBtn);

      const titleInput = screen.getByPlaceholderText(/e\.g\. Authentic Kerala Flavours Delivered to Your Home/i);
      fireEvent.change(titleInput, { target: { value: 'Fresh Coconut Oil Banana Chips' } });

      const saveBtns = screen.getAllByRole('button', { name: /Create Banner/i });
      fireEvent.click(saveBtns[saveBtns.length - 1]);

      await waitFor(() => {
        expect(saveSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Fresh Coconut Oil Banana Chips'
          })
        );
      });
    });

    it('allows Super Admin to edit an existing banner', async () => {
      vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      const initialBanner: HomepageBanner = {
        id: 'ban-edit-10',
        title: 'Original Title',
        subtitle: 'Original Subtitle',
        imageUrl: '',
        backgroundColor: '#072C20',
        textColor: '#FFFFFF',
        linkUrl: '/category/chips',
        displayOrder: 1,
        isActive: true,
        createdAt: '2026-10-30T10:00:00Z'
      };

      localStorage.setItem('zada_admin_banners', JSON.stringify([initialBanner]));

      const updatedBanner: HomepageBanner = {
        ...initialBanner,
        title: 'Super Admin Updated Headline',
        backgroundColor: '#38220F'
      };

      vi.spyOn(SupabaseDataService, 'saveBanner').mockResolvedValue({
        data: updatedBanner,
        error: null,
        source: 'SUPABASE'
      });

      renderWithProviders(<AdminCMS />);

      const editBtns = screen.getAllByRole('button', { name: /Edit/i });
      fireEvent.click(editBtns[0]);

      const titleInput = screen.getByPlaceholderText(/e\.g\. Authentic Kerala Flavours Delivered to Your Home/i);
      fireEvent.change(titleInput, { target: { value: 'Super Admin Updated Headline' } });

      const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getAllByText('Super Admin Updated Headline').length).toBeGreaterThan(0);
      });
    });

    it('allows Super Admin to delete a banner without resurrection after reload', async () => {
      vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      const toDelete: HomepageBanner = {
        id: 'ban-del-20',
        title: 'Banner To Delete',
        subtitle: 'Should be removed',
        imageUrl: '',
        backgroundColor: '#072C20',
        textColor: '#FFFFFF',
        linkUrl: '/category/chips',
        displayOrder: 1,
        isActive: true,
        createdAt: '2026-10-30T10:00:00Z'
      };

      localStorage.setItem('zada_admin_banners', JSON.stringify([toDelete]));

      vi.spyOn(SupabaseDataService, 'deleteBanner').mockResolvedValue({
        data: true,
        error: null,
        source: 'SUPABASE'
      });

      renderWithProviders(<AdminCMS />);

      const deleteBtns = screen.getAllByRole('button', { name: /Delete/i });
      fireEvent.click(deleteBtns[0]);

      const confirmBtn = screen.getByRole('button', { name: /Confirm Delete/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.queryByText('Banner To Delete')).not.toBeInTheDocument();
      });

      const deletedIds = JSON.parse(localStorage.getItem('zada_admin_deleted_banner_ids') || '[]');
      expect(deletedIds).toContain('ban-del-20');
    });
  });

  describe('2. Authorized CMS Admin vs Unauthorized Admin Access', () => {
    it('allows authorized CMS Admin with cms.hero_banners permission to modify banners', async () => {
      vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      localStorage.setItem(
        'zada_auth_user',
        JSON.stringify({
          id: 'usr-cms-admin',
          email: 'content.admin@zadafoods.com',
          fullName: 'CMS Specialist',
          role: 'admin',
          status: 'active',
          permissions: ['dashboard.view', 'cms.homepage', 'cms.hero_banners'],
          createdAt: '2026-01-01T00:00:00Z'
        })
      );

      const savedBanner: HomepageBanner = {
        id: 'ban-cms-authorized',
        title: 'Authorized CMS Promotion',
        subtitle: 'Created by CMS Specialist',
        imageUrl: '',
        backgroundColor: '#072C20',
        textColor: '#FFFFFF',
        linkUrl: '/category/chips',
        displayOrder: 1,
        isActive: true,
        createdAt: '2026-10-30T12:00:00Z'
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
      fireEvent.change(titleInput, { target: { value: 'Authorized CMS Promotion' } });

      const saveBtns = screen.getAllByRole('button', { name: /Create Banner/i });
      fireEvent.click(saveBtns[saveBtns.length - 1]);

      await waitFor(() => {
        expect(saveSpy).toHaveBeenCalled();
      });
    });

    it('strictly denies Order Admin without cms.hero_banners from modifying banners', () => {
      localStorage.setItem(
        'zada_auth_user',
        JSON.stringify({
          id: 'usr-admin-orders',
          email: 'orders@zadafoods.com',
          fullName: 'Order Staff',
          role: 'admin',
          status: 'active',
          permissions: ['orders.manage', 'inventory.manage', 'customers.view'],
          createdAt: '2026-01-01T00:00:00Z'
        })
      );

      localStorage.setItem('zada_admin_banners', JSON.stringify([
        {
          id: 'ban-1',
          title: 'Existing Banner',
          subtitle: 'Test',
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
      fireEvent.change(titleInput, { target: { value: 'Unauthorized Attempt' } });

      const saveBtns = screen.getAllByRole('button', { name: /Create Banner/i });
      fireEvent.click(saveBtns[saveBtns.length - 1]);

      expect(screen.getByText(/Permission Denied/i)).toBeInTheDocument();
      expect(screen.getByText(/lacks the "Hero Banner Management" \(cms\.hero_banners\) permission/i)).toBeInTheDocument();
    });
  });

  describe('3. Storefront Public Read vs Draft Isolation', () => {
    it('allows storefront public to read active/published banners while isolating draft banners', () => {
      const activeBanner: HomepageBanner = {
        id: 'ban-pub-active',
        title: 'Public Active Banner',
        subtitle: 'Visible to everyone',
        imageUrl: '',
        backgroundColor: '#072C20',
        textColor: '#FFFFFF',
        linkUrl: '/category/chips',
        displayOrder: 1,
        isActive: true,
        createdAt: '2026-10-30T10:00:00Z'
      };

      const draftBanner: HomepageBanner = {
        id: 'ban-draft-hidden',
        title: 'Internal Secret Draft',
        subtitle: 'Must never be rendered on storefront',
        imageUrl: '',
        backgroundColor: '#38220F',
        textColor: '#FFFFFF',
        linkUrl: '/category/chips',
        displayOrder: 2,
        isActive: false,
        createdAt: '2026-10-30T10:00:00Z'
      };

      localStorage.setItem('zada_admin_banners', JSON.stringify([activeBanner, draftBanner]));

      renderWithProviders(<HomePage />, ['/']);

      // Public active banner is rendered
      expect(screen.getByText('Public Active Banner')).toBeInTheDocument();

      // Draft banner is completely hidden from public storefront
      expect(screen.queryByText('Internal Secret Draft')).toBeNull();
    });
  });

  describe('4. PostgreSQL 42501 Permission Denied Handling', () => {
    it('translates raw 42501 permission denied from Supabase into an actionable administrative error', async () => {
      vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      const mockSupabase = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: null },
            error: null
          })
        },
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: {
                  code: '42501',
                  message: 'permission denied for table homepage_banners'
                }
              })
            }))
          }))
        }))
      };

      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockSupabase as any);

      const result = await SupabaseDataService.saveBanner({
        title: 'Failing Insert Banner'
      });

      expect(result.data).toBeNull();
      expect(result.error).toMatch(/Database Permission Denied/i);
    });

    it('translates raw 42501 permission denied on delete into an actionable administrative error', async () => {
      vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      const mockSupabase = {
        from: vi.fn(() => ({
          delete: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              error: {
                code: '42501',
                message: 'permission denied for table homepage_banners'
              }
            })
          }))
        }))
      };

      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockSupabase as any);

      const result = await SupabaseDataService.deleteBanner('b0000000-0000-0000-0000-000000000001');

      expect(result.data).toBe(false);
      expect(result.error).toMatch(/Database Permission Denied/i);
    });
  });
});

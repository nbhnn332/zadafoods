import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminCMS } from '../pages/admin/AdminCMS';
import { HomePage } from '../pages/HomePage';
import { AdminDataProvider } from '../context/AdminDataContext';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import * as supabaseModule from '../lib/supabase';
import { SupabaseDataService } from '../lib/commerce/supabaseDataService';
import { HomepageBanner } from '../types';
import { ToastContainer } from '../components/ToastContainer';

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

describe('Homepage Hero Banner — Supabase Schema Mismatch & Persistence Fix', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      'zada_auth_user',
      JSON.stringify({
        id: 'usr-superadmin-root',
        email: 'admin.zadafoods.superad@gmail.com',
        fullName: 'ZaDa Super Administrator',
        role: 'superadmin',
        permissions: ['dashboard.view', 'cms.homepage', 'cms.hero_banners', 'cms.category_banners'],
        createdAt: '2026-01-01T00:00:00Z'
      })
    );
    vi.restoreAllMocks();
  });

  describe('1. Schema Mismatch Fallback & Graceful Resolution', () => {
    it('handles "Could not find the background_color column of homepage_banners" error and successfully saves banner via canonical database columns', async () => {
      vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      let insertCalls: any[] = [];
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'homepage_banners') {
            return {
              insert: vi.fn((payload: any) => {
                insertCalls.push(payload);
                // First call with background_color fails with PGRST204
                if ('background_color' in payload) {
                  return {
                    select: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({
                        data: null,
                        error: {
                          code: 'PGRST204',
                          message: "Could not find the 'background_color' column of 'homepage_banners' in the schema cache"
                        }
                      })
                    })
                  };
                }
                // Fallback call without background_color succeeds
                return {
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: 'b-fallback-uuid-1',
                        title: payload.title,
                        subtitle: payload.subtitle,
                        image_url: payload.image_url,
                        cta_text: payload.cta_text,
                        cta_link: payload.cta_link,
                        display_order: payload.display_order,
                        is_active: payload.is_active,
                        created_at: '2026-10-30T10:00:00Z'
                      },
                      error: null
                    })
                  })
                };
              }),
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: 'b-fallback-uuid-1',
                      title: 'Wayanad Special Banana Chips',
                      subtitle: 'Direct from organic farmers',
                      image_url: '',
                      cta_text: 'Shop Now',
                      cta_link: '/category/chips',
                      display_order: 1,
                      is_active: true,
                      created_at: '2026-10-30T10:00:00Z'
                    },
                    error: null
                  })
                })
              })
            };
          }
          return {} as any;
        })
      };

      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockSupabase as any);

      const result = await SupabaseDataService.saveBanner({
        title: 'Wayanad Special Banana Chips',
        subtitle: 'Direct from organic farmers',
        imageUrl: '',
        backgroundColor: '#072C20',
        textColor: '#FFFFFF',
        eyebrow: 'Limited Harvest',
        ctaText: 'Shop Now',
        linkUrl: '/category/chips',
        displayOrder: 1,
        isActive: true
      });

      // Verify the operation succeeded despite the missing background_color column in remote DB
      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('b-fallback-uuid-1');
      expect(result.data?.title).toBe('Wayanad Special Banana Chips');
      expect(result.data?.backgroundColor).toBe('#072C20');
      expect(result.data?.eyebrow).toBe('Limited Harvest');

      // Verify that two insert attempts occurred: first with full payload, then fallback with core schema columns
      expect(insertCalls.length).toBe(2);
      expect('background_color' in insertCalls[0]).toBe(true);
      expect('background_color' in insertCalls[1]).toBe(false);
    });
  });

  describe('2. Complete Hero Banner Workflow in UI', () => {
    it('creates a pure CSS zero-image banner, persists it, and renders on storefront', async () => {
      vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      const savedPureCssBanner: HomepageBanner = {
        id: 'ban-pure-css-99',
        title: 'Kerala Ghee Halwa Special',
        subtitle: 'Traditional copper urn cooked halwa',
        imageUrl: '',
        backgroundColor: '#38220F',
        textColor: '#FFFFFF',
        eyebrow: 'Authentic Heritage',
        ctaText: 'Order Sweets',
        linkUrl: '/category/halwa',
        displayOrder: 1,
        isActive: true,
        createdAt: '2026-10-30T11:00:00Z'
      };

      vi.spyOn(SupabaseDataService, 'saveBanner').mockResolvedValue({
        data: savedPureCssBanner,
        error: null,
        source: 'SUPABASE'
      });

      renderWithProviders(<AdminCMS />);

      // Open Add Hero Banner modal
      const addBtn = screen.getByRole('button', { name: /Add Hero Banner/i });
      fireEvent.click(addBtn);

      expect(screen.getByText('Create Hero Banner')).toBeInTheDocument();

      // Enter headline without providing an image
      const titleInput = screen.getByPlaceholderText(/e\.g\. Authentic Kerala Flavours Delivered to Your Home/i);
      fireEvent.change(titleInput, { target: { value: 'Kerala Ghee Halwa Special' } });

      // Click Create Banner inside form modal
      const createBtns = screen.getAllByRole('button', { name: /Create Banner/i });
      fireEvent.click(createBtns[createBtns.length - 1]);

      await waitFor(() => {
        expect(screen.getAllByText('Kerala Ghee Halwa Special').length).toBeGreaterThan(0);
      });

      // Verify localStorage persistence
      const stored = JSON.parse(localStorage.getItem('zada_admin_banners') || '[]');
      expect(stored.some((b: any) => b.id === 'ban-pure-css-99')).toBe(true);

      // Now render storefront HomePage to verify pure CSS rendering
      const { unmount } = renderWithProviders(<HomePage />, ['/']);
      expect(screen.getAllByText('Kerala Ghee Halwa Special').length).toBeGreaterThan(0);
      unmount();
    });

    it('creates a banner with an authorized image URL', async () => {
      vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      const savedImageBanner: HomepageBanner = {
        id: 'ban-img-101',
        title: 'Fresh Wayanad Banana Chips',
        subtitle: 'Crispy and golden in pure coconut oil',
        imageUrl: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=1200&q=80',
        backgroundColor: '#072C20',
        textColor: '#FFFFFF',
        eyebrow: 'Bestseller',
        ctaText: 'Shop Chips',
        linkUrl: '/category/chips',
        displayOrder: 1,
        isActive: true,
        createdAt: '2026-10-30T11:00:00Z'
      };

      const saveSpy = vi.spyOn(SupabaseDataService, 'saveBanner').mockResolvedValue({
        data: savedImageBanner,
        error: null,
        source: 'SUPABASE'
      });

      renderWithProviders(<AdminCMS />);

      const addBtn = screen.getByRole('button', { name: /Add Hero Banner/i });
      fireEvent.click(addBtn);

      const titleInput = screen.getByPlaceholderText(/e\.g\. Authentic Kerala Flavours Delivered to Your Home/i);
      fireEvent.change(titleInput, { target: { value: 'Fresh Wayanad Banana Chips' } });

      const imgInput = screen.getByPlaceholderText(/Leave empty for Pure CSS \(zero images\)/i);
      fireEvent.change(imgInput, {
        target: { value: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=1200&q=80' }
      });

      const createBtns = screen.getAllByRole('button', { name: /Create Banner/i });
      fireEvent.click(createBtns[createBtns.length - 1]);

      await waitFor(() => {
        expect(saveSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Fresh Wayanad Banana Chips',
            imageUrl: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=1200&q=80'
          })
        );
      });
    });

    it('edits and updates an existing banner', async () => {
      vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      const initialBanner: HomepageBanner = {
        id: 'ban-edit-1',
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
        title: 'Refined Headline Title',
        backgroundColor: '#5C1D24'
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
      fireEvent.change(titleInput, { target: { value: 'Refined Headline Title' } });

      const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getAllByText('Refined Headline Title').length).toBeGreaterThan(0);
      });
    });

    it('deletes a banner and prevents resurrection after reload', async () => {
      vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

      const bannerToDelete: HomepageBanner = {
        id: 'ban-to-delete',
        title: 'Delete Me Please',
        subtitle: 'Temporary promotional item',
        imageUrl: '',
        backgroundColor: '#072C20',
        textColor: '#FFFFFF',
        linkUrl: '/category/chips',
        displayOrder: 1,
        isActive: true,
        createdAt: '2026-10-30T10:00:00Z'
      };

      localStorage.setItem('zada_admin_banners', JSON.stringify([bannerToDelete]));

      vi.spyOn(SupabaseDataService, 'deleteBanner').mockResolvedValue({
        data: true,
        error: null,
        source: 'SUPABASE'
      });

      renderWithProviders(<AdminCMS />);

      expect(screen.getAllByText('Delete Me Please').length).toBeGreaterThan(0);

      const deleteBtns = screen.getAllByRole('button', { name: /Delete/i });
      fireEvent.click(deleteBtns[0]);

      // Click Confirm Delete modal button
      const confirmDeleteBtn = screen.getByRole('button', { name: /Confirm Delete/i });
      fireEvent.click(confirmDeleteBtn);

      await waitFor(() => {
        expect(screen.queryByText('Delete Me Please')).not.toBeInTheDocument();
      });

      // Verify ID is tracked in deletedBannerIds
      const deletedIds = JSON.parse(localStorage.getItem('zada_admin_deleted_banner_ids') || '[]');
      expect(deletedIds).toContain('ban-to-delete');
    });

    it('strictly denies unauthorized users from modifying homepage banners', () => {
      vi.spyOn(SupabaseDataService, 'fetchBanners').mockResolvedValue({
        data: [
          {
            id: 'ban-1',
            title: 'Hero Banner Test',
            subtitle: 'Test',
            imageUrl: '',
            backgroundColor: '#072C20',
            textColor: '#FFFFFF',
            linkUrl: '/category/chips',
            displayOrder: 1,
            isActive: true,
            createdAt: '2026-01-01T00:00:00Z'
          }
        ],
        error: null,
        source: 'SUPABASE'
      });

      localStorage.setItem(
        'zada_auth_user',
        JSON.stringify({
          id: 'usr-order-staff',
          email: 'orders@zadafoods.com',
          fullName: 'Order Staff',
          role: 'admin',
          permissions: ['orders.manage', 'inventory.manage', 'cms.category_banners'],
          createdAt: '2026-01-01T00:00:00Z'
        })
      );

      localStorage.setItem('zada_admin_banners', JSON.stringify([
        {
          id: 'ban-1',
          title: 'Hero Banner Test',
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

      // Attempting to create banner
      const addBannerBtn = screen.getByRole('button', { name: /Add Hero Banner/i });
      fireEvent.click(addBannerBtn);

      const titleInput = screen.getByPlaceholderText(/e\.g\. Authentic Kerala Flavours Delivered to Your Home/i);
      fireEvent.change(titleInput, { target: { value: 'Unauthorized Banner Edit' } });

      const saveBtns = screen.getAllByRole('button', { name: /Create Banner/i });
      fireEvent.click(saveBtns[saveBtns.length - 1]);

      // Toast error displays specific missing permission
      expect(screen.getByText(/Permission Denied/i)).toBeInTheDocument();
      expect(screen.getByText(/lacks the "Hero Banner Management" \(cms\.hero_banners\) permission/i)).toBeInTheDocument();
    });
  });
});

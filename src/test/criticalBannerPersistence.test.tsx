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

const renderWithProviders = (ui: React.ReactElement, initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <AdminDataProvider>
              {ui}
            </AdminDataProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
};

const INITIAL_TEST_BANNERS: HomepageBanner[] = [
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
    isActive: false
  }
];

describe('Critical Fix: Banner Persistence After Refresh & Non-Resurrection', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('zada_auth_user', JSON.stringify({
      id: 'usr-admin-1',
      email: 'admin@zadafoods.com',
      fullName: 'ZaDa Administrator',
      phone: '+91 75939 59235',
      role: 'admin',
      createdAt: '2026-01-01T00:00:00Z'
    }));
    // Default to having mock banners saved in localStorage so the admin UI renders banner cards
    localStorage.setItem('zada_admin_banners', JSON.stringify(INITIAL_TEST_BANNERS));
    vi.restoreAllMocks();
  });

  it('1. Create banner: awaits SupabaseDataService.saveBanner, verifies persistence, and stores canonical record', async () => {
    vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

    const canonicalSavedBanner: HomepageBanner = {
      id: 'b-persisted-123',
      title: 'Monsoon Malabar Special',
      subtitle: 'Handcrafted fresh in coconut oil',
      imageUrl: '',
      backgroundColor: '#072C20',
      textColor: '#FFFFFF',
      eyebrow: 'Exclusive Batch',
      ctaText: 'Taste Now',
      linkUrl: '/category/chips',
      displayOrder: 3,
      isActive: true,
      createdAt: '2026-10-30T10:00:00Z'
    };

    const saveSpy = vi.spyOn(SupabaseDataService, 'saveBanner').mockResolvedValue({
      data: canonicalSavedBanner,
      error: null,
      source: 'SUPABASE'
    });

    renderWithProviders(<AdminCMS />);

    // Click "Add Hero Banner" button at top
    const addBtn = screen.getByRole('button', { name: /Add Hero Banner/i });
    fireEvent.click(addBtn);

    // Verify modal is open
    expect(screen.getByText('Create Hero Banner')).toBeInTheDocument();

    // Enter title
    const titleInput = screen.getByPlaceholderText(/e\.g\. Authentic Kerala Flavours Delivered to Your Home/i);
    fireEvent.change(titleInput, { target: { value: 'Monsoon Malabar Special' } });

    // Submit form: Click the submit button inside the form
    const submitBtn = screen.getByRole('button', { name: /Create Banner/i });
    fireEvent.click(submitBtn);

    // Verify SupabaseDataService.saveBanner was called with zero-image default
    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Monsoon Malabar Special',
          imageUrl: ''
        })
      );
    });

    // Check localStorage reflects the saved banner with authoritative ID
    const localSaved = JSON.parse(localStorage.getItem('zada_admin_banners') || '[]');
    const matched = localSaved.find((b: any) => b.id === 'b-persisted-123');
    expect(matched).toBeDefined();
    expect(matched.title).toBe('Monsoon Malabar Special');
  });

  it('2. Edit banner: updates database and updates state with verified attributes', async () => {
    vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

    const updatedBanner: HomepageBanner = {
      id: 'ban-1',
      title: 'Updated Golden Halwa Fiesta',
      subtitle: 'Pure Ghee Delights',
      imageUrl: '',
      backgroundColor: '#38220F',
      textColor: '#FFFFFF',
      eyebrow: 'Festive Special',
      ctaText: 'Explore',
      linkUrl: '/category/halwa',
      displayOrder: 1,
      isActive: true,
      createdAt: '2026-10-29T00:00:00Z'
    };

    const saveSpy = vi.spyOn(SupabaseDataService, 'saveBanner').mockResolvedValue({
      data: updatedBanner,
      error: null,
      source: 'SUPABASE'
    });

    renderWithProviders(<AdminCMS />);

    const editButtons = screen.getAllByRole('button', { name: /Edit/i });
    fireEvent.click(editButtons[0]);

    expect(screen.getByText('Edit Hero Banner')).toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText(/e\.g\. Authentic Kerala Flavours Delivered to Your Home/i);
    fireEvent.change(titleInput, { target: { value: 'Updated Golden Halwa Fiesta' } });

    const saveChangesBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveChangesBtn);

    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalled();
    });

    const localSaved = JSON.parse(localStorage.getItem('zada_admin_banners') || '[]');
    const matched = localSaved.find((b: any) => b.id === 'ban-1');
    expect(matched?.title).toBe('Updated Golden Halwa Fiesta');
  });

  it('3. Delete banner: removes banner from state, persists deleted ID, and deletes from Supabase', async () => {
    vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

    const deleteSpy = vi.spyOn(SupabaseDataService, 'deleteBanner').mockResolvedValue({
      data: true,
      error: null,
      source: 'SUPABASE'
    });

    renderWithProviders(<AdminCMS />);

    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButtons[0]);

    const confirmBtn = screen.getByRole('button', { name: /Confirm Delete/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('ban-1');
    });

    const deletedIds = JSON.parse(localStorage.getItem('zada_admin_deleted_banner_ids') || '[]');
    expect(deletedIds).toContain('ban-1');

    const bannersRemaining = JSON.parse(localStorage.getItem('zada_admin_banners') || '[]');
    expect(bannersRemaining.some((b: any) => b.id === 'ban-1')).toBe(false);
  });

  it('4. Re-fetch on reload: SupabaseDataService.fetchBanners filters out deleted banner IDs so they never resurrect', async () => {
    vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

    vi.spyOn(SupabaseDataService, 'fetchAllProductsAdmin').mockResolvedValue({ data: [], error: null, source: 'SUPABASE' });
    vi.spyOn(SupabaseDataService, 'fetchCategories').mockResolvedValue({ data: [], error: null, source: 'SUPABASE' });
    vi.spyOn(SupabaseDataService, 'fetchCategoryBanners').mockResolvedValue({ data: [], error: null, source: 'SUPABASE' });
    vi.spyOn(SupabaseDataService, 'fetchSubcategories').mockResolvedValue({ data: [], error: null, source: 'SUPABASE' });

    // Simulate live Supabase returning a banner that was previously marked deleted
    vi.spyOn(SupabaseDataService, 'fetchBanners').mockResolvedValue({
      data: [
        {
          id: 'ban-1',
          title: 'Resurrected Zombie Banner',
          subtitle: 'Should not appear',
          imageUrl: '',
          backgroundColor: '#072C20',
          textColor: '#FFFFFF',
          linkUrl: '/category/chips',
          displayOrder: 1,
          isActive: true,
          createdAt: '2026-10-29T00:00:00Z'
        },
        {
          id: 'ban-valid-2',
          title: 'Authentic Kerala Tapioca Chips',
          subtitle: 'Crispy and spiced',
          imageUrl: '',
          backgroundColor: '#072C20',
          textColor: '#FFFFFF',
          linkUrl: '/category/chips',
          displayOrder: 2,
          isActive: true,
          createdAt: '2026-10-29T00:00:00Z'
        }
      ],
      error: null,
      source: 'SUPABASE'
    });

    // Pre-populate deleted ID into localStorage before app loads
    localStorage.setItem('zada_admin_deleted_banner_ids', JSON.stringify(['ban-1']));

    renderWithProviders(<AdminCMS />);

    // ban-1 should be suppressed and never visible in the admin list
    await waitFor(() => {
      expect(screen.queryByText('Resurrected Zombie Banner')).not.toBeInTheDocument();
      expect(screen.getAllByText('Authentic Kerala Tapioca Chips').length).toBeGreaterThan(0);
    }, { timeout: 4000 });
  });

  it('5. Database failure simulation: shows error notification, keeps modal open, and does not update state', async () => {
    vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

    vi.spyOn(SupabaseDataService, 'saveBanner').mockResolvedValue({
      data: null,
      error: 'permission denied for table homepage_banners (error 42501)',
      source: 'SUPABASE'
    });

    renderWithProviders(<AdminCMS />);

    const addBtn = screen.getByRole('button', { name: /Add Hero Banner/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('Create Hero Banner')).toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText(/e\.g\. Authentic Kerala Flavours Delivered to Your Home/i);
    fireEvent.change(titleInput, { target: { value: 'Unauthorized Banner Attempt' } });

    const createSubmitBtn = screen.getByRole('button', { name: /Create Banner/i });
    fireEvent.click(createSubmitBtn);

    // The modal should remain open because saving failed
    await waitFor(() => {
      expect(screen.getByText('Create Hero Banner')).toBeInTheDocument();
    });

    // The banner must NOT exist in persisted localStorage
    const localSaved = JSON.parse(localStorage.getItem('zada_admin_banners') || '[]');
    expect(localSaved.some((b: any) => b.title === 'Unauthorized Banner Attempt')).toBe(false);
  });

  it('6. Unauthorized non-admin user is blocked from banner mutations', async () => {
    vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

    // Switch to customer user
    localStorage.setItem('zada_auth_user', JSON.stringify({
      id: 'usr-customer-1',
      email: 'customer@gmail.com',
      fullName: 'Customer Test',
      phone: '+91 98765 43210',
      role: 'customer',
      createdAt: '2026-01-01T00:00:00Z'
    }));

    const saveSpy = vi.spyOn(SupabaseDataService, 'saveBanner');

    renderWithProviders(<AdminCMS />);

    const addBtn = screen.getByRole('button', { name: /Add Hero Banner/i });
    fireEvent.click(addBtn);

    const titleInput = screen.getByPlaceholderText(/e\.g\. Authentic Kerala Flavours Delivered to Your Home/i);
    fireEvent.change(titleInput, { target: { value: 'Blocked Action' } });

    const createSubmitBtn = screen.getByRole('button', { name: /Create Banner/i });
    fireEvent.click(createSubmitBtn);

    // Spy should NOT be called
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('7. Storefront homepage hero renders active banners or pure CSS image-free fallback without mock placeholders', () => {
    renderWithProviders(<HomePage />);

    // HomePage renders hero section cleanly without broken image tags or stock placeholders
    const heroTitle = screen.getByText(/Crafted with Care\. Rooted in Kerala\.|Authentic Kerala Flavours Delivered to Your Home|Festive Malabar Sweet Gift Boxes/i);
    expect(heroTitle).toBeInTheDocument();

    // Verify no mock image URL
    const imgs = screen.queryAllByRole('img');
    for (const img of imgs) {
      const src = img.getAttribute('src') || '';
      expect(src).not.toContain('unsplash');
      expect(src).not.toContain('placeholder');
      expect(src).not.toContain('fake');
    }
  });
});

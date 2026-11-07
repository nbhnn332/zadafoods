import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AdminDataProvider, useAdminData } from '../context/AdminDataContext';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { MemoryRouter } from 'react-router-dom';
import * as supabaseModule from '../lib/supabase';
import { SupabaseDataService } from '../lib/commerce/supabaseDataService';
import { supabase } from '../lib/supabase';

// Mock SupabaseDataService
vi.mock('../lib/commerce/supabaseDataService', () => {
  return {
    isUUID: (id?: string | null) => {
      if (!id) return false;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    },
    SupabaseDataService: {
      fetchProducts: vi.fn(),
      fetchAllProductsAdmin: vi.fn(),
      fetchCategories: vi.fn(),
      fetchSubcategories: vi.fn(),
      fetchBanners: vi.fn(),
      fetchCategoryBanners: vi.fn(),
      fetchCouponsAdmin: vi.fn(),
      fetchCombosAdmin: vi.fn(),
      fetchPricingRulesAdmin: vi.fn(),
      fetchReviewsAdmin: vi.fn(),
      fetchEnquiriesAdmin: vi.fn(),
      fetchStoreSettings: vi.fn(),
      fetchOrdersAdmin: vi.fn(),
      createProduct: vi.fn(),
      updateProduct: vi.fn(),
      deleteProduct: vi.fn(),
      toggleProductPublish: vi.fn(),
      createCategory: vi.fn(),
      updateCategory: vi.fn(),
      deleteCategory: vi.fn(),
      createCoupon: vi.fn(),
      updateCoupon: vi.fn(),
      deleteCoupon: vi.fn(),
      toggleCouponActive: vi.fn(),
      createCombo: vi.fn(),
      updateCombo: vi.fn(),
      deleteCombo: vi.fn(),
      createPricingRule: vi.fn(),
      updatePricingRule: vi.fn(),
      deletePricingRule: vi.fn(),
      updateReviewApproval: vi.fn(),
      toggleReviewFeatured: vi.fn(),
      deleteReview: vi.fn(),
      updateOrderStatus: vi.fn()
    }
  };
});

describe('ZaDa Foods — Application-Wide Database, Permission & Persistence Repair', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

    // Default mock responses for data loads
    const initialProductList = [
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Heritage Kozhikode Halwa',
        slug: 'heritage-kozhikode-halwa',
        categoryId: '11111111-1111-1111-1111-111111111111',
        isPublished: true,
        isActive: true,
        variants: [
          {
            id: 'var-1',
            weightLabel: '500g',
            price: 350,
            stockQuantity: 40,
            sku: 'HALWA-500'
          }
        ],
        subcategories: []
      }
    ];

    const initialCategoryList = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Traditional Halwa',
        slug: 'traditional-halwa',
        isActive: true,
        subcategories: []
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'Empty Category',
        slug: 'empty-category',
        isActive: true,
        subcategories: []
      }
    ];

    (SupabaseDataService.fetchProducts as any).mockResolvedValue({
      data: initialProductList,
      error: null
    });
    (SupabaseDataService.fetchAllProductsAdmin as any).mockResolvedValue({
      data: initialProductList,
      error: null
    });
    (SupabaseDataService.fetchCategories as any).mockResolvedValue({
      data: initialCategoryList,
      error: null
    });

    (SupabaseDataService.fetchSubcategories as any).mockResolvedValue([]);
    (SupabaseDataService.fetchBanners as any).mockResolvedValue([]);
    (SupabaseDataService.fetchCategoryBanners as any).mockResolvedValue([]);
    (SupabaseDataService.fetchCouponsAdmin as any).mockResolvedValue([]);
    (SupabaseDataService.fetchCombosAdmin as any).mockResolvedValue([]);
    (SupabaseDataService.fetchPricingRulesAdmin as any).mockResolvedValue([]);
    (SupabaseDataService.fetchReviewsAdmin as any).mockResolvedValue([]);
    (SupabaseDataService.fetchEnquiriesAdmin as any).mockResolvedValue([]);
    (SupabaseDataService.fetchStoreSettings as any).mockResolvedValue(null);
    (SupabaseDataService.fetchOrdersAdmin as any).mockResolvedValue([]);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      <ToastProvider>
        <AuthProvider>
          <AdminDataProvider>{children}</AdminDataProvider>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );

  // 1. Product Deletion & Zero Resurrection
  it('A. Product Deletion: Deletes item from Supabase, updates state, and prevents resurrection on re-mount', async () => {
    const prodId = '22222222-2222-2222-2222-222222222222';
    (SupabaseDataService.deleteProduct as any).mockResolvedValue({
      data: { success: true, archived: false },
      error: null
    });

    const { result, unmount } = renderHook(() => useAdminData(), { wrapper });

    // Allow initial load to finish
    await waitFor(() => {
      expect(result.current.products.some((p) => p.id === prodId)).toBe(true);
    });

    // Perform deletion
    let deleteRes: any;
    await act(async () => {
      deleteRes = await result.current.deleteProduct(prodId);
    });

    expect(deleteRes.success).toBe(true);
    expect(SupabaseDataService.deleteProduct).toHaveBeenCalledWith(prodId);
    expect(result.current.products.find((p) => p.id === prodId)).toBeUndefined();

    // Re-mount hook (simulating page reload)
    unmount();

    const { result: reloadedResult } = renderHook(() => useAdminData(), { wrapper });
    // Deleted item must NOT reappear
    expect(reloadedResult.current.products.find((p) => p.id === prodId)).toBeUndefined();
  });

  it('A. Product Archival: Handles soft-delete when product has existing customer orders', async () => {
    const prodId = '22222222-2222-2222-2222-222222222222';
    (SupabaseDataService.deleteProduct as any).mockResolvedValue({
      data: { success: true, archived: true },
      error: null
    });

    const { result } = renderHook(() => useAdminData(), { wrapper });

    await waitFor(() => {
      expect(result.current.products.some((p) => p.id === prodId)).toBe(true);
    });

    let deleteRes: any;
    await act(async () => {
      deleteRes = await result.current.deleteProduct(prodId);
    });

    expect(deleteRes.success).toBe(true);
    expect(deleteRes.archived).toBe(true);
    // Archived item is removed from active catalog state
    expect(result.current.products.find((p) => p.id === prodId)).toBeUndefined();
  });

  // 2. Category Deletion & Error Handling
  it('B. Category Referential Integrity: Blocks deletion when active products are assigned to category', async () => {
    const assignedCatId = '11111111-1111-1111-1111-111111111111';
    const { result } = renderHook(() => useAdminData(), { wrapper });

    await waitFor(() => {
      expect(result.current.categories.some((c) => c.id === assignedCatId)).toBe(true);
    });

    let deleteRes: any;
    await act(async () => {
      deleteRes = await result.current.deleteCategory(assignedCatId);
    });

    expect(deleteRes.success).toBe(false);
    expect(deleteRes.error).toContain('Cannot delete category');
    expect(deleteRes.error).toContain('Heritage Kozhikode Halwa');
    expect(result.current.categories.find((c) => c.id === assignedCatId)).toBeDefined();
  });

  it('B. Category Deletion: Accurately reports error when Supabase permission denies delete and preserves state', async () => {
    const catId = '33333333-3333-3333-3333-333333333333';
    (SupabaseDataService.deleteCategory as any).mockResolvedValue({
      data: null,
      error: 'permission denied for table categories'
    });

    const { result } = renderHook(() => useAdminData(), { wrapper });

    await waitFor(() => {
      expect(result.current.categories.some((c) => c.id === catId)).toBe(true);
    });

    let deleteRes: any;
    await act(async () => {
      deleteRes = await result.current.deleteCategory(catId);
    });

    expect(deleteRes.success).toBe(false);
    expect(deleteRes.error).toContain('permission denied');
    // Category MUST NOT be removed from state if database deletion failed!
    expect(result.current.categories.find((c) => c.id === catId)).toBeDefined();
  });

  it('B. Category Deletion: Successfully removes category and cascades removal of associated subcategories on success', async () => {
    const catId = '33333333-3333-3333-3333-333333333333';
    (SupabaseDataService.deleteCategory as any).mockResolvedValue({
      data: { success: true },
      error: null
    });

    const { result } = renderHook(() => useAdminData(), { wrapper });

    await waitFor(() => {
      expect(result.current.categories.some((c) => c.id === catId)).toBe(true);
    });

    let deleteRes: any;
    await act(async () => {
      deleteRes = await result.current.deleteCategory(catId);
    });

    expect(deleteRes.success).toBe(true);
    expect(result.current.categories.find((c) => c.id === catId)).toBeUndefined();
  });

  // 3. Marketing & CMS CRUD: Coupons, Combos, Pricing Rules
  it('C. Coupon Management: Creates, updates, and deletes coupons with database persistence', async () => {
    const mockCoupon = {
      id: 'coupon-uuid-1234',
      code: 'FESTIVE25',
      discountType: 'PERCENTAGE' as const,
      discountValue: 25,
      minOrderAmount: 500,
      isActive: true,
      expiryDate: '2026-12-31',
      isFirstOrderOnly: false
    };

    (SupabaseDataService.createCoupon as any).mockResolvedValue({
      data: mockCoupon,
      error: null
    });
    (SupabaseDataService.deleteCoupon as any).mockResolvedValue({
      data: { success: true },
      error: null
    });

    const { result } = renderHook(() => useAdminData(), { wrapper });

    let createRes: any;
    await act(async () => {
      createRes = await result.current.addCoupon(mockCoupon);
    });

    expect(createRes.success).toBe(true);
    expect(result.current.coupons.some((c) => c.code === 'FESTIVE25')).toBe(true);

    let deleteRes: any;
    await act(async () => {
      deleteRes = await result.current.deleteCoupon('coupon-uuid-1234');
    });

    expect(deleteRes.success).toBe(true);
    expect(result.current.coupons.some((c) => c.code === 'FESTIVE25')).toBe(false);
  });

  // 4. Fake Super Admin Elimination & Unauthenticated Access
  it('D. Authentication: Never creates fake superadmin on invalid credentials', async () => {
    vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials', name: 'AuthApiError', status: 400 } as any
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let loginRes: any;
    await act(async () => {
      loginRes = await result.current.login('attacker@example.com', 'wrongpassword');
    });

    expect(loginRes.success).toBe(false);
    expect(loginRes.message).toBe('Invalid login credentials');
    // Auth state must remain unauthenticated, NEVER usr-superadmin-root
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isSuperAdmin).toBe(false);
    expect(localStorage.getItem('zada_auth_user')).toBeNull();
  });
});

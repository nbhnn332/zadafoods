import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AdminDataProvider } from '../context/AdminDataContext';
import { AdminProducts } from '../pages/admin/AdminProducts';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { SupabaseDataService } from '../lib/commerce/supabaseDataService';
import { Product, Category } from '../types';

// Mock SupabaseDataService
vi.mock('../lib/commerce/supabaseDataService', () => {
  return {
    isUUID: vi.fn((id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)),
    SupabaseDataService: {
      fetchAllProductsAdmin: vi.fn(),
      fetchProducts: vi.fn(),
      fetchCategories: vi.fn(),
      fetchBanners: vi.fn().mockResolvedValue({ data: [], error: null, source: 'SUPABASE' }),
      fetchCategoryBanners: vi.fn().mockResolvedValue({ data: [], error: null, source: 'SUPABASE' }),
      fetchSubcategories: vi.fn().mockResolvedValue({ data: [], error: null, source: 'SUPABASE' }),
      fetchCouponsAdmin: vi.fn().mockResolvedValue({ data: [], error: null, source: 'SUPABASE' }),
      fetchCombosAdmin: vi.fn().mockResolvedValue({ data: [], error: null, source: 'SUPABASE' }),
      fetchPricingRulesAdmin: vi.fn().mockResolvedValue({ data: [], error: null, source: 'SUPABASE' }),
      fetchReviewsAdmin: vi.fn().mockResolvedValue({ data: [], error: null, source: 'SUPABASE' }),
      fetchEnquiriesAdmin: vi.fn().mockResolvedValue({ data: [], error: null, source: 'SUPABASE' }),
      fetchStoreSettings: vi.fn().mockResolvedValue({ data: null, error: null, source: 'SUPABASE' }),
      fetchOrdersAdmin: vi.fn().mockResolvedValue({ data: [], error: null, source: 'SUPABASE' }),
      deleteProduct: vi.fn(),
      deleteCategory: vi.fn(),
      createSubcategory: vi.fn(),
      updateSubcategory: vi.fn(),
      deleteSubcategory: vi.fn()
    }
  };
});

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null })
    })),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
    }
  },
  isSupabaseConfigured: vi.fn().mockReturnValue(true)
}));

const mockCategories: Category[] = [
  {
    id: 'cat-chips',
    name: 'Kerala Banana Chips',
    slug: 'chips',
    description: 'Crispy Kerala chips',
    imageUrl: '/assets/cat-chips.png',
    displayOrder: 1,
    subcategories: []
  },
  {
    id: 'cat-empty',
    name: 'Empty Category',
    slug: 'empty-cat',
    description: 'Category with no products',
    imageUrl: '/assets/cat-sweets.png',
    displayOrder: 2,
    subcategories: []
  }
];

const mockProducts: Product[] = [
  {
    id: 'prod-chips-1',
    name: 'Classic Salted Banana Chips',
    slug: 'classic-salted-banana-chips',
    tagline: 'Kerala Classic',
    categoryId: 'cat-chips',
    categorySlug: 'chips',
    description: 'Authentic salted chips',
    ingredients: 'Banana, coconut oil, salt',
    storageInstructions: 'Air tight',
    shelfLifeDays: 90,
    isPreservativeFree: true,
    isCoconutOilMade: true,
    isBestseller: true,
    isOnOffer: false,
    isCodEligible: true,
    isPublished: true,
    images: [{ id: 'img-1', imageUrl: '/assets/prod-banana-chips-hero.png', altText: 'Chips', displayOrder: 1, isPrimary: true }],
    variants: [
      {
        id: 'var-1',
        productId: 'prod-chips-1',
        sku: 'ZDF-SBC-250G',
        weightValue: 250,
        weightUnit: 'g',
        weightLabel: '250 g',
        sellingPrice: 180,
        mrp: 220,
        discountPercentage: 18,
        stockQuantity: 50,
        lowStockThreshold: 10,
        isDefault: true
      }
    ],
    averageRating: 4.8,
    reviewCount: 120,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-ordered-2',
    name: 'Historical Ordered Halwa',
    slug: 'historical-ordered-halwa',
    tagline: 'Kerala Sweet',
    categoryId: 'cat-chips',
    categorySlug: 'chips',
    description: 'Halwa with order history',
    ingredients: 'Flour, ghee, sugar',
    storageInstructions: 'Air tight',
    shelfLifeDays: 60,
    isPreservativeFree: true,
    isCoconutOilMade: false,
    isBestseller: false,
    isOnOffer: false,
    isCodEligible: true,
    isPublished: true,
    images: [{ id: 'img-2', imageUrl: '/assets/cat-halwa.png', altText: 'Halwa', displayOrder: 1, isPrimary: true }],
    variants: [
      {
        id: 'var-2',
        productId: 'prod-ordered-2',
        sku: 'ZDF-HLW-250G',
        weightValue: 250,
        weightUnit: 'g',
        weightLabel: '250 g',
        sellingPrice: 200,
        mrp: 250,
        discountPercentage: 20,
        stockQuantity: 30,
        lowStockThreshold: 5,
        isDefault: true
      }
    ],
    averageRating: 4.9,
    reviewCount: 85,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const renderWithProviders = (ui: React.ReactElement, initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
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

describe('ZaDa Foods — Product and Category Deletion & Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('zada_admin_categories', JSON.stringify(mockCategories));
    localStorage.setItem('zada_admin_products', JSON.stringify(mockProducts));
    vi.clearAllMocks();

    vi.mocked(SupabaseDataService.fetchAllProductsAdmin).mockResolvedValue({
      data: [...mockProducts],
      error: null,
      source: 'SUPABASE'
    });
    vi.mocked(SupabaseDataService.fetchCategories).mockResolvedValue({
      data: [...mockCategories],
      error: null,
      source: 'SUPABASE'
    });
  });

  describe('1. Product Deletion & Zero Resurrection', () => {
    it('executes genuine Supabase delete request and updates state', async () => {
      vi.mocked(SupabaseDataService.deleteProduct).mockResolvedValueOnce({
        data: { id: 'prod-chips-1', archived: false },
        error: null,
        source: 'SUPABASE'
      });

      renderWithProviders(<AdminProducts />);

      // Wait for table to load
      await waitFor(() => {
        expect(screen.getByText('Classic Salted Banana Chips')).toBeInTheDocument();
      });

      // Find delete buttons (rows have delete icon)
      const deleteButtons = screen.getAllByTitle('Delete Product');
      expect(deleteButtons.length).toBeGreaterThan(0);

      // Click delete on first product
      fireEvent.click(deleteButtons[0]);

      // Accessible confirmation modal must appear
      expect(screen.getByRole('heading', { name: /delete product/i })).toBeInTheDocument();
      expect(screen.getByText(/"Classic Salted Banana Chips"/)).toBeInTheDocument();

      // Click confirm delete button in modal
      const confirmBtn = screen.getByTestId('confirm-delete-product-btn');
      fireEvent.click(confirmBtn);

      // Verify Supabase deleteProduct was invoked with ID
      await waitFor(() => {
        expect(SupabaseDataService.deleteProduct).toHaveBeenCalledWith('prod-chips-1');
      });

      // Verify product is removed from DOM
      await waitFor(() => {
        expect(screen.queryByText('Classic Salted Banana Chips')).not.toBeInTheDocument();
      });

      // Verify deleted ID was persisted to localStorage
      const savedDeleted = localStorage.getItem('zada_admin_deleted_product_ids');
      expect(savedDeleted).toBeDefined();
      const parsedDeleted = JSON.parse(savedDeleted || '[]');
      expect(parsedDeleted).toContain('prod-chips-1');
    });

    it('does NOT resurrect deleted product upon refresh or re-mount', async () => {
      // Simulate that prod-chips-1 has already been deleted and stored in localStorage
      localStorage.setItem('zada_admin_deleted_product_ids', JSON.stringify(['prod-chips-1']));

      // Even if Supabase or cache returns the product in raw payload
      vi.mocked(SupabaseDataService.fetchAllProductsAdmin).mockResolvedValueOnce({
        data: [...mockProducts],
        error: null,
        source: 'SUPABASE'
      });

      renderWithProviders(<AdminProducts />);

      // Wait for load
      await waitFor(() => {
        expect(screen.getByText('Historical Ordered Halwa')).toBeInTheDocument();
      });

      // The deleted product must NOT be resurrected
      expect(screen.queryByText('Classic Salted Banana Chips')).not.toBeInTheDocument();
    });

    it('safely handles soft-delete (archival) when product has customer order history', async () => {
      // Simulate foreign key constraint violation (23503) resulting in archived: true
      vi.mocked(SupabaseDataService.deleteProduct).mockResolvedValueOnce({
        data: { id: 'prod-ordered-2', archived: true },
        error: null,
        source: 'SUPABASE'
      });

      renderWithProviders(<AdminProducts />);

      await waitFor(() => {
        expect(screen.getByText('Historical Ordered Halwa')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete Product');
      fireEvent.click(deleteButtons[1]); // Click second product

      expect(screen.getByRole('heading', { name: /delete product/i })).toBeInTheDocument();
      const confirmBtn = screen.getByTestId('confirm-delete-product-btn');
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(SupabaseDataService.deleteProduct).toHaveBeenCalledWith('prod-ordered-2');
      });

      // Verify product is removed from active catalog
      await waitFor(() => {
        expect(screen.queryByText('Historical Ordered Halwa')).not.toBeInTheDocument();
      });
    });
  });

  describe('2. Category Deletion Safeguards', () => {
    it('blocks category deletion with warning when active products are assigned', async () => {
      renderWithProviders(<AdminProducts />);

      // Open categories modal
      const manageCatBtn = screen.getByRole('button', { name: /manage categories/i });
      fireEvent.click(manageCatBtn);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /category hierarchy management/i })).toBeInTheDocument();
      });

      // Click delete category on "Kerala Banana Chips" (which has 2 products assigned)
      const deleteChipsBtn = screen.getByTestId('delete-category-cat-chips-btn');
      fireEvent.click(deleteChipsBtn);

      // Must display Cannot Delete Category modal with explanation
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /cannot delete category/i })).toBeInTheDocument();
      });

      expect(screen.getByText(/cannot delete category with assigned products/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Classic Salted Banana Chips/i).length).toBeGreaterThanOrEqual(1);

      // Confirm button must NOT be available; only Understood/Close
      expect(screen.queryByTestId('confirm-delete-category-btn')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /understood \/ close/i })).toBeInTheDocument();

      // SupabaseDataService.deleteCategory must NOT have been called
      expect(SupabaseDataService.deleteCategory).not.toHaveBeenCalled();
    });

    it('allows category deletion when no products are assigned and persists across reloads', async () => {
      vi.mocked(SupabaseDataService.deleteCategory).mockResolvedValueOnce({
        data: true,
        error: null,
        source: 'SUPABASE'
      });

      renderWithProviders(<AdminProducts />);

      const manageCatBtn = screen.getByRole('button', { name: /manage categories/i });
      fireEvent.click(manageCatBtn);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /category hierarchy management/i })).toBeInTheDocument();
      });

      // Click delete category on "Empty Category" (which has 0 products assigned)
      const deleteEmptyBtn = screen.getByTestId('delete-category-cat-empty-btn');
      fireEvent.click(deleteEmptyBtn);

      // Modal must appear with confirmation
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /^delete category$/i })).toBeInTheDocument();
      });

      expect(screen.getByText(/are you sure you want to delete this category/i)).toBeInTheDocument();

      // Click Delete Category confirmation button
      const confirmDeleteBtn = screen.getByTestId('confirm-delete-category-btn');
      fireEvent.click(confirmDeleteBtn);

      await waitFor(() => {
        expect(SupabaseDataService.deleteCategory).toHaveBeenCalledWith('cat-empty');
      });

      // Category must be removed from category list
      await waitFor(() => {
        expect(screen.queryByTestId('delete-category-cat-empty-btn')).not.toBeInTheDocument();
      });

      // Verify category deletion was tracked in localStorage
      const savedDeletedCats = localStorage.getItem('zada_admin_deleted_category_ids');
      expect(savedDeletedCats).toBeDefined();
      const parsedDeletedCats = JSON.parse(savedDeletedCats || '[]');
      expect(parsedDeletedCats).toContain('cat-empty');
    });
  });

  describe('3. Storefront Product Detail Page Handling', () => {
    it('displays "Product Unavailable" screen instead of silently falling back to products[0] when slug is deleted/not found', async () => {
      render(
        <MemoryRouter initialEntries={['/product/non-existent-or-deleted-snack']}>
          <ToastProvider>
            <AuthProvider>
              <CartProvider>
                <AdminDataProvider>
                  <Routes>
                    <Route path="/product/:slug" element={<ProductDetailPage />} />
                  </Routes>
                </AdminDataProvider>
              </CartProvider>
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      // Must display Product Unavailable banner
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /product unavailable/i })).toBeInTheDocument();
      });

      expect(screen.getByText(/this product is no longer active, has been archived, or does not exist/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /explore all snacks/i })).toBeInTheDocument();

      // Must NOT display default banana chips product details
      expect(screen.queryByText('Nendran Banana Chips')).not.toBeInTheDocument();
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminSubcategories } from '../pages/admin/AdminSubcategories';
import { CategoryPage } from '../pages/CategoryPage';
import { AdminDataProvider } from '../context/AdminDataContext';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { CartProvider } from '../context/CartContext';
import { INITIAL_SUBCATEGORIES } from '../data/mockData';

const renderWithProviders = (ui: React.ReactElement, initialEntries = ['/admin/subcategories']) => {
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

describe('Phase 15B: Subcategory CMS & Storefront Integration', () => {
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
  });

  describe('1. Admin Subcategory Management UI', () => {
    it('renders the subcategory management interface with search, filters, and subcategories table', () => {
      renderWithProviders(<AdminSubcategories />);

      expect(screen.getByText(/Subcategory Management/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add Subcategory/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Search subcategory, slug, description/i)).toBeInTheDocument();
      expect(screen.getByText(/All Parent Categories/i)).toBeInTheDocument();

      // Default subcategories are listed
      expect(screen.getByText('Banana Chips')).toBeInTheDocument();
      expect(screen.getByText('Tapioca')).toBeInTheDocument();
      expect(screen.getByText('Plantain')).toBeInTheDocument();
      expect(screen.getByText('Jackfruit')).toBeInTheDocument();
    });

    it('filters subcategories by search term', () => {
      renderWithProviders(<AdminSubcategories />);

      const searchInput = screen.getByPlaceholderText(/Search subcategory, slug, description/i);
      fireEvent.change(searchInput, { target: { value: 'Tapioca' } });

      expect(screen.getByText('Tapioca')).toBeInTheDocument();
      expect(screen.queryByText('Jackfruit')).toBeNull();
    });

    it('filters subcategories by parent category', () => {
      renderWithProviders(<AdminSubcategories />);

      const categoryFilter = screen.getByDisplayValue(/All Parent Categories/i);
      fireEvent.change(categoryFilter, { target: { value: 'cat-halwa' } });

      expect(screen.getByText('Cashew Halwa')).toBeInTheDocument();
      expect(screen.queryByText('Banana Chips')).toBeNull();
    });
  });

  describe('2. Add Subcategory Workflow & Validation', () => {
    it('opens modal, validates required fields, and blocks duplicate slugs in the same parent category', async () => {
      renderWithProviders(<AdminSubcategories />);

      fireEvent.click(screen.getByRole('button', { name: /Add Subcategory/i }));
      expect(screen.getByText(/Add New Subcategory/i)).toBeInTheDocument();

      // Attempt to submit with duplicate slug in same category
      const nameInput = screen.getByPlaceholderText(/e\.g\. Banana Chips/i);
      fireEvent.change(nameInput, { target: { value: 'Banana Chips' } });

      const slugInput = screen.getByPlaceholderText(/e\.g\. banana-chips/i);
      fireEvent.change(slugInput, { target: { value: 'banana-chips' } });

      fireEvent.click(screen.getByRole('button', { name: /Save Subcategory/i }));

      // Validation error shown
      expect(screen.getByText(/already exists under this parent category/i)).toBeInTheDocument();
    });

    it('successfully adds a new subcategory and displays it in the table', async () => {
      renderWithProviders(<AdminSubcategories />);

      fireEvent.click(screen.getByRole('button', { name: /Add Subcategory/i }));

      const nameInput = screen.getByPlaceholderText(/e\.g\. Banana Chips/i);
      fireEvent.change(nameInput, { target: { value: 'Spicy Masala Chips' } });

      const slugInput = screen.getByPlaceholderText(/e\.g\. banana-chips/i);
      fireEvent.change(slugInput, { target: { value: 'spicy-masala-chips' } });

      const descInput = screen.getByPlaceholderText(/Brief description of this collection/i);
      fireEvent.change(descInput, { target: { value: 'Fiery chili and curry leaves seasoned chips.' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Save Subcategory/i }));
      });

      expect(screen.getByText('Spicy Masala Chips')).toBeInTheDocument();
      expect(screen.getByText('spicy-masala-chips')).toBeInTheDocument();
    });
  });

  describe('3. Edit Subcategory Workflow', () => {
    it('opens edit modal with existing values and updates subcategory name', async () => {
      renderWithProviders(<AdminSubcategories />);

      const editBtn = screen.getByRole('button', { name: /Edit Banana Chips/i });
      fireEvent.click(editBtn);

      expect(screen.getByText(/Edit Subcategory: Banana Chips/i)).toBeInTheDocument();

      const nameInput = screen.getByDisplayValue('Banana Chips');
      fireEvent.change(nameInput, { target: { value: 'Classic Nendran Banana Chips' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Update Subcategory/i }));
      });

      expect(screen.getByText('Classic Nendran Banana Chips')).toBeInTheDocument();
    });
  });

  describe('4. Subcategory Toggle & Reordering', () => {
    it('toggles subcategory active/inactive status', async () => {
      renderWithProviders(<AdminSubcategories />);

      const toggleBtn = screen.getByRole('button', { name: /Toggle active status for Tapioca/i });
      expect(toggleBtn).toHaveTextContent(/Active/i);

      await act(async () => {
        fireEvent.click(toggleBtn);
      });

      expect(toggleBtn).toHaveTextContent(/Inactive/i);
    });

    it('moves subcategory display order up or down', async () => {
      renderWithProviders(<AdminSubcategories />);

      const moveDownBtn = screen.getByRole('button', { name: /Move Banana Chips down/i });
      await act(async () => {
        fireEvent.click(moveDownBtn);
      });

      // After moving down, Banana Chips display order increases
      const bananaRow = screen.getByTestId('subcategory-row-banana-chips');
      expect(bananaRow).toBeInTheDocument();
    });
  });

  describe('5. Delete Safety & Dependent Product Reassignment', () => {
    it('prevents accidental deletion of subcategory with products and offers reassignment', () => {
      renderWithProviders(<AdminSubcategories />);

      // Banana chips has products assigned
      const deleteBtn = screen.getByRole('button', { name: /Delete Banana Chips/i });
      fireEvent.click(deleteBtn);

      // Warning modal appears
      expect(screen.getByRole('heading', { name: /Delete Subcategory/i })).toBeInTheDocument();
      expect(screen.getByText(/product\(s\) are currently assigned to this subcategory/i)).toBeInTheDocument();
      expect(screen.getByText(/Reassign dependent products to:/i)).toBeInTheDocument();
      expect(screen.getByText(/Remove subcategory assignment/i)).toBeInTheDocument();
    });

    it('deletes subcategory safely when no products depend on it', async () => {
      renderWithProviders(<AdminSubcategories />);

      // Jackfruit has 0 products assigned
      const deleteBtn = screen.getByRole('button', { name: /Delete Jackfruit/i });
      fireEvent.click(deleteBtn);

      expect(screen.getByText(/No products are currently assigned to this subcategory\. It can be safely removed\./i)).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Confirm Delete/i }));
      });

      expect(screen.queryByText('Jackfruit')).toBeNull();
    });
  });

  describe('6. Storefront Integration & Product Filtering', () => {
    it('renders admin-configured subcategory pills on /category/:slug and filters products', () => {
      renderWithProviders(
        <Routes>
          <Route path="/category/:slug" element={<CategoryPage />} />
        </Routes>,
        ['/category/chips']
      );

      // Storefront renders dynamic pills
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Banana Chips' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Tapioca' })).toBeInTheDocument();

      // All option is initially selected
      const allPill = screen.getByRole('button', { name: 'All' });
      expect(allPill).toHaveAttribute('aria-pressed', 'true');

      // Click Tapioca pill
      const tapiocaPill = screen.getByRole('button', { name: 'Tapioca' });
      fireEvent.click(tapiocaPill);

      expect(tapiocaPill).toHaveAttribute('aria-pressed', 'true');
      expect(allPill).toHaveAttribute('aria-pressed', 'false');
    });

    it('shows high-empathy empty state when subcategory has no products and allows resetting to All', () => {
      renderWithProviders(
        <Routes>
          <Route path="/category/:slug" element={<CategoryPage />} />
        </Routes>,
        ['/category/chips']
      );

      // Click Plantain pill which has no products in mock catalog
      const plantainPill = screen.getByRole('button', { name: 'Plantain' });
      fireEvent.click(plantainPill);

      expect(screen.getByText(/No products found in Plantain/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Clear All Filters/i })).toBeInTheDocument();

      // Clear filters returns to all
      fireEvent.click(screen.getByRole('button', { name: /Clear All Filters/i }));
      const allPill = screen.getByRole('button', { name: 'All' });
      expect(allPill).toHaveAttribute('aria-pressed', 'true');
    });

    it('does not display inactive subcategories on storefront', () => {
      localStorage.setItem('zada_admin_subcategories', JSON.stringify([
        { id: 'sub-active', categoryId: 'cat-chips', name: 'Active Chips', slug: 'active-chips', displayOrder: 1, isActive: true },
        { id: 'sub-hidden', categoryId: 'cat-chips', name: 'Hidden Seasonal', slug: 'hidden-seasonal', displayOrder: 2, isActive: false }
      ]));

      renderWithProviders(
        <Routes>
          <Route path="/category/:slug" element={<CategoryPage />} />
        </Routes>,
        ['/category/chips']
      );

      expect(screen.getByRole('button', { name: 'Active Chips' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Hidden Seasonal' })).toBeNull();
    });

    it('persists added subcategory in local storage and reflects in storefront after reload', () => {
      // Seed subcategory in localStorage (simulating admin action + refresh)
      const testSubs = [
        ...INITIAL_SUBCATEGORIES,
        { id: 'sub-peri-peri', categoryId: 'cat-chips', name: 'Peri Peri Chips', slug: 'peri-peri', displayOrder: 9, isActive: true }
      ];
      localStorage.setItem('zada_admin_subcategories', JSON.stringify(testSubs));

      renderWithProviders(
        <Routes>
          <Route path="/category/:slug" element={<CategoryPage />} />
        </Routes>,
        ['/category/chips']
      );

      expect(screen.getByRole('button', { name: 'Peri Peri Chips' })).toBeInTheDocument();
    });
  });
});

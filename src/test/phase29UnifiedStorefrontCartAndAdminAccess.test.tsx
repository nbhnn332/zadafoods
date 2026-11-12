import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { CartProvider } from '../context/CartContext';
import { AdminDataProvider } from '../context/AdminDataContext';
import { FestivalProvider } from '../context/FestivalContext';
import { HomePage } from '../pages/HomePage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { Header } from '../components/Header';
import { AdminLayout } from '../components/AdminLayout';
import { AdminPermissionGuard } from '../components/AdminPermissionGuard';

const MockOrdersView = () => <div data-testid="admin-orders-view">Orders Management Content</div>;
const MockDashboardView = () => <div data-testid="admin-dashboard-view">Admin Dashboard View</div>;

describe('ZaDa Foods — Phase 29: Unified Storefront, Cart Isolation & Admin Provisioning', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. Homepage Combo Builder Merchandising Gate', () => {
    it('does NOT automatically display the Signature Kerala Combos section on the homepage by default', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <ToastProvider>
            <AuthProvider>
              <AdminDataProvider>
                <CartProvider>
                  <FestivalProvider>
                    <HomePage />
                  </FestivalProvider>
                </CartProvider>
              </AdminDataProvider>
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      // Section must not be displayed on homepage by default
      expect(screen.queryByText(/Signature Kerala Combos/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Curated Flavours, Perfectly Paired/i)).not.toBeInTheDocument();
    });
  });

  describe('2. Admin-Manageable Central Heritage/Story Banner', () => {
    it('renders the central heritage storytelling banner with default copy and verified links', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <ToastProvider>
            <AuthProvider>
              <AdminDataProvider>
                <CartProvider>
                  <FestivalProvider>
                    <HomePage />
                  </FestivalProvider>
                </CartProvider>
              </AdminDataProvider>
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      // Verify the central story banner
      expect(screen.getByRole('heading', { name: /Pure Ingredients, Generational Craft/i })).toBeInTheDocument();
      expect(screen.getByText(/Rooted in Kerala\. Crafted for Every Kitchen\./i)).toBeInTheDocument();
      expect(screen.getByText(/Hand-picked raw materials, cold-pressed coconut oil/i)).toBeInTheDocument();

      const storyCta = screen.getByRole('link', { name: /Read Our Story/i });
      expect(storyCta).toBeInTheDocument();
      expect(storyCta).toHaveAttribute('href', '/our-story');
    });
  });

  describe('3. Strict Guest Cart Isolation & Empty Cart Protection', () => {
    it('initializes fresh guest visit with 0 badge and no hardcoded 3 items', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <ToastProvider>
            <AuthProvider>
              <AdminDataProvider>
                <CartProvider>
                  <FestivalProvider>
                    <Header />
                  </FestivalProvider>
                </CartProvider>
              </AdminDataProvider>
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      // The cart badge should NOT be visible when cart is empty (0 items)
      // Previous bug: rendered '3' when totalUniqueItems was 0
      const cartLinks = screen.getAllByRole('link', { name: /Cart/i });
      cartLinks.forEach((link) => {
        expect(link.textContent).not.toContain('3');
      });
    });

    it('renders explicit empty state on /checkout instead of injecting demo items', () => {
      render(
        <MemoryRouter initialEntries={['/checkout']}>
          <ToastProvider>
            <AuthProvider>
              <AdminDataProvider>
                <CartProvider>
                  <FestivalProvider>
                    <CheckoutPage />
                  </FestivalProvider>
                </CartProvider>
              </AdminDataProvider>
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      expect(screen.getByText('Your Cart is Empty')).toBeInTheDocument();
      expect(screen.getByText(/You do not have any items in your cart to proceed with checkout/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Explore Kerala Delicacies/i })).toBeInTheDocument();
      expect(screen.queryByText(/Place Order/i)).not.toBeInTheDocument();
    });
  });

  describe('4. Admin RBAC & Route Guarding', () => {
    it('auto-redirects restricted admin without dashboard.view from /admin to their first permitted module', async () => {
      const restrictedAdmin = {
        id: 'usr-admin-orders-staff',
        email: 'orders.staff@zadafoods.com',
        fullName: 'Orders Staff',
        role: 'admin',
        status: 'active',
        permissions: ['orders.manage'],
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('zada_auth_user', JSON.stringify(restrictedAdmin));

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <ToastProvider>
            <AuthProvider>
              <AdminDataProvider>
                <CartProvider>
                  <Routes>
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route
                        path="dashboard"
                        element={
                          <AdminPermissionGuard permission="dashboard.view" featureName="Dashboard">
                            <MockDashboardView />
                          </AdminPermissionGuard>
                        }
                      />
                      <Route
                        path="orders"
                        element={
                          <AdminPermissionGuard permission="orders.manage" featureName="Orders Management">
                            <MockOrdersView />
                          </AdminPermissionGuard>
                        }
                      />
                    </Route>
                  </Routes>
                </CartProvider>
              </AdminDataProvider>
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('admin-orders-view')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('admin-dashboard-view')).not.toBeInTheDocument();
    });
  });
});

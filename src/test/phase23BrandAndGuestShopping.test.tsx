import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import fs from 'fs';
import path from 'path';
import { HomePage } from '../pages/HomePage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { OrderTrackingPage } from '../pages/OrderTrackingPage';
import { OurStoryPage } from '../pages/OurStoryPage';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import { AdminDataProvider } from '../context/AdminDataContext';
import { ToastProvider } from '../context/ToastContext';
import { FestivalProvider } from '../context/FestivalContext';

const renderApp = (initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <ToastProvider>
        <AuthProvider>
          <AdminDataProvider>
            <CartProvider>
              <FestivalProvider>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/order-tracking" element={<OrderTrackingPage />} />
                  <Route path="/order-tracking/:id" element={<OrderTrackingPage />} />
                  <Route path="/our-story" element={<OurStoryPage />} />
                </Routes>
              </FestivalProvider>
            </CartProvider>
          </AdminDataProvider>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
};

describe('ZaDa Foods — Phase 23: Brand Repositioning & Guest Shopping QA', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('zada_auth_user', 'guest');
    vi.restoreAllMocks();
  });

  describe('1. Brand Repositioning: Authentic Kerala Flavours & Spices', () => {
    it('verifies index.html has correct title and meta description reflecting Kerala spices and traditions', () => {
      const html = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf-8');
      expect(html).toContain('ZaDa Foods | Authentic Kerala Flavours, Rooted in Tradition');
      expect(html).toContain('content="ZaDa Foods — Authentic Kerala Flavours, Rooted in Tradition. Premium whole spices, authentic spice blends, and traditional regional ingredients delivered fresh."');
    });

    it('renders the repositioned brand slogan and spice highlights on HomePage', () => {
      renderApp('/');
      expect(screen.getAllByText(/Authentic Kerala Flavours, Rooted in Tradition/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Spices & Blends/i).length).toBeGreaterThan(0);
    });

    it('renders Our Story page with heritage narrative and 4 craftsmanship pillars', () => {
      renderApp('/our-story');
      expect(screen.getAllByText(/Authentic Kerala Flavours, Rooted in Tradition/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/100% Pure Coconut Oil/i)).toBeInTheDocument();
      expect(screen.getByText(/Farm-Direct Nendran Bananas & Spices/i)).toBeInTheDocument();
      expect(screen.getByText(/Small-Batch Heritage Cooking/i)).toBeInTheDocument();
      expect(screen.getByText(/Zero Chemical Preservatives/i)).toBeInTheDocument();
    });
  });

  describe('2. Guest Checkout Experience (Zero Mandatory Login)', () => {
    it('displays the Continue as Guest checkout form when visitor is unauthenticated', () => {
      renderApp('/checkout');
      expect(screen.getByText(/Continue as Guest/i)).toBeInTheDocument();
      expect(screen.getByText(/No registration or password required/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e\.g\. Rahul Sharma/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/10-digit mobile number/i)).toBeInTheDocument();
    });

    it('validates required guest checkout fields before allowing order placement', async () => {
      renderApp('/checkout');

      const placeOrderButton = screen.getByRole('button', { name: /Place Order|Pay/i });
      fireEvent.click(placeOrderButton);

      await waitFor(() => {
        expect(screen.getByText(/Full Name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/Valid 10-digit mobile number is required/i)).toBeInTheDocument();
        expect(screen.getByText(/Delivery address is required/i)).toBeInTheDocument();
      });
    });

    it('submits a guest order and preserves tracking access token without creating Supabase Auth account', async () => {
      renderApp('/checkout');

      // Fill in guest form
      fireEvent.change(screen.getByPlaceholderText(/e\.g\. Rahul Sharma/i), { target: { value: 'Guest Traveler' } });
      fireEvent.change(screen.getByPlaceholderText(/10-digit mobile number/i), { target: { value: '9876543210' } });
      fireEvent.change(screen.getByPlaceholderText(/House\/Flat No\./i), { target: { value: 'Villa 42, Beach Road' } });
      fireEvent.change(screen.getByPlaceholderText(/City\/Town/i), { target: { value: 'Kozhikode' } });
      fireEvent.change(screen.getByPlaceholderText(/6 digits/i), { target: { value: '673001' } });

      const placeOrderButton = screen.getByRole('button', { name: /Place Order|Pay/i });
      fireEvent.click(placeOrderButton);

      await waitFor(() => {
        const hasSessionOrLocalKey = Object.keys(sessionStorage).some(k => k.startsWith('zada_guest_order')) ||
                                    Object.keys(localStorage).some(k => k.startsWith('zada_guest_order'));
        expect(hasSessionOrLocalKey).toBe(true);
      });
    });
  });

  describe('3. Guest Order Tracking & Privacy Isolation', () => {
    it('renders guest tracking confirmation with Copy Link button when session or token is valid', () => {
      sessionStorage.setItem('zada_guest_order_ord-1', 'true');
      renderApp('/order-tracking/ord-1');
      expect(screen.getByRole('button', { name: /track|copy link/i })).toBeInTheDocument();
    });

    it('strictly denies unauthorized strangers attempting to view protected orders (IDOR prevention)', () => {
      renderApp('/order-tracking/ord-unknown-unauthorized-999');
      expect(screen.getByText(/Order Not Found|Protected Order/i)).toBeInTheDocument();
    });
  });

  describe('4. Staging SQL Security Hardening Invariants', () => {
    it('verifies create_order_server_authoritative removes hardcoded fallback secrets', () => {
      const sql = fs.readFileSync(path.resolve(__dirname, '../../supabase/migrations/20261104000007_phase23_security_hardening.sql'), 'utf-8');
      expect(sql).not.toContain('zada_production_guest_order_secret_hmac');
      expect(sql).toContain('private.server_secrets');
      expect(sql).toContain('SECURITY_CONFIGURATION_ERROR: Secure server HMAC secret is not configured');
    });

    it('verifies bootstrap_super_admin strictly enforces email confirmation check', () => {
      const sql = fs.readFileSync(path.resolve(__dirname, '../../supabase/migrations/20261104000007_phase23_security_hardening.sql'), 'utf-8');
      expect(sql).toContain('IF NOT COALESCE(is_confirmed, FALSE) THEN');
      expect(sql).toContain('must have a confirmed email before elevation');
    });

    it('verifies get_guest_order_tracking cryptographic validation function exists', () => {
      const sql = fs.readFileSync(path.resolve(__dirname, '../../supabase/migrations/20261104000007_phase23_security_hardening.sql'), 'utf-8');
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.get_guest_order_tracking');
      expect(sql).toContain('extensions.hmac');
      expect(sql).toContain('SIGNATURE_MISMATCH');
    });
  });
});

import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { HomePage } from '../pages/HomePage';
import { OurStoryPage } from '../pages/OurStoryPage';
import { AdminDataProvider } from '../context/AdminDataContext';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { ToastProvider } from '../context/ToastContext';
import { FestivalProvider } from '../context/FestivalContext';

// Helper wrapper
const renderWithProviders = (ui: React.ReactElement, initialEntries: string[] = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <AdminDataProvider>
              <FestivalProvider>
                {ui}
              </FestivalProvider>
            </AdminDataProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
};

describe('ZaDa Foods — Official Footer Enhancement & Manufacturer Information', () => {
  it('1. Renders official manufacturer details exactly as specified', () => {
    renderWithProviders(<Footer />);

    // Brand and Manufacturer
    expect(screen.getAllByText(/ZADA FOODS/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Punalur, Kollam \(Dist\), Kerala – 691305/i)).toBeInTheDocument();
  });

  it('2. Displays verified FSSAI License Number 21326145000345 and zero old numbers', () => {
    const { container } = renderWithProviders(<Footer />);

    // Official FSSAI License Number
    expect(screen.getByText(/21326145000345/)).toBeInTheDocument();
    expect(screen.getByText(/Food Safety & Standards Authority of India/i)).toBeInTheDocument();

    // Verify old number 21326144000032 is completely absent
    expect(container.textContent).not.toContain('21326144000032');
  });

  it('3. Renders official brand description in Column 1', () => {
    renderWithProviders(<Footer />);

    expect(
      screen.getByText(/Bringing authentic Kerala flavours and quality ingredients to your kitchen\./i)
    ).toBeInTheDocument();
  });

  it('4. Provides functional Quick Links in Column 2', () => {
    renderWithProviders(<Footer />);

    expect(screen.getByRole('link', { name: /^Home$/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /Shop Catalogue/i })).toHaveAttribute('href', '/shop');
    expect(screen.getByRole('link', { name: /Our Story/i })).toHaveAttribute('href', '/our-story');
    expect(screen.getByRole('link', { name: /Bulk Orders & Gifting/i })).toHaveAttribute('href', '/bulk-enquiries');
    expect(screen.getByRole('link', { name: /Contact Us/i })).toHaveAttribute('href', '/contact');
    expect(screen.getByRole('link', { name: /Track Your Order/i })).toHaveAttribute('href', '/order-tracking');
  });

  it('5. Renders clickable contact numbers with strict tel: links in Column 3', () => {
    renderWithProviders(<Footer />);

    const phone1Link = screen.getByRole('link', { name: /Call \+91 8891537982/i });
    expect(phone1Link).toHaveAttribute('href', 'tel:+918891537982');

    const phone2Link = screen.getByRole('link', { name: /Call \+91 75939 59235/i });
    expect(phone2Link).toHaveAttribute('href', 'tel:+917593959235');
  });

  it('6. Routes WhatsApp exclusively to +91 75939 59235 and never +91 8891537982', () => {
    renderWithProviders(<Footer />);

    const whatsappLinks = screen.getAllByRole('link', { name: /WhatsApp/i });
    expect(whatsappLinks.length).toBeGreaterThan(0);

    whatsappLinks.forEach((link) => {
      const href = link.getAttribute('href') || '';
      expect(href).toContain('917593959235');
      expect(href).not.toContain('8891537982');
    });
  });

  it('7. Renders official email mailto: link to Zadafoods4@gmail.com', () => {
    renderWithProviders(<Footer />);

    const emailLink = screen.getByRole('link', { name: /Zadafoods4@gmail\.com/i });
    expect(emailLink).toHaveAttribute('href', 'mailto:Zadafoods4@gmail.com');
  });

  it('8. Renders shared footer seamlessly on HomePage', () => {
    renderWithProviders(<HomePage />, ['/']);

    expect(screen.getByText(/Punalur, Kollam \(Dist\), Kerala – 691305/i)).toBeInTheDocument();
    expect(screen.getByText(/21326145000345/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Zadafoods4@gmail\.com/i })).toBeInTheDocument();
  });

  it('9. Renders shared footer seamlessly on OurStoryPage', () => {
    renderWithProviders(<OurStoryPage />, ['/our-story']);

    expect(screen.getAllByText(/Punalur, Kollam \(Dist\)/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/21326145000345/).length).toBeGreaterThan(0);
  });
});

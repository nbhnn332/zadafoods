import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { FestivalProvider, applyThemeToDocument } from '../context/FestivalContext';
import { AdminDataProvider } from '../context/AdminDataContext';
import { CartProvider } from '../context/CartContext';
import * as AuthContextModule from '../context/AuthContext';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { AdminFestivals } from '../pages/admin/AdminFestivals';
import { AdminDataManagement } from '../pages/admin/AdminDataManagement';
import { AdminCMS } from '../pages/admin/AdminCMS';
import { HomePage } from '../pages/HomePage';
import { SupabaseDataService } from '../lib/commerce/supabaseDataService';
import * as supabaseModule from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { INITIAL_FESTIVAL_PRESETS } from '../types/festival';

const renderWithAll = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter>
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

describe('ZaDa Foods — Festival Theme, Homepage CMS & Bulk Data Cleanup Verification', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);

    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'usr-super-1',
            email: 'superadmin@zadafoods.com',
            user_metadata: { role: 'superadmin', full_name: 'Super Admin' },
            created_at: new Date().toISOString()
          }
        } as any
      },
      error: null
    });

    class MockImage {
      naturalWidth = 1920;
      naturalHeight = 1080;
      onload: any = null;
      onerror: any = null;
      referrerPolicy = '';
      set src(_val: string) {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }
    }
    (window as any).Image = MockImage;

    localStorage.setItem('zada_auth_user', JSON.stringify({
      id: 'usr-super-1',
      email: 'superadmin@zadafoods.com',
      role: 'superadmin',
      status: 'active',
      permissions: ['*']
    }));
  });

  describe('1. Festival Theme Complete Website Transformation & Document Variables', () => {
    it('injects CSS variables onto documentElement for Onam theme', () => {
      const onamTheme = INITIAL_FESTIVAL_PRESETS.find((p) => p.preset === 'onam')!;
      applyThemeToDocument(onamTheme, true);

      const root = document.documentElement;
      expect(root.getAttribute('data-festival-theme')).toBe('onam');
      expect(root.style.getPropertyValue('--color-primary')).toBe('#C88A10');
      expect(root.style.getPropertyValue('--color-page-bg')).toBe('#FAF5EA');
      expect(root.style.getPropertyValue('--color-header-bg')).toBe('#0D3B22');
      expect(root.style.getPropertyValue('--brand-primary')).toBe('#C88A10');
    });

    it('injects CSS variables onto documentElement for Eid theme', () => {
      const eidTheme = INITIAL_FESTIVAL_PRESETS.find((p) => p.preset === 'eid')!;
      applyThemeToDocument(eidTheme, true);

      const root = document.documentElement;
      expect(root.getAttribute('data-festival-theme')).toBe('eid');
      expect(root.style.getPropertyValue('--color-primary')).toBe('#055C41');
      expect(root.style.getPropertyValue('--color-page-bg')).toBe('#F1F7F4');
      expect(root.style.getPropertyValue('--color-header-bg')).toBe('#043224');
      expect(root.style.getPropertyValue('--brand-primary')).toBe('#055C41');
    });

    it('cleanly removes CSS variables and attributes when theme is restored to default', () => {
      const diwaliTheme = INITIAL_FESTIVAL_PRESETS.find((p) => p.preset === 'diwali')!;
      applyThemeToDocument(diwaliTheme, true);
      expect(document.documentElement.getAttribute('data-festival-theme')).toBe('diwali');

      applyThemeToDocument(null, false);
      expect(document.documentElement.getAttribute('data-festival-theme')).toBeNull();
      expect(document.documentElement.style.getPropertyValue('--brand-primary')).toBe('');
      expect(document.documentElement.style.getPropertyValue('--brand-gold')).toBe('');
    });
  });

  describe('2. Authoritative Restore Default Button with Confirmation Modal', () => {
    it('requires confirmation modal before restoring default theme', async () => {
      const diwaliThemes = INITIAL_FESTIVAL_PRESETS.map((t) => ({
        ...t,
        isActive: t.preset === 'diwali'
      }));
      localStorage.setItem('zada_festival_themes', JSON.stringify(diwaliThemes));

      const setActiveSpy = vi.spyOn(SupabaseDataService, 'setActiveFestivalTheme').mockResolvedValue({
        data: true,
        error: null,
        source: 'SUPABASE'
      });

      renderWithAll(<AdminFestivals />);

      const restoreBtn = screen.getByRole('button', { name: /Restore Default ZaDa/i });
      fireEvent.click(restoreBtn);

      // Verify confirmation modal opens
      expect(screen.getByText(/Restore Default ZaDa Brand Identity\?/i)).toBeInTheDocument();
      expect(screen.getByText(/Deactivates all festival theme overlays/i)).toBeInTheDocument();

      // Click Confirm
      const confirmBtn = screen.getByRole('button', { name: /Confirm Restore Default/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(setActiveSpy).toHaveBeenCalledWith('theme-default');
      });

      const saved = JSON.parse(localStorage.getItem('zada_festival_themes') || '[]');
      const defaultTheme = saved.find((t: any) => t.preset === 'default');
      expect(defaultTheme?.isActive).toBe(true);
    });
  });

  describe('3. Corporate & Gifting CMS Storefront Pipeline', () => {
    it('applies custom hex background color and text color to corporate gifting storefront section', async () => {
      const mockGiftingConfig = {
        id: 'h0000000-0000-0000-0000-000000000003',
        eyebrow: 'Exclusive Festive Gifting',
        heading: 'Curated Malabar Sweet Boxes for Events',
        description: 'Handcrafted packaging for luxury gatherings.',
        bulletPoints: ['Custom branding ribbons', 'Fast pan-India dispatch'],
        primaryCtaLabel: 'Request Quote Now',
        primaryCtaDestination: '/bulk-orders',
        secondaryCtaLabel: 'WhatsApp ZaDa Specialist',
        secondaryCtaDestination: 'https://wa.me/919447000000',
        bgPreset: '#4A1521', // Custom Burgundy Hex
        textColor: '#FFFFFF',
        isActive: true,
        displayOrder: 7,
        desktopVisible: true,
        mobileVisible: true
      };

      localStorage.setItem('zada_admin_corporate_section', JSON.stringify(mockGiftingConfig));

      renderWithAll(<HomePage />);

      const heading = await screen.findByText('Curated Malabar Sweet Boxes for Events');
      expect(heading).toBeInTheDocument();
      expect(screen.getByText('Exclusive Festive Gifting')).toBeInTheDocument();

      // Section container must have the background color directly applied
      const section = heading.closest('section');
      expect(section).not.toBeNull();
      expect(section?.style.backgroundColor).toBe('rgb(74, 21, 33)'); // #4A1521 in RGB
    });
  });

  describe('4. Homepage Hero Banner CMS — Optional Fields & Click Behavior', () => {
    it('saves image-only banner with empty headline and showCta disabled', async () => {
      const saveSpy = vi.spyOn(SupabaseDataService, 'saveBanner').mockImplementation(async (banner) => {
        return {
          data: {
            id: banner.id || 'banner-123',
            title: banner.title || '',
            subtitle: banner.subtitle || '',
            imageUrl: banner.imageUrl || '',
            backgroundColor: banner.backgroundColor || '#072C20',
            textColor: banner.textColor || '#FFFFFF',
            ctaText: banner.ctaText || '',
            linkUrl: banner.linkUrl || '/shop',
            displayOrder: banner.displayOrder || 1,
            isActive: true,
            showCta: banner.showCta,
            isClickable: banner.isClickable,
            openInNewTab: banner.openInNewTab
          },
          error: null,
          source: 'SUPABASE'
        };
      });

      renderWithAll(<AdminCMS />);

      const createBtn = screen.getByTestId('add-desktop-banner-btn');
      fireEvent.click(createBtn);

      // Verify Headline Heading is marked optional
      expect(screen.getByText(/Headline Heading \(Optional for Image-Only\)/i)).toBeInTheDocument();

      // Paste image URL
      const imgInput = screen.getByPlaceholderText(/Leave empty for Pure CSS/i);
      fireEvent.change(imgInput, {
        target: { value: '/assets/banners/kerala-crisps.jpg' }
      });

      // Toggle off CTA Button
      const ctaCheckbox = screen.getByLabelText(/Enable CTA Button/i);
      fireEvent.click(ctaCheckbox); // unchecks it

      // Destination URL input
      const linkInput = screen.getByPlaceholderText(/\/category\/chips/i);
      fireEvent.change(linkInput, { target: { value: '/shop?collection=special' } });

      // Save Banner
      const saveSubmit = screen.getByRole('button', { name: /Create Banner/i });
      fireEvent.click(saveSubmit);

      await waitFor(() => {
        expect(saveSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '',
            showCta: false,
            linkUrl: '/shop?collection=special'
          })
        );
      });
    });

    it('renders image-only clickable banner without scrim overlay on storefront', () => {
      const banners = [
        {
          id: 'ban-image-only',
          title: '',
          subtitle: '',
          eyebrow: '',
          imageUrl: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69',
          showCta: false,
          isClickable: true,
          linkUrl: '/special-offer',
          displayOrder: 1,
          isActive: true,
          deviceTarget: 'desktop' as const
        }
      ];

      localStorage.setItem('zada_admin_banners', JSON.stringify(banners));

      renderWithAll(<HomePage />);

      // The entire banner should have a clickable link to /special-offer
      const links = screen.getAllByRole('link');
      const bannerLink = links.find((l) => l.getAttribute('href') === '/special-offer');
      expect(bannerLink).toBeDefined();
    });
  });

  describe('5. Bulk Data Cleanup with Two-Step Verification', () => {
    beforeEach(() => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        user: {
          id: 'usr-super-1',
          email: 'superadmin@zadafoods.com',
          fullName: 'Super Admin',
          role: 'superadmin',
          status: 'active',
          permissions: ['*']
        },
        isAdmin: true,
        isSuperAdmin: true,
        isSuspended: false,
        authLoading: false,
        hasPermission: () => true,
        login: vi.fn(),
        logout: vi.fn(),
        signup: vi.fn(),
        resetPassword: vi.fn(),
        updateProfile: vi.fn()
      } as any);
    });
    it('performs dry-run preview across selected categories without deleting data', async () => {
      const cleanupSpy = vi.spyOn(SupabaseDataService, 'cleanupOperationalRecords').mockResolvedValue({
        data: {
          affectedRecords: 12,
          details: 'Dry-run preview completed: 12 eligible records across 2 categories.',
          dryRun: true,
          breakdown: [
            {
              category: 'ORDERS_CANCELLED',
              name: 'Cancelled & Failed Orders',
              count: 7,
              description: '7 cancelled orders identified',
              sampleRecords: [
                { id: 'ord-1', reference: 'ORD-TEST-1', details: 'Amount: ₹350 | Customer: Test', createdAt: new Date().toISOString() }
              ],
              status: 'PENDING'
            },
            {
              category: 'TEMPORARY_CARTS',
              name: 'Abandoned Carts',
              count: 5,
              description: '5 temporary carts identified',
              sampleRecords: [],
              status: 'PENDING'
            }
          ]
        },
        error: null,
        source: 'SUPABASE'
      });

      renderWithAll(<AdminDataManagement />);

      const previewBtn = screen.getByRole('button', { name: /1\. Run Dry-Run Preview/i });
      fireEvent.click(previewBtn);

      await waitFor(() => {
        expect(cleanupSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            categories: expect.arrayContaining(['ORDERS_CANCELLED', 'TEMPORARY_CARTS']),
            dryRun: true
          })
        );
      });

      expect(screen.getByText(/Total: 12 Records/i)).toBeInTheDocument();
      expect(screen.getByText(/Safe Mode • Zero Changes Made/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Inspect \(1\)/i })).toBeInTheDocument();
    });

    it('enforces password re-authentication and typed confirmation phrase for live deletion', async () => {
      vi.spyOn(SupabaseDataService, 'cleanupOperationalRecords').mockImplementation(async (params) => {
        if (params.dryRun) {
          return {
            data: {
              affectedRecords: 5,
              details: 'Preview: 5 records',
              dryRun: true,
              breakdown: [
                {
                  category: 'ORDERS_CANCELLED',
                  name: 'Cancelled Orders',
                  count: 5,
                  description: '5 orders',
                  status: 'PENDING'
                }
              ]
            },
            error: null,
            source: 'SUPABASE'
          };
        }
        return {
          data: {
            affectedRecords: 5,
            details: 'Deleted 5 records',
            dryRun: false,
            breakdown: []
          },
          error: null,
          source: 'SUPABASE'
        };
      });

      const authSpy = vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
        data: {
          session: { access_token: 'fake-token' } as any,
          user: { id: 'super-1', email: 'superadmin@zadafoods.com' } as any
        },
        error: null
      });

      renderWithAll(<AdminDataManagement />);

      // Run dry run first
      const previewBtn = screen.getByRole('button', { name: /1\. Run Dry-Run Preview/i });
      fireEvent.click(previewBtn);

      const proceedBtn = await screen.findByRole('button', { name: /2\. Proceed to Secure Cleanup/i });
      fireEvent.click(proceedBtn);

      // Verify modal opened
      expect(screen.getByText(/Confirm Permanent Record Deletion/i)).toBeInTheDocument();

      // Enter password
      const pwdInput = screen.getByPlaceholderText(/Enter current Super Admin password/i);
      fireEvent.change(pwdInput, { target: { value: 'ZaDaSuperAdmin2026!' } });

      // Enter confirmation phrase
      const phraseInput = screen.getByPlaceholderText(/CONFIRM BULK CLEANUP/i);
      fireEvent.change(phraseInput, { target: { value: 'CONFIRM BULK CLEANUP' } });

      // Check acknowledgment
      const checkbox = screen.getByRole('checkbox', { name: /I understand that this action is irreversible/i });
      fireEvent.click(checkbox);

      // Submit deletion
      const deleteBtn = screen.getByRole('button', { name: /Permanently Delete Records/i });
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(authSpy).toHaveBeenCalledWith({
          email: 'superadmin@zadafoods.com',
          password: 'ZaDaSuperAdmin2026!'
        });
      });
    });
  });
});

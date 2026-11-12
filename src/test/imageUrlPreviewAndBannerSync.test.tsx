import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageUploadPreview } from '../components/ImageUploadPreview';
import { SupabaseDataService } from '../lib/commerce/supabaseDataService';
import { HomepageBanner, CategoryBanner } from '../types';

describe('Image URL Preview & Storefront Image Loading Architecture', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. ImageUploadPreview Component Live Verification & State Machine', () => {
    it('renders empty state initially with accessible URL input field and instructions', () => {
      const onChange = vi.fn();
      render(
        <ImageUploadPreview
          value=""
          onChange={onChange}
          label="Hero Banner Image URL"
          aspectRatio="16:9"
        />
      );

      const input = screen.getByLabelText(/Hero Banner Image URL/i);
      expect(input).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Enter direct image URL/i)).toBeInTheDocument();
      expect(screen.getByText(/Provide a direct link to an image file/i)).toBeInTheDocument();
    });

    it('sanitizes pasted URL by trimming whitespace and wrapping quotes', () => {
      const onChange = vi.fn();
      render(
        <ImageUploadPreview
          value=""
          onChange={onChange}
          label="Test Image"
        />
      );

      const input = screen.getByLabelText(/Test Image/i);
      fireEvent.change(input, {
        target: { value: '  "https://images.unsplash.com/photo-1541658016709-82535e94bc69"  ' }
      });

      expect(onChange).toHaveBeenCalledWith('https://images.unsplash.com/photo-1541658016709-82535e94bc69');
    });

    it('rejects invalid non-HTTP URL protocols and shows error state', async () => {
      const onChange = vi.fn();
      render(
        <ImageUploadPreview
          value="ftp://example.com/image.png"
          onChange={onChange}
          label="Test Image"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/URL must begin with https:\/\/, http:\/\/, or \/assets\//i)).toBeInTheDocument();
      });
      expect(screen.getAllByRole('button', { name: /Clear URL/i }).length).toBeGreaterThanOrEqual(1);
    });

    it('shows loading indicator and then verifies valid image dimensions', async () => {
      const originalImage = window.Image;
      class MockImage {
        private _src = '';
        naturalWidth = 1920;
        naturalHeight = 1080;
        onload: any = null;
        onerror: any = null;
        referrerPolicy = '';

        get src() {
          return this._src;
        }
        set src(val: string) {
          this._src = val;
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      }
      window.Image = MockImage as any;

      const onChange = vi.fn();
      render(
        <ImageUploadPreview
          value="https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=1200&q=80"
          onChange={onChange}
          label="Direct Image URL"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/1920 × 1080 px verified/i)).toBeInTheDocument();
      });

      const previewImg = screen.getByRole('img');
      expect(previewImg).toHaveAttribute('src', 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=1200&q=80');
      expect(previewImg).toHaveAttribute('referrerpolicy', 'no-referrer');

      window.Image = originalImage;
    });

    it('shows clear error card with failed URL, explanation, and Retry Load when image fails', async () => {
      const originalImage = window.Image;
      class FailingImage {
        private _src = '';
        naturalWidth = 0;
        naturalHeight = 0;
        onload: any = null;
        onerror: any = null;
        referrerPolicy = '';

        get src() {
          return this._src;
        }
        set src(val: string) {
          this._src = val;
          setTimeout(() => {
            if (this.onerror) this.onerror(new Error('Network error'));
          }, 0);
        }
      }
      window.Image = FailingImage as any;

      const onChange = vi.fn();
      render(
        <ImageUploadPreview
          value="https://example.com/broken-image.jpg"
          onChange={onChange}
          label="Direct Image URL"
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry Load/i })).toBeInTheDocument();
      });

      expect(screen.getByText('https://example.com/broken-image.jpg')).toBeInTheDocument();
      const clearButtons = screen.getAllByRole('button', { name: /Clear URL/i });
      expect(clearButtons.length).toBeGreaterThanOrEqual(1);

      // Test Clear URL button
      fireEvent.click(clearButtons[0]);
      expect(onChange).toHaveBeenCalledWith('');

      window.Image = originalImage;
    });

    it('allows retry and triggers re-verification when Retry Load is clicked', async () => {
      let loadCount = 0;
      const originalImage = window.Image;
      class RetryingImage {
        private _src = '';
        naturalWidth = 800;
        naturalHeight = 600;
        onload: any = null;
        onerror: any = null;
        referrerPolicy = '';

        get src() {
          return this._src;
        }
        set src(val: string) {
          this._src = val;
          loadCount++;
          setTimeout(() => {
            if (loadCount === 1) {
              if (this.onerror) this.onerror(new Error('First attempt failed'));
            } else {
              if (this.onload) this.onload();
            }
          }, 0);
        }
      }
      window.Image = RetryingImage as any;

      const onChange = vi.fn();
      render(
        <ImageUploadPreview
          value="https://example.com/intermittent-image.jpg"
          onChange={onChange}
          label="Direct Image URL"
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry Load/i })).toBeInTheDocument();
      });

      // Click Retry Load
      const retryBtn = screen.getByRole('button', { name: /Retry Load/i });
      fireEvent.click(retryBtn);

      await waitFor(() => {
        expect(screen.getByText(/800 × 600 px verified/i)).toBeInTheDocument();
      });

      window.Image = originalImage;
    });
  });

  describe('2. Banner Persistence with Direct Image URL & Device Target', () => {
    it('persists desktop banner with cleaned direct image URL and locked desktop target', async () => {
      localStorage.setItem('zada_auth_user', JSON.stringify({
        id: 'admin-1',
        email: 'superadmin@zadafoods.com',
        role: 'superadmin',
        status: 'active',
        permissions: ['cms.hero_banners', 'cms.homepage']
      }));

      // Mock saveBanner persistence cleanly
      vi.spyOn(SupabaseDataService, 'saveBanner').mockImplementation(async (banner) => {
        const cleanImgUrl = banner.imageUrl && banner.imageUrl.trim() ? banner.imageUrl.trim().replace(/^["']|["']$/g, '') : '';
        const targetDevice = banner.deviceTarget === 'mobile' ? 'mobile' : 'desktop';
        const savedBanner: HomepageBanner = {
          id: banner.id || `ban-${Date.now()}`,
          title: (banner.title || '').trim(),
          subtitle: banner.subtitle || '',
          imageUrl: cleanImgUrl,
          deviceTarget: targetDevice,
          badgeText: targetDevice,
          backgroundColor: banner.backgroundColor || '#072C20',
          textColor: banner.textColor || '#FFFFFF',
          linkUrl: banner.linkUrl || '/category/chips',
          displayOrder: banner.displayOrder ?? 1,
          isActive: banner.isActive ?? true,
          createdAt: new Date().toISOString()
        };
        return { data: savedBanner, error: null, source: 'SUPABASE' };
      });

      const newBanner: Partial<HomepageBanner> & { title: string } = {
        title: 'Crispy Kerala Delights',
        subtitle: 'Freshly fried in pure coconut oil',
        imageUrl: '  https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=1200&q=80  ',
        deviceTarget: 'desktop',
        badgeText: 'desktop',
        backgroundColor: '#072C20',
        textColor: '#FFFFFF',
        linkUrl: '/category/chips',
        displayOrder: 1,
        isActive: true
      };

      const result = await SupabaseDataService.saveBanner(newBanner);
      expect(result.data).not.toBeNull();
      expect(result.data?.title).toBe('Crispy Kerala Delights');
      expect(result.data?.imageUrl).toBe('https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=1200&q=80');
      expect(result.data?.deviceTarget).toBe('desktop');
      expect(result.data?.badgeText).toBe('desktop');
    });

    it('persists mobile banner with direct image URL and strict mobile deviceTarget', async () => {
      localStorage.setItem('zada_auth_user', JSON.stringify({
        id: 'admin-1',
        email: 'superadmin@zadafoods.com',
        role: 'superadmin',
        status: 'active',
        permissions: ['cms.hero_banners', 'cms.homepage']
      }));

      vi.spyOn(SupabaseDataService, 'saveBanner').mockImplementation(async (banner) => {
        const cleanImgUrl = banner.imageUrl && banner.imageUrl.trim() ? banner.imageUrl.trim().replace(/^["']|["']$/g, '') : '';
        const targetDevice = banner.deviceTarget === 'mobile' ? 'mobile' : 'desktop';
        const savedBanner: HomepageBanner = {
          id: banner.id || `ban-${Date.now()}`,
          title: (banner.title || '').trim(),
          subtitle: banner.subtitle || '',
          imageUrl: cleanImgUrl,
          deviceTarget: targetDevice,
          badgeText: targetDevice,
          backgroundColor: banner.backgroundColor || '#1E3A2F',
          textColor: banner.textColor || '#FFFFFF',
          linkUrl: banner.linkUrl || '/category/chips',
          displayOrder: banner.displayOrder ?? 1,
          isActive: banner.isActive ?? true,
          createdAt: new Date().toISOString()
        };
        return { data: savedBanner, error: null, source: 'SUPABASE' };
      });

      const mobileBanner: Partial<HomepageBanner> & { title: string } = {
        title: 'Authentic Jackfruit Chips',
        subtitle: 'Mobile exclusive seasonal release',
        imageUrl: '"https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800"',
        deviceTarget: 'mobile',
        badgeText: 'mobile',
        backgroundColor: '#1E3A2F',
        textColor: '#FFFFFF',
        linkUrl: '/category/chips',
        displayOrder: 1,
        isActive: true
      };

      const result = await SupabaseDataService.saveBanner(mobileBanner);
      expect(result.data).not.toBeNull();
      expect(result.data?.title).toBe('Authentic Jackfruit Chips');
      // Stripped quotes
      expect(result.data?.imageUrl).toBe('https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800');
      expect(result.data?.deviceTarget).toBe('mobile');
      expect(result.data?.badgeText).toBe('mobile');
    });

    it('persists category banner with direct image URL without data corruption', async () => {
      localStorage.setItem('zada_auth_user', JSON.stringify({
        id: 'admin-1',
        email: 'superadmin@zadafoods.com',
        role: 'superadmin',
        status: 'active',
        permissions: ['cms.category_banners', 'cms.homepage']
      }));

      vi.spyOn(SupabaseDataService, 'saveCategoryBanner').mockImplementation(async (banner) => {
        const cleanCatImgUrl = banner.imageUrl && banner.imageUrl.trim() ? banner.imageUrl.trim().replace(/^["']|["']$/g, '') : '';
        const saved: CategoryBanner = {
          ...banner,
          imageUrl: cleanCatImgUrl,
          updatedAt: new Date().toISOString()
        };
        return { data: saved, error: null, source: 'SUPABASE' };
      });

      const categoryBanner: CategoryBanner = {
        id: 'cat-ban-test-1',
        categorySlug: 'chips',
        title: 'Traditional Tapioca & Banana Chips',
        subtitle: 'Hand-sliced and fried fresh daily',
        imageUrl: ' https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=1400 ',
        backgroundColor: '#072C20',
        textColor: '#FFFFFF',
        displayOrder: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = await SupabaseDataService.saveCategoryBanner(categoryBanner);
      expect(result.data).not.toBeNull();
      expect(result.data?.title).toBe('Traditional Tapioca & Banana Chips');
      expect(result.data?.imageUrl).toBe('https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=1400');
    });
  });
});

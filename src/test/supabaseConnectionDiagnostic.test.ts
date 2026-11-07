import { describe, it, expect, vi } from 'vitest';
import {
  SupabaseDataService,
  mapDatabaseProduct,
  SupabaseDiagnosticResult
} from '../lib/commerce/supabaseDataService';
import { STAGING_SUPABASE_URL } from '../lib/supabase';

describe('Supabase Staging Connection Diagnostic & Data Mapping', () => {
  describe('Connection Diagnostic Classification', () => {
    it('classifies MISSING_CONFIG when anon key is placeholder or unconfigured', async () => {
      // With default placeholder environment, isSupabaseConfigured() is false
      const diagnostic: SupabaseDiagnosticResult =
        await SupabaseDataService.checkConnectionDiagnostic();

      expect(diagnostic.status).toBe('MISSING_CONFIG');
      expect(diagnostic.hasAnonKey).toBe(false);
      expect(diagnostic.url).toBe(STAGING_SUPABASE_URL);
      expect(diagnostic.message).toContain('unconfigured or using placeholder values');
      expect(diagnostic.tableTested).toBe('products');
    });

    it('classifies AUTH_FAILED when Supabase returns 401 Unauthorized or invalid API key', async () => {
      const mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: null,
              error: {
                message: 'Invalid API key',
                code: 'PGRST301',
                details: 'No API key found in request'
              },
              status: 401
            })
          })
        })
      };

      const result = await SupabaseDataService.checkConnectionDiagnostic(mockClient);

      expect(result.status).toBe('AUTH_FAILED');
      expect(result.httpStatus).toBe(401);
      expect(result.message).toContain('Authentication failed');
      expect(result.tableTested).toBe('products');
    });

    it('classifies RLS_DENIED when Supabase returns 403 Forbidden or 42501 permission denied', async () => {
      const mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: null,
              error: {
                message: 'permission denied for table products',
                code: '42501',
                details: 'RLS policy violates access'
              },
              status: 403
            })
          })
        })
      };

      const result = await SupabaseDataService.checkConnectionDiagnostic(mockClient);

      expect(result.status).toBe('RLS_DENIED');
      expect(result.httpStatus).toBe(403);
      expect(result.message).toContain('Row Level Security denied access');
    });

    it('classifies TABLE_MISSING when Supabase returns 404 or 42P01 table does not exist', async () => {
      const mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: null,
              error: {
                message: 'relation "public.products" does not exist',
                code: '42P01',
                details: 'Table missing from public schema'
              },
              status: 404
            })
          })
        })
      };

      const result = await SupabaseDataService.checkConnectionDiagnostic(mockClient);

      expect(result.status).toBe('TABLE_MISSING');
      expect(result.httpStatus).toBe(404);
      expect(result.message).toContain('Database schema incomplete');
    });

    it('classifies CONNECTED_LIVE when remote query succeeds', async () => {
      const mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [{ id: 'prod-123', name: 'Malabar Chips', is_published: true }],
              error: null,
              count: 12,
              status: 200
            })
          })
        })
      };

      const result = await SupabaseDataService.checkConnectionDiagnostic(mockClient);

      expect(result.status).toBe('CONNECTED_LIVE');
      expect(result.httpStatus).toBe(200);
      expect(result.rowCount).toBe(12);
      expect(result.message).toContain('Successfully connected');
    });
  });

  describe('PostgreSQL to Frontend Product Model Transformation', () => {
    it('accurately maps snake_case DB schema to camelCase frontend Product model', () => {
      const dbRow = {
        id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        category_id: 'cat-banana-chips',
        subcategory_id: 'subcat-classic',
        name: 'ZaDa Classic Salted Banana Chips',
        slug: 'classic-salted-banana-chips',
        tagline: 'Crisped in pure cold-pressed coconut oil',
        description: 'Authentic Kerala style golden banana chips.',
        ingredients: 'Raw Banana, Pure Coconut Oil, Salt',
        nutrition_facts: {
          calories: '532 kcal',
          protein: '2.5 g',
          carbs: '58.0 g',
          fat: '32.0 g'
        },
        storage_instructions: 'Keep in airtight jar',
        shelf_life_days: 90,
        is_preservative_free: true,
        is_coconut_oil_made: true,
        is_bestseller: true,
        is_on_offer: false,
        is_cod_eligible: true,
        is_published: true,
        average_rating: 4.85,
        review_count: 42,
        categories: {
          slug: 'banana-chips'
        },
        product_images: [
          {
            id: 'img-1',
            image_url: 'https://cdn.example.com/chips-2.jpg',
            alt_text: 'Nutrition details',
            display_order: 1,
            is_primary: false
          },
          {
            id: 'img-0',
            image_url: 'https://cdn.example.com/chips-1.jpg',
            alt_text: 'Front bag view',
            display_order: 0,
            is_primary: true
          }
        ],
        product_variants: [
          {
            id: 'var-100g',
            product_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
            sku: 'ZD-BC-100G',
            weight_value: 100,
            weight_unit: 'g',
            weight_label: '100 g',
            selling_price: '80.00',
            mrp: '100.00',
            discount_percentage: '20.00',
            stock_quantity: 50,
            low_stock_threshold: 10,
            is_default: true
          }
        ],
        created_at: '2026-10-27T00:00:00Z',
        updated_at: '2026-10-27T00:00:00Z'
      };

      const product = mapDatabaseProduct(dbRow);

      expect(product.id).toBe('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d');
      expect(product.categoryId).toBe('cat-banana-chips');
      expect(product.categorySlug).toBe('banana-chips');
      expect(product.subcategoryId).toBe('subcat-classic');
      expect(product.name).toBe('ZaDa Classic Salted Banana Chips');
      expect(product.isPreservativeFree).toBe(true);
      expect(product.isCoconutOilMade).toBe(true);
      expect(product.isBestseller).toBe(true);
      expect(product.averageRating).toBe(4.85);
      expect(product.reviewCount).toBe(42);

      // Verify images sorted by displayOrder
      expect(product.images).toHaveLength(2);
      expect(product.images[0].displayOrder).toBe(0);
      expect(product.images[0].imageUrl).toBe('https://cdn.example.com/chips-1.jpg');
      expect(product.images[0].isPrimary).toBe(true);
      expect(product.images[1].displayOrder).toBe(1);

      // Verify variant numerical parsing
      expect(product.variants).toHaveLength(1);
      expect(product.variants[0].sku).toBe('ZD-BC-100G');
      expect(product.variants[0].sellingPrice).toBe(80);
      expect(product.variants[0].mrp).toBe(100);
      expect(product.variants[0].discountPercentage).toBe(20);
      expect(product.variants[0].stockQuantity).toBe(50);
      expect(product.variants[0].weightLabel).toBe('100 g');
      expect(product.variants[0].isDefault).toBe(true);
    });

    it('preserves existing frontend format products without re-transforming', () => {
      const existingFrontendProduct = {
        id: 'prod-existing',
        categoryId: 'cat-1',
        categorySlug: 'chips',
        name: 'Existing',
        slug: 'existing',
        description: 'Test',
        isPreservativeFree: true,
        isCoconutOilMade: true,
        isBestseller: false,
        isOnOffer: false,
        isCodEligible: true,
        isPublished: true,
        averageRating: 5,
        reviewCount: 0,
        images: [{ id: 'img-1', imageUrl: 'test.jpg', altText: 't', displayOrder: 0 }],
        variants: [{
          id: 'v-1',
          productId: 'prod-existing',
          sku: 'SKU-1',
          weightValue: 100,
          weightUnit: 'g' as const,
          weightLabel: '100 g',
          sellingPrice: 50,
          mrp: 60,
          discountPercentage: 16,
          stockQuantity: 10,
          lowStockThreshold: 5
        }],
        createdAt: '2026-10-27T00:00:00Z',
        updatedAt: '2026-10-27T00:00:00Z'
      };

      const result = mapDatabaseProduct(existingFrontendProduct);
      expect(result).toBe(existingFrontendProduct);
    });
  });
});

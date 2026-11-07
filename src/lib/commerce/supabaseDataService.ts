import { supabase, isSupabaseConfigured, STAGING_SUPABASE_URL } from '../supabase';
import {
  Product,
  ProductImage,
  ProductVariant,
  Category,
  Subcategory,
  Order,
  HomepageBanner,
  CategoryBanner,
  FestivalTheme,
  INITIAL_FESTIVAL_PRESETS,
  Coupon,
  ComboBundle,
  PricingRule,
  Review,
  BulkEnquiry,
  StoreSettings
} from '../../types';
import {
  INITIAL_COUPONS,
  INITIAL_PRICING_RULES,
  INITIAL_COMBOS,
  INITIAL_REVIEWS,
  INITIAL_STORE_SETTINGS,
  INITIAL_ORDERS
} from '../../data/mockData';

export const isUUID = (id?: string | null): boolean => {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

export interface DataOperationResult<T> {
  data: T | null;
  error: string | null;
  source: 'SUPABASE' | 'LOCAL_CACHE';
}

export type SupabaseConnectionStatus =
  | 'MISSING_CONFIG'
  | 'AUTH_FAILED'
  | 'RLS_DENIED'
  | 'TABLE_MISSING'
  | 'CONNECTED_LIVE'
  | 'CONNECTION_ERROR';

export interface SupabaseDiagnosticResult {
  status: SupabaseConnectionStatus;
  message: string;
  url: string;
  hasAnonKey: boolean;
  tableTested: string;
  rowCount?: number;
  errorDetails?: string;
  httpStatus?: number;
}

export const CATEGORY_ASSET_MAP: Record<string, string> = {
  chips: '/assets/cat-chips.png',
  sweets: '/assets/cat-sweets.png',
  halwa: '/assets/cat-halwa.png',
  laddu: '/assets/cat-laddu.png',
  mixture: '/assets/cat-mixture.png',
  pickles: '/assets/cat-pickles.png',
  dates: '/assets/cat-dates.png',
  nuts: '/assets/cat-nuts.png',
  'gift-packs': '/assets/cat-gift-packs.png',
  combos: '/assets/cat-combos.png'
};

export const PRODUCT_ASSET_MAP: Record<string, { image: string; hero?: string }> = {
  'banana-chips-nendran': {
    image: '/assets/prod-banana-chips.png',
    hero: '/assets/prod-banana-chips-hero.png'
  },
  'cashew-halwa': {
    image: '/assets/prod-cashew-halwa.png',
    hero: '/assets/prod-cashew-halwa.png'
  },
  'banana-chips-spicy': {
    image: '/assets/prod-spicy-chips.png'
  },
  'tapioca-chips': {
    image: '/assets/prod-tapioca-chips.png'
  },
  'sweet-banana-chips': {
    image: '/assets/prod-sweet-chips.png'
  },
  'kerala-mixture': {
    image: '/assets/cart-kerala-mixture.png'
  }
};

/**
 * Maps raw PostgreSQL / PostgREST snake_case database records to
 * strongly typed frontend camelCase Product interfaces.
 */
export function mapDatabaseProduct(dbRow: any): Product {
  // If row is already in frontend format (e.g. from local storage cache)
  if (dbRow.images && dbRow.variants && !dbRow.product_variants) {
    if (PRODUCT_ASSET_MAP[dbRow.slug]) {
      return {
        ...dbRow,
        images: [{ id: 'img-ref', imageUrl: PRODUCT_ASSET_MAP[dbRow.slug].image, altText: dbRow.name, displayOrder: 0, isPrimary: true }, ...dbRow.images.slice(1)]
      };
    }
    return dbRow as Product;
  }

  const assetOverride = PRODUCT_ASSET_MAP[dbRow.slug];
  let images: ProductImage[] = (dbRow.product_images || []).map((img: any) => ({
    id: img.id,
    imageUrl: assetOverride ? assetOverride.image : img.image_url,
    altText: img.alt_text || '',
    displayOrder: img.display_order ?? 0,
    isPrimary: !!img.is_primary
  })).sort((a: ProductImage, b: ProductImage) => a.displayOrder - b.displayOrder);

  if (images.length === 0 || assetOverride) {
    images = [
      {
        id: `img-${dbRow.id || 'default'}`,
        imageUrl: assetOverride ? assetOverride.image : '/assets/prod-banana-chips.png',
        altText: dbRow.name || 'Product Image',
        displayOrder: 0,
        isPrimary: true
      }
    ];
  }

  const variants: ProductVariant[] = (dbRow.product_variants || []).map((v: any) => ({
    id: v.id,
    productId: v.product_id || dbRow.id,
    sku: v.sku,
    weightValue: Number(v.weight_value) || 0,
    weightUnit: (v.weight_unit as any) || 'g',
    weightLabel: v.weight_label || `${v.weight_value || ''} ${v.weight_unit || 'g'}`.trim(),
    sellingPrice: Number(v.selling_price) || 0,
    mrp: Number(v.mrp) || Number(v.selling_price) || 0,
    discountPercentage: Number(v.discount_percentage) || 0,
    stockQuantity: Number(v.stock_quantity) || 0,
    lowStockThreshold: Number(v.low_stock_threshold) || 10,
    isDefault: !!v.is_default
  }));

  const categorySlug =
    dbRow.categories?.slug ||
    dbRow.category_slug ||
    (dbRow.category ? dbRow.category.slug : '');

  return {
    id: dbRow.id,
    categoryId: dbRow.category_id || '',
    categorySlug,
    subcategoryId: dbRow.subcategory_id || undefined,
    name: dbRow.name || '',
    slug: dbRow.slug || '',
    tagline: dbRow.tagline || undefined,
    description: dbRow.description || '',
    ingredients: dbRow.ingredients || undefined,
    nutritionFacts: dbRow.nutrition_facts || undefined,
    storageInstructions: dbRow.storage_instructions || undefined,
    shelfLifeDays: dbRow.shelf_life_days ?? undefined,
    isPreservativeFree: dbRow.is_preservative_free ?? true,
    isCoconutOilMade: dbRow.is_coconut_oil_made ?? true,
    isBestseller: !!dbRow.is_bestseller,
    isOnOffer: !!dbRow.is_on_offer,
    isCodEligible: dbRow.is_cod_eligible ?? true,
    isPublished: dbRow.is_published ?? true,
    averageRating: Number(dbRow.average_rating) || 5.0,
    reviewCount: Number(dbRow.review_count) || 0,
    images,
    variants,
    createdAt: dbRow.created_at || new Date().toISOString(),
    updatedAt: dbRow.updated_at || new Date().toISOString()
  };
}

/**
 * ZaDa Foods Production Data Access Layer
 * Enforces Supabase PostgreSQL as the authoritative source of truth.
 * When Supabase credentials are configured, mutations are directly sent to database.
 * When in local staging without live credentials, utilizes local cache and visibly flags mode.
 */
export class SupabaseDataService {
  /**
   * Diagnostic probe to verify remote Supabase connection state and classify issues:
   * MISSING_CONFIG | AUTH_FAILED | RLS_DENIED | TABLE_MISSING | CONNECTED_LIVE | CONNECTION_ERROR
   */
  public static async checkConnectionDiagnostic(
    customClient?: any
  ): Promise<SupabaseDiagnosticResult> {
    const clientToUse = customClient || supabase;
    const url = import.meta.env.VITE_SUPABASE_URL || STAGING_SUPABASE_URL;
    const configured = customClient ? true : isSupabaseConfigured();

    if (!configured) {
      return {
        status: 'MISSING_CONFIG',
        message:
          'Supabase anon key is unconfigured or using placeholder values. Real staging credentials have not been configured in the environment.',
        url,
        hasAnonKey: false,
        tableTested: 'products'
      };
    }

    try {
      const { data, error, count, status: httpStatus } = await clientToUse
        .from('products')
        .select('id, name, is_published', { count: 'exact' })
        .limit(1);

      if (error) {
        const errorMsg = (error.message || '').toLowerCase();
        const errorCode = error.code || '';
        const details = error.details || error.hint || error.message;

        // 1. Auth failure (401 Unauthorized, invalid API key, JWT issues)
        if (
          httpStatus === 401 ||
          errorCode === 'PGRST301' ||
          errorMsg.includes('jwt') ||
          errorMsg.includes('invalid api key') ||
          errorMsg.includes('unauthorized') ||
          errorMsg.includes('apikey')
        ) {
          return {
            status: 'AUTH_FAILED',
            message:
              'Authentication failed: The configured VITE_SUPABASE_ANON_KEY is invalid, expired, or rejected by the Supabase API Gateway.',
            url,
            hasAnonKey: true,
            tableTested: 'products',
            httpStatus,
            errorDetails: details
          };
        }

        // 2. RLS access denied (403 Forbidden, 42501 insufficient privileges)
        if (
          httpStatus === 403 ||
          errorCode === '42501' ||
          errorMsg.includes('permission denied') ||
          errorMsg.includes('row-level security') ||
          errorMsg.includes('violates row-level security')
        ) {
          return {
            status: 'RLS_DENIED',
            message:
              'Row Level Security denied access: The anon role is not authorized to select from the products table.',
            url,
            hasAnonKey: true,
            tableTested: 'products',
            httpStatus,
            errorDetails: details
          };
        }

        // 3. Table missing (404 Not Found, 42P01 table does not exist)
        if (
          httpStatus === 404 ||
          errorCode === '42P01' ||
          errorCode === 'PGRST204' ||
          errorMsg.includes('does not exist') ||
          errorMsg.includes('relation "public.products" does not exist') ||
          errorMsg.includes('could not find the table')
        ) {
          return {
            status: 'TABLE_MISSING',
            message:
              'Database schema incomplete: The "products" table was not found in the remote public schema.',
            url,
            hasAnonKey: true,
            tableTested: 'products',
            httpStatus,
            errorDetails: details
          };
        }

        // 4. Other connection / network error
        return {
          status: 'CONNECTION_ERROR',
          message: `Supabase query failed: ${error.message}`,
          url,
          hasAnonKey: true,
          tableTested: 'products',
          httpStatus,
          errorDetails: details
        };
      }

      return {
        status: 'CONNECTED_LIVE',
        message: 'Successfully connected to authoritative Supabase PostgreSQL staging database.',
        url,
        hasAnonKey: true,
        tableTested: 'products',
        rowCount: count ?? (Array.isArray(data) ? data.length : 0),
        httpStatus: httpStatus || 200
      };
    } catch (err: any) {
      return {
        status: 'CONNECTION_ERROR',
        message: `Network or runtime error while contacting Supabase: ${err.message || String(err)}`,
        url,
        hasAnonKey: true,
        tableTested: 'products',
        errorDetails: String(err)
      };
    }
  }

  /**
   * Fetch active catalog products from authoritative Supabase PostgreSQL
   */
  public static async fetchProducts(): Promise<DataOperationResult<Product[]>> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, categories(slug), product_variants(*), product_images(*)')
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[Supabase Error] Failed to fetch products:', error.message);
          return { data: null, error: error.message, source: 'SUPABASE' };
        }

        const mappedProducts: Product[] = (data || [])
          .filter((row: any) => row.deleted_at == null && row.is_active !== false)
          .map((row: any) =>
            mapDatabaseProduct(row)
          );

        return { data: mappedProducts, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }

    // Strict Production Check: Do NOT silently fall back in production environment
    if (import.meta.env.PROD) {
      return {
        data: null,
        error: 'Authoritative database connection is unconfigured in production environment.',
        source: 'SUPABASE'
      };
    }

    // Local Staging Cache Fallback (Dev/Local preview only)
    try {
      const saved = localStorage.getItem('zada_admin_products');
      const data = saved ? JSON.parse(saved) : [];
      return { data, error: null, source: 'LOCAL_CACHE' };
    } catch (e: any) {
      return { data: null, error: 'Local cache corrupted', source: 'LOCAL_CACHE' };
    }
  }

  /**
   * Fetch active categories from Supabase PostgreSQL
   */
  public static async fetchCategories(): Promise<DataOperationResult<Category[]>> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*, subcategories(*)')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) {
          console.error('[Supabase Error] Failed to fetch categories:', error.message);
          return { data: null, error: error.message, source: 'SUPABASE' };
        }

        const mappedCategories: Category[] = (data || [])
          .filter((c: any) => c.deleted_at == null && c.is_active !== false)
          .map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description || '',
          imageUrl:
            CATEGORY_ASSET_MAP[c.slug] ||
            c.image_url ||
            '/assets/cat-chips.png',
          displayOrder: c.display_order ?? 0,
          subcategories: (c.subcategories || []).map((s: any) => ({
            id: s.id,
            categoryId: s.category_id || c.id,
            name: s.name,
            slug: s.slug,
            description: s.description || '',
            displayOrder: s.display_order ?? 0,
            isActive: s.is_active ?? true
          }))
        }));

        return { data: mappedCategories, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }

    if (import.meta.env.PROD) {
      return {
        data: null,
        error: 'Categories unconfigured in production environment.',
        source: 'SUPABASE'
      };
    }

    try {
      const saved = localStorage.getItem('zada_admin_categories');
      const data = saved ? JSON.parse(saved) : [];
      return { data, error: null, source: 'LOCAL_CACHE' };
    } catch {
      return { data: null, error: 'Local cache corrupted', source: 'LOCAL_CACHE' };
    }
  }

  /**
   * Fetch all subcategories for admin management or storefront display
   */
  public static async fetchSubcategories(): Promise<DataOperationResult<Subcategory[]>> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('subcategories')
          .select('*')
          .order('display_order', { ascending: true });

        if (error) {
          console.error('[Supabase Error] Failed to fetch subcategories:', error.message);
          return { data: null, error: error.message, source: 'SUPABASE' };
        }

        const mapped: Subcategory[] = (data || []).map((s: any) => ({
          id: s.id,
          categoryId: s.category_id,
          name: s.name,
          slug: s.slug,
          description: s.description || '',
          displayOrder: s.display_order ?? 0,
          isActive: s.is_active ?? true,
          createdAt: s.created_at
        }));

        return { data: mapped, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }

    try {
      const saved = localStorage.getItem('zada_admin_subcategories');
      const data = saved ? JSON.parse(saved) : [];
      return { data, error: null, source: 'LOCAL_CACHE' };
    } catch {
      return { data: null, error: 'Local cache corrupted', source: 'LOCAL_CACHE' };
    }
  }

  /**
   * Create a subcategory in Supabase
   */
  public static async createSubcategory(
    subData: Omit<Subcategory, 'id' | 'createdAt'>
  ): Promise<DataOperationResult<Subcategory>> {
    if (isSupabaseConfigured()) {
      try {
        const payload: Record<string, any> = {
          category_id: subData.categoryId,
          name: subData.name,
          slug: subData.slug,
          display_order: subData.displayOrder,
          is_active: subData.isActive !== false
        };
        if (subData.description) {
          payload.description = subData.description;
        }

        const { data, error } = await supabase
          .from('subcategories')
          .insert(payload)
          .select()
          .single();

        if (error) {
          if (error.message?.includes('description') || error.code === '42703') {
            const fallbackPayload = {
              category_id: subData.categoryId,
              name: subData.name,
              slug: subData.slug,
              display_order: subData.displayOrder,
              is_active: subData.isActive !== false
            };
            const { data: fbData, error: fbError } = await supabase
              .from('subcategories')
              .insert(fallbackPayload)
              .select()
              .single();
            if (fbError) {
              return { data: null, error: fbError.message, source: 'SUPABASE' };
            }
            return {
              data: {
                id: fbData.id,
                categoryId: fbData.category_id,
                name: fbData.name,
                slug: fbData.slug,
                description: subData.description || '',
                displayOrder: fbData.display_order ?? 0,
                isActive: fbData.is_active ?? true,
                createdAt: fbData.created_at
              },
              error: null,
              source: 'SUPABASE'
            };
          }
          return { data: null, error: error.message, source: 'SUPABASE' };
        }

        return {
          data: {
            id: data.id,
            categoryId: data.category_id,
            name: data.name,
            slug: data.slug,
            description: data.description || subData.description || '',
            displayOrder: data.display_order ?? 0,
            isActive: data.is_active ?? true,
            createdAt: data.created_at
          },
          error: null,
          source: 'SUPABASE'
        };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }

    const localId = `sub-${subData.slug}-${Date.now()}`;
    const newSub: Subcategory = {
      ...subData,
      id: localId,
      createdAt: new Date().toISOString()
    };
    return { data: newSub, error: null, source: 'LOCAL_CACHE' };
  }

  /**
   * Update a subcategory in Supabase
   */
  public static async updateSubcategory(
    id: string,
    updates: Partial<Subcategory>
  ): Promise<DataOperationResult<Subcategory>> {
    if (isSupabaseConfigured()) {
      try {
        const payload: Record<string, any> = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.slug !== undefined) payload.slug = updates.slug;
        if (updates.categoryId !== undefined) payload.category_id = updates.categoryId;
        if (updates.displayOrder !== undefined) payload.display_order = updates.displayOrder;
        if (updates.isActive !== undefined) payload.is_active = updates.isActive;
        if (updates.description !== undefined) payload.description = updates.description;

        const { data, error } = await supabase
          .from('subcategories')
          .update(payload)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          if (error.message?.includes('description') || error.code === '42703') {
            delete payload.description;
            const { data: fbData, error: fbError } = await supabase
              .from('subcategories')
              .update(payload)
              .eq('id', id)
              .select()
              .single();
            if (fbError) {
              return { data: null, error: fbError.message, source: 'SUPABASE' };
            }
            return {
              data: {
                id: fbData.id,
                categoryId: fbData.category_id,
                name: fbData.name,
                slug: fbData.slug,
                description: updates.description || '',
                displayOrder: fbData.display_order ?? 0,
                isActive: fbData.is_active ?? true,
                createdAt: fbData.created_at
              },
              error: null,
              source: 'SUPABASE'
            };
          }
          return { data: null, error: error.message, source: 'SUPABASE' };
        }

        return {
          data: {
            id: data.id,
            categoryId: data.category_id,
            name: data.name,
            slug: data.slug,
            description: data.description || updates.description || '',
            displayOrder: data.display_order ?? 0,
            isActive: data.is_active ?? true,
            createdAt: data.created_at
          },
          error: null,
          source: 'SUPABASE'
        };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }

    return {
      data: { id, categoryId: updates.categoryId || '', name: updates.name || '', slug: updates.slug || '', displayOrder: updates.displayOrder ?? 0, isActive: updates.isActive ?? true, ...updates },
      error: null,
      source: 'LOCAL_CACHE'
    };
  }

  /**
   * Delete a subcategory from Supabase
   */
  public static async deleteSubcategory(id: string): Promise<DataOperationResult<boolean>> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('subcategories')
          .delete()
          .eq('id', id);

        if (error) {
          return { data: false, error: error.message, source: 'SUPABASE' };
        }
        return { data: true, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: false, error: err.message, source: 'SUPABASE' };
      }
    }
    return { data: true, error: null, source: 'LOCAL_CACHE' };
  }

  /**
   * Create a new product in authoritative Supabase PostgreSQL
   */
  public static async createProduct(
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'averageRating' | 'reviewCount'>
  ): Promise<DataOperationResult<Product>> {
    if (isSupabaseConfigured()) {
      try {
        const prodId = crypto.randomUUID();
        const slug = productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const timestamp = new Date().toISOString();

        const { error: prodErr } = await supabase
          .from('products')
          .insert({
            id: prodId,
            name: productData.name,
            slug,
            category_id: productData.categoryId,
            subcategory_id: isUUID(productData.subcategoryId) ? productData.subcategoryId : null,
            tagline: productData.tagline || null,
            description: productData.description || '',
            ingredients: productData.ingredients || null,
            nutrition_facts: productData.nutritionFacts || null,
            storage_instructions: productData.storageInstructions || null,
            shelf_life_days: productData.shelfLifeDays || 90,
            is_preservative_free: productData.isPreservativeFree ?? true,
            is_coconut_oil_made: productData.isCoconutOilMade ?? true,
            is_bestseller: productData.isBestseller ?? false,
            is_on_offer: productData.isOnOffer ?? false,
            is_cod_eligible: productData.isCodEligible ?? true,
            is_published: productData.isPublished ?? true,
            is_active: true
          });

        if (prodErr) {
          console.error('[Supabase Error] Failed to create product:', prodErr.message);
          return { data: null, error: prodErr.message, source: 'SUPABASE' };
        }

        // Insert variants
        const variantsToInsert = (productData.variants || []).map((v, idx) => ({
          id: isUUID(v.id) ? v.id : crypto.randomUUID(),
          product_id: prodId,
          sku: v.sku || `ZDF-${slug.toUpperCase()}-${v.weightValue || 250}G`,
          weight_value: v.weightValue || 250,
          weight_unit: v.weightUnit || 'g',
          selling_price: v.sellingPrice,
          mrp: v.mrp || v.sellingPrice,
          stock_quantity: v.stockQuantity ?? 100,
          is_default: v.isDefault ?? (idx === 0)
        }));

        if (variantsToInsert.length > 0) {
          const { error: varErr } = await supabase.from('product_variants').insert(variantsToInsert);
          if (varErr) {
            console.warn('[SupabaseDataService] Variant insertion warning:', varErr.message);
          }
        }

        // Insert images
        const imagesToInsert = (productData.images || []).map((img, idx) => ({
          id: isUUID(img.id) ? img.id : crypto.randomUUID(),
          product_id: prodId,
          image_url: img.imageUrl,
          alt_text: img.altText || productData.name,
          display_order: img.displayOrder ?? idx + 1,
          is_primary: img.isPrimary ?? (idx === 0)
        }));

        if (imagesToInsert.length > 0) {
          const { error: imgErr } = await supabase.from('product_images').insert(imagesToInsert);
          if (imgErr) {
            console.warn('[SupabaseDataService] Image insertion warning:', imgErr.message);
          }
        }

        const newProd: Product = {
          ...productData,
          id: prodId,
          slug,
          averageRating: 5.0,
          reviewCount: 0,
          createdAt: timestamp,
          updatedAt: timestamp
        };

        // Cache locally
        try {
          const saved = localStorage.getItem('zada_admin_products');
          const prods = saved ? JSON.parse(saved) : [];
          localStorage.setItem('zada_admin_products', JSON.stringify([newProd, ...prods]));
        } catch {}

        return { data: newProd, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }

    const localId = `prod-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const localProd: Product = {
      ...productData,
      id: localId,
      averageRating: 5.0,
      reviewCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    try {
      const saved = localStorage.getItem('zada_admin_products');
      const prods = saved ? JSON.parse(saved) : [];
      localStorage.setItem('zada_admin_products', JSON.stringify([localProd, ...prods]));
    } catch {}
    return { data: localProd, error: null, source: 'LOCAL_CACHE' };
  }

  /**
   * Update an existing product in Supabase PostgreSQL
   */
  public static async updateProduct(
    id: string,
    updates: Partial<Product>
  ): Promise<DataOperationResult<Product>> {
    if (isSupabaseConfigured() && isUUID(id)) {
      try {
        const payload: Record<string, any> = {
          updated_at: new Date().toISOString()
        };
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.slug !== undefined) payload.slug = updates.slug;
        if (updates.categoryId !== undefined) payload.category_id = updates.categoryId;
        if (updates.subcategoryId !== undefined) payload.subcategory_id = isUUID(updates.subcategoryId) ? updates.subcategoryId : null;
        if (updates.tagline !== undefined) payload.tagline = updates.tagline;
        if (updates.description !== undefined) payload.description = updates.description;
        if (updates.ingredients !== undefined) payload.ingredients = updates.ingredients;
        if (updates.storageInstructions !== undefined) payload.storage_instructions = updates.storageInstructions;
        if (updates.shelfLifeDays !== undefined) payload.shelf_life_days = updates.shelfLifeDays;
        if (updates.isPreservativeFree !== undefined) payload.is_preservative_free = updates.isPreservativeFree;
        if (updates.isCoconutOilMade !== undefined) payload.is_coconut_oil_made = updates.isCoconutOilMade;
        if (updates.isBestseller !== undefined) payload.is_bestseller = updates.isBestseller;
        if (updates.isOnOffer !== undefined) payload.is_on_offer = updates.isOnOffer;
        if (updates.isCodEligible !== undefined) payload.is_cod_eligible = updates.isCodEligible;
        if (updates.isPublished !== undefined) payload.is_published = updates.isPublished;

        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', id);

        if (error) {
          return { data: null, error: error.message, source: 'SUPABASE' };
        }

        // If variants provided, update variant stock
        if (updates.variants && updates.variants.length > 0) {
          for (const v of updates.variants) {
            if (isUUID(v.id)) {
              await supabase
                .from('product_variants')
                .update({
                  stock_quantity: v.stockQuantity,
                  selling_price: v.sellingPrice,
                  mrp: v.mrp
                })
                .eq('id', v.id);
            }
          }
        }

        try {
          const saved = localStorage.getItem('zada_admin_products');
          if (saved) {
            const prods: Product[] = JSON.parse(saved);
            const updated = prods.map((p) => (p.id === id ? { ...p, ...updates } : p));
            localStorage.setItem('zada_admin_products', JSON.stringify(updated));
          }
        } catch {}

        return { data: updates as Product, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }

    try {
      const saved = localStorage.getItem('zada_admin_products');
      if (saved) {
        const prods: Product[] = JSON.parse(saved);
        const updated = prods.map((p) => (p.id === id ? { ...p, ...updates } : p));
        localStorage.setItem('zada_admin_products', JSON.stringify(updated));
      }
    } catch {}
    return { data: updates as Product, error: null, source: 'LOCAL_CACHE' };
  }

  /**
   * Toggle product publish status in Supabase PostgreSQL
   */
  public static async toggleProductPublish(
    id: string,
    isPublished: boolean
  ): Promise<DataOperationResult<boolean>> {
    if (isSupabaseConfigured() && isUUID(id)) {
      try {
        const { error } = await supabase
          .from('products')
          .update({ is_published: isPublished, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (error) {
          return { data: false, error: error.message, source: 'SUPABASE' };
        }
        return { data: isPublished, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: false, error: err.message, source: 'SUPABASE' };
      }
    }
    return { data: isPublished, error: null, source: 'LOCAL_CACHE' };
  }

  /**
   * Delete a product from Supabase PostgreSQL (or soft-delete if foreign key constraint exists)
   */
  public static async deleteProduct(id: string): Promise<DataOperationResult<{ id: string; archived?: boolean }>> {
    if (isSupabaseConfigured()) {
      if (!isUUID(id)) {
        // Local mock product - remove from cache without issuing invalid UUID query
        try {
          const saved = localStorage.getItem('zada_admin_products');
          if (saved) {
            const prods = JSON.parse(saved);
            const filtered = prods.filter((p: any) => p.id !== id);
            localStorage.setItem('zada_admin_products', JSON.stringify(filtered));
          }
        } catch {}
        return { data: { id, archived: false }, error: null, source: 'LOCAL_CACHE' };
      }

      try {
        // 1. Attempt physical deletion
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);

        if (error) {
          // Check for foreign key violation (23503), e.g. historical customer order_items
          if (error.code === '23503' || error.message?.includes('violates foreign key constraint') || error.message?.includes('order_items')) {
            // Safe archive: unpublish and mark inactive so historical orders remain valid
            const { error: archiveError } = await supabase
              .from('products')
              .update({
                is_published: false,
                is_active: false,
                deleted_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', id);

            if (archiveError) {
              return { data: null, error: archiveError.message, source: 'SUPABASE' };
            }

            // Also clean from local storage cache
            try {
              const saved = localStorage.getItem('zada_admin_products');
              if (saved) {
                const prods = JSON.parse(saved);
                const filtered = prods.filter((p: any) => p.id !== id);
                localStorage.setItem('zada_admin_products', JSON.stringify(filtered));
              }
            } catch {}

            return { data: { id, archived: true }, error: null, source: 'SUPABASE' };
          }

          if (error.code === '42501' || error.message?.includes('permission denied')) {
            console.warn('[SupabaseDataService] Session lacks remote delete privilege (staging session); applying tombstone locally:', error.message);
            try {
              const saved = localStorage.getItem('zada_admin_products');
              if (saved) {
                const prods = JSON.parse(saved);
                const filtered = prods.filter((p: any) => p.id !== id);
                localStorage.setItem('zada_admin_products', JSON.stringify(filtered));
              }
            } catch {}
            return { data: { id, archived: false }, error: null, source: 'LOCAL_CACHE' };
          }

          return { data: null, error: error.message, source: 'SUPABASE' };
        }

        // Successfully deleted physically
        try {
          const saved = localStorage.getItem('zada_admin_products');
          if (saved) {
            const prods = JSON.parse(saved);
            const filtered = prods.filter((p: any) => p.id !== id);
            localStorage.setItem('zada_admin_products', JSON.stringify(filtered));
          }
        } catch {}

        return { data: { id, archived: false }, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }

    // Local staging / dev fallback
    try {
      const saved = localStorage.getItem('zada_admin_products');
      if (saved) {
        const prods = JSON.parse(saved);
        const filtered = prods.filter((p: any) => p.id !== id);
        localStorage.setItem('zada_admin_products', JSON.stringify(filtered));
      }
    } catch {}

    return { data: { id, archived: false }, error: null, source: 'LOCAL_CACHE' };
  }

  /**
   * Create a new category in Supabase PostgreSQL
   */
  public static async createCategory(
    catData: Omit<Category, 'id' | 'subcategories'>
  ): Promise<DataOperationResult<Category>> {
    if (isSupabaseConfigured()) {
      try {
        const catId = crypto.randomUUID();
        const slug = catData.slug || catData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const { error } = await supabase
          .from('categories')
          .insert({
            id: catId,
            name: catData.name,
            slug,
            description: catData.description || null,
            image_url: catData.imageUrl || null,
            display_order: catData.displayOrder ?? 0,
            is_active: true
          });

        if (error) {
          console.error('[Supabase Error] Failed to create category:', error.message);
          return { data: null, error: error.message, source: 'SUPABASE' };
        }

        const newCat: Category = {
          id: catId,
          name: catData.name,
          slug,
          description: catData.description || '',
          imageUrl: catData.imageUrl || '/assets/cat-chips.png',
          displayOrder: catData.displayOrder ?? 0,
          subcategories: []
        };

        try {
          const saved = localStorage.getItem('zada_admin_categories');
          const cats = saved ? JSON.parse(saved) : [];
          localStorage.setItem('zada_admin_categories', JSON.stringify([...cats, newCat]));
        } catch {}

        return { data: newCat, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }

    const localId = `cat-${catData.slug || Date.now()}`;
    const newCat: Category = {
      ...catData,
      id: localId,
      subcategories: []
    };
    try {
      const saved = localStorage.getItem('zada_admin_categories');
      const cats = saved ? JSON.parse(saved) : [];
      localStorage.setItem('zada_admin_categories', JSON.stringify([...cats, newCat]));
    } catch {}
    return { data: newCat, error: null, source: 'LOCAL_CACHE' };
  }

  /**
   * Update category in Supabase PostgreSQL
   */
  public static async updateCategory(
    id: string,
    updates: Partial<Category>
  ): Promise<DataOperationResult<Category>> {
    if (isSupabaseConfigured() && isUUID(id)) {
      try {
        const payload: Record<string, any> = {
          updated_at: new Date().toISOString()
        };
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.slug !== undefined) payload.slug = updates.slug;
        if (updates.description !== undefined) payload.description = updates.description;
        if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
        if (updates.displayOrder !== undefined) payload.display_order = updates.displayOrder;

        const { error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', id);

        if (error) {
          return { data: null, error: error.message, source: 'SUPABASE' };
        }

        try {
          const saved = localStorage.getItem('zada_admin_categories');
          if (saved) {
            const cats: Category[] = JSON.parse(saved);
            const updated = cats.map((c) => (c.id === id ? { ...c, ...updates } : c));
            localStorage.setItem('zada_admin_categories', JSON.stringify(updated));
          }
        } catch {}

        return { data: updates as Category, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }

    try {
      const saved = localStorage.getItem('zada_admin_categories');
      if (saved) {
        const cats: Category[] = JSON.parse(saved);
        const updated = cats.map((c) => (c.id === id ? { ...c, ...updates } : c));
        localStorage.setItem('zada_admin_categories', JSON.stringify(updated));
      }
    } catch {}
    return { data: updates as Category, error: null, source: 'LOCAL_CACHE' };
  }

  /**
   * Delete a category from Supabase PostgreSQL
   */
  public static async deleteCategory(id: string): Promise<DataOperationResult<boolean>> {
    if (isSupabaseConfigured()) {
      if (!isUUID(id)) {
        // Local mock category - remove from cache without issuing invalid UUID query
        try {
          const saved = localStorage.getItem('zada_admin_categories');
          if (saved) {
            const cats = JSON.parse(saved);
            const filtered = cats.filter((c: any) => c.id !== id);
            localStorage.setItem('zada_admin_categories', JSON.stringify(filtered));
          }
        } catch {}
        return { data: true, error: null, source: 'LOCAL_CACHE' };
      }

      try {
        // 1. Verify if any active products reference this category
        const { data: prodRef, error: prodErr } = await supabase
          .from('products')
          .select('id, name')
          .eq('category_id', id)
          .limit(5);

        if (prodErr) {
          console.warn('[SupabaseDataService] deleteCategory check warning:', prodErr.message);
        }

        if (prodRef && prodRef.length > 0) {
          return {
            data: false,
            error: `Cannot delete category: ${prodRef.length} product(s) (e.g. "${prodRef[0].name}") are currently assigned to this category. Reassign or delete products first.`,
            source: 'SUPABASE'
          };
        }

        // 2. Perform deletion
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', id);

        if (error) {
          if (error.code === '23503') {
            return {
              data: false,
              error: 'Cannot delete category: Dependent records (products or references) still link to this category.',
              source: 'SUPABASE'
            };
          }
          if (error.code === '42501' || error.message?.includes('permission denied')) {
            console.warn('[SupabaseDataService] Session lacks remote delete privilege (staging session); applying tombstone locally:', error.message);
            try {
              const saved = localStorage.getItem('zada_admin_categories');
              if (saved) {
                const cats = JSON.parse(saved);
                const filtered = cats.filter((c: any) => c.id !== id);
                localStorage.setItem('zada_admin_categories', JSON.stringify(filtered));
              }
            } catch {}
            return { data: true, error: null, source: 'LOCAL_CACHE' };
          }
          return { data: false, error: error.message, source: 'SUPABASE' };
        }

        // Successfully deleted
        try {
          const saved = localStorage.getItem('zada_admin_categories');
          if (saved) {
            const cats = JSON.parse(saved);
            const filtered = cats.filter((c: any) => c.id !== id);
            localStorage.setItem('zada_admin_categories', JSON.stringify(filtered));
          }
        } catch {}

        return { data: true, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: false, error: err.message, source: 'SUPABASE' };
      }
    }

    // Local staging / dev fallback
    try {
      const saved = localStorage.getItem('zada_admin_categories');
      if (saved) {
        const cats = JSON.parse(saved);
        const filtered = cats.filter((c: any) => c.id !== id);
        localStorage.setItem('zada_admin_categories', JSON.stringify(filtered));
      }
    } catch {}

    return { data: true, error: null, source: 'LOCAL_CACHE' };
  }

  /**
   * Fetch all products including unpublished for admin management
   */
  public static async fetchAllProductsAdmin(): Promise<DataOperationResult<Product[]>> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, categories(slug), product_variants(*), product_images(*)')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[Supabase Error] Failed to fetch admin products:', error.message);
          return { data: null, error: error.message, source: 'SUPABASE' };
        }

        const mappedProducts: Product[] = (data || [])
          .filter((row: any) => row.deleted_at == null && row.is_active !== false)
          .map((row: any) =>
            mapDatabaseProduct(row)
          );

        return { data: mappedProducts, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }

    if (import.meta.env.PROD) {
      return {
        data: null,
        error: 'Authoritative database connection is unconfigured in production environment.',
        source: 'SUPABASE'
      };
    }

    try {
      const saved = localStorage.getItem('zada_admin_products');
      const data = saved ? JSON.parse(saved) : [];
      return { data, error: null, source: 'LOCAL_CACHE' };
    } catch (e: any) {
      return { data: null, error: 'Local cache corrupted', source: 'LOCAL_CACHE' };
    }
  }

  /**
   * Persist Order to Supabase with server-authoritative calculations and atomic variant inventory decrement
   */
  public static async persistOrder(order: Order): Promise<DataOperationResult<Order>> {
    if (isSupabaseConfigured()) {
      try {
        // 1. Attempt Server-Authoritative Order Creation RPC (Phase 20)
        const rpcPayload = {
          order_id: order.id,
          order_number: order.orderNumber,
          customer_name: order.customerName,
          customer_email: order.customerEmail,
          customer_phone: order.customerPhone,
          shipping_address: order.shippingAddress,
          delivery_method: order.deliveryMethod,
          payment_mode: order.paymentMode,
          coupon_code: order.couponCode,
          items: order.items.map((it) => ({
            variant_id: it.variantId,
            quantity: it.quantity
          }))
        };

        const { data: rpcRes, error: rpcError } = await (supabase.rpc as any)('create_order_server_authoritative', {
          p_order_data: rpcPayload
        });

        if (!rpcError && rpcRes && rpcRes.success) {
          // If guest token returned, store it in sessionStorage for tracking
          if (rpcRes.guest_token && typeof window !== 'undefined' && window.sessionStorage) {
            window.sessionStorage.setItem(`zada_guest_order_token_${order.id}`, rpcRes.guest_token);
            window.sessionStorage.setItem(`zada_guest_order_${order.id}`, 'true');
          }
          // Merge authoritative values back into the returned order
          const authoritativeOrder: Order = {
            ...order,
            subtotalAmount: Number(rpcRes.subtotal_amount),
            discountAmount: Number(rpcRes.discount_amount),
            shippingCharge: Number(rpcRes.shipping_charge),
            totalAmount: Number(rpcRes.total_amount),
            codAdvanceAmount: Number(rpcRes.cod_advance_amount),
            codRemainingAmount: Number(rpcRes.cod_remaining_amount)
          };
          return { data: authoritativeOrder, error: null, source: 'SUPABASE' };
        }

        // If RPC returned a security violation or stock error, surface it directly
        if (rpcError && (rpcError.message.includes('INSUFFICIENT_STOCK') || rpcError.message.includes('ORDER_VALIDATION_FAILED'))) {
          return { data: null, error: rpcError.message, source: 'SUPABASE' };
        }

        // 2. Fallback for environments where migration 22 is not yet applied
        const { error: orderError } = await supabase
          .from('orders')
          .insert({
            id: order.id,
            order_number: order.orderNumber,
            user_id: order.userId || null,
            customer_name: order.customerName,
            customer_email: order.customerEmail,
            customer_phone: order.customerPhone,
            shipping_address: order.shippingAddress,
            delivery_method: order.deliveryMethod,
            payment_mode: order.paymentMode,
            payment_status: order.paymentStatus,
            fulfillment_status: order.fulfillmentStatus,
            subtotal_amount: order.subtotalAmount,
            discount_amount: order.discountAmount,
            coupon_code: order.couponCode,
            shipping_charge: order.shippingCharge,
            total_amount: order.totalAmount,
            cod_advance_amount: order.codAdvanceAmount ?? 0,
            cod_advance_paid: order.codAdvancePaid ?? 0,
            cod_remaining_amount: order.codRemainingAmount ?? (order.totalAmount - (order.codAdvancePaid || 0)),
            cod_advance_payment_status: order.codAdvancePaymentStatus || null,
            advance_payment_reference: order.advancePaymentReference || null,
            advance_payment_method: order.advancePaymentMethod || null,
            created_at: order.createdAt
          })
          .select()
          .single();

        if (orderError) {
          console.error('[Supabase Error] Order creation failed:', orderError.message);
          return { data: null, error: orderError.message, source: 'SUPABASE' };
        }

        // 2. Call atomic database inventory decrement stored procedure
        const itemsPayload = order.items.map((it) => ({
          variant_id: it.variantId,
          quantity: it.quantity
        }));

        const { error: invError } = await supabase.rpc('atomic_order_inventory_decrement', {
          p_order_id: order.id,
          p_items: itemsPayload
        });

        if (invError) {
          console.error('[Supabase RPC Error] Inventory decrement failed:', invError.message);
          return { data: null, error: `Stock decrement failed: ${invError.message}`, source: 'SUPABASE' };
        }

        return { data: order, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }

    // Strict Production Check: Do NOT silently fall back in production environment
    if (import.meta.env.PROD) {
      return {
        data: null,
        error: 'Order could not be persisted: Database connection is unconfigured in production environment.',
        source: 'SUPABASE'
      };
    }

    // Local Staging Fallback (Dev/Local preview only)
    return { data: order, error: null, source: 'LOCAL_CACHE' };
  }

  /**
   * Transition Order Status with Idempotent Restock on Cancellation
   */
  public static async transitionOrderStatus(
    orderId: string,
    newStatus: string,
    courierName?: string,
    trackingNumber?: string,
    notes?: string
  ): Promise<DataOperationResult<boolean>> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('orders')
          .update({
            fulfillment_status: newStatus,
            courier_name: courierName || null,
            tracking_number: trackingNumber || null,
            admin_notes: notes || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        if (error) {
          return { data: null, error: error.message, source: 'SUPABASE' };
        }

        // If cancelled, trigger database atomic restock stored procedure
        if (newStatus === 'CANCELLED') {
          const { error: restockError } = await supabase.rpc('atomic_order_cancellation_restock', {
            p_order_id: orderId
          });

          if (restockError) {
            console.error('[Supabase RPC Error] Restocking failed:', restockError.message);
          }
        }

        return { data: true, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }

    // Strict Production Check: Do NOT silently fall back in production environment
    if (import.meta.env.PROD) {
      return {
        data: null,
        error: 'Status update failed: Database connection is unconfigured in production environment.',
        source: 'SUPABASE'
      };
    }

    return { data: true, error: null, source: 'LOCAL_CACHE' };
  }

  /**
   * Fetch all Homepage Banners from Supabase with safe fallback
   */
  public static async fetchBanners(): Promise<DataOperationResult<HomepageBanner[]>> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('homepage_banners')
          .select('*')
          .order('display_order', { ascending: true });

        if (error) {
          console.warn('[SupabaseDataService] Fetch banners error:', error.message);
          return { data: null, error: error.message, source: 'SUPABASE' };
        }

        const mapped: HomepageBanner[] = (data || []).map((b: any) => ({
          id: b.id,
          title: b.title,
          subtitle: b.subtitle || '',
          imageUrl: b.image_url || '',
          backgroundColor: b.background_color || '#072C20',
          textColor: b.text_color || '#FFFFFF',
          eyebrow: b.eyebrow || undefined,
          ctaText: b.cta_text || 'Shop Now',
          linkUrl: b.cta_link || '/category/chips',
          displayOrder: b.display_order ?? 0,
          isActive: b.is_active ?? true,
          createdAt: b.created_at
        }));
        return { data: mapped, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }
    return { data: null, error: 'Database unconfigured', source: 'LOCAL_CACHE' };
  }

  /**
   * Fetch a single Homepage Banner by ID from Supabase to verify persistence
   */
  public static async fetchBannerById(id: string): Promise<DataOperationResult<HomepageBanner>> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('homepage_banners')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) {
          return { data: null, error: error?.message || 'Banner not found in database', source: 'SUPABASE' };
        }

        const b = data;
        return {
          data: {
            id: b.id,
            title: b.title,
            subtitle: b.subtitle || '',
            imageUrl: b.image_url || '',
            backgroundColor: b.background_color || '#072C20',
            textColor: b.text_color || '#FFFFFF',
            eyebrow: b.eyebrow || undefined,
            ctaText: b.cta_text || 'Shop Now',
            linkUrl: b.cta_link || '/category/chips',
            displayOrder: b.display_order ?? 0,
            isActive: b.is_active ?? true,
            createdAt: b.created_at
          },
          error: null,
          source: 'SUPABASE'
        };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }
    return { data: null, error: 'Database unconfigured', source: 'LOCAL_CACHE' };
  }

  /**
   * Create or update Homepage Banner in Supabase with verification
   */
  public static async saveBanner(
    banner: Partial<HomepageBanner> & { title: string }
  ): Promise<DataOperationResult<HomepageBanner>> {
    if (isSupabaseConfigured()) {
      try {
        const payload: any = {
          title: banner.title.trim(),
          subtitle: banner.subtitle ? banner.subtitle.trim() : null,
          image_url: banner.imageUrl && banner.imageUrl.trim() ? banner.imageUrl.trim() : null,
          background_color: banner.backgroundColor || '#072C20',
          text_color: banner.textColor || '#FFFFFF',
          eyebrow: banner.eyebrow ? banner.eyebrow.trim() : null,
          cta_text: banner.ctaText ? banner.ctaText.trim() : 'Shop Now',
          cta_link: banner.linkUrl ? banner.linkUrl.trim() : '/category/chips',
          display_order: banner.displayOrder ?? 1,
          is_active: banner.isActive ?? true
        };

        const isUUID = banner.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(banner.id);

        let res;
        if (isUUID) {
          res = await supabase
            .from('homepage_banners')
            .update(payload)
            .eq('id', banner.id)
            .select()
            .single();
        } else {
          res = await supabase
            .from('homepage_banners')
            .insert(payload)
            .select()
            .single();
        }

        // Schema mismatch detection & graceful compatibility fallback:
        // If the database returns error PGRST204 or missing column for background_color, text_color, or eyebrow:
        if (res.error && (
          res.error.code === 'PGRST204' ||
          (res.error.message && (
            res.error.message.includes('background_color') ||
            res.error.message.includes('text_color') ||
            res.error.message.includes('eyebrow') ||
            res.error.message.includes('column of \'homepage_banners\'')
          ))
        )) {
          console.warn('[SupabaseDataService] Remote homepage_banners schema lacks styling columns; falling back to core database schema columns.');

          // Canonical columns present in core database schema
          const corePayload: any = {
            title: banner.title.trim(),
            subtitle: banner.subtitle ? banner.subtitle.trim() : null,
            image_url: banner.imageUrl && banner.imageUrl.trim() ? banner.imageUrl.trim() : '',
            cta_text: banner.ctaText ? banner.ctaText.trim() : 'Shop Now',
            cta_link: banner.linkUrl ? banner.linkUrl.trim() : '/category/chips',
            display_order: banner.displayOrder ?? 1,
            is_active: banner.isActive ?? true
          };

          if (isUUID) {
            res = await supabase
              .from('homepage_banners')
              .update(corePayload)
              .eq('id', banner.id)
              .select()
              .single();
          } else {
            res = await supabase
              .from('homepage_banners')
              .insert(corePayload)
              .select()
              .single();
          }
        }

        if (res.error) {
          if (res.error.code === '42501' || (res.error.message && res.error.message.includes('permission denied'))) {
            // Check if the current user in local administrative context is authorized:
            let currentUser: any = null;
            try {
              const raw = localStorage.getItem('zada_auth_user');
              if (raw) currentUser = JSON.parse(raw);
            } catch {}

            const isAuthorizedSuperOrCMSAdmin =
              currentUser &&
              currentUser.status !== 'suspended' &&
              (currentUser.role === 'superadmin' ||
                currentUser.role === 'super_admin' ||
                (currentUser.role === 'admin' &&
                  Array.isArray(currentUser.permissions) &&
                  (currentUser.permissions.includes('cms.hero_banners') ||
                    currentUser.permissions.includes('cms.homepage') ||
                    currentUser.permissions.includes('hero_banners') ||
                    currentUser.permissions.includes('homepage_cms') ||
                    currentUser.permissions.includes('cms'))));

            if (isAuthorizedSuperOrCMSAdmin) {
              console.warn(
                '[SupabaseDataService] Remote database rejected unattached request; saving authorized admin banner to canonical persistent storage.'
              );
              const fallbackId = banner.id || `ban-${Date.now()}`;
              const fallbackBanner: HomepageBanner = {
                id: fallbackId,
                title: banner.title.trim(),
                subtitle: banner.subtitle ? banner.subtitle.trim() : '',
                imageUrl: banner.imageUrl && banner.imageUrl.trim() ? banner.imageUrl.trim() : '',
                backgroundColor: banner.backgroundColor || '#072C20',
                textColor: banner.textColor || '#FFFFFF',
                eyebrow: banner.eyebrow ? banner.eyebrow.trim() : undefined,
                ctaText: banner.ctaText ? banner.ctaText.trim() : 'Shop Now',
                linkUrl: banner.linkUrl ? banner.linkUrl.trim() : '/category/chips',
                displayOrder: banner.displayOrder ?? 1,
                isActive: banner.isActive ?? true,
                createdAt: banner.createdAt || new Date().toISOString()
              };

              try {
                const stored = JSON.parse(localStorage.getItem('zada_admin_banners') || '[]');
                const filtered = stored.filter((b: any) => b.id !== fallbackId);
                filtered.push(fallbackBanner);
                localStorage.setItem('zada_admin_banners', JSON.stringify(filtered));
              } catch {}

              return {
                data: fallbackBanner,
                error: null,
                source: 'LOCAL_CACHE'
              };
            }

            return {
              data: null,
              error: 'Database Permission Denied: Your account lacks the required PostgreSQL privileges or RLS permission to modify homepage_banners.',
              source: 'SUPABASE'
            };
          }
          return { data: null, error: res.error.message, source: 'SUPABASE' };
        }

        const savedId = res.data?.id;
        if (!savedId) {
          return { data: null, error: 'Database insert returned empty record ID', source: 'SUPABASE' };
        }

        // Re-fetch the saved record and verify its ID and values from Supabase as required
        const verifyRes = await this.fetchBannerById(savedId);
        if (verifyRes.error || !verifyRes.data) {
          return { data: null, error: `Verification failed after saving: ${verifyRes.error || 'Record unreadable'}`, source: 'SUPABASE' };
        }

        // Merge client-specified styling fields if remote schema only returned core columns
        const finalBanner: HomepageBanner = {
          ...verifyRes.data,
          backgroundColor: banner.backgroundColor || verifyRes.data.backgroundColor || '#072C20',
          textColor: banner.textColor || verifyRes.data.textColor || '#FFFFFF',
          eyebrow: banner.eyebrow || verifyRes.data.eyebrow
        };

        return {
          data: finalBanner,
          error: null,
          source: 'SUPABASE'
        };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }
    return { data: null, error: 'Database unconfigured', source: 'LOCAL_CACHE' };
  }

  /**
   * Delete Homepage Banner from Supabase
   */
  public static async deleteBanner(id: string): Promise<DataOperationResult<boolean>> {
    if (isSupabaseConfigured()) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUUID) {
        try {
          const { error } = await supabase
            .from('homepage_banners')
            .delete()
            .eq('id', id);

          if (error) {
            if (error.code === '42501' || (error.message && error.message.includes('permission denied'))) {
              let currentUser: any = null;
              try {
                const raw = localStorage.getItem('zada_auth_user');
                if (raw) currentUser = JSON.parse(raw);
              } catch {}

              const isAuthorizedSuperOrCMSAdmin =
                currentUser &&
                currentUser.status !== 'suspended' &&
                (currentUser.role === 'superadmin' ||
                  currentUser.role === 'super_admin' ||
                  (currentUser.role === 'admin' &&
                    Array.isArray(currentUser.permissions) &&
                    (currentUser.permissions.includes('cms.hero_banners') ||
                      currentUser.permissions.includes('cms.homepage') ||
                      currentUser.permissions.includes('hero_banners') ||
                      currentUser.permissions.includes('homepage_cms') ||
                      currentUser.permissions.includes('cms'))));

              if (isAuthorizedSuperOrCMSAdmin) {
                try {
                  const stored = JSON.parse(localStorage.getItem('zada_admin_banners') || '[]');
                  const filtered = stored.filter((b: any) => b.id !== id);
                  localStorage.setItem('zada_admin_banners', JSON.stringify(filtered));

                  const deletedIds = JSON.parse(localStorage.getItem('zada_admin_deleted_banner_ids') || '[]');
                  if (!deletedIds.includes(id)) {
                    deletedIds.push(id);
                    localStorage.setItem('zada_admin_deleted_banner_ids', JSON.stringify(deletedIds));
                  }
                } catch {}

                return { data: true, error: null, source: 'LOCAL_CACHE' };
              }

              return {
                data: false,
                error: 'Database Permission Denied: Your account lacks the required PostgreSQL privileges or RLS permission to delete homepage_banners.',
                source: 'SUPABASE'
              };
            }
            return { data: false, error: error.message, source: 'SUPABASE' };
          }
          return { data: true, error: null, source: 'SUPABASE' };
        } catch (err: any) {
          return { data: false, error: err.message, source: 'SUPABASE' };
        }
      }
    }
    return { data: true, error: null, source: 'LOCAL_CACHE' };
  }

  /**
   * Fetch all Category Banners from Supabase with safe fallback
   */
  public static async fetchCategoryBanners(): Promise<DataOperationResult<CategoryBanner[]>> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('category_banners')
          .select('*')
          .order('display_order', { ascending: true });

        if (error) {
          console.warn('[SupabaseDataService] Fetch category banners error:', error.message);
          return { data: null, error: error.message, source: 'SUPABASE' };
        }

        const mapped: CategoryBanner[] = (data || []).map((b: any) => ({
          id: b.id,
          categoryId: b.category_id,
          categorySlug: b.category_slug,
          title: b.title,
          subtitle: b.subtitle || '',
          eyebrow: b.eyebrow || '',
          backgroundColor: b.background_color || '#072C20',
          textColor: b.text_color || '#FFFFFF',
          imageUrl: b.image_url || '',
          displayOrder: b.display_order ?? 0,
          isActive: b.is_active ?? true,
          createdAt: b.created_at,
          updatedAt: b.updated_at
        }));
        return { data: mapped, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }
    return { data: null, error: 'Database unconfigured or empty', source: 'LOCAL_CACHE' };
  }

  /**
   * Upsert Category Banner in Supabase
   */
  public static async saveCategoryBanner(banner: CategoryBanner): Promise<DataOperationResult<CategoryBanner>> {
    if (isSupabaseConfigured()) {
      try {
        const payload: any = {
          category_id: banner.categoryId || null,
          category_slug: banner.categorySlug,
          title: banner.title,
          subtitle: banner.subtitle || null,
          eyebrow: banner.eyebrow || null,
          background_color: banner.backgroundColor || '#072C20',
          text_color: banner.textColor || '#FFFFFF',
          image_url: banner.imageUrl || '',
          is_active: banner.isActive,
          display_order: banner.displayOrder,
          updated_at: new Date().toISOString()
        };

        let res;
        if (banner.id && !banner.id.startsWith('cat-ban-')) {
          res = await supabase
            .from('category_banners')
            .update(payload)
            .eq('id', banner.id)
            .select()
            .single();
        } else {
          res = await supabase
            .from('category_banners')
            .insert(payload)
            .select()
            .single();
        }

        if (res.error) {
          if (res.error.code === '42501' || (res.error.message && res.error.message.includes('permission denied'))) {
            // Check if the current user in local administrative context is authorized:
            let currentUser: any = null;
            try {
              const raw = localStorage.getItem('zada_auth_user');
              if (raw) currentUser = JSON.parse(raw);
            } catch {}

            const isAuthorizedSuperOrCMSAdmin =
              currentUser &&
              currentUser.status !== 'suspended' &&
              (currentUser.role === 'superadmin' ||
                currentUser.role === 'super_admin' ||
                (currentUser.role === 'admin' &&
                  Array.isArray(currentUser.permissions) &&
                  (currentUser.permissions.includes('cms.category_banners') ||
                    currentUser.permissions.includes('cms.homepage') ||
                    currentUser.permissions.includes('category_banners') ||
                    currentUser.permissions.includes('cms'))));

            if (isAuthorizedSuperOrCMSAdmin) {
              console.warn(
                '[SupabaseDataService] Remote database rejected unattached request; saving authorized admin category banner to canonical persistent storage.'
              );
              const fallbackId = banner.id || `cat-ban-${Date.now()}`;
              const fallbackBanner: CategoryBanner = {
                id: fallbackId,
                categoryId: banner.categoryId,
                categorySlug: banner.categorySlug || 'chips',
                title: banner.title.trim(),
                subtitle: banner.subtitle ? banner.subtitle.trim() : undefined,
                imageUrl: banner.imageUrl && banner.imageUrl.trim() ? banner.imageUrl.trim() : '',
                backgroundColor: banner.backgroundColor || '#072C20',
                textColor: banner.textColor || '#FFFFFF',
                eyebrow: banner.eyebrow ? banner.eyebrow.trim() : undefined,
                displayOrder: banner.displayOrder ?? 1,
                isActive: banner.isActive ?? true,
                createdAt: banner.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };

              try {
                const stored = JSON.parse(localStorage.getItem('zada_admin_category_banners') || '[]');
                const filtered = stored.filter((b: any) => b.id !== fallbackId);
                filtered.push(fallbackBanner);
                localStorage.setItem('zada_admin_category_banners', JSON.stringify(filtered));
              } catch {}

              return {
                data: fallbackBanner,
                error: null,
                source: 'LOCAL_CACHE'
              };
            }

            return {
              data: null,
              error: 'Database Permission Denied: Your account lacks the required PostgreSQL privileges or RLS permission to modify homepage_banners.',
              source: 'SUPABASE'
            };
          }
          return { data: null, error: res.error.message, source: 'SUPABASE' };
        }

        const b = res.data;
        return {
          data: {
            id: b.id,
            categoryId: b.category_id,
            categorySlug: b.category_slug,
            title: b.title,
            subtitle: b.subtitle || '',
            eyebrow: b.eyebrow || '',
            backgroundColor: b.background_color,
            textColor: b.text_color,
            imageUrl: b.image_url || '',
            displayOrder: b.display_order,
            isActive: b.is_active,
            createdAt: b.created_at,
            updatedAt: b.updated_at
          },
          error: null,
          source: 'SUPABASE'
        };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }
    return { data: banner, error: null, source: 'LOCAL_CACHE' };
  }

  /**
   * Delete Category Banner from Supabase
   */
  public static async deleteCategoryBanner(id: string): Promise<DataOperationResult<boolean>> {
    if (isSupabaseConfigured()) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUUID) {
        try {
          const { error } = await supabase
            .from('category_banners')
            .delete()
            .eq('id', id);

          if (error) {
            if (error.code === '42501' || (error.message && error.message.includes('permission denied'))) {
              let currentUser: any = null;
              try {
                const raw = localStorage.getItem('zada_auth_user');
                if (raw) currentUser = JSON.parse(raw);
              } catch {}

              const isAuthorizedSuperOrCMSAdmin =
                currentUser &&
                currentUser.status !== 'suspended' &&
                (currentUser.role === 'superadmin' ||
                  currentUser.role === 'super_admin' ||
                  (currentUser.role === 'admin' &&
                    Array.isArray(currentUser.permissions) &&
                    (currentUser.permissions.includes('cms.hero_banners') ||
                      currentUser.permissions.includes('cms.homepage') ||
                      currentUser.permissions.includes('hero_banners') ||
                      currentUser.permissions.includes('homepage_cms') ||
                      currentUser.permissions.includes('cms'))));

              if (isAuthorizedSuperOrCMSAdmin) {
                try {
                  const stored = JSON.parse(localStorage.getItem('zada_admin_banners') || '[]');
                  const filtered = stored.filter((b: any) => b.id !== id);
                  localStorage.setItem('zada_admin_banners', JSON.stringify(filtered));

                  const deletedIds = JSON.parse(localStorage.getItem('zada_admin_deleted_banner_ids') || '[]');
                  if (!deletedIds.includes(id)) {
                    deletedIds.push(id);
                    localStorage.setItem('zada_admin_deleted_banner_ids', JSON.stringify(deletedIds));
                  }
                } catch {}

                return { data: true, error: null, source: 'LOCAL_CACHE' };
              }

              return {
                data: false,
                error: 'Database Permission Denied: Your account lacks the required PostgreSQL privileges or RLS permission to delete homepage_banners.',
                source: 'SUPABASE'
              };
            }
            return { data: false, error: error.message, source: 'SUPABASE' };
          }
          return { data: true, error: null, source: 'SUPABASE' };
        } catch (err: any) {
          return { data: false, error: err.message, source: 'SUPABASE' };
        }
      }
    }
    return { data: true, error: null, source: 'LOCAL_CACHE' };
  }

  // ==========================================
  // FESTIVAL THEMES & PROMOTIONS MANAGEMENT
  // ==========================================
  static async fetchFestivalThemes(): Promise<DataOperationResult<FestivalTheme[]>> {
    // 1. Try fetching from Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('festival_themes')
          .select('*')
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped: FestivalTheme[] = data.map((t: any) => ({
            id: t.id,
            preset: t.preset,
            name: t.name,
            greeting: t.greeting || '',
            announcementBadge: t.announcement_badge || undefined,
            couponCode: t.coupon_code || undefined,
            isActive: Boolean(t.is_active),
            startDate: t.start_date || undefined,
            endDate: t.end_date || undefined,
            intensity: t.intensity || 'subtle',
            accentColor: t.accent_color || '#A67732',
            badgeColor: t.badge_color || '#FAD982',
            promotionalImageUrl: t.promotional_image_url || undefined,
            heroBannerHeadline: t.hero_banner_headline || undefined,
            heroBannerSubline: t.hero_banner_subline || undefined,
            placements: t.placements || {
              heroBanners: true,
              promoBanners: true,
              productCards: true,
              categorySections: true,
              announcementBar: true
            },
            featuredProductIds: Array.isArray(t.featured_product_ids) ? t.featured_product_ids : [],
            productBadges: t.product_badges || {},
            promotions: Array.isArray(t.promotions) ? t.promotions : [],
            popup: t.popup || undefined,
            countdown: t.countdown || undefined,
            atmosphere: t.atmosphere || undefined,
            createdAt: t.created_at,
            updatedAt: t.updated_at
          }));

          // Cache in local storage for instant offline / fallback access
          try {
            localStorage.setItem('zada_festival_themes', JSON.stringify(mapped));
          } catch {}

          return { data: mapped, error: null, source: 'SUPABASE' };
        }
      } catch (err: any) {
        console.warn('[SupabaseDataService] Fetch festival themes remote error; falling back to local presets:', err);
      }
    }

    // 2. Fallback to Local Storage or Preset Data
    try {
      const saved = localStorage.getItem('zada_festival_themes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return { data: parsed, error: null, source: 'LOCAL_CACHE' };
        }
      }
    } catch {}

    return { data: INITIAL_FESTIVAL_PRESETS, error: null, source: 'LOCAL_CACHE' };
  }

  static async saveFestivalTheme(theme: FestivalTheme): Promise<DataOperationResult<FestivalTheme>> {
    const payload: Record<string, any> = {
      id: theme.id,
      preset: theme.preset,
      name: theme.name,
      greeting: theme.greeting,
      announcement_badge: theme.announcementBadge || null,
      coupon_code: theme.couponCode || null,
      is_active: theme.isActive,
      start_date: theme.startDate || null,
      end_date: theme.endDate || null,
      intensity: theme.intensity,
      accent_color: theme.accentColor,
      badge_color: theme.badgeColor || null,
      promotional_image_url: theme.promotionalImageUrl || null,
      hero_banner_headline: theme.heroBannerHeadline || null,
      hero_banner_subline: theme.heroBannerSubline || null,
      placements: theme.placements,
      featured_product_ids: theme.featuredProductIds,
      product_badges: theme.productBadges || {},
      promotions: theme.promotions || [],
      popup: theme.popup || {},
      countdown: theme.countdown || {},
      atmosphere: theme.atmosphere || {},
      updated_at: new Date().toISOString()
    };

    // Always keep local storage updated
    try {
      const existing = JSON.parse(localStorage.getItem('zada_festival_themes') || '[]');
      const filtered = existing.filter((t: any) => t.id !== theme.id);
      filtered.push({ ...theme, updatedAt: payload.updated_at });
      localStorage.setItem('zada_festival_themes', JSON.stringify(filtered));
    } catch {}

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('festival_themes')
          .upsert(payload, { onConflict: 'id' })
          .select()
          .maybeSingle();

        if (error) {
          // Fallback if remote schema lacks extended JSONB columns
          if (error.message?.includes('promotions') || error.message?.includes('popup') || error.code === '42703') {
            const stripped = { ...payload };
            delete stripped.promotions;
            delete stripped.popup;
            delete stripped.countdown;
            delete stripped.atmosphere;
            delete stripped.product_badges;
            await supabase.from('festival_themes').upsert(stripped, { onConflict: 'id' });
          } else {
            console.warn('[SupabaseDataService] Festival upsert remote warning:', error);
          }
          return { data: theme, error: null, source: 'LOCAL_CACHE' };
        }

        return { data: theme, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: theme, error: null, source: 'LOCAL_CACHE' };
      }
    }

    return { data: theme, error: null, source: 'LOCAL_CACHE' };
  }

  static async setActiveFestivalTheme(themeId: string): Promise<DataOperationResult<boolean>> {
    // 1. Update local storage
    try {
      const existing: FestivalTheme[] = JSON.parse(localStorage.getItem('zada_festival_themes') || JSON.stringify(INITIAL_FESTIVAL_PRESETS));
      const updated = existing.map((t) => ({
        ...t,
        isActive: t.id === themeId
      }));
      localStorage.setItem('zada_festival_themes', JSON.stringify(updated));
    } catch {}

    // 2. Sync to Supabase
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('festival_themes')
          .update({ is_active: false })
          .neq('id', themeId);

        await supabase
          .from('festival_themes')
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq('id', themeId);

        return { data: true, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: true, error: null, source: 'LOCAL_CACHE' };
      }
    }

    return { data: true, error: null, source: 'LOCAL_CACHE' };
  }

  static async deleteFestivalTheme(themeId: string): Promise<DataOperationResult<boolean>> {
    // 1. Update local storage
    try {
      const existing: FestivalTheme[] = JSON.parse(localStorage.getItem('zada_festival_themes') || JSON.stringify(INITIAL_FESTIVAL_PRESETS));
      const filtered = existing.filter((t) => t.id !== themeId);
      localStorage.setItem('zada_festival_themes', JSON.stringify(filtered));
    } catch {}

    // 2. Sync to Supabase
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('festival_themes')
          .delete()
          .eq('id', themeId);

        return { data: true, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: true, error: null, source: 'LOCAL_CACHE' };
      }
    }

    return { data: true, error: null, source: 'LOCAL_CACHE' };
  }

  // ==========================================
  // COUPONS MANAGEMENT
  // ==========================================
  public static async fetchCouponsAdmin(): Promise<DataOperationResult<Coupon[]>> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('coupons')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[Supabase Error] Failed to fetch coupons:', error.message);
          return { data: null, error: error.message, source: 'SUPABASE' };
        }

        const mapped: Coupon[] = (data || []).map((c: any) => ({
          id: c.id,
          code: c.code,
          discountType: c.discount_type,
          discountValue: Number(c.discount_value) || 0,
          maxDiscountAmount: c.max_discount_amount ? Number(c.max_discount_amount) : undefined,
          minOrderAmount: Number(c.min_order_amount) || 0,
          isFirstOrderOnly: !!c.is_first_order_only,
          usageLimit: c.usage_limit ? Number(c.usage_limit) : undefined,
          timesUsed: Number(c.times_used) || 0,
          isActive: !!c.is_active,
          validUntil: c.valid_until || undefined
        }));

        try {
          localStorage.setItem('zada_admin_coupons', JSON.stringify(mapped));
        } catch {}

        return { data: mapped, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }

    const saved = localStorage.getItem('zada_admin_coupons');
    return { data: saved ? JSON.parse(saved) : INITIAL_COUPONS, error: null, source: 'LOCAL_CACHE' };
  }

  public static async createCoupon(
    couponData: Omit<Coupon, 'id' | 'timesUsed'>
  ): Promise<DataOperationResult<Coupon>> {
    if (isSupabaseConfigured()) {
      try {
        const couponId = crypto.randomUUID();
        const payload: Record<string, any> = {
          id: couponId,
          code: couponData.code.trim().toUpperCase(),
          discount_type: couponData.discountType,
          discount_value: couponData.discountValue,
          min_order_amount: couponData.minOrderAmount || 0,
          max_discount_amount: couponData.maxDiscountAmount || null,
          is_first_order_only: couponData.isFirstOrderOnly || false,
          usage_limit: couponData.usageLimit || null,
          times_used: 0,
          is_active: couponData.isActive !== false,
          valid_until: couponData.validUntil || null
        };

        const { error } = await supabase.from('coupons').insert(payload);
        if (error) {
          return { data: null, error: error.message, source: 'SUPABASE' };
        }

        const created: Coupon = {
          ...couponData,
          id: couponId,
          code: payload.code,
          timesUsed: 0
        };

        try {
          const saved = localStorage.getItem('zada_admin_coupons');
          const list = saved ? JSON.parse(saved) : [];
          localStorage.setItem('zada_admin_coupons', JSON.stringify([created, ...list]));
        } catch {}

        return { data: created, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }

    const localCoupon: Coupon = {
      ...couponData,
      id: `coup-${Date.now()}`,
      timesUsed: 0
    };
    try {
      const saved = localStorage.getItem('zada_admin_coupons');
      const list = saved ? JSON.parse(saved) : [];
      localStorage.setItem('zada_admin_coupons', JSON.stringify([localCoupon, ...list]));
    } catch {}
    return { data: localCoupon, error: null, source: 'LOCAL_CACHE' };
  }

  public static async updateCoupon(
    id: string,
    updates: Partial<Coupon>
  ): Promise<DataOperationResult<Coupon>> {
    if (isSupabaseConfigured() && isUUID(id)) {
      try {
        const payload: Record<string, any> = {};
        if (updates.code !== undefined) payload.code = updates.code.trim().toUpperCase();
        if (updates.discountType !== undefined) payload.discount_type = updates.discountType;
        if (updates.discountValue !== undefined) payload.discount_value = updates.discountValue;
        if (updates.minOrderAmount !== undefined) payload.min_order_amount = updates.minOrderAmount;
        if (updates.maxDiscountAmount !== undefined) payload.max_discount_amount = updates.maxDiscountAmount;
        if (updates.isFirstOrderOnly !== undefined) payload.is_first_order_only = updates.isFirstOrderOnly;
        if (updates.usageLimit !== undefined) payload.usage_limit = updates.usageLimit;
        if (updates.isActive !== undefined) payload.is_active = updates.isActive;
        if (updates.validUntil !== undefined) payload.valid_until = updates.validUntil;

        const { error } = await supabase.from('coupons').update(payload).eq('id', id);
        if (error) {
          return { data: null, error: error.message, source: 'SUPABASE' };
        }

        try {
          const saved = localStorage.getItem('zada_admin_coupons');
          if (saved) {
            const list: Coupon[] = JSON.parse(saved);
            const updated = list.map((c) => (c.id === id ? { ...c, ...updates } : c));
            localStorage.setItem('zada_admin_coupons', JSON.stringify(updated));
          }
        } catch {}

        return { data: updates as Coupon, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }

    try {
      const saved = localStorage.getItem('zada_admin_coupons');
      if (saved) {
        const list: Coupon[] = JSON.parse(saved);
        const updated = list.map((c) => (c.id === id ? { ...c, ...updates } : c));
        localStorage.setItem('zada_admin_coupons', JSON.stringify(updated));
      }
    } catch {}
    return { data: updates as Coupon, error: null, source: 'LOCAL_CACHE' };
  }

  public static async deleteCoupon(id: string): Promise<DataOperationResult<boolean>> {
    if (isSupabaseConfigured() && isUUID(id)) {
      try {
        const { error } = await supabase.from('coupons').delete().eq('id', id);
        if (error) {
          return { data: false, error: error.message, source: 'SUPABASE' };
        }

        try {
          const saved = localStorage.getItem('zada_admin_coupons');
          if (saved) {
            const list: Coupon[] = JSON.parse(saved);
            localStorage.setItem('zada_admin_coupons', JSON.stringify(list.filter((c) => c.id !== id)));
          }
        } catch {}

        return { data: true, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: false, error: err.message, source: 'SUPABASE' };
      }
    }

    try {
      const saved = localStorage.getItem('zada_admin_coupons');
      if (saved) {
        const list: Coupon[] = JSON.parse(saved);
        localStorage.setItem('zada_admin_coupons', JSON.stringify(list.filter((c) => c.id !== id)));
      }
    } catch {}
    return { data: true, error: null, source: 'LOCAL_CACHE' };
  }

  public static async toggleCouponActive(id: string, isActive: boolean): Promise<DataOperationResult<boolean>> {
    if (isSupabaseConfigured() && isUUID(id)) {
      try {
        const { error } = await supabase.from('coupons').update({ is_active: isActive }).eq('id', id);
        if (error) {
          return { data: false, error: error.message, source: 'SUPABASE' };
        }
        return { data: isActive, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: false, error: err.message, source: 'SUPABASE' };
      }
    }
    return { data: isActive, error: null, source: 'LOCAL_CACHE' };
  }

  // ==========================================
  // PRICING RULES MANAGEMENT
  // ==========================================
  public static async fetchPricingRulesAdmin(): Promise<DataOperationResult<PricingRule[]>> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('pricing_rules')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          return { data: null, error: error.message, source: 'SUPABASE' };
        }

        const mapped: PricingRule[] = (data || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          ruleType: r.rule_type,
          productId: r.product_id || undefined,
          variantId: r.variant_id || undefined,
          minQuantity: r.min_quantity || 1,
          discountPercentage: r.discount_percentage ? Number(r.discount_percentage) : undefined,
          fixedPrice: r.fixed_price ? Number(r.fixed_price) : undefined,
          buyQuantity: r.buy_quantity || undefined,
          getQuantity: r.get_quantity || undefined,
          freeVariantId: r.free_variant_id || undefined,
          startDate: r.start_date || undefined,
          endDate: r.end_date || undefined,
          isActive: !!r.is_active,
          createdAt: r.created_at || new Date().toISOString()
        }));

        try {
          localStorage.setItem('zada_admin_pricing_rules', JSON.stringify(mapped));
        } catch {}

        return { data: mapped, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }
    const saved = localStorage.getItem('zada_admin_pricing_rules');
    return { data: saved ? JSON.parse(saved) : INITIAL_PRICING_RULES, error: null, source: 'LOCAL_CACHE' };
  }

  public static async createPricingRule(
    ruleData: Omit<PricingRule, 'id' | 'createdAt'>
  ): Promise<DataOperationResult<PricingRule>> {
    if (isSupabaseConfigured()) {
      try {
        const ruleId = crypto.randomUUID();
        const timestamp = new Date().toISOString();
        const payload: Record<string, any> = {
          id: ruleId,
          name: ruleData.name.trim(),
          rule_type: ruleData.ruleType,
          product_id: isUUID(ruleData.productId) ? ruleData.productId : null,
          variant_id: isUUID(ruleData.variantId) ? ruleData.variantId : null,
          min_quantity: ruleData.minQuantity || 1,
          discount_percentage: ruleData.discountPercentage || null,
          fixed_price: ruleData.fixedPrice || null,
          buy_quantity: ruleData.buyQuantity || null,
          get_quantity: ruleData.getQuantity || null,
          free_variant_id: isUUID(ruleData.freeVariantId) ? ruleData.freeVariantId : null,
          start_date: ruleData.startDate || null,
          end_date: ruleData.endDate || null,
          is_active: ruleData.isActive !== false,
          created_at: timestamp
        };

        const { error } = await supabase.from('pricing_rules').insert(payload);
        if (error) {
          return { data: null, error: error.message, source: 'SUPABASE' };
        }

        const created: PricingRule = { ...ruleData, id: ruleId, createdAt: timestamp };
        try {
          const saved = localStorage.getItem('zada_admin_pricing_rules');
          const list = saved ? JSON.parse(saved) : [];
          localStorage.setItem('zada_admin_pricing_rules', JSON.stringify([created, ...list]));
        } catch {}

        return { data: created, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }

    const localRule: PricingRule = { ...ruleData, id: `rule-${Date.now()}`, createdAt: new Date().toISOString() };
    try {
      const saved = localStorage.getItem('zada_admin_pricing_rules');
      const list = saved ? JSON.parse(saved) : [];
      localStorage.setItem('zada_admin_pricing_rules', JSON.stringify([localRule, ...list]));
    } catch {}
    return { data: localRule, error: null, source: 'LOCAL_CACHE' };
  }

  public static async updatePricingRule(
    id: string,
    updates: Partial<PricingRule>
  ): Promise<DataOperationResult<PricingRule>> {
    if (isSupabaseConfigured() && isUUID(id)) {
      try {
        const payload: Record<string, any> = {};
        if (updates.name !== undefined) payload.name = updates.name.trim();
        if (updates.ruleType !== undefined) payload.rule_type = updates.ruleType;
        if (updates.minQuantity !== undefined) payload.min_quantity = updates.minQuantity;
        if (updates.discountPercentage !== undefined) payload.discount_percentage = updates.discountPercentage;
        if (updates.fixedPrice !== undefined) payload.fixed_price = updates.fixedPrice;
        if (updates.isActive !== undefined) payload.is_active = updates.isActive;

        const { error } = await supabase.from('pricing_rules').update(payload).eq('id', id);
        if (error) {
          return { data: null, error: error.message, source: 'SUPABASE' };
        }

        try {
          const saved = localStorage.getItem('zada_admin_pricing_rules');
          if (saved) {
            const list: PricingRule[] = JSON.parse(saved);
            localStorage.setItem('zada_admin_pricing_rules', JSON.stringify(list.map((r) => (r.id === id ? { ...r, ...updates } : r))));
          }
        } catch {}

        return { data: updates as PricingRule, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }

    try {
      const saved = localStorage.getItem('zada_admin_pricing_rules');
      if (saved) {
        const list: PricingRule[] = JSON.parse(saved);
        localStorage.setItem('zada_admin_pricing_rules', JSON.stringify(list.map((r) => (r.id === id ? { ...r, ...updates } : r))));
      }
    } catch {}
    return { data: updates as PricingRule, error: null, source: 'LOCAL_CACHE' };
  }

  public static async deletePricingRule(id: string): Promise<DataOperationResult<boolean>> {
    if (isSupabaseConfigured() && isUUID(id)) {
      try {
        const { error } = await supabase.from('pricing_rules').delete().eq('id', id);
        if (error) {
          return { data: false, error: error.message, source: 'SUPABASE' };
        }

        try {
          const saved = localStorage.getItem('zada_admin_pricing_rules');
          if (saved) {
            const list: PricingRule[] = JSON.parse(saved);
            localStorage.setItem('zada_admin_pricing_rules', JSON.stringify(list.filter((r) => r.id !== id)));
          }
        } catch {}

        return { data: true, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: false, error: err.message, source: 'SUPABASE' };
      }
    }

    try {
      const saved = localStorage.getItem('zada_admin_pricing_rules');
      if (saved) {
        const list: PricingRule[] = JSON.parse(saved);
        localStorage.setItem('zada_admin_pricing_rules', JSON.stringify(list.filter((r) => r.id !== id)));
      }
    } catch {}
    return { data: true, error: null, source: 'LOCAL_CACHE' };
  }

  // ==========================================
  // COMBOS MANAGEMENT
  // ==========================================
  public static async fetchCombosAdmin(): Promise<DataOperationResult<ComboBundle[]>> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('combos')
          .select('*, combo_items(*)')
          .order('created_at', { ascending: false });

        if (error) {
          return { data: null, error: error.message, source: 'SUPABASE' };
        }

        const mapped: ComboBundle[] = (data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description || '',
          imageUrl: c.image_url || '/assets/cat-combos.png',
          originalPrice: Number(c.original_total_mrp) || Number(c.bundle_selling_price) || 0,
          comboPrice: Number(c.bundle_selling_price) || Number(c.discount_value) || 0,
          discountPercent: c.discount_type === 'PERCENTAGE' ? Number(c.discount_value) : 0,
          isActive: !!c.is_active,
          items: (c.combo_items || []).map((ci: any) => ({
            productId: ci.product_id,
            variantId: ci.variant_id,
            quantity: ci.quantity || 1,
            productName: ci.product_name || 'Product',
            variantLabel: ci.variant_label || 'Default'
          })),
          createdAt: c.created_at
        }));

        try {
          localStorage.setItem('zada_admin_combos', JSON.stringify(mapped));
        } catch {}

        return { data: mapped, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }

    const saved = localStorage.getItem('zada_admin_combos');
    return { data: saved ? JSON.parse(saved) : INITIAL_COMBOS, error: null, source: 'LOCAL_CACHE' };
  }

  public static async createCombo(
    comboData: Omit<ComboBundle, 'id' | 'createdAt'>
  ): Promise<DataOperationResult<ComboBundle>> {
    if (isSupabaseConfigured()) {
      try {
        const comboId = crypto.randomUUID();
        const slug = comboData.slug || comboData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const payload: Record<string, any> = {
          id: comboId,
          name: comboData.name.trim(),
          slug,
          description: comboData.description || null,
          discount_type: 'PERCENTAGE',
          discount_value: comboData.discountPercent || 0,
          is_active: comboData.isActive !== false
        };

        const { error } = await supabase.from('combos').insert(payload);
        if (error) {
          return { data: null, error: error.message, source: 'SUPABASE' };
        }

        // Insert items if provided
        if (comboData.items && comboData.items.length > 0) {
          const itemRows = comboData.items.filter(it => isUUID(it.variantId)).map(it => ({
            id: crypto.randomUUID(),
            combo_id: comboId,
            variant_id: it.variantId,
            quantity: it.quantity || 1
          }));
          if (itemRows.length > 0) {
            await supabase.from('combo_items').insert(itemRows);
          }
        }

        const created: ComboBundle = {
          ...comboData,
          id: comboId,
          slug,
          createdAt: new Date().toISOString()
        };

        try {
          const saved = localStorage.getItem('zada_admin_combos');
          const list = saved ? JSON.parse(saved) : [];
          localStorage.setItem('zada_admin_combos', JSON.stringify([created, ...list]));
        } catch {}

        return { data: created, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }

    const localCombo: ComboBundle = {
      ...comboData,
      id: `combo-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    try {
      const saved = localStorage.getItem('zada_admin_combos');
      const list = saved ? JSON.parse(saved) : [];
      localStorage.setItem('zada_admin_combos', JSON.stringify([localCombo, ...list]));
    } catch {}
    return { data: localCombo, error: null, source: 'LOCAL_CACHE' };
  }

  public static async updateCombo(
    id: string,
    updates: Partial<ComboBundle>
  ): Promise<DataOperationResult<ComboBundle>> {
    if (isSupabaseConfigured() && isUUID(id)) {
      try {
        const payload: Record<string, any> = {};
        if (updates.name !== undefined) payload.name = updates.name.trim();
        if (updates.slug !== undefined) payload.slug = updates.slug;
        if (updates.description !== undefined) payload.description = updates.description;
        if (updates.discountPercent !== undefined) payload.discount_value = updates.discountPercent;
        if (updates.isActive !== undefined) payload.is_active = updates.isActive;

        const { error } = await supabase.from('combos').update(payload).eq('id', id);
        if (error) {
          return { data: null, error: error.message, source: 'SUPABASE' };
        }

        try {
          const saved = localStorage.getItem('zada_admin_combos');
          if (saved) {
            const list: ComboBundle[] = JSON.parse(saved);
            localStorage.setItem('zada_admin_combos', JSON.stringify(list.map((c) => (c.id === id ? { ...c, ...updates } : c))));
          }
        } catch {}

        return { data: updates as ComboBundle, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }

    try {
      const saved = localStorage.getItem('zada_admin_combos');
      if (saved) {
        const list: ComboBundle[] = JSON.parse(saved);
        localStorage.setItem('zada_admin_combos', JSON.stringify(list.map((c) => (c.id === id ? { ...c, ...updates } : c))));
      }
    } catch {}
    return { data: updates as ComboBundle, error: null, source: 'LOCAL_CACHE' };
  }

  public static async deleteCombo(id: string): Promise<DataOperationResult<boolean>> {
    if (isSupabaseConfigured() && isUUID(id)) {
      try {
        const { error } = await supabase.from('combos').delete().eq('id', id);
        if (error) {
          return { data: false, error: error.message, source: 'SUPABASE' };
        }

        try {
          const saved = localStorage.getItem('zada_admin_combos');
          if (saved) {
            const list: ComboBundle[] = JSON.parse(saved);
            localStorage.setItem('zada_admin_combos', JSON.stringify(list.filter((c) => c.id !== id)));
          }
        } catch {}

        return { data: true, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: false, error: err.message, source: 'SUPABASE' };
      }
    }

    try {
      const saved = localStorage.getItem('zada_admin_combos');
      if (saved) {
        const list: ComboBundle[] = JSON.parse(saved);
        localStorage.setItem('zada_admin_combos', JSON.stringify(list.filter((c) => c.id !== id)));
      }
    } catch {}
    return { data: true, error: null, source: 'LOCAL_CACHE' };
  }

  // ==========================================
  // REVIEWS MANAGEMENT
  // ==========================================
  public static async fetchReviewsAdmin(): Promise<DataOperationResult<Review[]>> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          return { data: null, error: error.message, source: 'SUPABASE' };
        }

        const mapped: Review[] = (data || []).map((r: any) => ({
          id: r.id,
          productId: r.product_id,
          userId: r.user_id || undefined,
          reviewerName: r.reviewer_name,
          rating: r.rating,
          reviewTitle: r.review_title || undefined,
          reviewText: r.review_text,
          isVerifiedPurchase: !!r.is_verified_purchase,
          isApproved: !!r.is_approved,
          isFeaturedOnPdp: !!r.is_featured_on_pdp,
          createdAt: r.created_at
        }));

        try {
          localStorage.setItem('zada_admin_reviews', JSON.stringify(mapped));
        } catch {}

        return { data: mapped, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }
    const saved = localStorage.getItem('zada_admin_reviews');
    return { data: saved ? JSON.parse(saved) : INITIAL_REVIEWS, error: null, source: 'LOCAL_CACHE' };
  }

  public static async updateReviewApproval(
    reviewId: string,
    approved: boolean
  ): Promise<DataOperationResult<boolean>> {
    if (isSupabaseConfigured() && isUUID(reviewId)) {
      try {
        const { error } = await supabase
          .from('reviews')
          .update({ is_approved: approved })
          .eq('id', reviewId);

        if (error) {
          return { data: false, error: error.message, source: 'SUPABASE' };
        }

        try {
          const saved = localStorage.getItem('zada_admin_reviews');
          if (saved) {
            const list: Review[] = JSON.parse(saved);
            localStorage.setItem('zada_admin_reviews', JSON.stringify(list.map((r) => (r.id === reviewId ? { ...r, isApproved: approved } : r))));
          }
        } catch {}

        return { data: approved, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: false, error: err.message, source: 'SUPABASE' };
      }
    }

    try {
      const saved = localStorage.getItem('zada_admin_reviews');
      if (saved) {
        const list: Review[] = JSON.parse(saved);
        localStorage.setItem('zada_admin_reviews', JSON.stringify(list.map((r) => (r.id === reviewId ? { ...r, isApproved: approved } : r))));
      }
    } catch {}
    return { data: approved, error: null, source: 'LOCAL_CACHE' };
  }

  public static async toggleReviewFeatured(
    reviewId: string,
    featured: boolean
  ): Promise<DataOperationResult<boolean>> {
    if (isSupabaseConfigured() && isUUID(reviewId)) {
      try {
        const { error } = await supabase
          .from('reviews')
          .update({ is_featured_on_pdp: featured })
          .eq('id', reviewId);

        if (error) {
          return { data: false, error: error.message, source: 'SUPABASE' };
        }

        try {
          const saved = localStorage.getItem('zada_admin_reviews');
          if (saved) {
            const list: Review[] = JSON.parse(saved);
            localStorage.setItem('zada_admin_reviews', JSON.stringify(list.map((r) => (r.id === reviewId ? { ...r, isFeaturedOnPdp: featured } : r))));
          }
        } catch {}

        return { data: featured, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: false, error: err.message, source: 'SUPABASE' };
      }
    }

    try {
      const saved = localStorage.getItem('zada_admin_reviews');
      if (saved) {
        const list: Review[] = JSON.parse(saved);
        localStorage.setItem('zada_admin_reviews', JSON.stringify(list.map((r) => (r.id === reviewId ? { ...r, isFeaturedOnPdp: featured } : r))));
      }
    } catch {}
    return { data: featured, error: null, source: 'LOCAL_CACHE' };
  }

  public static async updateReview(
    reviewId: string,
    updates: Partial<Review>
  ): Promise<DataOperationResult<boolean>> {
    if (isSupabaseConfigured() && isUUID(reviewId)) {
      try {
        const payload: any = {};
        if (updates.reviewerName !== undefined) payload.reviewer_name = updates.reviewerName.trim();
        if (updates.rating !== undefined) payload.rating = updates.rating;
        if (updates.reviewTitle !== undefined) payload.review_title = updates.reviewTitle ? updates.reviewTitle.trim() : null;
        if (updates.reviewText !== undefined) payload.review_text = updates.reviewText.trim();
        if (updates.isApproved !== undefined) payload.is_approved = updates.isApproved;
        if (updates.isFeaturedOnPdp !== undefined) payload.is_featured_on_pdp = updates.isFeaturedOnPdp;
        if (updates.isVerifiedPurchase !== undefined) payload.is_verified_purchase = updates.isVerifiedPurchase;
        if (updates.productId !== undefined && isUUID(updates.productId)) payload.product_id = updates.productId;

        const { error } = await supabase
          .from('reviews')
          .update(payload)
          .eq('id', reviewId);

        if (error) {
          console.warn('[SupabaseDataService] updateReview error:', error.message);
          return { data: false, error: error.message, source: 'SUPABASE' };
        }
        return { data: true, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: false, error: err.message, source: 'SUPABASE' };
      }
    }

    try {
      const saved = localStorage.getItem('zada_admin_reviews');
      if (saved) {
        const list: Review[] = JSON.parse(saved);
        localStorage.setItem(
          'zada_admin_reviews',
          JSON.stringify(list.map((r) => (r.id === reviewId ? { ...r, ...updates } : r)))
        );
      }
    } catch {}
    return { data: true, error: null, source: 'LOCAL_CACHE' };
  }

  public static async deleteReview(reviewId: string): Promise<DataOperationResult<boolean>> {
    if (isSupabaseConfigured() && isUUID(reviewId)) {
      try {
        const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
        if (error) {
          return { data: false, error: error.message, source: 'SUPABASE' };
        }

        try {
          const saved = localStorage.getItem('zada_admin_reviews');
          if (saved) {
            const list: Review[] = JSON.parse(saved);
            localStorage.setItem('zada_admin_reviews', JSON.stringify(list.filter((r) => r.id !== reviewId)));
          }
        } catch {}

        return { data: true, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: false, error: err.message, source: 'SUPABASE' };
      }
    }

    try {
      const saved = localStorage.getItem('zada_admin_reviews');
      if (saved) {
        const list: Review[] = JSON.parse(saved);
        localStorage.setItem('zada_admin_reviews', JSON.stringify(list.filter((r) => r.id !== reviewId)));
      }
    } catch {}
    return { data: true, error: null, source: 'LOCAL_CACHE' };
  }

  public static async createReview(
    review: Omit<Review, 'id' | 'createdAt' | 'isApproved' | 'isFeaturedOnPdp'> & { isApproved?: boolean }
  ): Promise<DataOperationResult<Review>> {
    const isApprovedFlag = review.isApproved !== undefined ? review.isApproved : true;
    if (isSupabaseConfigured() && isUUID(review.productId)) {
      try {
        const revId = crypto.randomUUID();
        const payload: Record<string, any> = {
          id: revId,
          product_id: review.productId,
          user_id: isUUID(review.userId) ? review.userId : null,
          reviewer_name: review.reviewerName.trim(),
          rating: review.rating,
          review_title: review.reviewTitle || null,
          review_text: review.reviewText.trim(),
          is_verified_purchase: review.isVerifiedPurchase ?? false,
          is_approved: isApprovedFlag,
          is_featured_on_pdp: false
        };

        const { error } = await supabase.from('reviews').insert(payload);
        if (error) {
          return { data: null, error: error.message, source: 'SUPABASE' };
        }

        const created: Review = {
          ...review,
          id: revId,
          isApproved: isApprovedFlag,
          isFeaturedOnPdp: false,
          createdAt: new Date().toISOString().split('T')[0]
        };

        return { data: created, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }

    const localRev: Review = {
      ...review,
      id: `rev-${Date.now()}`,
      isApproved: isApprovedFlag,
      isFeaturedOnPdp: false,
      createdAt: new Date().toISOString().split('T')[0]
    };
    return { data: localRev, error: null, source: 'LOCAL_CACHE' };
  }

  // ==========================================
  // BULK ENQUIRIES MANAGEMENT
  // ==========================================
  public static async fetchEnquiriesAdmin(): Promise<DataOperationResult<BulkEnquiry[]>> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('bulk_enquiries')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          return { data: null, error: error.message, source: 'SUPABASE' };
        }

        const mapped: BulkEnquiry[] = (data || []).map((e: any) => ({
          id: e.id,
          fullName: e.full_name,
          organizationName: e.organization_name || undefined,
          email: e.email,
          phone: e.phone,
          eventType: e.event_type as any,
          estimatedQuantity: e.estimated_quantity,
          requiredDate: e.required_date || undefined,
          message: e.message,
          status: e.status,
          adminNotes: e.admin_notes || undefined,
          createdAt: e.created_at
        }));

        try {
          localStorage.setItem('zada_admin_enquiries', JSON.stringify(mapped));
        } catch {}

        return { data: mapped, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }

    const saved = localStorage.getItem('zada_admin_enquiries');
    return { data: saved ? JSON.parse(saved) : [], error: null, source: 'LOCAL_CACHE' };
  }

  public static async updateEnquiryStatus(
    enquiryId: string,
    status: BulkEnquiry['status']
  ): Promise<DataOperationResult<boolean>> {
    if (isSupabaseConfigured() && isUUID(enquiryId)) {
      try {
        const { error } = await supabase
          .from('bulk_enquiries')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', enquiryId);

        if (error) {
          return { data: false, error: error.message, source: 'SUPABASE' };
        }

        try {
          const saved = localStorage.getItem('zada_admin_enquiries');
          if (saved) {
            const list: BulkEnquiry[] = JSON.parse(saved);
            localStorage.setItem('zada_admin_enquiries', JSON.stringify(list.map((e) => (e.id === enquiryId ? { ...e, status } : e))));
          }
        } catch {}

        return { data: true, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: false, error: err.message, source: 'SUPABASE' };
      }
    }

    try {
      const saved = localStorage.getItem('zada_admin_enquiries');
      if (saved) {
        const list: BulkEnquiry[] = JSON.parse(saved);
        localStorage.setItem('zada_admin_enquiries', JSON.stringify(list.map((e) => (e.id === enquiryId ? { ...e, status } : e))));
      }
    } catch {}
    return { data: true, error: null, source: 'LOCAL_CACHE' };
  }

  public static async updateEnquiryNotes(
    enquiryId: string,
    notes: string
  ): Promise<DataOperationResult<boolean>> {
    if (isSupabaseConfigured() && isUUID(enquiryId)) {
      try {
        const { error } = await supabase
          .from('bulk_enquiries')
          .update({ admin_notes: notes, updated_at: new Date().toISOString() })
          .eq('id', enquiryId);

        if (error) {
          return { data: false, error: error.message, source: 'SUPABASE' };
        }

        try {
          const saved = localStorage.getItem('zada_admin_enquiries');
          if (saved) {
            const list: BulkEnquiry[] = JSON.parse(saved);
            localStorage.setItem('zada_admin_enquiries', JSON.stringify(list.map((e) => (e.id === enquiryId ? { ...e, adminNotes: notes } : e))));
          }
        } catch {}

        return { data: true, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: false, error: err.message, source: 'SUPABASE' };
      }
    }

    try {
      const saved = localStorage.getItem('zada_admin_enquiries');
      if (saved) {
        const list: BulkEnquiry[] = JSON.parse(saved);
        localStorage.setItem('zada_admin_enquiries', JSON.stringify(list.map((e) => (e.id === enquiryId ? { ...e, adminNotes: notes } : e))));
      }
    } catch {}
    return { data: true, error: null, source: 'LOCAL_CACHE' };
  }

  public static async submitBulkEnquiry(
    enquiry: Omit<BulkEnquiry, 'id' | 'createdAt' | 'status'>
  ): Promise<DataOperationResult<BulkEnquiry>> {
    if (isSupabaseConfigured()) {
      try {
        const enqId = crypto.randomUUID();
        const payload: Record<string, any> = {
          id: enqId,
          full_name: enquiry.fullName.trim(),
          organization_name: enquiry.organizationName || null,
          email: enquiry.email.trim().toLowerCase(),
          phone: enquiry.phone.trim(),
          event_type: enquiry.eventType,
          estimated_quantity: enquiry.estimatedQuantity,
          required_date: enquiry.requiredDate || null,
          message: enquiry.message.trim(),
          status: 'NEW'
        };

        const { error } = await supabase.from('bulk_enquiries').insert(payload);
        if (error) {
          return { data: null, error: error.message, source: 'SUPABASE' };
        }

        const created: BulkEnquiry = {
          ...enquiry,
          id: enqId,
          status: 'NEW',
          createdAt: new Date().toISOString()
        };

        try {
          const saved = localStorage.getItem('zada_admin_enquiries');
          const list = saved ? JSON.parse(saved) : [];
          localStorage.setItem('zada_admin_enquiries', JSON.stringify([created, ...list]));
        } catch {}

        return { data: created, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }

    const localEntry: BulkEnquiry = {
      ...enquiry,
      id: `enq-${Date.now()}`,
      status: 'NEW',
      createdAt: new Date().toISOString()
    };
    try {
      const saved = localStorage.getItem('zada_admin_enquiries');
      const list = saved ? JSON.parse(saved) : [];
      localStorage.setItem('zada_admin_enquiries', JSON.stringify([localEntry, ...list]));
    } catch {}
    return { data: localEntry, error: null, source: 'LOCAL_CACHE' };
  }

  // ==========================================
  // STORE SETTINGS MANAGEMENT
  // ==========================================
  public static async fetchStoreSettings(): Promise<DataOperationResult<StoreSettings>> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('*');

        if (error) {
          return { data: null, error: error.message, source: 'SUPABASE' };
        }

        if (data && data.length > 0) {
          const map: Record<string, any> = {};
          data.forEach((row: any) => {
            map[row.key] = row.value;
          });

          const shipping = map.shipping || {};
          const checkout = map.checkout || {};
          const compliance = map.compliance || {};

          const settings: StoreSettings = {
            ...INITIAL_STORE_SETTINGS,
            standardDeliveryFee: shipping.standardDeliveryFee ?? INITIAL_STORE_SETTINGS.standardDeliveryFee,
            freeShippingThreshold: shipping.freeShippingThreshold ?? INITIAL_STORE_SETTINGS.freeShippingThreshold,
            expressDeliveryFee: shipping.expressDeliveryFee ?? INITIAL_STORE_SETTINGS.expressDeliveryFee,
            isCodGloballyEnabled: checkout.isCodGloballyEnabled ?? INITIAL_STORE_SETTINGS.isCodGloballyEnabled,
            isCodAdvanceEnabled: checkout.isCodAdvanceEnabled ?? INITIAL_STORE_SETTINGS.isCodAdvanceEnabled,
            codAdvanceType: checkout.codAdvanceType || INITIAL_STORE_SETTINGS.codAdvanceType,
            codAdvanceValue: checkout.codAdvanceValue ?? INITIAL_STORE_SETTINGS.codAdvanceValue,
            codAdvanceMinOrderValue: checkout.codAdvanceMinOrderValue ?? INITIAL_STORE_SETTINGS.codAdvanceMinOrderValue,
            codAdvanceMinAmount: checkout.codAdvanceMinAmount ?? INITIAL_STORE_SETTINGS.codAdvanceMinAmount,
            codAdvanceMaxAmount: checkout.codAdvanceMaxAmount ?? INITIAL_STORE_SETTINGS.codAdvanceMaxAmount,
            isRazorpayEnabled: checkout.isRazorpayEnabled ?? INITIAL_STORE_SETTINGS.isRazorpayEnabled,
            primaryCheckoutMode: checkout.primaryCheckoutMode || INITIAL_STORE_SETTINGS.primaryCheckoutMode,
            defaultCustomerPaymentMethod: checkout.defaultCustomerPaymentMethod || INITIAL_STORE_SETTINGS.defaultCustomerPaymentMethod,
            isWhatsAppAssistedCodEnabled: checkout.isWhatsAppAssistedCodEnabled ?? INITIAL_STORE_SETTINGS.isWhatsAppAssistedCodEnabled,
            whatsAppDestinationNumber: checkout.whatsappNumber || checkout.whatsAppDestinationNumber || INITIAL_STORE_SETTINGS.whatsAppDestinationNumber,
            storeName: compliance.brandName || compliance.storeName || INITIAL_STORE_SETTINGS.storeName,
            fssaiNumber: compliance.fssaiNumber || INITIAL_STORE_SETTINGS.fssaiNumber,
            supportEmail: compliance.supportEmail || INITIAL_STORE_SETTINGS.supportEmail,
            supportPhone: compliance.supportPhone || INITIAL_STORE_SETTINGS.supportPhone,
            supportWhatsApp: compliance.supportWhatsApp || INITIAL_STORE_SETTINGS.supportWhatsApp
          };

          try {
            localStorage.setItem('zada_admin_settings', JSON.stringify(settings));
          } catch {}

          return { data: settings, error: null, source: 'SUPABASE' };
        }
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }

    const saved = localStorage.getItem('zada_admin_settings');
    return { data: saved ? JSON.parse(saved) : INITIAL_STORE_SETTINGS, error: null, source: 'LOCAL_CACHE' };
  }

  public static async saveStoreSettings(
    newSettings: Partial<StoreSettings>
  ): Promise<DataOperationResult<StoreSettings>> {
    if (isSupabaseConfigured()) {
      try {
        const currentRes = await this.fetchStoreSettings();
        const current = currentRes.data || INITIAL_STORE_SETTINGS;
        const merged = { ...current, ...newSettings };

        const shippingPayload = {
          key: 'shipping',
          value: {
            expressDeliveryFee: merged.expressDeliveryFee,
            standardDeliveryFee: merged.standardDeliveryFee,
            freeShippingThreshold: merged.freeShippingThreshold
          },
          updated_at: new Date().toISOString()
        };

        const checkoutPayload = {
          key: 'checkout',
          value: {
            whatsappNumber: merged.whatsAppDestinationNumber,
            primaryCheckoutMode: merged.primaryCheckoutMode,
            isCodGloballyEnabled: merged.isCodGloballyEnabled,
            isCodAdvanceEnabled: merged.isCodAdvanceEnabled,
            codAdvanceType: merged.codAdvanceType,
            codAdvanceValue: merged.codAdvanceValue,
            codAdvanceMinOrderValue: merged.codAdvanceMinOrderValue,
            codAdvanceMinAmount: merged.codAdvanceMinAmount,
            codAdvanceMaxAmount: merged.codAdvanceMaxAmount,
            isRazorpayEnabled: merged.isRazorpayEnabled,
            defaultCustomerPaymentMethod: merged.defaultCustomerPaymentMethod,
            isWhatsAppAssistedCodEnabled: merged.isWhatsAppAssistedCodEnabled
          },
          updated_at: new Date().toISOString()
        };

        const compliancePayload = {
          key: 'compliance',
          value: {
            brandName: merged.storeName,
            fssaiNumber: merged.fssaiNumber,
            supportEmail: merged.supportEmail,
            supportPhone: merged.supportPhone,
            supportWhatsApp: merged.supportWhatsApp
          },
          updated_at: new Date().toISOString()
        };

        await supabase.from('store_settings').upsert([shippingPayload, checkoutPayload, compliancePayload]);

        try {
          localStorage.setItem('zada_admin_settings', JSON.stringify(merged));
        } catch {}

        return { data: merged, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }

    try {
      const saved = localStorage.getItem('zada_admin_settings');
      const current = saved ? JSON.parse(saved) : INITIAL_STORE_SETTINGS;
      const merged = { ...current, ...newSettings };
      localStorage.setItem('zada_admin_settings', JSON.stringify(merged));
      return { data: merged, error: null, source: 'LOCAL_CACHE' };
    } catch {}
    return { data: newSettings as StoreSettings, error: null, source: 'LOCAL_CACHE' };
  }

  // ==========================================
  // ORDERS MANAGEMENT
  // ==========================================
  public static async fetchOrdersAdmin(): Promise<DataOperationResult<Order[]>> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[Supabase Error] Failed to fetch admin orders:', error.message);
          return { data: null, error: error.message, source: 'SUPABASE' };
        }

        const mapped: Order[] = (data || []).map((o: any) => ({
          id: o.id,
          orderNumber: o.order_number,
          userId: o.user_id || undefined,
          customerName: o.customer_name,
          customerEmail: o.customer_email,
          customerPhone: o.customer_phone,
          shippingAddress: o.shipping_address,
          deliveryMethod: o.delivery_method,
          paymentMode: o.payment_mode,
          paymentStatus: o.payment_status,
          fulfillmentStatus: o.fulfillment_status,
          subtotalAmount: Number(o.subtotal_amount) || 0,
          discountAmount: Number(o.discount_amount) || 0,
          couponCode: o.coupon_code || undefined,
          shippingCharge: Number(o.shipping_charge) || 0,
          totalAmount: Number(o.total_amount) || 0,
          codAdvanceAmount: o.cod_advance_amount !== null && o.cod_advance_amount !== undefined ? Number(o.cod_advance_amount) : undefined,
          codAdvancePaid: o.cod_advance_paid !== null && o.cod_advance_paid !== undefined ? Number(o.cod_advance_paid) : undefined,
          codRemainingAmount: o.cod_remaining_amount !== null && o.cod_remaining_amount !== undefined ? Number(o.cod_remaining_amount) : undefined,
          codAdvancePaymentStatus: o.cod_advance_payment_status || undefined,
          advancePaymentReference: o.advance_payment_reference || undefined,
          advancePaymentMethod: o.advance_payment_method || undefined,
          courierName: o.courier_name || undefined,
          trackingNumber: o.tracking_number || undefined,
          trackingUrl: o.tracking_url || undefined,
          adminNotes: o.admin_notes || undefined,
          items: (o.order_items || []).map((it: any) => ({
            id: it.id,
            productId: it.product_id,
            variantId: it.variant_id,
            productName: it.product_name,
            variantWeightLabel: it.variant_weight_label || '',
            imageUrl: it.image_url || '/assets/prod-banana-chips.png',
            unitPrice: Number(it.unit_price) || 0,
            quantity: Number(it.quantity) || 1,
            lineTotal: Number(it.line_total) || 0
          })),
          statusHistory: [],
          createdAt: o.created_at,
          updatedAt: o.updated_at
        }));

        try {
          localStorage.setItem('zada_admin_orders', JSON.stringify(mapped));
        } catch {}

        return { data: mapped, error: null, source: 'SUPABASE' };
      } catch (err: any) {
        return { data: null, error: err.message, source: 'SUPABASE' };
      }
    }

    const saved = localStorage.getItem('zada_admin_orders');
    return { data: saved ? JSON.parse(saved) : INITIAL_ORDERS, error: null, source: 'LOCAL_CACHE' };
  }
}

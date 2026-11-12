import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import {
  Product,
  Category,
  Subcategory,
  Order,
  OrderStatus,
  Review,
  BulkEnquiry,
  StoreSettings,
  Coupon,
  ComboBundle,
  HomepageBanner,
  HomepageSection,
  StockMovement,
  StockMovementReason,
  AdminAuditLog,
  StoreContentPage,
  PricingRule,
  CustomerDirectoryEntry,
  CategoryBanner,
  AdminAccount,
  AdminPermission,
  HandpickedSectionConfig,
  BestsellerSectionConfig,
  CorporateGiftingSectionConfig,
  HeritageStorySectionConfig,
  FeaturedCombosSectionConfig
} from '../types';
import { INITIAL_ADMINS, PROTECTED_SUPER_ADMIN, isSuperAdminEmail } from '../types/permissions';
import {
  INITIAL_CATEGORIES,
  INITIAL_SUBCATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_REVIEWS,
  INITIAL_COUPONS,
  INITIAL_STORE_SETTINGS,
  INITIAL_COMBOS,
  INITIAL_BANNERS,
  INITIAL_CATEGORY_BANNERS,
  INITIAL_HOMEPAGE_SECTIONS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_PRICING_RULES,
  INITIAL_STORE_CONTENT
} from '../data/mockData';
import { useToast } from './ToastContext';
import { SupabaseDataService, isUUID } from '../lib/commerce/supabaseDataService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';

interface AdminDataContextType {
  // Catalog
  categories: Category[];
  subcategories: Subcategory[];
  products: Product[];
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string, reassignToCategoryId?: string) => Promise<{ success: boolean; error?: string }>;
  deletedCategoryIds: string[];
  addSubcategory: (subcategory: Omit<Subcategory, 'id' | 'createdAt'>) => Promise<boolean>;
  updateSubcategory: (id: string, updates: Partial<Subcategory>) => Promise<boolean>;
  deleteSubcategory: (id: string, reassignToSubcategoryId?: string) => Promise<{ success: boolean; error?: string }>;
  toggleSubcategoryActive: (id: string) => Promise<boolean>;
  reorderSubcategories: (categorySubcategoryIds: string[]) => Promise<boolean>;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'averageRating' | 'reviewCount'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => Promise<{ success: boolean; error?: string; archived?: boolean }>;
  deletedProductIds: string[];
  toggleProductPublish: (productId: string) => void;

  // Inventory & Stock Movements
  stockMovements: StockMovement[];
  updateProductStock: (variantId: string, newStock: number) => void;
  adjustVariantStock: (
    variantId: string,
    delta: number,
    reason: StockMovementReason,
    notes?: string
  ) => boolean;

  // Orders & Fulfillment
  orders: Order[];
  updateOrderStatus: (
    orderId: string,
    newStatus: OrderStatus,
    courierName?: string,
    trackingNumber?: string,
    notes?: string,
    trackingUrl?: string
  ) => boolean;
  updatePaymentStatus: (
    orderId: string,
    newStatus: Order['paymentStatus'],
    notes?: string
  ) => void;
  createOrder: (order: Order) => void;

  // Customers
  customers: CustomerDirectoryEntry[];

  // Coupons & Pricing Rules
  coupons: Coupon[];
  addCoupon: (coupon: Omit<Coupon, 'id' | 'timesUsed'>) => void;
  updateCoupon: (id: string, updates: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;
  toggleCouponActive: (id: string) => void;
  pricingRules: PricingRule[];
  addPricingRule: (rule: Omit<PricingRule, 'id' | 'createdAt'>) => void;
  updatePricingRule: (id: string, updates: Partial<PricingRule>) => void;
  deletePricingRule: (id: string) => void;
  togglePricingRuleActive: (id: string) => void;

  // Combos
  combos: ComboBundle[];
  addCombo: (combo: Omit<ComboBundle, 'id' | 'createdAt'>) => void;
  updateCombo: (id: string, updates: Partial<ComboBundle>) => void;
  deleteCombo: (id: string) => void;
  toggleComboActive: (id: string) => void;

  // Homepage CMS
  banners: HomepageBanner[];
  deletedBannerIds: string[];
  addBanner: (banner: Omit<HomepageBanner, 'id'>) => Promise<{ success: boolean; data?: HomepageBanner; error?: string }>;
  updateBanner: (id: string, updates: Partial<HomepageBanner>) => Promise<{ success: boolean; data?: HomepageBanner; error?: string }>;
  deleteBanner: (id: string) => Promise<{ success: boolean; error?: string }>;
  toggleBannerActive: (id: string) => Promise<{ success: boolean; error?: string }>;
  reorderBanners: (bannerId: string, direction: 'UP' | 'DOWN') => Promise<{ success: boolean; error?: string }>;
  purgeSeedBanners: () => Promise<void>;
  homepageSections: HomepageSection[];
  updateHomepageSections: (sections: HomepageSection[]) => void;
  handpickedSection: HandpickedSectionConfig;
  updateHandpickedSection: (config: HandpickedSectionConfig) => Promise<{ success: boolean; error?: string }>;
  bestsellerSection: BestsellerSectionConfig;
  updateBestsellerSection: (config: BestsellerSectionConfig) => Promise<{ success: boolean; error?: string }>;
  corporateGiftingSection: CorporateGiftingSectionConfig;
  updateCorporateGiftingSection: (config: CorporateGiftingSectionConfig) => Promise<{ success: boolean; error?: string }>;
  heritageStorySection: HeritageStorySectionConfig;
  updateHeritageStorySection: (config: HeritageStorySectionConfig) => Promise<{ success: boolean; error?: string }>;
  featuredCombosSection: FeaturedCombosSectionConfig;
  updateFeaturedCombosSection: (config: FeaturedCombosSectionConfig) => Promise<{ success: boolean; error?: string }>;
  categoryBanners: CategoryBanner[];
  addCategoryBanner: (banner: Omit<CategoryBanner, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCategoryBanner: (id: string, updates: Partial<CategoryBanner>) => void;
  deleteCategoryBanner: (id: string) => void;
  toggleCategoryBannerActive: (id: string) => void;
  resetCategoryBannerDefaults: (slug: string) => void;

  // Reviews
  reviews: Review[];
  toggleReviewFeatured: (reviewId: string) => void;
  updateReviewApproval: (reviewId: string, approved: boolean) => void;
  deleteReview: (reviewId: string) => void;
  addReview: (review: Omit<Review, 'id' | 'createdAt' | 'isApproved' | 'isFeaturedOnPdp'> & { isApproved?: boolean }) => void;
  updateReview: (reviewId: string, updates: Partial<Review>) => void;

  // Bulk Enquiries
  enquiries: BulkEnquiry[];
  updateEnquiryStatus: (enquiryId: string, status: BulkEnquiry['status']) => void;
  updateEnquiryNotes: (enquiryId: string, notes: string) => void;
  submitBulkEnquiry: (enquiry: Omit<BulkEnquiry, 'id' | 'createdAt' | 'status'>) => void;

  // Settings & Content
  settings: StoreSettings;
  updateStoreSettings: (newSettings: Partial<StoreSettings>) => void;
  storeContent: StoreContentPage[];
  updateStoreContent: (slug: string, content: string, title?: string) => void;

  // Audit Logs
  auditLogs: AdminAuditLog[];
  logAdminAction: (action: string, targetEntity: string, details: string, targetId?: string) => void;

  // Admin Management & Permissions
  admins: AdminAccount[];
  createAdminAccount: (admin: {
    fullName: string;
    email: string;
    password?: string;
    permissions: AdminPermission[];
  }) => Promise<{ success: boolean; data?: AdminAccount; error?: string }>;
  updateAdminPermissions: (
    adminId: string,
    permissions: AdminPermission[]
  ) => Promise<{ success: boolean; error?: string }>;
  toggleAdminSuspension: (
    adminId: string,
    reason?: string
  ) => Promise<{ success: boolean; status?: 'active' | 'suspended'; error?: string }>;
  removeAdminAccount: (
    adminId: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

export const AdminDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showToast } = useToast();

  // Helper for LocalStorage initialization
  const loadInitial = <T,>(key: string, fallback: T): T => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  };

  const [deletedCategoryIds, setDeletedCategoryIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('zada_admin_deleted_category_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deletedProductIds, setDeletedProductIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('zada_admin_deleted_product_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const raw = loadInitial('zada_admin_categories', INITIAL_CATEGORIES);
    try {
      const saved = localStorage.getItem('zada_admin_deleted_category_ids');
      const delIds: string[] = saved ? JSON.parse(saved) : [];
      return raw.filter((c) => !delIds.includes(c.id));
    } catch {
      return raw;
    }
  });

  const [subcategories, setSubcategories] = useState<Subcategory[]>(() =>
    loadInitial('zada_admin_subcategories', INITIAL_SUBCATEGORIES)
  );

  const [products, setProducts] = useState<Product[]>(() => {
    const raw = loadInitial('zada_admin_products', INITIAL_PRODUCTS);
    try {
      const saved = localStorage.getItem('zada_admin_deleted_product_ids');
      const delIds: string[] = saved ? JSON.parse(saved) : [];
      return raw.filter((p) => !delIds.includes(p.id));
    } catch {
      return raw;
    }
  });

  const [orders, setOrders] = useState<Order[]>(() =>
    loadInitial('zada_admin_orders', INITIAL_ORDERS)
  );

  const [reviews, setReviews] = useState<Review[]>(() =>
    loadInitial('zada_admin_reviews', INITIAL_REVIEWS)
  );

  const [coupons, setCoupons] = useState<Coupon[]>(() =>
    loadInitial('zada_admin_coupons', INITIAL_COUPONS)
  );

  const [pricingRules, setPricingRules] = useState<PricingRule[]>(() =>
    loadInitial('zada_admin_pricing_rules', INITIAL_PRICING_RULES)
  );

  const [combos, setCombos] = useState<ComboBundle[]>(() =>
    loadInitial('zada_admin_combos', INITIAL_COMBOS)
  );

  const [deletedBannerIds, setDeletedBannerIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('zada_admin_deleted_banner_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deletedCategoryBannerIds, setDeletedCategoryBannerIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('zada_admin_deleted_category_banner_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [banners, setBanners] = useState<HomepageBanner[]>(() => {
    try {
      const savedDeleted = localStorage.getItem('zada_admin_deleted_banner_ids');
      const delIds: string[] = savedDeleted ? JSON.parse(savedDeleted) : [];
      const saved = localStorage.getItem('zada_admin_banners');
      if (saved) {
        const parsed: HomepageBanner[] = JSON.parse(saved);
        return parsed.filter((b) => !delIds.includes(b.id));
      }
      if (!isSupabaseConfigured()) {
        return INITIAL_BANNERS.filter((b) => !delIds.includes(b.id));
      }
      return [];
    } catch {
      return [];
    }
  });

  const [handpickedSection, setHandpickedSection] = useState<HandpickedSectionConfig>(() => {
    try {
      const saved = localStorage.getItem('zada_admin_handpicked_section');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      id: 'h0000000-0000-0000-0000-000000000001',
      title: 'Traditional Sweets & Specialties',
      subtitle: 'Slow-cooked authentic delicacies, regional staples & specialty treats',
      badge: 'Handpicked For You',
      isVisible: true,
      productIds: ['prod-cashew-halwa', '11111111-1111-1111-1111-000000000002']
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('zada_admin_handpicked_section', JSON.stringify(handpickedSection));
    } catch {}
  }, [handpickedSection]);

  const [bestsellerSection, setBestsellerSection] = useState<BestsellerSectionConfig>(() => {
    try {
      const saved = localStorage.getItem('zada_admin_bestseller_section');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      id: 'h0000000-0000-0000-0000-000000000002',
      title: 'Bestsellers',
      subtitle: 'Our most celebrated Kerala snacks, traditional spices & sweets',
      badge: 'Customer Favourites',
      isVisible: true,
      maxProducts: 4,
      productIds: [
        'd0000000-0000-0000-0000-000000000001',
        'd0000000-0000-0000-0000-000000000004',
        'd0000000-0000-0000-0000-000000000003'
      ]
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('zada_admin_bestseller_section', JSON.stringify(bestsellerSection));
    } catch {}
  }, [bestsellerSection]);

  const [corporateGiftingSection, setCorporateGiftingSection] = useState<CorporateGiftingSectionConfig>(() => {
    try {
      const saved = localStorage.getItem('zada_admin_corporate_section');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      id: 'h0000000-0000-0000-0000-000000000003',
      eyebrow: 'Corporate & Wedding Gifting',
      heading: 'Planning a Festive Gathering or Corporate Event?',
      description: 'Customized Kerala delicacy boxes, corporate gifting hampers, and wholesale spice orders handcrafted for your special occasions.',
      bulletPoints: [
        'Corporate gifting hampers',
        'Wedding Kerala delicacy boxes',
        'Bulk spice orders'
      ],
      primaryCtaLabel: 'Discuss a Custom Order',
      primaryCtaDestination: '/bulk-orders',
      secondaryCtaLabel: 'Chat on WhatsApp',
      secondaryCtaDestination: 'https://wa.me/917593959235',
      bgPreset: '#072C20',
      textColor: '#FFFFFF',
      isActive: true,
      displayOrder: 7,
      desktopVisible: true,
      mobileVisible: true
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('zada_admin_corporate_section', JSON.stringify(corporateGiftingSection));
    } catch {}
  }, [corporateGiftingSection]);

  const [heritageStorySection, setHeritageStorySection] = useState<HeritageStorySectionConfig>(() => {
    try {
      const saved = localStorage.getItem('zada_admin_heritage_story_section');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      id: 'h0000000-0000-0000-0000-000000000004',
      eyebrow: 'TRADITION MEETS PURITY',
      heading: 'Pure Ingredients, Generational Craft',
      subtitle: 'Rooted in Kerala. Crafted for Every Kitchen.',
      description: 'Hand-picked raw materials, cold-pressed coconut oil, zero preservatives, and traditional recipes perfected across three generations.',
      imageUrl: '/assets/prod-banana-chips-hero.png',
      ctaLabel: 'Read Our Story',
      ctaDestination: '/our-story',
      bgPreset: '#FAF6EE',
      textColor: '#1C1917',
      isActive: true,
      displayOrder: 6,
      desktopVisible: true,
      mobileVisible: true
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('zada_admin_heritage_story_section', JSON.stringify(heritageStorySection));
    } catch {}
  }, [heritageStorySection]);

  const [featuredCombosSection, setFeaturedCombosSection] = useState<FeaturedCombosSectionConfig>(() => {
    try {
      const saved = localStorage.getItem('zada_admin_featured_combos_section');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      id: 'h0000000-0000-0000-0000-000000000005',
      title: 'Signature Kerala Combos',
      subtitle: 'Authentic Kerala pairings crafted together for festive gifting and everyday indulgence',
      eyebrow: 'Curated Gift Bundles & Value Packs',
      isVisible: false,
      comboIds: [],
      maxCombos: 6,
      displayOrder: 5
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('zada_admin_featured_combos_section', JSON.stringify(featuredCombosSection));
    } catch {}
  }, [featuredCombosSection]);

  const [categoryBanners, setCategoryBanners] = useState<CategoryBanner[]>(() => {
    const raw = loadInitial('zada_admin_category_banners', INITIAL_CATEGORY_BANNERS);
    try {
      const savedDeleted = localStorage.getItem('zada_admin_deleted_category_banner_ids');
      const delIds: string[] = savedDeleted ? JSON.parse(savedDeleted) : [];
      return raw.filter((b) => !delIds.includes(b.id));
    } catch {
      return raw;
    }
  });

  const [homepageSections, setHomepageSections] = useState<HomepageSection[]>(() =>
    loadInitial('zada_admin_sections', INITIAL_HOMEPAGE_SECTIONS)
  );

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() =>
    loadInitial('zada_admin_stock_movements', INITIAL_STOCK_MOVEMENTS)
  );

  const [enquiries, setEnquiries] = useState<BulkEnquiry[]>(() =>
    loadInitial('zada_admin_enquiries', [])
  );

  const [settings, setSettings] = useState<StoreSettings>(() => {
    const loaded = loadInitial('zada_admin_settings', INITIAL_STORE_SETTINGS);
    // Sanitize any legacy placeholder WhatsApp numbers
    if (
      loaded.whatsAppDestinationNumber?.includes('98765') ||
      loaded.supportWhatsApp?.includes('98765') ||
      loaded.whatsAppDestinationNumber?.includes('94000') ||
      loaded.supportWhatsApp?.includes('94000')
    ) {
      return {
        ...loaded,
        whatsAppDestinationNumber: '917593959235',
        supportWhatsApp: '+91 75939 59235'
      };
    }
    return loaded;
  });

  const [storeContent, setStoreContent] = useState<StoreContentPage[]>(() =>
    loadInitial('zada_admin_store_content', INITIAL_STORE_CONTENT)
  );

  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>(() =>
    loadInitial('zada_admin_audit_logs', INITIAL_AUDIT_LOGS)
  );

  const [admins, setAdmins] = useState<AdminAccount[]>(() => {
    const loaded = loadInitial<AdminAccount[]>('zada_admin_accounts_list', INITIAL_ADMINS);
    // Ensure root super admin is always present and active
    const hasSuperAdmin = loaded.some(a => isSuperAdminEmail(a.email));
    if (!hasSuperAdmin) {
      return [PROTECTED_SUPER_ADMIN, ...loaded];
    }
    return loaded;
  });

  // LocalStorage persistence for banners and category banners
  useEffect(() => {
    localStorage.setItem('zada_admin_banners', JSON.stringify(banners));
  }, [banners]);

  useEffect(() => {
    localStorage.setItem('zada_admin_category_banners', JSON.stringify(categoryBanners));
  }, [categoryBanners]);

  useEffect(() => {
    localStorage.setItem('zada_admin_deleted_banner_ids', JSON.stringify(deletedBannerIds));
  }, [deletedBannerIds]);

  useEffect(() => {
    localStorage.setItem('zada_admin_deleted_category_banner_ids', JSON.stringify(deletedCategoryBannerIds));
  }, [deletedCategoryBannerIds]);

  useEffect(() => {
    localStorage.setItem('zada_admin_deleted_product_ids', JSON.stringify(deletedProductIds));
  }, [deletedProductIds]);

  useEffect(() => {
    localStorage.setItem('zada_admin_deleted_category_ids', JSON.stringify(deletedCategoryIds));
  }, [deletedCategoryIds]);

  useEffect(() => {
    localStorage.setItem('zada_admin_settings', JSON.stringify(settings));
  }, [settings]);

  // When live Supabase is configured, load products, categories and operations from authoritative database
  useEffect(() => {
    let isMounted = true;
    if (isSupabaseConfigured()) {
      Promise.allSettled([
        SupabaseDataService.fetchAllProductsAdmin(),
        SupabaseDataService.fetchCategories(),
        SupabaseDataService.fetchBanners(),
        SupabaseDataService.fetchCategoryBanners(),
        SupabaseDataService.fetchSubcategories(),
        SupabaseDataService.fetchCouponsAdmin(),
        SupabaseDataService.fetchCombosAdmin(),
        SupabaseDataService.fetchPricingRulesAdmin(),
        SupabaseDataService.fetchReviewsAdmin(),
        SupabaseDataService.fetchEnquiriesAdmin(),
        SupabaseDataService.fetchStoreSettings(),
        SupabaseDataService.fetchOrdersAdmin(),
        typeof SupabaseDataService.fetchInventoryMovements === 'function'
          ? SupabaseDataService.fetchInventoryMovements()
          : Promise.resolve({ data: [], error: null, source: 'LOCAL_CACHE' } as any),
        typeof SupabaseDataService.fetchBestsellerSection === 'function'
          ? SupabaseDataService.fetchBestsellerSection()
          : Promise.resolve({ data: null, error: null, source: 'LOCAL_CACHE' } as any),
        typeof SupabaseDataService.fetchCorporateGiftingSection === 'function'
          ? SupabaseDataService.fetchCorporateGiftingSection()
          : Promise.resolve({ data: null, error: null, source: 'LOCAL_CACHE' } as any),
        typeof SupabaseDataService.fetchHeritageStorySection === 'function'
          ? SupabaseDataService.fetchHeritageStorySection()
          : Promise.resolve({ data: null, error: null, source: 'LOCAL_CACHE' } as any),
        typeof SupabaseDataService.fetchFeaturedCombosSection === 'function'
          ? SupabaseDataService.fetchFeaturedCombosSection()
          : Promise.resolve({ data: null, error: null, source: 'LOCAL_CACHE' } as any),
        typeof SupabaseDataService.fetchHandpickedSection === 'function'
          ? SupabaseDataService.fetchHandpickedSection()
          : Promise.resolve({ data: null, error: null, source: 'LOCAL_CACHE' } as any),
        typeof SupabaseDataService.fetchStoreContent === 'function'
          ? SupabaseDataService.fetchStoreContent()
          : Promise.resolve({ data: null, error: null, source: 'LOCAL_CACHE' } as any)
      ])
        .then((results) => {
          if (!isMounted) return;
          const prodRes = results[0].status === 'fulfilled' ? results[0].value : null;
          const catRes = results[1].status === 'fulfilled' ? results[1].value : null;
          const bannerRes = results[2].status === 'fulfilled' ? results[2].value : null;
          const catBannerRes = results[3].status === 'fulfilled' ? results[3].value : null;
          const subRes = results[4].status === 'fulfilled' ? results[4].value : null;
          const coupRes = results[5].status === 'fulfilled' ? results[5].value : null;
          const comboRes = results[6].status === 'fulfilled' ? results[6].value : null;
          const prRes = results[7].status === 'fulfilled' ? results[7].value : null;
          const revRes = results[8].status === 'fulfilled' ? results[8].value : null;
          const enqRes = results[9].status === 'fulfilled' ? results[9].value : null;
          const setRes = results[10].status === 'fulfilled' ? results[10].value : null;
          const ordRes = results[11].status === 'fulfilled' ? results[11].value : null;
          const movRes = results[12].status === 'fulfilled' ? results[12].value : null;
          const bestRes = results[13]?.status === 'fulfilled' ? results[13].value : null;
          const corpRes = results[14]?.status === 'fulfilled' ? results[14].value : null;
          const heritRes = results[15]?.status === 'fulfilled' ? results[15].value : null;
          const featComboRes = results[16]?.status === 'fulfilled' ? results[16].value : null;
          const handRes = results[17]?.status === 'fulfilled' ? results[17].value : null;
          const contentRes = results[18]?.status === 'fulfilled' ? results[18].value : null;

          if (bestRes?.data) {
            setBestsellerSection(bestRes.data);
          }
          if (corpRes?.data) {
            setCorporateGiftingSection(corpRes.data);
          }
          if (heritRes?.data) {
            setHeritageStorySection(heritRes.data);
          }
          if (featComboRes?.data) {
            setFeaturedCombosSection(featComboRes.data);
          }
          if (handRes?.data) {
            setHandpickedSection(handRes.data);
          }
          if (contentRes?.data && contentRes.data.length > 0) {
            setStoreContent(contentRes.data);
          }

          if (prodRes?.data && prodRes.data.length > 0) {
            // Filter out any products deleted by admin so they never resurrect on refresh
            const activeProds = prodRes.data.filter((p) => !deletedProductIds.includes(p.id));
            setProducts(activeProds);
          } else if (prodRes?.error) {
            console.warn('[AdminDataContext] Live products fetch notice:', prodRes.error);
          }

          if (catRes?.data && catRes.data.length > 0) {
            // Filter out any categories deleted by admin so they never resurrect on refresh
            const activeCats = catRes.data.filter((c) => !deletedCategoryIds.includes(c.id));
            setCategories(activeCats);
          } else if (catRes?.error) {
            console.warn('[AdminDataContext] Live categories fetch notice:', catRes.error);
          }

          if (subRes && subRes.data) {
            setSubcategories(subRes.data);
          }

          if (bannerRes?.data) {
            // Filter out any banners deleted by admin so they never resurrect on refresh
            const activeBanners = bannerRes.data.filter((b) => !deletedBannerIds.includes(b.id));
            setBanners(activeBanners.sort((a, b) => a.displayOrder - b.displayOrder));
          }

          if (catBannerRes?.data && catBannerRes.data.length > 0) {
            const activeCatBanners = catBannerRes.data.filter((b) => !deletedCategoryBannerIds.includes(b.id));
            setCategoryBanners(activeCatBanners);
          }

          if (coupRes?.data && coupRes.data.length > 0) {
            setCoupons(coupRes.data);
          }

          if (comboRes?.data && comboRes.data.length > 0) {
            setCombos(comboRes.data);
          }

          if (prRes?.data && prRes.data.length > 0) {
            setPricingRules(prRes.data);
          }

          if (revRes?.data && revRes.data.length > 0) {
            setReviews(revRes.data);
          }

          if (enqRes?.data) {
            setEnquiries(enqRes.data);
          }

          if (setRes?.data) {
            setSettings(setRes.data);
          }

          if (ordRes?.data && ordRes.data.length > 0) {
            setOrders(ordRes.data);
          }

          if (movRes?.data && movRes.data.length > 0) {
            setStockMovements(movRes.data);
          }
        })
        .catch((err) => {
          console.warn('[AdminDataContext] Live data sync error:', err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [deletedBannerIds, deletedCategoryBannerIds, deletedProductIds, deletedCategoryIds]);

  // Sync state to local storage for persistence across reloads
  useEffect(() => {
    try {
      localStorage.setItem('zada_admin_categories', JSON.stringify(categories));
      localStorage.setItem('zada_admin_subcategories', JSON.stringify(subcategories));
      localStorage.setItem('zada_admin_products', JSON.stringify(products));
      localStorage.setItem('zada_admin_orders', JSON.stringify(orders));
      localStorage.setItem('zada_admin_reviews', JSON.stringify(reviews));
      localStorage.setItem('zada_admin_coupons', JSON.stringify(coupons));
      localStorage.setItem('zada_admin_pricing_rules', JSON.stringify(pricingRules));
      localStorage.setItem('zada_admin_combos', JSON.stringify(combos));
      localStorage.setItem('zada_admin_banners', JSON.stringify(banners));
      localStorage.setItem('zada_admin_sections', JSON.stringify(homepageSections));
      localStorage.setItem('zada_admin_stock_movements', JSON.stringify(stockMovements));
      localStorage.setItem('zada_admin_enquiries', JSON.stringify(enquiries));
      localStorage.setItem('zada_admin_settings', JSON.stringify(settings));
      localStorage.setItem('zada_admin_store_content', JSON.stringify(storeContent));
      localStorage.setItem('zada_admin_audit_logs', JSON.stringify(auditLogs));
      localStorage.setItem('zada_admin_accounts_list', JSON.stringify(admins));
    } catch (e) {
      console.error('Failed to sync admin data', e);
    }
  }, [
    categories,
    subcategories,
    products,
    orders,
    reviews,
    coupons,
    pricingRules,
    combos,
    banners,
    homepageSections,
    stockMovements,
    enquiries,
    settings,
    storeContent,
    auditLogs,
    admins
  ]);

  // Internal Audit Log Helper
  const logAdminAction = (
    action: string,
    targetEntity: string,
    details: string,
    targetId?: string
  ) => {
    const newLog: AdminAuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      adminUser: 'admin@zadafoods.com',
      action,
      targetEntity,
      targetId,
      details,
      createdAt: new Date().toISOString()
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // 1. Categories Management
  const addCategory = (categoryData: Omit<Category, 'id'>) => {
    if (!isSupabaseConfigured()) {
      const newId = `cat-${categoryData.slug || Date.now()}`;
      const newCat: Category = { ...categoryData, id: newId, subcategories: [] };
      setCategories((prev) => [...prev, newCat]);
      logAdminAction('CREATE_CATEGORY', 'CATEGORY', `Created category "${newCat.name}"`, newId);
      showToast('Category Created', `Category "${newCat.name}" added successfully.`, 'success');
      return { success: true, data: newCat };
    }

    return (async () => {
      try {
        const res = await SupabaseDataService.createCategory(categoryData);
        if (res.error || !res.data) {
          showToast('Category Creation Failed', res.error || 'Failed to create category.', 'error');
          return { success: false, error: res.error };
        }
        const newCat: Category = res.data;
        setCategories((prev) => [...prev.filter((c) => c.id !== newCat.id), newCat]);
        logAdminAction('CREATE_CATEGORY', 'CATEGORY', `Created category "${newCat.name}"`, newCat.id);
        showToast('Category Created', `Category "${newCat.name}" added successfully.`, 'success');
        return { success: true, data: newCat };
      } catch (err: any) {
        showToast('Category Creation Error', err.message || 'Unable to create category.', 'error');
        return { success: false, error: err.message };
      }
    })();
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    if (!isSupabaseConfigured()) {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
      logAdminAction('UPDATE_CATEGORY', 'CATEGORY', `Updated category ${id}`, id);
      showToast('Category Updated', 'Category details saved.', 'info');
      return { success: true };
    }

    return (async () => {
      try {
        const res = await SupabaseDataService.updateCategory(id, updates);
        if (res.error) {
          showToast('Category Update Failed', res.error, 'error');
          return { success: false, error: res.error };
        }
        setCategories((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
        );
        logAdminAction('UPDATE_CATEGORY', 'CATEGORY', `Updated category ${id}`, id);
        showToast('Category Updated', 'Category details saved.', 'info');
        return { success: true };
      } catch (err: any) {
        showToast('Category Update Error', err.message || 'Unable to update category.', 'error');
        return { success: false, error: err.message };
      }
    })();
  };

  const deleteCategory = async (id: string, reassignToCategoryId?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check if products are currently assigned to this category
      const assignedProducts = products.filter((p) => p.categoryId === id);
      if (assignedProducts.length > 0 && !reassignToCategoryId) {
        const errorMsg = `Cannot delete category: ${assignedProducts.length} product(s) (e.g. "${assignedProducts[0].name}") are currently assigned to this category. Reassign or delete products first.`;
        showToast('Delete Failed', errorMsg, 'error');
        return { success: false, error: errorMsg };
      }

      const res = reassignToCategoryId
        ? await SupabaseDataService.deleteCategory(id, reassignToCategoryId)
        : await SupabaseDataService.deleteCategory(id);

      if (!res || res.error || res.data === false) {
        const errorMsg = res?.error || 'Failed to delete category from database.';
        showToast('Delete Failed', errorMsg, 'error');
        return { success: false, error: errorMsg };
      }

      setDeletedCategoryIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      setCategories((prev) => prev.filter((c) => c.id !== id));
      if (reassignToCategoryId) {
        setProducts((prev) =>
          prev.map((p) => (p.categoryId === id ? { ...p, categoryId: reassignToCategoryId } : p))
        );
      }
      logAdminAction('DELETE_CATEGORY', 'CATEGORY', `Deleted category ${id}`, id);
      showToast('Category Removed', 'Category has been deleted permanently from database.', 'info');
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'An unexpected error occurred while deleting category.';
      showToast('Delete Failed', msg, 'error');
      return { success: false, error: msg };
    }
  };

  // 1B. Subcategories Management
  const addSubcategory = async (
    subcategoryData: Omit<Subcategory, 'id' | 'createdAt'>
  ): Promise<boolean> => {
    try {
      const res = await SupabaseDataService.createSubcategory(subcategoryData);
      const newSub: Subcategory = res.data || {
        ...subcategoryData,
        id: `sub-${subcategoryData.slug}-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      setSubcategories((prev) => [...prev, newSub]);
      logAdminAction('CREATE_SUBCATEGORY', 'SUBCATEGORY', `Created subcategory "${newSub.name}"`, newSub.id);
      showToast('Subcategory Created', `Subcategory "${newSub.name}" added successfully.`, 'success');
      return true;
    } catch (e: any) {
      showToast('Creation Failed', e.message || 'Unable to create subcategory.', 'error');
      return false;
    }
  };

  const updateSubcategory = async (
    id: string,
    updates: Partial<Subcategory>
  ): Promise<boolean> => {
    try {
      await SupabaseDataService.updateSubcategory(id, updates);
      setSubcategories((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );
      logAdminAction('UPDATE_SUBCATEGORY', 'SUBCATEGORY', `Updated subcategory ${id}`, id);
      showToast('Subcategory Updated', 'Subcategory saved successfully.', 'info');
      return true;
    } catch (e: any) {
      showToast('Update Failed', e.message || 'Unable to update subcategory.', 'error');
      return false;
    }
  };

  const deleteSubcategory = async (
    id: string,
    reassignToSubcategoryId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Reassign or unassign affected products first
      const affectedProducts = products.filter((p) => p.subcategoryId === id);
      if (affectedProducts.length > 0) {
        setProducts((prev) =>
          prev.map((p) =>
            p.subcategoryId === id
              ? { ...p, subcategoryId: reassignToSubcategoryId || undefined }
              : p
          )
        );
      }

      await SupabaseDataService.deleteSubcategory(id, reassignToSubcategoryId);
      setSubcategories((prev) => prev.filter((s) => s.id !== id));
      logAdminAction('DELETE_SUBCATEGORY', 'SUBCATEGORY', `Deleted subcategory ${id}`, id);
      showToast('Subcategory Deleted', 'Subcategory removed from catalog.', 'info');
      return { success: true };
    } catch (e: any) {
      showToast('Delete Failed', e.message || 'Unable to delete subcategory.', 'error');
      return { success: false, error: e.message };
    }
  };

  const toggleSubcategoryActive = async (id: string): Promise<boolean> => {
    const target = subcategories.find((s) => s.id === id);
    if (!target) return false;
    const newActive = !target.isActive;
    return updateSubcategory(id, { isActive: newActive });
  };

  const reorderSubcategories = async (
    categorySubcategoryIds: string[]
  ): Promise<boolean> => {
    try {
      const idToOrder = new Map(categorySubcategoryIds.map((subId, idx) => [subId, idx + 1]));
      setSubcategories((prev) => {
        return prev.map((s) => {
          if (idToOrder.has(s.id)) {
            const newOrder = idToOrder.get(s.id)!;
            SupabaseDataService.updateSubcategory(s.id, { displayOrder: newOrder });
            return { ...s, displayOrder: newOrder };
          }
          return s;
        });
      });
      showToast('Order Updated', 'Subcategory sequence saved.', 'success');
      return true;
    } catch {
      showToast('Reorder Failed', 'Could not update display sequence.', 'error');
      return false;
    }
  };

  const syncedCategories = useMemo(() => {
    return categories.map((cat) => ({
      ...cat,
      subcategories: subcategories
        .filter((s) => s.categoryId === cat.id || s.categoryId === cat.slug)
        .sort((a, b) => a.displayOrder - b.displayOrder)
    }));
  }, [categories, subcategories]);

  // 2. Products Management
  const addProduct = (
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'averageRating' | 'reviewCount'>
  ) => {
    if (!isSupabaseConfigured()) {
      const newId = `prod-${Date.now()}`;
      const timestamp = new Date().toISOString();
      const newProd: Product = {
        ...productData,
        id: newId,
        averageRating: 5.0,
        reviewCount: 0,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      setProducts((prev) => [newProd, ...prev]);
      logAdminAction('CREATE_PRODUCT', 'PRODUCT', `Added product "${newProd.name}"`, newId);
      showToast('Product Created', `Product "${newProd.name}" added to catalog.`, 'success');
      return { success: true, data: newProd };
    }

    return (async () => {
      try {
        const res = await SupabaseDataService.createProduct(productData);
        if (res.error || !res.data) {
          showToast('Product Creation Failed', res.error || 'Failed to create product in database.', 'error');
          return { success: false, error: res.error };
        }
        const newProd = res.data;
        setProducts((prev) => [newProd, ...prev.filter(p => p.id !== newProd.id)]);
        logAdminAction('CREATE_PRODUCT', 'PRODUCT', `Added product "${newProd.name}"`, newProd.id);
        showToast('Product Created', `Product "${newProd.name}" added to catalog.`, 'success');
        return { success: true, data: newProd };
      } catch (err: any) {
        showToast('Product Creation Error', err.message || 'Error creating product.', 'error');
        return { success: false, error: err.message };
      }
    })();
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    if (!isSupabaseConfigured()) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
        )
      );
      logAdminAction('UPDATE_PRODUCT', 'PRODUCT', `Updated product details for ${id}`, id);
      showToast('Product Saved', 'Catalog item updated successfully.', 'success');
      return { success: true };
    }

    return (async () => {
      try {
        const res = await SupabaseDataService.updateProduct(id, updates);
        if (res.error) {
          showToast('Product Update Failed', res.error, 'error');
          return { success: false, error: res.error };
        }
        setProducts((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          )
        );
        logAdminAction('UPDATE_PRODUCT', 'PRODUCT', `Updated product details for ${id}`, id);
        showToast('Product Saved', 'Catalog item updated successfully.', 'success');
        return { success: true };
      } catch (err: any) {
        showToast('Product Update Error', err.message || 'Error updating product.', 'error');
        return { success: false, error: err.message };
      }
    })();
  };

  const deleteProduct = async (
    id: string
  ): Promise<{ success: boolean; error?: string; archived?: boolean }> => {
    try {
      const res = await SupabaseDataService.deleteProduct(id);
      if (res.error) {
        showToast('Delete Failed', res.error, 'error');
        return { success: false, error: res.error };
      }

      const isArchived = res.data?.archived === true;
      setDeletedProductIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      setProducts((prev) => prev.filter((p) => p.id !== id));

      logAdminAction(
        'DELETE_PRODUCT',
        'PRODUCT',
        isArchived
          ? `Archived product ${id} (safe soft-delete due to existing order records)`
          : `Permanently deleted product ${id}`,
        id
      );

      if (isArchived) {
        showToast(
          'Product Archived',
          'Product has historical customer orders; it was safely unpublished, marked inactive and hidden from storefront.',
          'info'
        );
      } else {
        showToast('Product Removed', 'Product deleted permanently from database and catalog.', 'success');
      }

      return { success: true, archived: isArchived };
    } catch (err: any) {
      const msg = err.message || 'An unexpected error occurred while deleting product.';
      showToast('Delete Failed', msg, 'error');
      return { success: false, error: msg };
    }
  };

  const toggleProductPublish = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    const newStatus = !target.isPublished;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        return { ...p, isPublished: newStatus };
      })
    );
    logAdminAction(
      'TOGGLE_PRODUCT_PUBLISH',
      'PRODUCT',
      `Changed publish status to ${newStatus} for "${target.name}"`,
      target.id
    );
    showToast('Status Updated', `Product is now ${newStatus ? 'published' : 'hidden'}.`, 'info');

    if (isSupabaseConfigured() && isUUID(productId)) {
      SupabaseDataService.toggleProductPublish(productId, newStatus)
        .then((res) => {
          if (res?.error) {
            setProducts((prev) =>
              prev.map((p) => (p.id === productId ? { ...p, isPublished: !newStatus } : p))
            );
            showToast('Publish Status Failed', res.error, 'error');
          }
        })
        .catch((err: any) => {
          setProducts((prev) =>
            prev.map((p) => (p.id === productId ? { ...p, isPublished: !newStatus } : p))
          );
          showToast('Publish Status Error', err.message, 'error');
        });
    }
  };

  // 3. Inventory & Variant Stock Adjustment
  const updateProductStock = (variantId: string, newStock: number) => {
    adjustVariantStock(variantId, newStock, 'MANUAL_ADJUSTMENT', 'Direct inventory override');
  };

  const adjustVariantStock = (
    variantId: string,
    deltaOrNewStock: number,
    reason: StockMovementReason,
    notes?: string
  ): boolean => {
    let found = false;
    let prodName = '';
    let varLabel = '';
    let prodId = '';
    let oldStock = 0;
    let finalStock = 0;

    setProducts((prev) =>
      prev.map((p) => {
        const variantIndex = p.variants.findIndex((v) => v.id === variantId);
        if (variantIndex === -1) return p;

        found = true;
        prodId = p.id;
        prodName = p.name;
        const currentVariant = p.variants[variantIndex];
        varLabel = currentVariant.weightLabel;
        oldStock = currentVariant.stockQuantity;

        if (reason === 'MANUAL_ADJUSTMENT') {
          finalStock = Math.max(0, deltaOrNewStock);
        } else {
          finalStock = Math.max(0, oldStock + deltaOrNewStock);
        }

        const updatedVariants = [...p.variants];
        updatedVariants[variantIndex] = {
          ...currentVariant,
          stockQuantity: finalStock
        };

        return { ...p, variants: updatedVariants };
      })
    );

    if (found) {
      const netDelta = finalStock - oldStock;
      const movement: StockMovement = {
        id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        variantId,
        productId: prodId,
        productName: prodName,
        variantLabel: varLabel,
        delta: netDelta,
        previousStock: oldStock,
        newStock: finalStock,
        reason,
        notes: notes || `Stock updated via ${reason}`,
        actor: 'Admin Console',
        createdAt: new Date().toISOString()
      };
      setStockMovements((prev) => [movement, ...prev]);

      // Authoritative Supabase Stock Persistence: Update variant stock and record movement
      if (typeof SupabaseDataService.updateVariantStock === 'function') {
        SupabaseDataService.updateVariantStock(variantId, finalStock, {
          reason,
          notes: notes || `Stock updated via ${reason}`,
          delta: netDelta,
          previousStock: oldStock
        }).catch((err) => console.warn('[Inventory] Supabase stock persist warning:', err));
      }
      logAdminAction(
        'ADJUST_STOCK',
        'INVENTORY',
        `Adjusted stock for ${prodName} (${varLabel}): ${oldStock} -> ${finalStock} (${reason})`,
        variantId
      );
      showToast('Inventory Adjusted', `${varLabel} now has ${finalStock} units in stock.`, 'info');
      return true;
    }
    return false;
  };

  // 4. Orders & Permitted Status Transitions
  const updateOrderStatus = (
    orderId: string,
    newStatus: OrderStatus,
    courierName?: string,
    trackingNumber?: string,
    notes?: string,
    trackingUrl?: string
  ): boolean => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) {
      showToast('Order Not Found', `Order ${orderId} does not exist.`, 'error');
      return false;
    }

    // Permitted Status Transition Validation:
    // CONFIRMED -> PACKED -> SHIPPED -> DELIVERED
    // Any status before DELIVERED can transition to CANCELLED
    // CANCELLED orders cannot be transitioned to any other state
    if (targetOrder.fulfillmentStatus === 'CANCELLED') {
      showToast('Invalid Transition', 'Cancelled orders cannot be reopened or fulfilled.', 'error');
      return false;
    }

    if (targetOrder.fulfillmentStatus === 'DELIVERED' && newStatus !== 'DELIVERED') {
      showToast('Invalid Transition', 'Delivered orders cannot be moved back to prior states.', 'error');
      return false;
    }

    // If order is transitioning to CANCELLED, automatically restock the items!
    if (newStatus === 'CANCELLED') {
      targetOrder.items.forEach((item) => {
        adjustVariantStock(
          item.variantId,
          item.quantity,
          'ORDER_CANCELLED_RESTOCK',
          `Restocked from cancelled order ${targetOrder.orderNumber}`
        );
      });
    }

    const historyEntry = {
      id: `osh-${Date.now()}`,
      orderId,
      status: newStatus,
      notes: notes || `Order status updated to ${newStatus}`,
      courierName: courierName || targetOrder.courierName,
      trackingNumber: trackingNumber || targetOrder.trackingNumber,
      trackingUrl: trackingUrl || targetOrder.trackingUrl,
      updatedBy: 'Admin Console',
      createdAt: new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          fulfillmentStatus: newStatus,
          courierName: courierName || order.courierName,
          trackingNumber: trackingNumber || order.trackingNumber,
          trackingUrl: trackingUrl || order.trackingUrl,
          adminNotes: notes || order.adminNotes,
          updatedAt: new Date().toISOString(),
          statusHistory: [historyEntry, ...order.statusHistory]
        };
      })
    );

    logAdminAction(
      'UPDATE_ORDER_STATUS',
      'ORDER',
      `Order ${targetOrder.orderNumber} fulfillment status changed to ${newStatus}`,
      orderId
    );

    if (isSupabaseConfigured()) {
      SupabaseDataService.transitionOrderStatus(
        orderId,
        newStatus,
        courierName || targetOrder.courierName,
        trackingNumber || targetOrder.trackingNumber,
        notes
      ).catch((err) => {
        console.error('[AdminDataContext] Supabase transitionOrderStatus failed:', err);
      });
    }

    showToast(
      'Order Status Updated',
      `Order ${targetOrder.orderNumber} is now ${newStatus}.`,
      'success'
    );
    return true;
  };

  const updatePaymentStatus = (
    orderId: string,
    newStatus: Order['paymentStatus'],
    notes?: string
  ) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          paymentStatus: newStatus,
          adminNotes: notes ? `${order.adminNotes || ''}\n[Payment]: ${notes}` : order.adminNotes,
          updatedAt: new Date().toISOString()
        };
      })
    );
    logAdminAction(
      'UPDATE_PAYMENT_STATUS',
      'ORDER',
      `Order ${orderId} payment status changed to ${newStatus}`,
      orderId
    );
    showToast('Payment Status Updated', `Payment is now marked as ${newStatus}.`, 'info');
  };

  const createOrder = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);

    // Deduct stock for each purchased variant to maintain inventory consistency
    newOrder.items.forEach((item) => {
      adjustVariantStock(
        item.variantId,
        -item.quantity,
        'ORDER_DEDUCTION',
        `Purchased in order ${newOrder.orderNumber}`
      );
    });

    logAdminAction('CREATE_ORDER', 'ORDER', `New order placed: ${newOrder.orderNumber}`, newOrder.id);

    if (isSupabaseConfigured()) {
      SupabaseDataService.persistOrder(newOrder).catch((err) => {
        console.error('[AdminDataContext] Supabase persistOrder failed:', err);
      });
    }
  };

  // 5. Derived Customer Directory
  const customers = useMemo<CustomerDirectoryEntry[]>(() => {
    const map = new Map<string, CustomerDirectoryEntry>();

    orders.forEach((o) => {
      const email = o.customerEmail.toLowerCase().trim();
      const existing = map.get(email);

      if (existing) {
        existing.totalOrders += 1;
        existing.totalSpend += o.totalAmount;
        if (new Date(o.createdAt) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = o.createdAt;
        }
      } else {
        map.set(email, {
          id: o.userId || `cust-${Math.abs(email.split('').reduce((a, b) => a + b.charCodeAt(0), 0))}`,
          fullName: o.customerName,
          email: o.customerEmail,
          phone: o.customerPhone,
          totalOrders: 1,
          totalSpend: o.totalAmount,
          lastOrderDate: o.createdAt,
          createdAt: o.createdAt,
          addresses: [o.shippingAddress]
        });
      }
    });

    return Array.from(map.values());
  }, [orders]);

  // 6. Coupons Management
  const addCoupon = (couponData: Omit<Coupon, 'id' | 'timesUsed'>) => {
    if (!isSupabaseConfigured()) {
      const newCoupon: Coupon = {
        ...couponData,
        id: `coup-${Date.now()}`,
        timesUsed: 0
      };
      setCoupons((prev) => [newCoupon, ...prev]);
      logAdminAction('CREATE_COUPON', 'COUPON', `Created coupon code ${newCoupon.code}`, newCoupon.id);
      showToast('Coupon Created', `Code "${newCoupon.code}" is ready for use.`, 'success');
      return { success: true, data: newCoupon };
    }

    return (async () => {
      try {
        const res = await SupabaseDataService.createCoupon(couponData);
        if (res.error || !res.data) {
          showToast('Coupon Creation Failed', res.error || 'Failed to create coupon.', 'error');
          return { success: false, error: res.error || 'Failed to create coupon.' };
        }
        const newCoupon = res.data;
        setCoupons((prev) => [newCoupon, ...prev.filter((c) => c.id !== newCoupon.id)]);
        logAdminAction('CREATE_COUPON', 'COUPON', `Created coupon code ${newCoupon.code}`, newCoupon.id);
        showToast('Coupon Created', `Code "${newCoupon.code}" is ready for use.`, 'success');
        return { success: true, data: newCoupon };
      } catch (err: any) {
        showToast('Coupon Creation Error', err.message || 'Unable to create coupon.', 'error');
        return { success: false, error: err.message };
      }
    })();
  };

  const updateCoupon = (id: string, updates: Partial<Coupon>) => {
    if (!isSupabaseConfigured()) {
      setCoupons((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
      logAdminAction('UPDATE_COUPON', 'COUPON', `Updated coupon ${id}`, id);
      showToast('Coupon Updated', 'Discount coupon saved.', 'info');
      return { success: true };
    }

    return (async () => {
      try {
        const res = await SupabaseDataService.updateCoupon(id, updates);
        if (res.error) {
          showToast('Coupon Update Failed', res.error, 'error');
          return { success: false, error: res.error };
        }
        setCoupons((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
        );
        logAdminAction('UPDATE_COUPON', 'COUPON', `Updated coupon ${id}`, id);
        showToast('Coupon Updated', 'Discount coupon saved.', 'info');
        return { success: true };
      } catch (err: any) {
        showToast('Coupon Update Error', err.message || 'Unable to update coupon.', 'error');
        return { success: false, error: err.message };
      }
    })();
  };

  const deleteCoupon = (id: string) => {
    if (!isSupabaseConfigured()) {
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      logAdminAction('DELETE_COUPON', 'COUPON', `Deleted coupon ${id}`, id);
      showToast('Coupon Removed', 'Coupon deleted successfully.', 'info');
      return { success: true };
    }

    return (async () => {
      try {
        const res = await SupabaseDataService.deleteCoupon(id);
        if (res.error) {
          showToast('Coupon Deletion Failed', res.error, 'error');
          return { success: false, error: res.error };
        }
        setCoupons((prev) => prev.filter((c) => c.id !== id));
        logAdminAction('DELETE_COUPON', 'COUPON', `Deleted coupon ${id}`, id);
        showToast('Coupon Removed', 'Coupon deleted successfully.', 'info');
        return { success: true };
      } catch (err: any) {
        showToast('Coupon Deletion Error', err.message || 'Unable to delete coupon.', 'error');
        return { success: false, error: err.message };
      }
    })();
  };

  const toggleCouponActive = (id: string) => {
    const target = coupons.find((c) => c.id === id);
    if (!target) return;
    const newActive = !target.isActive;
    setCoupons((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: newActive } : c))
    );
    if (isSupabaseConfigured()) {
      SupabaseDataService.toggleCouponActive(id, newActive);
    }
  };

  // Pricing Rules (Quantity Tiers, BOGO)
  const addPricingRule = (ruleData: Omit<PricingRule, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      const newRule: PricingRule = {
        ...ruleData,
        id: `rule-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      setPricingRules((prev) => [newRule, ...prev]);
      logAdminAction('CREATE_PRICING_RULE', 'PRICING_RULE', `Created rule "${newRule.name}"`, newRule.id);
      showToast('Rule Created', `Pricing rule "${newRule.name}" active.`, 'success');
      return { success: true, data: newRule };
    }

    return (async () => {
      try {
        const res = await SupabaseDataService.createPricingRule(ruleData);
        if (res.error || !res.data) {
          showToast('Pricing Rule Failed', res.error || 'Failed to create pricing rule.', 'error');
          return { success: false, error: res.error || 'Failed to create pricing rule.' };
        }
        const newRule = res.data;
        setPricingRules((prev) => [newRule, ...prev.filter((r) => r.id !== newRule.id)]);
        logAdminAction('CREATE_PRICING_RULE', 'PRICING_RULE', `Created rule "${newRule.name}"`, newRule.id);
        showToast('Rule Created', `Pricing rule "${newRule.name}" active.`, 'success');
        return { success: true, data: newRule };
      } catch (err: any) {
        showToast('Pricing Rule Error', err.message || 'Unable to create pricing rule.', 'error');
        return { success: false, error: err.message };
      }
    })();
  };

  const updatePricingRule = (id: string, updates: Partial<PricingRule>) => {
    if (!isSupabaseConfigured()) {
      setPricingRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
      );
      logAdminAction('UPDATE_PRICING_RULE', 'PRICING_RULE', `Updated rule ${id}`, id);
      showToast('Rule Saved', 'Pricing rule updated.', 'info');
      return { success: true };
    }

    return (async () => {
      try {
        const res = await SupabaseDataService.updatePricingRule(id, updates);
        if (res.error) {
          showToast('Pricing Rule Update Failed', res.error, 'error');
          return { success: false, error: res.error };
        }
        setPricingRules((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
        );
        logAdminAction('UPDATE_PRICING_RULE', 'PRICING_RULE', `Updated rule ${id}`, id);
        showToast('Rule Saved', 'Pricing rule updated.', 'info');
        return { success: true };
      } catch (err: any) {
        showToast('Pricing Rule Error', err.message || 'Unable to update pricing rule.', 'error');
        return { success: false, error: err.message };
      }
    })();
  };

  const deletePricingRule = (id: string) => {
    if (!isSupabaseConfigured()) {
      setPricingRules((prev) => prev.filter((r) => r.id !== id));
      logAdminAction('DELETE_PRICING_RULE', 'PRICING_RULE', `Deleted rule ${id}`, id);
      showToast('Rule Removed', 'Pricing rule deleted.', 'info');
      return { success: true };
    }

    return (async () => {
      try {
        const res = await SupabaseDataService.deletePricingRule(id);
        if (res.error) {
          showToast('Delete Rule Failed', res.error, 'error');
          return { success: false, error: res.error };
        }
        setPricingRules((prev) => prev.filter((r) => r.id !== id));
        logAdminAction('DELETE_PRICING_RULE', 'PRICING_RULE', `Deleted rule ${id}`, id);
        showToast('Rule Removed', 'Pricing rule deleted.', 'info');
        return { success: true };
      } catch (err: any) {
        showToast('Delete Rule Error', err.message || 'Unable to delete pricing rule.', 'error');
        return { success: false, error: err.message };
      }
    })();
  };

  const togglePricingRuleActive = (id: string) => {
    const target = pricingRules.find((r) => r.id === id);
    if (!target) return;
    const newActive = !target.isActive;
    updatePricingRule(id, { isActive: newActive });
  };

  // 7. Combos Management
  const addCombo = (comboData: Omit<ComboBundle, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured()) {
      const newCombo: ComboBundle = {
        ...comboData,
        id: `combo-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      setCombos((prev) => [newCombo, ...prev]);
      logAdminAction('CREATE_COMBO', 'COMBO', `Created combo pack "${newCombo.name}"`, newCombo.id);
      showToast('Combo Created', `Pack "${newCombo.name}" added to combos.`, 'success');
      return { success: true, data: newCombo };
    }

    return (async () => {
      try {
        const res = await SupabaseDataService.createCombo(comboData);
        if (res.error || !res.data) {
          showToast('Combo Creation Failed', res.error || 'Failed to create combo bundle.', 'error');
          return { success: false, error: res.error || 'Failed to create combo bundle.' };
        }
        const newCombo = res.data;
        setCombos((prev) => [newCombo, ...prev.filter((cb) => cb.id !== newCombo.id)]);
        logAdminAction('CREATE_COMBO', 'COMBO', `Created combo pack "${newCombo.name}"`, newCombo.id);
        showToast('Combo Created', `Pack "${newCombo.name}" added to combos.`, 'success');
        return { success: true, data: newCombo };
      } catch (err: any) {
        showToast('Combo Creation Error', err.message || 'Unable to create combo.', 'error');
        return { success: false, error: err.message };
      }
    })();
  };

  const updateCombo = (id: string, updates: Partial<ComboBundle>) => {
    if (!isSupabaseConfigured()) {
      setCombos((prev) =>
        prev.map((cb) => (cb.id === id ? { ...cb, ...updates } : cb))
      );
      logAdminAction('UPDATE_COMBO', 'COMBO', `Updated combo pack ${id}`, id);
      showToast('Combo Updated', 'Combo details saved.', 'info');
      return { success: true };
    }

    return (async () => {
      try {
        const res = await SupabaseDataService.updateCombo(id, updates);
        if (res.error) {
          showToast('Combo Update Failed', res.error, 'error');
          return { success: false, error: res.error };
        }
        setCombos((prev) =>
          prev.map((cb) => (cb.id === id ? { ...cb, ...updates } : cb))
        );
        logAdminAction('UPDATE_COMBO', 'COMBO', `Updated combo pack ${id}`, id);
        showToast('Combo Updated', 'Combo details saved.', 'info');
        return { success: true };
      } catch (err: any) {
        showToast('Combo Update Error', err.message || 'Unable to update combo.', 'error');
        return { success: false, error: err.message };
      }
    })();
  };

  const deleteCombo = (id: string) => {
    if (!isSupabaseConfigured()) {
      setCombos((prev) => prev.filter((cb) => cb.id !== id));
      logAdminAction('DELETE_COMBO', 'COMBO', `Deleted combo pack ${id}`, id);
      showToast('Combo Removed', 'Combo bundle deleted.', 'info');
      return { success: true };
    }

    return (async () => {
      try {
        const res = await SupabaseDataService.deleteCombo(id);
        if (res.error) {
          showToast('Combo Deletion Failed', res.error, 'error');
          return { success: false, error: res.error };
        }
        setCombos((prev) => prev.filter((cb) => cb.id !== id));
        logAdminAction('DELETE_COMBO', 'COMBO', `Deleted combo pack ${id}`, id);
        showToast('Combo Removed', 'Combo bundle deleted.', 'info');
        return { success: true };
      } catch (err: any) {
        showToast('Combo Deletion Error', err.message || 'Unable to delete combo.', 'error');
        return { success: false, error: err.message };
      }
    })();
  };

  const toggleComboActive = (id: string) => {
    const target = combos.find((cb) => cb.id === id);
    if (!target) return;
    const newActive = !target.isActive;
    updateCombo(id, { isActive: newActive });
  };

  // 8. Homepage CMS Banners & Sections
  const addBanner = async (bannerData: Omit<HomepageBanner, 'id'>): Promise<{ success: boolean; data?: HomepageBanner; error?: string }> => {
    if (isSupabaseConfigured()) {
      const res = await SupabaseDataService.saveBanner(bannerData);
      if (res.error || !res.data) {
        logAdminAction('CREATE_BANNER_FAILED', 'HOMEPAGE_CMS', `Failed to create banner: ${res.error}`);
        return { success: false, error: res.error || 'Failed to persist banner to database' };
      }
      const savedBanner = res.data;
      setBanners((prev) => {
        const next = [...prev, savedBanner].sort((a, b) => a.displayOrder - b.displayOrder);
        return next;
      });
      logAdminAction('CREATE_BANNER', 'HOMEPAGE_CMS', `Created banner "${savedBanner.title}"`, savedBanner.id);
      return { success: true, data: savedBanner };
    } else {
      const newBanner: HomepageBanner = {
        ...bannerData,
        id: `ban-${Date.now()}`
      };
      setBanners((prev) => [...prev, newBanner].sort((a, b) => a.displayOrder - b.displayOrder));
      logAdminAction('CREATE_BANNER', 'HOMEPAGE_CMS', `Created banner "${newBanner.title}"`, newBanner.id);
      return { success: true, data: newBanner };
    }
  };

  const updateBanner = async (id: string, updates: Partial<HomepageBanner>): Promise<{ success: boolean; data?: HomepageBanner; error?: string }> => {
    const current = banners.find((b) => b.id === id);
    if (!current) {
      return { success: false, error: 'Banner not found' };
    }
    const updatedPayload: HomepageBanner = { ...current, ...updates };

    if (isSupabaseConfigured()) {
      const res = await SupabaseDataService.saveBanner(updatedPayload);
      if (res.error || !res.data) {
        logAdminAction('UPDATE_BANNER_FAILED', 'HOMEPAGE_CMS', `Failed to update banner ${id}: ${res.error}`, id);
        return { success: false, error: res.error || 'Failed to update banner in database' };
      }
      const saved = res.data;
      setBanners((prev) => prev.map((b) => (b.id === id ? saved : b)).sort((a, b) => a.displayOrder - b.displayOrder));
      logAdminAction('UPDATE_BANNER', 'HOMEPAGE_CMS', `Updated banner ${id}`, id);
      return { success: true, data: saved };
    } else {
      setBanners((prev) => prev.map((b) => (b.id === id ? updatedPayload : b)).sort((a, b) => a.displayOrder - b.displayOrder));
      logAdminAction('UPDATE_BANNER', 'HOMEPAGE_CMS', `Updated banner ${id}`, id);
      return { success: true, data: updatedPayload };
    }
  };

  const deleteBanner = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured()) {
      const res = await SupabaseDataService.deleteBanner(id);
      if (res.error) {
        logAdminAction('DELETE_BANNER_FAILED', 'HOMEPAGE_CMS', `Failed to delete banner ${id}: ${res.error}`, id);
        return { success: false, error: res.error };
      }
    }

    const nextDeleted = Array.from(new Set([...deletedBannerIds, id]));
    setDeletedBannerIds(nextDeleted);
    try {
      localStorage.setItem('zada_admin_deleted_banner_ids', JSON.stringify(nextDeleted));
    } catch {}

    setBanners((prev) => prev.filter((b) => b.id !== id));
    logAdminAction('DELETE_BANNER', 'HOMEPAGE_CMS', `Deleted banner ${id}`, id);
    return { success: true };
  };

  const reorderBanners = async (bannerId: string, direction: 'UP' | 'DOWN'): Promise<{ success: boolean; error?: string }> => {
    const currentBanner = banners.find((b) => b.id === bannerId);
    if (!currentBanner) return { success: false, error: 'Banner not found' };

    const targetDevice = currentBanner.deviceTarget || 'desktop';
    const deviceBanners = banners
      .filter((b) => (b.deviceTarget || 'desktop') === targetDevice)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const index = deviceBanners.findIndex((b) => b.id === bannerId);
    if (index === -1) return { success: false, error: 'Banner not found' };

    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= deviceBanners.length) return { success: true };

    const targetBanner = deviceBanners[targetIdx];

    const newOrderCurrent = targetBanner.displayOrder;
    const newOrderTarget = currentBanner.displayOrder;

    const res1 = await updateBanner(currentBanner.id, { displayOrder: newOrderCurrent });
    if (!res1.success) return res1;

    const res2 = await updateBanner(targetBanner.id, { displayOrder: newOrderTarget });
    if (!res2.success) return res2;

    return { success: true };
  };

  const toggleBannerActive = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const banner = banners.find((b) => b.id === id);
    if (!banner) return { success: false, error: 'Banner not found' };
    return updateBanner(id, { isActive: !banner.isActive });
  };

  const purgeSeedBanners = async (): Promise<void> => {
    // Explicit admin action to purge initial seed banners from both state and storage
    const seedIds = ['a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'ban-1', 'ban-2'];
    const nextDeleted = Array.from(new Set([...deletedBannerIds, ...seedIds]));
    setDeletedBannerIds(nextDeleted);
    try {
      localStorage.setItem('zada_admin_deleted_banner_ids', JSON.stringify(nextDeleted));
    } catch {}

    setBanners((prev) => prev.filter((b) => !seedIds.includes(b.id)));
    if (isSupabaseConfigured()) {
      for (const id of seedIds) {
        await SupabaseDataService.deleteBanner(id);
      }
    }
    logAdminAction('PURGE_SEED_BANNERS', 'HOMEPAGE_CMS', 'Purged default demo seed banners');
    showToast('Clean Slate Enabled', 'Unwanted demo/seed banners permanently purged.', 'success');
  };

  const updateHandpickedSection = async (
    config: HandpickedSectionConfig
  ): Promise<{ success: boolean; error?: string }> => {
    setHandpickedSection(config);
    try {
      localStorage.setItem('zada_admin_handpicked_section', JSON.stringify(config));
    } catch {}
    if (isSupabaseConfigured()) {
      const res = await SupabaseDataService.saveHandpickedSection(config);
      if (res.error) {
        showToast('Sync Warning', 'Saved locally, but remote sync error: ' + res.error, 'warning');
        return { success: false, error: res.error };
      }
    }
    logAdminAction('UPDATE_HANDPICKED', 'CMS', 'Updated Handpicked for You section');
    showToast('Handpicked Section Updated', 'Catalog selections are now live.', 'success');
    return { success: true };
  };

  const updateBestsellerSection = async (
    config: BestsellerSectionConfig
  ): Promise<{ success: boolean; error?: string }> => {
    setBestsellerSection(config);
    try {
      localStorage.setItem('zada_admin_bestseller_section', JSON.stringify(config));
    } catch {}
    if (isSupabaseConfigured() && typeof SupabaseDataService.saveBestsellerSection === 'function') {
      const res = await SupabaseDataService.saveBestsellerSection(config);
      if (res.error) {
        showToast('Sync Warning', 'Saved locally, remote notice: ' + res.error, 'warning');
        return { success: false, error: res.error };
      }
    }
    logAdminAction('UPDATE_BESTSELLERS', 'CMS', 'Updated Bestsellers collection');
    showToast('Bestsellers Updated', 'Bestseller collection selections are now live.', 'success');
    return { success: true };
  };

  const updateCorporateGiftingSection = async (
    config: CorporateGiftingSectionConfig
  ): Promise<{ success: boolean; error?: string }> => {
    setCorporateGiftingSection(config);
    try {
      localStorage.setItem('zada_admin_corporate_section', JSON.stringify(config));
    } catch {}
    if (isSupabaseConfigured() && typeof SupabaseDataService.saveCorporateGiftingSection === 'function') {
      const res = await SupabaseDataService.saveCorporateGiftingSection(config);
      if (res.error) {
        showToast('Sync Warning', 'Saved locally, remote notice: ' + res.error, 'warning');
        return { success: false, error: res.error };
      }
    }
    logAdminAction('UPDATE_CORPORATE_BANNER', 'CMS', 'Updated Corporate Gifting banner section');
    showToast('Corporate Section Updated', 'Corporate gifting promotional content saved.', 'success');
    return { success: true };
  };

  const updateHeritageStorySection = async (
    config: HeritageStorySectionConfig
  ): Promise<{ success: boolean; error?: string }> => {
    setHeritageStorySection(config);
    try {
      localStorage.setItem('zada_admin_heritage_story_section', JSON.stringify(config));
    } catch {}
    if (isSupabaseConfigured() && typeof SupabaseDataService.saveHeritageStorySection === 'function') {
      const res = await SupabaseDataService.saveHeritageStorySection(config);
      if (res.error) {
        showToast('Sync Warning', 'Saved locally, remote notice: ' + res.error, 'warning');
        return { success: false, error: res.error };
      }
    }
    logAdminAction('UPDATE_HERITAGE_BANNER', 'CMS', 'Updated Heritage / Story Banner section');
    showToast('Heritage Banner Updated', 'Heritage banner configuration saved.', 'success');
    return { success: true };
  };


  const updateFeaturedCombosSection = async (
    config: FeaturedCombosSectionConfig
  ): Promise<{ success: boolean; error?: string }> => {
    setFeaturedCombosSection(config);
    try {
      localStorage.setItem('zada_admin_featured_combos_section', JSON.stringify(config));
    } catch {}
    if (isSupabaseConfigured() && typeof SupabaseDataService.saveFeaturedCombosSection === 'function') {
      const res = await SupabaseDataService.saveFeaturedCombosSection(config);
      if (res.error) {
        showToast('Sync Warning', 'Saved locally, remote notice: ' + res.error, 'warning');
        return { success: false, error: res.error };
      }
    }
    logAdminAction('UPDATE_FEATURED_COMBOS_SECTION', 'CMS', `Updated Featured Combos visibility: ${config.isVisible ? 'ENABLED' : 'DISABLED'}`);
    showToast('Combos Merchandising Saved', `Homepage Combos section is now ${config.isVisible ? 'Active' : 'Hidden'}.`, 'success');



    return { success: true };
  };

  const updateHomepageSections = (sections: HomepageSection[]) => {
    setHomepageSections(sections);
    logAdminAction('REORDER_SECTIONS', 'HOMEPAGE_CMS', 'Homepage layout sections updated');
    showToast('Layout Saved', 'Homepage section ordering updated.', 'success');
  };

  // Category Banners CMS Handlers
  const addCategoryBanner = (bannerData: Omit<CategoryBanner, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newBanner: CategoryBanner = {
      ...bannerData,
      id: `cat-ban-${Date.now()}`,
      imageUrl: bannerData.imageUrl || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setCategoryBanners((prev) => [...prev, newBanner]);
    if (isSupabaseConfigured()) {
      SupabaseDataService.saveCategoryBanner(newBanner).then((res) => {
        if (res.data) {
          setCategoryBanners((prev) =>
            prev.map((b) => (b.id === newBanner.id ? res.data! : b))
          );
        }
      });
    }
    logAdminAction('CREATE_CATEGORY_BANNER', 'CATEGORY_CMS', `Created category banner "${newBanner.title}" for ${newBanner.categorySlug}`, newBanner.id);
    showToast('Category Banner Added', `Banner for ${newBanner.categorySlug} created.`, 'success');
  };

  const updateCategoryBanner = (id: string, updates: Partial<CategoryBanner>) => {
    setCategoryBanners((prev) => {
      const updated = prev.map((b) => (b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b));
      const target = updated.find((b) => b.id === id);
      if (target && isSupabaseConfigured()) {
        SupabaseDataService.saveCategoryBanner(target);
      }
      return updated;
    });
    logAdminAction('UPDATE_CATEGORY_BANNER', 'CATEGORY_CMS', `Updated category banner ${id}`, id);
    showToast('Category Banner Saved', 'Category banner updated successfully.', 'info');
  };

  const deleteCategoryBanner = async (id: string): Promise<boolean> => {
    const nextDeleted = Array.from(new Set([...deletedCategoryBannerIds, id]));
    setDeletedCategoryBannerIds(nextDeleted);
    try {
      localStorage.setItem('zada_admin_deleted_category_banner_ids', JSON.stringify(nextDeleted));
    } catch {}

    setCategoryBanners((prev) => prev.filter((b) => b.id !== id));
    if (isSupabaseConfigured()) {
      await SupabaseDataService.deleteCategoryBanner(id);
    }
    logAdminAction('DELETE_CATEGORY_BANNER', 'CATEGORY_CMS', `Deleted category banner ${id}`, id);
    showToast('Category Banner Removed', 'Banner deleted.', 'info');
    return true;
  };

  const toggleCategoryBannerActive = (id: string) => {
    setCategoryBanners((prev) => {
      const updated = prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive, updatedAt: new Date().toISOString() } : b));
      const target = updated.find((b) => b.id === id);
      if (target && isSupabaseConfigured()) {
        SupabaseDataService.saveCategoryBanner(target);
      }
      return updated;
    });
  };

  const resetCategoryBannerDefaults = (slug: string) => {
    const defaultBanner = INITIAL_CATEGORY_BANNERS.find((b) => b.categorySlug === slug);
    if (!defaultBanner) return;

    setCategoryBanners((prev) => {
      const existing = prev.find((b) => b.categorySlug === slug);
      if (existing) {
        const resetItem: CategoryBanner = {
          ...defaultBanner,
          id: existing.id,
          updatedAt: new Date().toISOString()
        };
        const next = prev.map((b) => (b.categorySlug === slug ? resetItem : b));
        if (isSupabaseConfigured()) {
          SupabaseDataService.saveCategoryBanner(resetItem);
        }
        return next;
      } else {
        const next = [...prev, { ...defaultBanner, id: `cat-ban-${Date.now()}` }];
        return next;
      }
    });
    logAdminAction('RESET_CATEGORY_BANNER', 'CATEGORY_CMS', `Reset banner defaults for ${slug}`);
    showToast('Defaults Restored', `Restored default styling for ${slug}.`, 'success');
  };

  // 9. Reviews Moderation
  const toggleReviewFeatured = (reviewId: string) => {
    const target = reviews.find((r) => r.id === reviewId);
    if (!target) return;
    const newFeatured = !target.isFeaturedOnPdp;
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, isFeaturedOnPdp: newFeatured } : r))
    );
    logAdminAction('TOGGLE_REVIEW_FEATURED', 'REVIEW', `Toggled featured status for review ${reviewId}`, reviewId);
    showToast('Review Pin Updated', 'Featured status updated on PDP and Homepage.', 'info');
    if (isSupabaseConfigured() && isUUID(reviewId)) {
      SupabaseDataService.toggleReviewFeatured(reviewId, newFeatured).catch(() => {});
    }
  };

  const updateReviewApproval = (reviewId: string, approved: boolean) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, isApproved: approved } : r))
    );
    logAdminAction(
      'MODERATE_REVIEW',
      'REVIEW',
      `Review ${reviewId} approval set to ${approved}`,
      reviewId
    );
    showToast('Review Moderated', approved ? 'Review approved for public display.' : 'Review rejected.', 'info');
    if (isSupabaseConfigured() && isUUID(reviewId)) {
      SupabaseDataService.updateReviewApproval(reviewId, approved).catch(() => {});
    }
  };

  const deleteReview = (reviewId: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    logAdminAction('DELETE_REVIEW', 'REVIEW', `Deleted review ${reviewId}`, reviewId);
    showToast('Review Deleted', 'Customer review removed.', 'info');
    if (isSupabaseConfigured() && isUUID(reviewId)) {
      SupabaseDataService.deleteReview(reviewId).catch(() => {});
    }
  };

  const addReview = (review: Omit<Review, 'id' | 'createdAt' | 'isApproved' | 'isFeaturedOnPdp'> & { isApproved?: boolean }) => {
    const approvedFlag = review.isApproved !== undefined ? review.isApproved : true;
    if (!isSupabaseConfigured()) {
      const newRev: Review = {
        ...review,
        id: `rev-${Date.now()}`,
        isApproved: approvedFlag,
        isFeaturedOnPdp: false,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setReviews((prev) => [newRev, ...prev]);
      showToast('Review Submitted', 'Thank you! Your review is now visible.', 'success');
      return;
    }

    return (async () => {
      try {
        const res = await SupabaseDataService.createReview({ ...review, isApproved: approvedFlag });
        const newRev: Review = res.data || {
          ...review,
          id: `rev-${Date.now()}`,
          isApproved: approvedFlag,
          isFeaturedOnPdp: false,
          createdAt: new Date().toISOString().split('T')[0]
        };
        setReviews((prev) => [newRev, ...prev]);
        showToast('Review Submitted', 'Thank you! Your review is now visible.', 'success');
      } catch {
        showToast('Review Failed', 'Could not save review.', 'error');
      }
    })();
  };

  const updateReview = (reviewId: string, updates: Partial<Review>) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, ...updates } : r))
    );
    logAdminAction('UPDATE_REVIEW', 'REVIEW', `Updated review ${reviewId}`, reviewId);
    showToast('Review Updated', 'Review details updated successfully.', 'success');
    if (isSupabaseConfigured() && isUUID(reviewId)) {
      SupabaseDataService.updateReview(reviewId, updates).catch(() => {});
    }
  };

  // 10. Bulk Enquiries
  const updateEnquiryStatus = (enquiryId: string, status: BulkEnquiry['status']) => {
    setEnquiries((prev) =>
      prev.map((e) => (e.id === enquiryId ? { ...e, status } : e))
    );
    logAdminAction('UPDATE_ENQUIRY_STATUS', 'BULK_ENQUIRY', `Enquiry ${enquiryId} status set to ${status}`, enquiryId);
    showToast('Enquiry Updated', `Status changed to ${status}.`, 'info');
    if (isSupabaseConfigured()) {
      SupabaseDataService.updateEnquiryStatus(enquiryId, status);
    }
  };

  const updateEnquiryNotes = (enquiryId: string, notes: string) => {
    setEnquiries((prev) =>
      prev.map((e) => (e.id === enquiryId ? { ...e, adminNotes: notes } : e))
    );
    logAdminAction('UPDATE_ENQUIRY_NOTES', 'BULK_ENQUIRY', `Internal notes updated for ${enquiryId}`, enquiryId);
    showToast('Notes Saved', 'Follow-up notes updated.', 'info');
    if (isSupabaseConfigured()) {
      SupabaseDataService.updateEnquiryNotes(enquiryId, notes);
    }
  };

  const submitBulkEnquiry = (enquiry: Omit<BulkEnquiry, 'id' | 'createdAt' | 'status'>) => {
    const newEntry: BulkEnquiry = {
      ...enquiry,
      id: `enq-${Date.now()}`,
      status: 'NEW',
      createdAt: new Date().toISOString()
    };
    setEnquiries((prev) => [newEntry, ...prev]);
    showToast('Enquiry Submitted', 'Our corporate team will contact you within 24 hours.', 'success');
    if (isSupabaseConfigured()) {
      SupabaseDataService.submitBulkEnquiry(enquiry);
    }
  };

  // 11. Settings & Content
  const updateStoreSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    logAdminAction('UPDATE_STORE_SETTINGS', 'STORE_SETTINGS', 'Store operational settings updated');
    showToast('Store Settings Saved', 'Configuration updated successfully.', 'success');
    if (isSupabaseConfigured()) {
      SupabaseDataService.saveStoreSettings(newSettings);
    }
  };

  const updateStoreContent = (slug: string, content: string, title?: string) => {
    const updatedDate = new Date().toISOString().split('T')[0];
    let updatedPages: StoreContentPage[] = [];
    setStoreContent((prev) => {
      const exists = prev.some((p) => p.slug === slug);
      if (exists) {
        updatedPages = prev.map((p) =>
          p.slug === slug
            ? {
                ...p,
                content,
                title: title || p.title,
                lastUpdated: updatedDate
              }
            : p
        );
      } else {
        updatedPages = [
          ...prev,
          {
            slug,
            title: title || slug,
            content,
            lastUpdated: updatedDate
          }
        ];
      }
      return updatedPages;
    });

    logAdminAction('UPDATE_STORE_CONTENT', 'CONTENT_PAGE', `Updated content for ${slug}`);
    showToast('Content Saved', `Page "${slug}" published with latest updates.`, 'success');

    if (isSupabaseConfigured()) {
      SupabaseDataService.saveStoreContent(updatedPages);
    } else {
      try {
        localStorage.setItem('zada_admin_store_content', JSON.stringify(updatedPages));
      } catch {}
    }
  };

  // 12. Admin Management Operations
  const createAdminAccount = async (adminData: {
    fullName: string;
    email: string;
    password?: string;
    permissions: AdminPermission[];
  }): Promise<{ success: boolean; data?: AdminAccount; error?: string }> => {
    const emailNorm = adminData.email.trim().toLowerCase();
    if (!emailNorm || !adminData.fullName.trim()) {
      return { success: false, error: 'Full name and email address are required.' };
    }

    if (admins.some((a) => a.email.toLowerCase() === emailNorm)) {
      return { success: false, error: 'An administrator with this email already exists.' };
    }

    if (!adminData.password || adminData.password.length < 8) {
      showToast('Validation Error', 'Password must be at least 8 characters long.', 'error');
      return { success: false, error: 'Password must be at least 8 characters long.' };
    }

    let authUserId = `usr-admin-${Date.now()}`;

    // Genuine Supabase Auth Account Creation
    if (isSupabaseConfigured()) {
      try {
        let edgeCreated = false;
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          try {
            const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://ykzgqaepayuqatgbvsoq.supabase.co'}/functions/v1/manage-admins`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({
                action: 'CREATE_ADMIN',
                email: emailNorm,
                fullName: adminData.fullName.trim(),
                password: adminData.password,
                permissions: adminData.permissions
              })
            });
            if (res.ok) {
              const result = await res.json();
              if (result.admin?.id) {
                authUserId = result.admin.id;
                edgeCreated = true;
              }
            }
          } catch {
            // Edge Function not deployed or unreachable; fallback to direct Auth API
          }
        }

        // Direct Supabase Auth identity creation using an unpersisted client
        // This ensures the current Super Admin session is never modified or logged out
        if (!edgeCreated) {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ykzgqaepayuqatgbvsoq.supabase.co';
          const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

          if (supabaseAnonKey) {
            const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
              auth: { persistSession: false, autoRefreshToken: false }
            });

            const { data: authData, error: authError } = await tempClient.auth.signUp({
              email: emailNorm,
              password: adminData.password,
              options: {
                data: {
                  full_name: adminData.fullName.trim(),
                  role: 'admin',
                  permissions: adminData.permissions
                }
              }
            });

            if (authError) {
              showToast('Admin Creation Failed', authError.message, 'error');
              return { success: false, error: authError.message };
            }

            if (authData.user?.id) {
              authUserId = authData.user.id;
              try {
                await supabase.from('profiles').upsert({
                  id: authUserId,
                  email: emailNorm,
                  full_name: adminData.fullName.trim(),
                  role: 'admin'
                });
                await supabase.from('admin_roles').upsert({
                  user_id: authUserId,
                  role: 'admin'
                });
                await supabase.from('admin_accounts').upsert({
                  id: authUserId,
                  email: emailNorm,
                  full_name: adminData.fullName.trim(),
                  role: 'admin',
                  status: 'active',
                  is_active: true
                });
                if (adminData.permissions && adminData.permissions.length > 0) {
                  await supabase.from('admin_permissions').delete().eq('user_id', authUserId);
                  const permRows = adminData.permissions.map((p) => ({
                    user_id: authUserId,
                    permission: p
                  }));
                  await supabase.from('admin_permissions').insert(permRows);
                }
              } catch (dbErr) {
                console.warn('[AdminDataContext] Admin remote table provisioning notice:', dbErr);
              }
              authUserId = authData.user.id;
            }
          }
        }
      } catch (e: any) {
        showToast('Admin Creation Error', e.message, 'error');
        return { success: false, error: e.message };
      }
    }

    const newAdmin: AdminAccount = {
      id: authUserId,
      email: emailNorm,
      fullName: adminData.fullName.trim(),
      role: 'admin',
      status: 'active',
      permissions: adminData.permissions,
      createdAt: new Date().toISOString()
    };

    setAdmins((prev) => {
      const updated = [...prev, newAdmin];
      try {
        localStorage.setItem('zada_admin_accounts_list', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    logAdminAction('CREATE_ADMIN_ACCOUNT', 'ADMIN_ACCOUNT', `Created admin ${newAdmin.fullName} (${newAdmin.email}) with ${newAdmin.permissions.length} permissions`, newAdmin.id);
    showToast('Admin Account Created', `Administrator "${newAdmin.fullName}" has been configured successfully.`, 'success');
    return { success: true, data: newAdmin };
  };

  const updateAdminPermissions = async (
    adminId: string,
    permissions: AdminPermission[]
  ): Promise<{ success: boolean; error?: string }> => {
    const target = admins.find((a) => a.id === adminId);
    if (!target) {
      return { success: false, error: 'Administrator account not found.' };
    }

    if (isSuperAdminEmail(target.email) || target.role === 'superadmin') {
      return { success: false, error: 'Super Administrator permissions cannot be modified.' };
    }

    // Attempt remote Edge Function update
    if (isSupabaseConfigured()) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://ykzgqaepayuqatgbvsoq.supabase.co'}/functions/v1/manage-admins`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              action: 'UPDATE_PERMISSIONS',
              targetUserId: adminId,
              permissions
            })
          });
        }
        if (isUUID(adminId)) {
          try {
            await supabase.from('admin_permissions').delete().eq('user_id', adminId);
            if (permissions.length > 0) {
              const permRows = permissions.map(p => ({ user_id: adminId, permission: p }));
              await supabase.from('admin_permissions').insert(permRows);
            }
          } catch {}
        }
      } catch (e: any) {
        console.warn('[AdminDataContext] Edge function permission update notice:', e.message);
      }
    }

    setAdmins((prev) =>
      prev.map((a) => (a.id === adminId ? { ...a, permissions } : a))
    );

    logAdminAction('UPDATE_ADMIN_PERMISSIONS', 'ADMIN_PERMISSIONS', `Updated permissions for ${target.fullName} (${permissions.length} active permissions)`, adminId);
    showToast('Permissions Updated', `Assigned ${permissions.length} permissions to "${target.fullName}".`, 'success');
    return { success: true };
  };

  const toggleAdminSuspension = async (
    adminId: string,
    reason?: string
  ): Promise<{ success: boolean; status?: 'active' | 'suspended'; error?: string }> => {
    const target = admins.find((a) => a.id === adminId);
    if (!target) {
      return { success: false, error: 'Administrator account not found.' };
    }

    if (isSuperAdminEmail(target.email) || target.role === 'superadmin') {
      return { success: false, error: 'The Super Administrator account cannot be suspended or demoted.' };
    }

    const nextStatus: 'active' | 'suspended' = target.status === 'suspended' ? 'active' : 'suspended';

    // Remote Edge function attempt
    if (isSupabaseConfigured()) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://ykzgqaepayuqatgbvsoq.supabase.co'}/functions/v1/manage-admins`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              action: 'TOGGLE_SUSPEND',
              targetUserId: adminId,
              reason
            })
          });
        }

        if (isUUID(adminId)) {
          await supabase.from('admin_accounts').update({
            status: nextStatus
          }).eq('id', adminId);
        }
      } catch (e: any) {
        console.warn('[AdminDataContext] Edge function suspension notice:', e.message);
      }
    }

    setAdmins((prev) =>
      prev.map((a) =>
        a.id === adminId
          ? {
              ...a,
              status: nextStatus,
              suspendedAt: nextStatus === 'suspended' ? new Date().toISOString() : undefined,
              suspendedReason: nextStatus === 'suspended' ? (reason || 'Administrative suspension') : undefined
            }
          : a
      )
    );

    logAdminAction(
      nextStatus === 'suspended' ? 'SUSPEND_ADMIN' : 'REACTIVATE_ADMIN',
      'ADMIN_ACCOUNT',
      `${nextStatus === 'suspended' ? 'Suspended' : 'Reactivated'} admin ${target.fullName} (${target.email})${reason ? ': ' + reason : ''}`,
      adminId
    );

    showToast(
      nextStatus === 'suspended' ? 'Admin Suspended' : 'Admin Reactivated',
      `Administrator "${target.fullName}" is now ${nextStatus.toUpperCase()}.`,
      nextStatus === 'suspended' ? 'warning' : 'success'
    );

    return { success: true, status: nextStatus };
  };

  const removeAdminAccount = async (
    adminId: string
  ): Promise<{ success: boolean; error?: string }> => {
    const target = admins.find((a) => a.id === adminId);
    if (!target) {
      return { success: false, error: 'Administrator account not found.' };
    }

    if (isSuperAdminEmail(target.email) || target.role === 'superadmin') {
      return { success: false, error: 'The Super Administrator account cannot be removed or deleted.' };
    }

    // Remote Edge Function removal if Supabase is configured
    if (isSupabaseConfigured()) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://ykzgqaepayuqatgbvsoq.supabase.co'}/functions/v1/manage-admins`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              action: 'DELETE_ADMIN',
              targetUserId: adminId
            })
          });
        }
        if (isUUID(adminId)) {
          try {
            await supabase.from('admin_permissions').delete().eq('user_id', adminId);
            await supabase.from('admin_roles').delete().eq('user_id', adminId);
            await supabase.from('admin_accounts').delete().eq('id', adminId);
          } catch {}
        }
      } catch (e: any) {
        console.warn('[AdminDataContext] Edge function admin removal notice:', e.message);
      }
    }

    setAdmins((prev) => {
      const updated = prev.filter((a) => a.id !== adminId);
      try {
        localStorage.setItem('zada_admin_accounts_list', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    logAdminAction(
      'REMOVE_ADMIN_ACCOUNT',
      'ADMIN_ACCOUNT',
      `Permanently removed administrator account ${target.fullName} (${target.email})`,
      adminId
    );

    showToast(
      'Admin Account Removed',
      `Administrator "${target.fullName}" (${target.email}) has been removed.`,
      'info'
    );

    return { success: true };
  };

  return (
    <AdminDataContext.Provider
      value={{
        categories: syncedCategories,
        deletedCategoryIds,
        subcategories,
        products,
        deletedProductIds,
        addCategory,
        updateCategory,
        deleteCategory,
        addSubcategory,
        updateSubcategory,
        deleteSubcategory,
        toggleSubcategoryActive,
        reorderSubcategories,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductPublish,
        stockMovements,
        updateProductStock,
        adjustVariantStock,
        orders,
        updateOrderStatus,
        updatePaymentStatus,
        createOrder,
        customers,
        coupons,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        toggleCouponActive,
        pricingRules,
        addPricingRule,
        updatePricingRule,
        deletePricingRule,
        togglePricingRuleActive,
        combos,
        addCombo,
        updateCombo,
        deleteCombo,
        toggleComboActive,
        banners,
        deletedBannerIds,
        addBanner,
        updateBanner,
        deleteBanner,
        toggleBannerActive,
        reorderBanners,
        purgeSeedBanners,
        homepageSections,
        updateHomepageSections,
        handpickedSection,
        updateHandpickedSection,
        bestsellerSection,
        updateBestsellerSection,
        corporateGiftingSection,
        updateCorporateGiftingSection,
        heritageStorySection,
        updateHeritageStorySection,
        featuredCombosSection,
        updateFeaturedCombosSection,
        categoryBanners,
        addCategoryBanner,
        updateCategoryBanner,
        deleteCategoryBanner,
        toggleCategoryBannerActive,
        resetCategoryBannerDefaults,
        reviews,
        toggleReviewFeatured,
        updateReviewApproval,
        deleteReview,
        addReview,
        updateReview,
        enquiries,
        updateEnquiryStatus,
        updateEnquiryNotes,
        submitBulkEnquiry,
        settings,
        updateStoreSettings,
        storeContent,
        updateStoreContent,
        auditLogs,
        logAdminAction,
        admins,
        createAdminAccount,
        updateAdminPermissions,
        toggleAdminSuspension,
        removeAdminAccount
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
};

export const useAdminData = () => {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData must be used within an AdminDataProvider');
  }
  return context;
};

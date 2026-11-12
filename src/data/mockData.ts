import {
  Category,
  Subcategory,
  Product,
  Order,
  Coupon,
  Review,
  Address,
  StoreSettings,
  ComboBundle,
  HomepageBanner,
  HomepageSection,
  StockMovement,
  AdminAuditLog,
  StoreContentPage,
  PricingRule,
  CategoryBanner
} from '../types';

export const INITIAL_STORE_SETTINGS: StoreSettings = {
  storeName: 'ZaDa Foods',
  tagline: 'Authentic Kerala Flavours, Rooted in Tradition',
  fssaiNumber: '21326145000345',
  supportPhone: '+91 8891537982',
  supportWhatsApp: '+91 75939 59235',
  supportEmail: 'Zadafoods4@gmail.com',
  standardDeliveryFee: 40,
  freeShippingThreshold: 499,
  expressDeliveryFee: 80,
  isCodGloballyEnabled: true,
  isCodAdvanceEnabled: false,
  codAdvanceType: 'FIXED',
  codAdvanceValue: 0,
  codAdvanceMinOrderValue: 0,
  codAdvanceMinAmount: 0,
  codAdvanceMaxAmount: 0,
  isRazorpayEnabled: true,
  primaryCheckoutMode: 'RAZORPAY',
  defaultCustomerPaymentMethod: 'COD',
  isWhatsAppAssistedCodEnabled: true,
  whatsAppDestinationNumber: '917593959235',
  isWhatsAppCheckoutEnabled: true,
  firstOrderDiscountEnabled: true,
  firstOrderDiscountPercent: 10,
  razorpayMode: 'test',
  razorpayKeyId: 'rzp_test_placeholder_key_id'
};

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-chips',
    name: 'Chips',
    slug: 'chips',
    description: 'Crispy, tasty and traditional Kerala chips fried in cold-pressed coconut oil.',
    imageUrl: '/assets/cat-chips.png',
    displayOrder: 3,
    subcategories: [
      { id: 'sub-banana', categoryId: 'cat-chips', name: 'Banana Chips', slug: 'banana-chips', description: 'Crispy, thinly sliced Nendran bananas fried in pure coconut oil.', displayOrder: 1, isActive: true },
      { id: 'sub-tapioca', categoryId: 'cat-chips', name: 'Tapioca', slug: 'tapioca', description: 'Crispy Kerala kappa chips seasoned with salt and spices.', displayOrder: 2, isActive: true },
      { id: 'sub-plantain', categoryId: 'cat-chips', name: 'Plantain', slug: 'plantain', description: 'Traditional green plantain wafers with authentic crunch.', displayOrder: 3, isActive: true },
      { id: 'sub-jackfruit', categoryId: 'cat-chips', name: 'Jackfruit', slug: 'jackfruit', description: 'Sun-ripened Malabar jackfruit chips fried to golden perfection.', displayOrder: 4, isActive: true },
    ]
  },
  {
    id: 'cat-spices',
    name: 'Spices & Blends',
    slug: 'spices-and-blends',
    description: 'Authentic Kerala whole spices, stone-ground powders, and heritage aromatic spice blends.',
    imageUrl: '/assets/cat-spices.png',
    displayOrder: 1,
    subcategories: [
      { id: 'sub-whole-spices', categoryId: 'cat-spices', name: 'Whole Spices', slug: 'whole-spices', description: 'Malabar black pepper, aromatic green cardamom, cloves, and cinnamon.', displayOrder: 1, isActive: true },
      { id: 'sub-ground-spices', categoryId: 'cat-spices', name: 'Ground Spices', slug: 'ground-spices', description: 'Pure Wayanad turmeric powder, Kashmiri chilli, and coriander.', displayOrder: 2, isActive: true },
      { id: 'sub-spice-blends', categoryId: 'cat-spices', name: 'Spice Blends', slug: 'spice-blends', description: 'Traditional Kerala garam masala, roasted curry powders, and seasoning blends.', displayOrder: 3, isActive: true }
    ]
  },
  {
    id: 'cat-traditional-ingredients',
    name: 'Traditional Ingredients',
    slug: 'traditional-ingredients',
    description: 'Regional cooking essentials, pure cold-pressed coconut oil, Kudampuli, and pantry staples.',
    imageUrl: '/assets/cat-ingredients.png',
    displayOrder: 2,
    subcategories: [
      { id: 'sub-cooking-essentials', categoryId: 'cat-traditional-ingredients', name: 'Cooking Essentials', slug: 'cooking-essentials', description: 'Cold-pressed coconut oil, pure cow ghee, and unrefined palm jaggery.', displayOrder: 1, isActive: true },
      { id: 'sub-regional-staples', categoryId: 'cat-traditional-ingredients', name: 'Regional Staples', slug: 'regional-staples', description: 'Malabar tamarind (Kudampuli), dry coconut flakes, and traditional essentials.', displayOrder: 2, isActive: true }
    ]
  },
  {
    id: 'cat-sweets',
    name: 'Sweets',
    slug: 'sweets',
    description: 'Authentic festival delicacies, traditional Neyyappam, and melt-in-mouth sweets.',
    imageUrl: '/assets/cat-sweets.png',
    displayOrder: 4,
    subcategories: []
  },
  {
    id: 'cat-halwa',
    name: 'Halwa',
    slug: 'halwa',
    description: 'World-famous Kozhikode black, wheat, and cashew halwas cooked in pure ghee.',
    imageUrl: '/assets/cat-halwa.png',
    displayOrder: 5,
    subcategories: [
      { id: 'sub-cashew-halwa', categoryId: 'cat-halwa', name: 'Cashew Halwa', slug: 'cashew-halwa', description: 'Authentic Kozhikode halwa loaded with roasted whole cashews.', displayOrder: 1, isActive: true },
      { id: 'sub-black-halwa', categoryId: 'cat-halwa', name: 'Black Halwa', slug: 'black-halwa', description: 'Traditional dark jaggery Kozhikode halwa cooked in pure cow ghee.', displayOrder: 2, isActive: true },
    ]
  },
  {
    id: 'cat-laddu',
    name: 'Laddu',
    slug: 'laddu',
    description: 'Golden aromatic Motichoor, Besan, and Malabar dry fruit laddus.',
    imageUrl: '/assets/cat-laddu.png',
    displayOrder: 6,
    subcategories: []
  },
  {
    id: 'cat-mixture',
    name: 'Mixture',
    slug: 'mixture',
    description: 'Spicy, crunchy Kerala savory mixtures infused with curry leaves and peanuts.',
    imageUrl: '/assets/cat-mixture.png',
    displayOrder: 7,
    subcategories: []
  },
  {
    id: 'cat-pickles',
    name: 'Pickles',
    slug: 'pickles',
    description: 'Homestyle preserved tender mango, garlic, and wild lime pickles in gingelly oil.',
    imageUrl: '/assets/cat-pickles.png',
    displayOrder: 8,
    subcategories: []
  },
  {
    id: 'cat-dates',
    name: 'Dates',
    slug: 'dates',
    description: 'Hand-picked premium Arabian and Medjool dates stuffed with roasted dry fruits.',
    imageUrl: '/assets/cat-dates.png',
    displayOrder: 9,
    subcategories: []
  },
  {
    id: 'cat-nuts',
    name: 'Nuts',
    slug: 'nuts',
    description: 'Direct-from-farm whole Kerala cashews, roasted almonds, and pistachios.',
    imageUrl: '/assets/cat-nuts.png',
    displayOrder: 10,
    subcategories: []
  },
  {
    id: 'cat-gift-packs',
    name: 'Gift Packs',
    slug: 'gift-packs',
    description: 'Luxurious festive hampers curated with gold-embossed packaging for celebrations.',
    imageUrl: '/assets/cat-gift-packs.png',
    displayOrder: 11,
    subcategories: []
  },
  {
    id: 'cat-combos',
    name: 'Combos',
    slug: 'combos',
    description: 'Value family packs pairing crisp chips, savory mixture, and signature halwa.',
    imageUrl: '/assets/cat-combos.png',
    displayOrder: 12,
    subcategories: []
  },
];

export const INITIAL_SUBCATEGORIES: Subcategory[] = [
  { id: 'sub-banana', categoryId: 'cat-chips', name: 'Banana Chips', slug: 'banana-chips', description: 'Crispy, thinly sliced Nendran bananas fried in pure coconut oil.', displayOrder: 1, isActive: true },
  { id: 'sub-tapioca', categoryId: 'cat-chips', name: 'Tapioca', slug: 'tapioca', description: 'Crispy Kerala kappa chips seasoned with salt and spices.', displayOrder: 2, isActive: true },
  { id: 'sub-plantain', categoryId: 'cat-chips', name: 'Plantain', slug: 'plantain', description: 'Traditional green plantain wafers with authentic crunch.', displayOrder: 3, isActive: true },
  { id: 'sub-jackfruit', categoryId: 'cat-chips', name: 'Jackfruit', slug: 'jackfruit', description: 'Sun-ripened Malabar jackfruit chips fried to golden perfection.', displayOrder: 4, isActive: true },
  { id: 'sub-cashew-halwa', categoryId: 'cat-halwa', name: 'Cashew Halwa', slug: 'cashew-halwa', description: 'Authentic Kozhikode halwa loaded with roasted whole cashews.', displayOrder: 1, isActive: true },
  { id: 'sub-black-halwa', categoryId: 'cat-halwa', name: 'Black Halwa', slug: 'black-halwa', description: 'Traditional dark jaggery Kozhikode halwa cooked in pure cow ghee.', displayOrder: 2, isActive: true },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-banana-chips-nendran',
    categoryId: 'cat-chips',
    categorySlug: 'chips',
    subcategoryId: 'sub-banana',
    name: 'Banana Chips (Nendran)',
    slug: 'banana-chips-nendran',
    tagline: 'Crispy, tasty and traditional',
    description: 'Crispy, thinly sliced Nendran bananas fried in pure coconut oil with a hint of salt.',
    ingredients: 'Fresh Farm Nendran Bananas (72%), Pure Coconut Oil (26%), Salt, Turmeric powder.',
    nutritionFacts: {
      calories: '532 kcal',
      protein: '3.1 g',
      carbs: '58.4 g',
      fat: '32.0 g',
      sugar: '1.2 g',
      sodium: '380 mg'
    },
    storageInstructions: 'Store in an airtight container in a cool, dry place away from direct sunlight.',
    shelfLifeDays: 90,
    isPreservativeFree: true,
    isCoconutOilMade: true,
    isBestseller: true,
    isOnOffer: false,
    isCodEligible: true,
    isPublished: true,
    averageRating: 4.9,
    reviewCount: 2,
    images: [
      { id: 'img-1', imageUrl: '/assets/prod-banana-chips-hero.png', altText: 'Banana chips bowl', displayOrder: 1, isPrimary: true },
      { id: 'img-2', imageUrl: '/assets/pdp-thumb-2.png', altText: 'Side angle chips', displayOrder: 2 },
      { id: 'img-3', imageUrl: '/assets/pdp-thumb-3.png', altText: 'Packaged pouch', displayOrder: 3 },
      { id: 'img-4', imageUrl: '/assets/pdp-thumb-4.png', altText: 'Top down chips', displayOrder: 4 },
      { id: 'img-5', imageUrl: '/assets/pdp-thumb-5.png', altText: 'Fresh Nendran bananas', displayOrder: 5 }
    ],
    variants: [
      {
        id: 'var-bcn-100',
        productId: 'prod-banana-chips-nendran',
        sku: 'ZDF-BCN-100G',
        weightValue: 100,
        weightUnit: 'g',
        weightLabel: '100 g',
        sellingPrice: 80,
        mrp: 100,
        discountPercentage: 20,
        stockQuantity: 150,
        lowStockThreshold: 15,
        isDefault: false
      },
      {
        id: 'var-bcn-250',
        productId: 'prod-banana-chips-nendran',
        sku: 'ZDF-BCN-250G',
        weightValue: 250,
        weightUnit: 'g',
        weightLabel: '250 g',
        sellingPrice: 180,
        mrp: 220,
        discountPercentage: 18,
        stockQuantity: 280,
        lowStockThreshold: 20,
        isDefault: true
      },
      {
        id: 'var-bcn-500',
        productId: 'prod-banana-chips-nendran',
        sku: 'ZDF-BCN-500G',
        weightValue: 500,
        weightUnit: 'g',
        weightLabel: '500 g',
        sellingPrice: 320,
        mrp: 390,
        discountPercentage: 18,
        stockQuantity: 95,
        lowStockThreshold: 10,
        isDefault: false
      }
    ],
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-10-25T10:00:00Z'
  },
  {
    id: 'prod-cashew-halwa',
    categoryId: 'cat-halwa',
    categorySlug: 'halwa',
    subcategoryId: 'sub-cashew-halwa',
    name: 'Cashew Halwa',
    slug: 'cashew-halwa',
    tagline: 'Kozhikode heritage recipe',
    description: 'Slow-cooked luxury halwa made with stone-ground wheat, caramelized jaggery, and generous whole roasted cashews in pure ghee.',
    ingredients: 'Whole Wheat Extract, Pure Cow Ghee (30%), Jaggery, Roasted Cashew Nuts (18%), Cardamom.',
    nutritionFacts: {
      calories: '485 kcal',
      protein: '6.2 g',
      carbs: '64.0 g',
      fat: '22.5 g',
      sugar: '38.0 g',
      sodium: '45 mg'
    },
    storageInstructions: 'Store in an airtight container in a cool, dry place.',
    shelfLifeDays: 60,
    isPreservativeFree: true,
    isCoconutOilMade: false,
    isBestseller: true,
    isOnOffer: false,
    isCodEligible: true,
    isPublished: true,
    averageRating: 5.0,
    reviewCount: 2,
    images: [
      { id: 'img-ch-1', imageUrl: '/assets/prod-cashew-halwa.png', altText: 'Authentic Kozhikode Cashew Halwa', displayOrder: 1, isPrimary: true },
      { id: 'img-ch-2', imageUrl: '/assets/cart-cashew-halwa.png', altText: 'Cashew Halwa sliced with whole dry fruits', displayOrder: 2 },
      { id: 'img-ch-3', imageUrl: '/assets/cat-halwa.png', altText: 'Heritage Pure Ghee Halwa', displayOrder: 3 }
    ],
    variants: [
      {
        id: 'var-ch-250',
        productId: 'prod-cashew-halwa',
        sku: 'ZDF-CH-250G',
        weightValue: 250,
        weightUnit: 'g',
        weightLabel: '250 g',
        sellingPrice: 185,
        mrp: 220,
        discountPercentage: 16,
        stockQuantity: 110,
        lowStockThreshold: 10,
        isDefault: false
      },
      {
        id: 'var-ch-500',
        productId: 'prod-cashew-halwa',
        sku: 'ZDF-CH-500G',
        weightValue: 500,
        weightUnit: 'g',
        weightLabel: '500 g',
        sellingPrice: 350,
        mrp: 420,
        discountPercentage: 17,
        stockQuantity: 65,
        lowStockThreshold: 10,
        isDefault: true
      }
    ],
    createdAt: '2026-02-15T10:00:00Z',
    updatedAt: '2026-10-25T10:00:00Z'
  },
  {
    id: 'prod-banana-chips-spicy',
    categoryId: 'cat-chips',
    categorySlug: 'chips',
    subcategoryId: 'sub-banana',
    name: 'Banana Chips (Spicy)',
    slug: 'banana-chips-spicy',
    tagline: 'Fiery red chilli coated crunchy chips',
    description: 'Crispy Nendran banana chips coated with authentic spicy red chilli powder and Malabar spices.',
    ingredients: 'Nendran Bananas, Coconut Oil, Kashmiri Red Chilli Powder, Salt, Hing.',
    storageInstructions: 'Keep in an airtight jar.',
    shelfLifeDays: 90,
    isPreservativeFree: true,
    isCoconutOilMade: true,
    isBestseller: false,
    isOnOffer: true,
    isCodEligible: true,
    isPublished: true,
    averageRating: 0,
    reviewCount: 0,
    images: [
      { id: 'img-bcs-1', imageUrl: '/assets/prod-spicy-chips.png', altText: 'Spicy banana chips', displayOrder: 1, isPrimary: true }
    ],
    variants: [
      {
        id: 'var-bcs-250',
        productId: 'prod-banana-chips-spicy',
        sku: 'ZDF-BCS-250G',
        weightValue: 250,
        weightUnit: 'g',
        weightLabel: '250 g',
        sellingPrice: 190,
        mrp: 230,
        discountPercentage: 17,
        stockQuantity: 140,
        lowStockThreshold: 15,
        isDefault: true
      }
    ],
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-10-25T10:00:00Z'
  },
  {
    id: 'prod-tapioca-chips',
    categoryId: 'cat-chips',
    categorySlug: 'chips',
    subcategoryId: 'sub-tapioca',
    name: 'Tapioca Chips 250 g',
    slug: 'tapioca-chips',
    tagline: 'Kerala kappa chips',
    description: 'Thinly sliced fresh tapioca root fried to golden perfection with crunchy sea salt.',
    ingredients: 'Fresh Tapioca (Kappa), Pure Coconut Oil, Salt.',
    storageInstructions: 'Airtight storage recommended.',
    shelfLifeDays: 75,
    isPreservativeFree: true,
    isCoconutOilMade: true,
    isBestseller: false,
    isOnOffer: false,
    isCodEligible: true,
    isPublished: true,
    averageRating: 0,
    reviewCount: 0,
    images: [
      { id: 'img-tc-1', imageUrl: '/assets/prod-tapioca-chips.png', altText: 'Tapioca chips', displayOrder: 1, isPrimary: true }
    ],
    variants: [
      {
        id: 'var-tc-250',
        productId: 'prod-tapioca-chips',
        sku: 'ZDF-TC-250G',
        weightValue: 250,
        weightUnit: 'g',
        weightLabel: '250 g',
        sellingPrice: 160,
        mrp: 190,
        discountPercentage: 16,
        stockQuantity: 190,
        lowStockThreshold: 20,
        isDefault: true
      }
    ],
    createdAt: '2026-03-15T10:00:00Z',
    updatedAt: '2026-10-25T10:00:00Z'
  },
  {
    id: 'prod-sweet-banana-chips',
    categoryId: 'cat-chips',
    categorySlug: 'chips',
    subcategoryId: 'sub-banana',
    name: 'Sweet Banana Chips',
    slug: 'sweet-banana-chips',
    tagline: 'Sharkara upperi jaggery coated',
    description: 'Thick diced Nendran banana pieces fried and generously coated with organic melted jaggery, ginger powder, and cumin.',
    ingredients: 'Nendran Bananas, Organic Jaggery, Coconut Oil, Dry Ginger, Cardamom, Cumin.',
    storageInstructions: 'Store in airtight box.',
    shelfLifeDays: 90,
    isPreservativeFree: true,
    isCoconutOilMade: true,
    isBestseller: false,
    isOnOffer: false,
    isCodEligible: true,
    isPublished: true,
    averageRating: 0,
    reviewCount: 0,
    images: [
      { id: 'img-sbc-1', imageUrl: '/assets/prod-sweet-chips.png', altText: 'Sweet banana chips', displayOrder: 1, isPrimary: true }
    ],
    variants: [
      {
        id: 'var-sbc-250',
        productId: 'prod-sweet-banana-chips',
        sku: 'ZDF-SBC-250G',
        weightValue: 250,
        weightUnit: 'g',
        weightLabel: '250 g',
        sellingPrice: 200,
        mrp: 240,
        discountPercentage: 17,
        stockQuantity: 80,
        lowStockThreshold: 15,
        isDefault: true
      }
    ],
    createdAt: '2026-04-01T10:00:00Z',
    updatedAt: '2026-10-25T10:00:00Z'
  },
  {
    id: 'prod-kerala-mixture',
    categoryId: 'cat-mixture',
    categorySlug: 'mixture',
    name: 'Kerala Mixture',
    slug: 'kerala-mixture',
    tagline: 'Signature evening tea snack',
    description: 'Crispy fried gram flour sev, boondi, peanuts, and roasted garlic tempered with aromatic fresh curry leaves.',
    ingredients: 'Besan, Peanuts, Fried Garlic, Roasted Curry Leaves, Chilli powder, Asafoetida, Vegetable Oil, Salt.',
    storageInstructions: 'Seal tightly after opening to retain crunchiness.',
    shelfLifeDays: 90,
    isPreservativeFree: true,
    isCoconutOilMade: false,
    isBestseller: true,
    isOnOffer: false,
    isCodEligible: true,
    isPublished: true,
    averageRating: 0,
    reviewCount: 0,
    images: [
      { id: 'img-km-1', imageUrl: '/assets/cart-kerala-mixture.png', altText: 'Kerala Mixture', displayOrder: 1, isPrimary: true }
    ],
    variants: [
      {
        id: 'var-km-250',
        productId: 'prod-kerala-mixture',
        sku: 'ZDF-KM-250G',
        weightValue: 250,
        weightUnit: 'g',
        weightLabel: '250 g',
        sellingPrice: 220,
        mrp: 280,
        discountPercentage: 21,
        stockQuantity: 160,
        lowStockThreshold: 20,
        isDefault: true
      }
    ],
    createdAt: '2026-04-10T10:00:00Z',
    updatedAt: '2026-10-25T10:00:00Z'
  }
];

export const INITIAL_ADDRESSES: Address[] = [
  {
    id: 'addr-1',
    userId: 'usr-numan',
    tag: 'Home',
    recipientName: 'Numan Sidique',
    phone: '+91 98765 43210',
    streetAddress: 'Kozhikode',
    city: 'Kozhikode',
    state: 'Kerala',
    postalCode: '673012',
    isDefault: true
  },
  {
    id: 'addr-2',
    userId: 'usr-numan',
    tag: 'Work',
    recipientName: 'Numan Sidique',
    phone: '+91 98765 43210',
    streetAddress: 'Valluvanad Hospital',
    city: 'Ottapalam',
    state: 'Kerala',
    postalCode: '679103',
    isDefault: false
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-zdf1008',
    orderNumber: 'ZDF1008',
    userId: 'usr-numan',
    customerName: 'Numan Sidique',
    customerEmail: 'numan@example.com',
    customerPhone: '+91 98765 43210',
    shippingAddress: INITIAL_ADDRESSES[0],
    deliveryMethod: 'STANDARD',
    paymentMode: 'RAZORPAY',
    paymentStatus: 'PAID',
    fulfillmentStatus: 'CONFIRMED',
    subtotalAmount: 930,
    discountAmount: 80,
    couponCode: 'ZADA80',
    shippingCharge: 40,
    totalAmount: 890,
    adminNotes: 'We are preparing your order for packing.',
    items: [
      {
        id: 'oi-1',
        productId: 'prod-banana-chips-nendran',
        variantId: 'var-bcn-250',
        productName: 'Banana Chips (Nendran)',
        variantWeightLabel: '250 g',
        imageUrl: '/assets/order-banana-chips.png',
        unitPrice: 180,
        quantity: 2,
        lineTotal: 360
      },
      {
        id: 'oi-2',
        productId: 'prod-cashew-halwa',
        variantId: 'var-ch-500',
        productName: 'Cashew Halwa',
        variantWeightLabel: '500 g',
        imageUrl: '/assets/cart-cashew-halwa.png',
        unitPrice: 350,
        quantity: 1,
        lineTotal: 350
      },
      {
        id: 'oi-3',
        productId: 'prod-kerala-mixture',
        variantId: 'var-km-250',
        productName: 'Kerala Mixture',
        variantWeightLabel: '250 g',
        imageUrl: '/assets/cart-kerala-mixture.png',
        unitPrice: 220,
        quantity: 1,
        lineTotal: 220
      }
    ],
    statusHistory: [
      {
        id: 'osh-1',
        orderId: 'ord-zdf1008',
        status: 'CONFIRMED',
        notes: 'Your order has been confirmed. We are preparing your order for packing.',
        updatedBy: 'System / Admin',
        createdAt: '30 Oct 2026, 11:24 AM'
      }
    ],
    createdAt: '30 Oct 2026, 11:24 AM',
    updatedAt: '30 Oct 2026, 11:24 AM'
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'coup-1',
    code: 'ZADA80',
    discountType: 'FLAT',
    discountValue: 80,
    minOrderAmount: 499,
    isFirstOrderOnly: false,
    usageLimit: 500,
    timesUsed: 42,
    isActive: true
  },
  {
    id: 'coup-2',
    code: 'FIRST10',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    maxDiscountAmount: 150,
    minOrderAmount: 299,
    isFirstOrderOnly: true,
    timesUsed: 12,
    isActive: true
  },
  {
    id: 'coup-3',
    code: 'FREESHIP',
    discountType: 'FREE_SHIPPING',
    discountValue: 40,
    minOrderAmount: 399,
    isFirstOrderOnly: false,
    timesUsed: 89,
    isActive: true
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    productId: 'prod-banana-chips-nendran',
    reviewerName: 'Lakshmi Nair',
    rating: 5,
    reviewTitle: 'Authentic Kerala Taste!',
    reviewText: 'These are the best banana chips outside Kerala. Crisp, pure coconut oil aroma, zero artificial oily taste. Packaging was very fresh.',
    isVerifiedPurchase: true,
    isApproved: true,
    isFeaturedOnPdp: true,
    createdAt: '2026-10-15'
  },
  {
    id: 'rev-2',
    productId: 'prod-banana-chips-nendran',
    reviewerName: 'Rohit Menon',
    rating: 5,
    reviewTitle: 'Perfect crunch',
    reviewText: 'Thinly sliced and salted just right. My whole family finished the 500g pack in two days. Will order again!',
    isVerifiedPurchase: true,
    isApproved: true,
    isFeaturedOnPdp: true,
    createdAt: '2026-10-20'
  }
];

export const INITIAL_COMBOS: ComboBundle[] = [
  {
    id: 'combo-kerala-bestseller',
    name: 'Malabar Heritage Bestseller Pack',
    slug: 'malabar-heritage-bestseller-pack',
    description: 'Our top 3 all-time Kerala favorites: Traditional Nendran Chips, Spicy Tapioca Chips, and Signature Kozhikode Halwa.',
    imageUrl: '/assets/cat-combos.png',
    originalPrice: 620,
    comboPrice: 520,
    discountPercent: 16,
    isActive: true,
    items: [
      {
        productId: 'prod-banana-chips-nendran',
        variantId: 'var-chips-500g',
        quantity: 1,
        productName: 'Kerala Banana Chips (Nendran)',
        variantLabel: '500 g'
      },
      {
        productId: 'prod-tapioca-chips',
        variantId: 'var-tapioca-250g',
        quantity: 1,
        productName: 'Spicy Tapioca Chips (Kappa)',
        variantLabel: '250 g'
      },
      {
        productId: 'prod-kozhikode-black-halwa',
        variantId: 'var-halwa-500g',
        quantity: 1,
        productName: 'Kozhikodan Black Halwa',
        variantLabel: '500 g'
      }
    ],
    createdAt: '2026-10-20T10:00:00Z'
  },
  {
    id: 'combo-tea-time-crunch',
    name: 'Kerala Tea-Time Crunchy Hamper',
    slug: 'kerala-tea-time-crunchy-hamper',
    description: 'Perfect evening accompaniment: Royal Spicy Kerala Mixture and Pepper Banana Chips.',
    imageUrl: '/assets/prod-banana-chips.png',
    originalPrice: 380,
    comboPrice: 320,
    discountPercent: 15,
    isActive: true,
    items: [
      {
        productId: 'prod-kerala-mixture',
        variantId: 'var-mixture-500g',
        quantity: 1,
        productName: 'Special Malabar Mixture',
        variantLabel: '500 g'
      },
      {
        productId: 'prod-pepper-banana-chips',
        variantId: 'var-pepper-250g',
        quantity: 1,
        productName: 'Black Pepper Banana Chips',
        variantLabel: '250 g'
      }
    ],
    createdAt: '2026-10-22T10:00:00Z'
  }
];

export const INITIAL_BANNERS: HomepageBanner[] = [
  {
    id: 'ban-1',
    title: 'Authentic Kerala Flavours Delivered to Your Home',
    subtitle: 'Harvested from Wayanad farms, thinly sliced & fried fresh in 100% pure cold-pressed coconut oil.',
    imageUrl: '/assets/hero-banner.png',
    linkUrl: '/category/chips',
    displayOrder: 1,
    isActive: true
  },
  {
    id: 'ban-2',
    title: 'Festive Malabar Sweet Gift Boxes',
    subtitle: 'Handcrafted Kozhikode Halwa and Ghee Sweets packed in luxury heritage gifting boxes.',
    imageUrl: '/assets/cat-halwa.png',
    linkUrl: '/category/halwa',
    displayOrder: 2,
    isActive: false
  }
];

export const INITIAL_CATEGORY_BANNERS: CategoryBanner[] = [
  {
    id: 'cat-ban-chips',
    categoryId: 'cat-chips',
    categorySlug: 'chips',
    title: 'Chips',
    subtitle: 'Crispy, tasty and traditional Kerala chips fried in cold-pressed pure coconut oil.',
    eyebrow: "KERALA'S FAVOURITE SNACKS",
    backgroundColor: '#072C20',
    textColor: '#FFFFFF',
    imageUrl: '/assets/cat-hero-chips.png',
    isActive: true,
    displayOrder: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-10-29T00:00:00Z'
  },
  {
    id: 'cat-ban-sweets',
    categoryId: 'cat-sweets',
    categorySlug: 'sweets',
    title: 'Traditional Sweets',
    subtitle: 'Authentic festival delicacies, traditional Neyyappam, and melt-in-mouth heritage sweets.',
    eyebrow: 'HERITAGE MALABAR RECIPES',
    backgroundColor: '#4A1521',
    textColor: '#FFFFFF',
    imageUrl: '',
    isActive: true,
    displayOrder: 2,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-10-29T00:00:00Z'
  },
  {
    id: 'cat-ban-halwa',
    categoryId: 'cat-halwa',
    categorySlug: 'halwa',
    title: 'Kozhikode Halwa',
    subtitle: 'World-famous black, wheat, and cashew halwas slow-cooked in pure ghee in brass urulis.',
    eyebrow: 'SWEET HERITAGE OF MALABAR',
    backgroundColor: '#38220F',
    textColor: '#FFFFFF',
    imageUrl: '',
    isActive: true,
    displayOrder: 3,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-10-29T00:00:00Z'
  },
  {
    id: 'cat-ban-laddu',
    categoryId: 'cat-laddu',
    categorySlug: 'laddu',
    title: 'Malabar Laddus',
    subtitle: 'Golden aromatic Motichoor, Besan, and dry fruit laddus infused with pure cardamom and saffron.',
    eyebrow: 'GOLDEN FESTIVE DELICACIES',
    backgroundColor: '#4A3511',
    textColor: '#FFFFFF',
    imageUrl: '',
    isActive: true,
    displayOrder: 4,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-10-29T00:00:00Z'
  },
  {
    id: 'cat-ban-mixture',
    categoryId: 'cat-mixture',
    categorySlug: 'mixture',
    title: 'Kerala Mixture',
    subtitle: 'Spicy, crunchy savory mixture infused with fresh curry leaves, roasted garlic, and peanuts.',
    eyebrow: 'EVENING TEA SNACKS',
    backgroundColor: '#8F3D1C',
    textColor: '#FFFFFF',
    imageUrl: '',
    isActive: true,
    displayOrder: 5,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-10-29T00:00:00Z'
  },
  {
    id: 'cat-ban-pickles',
    categoryId: 'cat-pickles',
    categorySlug: 'pickles',
    title: 'Homestyle Pickles',
    subtitle: 'Tender mango, garlic, and wild lime preserved traditionally in cold-pressed gingelly oil.',
    eyebrow: 'AUTHENTIC HOMEMADE RECIPES',
    backgroundColor: '#1E3A2F',
    textColor: '#FFFFFF',
    imageUrl: '',
    isActive: true,
    displayOrder: 6,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-10-29T00:00:00Z'
  },
  {
    id: 'cat-ban-dates',
    categoryId: 'cat-dates',
    categorySlug: 'dates',
    title: 'Premium Dates',
    subtitle: 'Hand-picked Arabian and Medjool dates stuffed with roasted dry fruits and Malabar spices.',
    eyebrow: 'NATURAL NUTRITION',
    backgroundColor: '#2A1810',
    textColor: '#FFFFFF',
    imageUrl: '',
    isActive: true,
    displayOrder: 7,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-10-29T00:00:00Z'
  },
  {
    id: 'cat-ban-nuts',
    categoryId: 'cat-nuts',
    categorySlug: 'nuts',
    title: 'Farm Fresh Nuts',
    subtitle: 'Direct-from-farm whole Kerala cashews, roasted almonds, and pistachios.',
    eyebrow: '100% PURE & CRUNCHY',
    backgroundColor: '#2D3A1E',
    textColor: '#FFFFFF',
    imageUrl: '',
    isActive: true,
    displayOrder: 8,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-10-29T00:00:00Z'
  },
  {
    id: 'cat-ban-gift-packs',
    categoryId: 'cat-gift-packs',
    categorySlug: 'gift-packs',
    title: 'Festive Hampers',
    subtitle: 'Luxurious gift hampers curated with gold-embossed packaging for celebrations.',
    eyebrow: 'CELEBRATE WITH TRADITION',
    backgroundColor: '#3C2415',
    textColor: '#FFFFFF',
    imageUrl: '',
    isActive: true,
    displayOrder: 9,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-10-29T00:00:00Z'
  },
  {
    id: 'cat-ban-combos',
    categoryId: 'cat-combos',
    categorySlug: 'combos',
    title: 'Value Combos',
    subtitle: 'Value family packs pairing crisp chips, savory mixture, and signature halwa.',
    eyebrow: 'BEST VALUE SAVINGS',
    backgroundColor: '#16382C',
    textColor: '#FFFFFF',
    imageUrl: '',
    isActive: true,
    displayOrder: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-10-29T00:00:00Z'
  }
];

export const INITIAL_HOMEPAGE_SECTIONS: HomepageSection[] = [
  { id: 'sec-1', sectionKey: 'hero_banner', title: 'Hero Carousel', displayOrder: 1, isEnabled: true },
  { id: 'sec-2', sectionKey: 'categories', title: 'Shop by Category', displayOrder: 2, isEnabled: true },
  { id: 'sec-3', sectionKey: 'bestsellers', title: 'Bestselling Snacks', displayOrder: 3, isEnabled: true },
  { id: 'sec-4', sectionKey: 'combos', title: 'Value Combos & Hampers', displayOrder: 4, isEnabled: true },
  { id: 'sec-5', sectionKey: 'new_arrivals', title: 'New Arrivals', displayOrder: 5, isEnabled: true },
  { id: 'sec-6', sectionKey: 'reviews', title: 'What Our Customers Say', displayOrder: 6, isEnabled: true },
  { id: 'sec-7', sectionKey: 'story', title: 'Our Heritage Story', displayOrder: 7, isEnabled: true }
];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'mov-1',
    variantId: 'var-chips-250g',
    productId: 'prod-banana-chips-nendran',
    productName: 'Kerala Banana Chips (Nendran)',
    variantLabel: '250 g',
    delta: 50,
    previousStock: 0,
    newStock: 50,
    reason: 'PURCHASE_ORDER',
    notes: 'Initial production batch from Malabar processing facility',
    actor: 'Admin (System)',
    createdAt: '2026-10-15T09:30:00Z'
  },
  {
    id: 'mov-2',
    variantId: 'var-chips-500g',
    productId: 'prod-banana-chips-nendran',
    productName: 'Kerala Banana Chips (Nendran)',
    variantLabel: '500 g',
    delta: 40,
    previousStock: 0,
    newStock: 40,
    reason: 'PURCHASE_ORDER',
    notes: 'Initial packaging run',
    actor: 'Admin (System)',
    createdAt: '2026-10-15T09:30:00Z'
  },
  {
    id: 'mov-3',
    variantId: 'var-halwa-500g',
    productId: 'prod-kozhikode-black-halwa',
    productName: 'Kozhikodan Black Halwa',
    variantLabel: '500 g',
    delta: 25,
    previousStock: 0,
    newStock: 25,
    reason: 'PURCHASE_ORDER',
    notes: 'Pure ghee halwa batch #882',
    actor: 'Admin (System)',
    createdAt: '2026-10-18T14:15:00Z'
  }
];

export const INITIAL_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: 'log-1',
    adminUser: 'admin@zadafoods.com',
    action: 'INITIALIZE_CATALOG',
    targetEntity: 'CATALOG',
    details: 'Initial product catalog, variants, and pricing tiers established',
    createdAt: '2026-10-26T18:00:00Z'
  },
  {
    id: 'log-2',
    adminUser: 'admin@zadafoods.com',
    action: 'CONFIGURE_SHIPPING',
    targetEntity: 'STORE_SETTINGS',
    details: 'Standard delivery set to ₹40; free threshold at ₹499; primary checkout set to Razorpay',
    createdAt: '2026-10-26T18:30:00Z'
  }
];

export const INITIAL_PRICING_RULES: PricingRule[] = [
  {
    id: 'rule-bulk-chips',
    name: 'Banana Chips Volume Discount (Buy 3+ save ₹20/pack)',
    ruleType: 'QUANTITY_TIER',
    productId: 'prod-banana-chips-nendran',
    variantId: 'var-chips-500g',
    minQuantity: 3,
    discountPercentage: 7.7,
    fixedPrice: 240,
    isActive: true,
    createdAt: '2026-10-20T10:00:00Z'
  },
  {
    id: 'rule-bogo-pickles',
    name: 'Buy 2 Get 1 Mango Pickle Free',
    ruleType: 'BOGO',
    productId: 'prod-cut-mango-pickle',
    minQuantity: 2,
    buyQuantity: 2,
    getQuantity: 1,
    isActive: true,
    createdAt: '2026-10-22T10:00:00Z'
  }
];

export const INITIAL_STORE_CONTENT: StoreContentPage[] = [
  {
    slug: 'about',
    title: 'Our Kerala Heritage & Pure Flavors',
    content: `ZaDa Foods was founded with a singular, uncompromising vision: to bring the authentic, golden crunch and nostalgic aroma of traditional Kerala snacks directly to food lovers across India and the globe.

Every single batch of our signature Nendran banana chips is sourced directly from ethical, small-scale farmers in the lush hills of Wayanad and Palakkad. We use 100% pure, cold-pressed, unadulterated coconut oil—no palm oil, no artificial flavor enhancers, and zero synthetic additives.

Our recipes have been handed down through generations of Malabar culinary artisans. From slow-cooked Kozhikode halwa in brass urulis to crunchy ribbon pakoda fried to crisp golden perfection, ZaDa Foods is our tribute to Kerala's rich culinary soul.`,
    lastUpdated: '2026-10-25'
  },
  {
    slug: 'contact',
    title: 'Get In Touch with ZaDa Foods',
    content: `Have a question about an order, feedback on our snacks, or need custom corporate hampers? Our customer happiness team is here to assist you.

Manufactured By:
ZADA FOODS
Punalur, Kollam (Dist), Kerala – 691305

Customer Support Phone:
+91 8891537982 / +91 7593959235

WhatsApp Assistance:
+91 75939 59235

Email:
Zadafoods4@gmail.com

Working Hours: Monday to Saturday, 9:00 AM - 7:00 PM IST
FSSAI License Number: 21326145000345`,
    lastUpdated: '2026-11-04'
  },
  {
    slug: 'faq',
    title: 'Frequently Asked Questions',
    content: `**Q: What oil do you use for frying your chips?**
A: We use 100% cold-pressed virgin coconut oil sourced directly from Kerala mills. We never blend or reuse oil across batches.

**Q: Are your snacks preservative-free?**
A: Yes! All ZaDa Foods snacks are 100% preservative-free and free of synthetic colorings or MSG.

**Q: What is the shelf life of your banana chips and sweets?**
A: Because we use nitrogen-flushed multi-barrier packaging, our banana chips remain crisp for 90 days. Our Kozhikode Halwa retains fresh flavor for 45 days when stored in a cool, dry place.

**Q: Do you offer Cash on Delivery (COD)?**
A: Yes, COD is available for eligible pin codes across India on orders up to ₹2,500. Highly perishable or customized bulk orders require prepaid confirmation.

**Q: How long does delivery take?**
A: Standard shipping takes 3 to 5 business days for South India and 5 to 7 business days for the rest of India. You will receive active tracking updates via SMS and WhatsApp.`,
    lastUpdated: '2026-10-25'
  },
  {
    slug: 'shipping-policy',
    title: 'Shipping & Delivery Policy',
    content: `At ZaDa Foods, we prioritize freshness above all else. Snacks are freshly packed immediately upon receipt of your order and dispatched within 24 to 36 hours.

Shipping Charges:
- Orders above ₹499 qualify for Free Standard Delivery across India.
- Standard Shipping fee of ₹40 applies to orders below ₹499.
- Express Air Delivery is available in select metros for a flat fee of ₹80.

Courier Partners & Tracking:
We partner with India's premier logistics providers (Delhivery, DTDC, Blue Dart, and India Post Speed Post). Once dispatched, customers receive an SMS and email with live courier AWB tracking details.`,
    lastUpdated: '2026-10-25'
  },
  {
    slug: 'cancellation-refund-policy',
    title: 'Cancellation & Refund Policy',
    content: `Cancellation Terms:
You may cancel your order at any time before it has been marked as "PACKED" or "SHIPPED". Once dispatched, cancellations cannot be processed.

Quality Guarantee & Damaged Goods:
If your package arrives damaged, tampered with, or if you receive an incorrect product:
1. Please notify us within 48 hours of delivery at care@zadafoods.com or WhatsApp (+91 75939 59235).
2. Share a photo of the package and item.
3. We will dispatch an immediate replacement or process a 100% refund to your original payment method within 3 to 5 banking days.`,
    lastUpdated: '2026-10-25'
  },
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    content: `ZaDa Foods respects your personal privacy. We only collect the necessary information (name, delivery address, contact email, and phone number) required to fulfill your orders and keep you updated on shipping progress.

Data Protection:
- We never sell or lease customer information to third-party marketing brokers.
- Payment transactions are handled exclusively through RBI-authorized payment aggregators (Razorpay) utilizing 256-bit SSL encryption. We never store credit/debit card numbers or UPI PINs on our servers.`,
    lastUpdated: '2026-10-25'
  },
  {
    slug: 'terms',
    title: 'Terms & Conditions of Service',
    content: `Welcome to ZaDa Foods. By accessing our website, placing an order, or interacting with our services, you agree to comply with our Terms of Service.

1. Product Accuracy: We strive for exact representation of weights, ingredients, and pack sizes. Actual natural batch variations in banana slice thickness or natural seasoning may occur.
2. Orders & Acceptance: Order confirmation is subject to product availability and payment verification. ZaDa Foods reserves the right to decline or cancel fraudulent or bot-generated orders.
3. Governing Law: Any dispute arising out of or related to these terms shall be subject to the exclusive jurisdiction of the courts of Kozhikode, Kerala, India.`,
    lastUpdated: '2026-10-25'
  }
];


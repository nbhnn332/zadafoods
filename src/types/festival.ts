export type FestivalPreset =
  | 'default'
  | 'diwali'
  | 'christmas'
  | 'new_year'
  | 'onam'
  | 'eid'
  | 'custom';

// 4 distinct user-requested visual intensities (with backward compatibility)
export type DecorativeIntensity = 'subtle' | 'moderate' | 'balanced' | 'rich' | 'grand' | 'festive';

export type FestivalProductBadgeType =
  | 'festive_special'
  | 'gift_recommendation'
  | 'festival_bestseller'
  | 'limited_collection';

export const FESTIVAL_BADGE_LABELS: Record<FestivalProductBadgeType, string> = {
  festive_special: 'Festive Special',
  gift_recommendation: 'Gift Recommendation',
  festival_bestseller: 'Festival Bestseller',
  limited_collection: 'Limited Festive Collection'
};

export interface DecorationPlacements {
  heroBanners: boolean;
  promoBanners: boolean;
  productCards: boolean;
  categorySections: boolean;
  announcementBar: boolean;
  headerMotif?: boolean;
  footerMotif?: boolean;
  sectionDividers?: boolean;
  ambientBackground?: boolean;
  promotionalPopup?: boolean;
  countdownTimer?: boolean;
}

export interface FestivalPromotion {
  id: string;
  title: string;
  subtitle: string;
  tagline?: string;
  ctaText: string;
  ctaLink: string;
  imageUrl?: string;
  badge?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
}

export interface FestivalPopupConfig {
  enabled: boolean;
  title: string;
  description: string;
  couponCode?: string;
  discountBadge?: string;
  ctaText?: string;
  ctaLink?: string;
  imageUrl?: string;
  frequency: 'once_per_session' | 'once_per_day' | 'always';
}

export interface FestivalCountdownConfig {
  enabled: boolean;
  targetDate: string; // ISO date string
  label: string;
}

export interface FestivalAtmosphereConfig {
  pageBackground?: string;
  sectionBackground?: string;
  patternType?: 'none' | 'rangoli' | 'snowflakes' | 'stars' | 'pookalam' | 'arabesque';
  patternOpacity?: number; // 0.02 - 0.12
  borderColor?: string;
  enableFloatingParticles?: boolean;
}

export interface FestivalTheme {
  id: string;
  preset: FestivalPreset;
  name: string;
  greeting: string;
  announcementBadge?: string;
  couponCode?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  intensity: DecorativeIntensity;
  accentColor: string;
  badgeColor?: string;
  promotionalImageUrl?: string;
  heroBannerHeadline?: string;
  heroBannerSubline?: string;
  heroCtaLabel?: string;
  heroCtaLink?: string;
  placements: DecorationPlacements;
  featuredProductIds: string[];
  productBadges?: Record<string, FestivalProductBadgeType>;
  promotions?: FestivalPromotion[];
  popup?: FestivalPopupConfig;
  countdown?: FestivalCountdownConfig;
  atmosphere?: FestivalAtmosphereConfig;
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_FESTIVAL_PLACEMENTS: DecorationPlacements = {
  heroBanners: true,
  promoBanners: true,
  productCards: true,
  categorySections: true,
  announcementBar: true,
  headerMotif: true,
  footerMotif: true,
  sectionDividers: true,
  ambientBackground: true,
  promotionalPopup: true,
  countdownTimer: true
};

export const INITIAL_FESTIVAL_PRESETS: FestivalTheme[] = [
  {
    id: 'theme-default',
    preset: 'default',
    name: 'Default ZaDa Theme',
    greeting: 'Pure Cold-Pressed Coconut Oil Snacks & Heritage Malabar Delicacies',
    announcementBadge: 'Authentic Kerala',
    couponCode: '',
    isActive: true,
    intensity: 'subtle',
    accentColor: '#A67732',
    badgeColor: '#FAD982',
    placements: {
      heroBanners: false,
      promoBanners: false,
      productCards: false,
      categorySections: false,
      announcementBar: false,
      headerMotif: false,
      footerMotif: false,
      sectionDividers: false,
      ambientBackground: false,
      promotionalPopup: false,
      countdownTimer: false
    },
    featuredProductIds: [],
    productBadges: {},
    promotions: [],
    popup: {
      enabled: false,
      title: 'Welcome to ZaDa Foods',
      description: 'Discover fresh Wayanad banana chips & artisan Kozhikode halwas.',
      frequency: 'once_per_session'
    },
    countdown: {
      enabled: false,
      targetDate: '',
      label: ''
    },
    atmosphere: {
      patternType: 'none',
      patternOpacity: 0
    },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'theme-diwali',
    preset: 'diwali',
    name: 'Diwali Festival of Lights',
    greeting: '🪔 Shubh Deepavali! Illuminate your celebrations with pure ghee sweets & artisan chips.',
    announcementBadge: 'Diwali Special',
    couponCode: 'DIWALI20',
    isActive: false,
    intensity: 'rich',
    accentColor: '#D97706',
    badgeColor: '#FDE68A',
    heroBannerHeadline: 'Light Up Your Festive Feasts',
    heroBannerSubline: 'Handcrafted Kozhikode Halwas, Cashew Delights & Fresh Coconut Oil Chips packed in luxury heritage gift boxes.',
    heroCtaLabel: 'Explore Diwali Hampers',
    heroCtaLink: '/shop?festival=diwali',
    placements: { ...DEFAULT_FESTIVAL_PLACEMENTS },
    featuredProductIds: ['prod-1', 'prod-2', 'prod-3', 'prod-6'],
    productBadges: {
      'prod-1': 'festive_special',
      'prod-2': 'gift_recommendation',
      'prod-3': 'festival_bestseller',
      'prod-6': 'limited_collection'
    },
    promotions: [
      {
        id: 'promo-diwali-1',
        title: 'Royal Diwali Sweet & Savoury Curation',
        subtitle: 'Artisanal Kozhikode halwas, golden cashew delights & crunchy Wayanad banana chips in luxury brass-accented gift packaging.',
        tagline: 'Handcrafted Festive Gifting',
        ctaText: 'Order Diwali Boxes',
        ctaLink: '/shop',
        badge: 'Festive Bestseller',
        backgroundColor: '#072C20',
        textColor: '#FFFFFF',
        accentColor: '#D97706'
      },
      {
        id: 'promo-diwali-2',
        title: 'Pure Ghee Sweets & Traditional Savouries',
        subtitle: 'Slow-stirred in authentic copper urulis with cold-pressed oils and A2 ghee. No preservatives ever.',
        tagline: 'Heritage Kerala Kitchen',
        ctaText: 'Discover Collection',
        ctaLink: '/shop',
        badge: 'Diwali Special',
        backgroundColor: '#1E1B18',
        textColor: '#FFFFFF',
        accentColor: '#F59E0B'
      }
    ],
    popup: {
      enabled: true,
      title: '🪔 Shubh Deepavali Exclusive Offer',
      description: 'Celebrate the Festival of Lights with 20% off all festive hampers, Kozhikode halwas, and freshly fried banana crisps.',
      couponCode: 'DIWALI20',
      discountBadge: '20% OFF FESTIVE BOXES',
      ctaText: 'Shop Diwali Specials',
      ctaLink: '/shop',
      frequency: 'once_per_session'
    },
    countdown: {
      enabled: true,
      targetDate: '2026-11-15T23:59:59',
      label: 'Diwali Festive Savings End In'
    },
    atmosphere: {
      pageBackground: '#FDFBF7',
      sectionBackground: 'rgba(217, 119, 6, 0.04)',
      patternType: 'rangoli',
      patternOpacity: 0.08,
      borderColor: '#D97706',
      enableFloatingParticles: true
    },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'theme-christmas',
    preset: 'christmas',
    name: 'Christmas & Holiday Season',
    greeting: '🎄 Season\'s Greetings! Warm your winter gatherings with handcrafted Kerala halwa boxes.',
    announcementBadge: 'Holiday Joy',
    couponCode: 'JOY2026',
    isActive: false,
    intensity: 'rich',
    accentColor: '#15803D',
    badgeColor: '#BBF7D0',
    heroBannerHeadline: 'The Flavours of Christmas Cheer',
    heroBannerSubline: 'Delight loved ones with festive fruit halwas, spiced banana chips, and artisanal festive gift hampers.',
    heroCtaLabel: 'Shop Holiday Hampers',
    heroCtaLink: '/shop?festival=christmas',
    placements: { ...DEFAULT_FESTIVAL_PLACEMENTS },
    featuredProductIds: ['prod-2', 'prod-4', 'prod-5', 'prod-1'],
    productBadges: {
      'prod-2': 'gift_recommendation',
      'prod-4': 'festive_special',
      'prod-5': 'limited_collection',
      'prod-1': 'festival_bestseller'
    },
    promotions: [
      {
        id: 'promo-xmas-1',
        title: 'Artisan Christmas Gifting Hampers',
        subtitle: 'Heritage Kozhikode black halwa, dry fruit delights, and crisp coconut oil banana chips in custom holiday wooden boxes.',
        tagline: 'Warmth From Malabar',
        ctaText: 'Explore Holiday Boxes',
        ctaLink: '/shop',
        badge: 'Holiday Special',
        backgroundColor: '#0F291E',
        textColor: '#FFFFFF',
        accentColor: '#22C55E'
      }
    ],
    popup: {
      enabled: true,
      title: '🎄 Season\'s Greetings from ZaDa Foods',
      description: 'Make family gatherings joyous with authentic Kerala festive gift boxes. Use JOY2026 for exclusive holiday savings.',
      couponCode: 'JOY2026',
      discountBadge: 'FLAT 15% OFF',
      ctaText: 'Claim Festive Discount',
      ctaLink: '/shop',
      frequency: 'once_per_session'
    },
    countdown: {
      enabled: true,
      targetDate: '2026-12-25T23:59:59',
      label: 'Holiday Gifting Dispatch Cutoff In'
    },
    atmosphere: {
      pageBackground: '#FAFAF9',
      sectionBackground: 'rgba(21, 128, 61, 0.04)',
      patternType: 'snowflakes',
      patternOpacity: 0.07,
      borderColor: '#15803D',
      enableFloatingParticles: true
    },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'theme-new_year',
    preset: 'new_year',
    name: 'New Year Celebrations',
    greeting: '✨ Welcome 2027! Ring in new beginnings with authentic Malabar treats & exclusive festive savings.',
    announcementBadge: 'New Year Fest',
    couponCode: 'NEWYEAR15',
    isActive: false,
    intensity: 'rich',
    accentColor: '#B45309',
    badgeColor: '#FEF3C7',
    heroBannerHeadline: 'A Golden Start to the New Year',
    heroBannerSubline: 'Celebrate fresh beginnings with heritage sweets fried in pure ghee and golden banana crisps.',
    heroCtaLabel: 'Ring in the New Year',
    heroCtaLink: '/shop',
    placements: { ...DEFAULT_FESTIVAL_PLACEMENTS },
    featuredProductIds: ['prod-1', 'prod-3', 'prod-2'],
    productBadges: {
      'prod-1': 'festive_special',
      'prod-3': 'gift_recommendation',
      'prod-2': 'festival_bestseller'
    },
    promotions: [
      {
        id: 'promo-ny-1',
        title: 'Golden Celebrations Midnight Snack Box',
        subtitle: 'Crisp Wayanad banana chips, royal cashew halwa, and sweet treats crafted for midnight countdowns and family feasts.',
        tagline: 'Ring In 2027',
        ctaText: 'Order Celebration Pack',
        ctaLink: '/shop',
        badge: 'New Year Curation',
        backgroundColor: '#1C1917',
        textColor: '#FFFFFF',
        accentColor: '#F59E0B'
      }
    ],
    popup: {
      enabled: true,
      title: '✨ Welcome 2027 Celebration Offer',
      description: 'Start the year with pure, unadulterated flavours from Kerala. Enjoy 15% off across our entire store.',
      couponCode: 'NEWYEAR15',
      discountBadge: 'NEW YEAR OFFER',
      ctaText: 'Start Celebrations',
      ctaLink: '/shop',
      frequency: 'once_per_session'
    },
    countdown: {
      enabled: true,
      targetDate: '2027-01-01T00:00:00',
      label: 'New Year 2027 Countdown'
    },
    atmosphere: {
      pageBackground: '#FDFBF7',
      sectionBackground: 'rgba(180, 83, 9, 0.04)',
      patternType: 'stars',
      patternOpacity: 0.08,
      borderColor: '#B45309',
      enableFloatingParticles: true
    },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'theme-onam',
    preset: 'onam',
    name: 'Onam Harvest Festival',
    greeting: '🌸 Happy Onam! Celebrate Kerala\'s grand harvest with golden banana chips & royal halwas.',
    announcementBadge: 'Onasadhya Special',
    couponCode: 'ONAM20',
    isActive: false,
    intensity: 'rich',
    accentColor: '#CA8A04',
    badgeColor: '#FEF08A',
    heroBannerHeadline: 'Authentic Flavours of Onam Sadhya',
    heroBannerSubline: 'Thinly sliced Nendran bananas freshly fried in 100% pure cold-pressed coconut oil, true to Wayanad tradition.',
    heroCtaLabel: 'Order Sadhya Crunch',
    heroCtaLink: '/shop',
    placements: { ...DEFAULT_FESTIVAL_PLACEMENTS },
    featuredProductIds: ['prod-1', 'prod-2', 'prod-6', 'prod-5'],
    productBadges: {
      'prod-1': 'festive_special',
      'prod-2': 'gift_recommendation',
      'prod-6': 'limited_collection',
      'prod-5': 'festival_bestseller'
    },
    promotions: [
      {
        id: 'promo-onam-1',
        title: 'Grand Onasadhya Crunch Curation',
        subtitle: 'Authentic Wayanad Nendran banana chips, Sharkkara Upperi, and traditional Kozhikode halwas for your grand family feast.',
        tagline: 'Harvest Tradition',
        ctaText: 'Order Onam Box',
        ctaLink: '/shop',
        badge: 'Onam Essential',
        backgroundColor: '#1E293B',
        textColor: '#FFFFFF',
        accentColor: '#EAB308'
      }
    ],
    popup: {
      enabled: true,
      title: '🌸 Happy Onam from God\'s Own Country',
      description: 'Complete your Onasadhya feast with authentic Wayanad golden banana chips and traditional Kozhikode halwas.',
      couponCode: 'ONAM20',
      discountBadge: 'ONAM 20% OFF',
      ctaText: 'Explore Onam Selection',
      ctaLink: '/shop',
      frequency: 'once_per_session'
    },
    countdown: {
      enabled: true,
      targetDate: '2026-09-05T23:59:59',
      label: 'Onam Grand Harvest Offer Ends In'
    },
    atmosphere: {
      pageBackground: '#FFFDF5',
      sectionBackground: 'rgba(202, 138, 4, 0.05)',
      patternType: 'pookalam',
      patternOpacity: 0.08,
      borderColor: '#CA8A04',
      enableFloatingParticles: true
    },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'theme-eid',
    preset: 'eid',
    name: 'Eid Mubarak Celebrations',
    greeting: '🌙 Eid Mubarak! Share the timeless sweetness of Malabar delicacies with family & friends.',
    announcementBadge: 'Eid Treats',
    couponCode: 'EID2026',
    isActive: false,
    intensity: 'rich',
    accentColor: '#047857',
    badgeColor: '#A7F3D0',
    heroBannerHeadline: 'Blessed Gatherings & Sweet Memories',
    heroBannerSubline: 'Signature Kozhikode black halwa, royal cashew bites, and savoury banana crisps for your Eid festivities.',
    heroCtaLabel: 'Explore Eid Delicacies',
    heroCtaLink: '/shop',
    placements: { ...DEFAULT_FESTIVAL_PLACEMENTS },
    featuredProductIds: ['prod-2', 'prod-3', 'prod-5', 'prod-1'],
    productBadges: {
      'prod-2': 'gift_recommendation',
      'prod-3': 'festive_special',
      'prod-5': 'limited_collection'
    },
    promotions: [
      {
        id: 'promo-eid-1',
        title: 'Barakah Eid Gift Hamper',
        subtitle: 'Slow-cooked Kozhikode black halwa, pure cashew bites, and golden coconut oil crisps packed in royal emerald gifting sleeves.',
        tagline: 'Blessed Celebrations',
        ctaText: 'Gift Eid Hampers',
        ctaLink: '/shop',
        badge: 'Eid Special',
        backgroundColor: '#064E3B',
        textColor: '#FFFFFF',
        accentColor: '#34D399'
      }
    ],
    popup: {
      enabled: true,
      title: '🌙 Eid Mubarak from ZaDa Foods',
      description: 'Sweeten your festive gatherings with authentic Kozhikode halwas and traditional savouries. Enjoy special festival pricing.',
      couponCode: 'EID2026',
      discountBadge: 'EID SPECIAL',
      ctaText: 'Order Festive Sweets',
      ctaLink: '/shop',
      frequency: 'once_per_session'
    },
    countdown: {
      enabled: true,
      targetDate: '2026-03-31T23:59:59',
      label: 'Eid Festive Delivery Deadline In'
    },
    atmosphere: {
      pageBackground: '#F8FAF8',
      sectionBackground: 'rgba(4, 120, 87, 0.04)',
      patternType: 'arabesque',
      patternOpacity: 0.07,
      borderColor: '#047857',
      enableFloatingParticles: true
    },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  }
];

import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  Check,
  CheckCircle2,
  Eye,
  RotateCcw,
  Plus,
  Trash2,
  Sliders,
  Palette,
  Layers,
  Tag,
  Flame,
  Monitor,
  Tablet,
  Smartphone,
  Gift,
  Clock,
  Megaphone
} from 'lucide-react';
import { useFestival } from '../../context/FestivalContext';
import {
  FestivalTheme,
  DecorativeIntensity,
  FestivalProductBadgeType,
  FestivalPromotion
} from '../../types/festival';
import { FestivalMotif, CornerFlourish } from '../../components/festival/FestivalMotifs';
import { useAdminData } from '../../context/AdminDataContext';

export const AdminFestivals: React.FC = () => {
  const {
    themes,
    activeTheme,
    previewTheme,
    activateTheme,
    updateTheme,
    createCustomTheme,
    deleteTheme,
    resetToDefault,
    setPreviewTheme
  } = useFestival();

  const { products } = useAdminData();

  // Selected theme for editing
  const [editingTheme, setEditingTheme] = useState<FestivalTheme>(() => {
    return activeTheme || themes[0];
  });

  const [activeTab, setActiveTab] = useState<'visuals' | 'badges' | 'promotions' | 'popup'>('visuals');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const [isResetConfirmModalOpen, setIsResetConfirmModalOpen] = useState(false);
  const [isResettingDefault, setIsResettingDefault] = useState(false);

  // Festival Promotional Artwork Direct URL Validation
  const [artStatus, setArtStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [artDimensions, setArtDimensions] = useState<{ width: number; height: number } | null>(null);
  const [artErrorMsg, setArtErrorMsg] = useState('');
  const [artRetryKey, setArtRetryKey] = useState(0);

  React.useEffect(() => {
    const trimmed = (editingTheme.promotionalImageUrl || '').trim().replace(/^["']|["']$/g, '');
    if (!trimmed) {
      setArtStatus('idle');
      setArtDimensions(null);
      setArtErrorMsg('');
      return;
    }
    const isValid = trimmed.startsWith('/') || /^https?:\/\//i.test(trimmed);
    if (!isValid) {
      setArtStatus('invalid');
      setArtDimensions(null);
      setArtErrorMsg('URL must begin with https://, http://, or /assets/');
      return;
    }
    setArtStatus('validating');
    setArtErrorMsg('');
    const img = new Image();
    img.referrerPolicy = 'no-referrer';
    let isCancelled = false;
    img.onload = () => {
      if (!isCancelled) {
        setArtStatus('valid');
        setArtDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setArtErrorMsg('');
      }
    };
    img.onerror = () => {
      if (!isCancelled) {
        setArtStatus('invalid');
        setArtDimensions(null);
        setArtErrorMsg('Unable to load festival artwork from direct URL.');
      }
    };
    if (artRetryKey > 0 && /^https?:\/\//i.test(trimmed)) {
      const sep = trimmed.includes('?') ? '&' : '?';
      img.src = `${trimmed}${sep}_retry=${Date.now()}`;
    } else {
      img.src = trimmed;
    }
    return () => {
      isCancelled = true;
    };
  }, [editingTheme.promotionalImageUrl, artRetryKey]);

  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customGreeting, setCustomGreeting] = useState('');
  const [customCoupon, setCustomCoupon] = useState('');
  const [customColor, setCustomColor] = useState('#A67732');

  const handleSelectPreset = (theme: FestivalTheme) => {
    setEditingTheme(theme);
    setIsCreatingCustom(false);
  };

  const handleSaveEditing = async () => {
    await updateTheme(editingTheme);
  };

  const handleActivateCurrent = async () => {
    await activateTheme(editingTheme.id);
    setEditingTheme((prev) => ({ ...prev, isActive: true }));
  };

  const handleCreateCustom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customName.trim()) return;

    const res = await createCustomTheme({
      name: customName.trim(),
      preset: 'custom',
      greeting: customGreeting.trim() || `Celebrate ${customName.trim()} with handcrafted Kerala treats.`,
      announcementBadge: `${customName.trim()} Special`,
      couponCode: customCoupon.trim().toUpperCase() || undefined,
      isActive: false,
      intensity: 'balanced',
      accentColor: customColor,
      badgeColor: '#FDE68A',
      placements: {
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
      },
      featuredProductIds: products.slice(0, 3).map((p) => p.id),
      productBadges: {
        [products[0]?.id || 'prod-1']: 'festive_special',
        [products[1]?.id || 'prod-2']: 'gift_recommendation'
      },
      promotions: [
        {
          id: `promo-custom-1`,
          title: `${customName.trim()} Curated Box`,
          subtitle: `Handpicked Kerala sweets and chips crafted for ${customName.trim()}.`,
          ctaText: 'Shop Special Selection',
          ctaLink: '/shop',
          badge: `${customName.trim()} Pick`
        }
      ],
      popup: {
        enabled: true,
        title: `Celebrate ${customName.trim()} with ZaDa Foods`,
        description: `Enjoy special holiday pricing across our pure coconut oil snacks and authentic sweets.`,
        couponCode: customCoupon.trim().toUpperCase() || undefined,
        frequency: 'once_per_session'
      }
    });

    if (res.success && res.data) {
      setEditingTheme(res.data);
      setIsCreatingCustom(false);
      setCustomName('');
      setCustomGreeting('');
      setCustomCoupon('');
    }
  };

  const toggleFeaturedProduct = (prodId: string) => {
    const current = editingTheme.featuredProductIds || [];
    const next = current.includes(prodId)
      ? current.filter((id) => id !== prodId)
      : [...current, prodId];
    setEditingTheme({ ...editingTheme, featuredProductIds: next });
  };

  const setProductBadge = (prodId: string, badgeType: FestivalProductBadgeType | 'none') => {
    const currentBadges = { ...(editingTheme.productBadges || {}) };
    if (badgeType === 'none') {
      delete currentBadges[prodId];
    } else {
      currentBadges[prodId] = badgeType;
    }
    setEditingTheme({ ...editingTheme, productBadges: currentBadges });
  };

  const PRESET_COLORS = [
    { label: 'Diwali Gold', value: '#D97706' },
    { label: 'Christmas Pine', value: '#15803D' },
    { label: 'New Year Bronze', value: '#B45309' },
    { label: 'Onam Kasavu Yellow', value: '#CA8A04' },
    { label: 'Eid Emerald', value: '#047857' },
    { label: 'ZaDa Heritage Gold', value: '#A67732' }
  ];

  const INTENSITY_LEVELS: { id: DecorativeIntensity; label: string; desc: string }[] = [
    { id: 'subtle', label: 'subtle', desc: 'Small decorations & accent colors' },
    { id: 'balanced', label: 'balanced', desc: 'Noticeable storefront decorations' },
    { id: 'rich', label: 'rich', desc: 'Themed backgrounds & campaigns' },
    { id: 'grand', label: 'grand', desc: 'Full immersive festive takeover' },
    { id: 'festive', label: 'festive', desc: 'Celebratory holiday experience' }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-content-primary flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-brand-primary" />
            <span>Festival Themes & Seasonal Promotions</span>
          </h1>
          <p className="text-xs text-content-muted mt-1">
            Transform the entire storefront into an immersive festive shopping experience (Diwali, Christmas, New Year, Onam, Eid) with configurable visual intensity.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            onClick={() => setIsCreatingCustom(true)}
            className="px-3.5 py-2 rounded-btn bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Campaign</span>
          </button>

          <button
            onClick={() => setIsResetConfirmModalOpen(true)}
            className="px-3.5 py-2 rounded-btn bg-canvas-subtle border border-border-subtle hover:bg-canvas text-content-secondary text-xs font-medium transition-colors flex items-center gap-1.5"
            title="Deactivate all festival overlays and return to clean default ZaDa aesthetic"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Default ZaDa</span>
          </button>
        </div>
      </div>

      {/* 2. Active Theme Summary Banner */}
      <div
        className="rounded-card border p-4 sm:p-5 transition-all shadow-xs"
        style={{
          borderColor: activeTheme?.preset === 'default' ? '#EAE5DC' : `${activeTheme?.accentColor}66`,
          backgroundColor: activeTheme?.preset === 'default' ? '#FFFFFF' : '#FAF6EE'
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: activeTheme?.preset === 'default' ? '#072C20' : '#072C20',
                borderColor: activeTheme?.accentColor || '#A67732'
              }}
            >
              {activeTheme && <FestivalMotif preset={activeTheme.preset} size={24} color={activeTheme.accentColor} />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-base text-content-primary">
                  {activeTheme?.name}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    activeTheme?.preset === 'default'
                      ? 'bg-stone-100 text-stone-700'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  {activeTheme?.preset === 'default' ? 'Active Standard Storefront' : 'Active Festive Theme'}
                </span>
                {activeTheme?.preset !== 'default' && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                    Intensity: {activeTheme?.intensity}
                  </span>
                )}
              </div>
              <p className="text-xs text-content-muted mt-0.5 max-w-xl truncate">
                {activeTheme?.greeting}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {previewTheme ? (
              <button
                onClick={() => setPreviewTheme(null)}
                className="px-3 py-1.5 rounded-pill text-xs font-bold bg-amber-500 text-stone-900 flex items-center gap-1.5 shadow-sm"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Exit Preview</span>
              </button>
            ) : (
              <button
                onClick={() => setPreviewTheme(editingTheme)}
                className="px-3 py-1.5 rounded-pill text-xs font-bold bg-canvas-subtle border border-border hover:bg-canvas text-content-primary flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview Current Theme</span>
              </button>
            )}

            <button
              onClick={() => handleSelectPreset(activeTheme || themes[0])}
              className="px-3 py-1.5 rounded-pill text-xs font-bold bg-white border border-border hover:border-brand-primary text-brand-primary"
            >
              Configure Active
            </button>
          </div>
        </div>
      </div>

      {/* 3. New Custom Campaign Drawer */}
      {isCreatingCustom && (
        <div className="bg-white rounded-card border border-brand-primary/40 p-5 shadow-card space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-base text-content-primary flex items-center gap-2">
              <Plus className="w-4 h-4 text-brand-primary" />
              <span>Create Custom Festival or Campaign</span>
            </h2>
            <button
              onClick={() => setIsCreatingCustom(false)}
              className="text-xs text-content-muted hover:text-content-primary"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-content-primary mb-1">Campaign Name *</label>
              <input
                type="text"
                placeholder="e.g. Kerala Monsoon Festival, Vishu Treats"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-input border border-border focus:ring-1 focus:ring-brand-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-content-primary mb-1">Coupon Code (Optional)</label>
              <input
                type="text"
                placeholder="e.g. MONSOON15"
                value={customCoupon}
                onChange={(e) => setCustomCoupon(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-input border border-border focus:ring-1 focus:ring-brand-primary outline-none uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-content-primary mb-1">Greeting & Announcement</label>
              <input
                type="text"
                placeholder="e.g. Celebrate Kerala's harvest festival with crisp coconut oil snacks."
                value={customGreeting}
                onChange={(e) => setCustomGreeting(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-input border border-border focus:ring-1 focus:ring-brand-primary outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-content-primary">Accent Color:</label>
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-7 h-7 rounded border border-border cursor-pointer"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingCustom(false)}
                className="px-3.5 py-1.5 text-xs text-content-secondary hover:text-content-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCreateCustom()}
                className="px-4 py-1.5 rounded-btn bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover shadow-sm"
              >
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Festival Presets Cards Strip */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-content-primary uppercase tracking-wider">
            Festival Presets (Select to Configure)
          </label>
          <span className="text-[11px] text-content-muted">6 Curated Design Systems</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
          {themes.map((theme) => {
            const isCurEditing = editingTheme.id === theme.id;
            const isLive = theme.isActive;

            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleSelectPreset(theme)}
                className={`relative p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isCurEditing
                    ? 'border-brand-primary ring-2 ring-brand-primary/20 bg-amber-50/40 shadow-xs'
                    : 'border-border bg-white hover:border-brand-primary/50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: theme.preset === 'default' ? '#072C20' : '#072C20',
                      borderColor: theme.accentColor
                    }}
                  >
                    <FestivalMotif preset={theme.preset} size={16} color={theme.accentColor} />
                  </div>
                  {isLive && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                  )}
                </div>

                <div>
                  <span className="block font-serif font-bold text-xs text-content-primary leading-tight truncate">
                    {theme.name}
                  </span>
                  <span className="block text-[10px] text-content-muted mt-0.5 truncate">
                    {theme.preset === 'default' ? 'Standard Brand' : theme.intensity}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Theme Configuration & Multi-Device Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Editor Tabs (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-card border border-border p-5 shadow-card space-y-5">
          {/* Header of editing section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
                style={{ backgroundColor: '#072C20', borderColor: editingTheme.accentColor }}
              >
                <FestivalMotif preset={editingTheme.preset} size={18} color={editingTheme.accentColor} />
              </div>
              <div>
                <h2 className="font-serif font-bold text-sm text-content-primary">
                  Theme Settings: {editingTheme.name}
                </h2>
                <p className="text-[11px] text-content-muted">
                  Preset: <span className="font-mono uppercase">{editingTheme.preset}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {editingTheme.preset === 'custom' && (
                <button
                  type="button"
                  onClick={() => deleteTheme(editingTheme.id)}
                  className="p-1.5 rounded-btn text-rose-600 hover:bg-rose-50 border border-rose-200"
                  title="Delete Custom Theme"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={handleActivateCurrent}
                disabled={editingTheme.isActive}
                className={`px-3 py-1.5 rounded-btn text-xs font-bold transition-all flex items-center gap-1.5 ${
                  editingTheme.isActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 cursor-default'
                    : 'bg-brand-primary text-white hover:bg-brand-primary-hover shadow-xs'
                }`}
              >
                {editingTheme.isActive ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Currently Live</span>
                  </>
                ) : (
                  <>
                    <Flame className="w-3.5 h-3.5 text-amber-300" />
                    <span>Publish & Activate</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sub-Tabs: Visuals & Atmosphere | Product Badges | Promotions | Popup */}
          <div className="flex border-b border-border text-xs font-bold">
            {[
              { id: 'visuals', label: '1. Visuals & Atmosphere', icon: Sliders },
              { id: 'badges', label: '2. Product Badges', icon: Tag },
              { id: 'promotions', label: '3. Campaigns & Countdown', icon: Gift },
              { id: 'popup', label: '4. Offer Popup', icon: Megaphone }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition-colors ${
                    isActive
                      ? 'border-brand-primary text-brand-primary'
                      : 'border-transparent text-content-muted hover:text-content-primary'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: Visuals & Atmosphere */}
          {activeTab === 'visuals' && (
            <div className="space-y-4">
              {/* Theme Name & Announcement Pill */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-content-primary mb-1">Theme Title</label>
                  <input
                    type="text"
                    value={editingTheme.name}
                    onChange={(e) => setEditingTheme({ ...editingTheme, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-input border border-border focus:ring-1 focus:ring-brand-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-content-primary mb-1">Announcement Pill Badge</label>
                  <input
                    type="text"
                    placeholder="e.g. Diwali Dhamaka"
                    value={editingTheme.announcementBadge || ''}
                    onChange={(e) => setEditingTheme({ ...editingTheme, announcementBadge: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-input border border-border focus:ring-1 focus:ring-brand-primary outline-none"
                  />
                </div>
              </div>

              {/* Greeting & Coupon */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-content-primary mb-1">Announcement Greeting</label>
                  <input
                    type="text"
                    value={editingTheme.greeting}
                    onChange={(e) => setEditingTheme({ ...editingTheme, greeting: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-input border border-border focus:ring-1 focus:ring-brand-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-content-primary mb-1">Promotional Coupon</label>
                  <input
                    type="text"
                    placeholder="e.g. DIWALI20"
                    value={editingTheme.couponCode || ''}
                    onChange={(e) => setEditingTheme({ ...editingTheme, couponCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs rounded-input border border-border focus:ring-1 focus:ring-brand-primary outline-none uppercase"
                  />
                </div>
              </div>

              {/* 4-Level Visual Intensity Selector */}
              <div>
                <label className="block text-xs font-bold text-content-primary mb-1.5 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Configurable Visual Intensity (4 Levels)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {INTENSITY_LEVELS.map((lvl) => {
                    const isCur =
                      editingTheme.intensity === lvl.id ||
                      (lvl.id === 'balanced' && editingTheme.intensity === 'moderate') ||
                      (lvl.id === 'grand' && editingTheme.intensity === 'festive');

                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        aria-label={lvl.id}
                        onClick={() => setEditingTheme({ ...editingTheme, intensity: lvl.id })}
                        className={`p-2 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          isCur
                            ? 'bg-brand-primary text-white border-brand-primary shadow-xs ring-2 ring-brand-primary/20'
                            : 'bg-white text-content-secondary border-border hover:border-brand-primary/50'
                        }`}
                      >
                        <span className="font-bold text-xs capitalize">{lvl.label}</span>
                        <span className={`text-[9px] mt-0.5 line-clamp-2 leading-tight ${isCur ? 'text-amber-100' : 'text-content-muted'}`}>
                          {lvl.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accent Color Palette */}
              <div>
                <label className="block text-xs font-bold text-content-primary mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Festival Accent Color</span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_COLORS.map((col) => (
                    <button
                      key={col.value}
                      type="button"
                      onClick={() => setEditingTheme({ ...editingTheme, accentColor: col.value })}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-[11px] border transition-all ${
                        editingTheme.accentColor === col.value
                          ? 'border-brand-primary ring-2 ring-brand-primary/20 font-bold bg-amber-50'
                          : 'border-border bg-white text-content-secondary'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: col.value }} />
                      <span>{col.label}</span>
                    </button>
                  ))}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-[11px] text-content-muted">Custom:</span>
                    <input
                      type="color"
                      value={editingTheme.accentColor || '#A67732'}
                      onChange={(e) => setEditingTheme({ ...editingTheme, accentColor: e.target.value })}
                      className="w-6 h-6 rounded border border-border cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Optional Festival Artwork (Direct URL Only — Zero File Uploads) */}
              <div className="p-3 bg-canvas-subtle rounded-xl border border-border-subtle space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-content-primary flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
                    <span>Festival Promotional Artwork (Direct URL Link)</span>
                  </label>
                  <span className="text-[10px] text-content-muted">
                    Direct Image URL Only • No File Uploads
                  </span>
                </div>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={editingTheme.promotionalImageUrl || ''}
                    onChange={(e) =>
                      setEditingTheme({
                        ...editingTheme,
                        promotionalImageUrl: e.target.value.trim() || undefined
                      })
                    }
                    placeholder="https://images.unsplash.com/... or /assets/..."
                    className="w-full px-3 py-2 text-xs rounded-input border border-border bg-white font-mono outline-none"
                  />
                  {editingTheme.promotionalImageUrl && (
                    <div className="flex items-center gap-2 pt-1 text-[11px]">
                      {artStatus === 'valid' && (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Direct image valid ({artDimensions?.width} × {artDimensions?.height}px)
                        </span>
                      )}
                      {artStatus === 'validating' && (
                        <span className="text-stone-500 font-medium">Validating image URL...</span>
                      )}
                      {artStatus === 'invalid' && (
                        <div className="flex items-center gap-2">
                          <span className="text-rose-600 font-medium">{artErrorMsg || 'Unable to load'}</span>
                          <button
                            type="button"
                            onClick={() => setArtRetryKey((k) => k + 1)}
                            className="px-2 py-0.5 rounded bg-white border border-rose-300 text-rose-700 font-bold text-[10px]"
                          >
                            Retry
                          </button>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setEditingTheme({
                            ...editingTheme,
                            promotionalImageUrl: undefined
                          })
                        }
                        className="ml-auto text-[10px] text-content-muted hover:text-rose-600"
                      >
                        Clear Artwork
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Background & Surface Atmosphere Colors */}
              <div className="p-3 bg-canvas-subtle rounded-xl border border-border-subtle space-y-2">
                <label className="block text-xs font-bold text-content-primary flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Background &amp; Surface Atmosphere Colors</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-content-secondary mb-1">Page Canvas Background</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editingTheme.atmosphere?.pageBackground || '#FBF8F4'}
                        onChange={(e) =>
                          setEditingTheme({
                            ...editingTheme,
                            atmosphere: {
                              ...editingTheme.atmosphere,
                              pageBackground: e.target.value
                            }
                          })
                        }
                        className="w-7 h-7 rounded border border-border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={editingTheme.atmosphere?.pageBackground || '#FBF8F4'}
                        onChange={(e) =>
                          setEditingTheme({
                            ...editingTheme,
                            atmosphere: {
                              ...editingTheme.atmosphere,
                              pageBackground: e.target.value
                            }
                          })
                        }
                        className="flex-1 px-2.5 py-1 text-xs rounded border border-border bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-content-secondary mb-1">Section Surface Card</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editingTheme.atmosphere?.sectionBackground || '#F7F3EB'}
                        onChange={(e) =>
                          setEditingTheme({
                            ...editingTheme,
                            atmosphere: {
                              ...editingTheme.atmosphere,
                              sectionBackground: e.target.value
                            }
                          })
                        }
                        className="w-7 h-7 rounded border border-border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={editingTheme.atmosphere?.sectionBackground || '#F7F3EB'}
                        onChange={(e) =>
                          setEditingTheme({
                            ...editingTheme,
                            atmosphere: {
                              ...editingTheme.atmosphere,
                              sectionBackground: e.target.value
                            }
                          })
                        }
                        className="flex-1 px-2.5 py-1 text-xs rounded border border-border bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Placements */}
              <div>
                <label className="block text-xs font-bold text-content-primary mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Decoration Placement Locations</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'announcementBar', label: 'Top Announcement Bar' },
                    { key: 'headerMotif', label: 'Header Logo Festive Motif' },
                    { key: 'heroBanners', label: 'Hero Banners & Countdown' },
                    { key: 'productCards', label: 'Product Card Badges' },
                    { key: 'cardRibbons', label: 'Festive Product Corner Ribbons' },
                    { key: 'sectionDividers', label: 'Section Ornamental Dividers' },
                    { key: 'promoBanners', label: 'Promotional Split Banners' },
                    { key: 'ambientBackground', label: 'Atmospheric Background & SVG Pattern' },
                    { key: 'fallingParticles', label: 'Ambient Particles (Snow / Petals / Sparks)' },
                    { key: 'headerMotion', label: 'Header Motion (Santa Sleigh / Swinging Lanterns / Diyas)' },
                    { key: 'stringLights', label: 'Twinkling Fairy Lights Garland' },
                    { key: 'interactiveSparkles', label: 'Interactive Cart & Checkout Sparkles' },
                    { key: 'footerMotif', label: 'Footer Celebration Accent' }
                  ].map((item) => {
                    const isChecked = Boolean(
                      editingTheme.placements?.[item.key as keyof typeof editingTheme.placements] !== false
                    );
                    return (
                      <label
                        key={item.key}
                        className="flex items-center gap-2 p-2 rounded-lg border border-border-subtle bg-white hover:bg-canvas-subtle/50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            setEditingTheme({
                              ...editingTheme,
                              placements: {
                                ...editingTheme.placements,
                                [item.key]: e.target.checked
                              }
                            });
                          }}
                          className="rounded text-brand-primary focus:ring-brand-primary"
                        />
                        <span className="text-content-secondary font-medium">{item.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Date Schedule */}
              <div className="p-3 bg-canvas-subtle rounded-xl border border-border-subtle space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-content-primary">
                  <Calendar className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Activation & Expiry Dates (Optional Schedule)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-content-secondary mb-1">Start Date</label>
                    <input
                      type="date"
                      value={editingTheme.startDate ? editingTheme.startDate.split('T')[0] : ''}
                      onChange={(e) =>
                        setEditingTheme({
                          ...editingTheme,
                          startDate: e.target.value ? new Date(e.target.value).toISOString() : undefined
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded-input border border-border bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-content-secondary mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={editingTheme.endDate ? editingTheme.endDate.split('T')[0] : ''}
                      onChange={(e) =>
                        setEditingTheme({
                          ...editingTheme,
                          endDate: e.target.value ? new Date(e.target.value).toISOString() : undefined
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded-input border border-border bg-white outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Product Badges */}
          {activeTab === 'badges' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-content-primary mb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Assign 4 Festive Badge Types to Catalog Products</span>
                </h3>
                <p className="text-[11px] text-content-muted">
                  Assign festive badges to highlight specific products without obscuring product photos or altering prices.
                </p>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {products.map((p) => {
                  const assigned = editingTheme.productBadges?.[p.id];
                  const isFeatured = editingTheme.featuredProductIds?.includes(p.id);

                  return (
                    <div
                      key={p.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl border border-border-subtle bg-white hover:bg-canvas-subtle/40"
                    >
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleFeaturedProduct(p.id)}
                          className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold border transition-colors ${
                            isFeatured ? 'bg-amber-400 text-stone-900 border-amber-500' : 'bg-stone-100 border-border'
                          }`}
                          title="Toggle featured status"
                        >
                          {isFeatured ? '✓' : ''}
                        </button>
                        <span className="text-xs font-semibold text-stone-800">{p.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <select
                          value={assigned || 'none'}
                          onChange={(e) => setProductBadge(p.id, e.target.value as any)}
                          className="px-2.5 py-1 text-xs rounded-lg border border-border bg-stone-50 text-stone-800 outline-none"
                        >
                          <option value="none">No Badge</option>
                          <option value="festive_special">Festive Special</option>
                          <option value="gift_recommendation">Gift Recommendation</option>
                          <option value="festival_bestseller">Festival Bestseller</option>
                          <option value="limited_collection">Limited Festive Collection</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Campaigns & Countdown */}
          {activeTab === 'promotions' && (
            <div className="space-y-4">
              {/* Countdown Configuration */}
              <div className="p-3.5 rounded-xl border border-border-subtle bg-canvas-subtle/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-content-primary flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-primary" />
                    <span>Countdown Timer</span>
                  </span>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingTheme.countdown?.enabled)}
                      onChange={(e) =>
                        setEditingTheme({
                          ...editingTheme,
                          countdown: {
                            enabled: e.target.checked,
                            targetDate: editingTheme.countdown?.targetDate || '2026-11-15T23:59:59',
                            label: editingTheme.countdown?.label || `${editingTheme.name} Offer Ends In`
                          }
                        })
                      }
                      className="rounded text-brand-primary focus:ring-brand-primary"
                    />
                    <span className="font-semibold text-stone-700">Enable Countdown</span>
                  </label>
                </div>

                {editingTheme.countdown?.enabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] text-content-secondary mb-1">Target Date & Time</label>
                      <input
                        type="datetime-local"
                        value={
                          editingTheme.countdown.targetDate
                            ? editingTheme.countdown.targetDate.slice(0, 16)
                            : ''
                        }
                        onChange={(e) =>
                          setEditingTheme({
                            ...editingTheme,
                            countdown: {
                              ...editingTheme.countdown!,
                              targetDate: e.target.value
                            }
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded-input border border-border bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-content-secondary mb-1">Countdown Label</label>
                      <input
                        type="text"
                        value={editingTheme.countdown.label || ''}
                        onChange={(e) =>
                          setEditingTheme({
                            ...editingTheme,
                            countdown: {
                              ...editingTheme.countdown!,
                              label: e.target.value
                            }
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded-input border border-border bg-white outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Promotional Split Banners */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-content-primary flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-brand-primary" />
                    <span>Split Editorial Banners & Hampers</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const newPromo: FestivalPromotion = {
                        id: `promo-${Date.now()}`,
                        title: `${editingTheme.name} Special Hamper`,
                        subtitle: 'Artisanal Kozhikode halwas and crunchy coconut oil crisps.',
                        ctaText: 'Explore Collection',
                        ctaLink: '/shop',
                        badge: 'Festive Special'
                      };
                      setEditingTheme({
                        ...editingTheme,
                        promotions: [...(editingTheme.promotions || []), newPromo]
                      });
                    }}
                    className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Promotional Banner</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {(editingTheme.promotions || []).map((promo, idx) => (
                    <div
                      key={promo.id}
                      className="p-3 rounded-xl border border-border-subtle bg-white space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-800">Banner #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const filtered = (editingTheme.promotions || []).filter((p) => p.id !== promo.id);
                            setEditingTheme({ ...editingTheme, promotions: filtered });
                          }}
                          className="text-rose-600 hover:text-rose-800 text-[11px]"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Banner Headline"
                          value={promo.title}
                          onChange={(e) => {
                            const updated = [...(editingTheme.promotions || [])];
                            updated[idx].title = e.target.value;
                            setEditingTheme({ ...editingTheme, promotions: updated });
                          }}
                          className="px-2.5 py-1.5 text-xs rounded border border-border outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Badge (e.g. Diwali Special)"
                          value={promo.badge || ''}
                          onChange={(e) => {
                            const updated = [...(editingTheme.promotions || [])];
                            updated[idx].badge = e.target.value;
                            setEditingTheme({ ...editingTheme, promotions: updated });
                          }}
                          className="px-2.5 py-1.5 text-xs rounded border border-border outline-none"
                        />
                      </div>

                      <textarea
                        rows={2}
                        placeholder="Banner Description / Subtitle"
                        value={promo.subtitle}
                        onChange={(e) => {
                          const updated = [...(editingTheme.promotions || [])];
                          updated[idx].subtitle = e.target.value;
                          setEditingTheme({ ...editingTheme, promotions: updated });
                        }}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-border outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Popup Offer */}
          {activeTab === 'popup' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                <div>
                  <h3 className="text-xs font-bold text-content-primary flex items-center gap-1.5">
                    <Megaphone className="w-3.5 h-3.5 text-brand-primary" />
                    <span>First-Visit Promotional Modal</span>
                  </h3>
                  <p className="text-[11px] text-content-muted">
                    Displays an elegant festival greeting and discount code on customer arrival.
                  </p>
                </div>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingTheme.popup?.enabled)}
                    onChange={(e) =>
                      setEditingTheme({
                        ...editingTheme,
                        popup: {
                          enabled: e.target.checked,
                          title: editingTheme.popup?.title || `${editingTheme.name} Special Offer`,
                          description:
                            editingTheme.popup?.description ||
                            `Celebrate with authentic Kerala snacks and exclusive savings.`,
                          couponCode: editingTheme.couponCode,
                          discountBadge: editingTheme.popup?.discountBadge || 'FESTIVE OFFER',
                          frequency: 'once_per_session'
                        }
                      })
                    }
                    className="rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="font-semibold text-stone-700">Enable Popup</span>
                </label>
              </div>

              {editingTheme.popup?.enabled && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-content-secondary mb-1">Modal Headline</label>
                    <input
                      type="text"
                      value={editingTheme.popup.title}
                      onChange={(e) =>
                        setEditingTheme({
                          ...editingTheme,
                          popup: { ...editingTheme.popup!, title: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-input border border-border outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-content-secondary mb-1">Modal Description</label>
                    <textarea
                      rows={2}
                      value={editingTheme.popup.description}
                      onChange={(e) =>
                        setEditingTheme({
                          ...editingTheme,
                          popup: { ...editingTheme.popup!, description: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-input border border-border outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-content-secondary mb-1">Discount Badge Label</label>
                      <input
                        type="text"
                        value={editingTheme.popup.discountBadge || ''}
                        onChange={(e) =>
                          setEditingTheme({
                            ...editingTheme,
                            popup: { ...editingTheme.popup!, discountBadge: e.target.value }
                          })
                        }
                        className="w-full px-3 py-1.5 text-xs rounded-input border border-border outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-content-secondary mb-1">Display Frequency</label>
                      <select
                        value={editingTheme.popup.frequency || 'once_per_session'}
                        onChange={(e) =>
                          setEditingTheme({
                            ...editingTheme,
                            popup: { ...editingTheme.popup!, frequency: e.target.value as any }
                          })
                        }
                        className="w-full px-3 py-1.5 text-xs rounded-input border border-border outline-none bg-white"
                      >
                        <option value="once_per_session">Once Per Browser Session</option>
                        <option value="once_per_day">Once Per Day</option>
                        <option value="always">Always on Visit (Testing)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPreviewTheme(editingTheme)}
              className="px-3.5 py-2 rounded-btn bg-canvas-subtle border border-border text-content-primary text-xs font-bold hover:bg-canvas flex items-center gap-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-brand-primary" />
              <span>Preview on Storefront</span>
            </button>

            <button
              type="button"
              onClick={handleSaveEditing}
              className="px-5 py-2 rounded-btn bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover shadow-sm transition-colors"
            >
              Save Theme Changes
            </button>
          </div>
        </div>

        {/* Right Column: Multi-Device Live Storefront Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-3 sticky top-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-sm text-content-primary flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-brand-primary" />
              <span>Live Visual Preview</span>
            </h2>

            {/* Device Switcher: Desktop | Tablet | Mobile */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                  previewDevice === 'desktop'
                    ? 'bg-white text-brand-primary shadow-xs font-bold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Desktop View"
                aria-label="Desktop Preview"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[10px]">Desktop</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewDevice('tablet')}
                className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                  previewDevice === 'tablet'
                    ? 'bg-white text-brand-primary shadow-xs font-bold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Tablet View"
                aria-label="Tablet Preview"
              >
                <Tablet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[10px]">Tablet</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                  previewDevice === 'mobile'
                    ? 'bg-white text-brand-primary shadow-xs font-bold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Mobile View"
                aria-label="Mobile Preview"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[10px]">Mobile</span>
              </button>
            </div>
          </div>

          {/* Responsive Preview Frame */}
          <div
            className={`transition-all duration-300 space-y-3.5 p-3 rounded-2xl border bg-stone-50 shadow-inner ${
              previewDevice === 'mobile'
                ? 'max-w-[320px] mx-auto border-stone-400'
                : previewDevice === 'tablet'
                ? 'max-w-[420px] mx-auto border-stone-300'
                : 'w-full border-border-subtle'
            }`}
          >
            {/* Preview Component 1: Announcement Bar */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-content-muted uppercase tracking-wider">
                A. Top Announcement Bar
              </span>
              <div
                className="rounded-lg p-2.5 text-white text-xs shadow-xs transition-colors"
                style={{
                  backgroundColor: '#072C20',
                  borderBottom: `2px solid ${editingTheme.accentColor}`
                }}
              >
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 truncate">
                    <FestivalMotif preset={editingTheme.preset} size={15} color={editingTheme.accentColor} />
                    {editingTheme.announcementBadge && (
                      <span
                        className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold text-stone-900 shrink-0 uppercase"
                        style={{ backgroundColor: editingTheme.badgeColor || '#FDE68A' }}
                      >
                        {editingTheme.announcementBadge}
                      </span>
                    )}
                    <span className="truncate">{editingTheme.greeting}</span>
                  </div>
                  {editingTheme.couponCode && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/20 text-amber-300 shrink-0">
                      {editingTheme.couponCode}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Component 2: Hero Banner Overlay */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-content-muted uppercase tracking-wider">
                B. Hero Banner & Corner Flourishes
              </span>
              <div className="relative rounded-xl overflow-hidden bg-[#072C20] text-white p-5 border border-border-subtle shadow-xs min-h-[140px] flex flex-col justify-between">
                {editingTheme.placements?.heroBanners !== false && editingTheme.preset !== 'default' && (
                  <>
                    <CornerFlourish
                      preset={editingTheme.preset}
                      position="top-right"
                      size={32}
                      color={editingTheme.accentColor}
                    />
                    <CornerFlourish
                      preset={editingTheme.preset}
                      position="bottom-left"
                      size={32}
                      color={editingTheme.accentColor}
                    />
                    <div className="absolute top-2 right-2">
                      <FestivalMotif preset={editingTheme.preset} size={16} color={editingTheme.accentColor} />
                    </div>
                  </>
                )}

                <div className="relative z-10 space-y-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#A67732]/30 text-amber-200 border border-amber-300/30 uppercase">
                    {editingTheme.announcementBadge || 'Authentic Malabar'}
                  </span>
                  <h3 className="font-serif font-bold text-base text-white">
                    {editingTheme.heroBannerHeadline || 'Crafted with Care. Rooted in Kerala.'}
                  </h3>
                  <p className="text-[10px] text-stone-300 line-clamp-2">
                    {editingTheme.heroBannerSubline ||
                      'Thinly sliced Nendran bananas fried fresh in pure cold-pressed coconut oil.'}
                  </p>
                </div>

                <div className="relative z-10 pt-2 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-md text-[10px] font-bold bg-[#A67732] text-white shadow-xs">
                    {editingTheme.heroCtaLabel || 'Explore Products →'}
                  </span>
                  <span className="text-[9px] text-stone-400">Preserves contrast & typography</span>
                </div>
              </div>
            </div>

            {/* Preview Component 3: Product Card with Festive Badge */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-content-muted uppercase tracking-wider">
                C. Product Card with Festive Badges
              </span>
              <div className="bg-white rounded-xl border border-border-subtle p-3 shadow-xs flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-lg bg-[#FAF6EE] overflow-hidden shrink-0 flex items-center justify-center border border-border-subtle">
                  <span className="text-2xl">🍌</span>
                  {editingTheme.placements?.productCards !== false && editingTheme.preset !== 'default' && (
                    <div className="absolute top-1 left-1">
                      <span
                        className="px-1.5 py-0.2 rounded-full text-[8px] font-extrabold text-stone-900 shadow-xs flex items-center gap-0.5"
                        style={{ backgroundColor: editingTheme.badgeColor || '#FDE68A' }}
                      >
                        <FestivalMotif preset={editingTheme.preset} size={9} color={editingTheme.accentColor} />
                        <span>Diwali Special</span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <span className="block font-semibold text-xs text-stone-900 truncate">
                    Wayanad Banana Chips (250g)
                  </span>
                  <span className="text-[11px] font-bold text-stone-700">₹149</span>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[9px] text-emerald-700 font-medium">In Stock</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Component 4: Festival Section Separator */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-content-muted uppercase tracking-wider">
                D. Section Ornamental Divider
              </span>
              <div className="flex items-center justify-center py-1">
                <div
                  className="flex-1 h-px"
                  style={{
                    background: `linear-gradient(to right, transparent, ${editingTheme.accentColor})`
                  }}
                />
                <div
                  className="mx-2 px-2.5 py-0.5 rounded-full bg-white border flex items-center gap-1 shadow-2xs"
                  style={{ borderColor: `${editingTheme.accentColor}40` }}
                >
                  <FestivalMotif preset={editingTheme.preset} size={13} color={editingTheme.accentColor} />
                  <span className="text-[9px] font-serif font-bold text-stone-700">
                    {editingTheme.name}
                  </span>
                </div>
                <div
                  className="flex-1 h-px"
                  style={{
                    background: `linear-gradient(to left, transparent, ${editingTheme.accentColor})`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Authoritative Restore Default ZaDa Brand Confirmation Modal */}
      {isResetConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-card border border-border-subtle max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3 border-b border-border-subtle pb-3">
              <div className="p-2 rounded-full bg-amber-100 text-amber-700 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-content-primary">
                  Restore Default ZaDa Brand Identity?
                </h3>
                <p className="text-xs text-content-muted mt-0.5">
                  Authoritative brand reset across storefront and database
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-content-secondary leading-relaxed bg-canvas-subtle p-3.5 rounded-xl border border-border-subtle">
              <div className="flex items-center gap-2 font-bold text-content-primary">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Scope of Reset Action:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-content-muted">
                <li>Deactivates all festival theme overlays and promotional takeovers.</li>
                <li>Restores canonical ZaDa brand CSS custom properties (Emerald Green & Heritage Gold).</li>
                <li>Authoritatively updates Supabase <code className="bg-white px-1 rounded font-mono">store_settings</code> and <code className="bg-white px-1 rounded font-mono">festival_themes</code>.</li>
                <li>Immediately updates storefront across open tabs without requiring logout or hard refresh.</li>
                <li>Remains persistently default across subsequent browser refreshes and admin sessions.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setIsResetConfirmModalOpen(false)}
                disabled={isResettingDefault}
                className="px-3.5 py-2 rounded-btn border border-border-subtle text-xs font-semibold text-content-secondary hover:bg-canvas-subtle"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResettingDefault}
                onClick={async () => {
                  setIsResettingDefault(true);
                  try {
                    await resetToDefault();
                    setIsResetConfirmModalOpen(false);
                  } finally {
                    setIsResettingDefault(false);
                  }
                }}
                className="px-4 py-2 rounded-btn bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isResettingDefault ? 'animate-spin' : ''}`} />
                <span>{isResettingDefault ? 'Restoring Default...' : 'Confirm Restore Default'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

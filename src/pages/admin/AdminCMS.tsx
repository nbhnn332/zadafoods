import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Edit2,
  X,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Layers,
  Eye,
  Bookmark,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import { HomepageBanner, CategoryBanner } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const AdminCMS: React.FC = () => {
  const {
    categories,
    banners,
    addBanner,
    updateBanner,
    deleteBanner,
    toggleBannerActive,
    reorderBanners,
    purgeSeedBanners,
    categoryBanners,
    addCategoryBanner,
    updateCategoryBanner,
    deleteCategoryBanner,
    toggleCategoryBannerActive,
    resetCategoryBannerDefaults,
    homepageSections,
    updateHomepageSections
  } = useAdminData();
  const { showToast } = useToast();
  const { isSuperAdmin, hasPermission } = useAuth();
  const canManageHeroBanners = isSuperAdmin || hasPermission('cms.hero_banners') || hasPermission('cms.homepage');
  const canManageCategoryBanners = isSuperAdmin || hasPermission('cms.category_banners') || hasPermission('cms.homepage');
  const canManageSections = isSuperAdmin || hasPermission('cms.sections') || hasPermission('cms.homepage');

  const [activeTab, setActiveTab] = useState<'banners' | 'category_banners' | 'sections'>('banners');

  // Banner Modal & Form State
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [isSavingBanner, setIsSavingBanner] = useState(false);
  const [isDeletingBanner, setIsDeletingBanner] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HomepageBanner | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [bgColor, setBgColor] = useState('#072C20');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [eyebrow, setEyebrow] = useState('Fresh From Kerala');
  const [ctaText, setCtaText] = useState('Shop Now');
  const [linkUrl, setLinkUrl] = useState('/category/chips');
  const [displayOrder, setDisplayOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Category Banner Modal & Form State
  const [isCatBannerModalOpen, setIsCatBannerModalOpen] = useState(false);
  const [editingCatBanner, setEditingCatBanner] = useState<CategoryBanner | null>(null);
  const [catCategorySlug, setCatCategorySlug] = useState('chips');
  const [catTitle, setCatTitle] = useState('');
  const [catSubtitle, setCatSubtitle] = useState('');
  const [catEyebrow, setCatEyebrow] = useState('');
  const [catBgColor, setCatBgColor] = useState('#072C20');
  const [catTextColor, setCatTextColor] = useState('#FFFFFF');
  const [catImageUrl, setCatImageUrl] = useState('');
  const [catDisplayOrder, setCatDisplayOrder] = useState(1);
  const [catIsActive, setCatIsActive] = useState(true);
  const [deleteCatConfirmId, setDeleteCatConfirmId] = useState<string | null>(null);

  // Theme Presets for Banners (Zero Images Required)
  const THEME_PRESETS = [
    { label: 'Forest Green (Signature)', bg: '#072C20', text: '#FFFFFF', eyebrow: "KERALA'S FAVOURITE SNACKS" },
    { label: 'Royal Malabar', bg: '#38220F', text: '#FFFFFF', eyebrow: 'SWEET HERITAGE OF MALABAR' },
    { label: 'Festive Burgundy', bg: '#4A1521', text: '#FFFFFF', eyebrow: 'HERITAGE MALABAR RECIPES' },
    { label: 'Malabar Terracotta', bg: '#8F3D1C', text: '#FFFFFF', eyebrow: 'EVENING TEA SNACKS' },
    { label: 'Deep Teal', bg: '#1E3A2F', text: '#FFFFFF', eyebrow: 'HOMEMADE TRADITION' },
    { label: 'Golden Harvest', bg: '#4A3511', text: '#FFFFFF', eyebrow: 'GOLDEN FESTIVE DELICACIES' },
    { label: 'Warm Earth', bg: '#2D3A1E', text: '#FFFFFF', eyebrow: '100% PURE & CRUNCHY' },
    { label: 'Heritage Sand', bg: '#3C2415', text: '#FFFFFF', eyebrow: 'CELEBRATE WITH TRADITION' }
  ];

  const openCreateBanner = () => {
    setEditingBanner(null);
    setTitle('');
    setSubtitle('');
    setImageUrl(''); // Strictly empty by default - Zero Images unless explicitly authorized
    setBgColor('#072C20');
    setTextColor('#FFFFFF');
    setEyebrow('Fresh From Kerala');
    setCtaText('Shop Now');
    setLinkUrl('/category/chips');
    setDisplayOrder(banners.length + 1);
    setIsActive(true);
    setIsBannerModalOpen(true);
  };

  const openEditBanner = (b: HomepageBanner) => {
    setEditingBanner(b);
    setTitle(b.title);
    setSubtitle(b.subtitle || '');
    setImageUrl(b.imageUrl || '');
    setBgColor(b.backgroundColor || '#072C20');
    setTextColor(b.textColor || '#FFFFFF');
    setEyebrow(b.eyebrow || 'Fresh From Kerala');
    setCtaText(b.ctaText || 'Shop Now');
    setLinkUrl(b.linkUrl);
    setDisplayOrder(b.displayOrder);
    setIsActive(b.isActive);
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageHeroBanners) {
      showToast('Permission Denied', 'Your administrator account lacks the "Hero Banner Management" (cms.hero_banners) permission.', 'error');
      return;
    }
    if (!title.trim()) {
      showToast('Validation Error', 'Headline Heading is mandatory.', 'error');
      return;
    }

    const trimmedImg = imageUrl.trim();
    if (trimmedImg) {
      const isValid = trimmedImg.startsWith('/') || /^https?:\/\//i.test(trimmedImg);
      if (!isValid) {
        showToast('Validation Error', 'Image URL must be a valid relative path (e.g. /assets/...) or HTTPS URL.', 'error');
        return;
      }
    }

    setIsSavingBanner(true);
    try {
      if (editingBanner) {
        const res = await updateBanner(editingBanner.id, {
          title: title.trim(),
          subtitle: subtitle.trim(),
          imageUrl: trimmedImg || '',
          backgroundColor: bgColor,
          textColor: textColor,
          eyebrow: eyebrow.trim() || undefined,
          ctaText: ctaText.trim() || 'Shop Now',
          linkUrl: linkUrl.trim() || '/category/chips',
          displayOrder: Number(displayOrder),
          isActive
        });
        if (res.success) {
          showToast('Banner Updated', `Updated "${title}" successfully. Persisted to database.`, 'success');
          setIsBannerModalOpen(false);
        } else {
          showToast('Database Error', res.error || 'Failed to update banner in database.', 'error');
        }
      } else {
        const res = await addBanner({
          title: title.trim(),
          subtitle: subtitle.trim(),
          imageUrl: trimmedImg || '',
          backgroundColor: bgColor,
          textColor: textColor,
          eyebrow: eyebrow.trim() || undefined,
          ctaText: ctaText.trim() || 'Shop Now',
          linkUrl: linkUrl.trim() || '/category/chips',
          displayOrder: Number(displayOrder),
          isActive
        });
        if (res.success) {
          showToast('Banner Created', `Added "${title}" to database and homepage rotation.`, 'success');
          setIsBannerModalOpen(false);
        } else {
          showToast('Database Error', res.error || 'Failed to save banner to database.', 'error');
        }
      }
    } catch (err: any) {
      showToast('Error', err?.message || 'An unexpected error occurred while saving banner.', 'error');
    } finally {
      setIsSavingBanner(false);
    }
  };

  const handleClearBannerImage = async (banId: string) => {
    if (!canManageHeroBanners) {
      showToast('Permission Denied', 'Your administrator account lacks the "Hero Banner Management" permission.', 'error');
      return;
    }
    const res = await updateBanner(banId, { imageUrl: '' });
    if (res.success) {
      showToast('Image Removed', 'Banner image cleared. Converted to pure CSS design and persisted to database.', 'info');
    } else {
      showToast('Database Error', res.error || 'Failed to clear banner image in database.', 'error');
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!canManageHeroBanners) {
      showToast('Permission Denied', 'Your administrator account lacks the "Hero Banner Management" permission.', 'error');
      return;
    }
    setIsDeletingBanner(true);
    try {
      const res = await deleteBanner(id);
      if (res.success) {
        setDeleteConfirmId(null);
        showToast('Banner Deleted', 'Banner has been removed from database and storefront.', 'info');
      } else {
        showToast('Database Error', res.error || 'Failed to delete banner from database.', 'error');
      }
    } catch (err: any) {
      showToast('Error', err?.message || 'Failed to delete banner.', 'error');
    } finally {
      setIsDeletingBanner(false);
    }
  };

  const handleToggleBannerActive = async (id: string) => {
    if (!canManageHeroBanners) {
      showToast('Permission Denied', 'Your administrator account lacks the "Hero Banner Management" permission.', 'error');
      return;
    }
    const res = await toggleBannerActive(id);
    if (!res.success) {
      showToast('Database Error', res.error || 'Failed to toggle banner status.', 'error');
    }
  };

  const moveBannerOrder = async (banner: HomepageBanner, direction: 'up' | 'down') => {
    if (!canManageHeroBanners) {
      showToast('Permission Denied', 'Your administrator account lacks the "Hero Banner Management" permission.', 'error');
      return;
    }
    const res = await reorderBanners(banner.id, direction === 'up' ? 'UP' : 'DOWN');
    if (!res.success) {
      showToast('Database Error', res.error || 'Failed to update banner order in database.', 'error');
    }
  };

  // Category Banner Handlers
  const openCreateCatBanner = (preferredSlug?: string) => {
    setEditingCatBanner(null);
    const targetSlug = preferredSlug || categories[0]?.slug || 'chips';
    const cat = categories.find((c) => c.slug === targetSlug);
    setCatCategorySlug(targetSlug);
    setCatTitle(cat ? cat.name : 'Category Title');
    setCatSubtitle(cat ? cat.description : 'Authentic Kerala delicacies crafted with farm-fresh ingredients.');
    setCatEyebrow("KERALA'S FAVOURITE SELECTION");
    setCatBgColor('#072C20');
    setCatTextColor('#FFFFFF');
    setCatImageUrl('');
    setCatDisplayOrder(categoryBanners.length + 1);
    setCatIsActive(true);
    setIsCatBannerModalOpen(true);
  };

  const openEditCatBanner = (cb: CategoryBanner) => {
    setEditingCatBanner(cb);
    setCatCategorySlug(cb.categorySlug);
    setCatTitle(cb.title);
    setCatSubtitle(cb.subtitle || '');
    setCatEyebrow(cb.eyebrow || '');
    setCatBgColor(cb.backgroundColor || '#072C20');
    setCatTextColor(cb.textColor || '#FFFFFF');
    setCatImageUrl(cb.imageUrl || '');
    setCatDisplayOrder(cb.displayOrder);
    setCatIsActive(cb.isActive);
    setIsCatBannerModalOpen(true);
  };

  const handleSaveCatBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageCategoryBanners) {
      showToast('Permission Denied', 'Your administrator account lacks the "Category Banner Management" (cms.category_banners) permission.', 'error');
      return;
    }
    if (!catTitle.trim() || !catCategorySlug.trim()) {
      showToast('Validation Error', 'Category and Title are mandatory.', 'error');
      return;
    }

    const matchedCat = categories.find((c) => c.slug === catCategorySlug);

    if (editingCatBanner) {
      updateCategoryBanner(editingCatBanner.id, {
        categoryId: matchedCat?.id,
        categorySlug: catCategorySlug,
        title: catTitle.trim(),
        subtitle: catSubtitle.trim(),
        eyebrow: catEyebrow.trim(),
        backgroundColor: catBgColor,
        textColor: catTextColor,
        imageUrl: catImageUrl.trim(),
        displayOrder: Number(catDisplayOrder),
        isActive: catIsActive
      });
      showToast('Category Banner Updated', `Updated banner for "${catCategorySlug}".`, 'success');
    } else {
      addCategoryBanner({
        categoryId: matchedCat?.id,
        categorySlug: catCategorySlug,
        title: catTitle.trim(),
        subtitle: catSubtitle.trim(),
        eyebrow: catEyebrow.trim(),
        backgroundColor: catBgColor,
        textColor: catTextColor,
        imageUrl: catImageUrl.trim(),
        displayOrder: Number(catDisplayOrder),
        isActive: catIsActive
      });
      showToast('Category Banner Created', `Created banner for "${catCategorySlug}".`, 'success');
    }

    setIsCatBannerModalOpen(false);
  };

  const handleDeleteCatBanner = (id: string) => {
    if (!canManageCategoryBanners) {
      showToast('Permission Denied', 'Your administrator account lacks the "Category Banner Management" permission.', 'error');
      return;
    }
    deleteCategoryBanner(id);
    setDeleteCatConfirmId(null);
    showToast('Banner Removed', 'Category banner deleted. Storefront will use default image-free styling.', 'info');
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (!canManageSections) {
      showToast('Permission Denied', 'Your administrator account lacks the "Homepage Layout & Sections" (cms.sections) permission.', 'error');
      return;
    }
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= homepageSections.length) return;

    const updated = [...homepageSections];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;

    const reordered = updated.map((sec, i) => ({ ...sec, displayOrder: i + 1 }));
    updateHomepageSections(reordered);
  };

  const toggleSectionEnable = (id: string) => {
    if (!canManageSections) {
      showToast('Permission Denied', 'Your administrator account lacks the "Homepage Layout & Sections" (cms.sections) permission.', 'error');
      return;
    }
    const updated = homepageSections.map((sec) =>
      sec.id === id ? { ...sec, isEnabled: !sec.isEnabled } : sec
    );
    updateHomepageSections(updated);
  };

  const sortedBanners = [...banners].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-serif text-content-primary">
            Storefront CMS & Layout Manager
          </h1>
          <p className="text-xs text-content-muted mt-0.5">
            Manage promotional hero banners, publication schedules, and reorder homepage layout sections.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-canvas-subtle p-1 rounded-pill border border-border-subtle self-start">
          <button
            onClick={() => setActiveTab('banners')}
            className={`px-3 py-1.5 rounded-pill text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'banners'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-content-muted hover:text-content-primary'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Hero Banners ({banners.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('category_banners')}
            className={`px-3 py-1.5 rounded-pill text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'category_banners'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-content-muted hover:text-content-primary'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Category Banners ({categoryBanners.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('sections')}
            className={`px-3 py-1.5 rounded-pill text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'sections'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-content-muted hover:text-content-primary'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Section Order ({homepageSections.length})</span>
          </button>
          <Link
            to="/admin/festivals"
            className="px-3 py-1.5 rounded-pill text-xs font-bold transition-colors flex items-center gap-1.5 text-content-muted hover:text-brand-primary"
            title="Configure festival themes, seasonal overlays & announcement greetings"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Festival Themes</span>
          </Link>
        </div>
      </div>

      {activeTab === 'banners' ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif font-bold text-base text-content-primary">
                Homepage Hero Banners & Slideshow
              </h2>
              <p className="text-xs text-content-muted">
                Admin-authorized hero banners. Supports both pure CSS (zero images) and explicitly approved photography.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start">
              <button
                onClick={purgeSeedBanners}
                className="px-3 py-1.5 rounded-btn border border-border-subtle bg-white text-content-muted hover:text-rose-600 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Purge default unapproved demo seed banners permanently"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Purge Demo Banners</span>
              </button>
              <button
                onClick={openCreateBanner}
                className="px-3.5 py-2 rounded-btn bg-brand-primary text-white text-xs font-bold flex items-center gap-1.5 hover:bg-brand-primary-hover shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Hero Banner</span>
              </button>
            </div>
          </div>

          {sortedBanners.length === 0 ? (
            <div className="bg-white rounded-card border border-border-subtle p-12 text-center space-y-3">
              <ImageIcon className="w-12 h-12 text-content-muted mx-auto" />
              <h3 className="font-bold text-sm text-content-primary">No Banners Configured</h3>
              <p className="text-xs text-content-muted max-w-sm mx-auto">
                No hero banners currently in rotation. The storefront will safely display a clean image-free fallback.
              </p>
              <button
                onClick={openCreateBanner}
                className="px-4 py-2 rounded-btn bg-brand-primary text-white text-xs font-bold shadow-sm"
              >
                Create Banner
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sortedBanners.map((ban) => {
                const hasImage = !!(ban.imageUrl && ban.imageUrl.trim());
                return (
                  <div
                    key={ban.id}
                    className={`bg-white rounded-card border transition-all overflow-hidden flex flex-col justify-between ${
                      ban.isActive
                        ? 'border-border-subtle shadow-subtle'
                        : 'border-border-subtle/50 opacity-75'
                    }`}
                  >
                    <div>
                      {/* Banner Visual Preview: Supports both authorized photography and pure CSS zero-image design */}
                      <div
                        style={{
                          backgroundColor: ban.backgroundColor || '#072C20',
                          color: ban.textColor || '#FFFFFF'
                        }}
                        className="relative h-44 overflow-hidden flex items-center p-5 transition-colors"
                      >
                        {hasImage ? (
                          <img
                            src={ban.imageUrl}
                            alt={ban.title}
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : null}

                        {/* Ambient Scrim Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent pointer-events-none" />

                        {/* Top Badges */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                          {hasImage ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white/90 border border-white/20">
                              With Image
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-200 border border-amber-300/30">
                              Pure CSS (Zero Images)
                            </span>
                          )}
                          <button
                            onClick={() => handleToggleBannerActive(ban.id)}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm transition-colors ${
                              ban.isActive ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-white/80'
                            }`}
                          >
                            {ban.isActive ? 'Active (Live)' : 'Hidden (Draft)'}
                          </button>
                        </div>

                        {/* Slide Content Preview */}
                        <div className="relative z-10 space-y-1 max-w-sm">
                          {ban.eyebrow && (
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FAD982]">
                              {ban.eyebrow}
                            </span>
                          )}
                          <h4 className="font-serif font-bold text-sm sm:text-base leading-tight drop-shadow-sm text-white line-clamp-2">
                            {ban.title}
                          </h4>
                          {ban.subtitle && (
                            <p className="text-[11px] text-white/80 line-clamp-1 font-sans">
                              {ban.subtitle}
                            </p>
                          )}
                        </div>

                        <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white font-mono z-10">
                          Priority: #{ban.displayOrder}
                        </div>
                      </div>

                      {/* Banner Details */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-serif font-bold text-base text-content-primary line-clamp-1">
                            {ban.title}
                          </h3>
                        </div>
                        {ban.subtitle && (
                          <p className="text-xs text-content-muted line-clamp-2">{ban.subtitle}</p>
                        )}
                        <div className="pt-1 flex items-center justify-between text-[11px]">
                          <span className="text-content-muted">
                            CTA: <strong className="text-content-primary">{ban.ctaText || 'Shop Now'}</strong>
                          </span>
                          <span className="text-brand-primary font-mono truncate max-w-[180px]">
                            → {ban.linkUrl}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="p-3 bg-canvas-subtle border-t border-border-subtle flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveBannerOrder(ban, 'up')}
                          className="p-1 rounded border border-border-subtle hover:bg-white text-content-muted hover:text-content-primary"
                          title="Increase display priority"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveBannerOrder(ban, 'down')}
                          className="p-1 rounded border border-border-subtle hover:bg-white text-content-muted hover:text-content-primary"
                          title="Decrease display priority"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        {hasImage && (
                          <button
                            onClick={() => handleClearBannerImage(ban.id)}
                            className="px-2 py-1 rounded border border-border-subtle hover:bg-white text-[10px] font-bold text-rose-600 ml-1"
                            title="De-authorize and remove this image, converting to pure CSS design"
                          >
                            Remove Image
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditBanner(ban)}
                          className="px-2.5 py-1 rounded text-xs font-semibold text-content-muted hover:text-brand-primary hover:bg-white border border-border-subtle flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(ban.id)}
                          className="px-2.5 py-1 rounded text-xs font-semibold text-content-muted hover:text-rose-600 hover:bg-white border border-border-subtle flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === 'category_banners' ? (
        /* Category Banners Management Section */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif font-bold text-base text-content-primary">
                Category-Specific Storefront Banners
              </h2>
              <p className="text-xs text-content-muted">
                Zero-image CSS-driven banners rendered on <code>/category/:slug</code>. Connects directly to Supabase <code>category_banners</code>.
              </p>
            </div>
            <button
              onClick={() => openCreateCatBanner()}
              className="px-3.5 py-2 rounded-btn bg-brand-primary text-white text-xs font-bold flex items-center gap-1.5 hover:bg-brand-primary-hover shadow-sm self-start"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category Banner</span>
            </button>
          </div>

          {/* List of Categories & Their Banner Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => {
              const banner = categoryBanners.find((b) => b.categorySlug === cat.slug);
              return (
                <div
                  key={cat.id}
                  className={`bg-white rounded-card border transition-all overflow-hidden flex flex-col justify-between ${
                    banner && banner.isActive
                      ? 'border-border-subtle shadow-subtle'
                      : 'border-border-subtle/60'
                  }`}
                >
                  <div className="p-4 space-y-3">
                    {/* Header Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-content-primary">
                          {cat.name}
                        </span>
                        <code className="text-[10px] bg-canvas-subtle px-1.5 py-0.5 rounded text-content-muted">
                          /{cat.slug}
                        </code>
                      </div>
                      {banner ? (
                        <button
                          onClick={() => toggleCategoryBannerActive(banner.id)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                            banner.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {banner.isActive ? 'Active (Live)' : 'Draft (Hidden)'}
                        </button>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Default Fallback
                        </span>
                      )}
                    </div>

                    {/* Banner Mini Preview Swatch (Pure CSS) */}
                    <div
                      style={{
                        backgroundColor: banner ? banner.backgroundColor : '#072C20',
                        color: banner ? banner.textColor : '#FFFFFF'
                      }}
                      className="rounded-xl p-3.5 min-h-[90px] flex flex-col justify-center relative overflow-hidden shadow-inner"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20 pointer-events-none" />
                      <div className="relative z-10 space-y-1">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-200/90 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          {banner?.eyebrow || "KERALA'S FAVOURITE SELECTION"}
                        </span>
                        <h4 className="font-serif font-bold text-sm leading-tight text-white">
                          {banner?.title || cat.name}
                        </h4>
                        <p className="text-[10px] text-white/80 line-clamp-1">
                          {banner?.subtitle || cat.description || 'Authentic Kerala delicacies crafted with farm-fresh ingredients.'}
                        </p>
                      </div>
                    </div>

                    {/* Metadata details */}
                    <div className="flex items-center justify-between text-[11px] text-content-muted pt-1">
                      <div className="flex items-center gap-2">
                        <span>Theme:</span>
                        <span
                          className="inline-block w-3.5 h-3.5 rounded-full border border-black/20"
                          style={{ backgroundColor: banner ? banner.backgroundColor : '#072C20' }}
                          title={banner ? banner.backgroundColor : '#072C20'}
                        />
                        <span className="font-mono">{banner ? banner.backgroundColor : '#072C20'}</span>
                      </div>
                      <div>
                        {banner ? `Priority: #${banner.displayOrder}` : 'Standard Order'}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="px-4 py-2.5 bg-canvas-subtle/50 border-t border-border-subtle flex items-center justify-between gap-2">
                    <button
                      onClick={() => resetCategoryBannerDefaults(cat.slug)}
                      className="text-[11px] font-bold text-content-muted hover:text-brand-primary flex items-center gap-1 transition-colors"
                      title="Reset this category banner to authentic default styling"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restore Defaults</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {banner ? (
                        <>
                          <button
                            onClick={() => openEditCatBanner(banner)}
                            className="px-2.5 py-1 rounded text-xs font-semibold text-content-muted hover:text-brand-primary hover:bg-white border border-border-subtle flex items-center gap-1 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setDeleteCatConfirmId(banner.id)}
                            className="px-2.5 py-1 rounded text-xs font-semibold text-content-muted hover:text-rose-600 hover:bg-white border border-border-subtle flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => openCreateCatBanner(cat.slug)}
                          className="px-3 py-1 rounded text-xs font-bold bg-brand-primary text-white hover:bg-brand-primary-hover flex items-center gap-1 shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Customize Banner</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Section Ordering View */
        <div className="bg-white rounded-card border border-border-subtle shadow-subtle p-5 space-y-4">
          <div>
            <h2 className="font-serif font-bold text-sm text-content-primary">
              Homepage Layout Sections
            </h2>
            <p className="text-xs text-content-muted">
              Move sections up or down to reorder the customer-facing landing page layout.
            </p>
          </div>

          <div className="divide-y divide-border-subtle border border-border-subtle rounded-card overflow-hidden">
            {homepageSections.map((sec, idx) => (
              <div
                key={sec.id}
                className="p-3.5 flex items-center justify-between hover:bg-canvas-subtle/50 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary font-bold flex items-center justify-center text-xs">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-content-primary">{sec.title}</p>
                    <p className="text-[10px] text-content-muted font-mono">{sec.sectionKey}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleSectionEnable(sec.id)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      sec.isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {sec.isEnabled ? 'Visible' : 'Hidden'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      disabled={idx === 0}
                      onClick={() => moveSection(idx, 'up')}
                      className="p-1.5 rounded border border-border-subtle hover:bg-canvas-subtle disabled:opacity-30"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={idx === homepageSections.length - 1}
                      onClick={() => moveSection(idx, 'down')}
                      className="p-1.5 rounded border border-border-subtle hover:bg-canvas-subtle disabled:opacity-30"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Banner Create / Edit Modal */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-card max-w-lg w-full p-6 shadow-elevated space-y-4 text-xs my-6">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h2 className="font-serif text-lg font-bold text-content-primary">
                  {editingBanner ? 'Edit Hero Banner' : 'Create Hero Banner'}
                </h2>
                <p className="text-[11px] text-content-muted">
                  Connected directly to Supabase <code className="bg-canvas-subtle px-1 rounded">homepage_banners</code>
                </p>
              </div>
              <button
                onClick={() => setIsBannerModalOpen(false)}
                className="p-1 text-content-muted hover:text-content-primary rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Interactive Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-content-primary flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Live Storefront Preview</span>
                </label>
                <span className="text-[10px] text-content-muted">
                  {imageUrl ? 'Authorized Image' : 'Pure CSS Design (Zero Images)'}
                </span>
              </div>

              <div
                style={{ backgroundColor: bgColor, color: textColor }}
                className="relative rounded-xl overflow-hidden border border-border-subtle min-h-[140px] flex items-center p-4 transition-colors"
              >
                {imageUrl && imageUrl.trim() ? (
                  <img
                    src={imageUrl.trim()}
                    alt="Banner Preview"
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : null}

                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none" />

                <div className="relative z-10 p-2 space-y-1 text-white max-w-sm">
                  {eyebrow && (
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#FAD982]">
                      {eyebrow}
                    </span>
                  )}
                  <h4 className="font-serif font-bold text-sm text-amber-200">
                    {title || 'Headline Title Goes Here'}
                  </h4>
                  <p className="text-[11px] text-white/90 line-clamp-2">
                    {subtitle || 'Supporting description copy will display here.'}
                  </p>
                  <div className="pt-1">
                    <span className="inline-block px-3 py-1 rounded-lg bg-[#A67732] text-white text-[10px] font-bold shadow">
                      {ctaText || 'Shop Now'} →
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-bold text-content-primary block mb-1">Headline Heading *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Authentic Kerala Flavours Delivered to Your Home"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-content-primary block mb-1">Badge / Eyebrow</label>
                  <input
                    type="text"
                    placeholder="e.g. Fresh From Kerala"
                    value={eyebrow}
                    onChange={(e) => setEyebrow(e.target.value)}
                    className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-content-primary block mb-1">Subheadline Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Harvested from Wayanad farms, thinly sliced & fried fresh in 100% pure cold-pressed coconut oil."
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                />
              </div>

              {/* Strict Image Authorization Field */}
              <div className="space-y-1.5 p-3 rounded-xl bg-canvas-subtle border border-border-subtle">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-content-primary block text-[11px]">
                    Authorized Hero Image URL (Optional)
                  </label>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="text-[10px] text-rose-600 hover:underline font-bold"
                    >
                      Remove / Clear Image
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Leave empty for Pure CSS (zero images), or e.g. /assets/hero-banner.png"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs font-mono bg-white"
                />
                <p className="text-[10px] text-content-muted">
                  Strict authorization rule: Only enter an image URL if explicitly authorized. If left empty, the banner renders cleanly in pure CSS.
                </p>
              </div>

              {/* Theme Presets for Pure CSS Hero */}
              <div>
                <label className="font-bold text-content-primary block mb-1 text-[11px]">
                  Color Theme Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {THEME_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setBgColor(preset.bg);
                        setTextColor(preset.text);
                      }}
                      className="p-1.5 rounded-lg border border-border-subtle flex items-center gap-1.5 hover:bg-white text-left transition-all"
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: preset.bg }}
                      />
                      <span className="text-[10px] font-medium text-content-primary truncate">
                        {preset.label.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-content-primary block mb-1">CTA Label</label>
                  <input
                    type="text"
                    placeholder="Shop Now"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-content-primary block mb-1">Destination URL</label>
                  <input
                    type="text"
                    placeholder="/category/chips"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-bold text-content-primary block mb-1">Display Priority</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-border-subtle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                  <span className="font-bold text-content-primary">
                    {isActive ? 'Active (Published)' : 'Draft (Hidden)'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  disabled={isSavingBanner}
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-4 py-2 rounded-btn border border-border-subtle font-semibold hover:bg-canvas-subtle disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBanner}
                  className="px-4 py-2 rounded-btn bg-brand-primary text-white font-bold hover:bg-brand-primary-hover shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingBanner ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                      <span>Verifying with Database...</span>
                    </>
                  ) : (
                    <span>{editingBanner ? 'Save Changes' : 'Create Banner'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-card max-w-sm w-full p-5 shadow-elevated space-y-3 text-xs">
            <h3 className="font-serif text-base font-bold text-content-primary">
              Delete Homepage Banner?
            </h3>
            <p className="text-content-muted">
              Are you sure you want to remove this banner? This action will immediately remove it from customer storefront rotation.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
              <button
                disabled={isDeletingBanner}
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 rounded-btn border border-border-subtle font-semibold hover:bg-canvas-subtle disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={isDeletingBanner}
                onClick={() => handleDeleteBanner(deleteConfirmId)}
                className="px-3.5 py-1.5 rounded-btn bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeletingBanner ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                    <span>Deleting from Database...</span>
                  </>
                ) : (
                  <span>Confirm Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Banner Create / Edit Modal */}
      {isCatBannerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-card max-w-xl w-full p-6 shadow-elevated space-y-4 text-xs my-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h2 className="font-serif text-lg font-bold text-content-primary">
                  {editingCatBanner ? 'Edit Category Banner' : 'Create Category Banner'}
                </h2>
                <p className="text-[11px] text-content-muted">
                  Configures the top hero banner on <code>/category/{catCategorySlug}</code>. Defaults to CSS background with zero images.
                </p>
              </div>
              <button
                onClick={() => setIsCatBannerModalOpen(false)}
                className="p-1 text-content-muted hover:text-content-primary rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Interactive CSS Banner Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-content-primary flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Live Storefront Banner Preview</span>
                </label>
                <span className="text-[10px] text-content-muted font-medium">
                  {catImageUrl ? 'Optional Background Image' : 'Pure CSS Background (Zero Images)'}
                </span>
              </div>

              <div
                style={{
                  backgroundColor: catBgColor || '#072C20',
                  color: catTextColor || '#FFFFFF'
                }}
                className="relative rounded-2xl overflow-hidden p-6 min-h-[140px] flex items-center border border-black/10 shadow-inner"
              >
                {/* Optional background image if provided */}
                {catImageUrl && (
                  <img
                    src={catImageUrl}
                    alt="Category background preview"
                    className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                )}

                {/* Controlled gradient overlay for 100% legibility */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent pointer-events-none" />

                <div className="relative z-10 max-w-md space-y-1.5">
                  {catEyebrow && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-[#FAD982] text-[10px] font-extrabold uppercase tracking-widest shadow-2xs">
                      <Sparkles className="w-2.5 h-2.5" />
                      {catEyebrow}
                    </span>
                  )}
                  <h3 className="font-serif font-extrabold text-2xl tracking-tight leading-tight" style={{ color: catTextColor }}>
                    {catTitle || 'Category Name'}
                  </h3>
                  <p className="text-xs opacity-90 line-clamp-2 font-sans" style={{ color: catTextColor }}>
                    {catSubtitle || 'Authentic Kerala delicacies crafted with farm-fresh ingredients.'}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveCatBanner} className="space-y-3 pt-2">
              {/* Category Selection */}
              <div>
                <label className="font-bold text-content-primary block mb-1">Target Category *</label>
                <select
                  value={catCategorySlug}
                  onChange={(e) => {
                    const slug = e.target.value;
                    setCatCategorySlug(slug);
                    const cat = categories.find((c) => c.slug === slug);
                    if (cat && !editingCatBanner) {
                      setCatTitle(cat.name);
                      setCatSubtitle(cat.description || '');
                    }
                  }}
                  className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs font-semibold bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name} ({c.slug})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="font-bold text-content-primary block mb-1">Display Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chips"
                  value={catTitle}
                  onChange={(e) => setCatTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                />
              </div>

              {/* Eyebrow */}
              <div>
                <label className="font-bold text-content-primary block mb-1">Eyebrow Tag (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. KERALA'S FAVOURITE SNACKS"
                  value={catEyebrow}
                  onChange={(e) => setCatEyebrow(e.target.value)}
                  className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs uppercase"
                />
              </div>

              {/* Subtitle / Description */}
              <div>
                <label className="font-bold text-content-primary block mb-1">Short Subtitle / Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Crispy, tasty and traditional Kerala chips fried in cold-pressed pure coconut oil."
                  value={catSubtitle}
                  onChange={(e) => setCatSubtitle(e.target.value)}
                  className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                />
              </div>

              {/* Theme Presets */}
              <div>
                <label className="font-bold text-content-primary block mb-1 flex items-center justify-between">
                  <span>Approved Theme Presets (Zero Images)</span>
                  <span className="text-[10px] text-content-muted">Click to apply palette</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {THEME_PRESETS.map((p) => {
                    const isSelected = catBgColor === p.bg;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setCatBgColor(p.bg);
                          setCatTextColor(p.text);
                          if (!catEyebrow) setCatEyebrow(p.eyebrow);
                        }}
                        className={`p-2 rounded-xl text-left border text-[10px] transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'border-brand-primary ring-2 ring-brand-primary/20 bg-brand-primary/5 font-bold'
                            : 'border-border-subtle hover:border-brand-primary/40 bg-white'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/20"
                          style={{ backgroundColor: p.bg }}
                        />
                        <span className="truncate">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Color Overrides */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-content-primary block mb-1">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={catBgColor}
                      onChange={(e) => setCatBgColor(e.target.value)}
                      className="w-8 h-8 rounded border border-border-subtle p-0.5 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={catBgColor}
                      onChange={(e) => setCatBgColor(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-border-subtle rounded-input text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-content-primary block mb-1">Text Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={catTextColor}
                      onChange={(e) => setCatTextColor(e.target.value)}
                      className="w-8 h-8 rounded border border-border-subtle p-0.5 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={catTextColor}
                      onChange={(e) => setCatTextColor(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-border-subtle rounded-input text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Optional Image URL */}
              <div>
                <label className="font-bold text-content-primary block mb-0.5">
                  Optional Background Image URL (Empty by default)
                </label>
                <p className="text-[10px] text-content-muted mb-1">
                  Default is pure CSS background. Only provide a genuine asset path if available.
                </p>
                <input
                  type="text"
                  placeholder="Leave empty for image-free CSS banner"
                  value={catImageUrl}
                  onChange={(e) => setCatImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs font-mono"
                />
              </div>

              {/* Display Order & Active */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="font-bold text-content-primary block mb-1">Priority / Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={catDisplayOrder}
                    onChange={(e) => setCatDisplayOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                  />
                </div>

                <div className="pt-4 flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={catIsActive}
                      onChange={(e) => setCatIsActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-border-subtle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                  <span className="font-bold text-content-primary">
                    {catIsActive ? 'Active (Live on Storefront)' : 'Draft (Hidden)'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsCatBannerModalOpen(false)}
                  className="px-4 py-2 rounded-btn border border-border-subtle font-semibold hover:bg-canvas-subtle"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-btn bg-brand-primary text-white font-bold hover:bg-brand-primary-hover shadow-sm"
                >
                  {editingCatBanner ? 'Save Changes' : 'Create Category Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Banner Confirmation Modal */}
      {deleteCatConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-card max-w-sm w-full p-5 shadow-elevated space-y-3 text-xs">
            <h3 className="font-serif text-base font-bold text-content-primary">
              Delete Category Banner?
            </h3>
            <p className="text-content-muted">
              Are you sure you want to remove this banner? The storefront category will automatically fall back to the default image-free banner styling.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
              <button
                onClick={() => setDeleteCatConfirmId(null)}
                className="px-3.5 py-1.5 rounded-btn border border-border-subtle font-semibold hover:bg-canvas-subtle"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCatBanner(deleteCatConfirmId)}
                className="px-3.5 py-1.5 rounded-btn bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

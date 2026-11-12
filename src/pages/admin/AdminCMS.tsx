import { CorporateGiftingEditor } from '../../components/CorporateGiftingEditor';
import { HeritageBannerEditor } from '../../components/HeritageBannerEditor';
import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Monitor,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
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
  RotateCw,
  Loader2,
  Sparkles,
  Gift
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
    updateHomepageSections,
    corporateGiftingSection,
    updateCorporateGiftingSection,
    heritageStorySection,
    updateHeritageStorySection
  } = useAdminData();
  const { showToast } = useToast();
  const { isSuperAdmin, hasPermission } = useAuth();
  const canManageHeroBanners = isSuperAdmin || hasPermission('cms.hero_banners') || hasPermission('cms.homepage');
  const canManageCategoryBanners = isSuperAdmin || hasPermission('cms.category_banners') || hasPermission('cms.homepage');
  const canManageSections = isSuperAdmin || hasPermission('cms.sections') || hasPermission('cms.homepage');

  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as any) || 'banners';
  const [activeTab, setActiveTab] = useState<'banners' | 'heritage_story' | 'corporate_gifting' | 'category_banners' | 'sections'>(
    ['banners', 'heritage_story', 'corporate_gifting', 'category_banners', 'sections'].includes(initialTab) ? initialTab : 'banners'
  );

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
  const [showCta, setShowCta] = useState(true);
  const [isClickable, setIsClickable] = useState(true);
  const [openInNewTab, setOpenInNewTab] = useState(false);
  const [displayOrder, setDisplayOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deviceTarget, setDeviceTarget] = useState<'all' | 'desktop' | 'mobile'>('all');
  const [bannerDeviceFilter, setBannerDeviceFilter] = useState<'desktop' | 'mobile' | 'all'>('desktop');
  const [imageStatus, setImageStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [imageErrorMsg, setImageErrorMsg] = useState('');
  const [imageRetryKey, setImageRetryKey] = useState(0);

  // Real-time image validation for direct URL input
  React.useEffect(() => {
    const trimmed = (imageUrl || '').trim().replace(/^["']|["']$/g, '');
    if (!trimmed) {
      setImageStatus('idle');
      setImageDimensions(null);
      setImageErrorMsg('');
      return;
    }
    const isValidProtocol = trimmed.startsWith('/') || /^https?:\/\//i.test(trimmed);
    if (!isValidProtocol) {
      setImageStatus('invalid');
      setImageDimensions(null);
      setImageErrorMsg('URL must begin with https://, http://, or /assets/');
      return;
    }
    setImageStatus('validating');
    setImageErrorMsg('');
    const img = new Image();
    img.referrerPolicy = 'no-referrer';
    let isCancelled = false;
    img.onload = () => {
      if (!isCancelled) {
        setImageStatus('valid');
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setImageErrorMsg('');
      }
    };
    img.onerror = () => {
      if (!isCancelled) {
        setImageStatus('invalid');
        setImageDimensions(null);
        setImageErrorMsg('Unable to load image from direct URL. The image link is unreachable, restricted by external host, or not a valid image file.');
      }
    };
    if (imageRetryKey > 0 && /^https?:\/\//i.test(trimmed)) {
      const sep = trimmed.includes('?') ? '&' : '?';
      img.src = `${trimmed}${sep}_retry=${Date.now()}`;
    } else {
      img.src = trimmed;
    }
    return () => {
      isCancelled = true;
    };
  }, [imageUrl, imageRetryKey]);

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
  const [catImageStatus, setCatImageStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [catImageDimensions, setCatImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [catImageErrorMsg, setCatImageErrorMsg] = useState('');
  const [catImageRetryKey, setCatImageRetryKey] = useState(0);
  const [catDisplayOrder, setCatDisplayOrder] = useState(1);
  const [catIsActive, setCatIsActive] = useState(true);
  const [deleteCatConfirmId, setDeleteCatConfirmId] = useState<string | null>(null);

  // Real-time category banner image validation
  React.useEffect(() => {
    const trimmed = (catImageUrl || '').trim().replace(/^["']|["']$/g, '');
    if (!trimmed) {
      setCatImageStatus('idle');
      setCatImageDimensions(null);
      setCatImageErrorMsg('');
      return;
    }
    const isValidProtocol = trimmed.startsWith('/') || /^https?:\/\//i.test(trimmed);
    if (!isValidProtocol) {
      setCatImageStatus('invalid');
      setCatImageDimensions(null);
      setCatImageErrorMsg('URL must begin with https://, http://, or /assets/');
      return;
    }
    setCatImageStatus('validating');
    setCatImageErrorMsg('');
    const img = new Image();
    img.referrerPolicy = 'no-referrer';
    let isCancelled = false;
    img.onload = () => {
      if (!isCancelled) {
        setCatImageStatus('valid');
        setCatImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setCatImageErrorMsg('');
      }
    };
    img.onerror = () => {
      if (!isCancelled) {
        setCatImageStatus('invalid');
        setCatImageDimensions(null);
        setCatImageErrorMsg('Unable to load image from direct URL. The image link is unreachable, restricted by external host, or not a valid image file.');
      }
    };
    if (catImageRetryKey > 0 && /^https?:\/\//i.test(trimmed)) {
      const sep = trimmed.includes('?') ? '&' : '?';
      img.src = `${trimmed}${sep}_retry=${Date.now()}`;
    } else {
      img.src = trimmed;
    }
    return () => {
      isCancelled = true;
    };
  }, [catImageUrl, catImageRetryKey]);

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

  const openCreateBanner = (target: 'desktop' | 'mobile' = (bannerDeviceFilter === 'mobile' ? 'mobile' : 'desktop')) => {
    setEditingBanner(null);
    setTitle('');
    setSubtitle('');
    setImageUrl('');
    setImageStatus('idle');
    setImageDimensions(null);
    setImageErrorMsg('');
    setImageRetryKey(0);
    setBgColor('#072C20');
    setTextColor('#FFFFFF');
    setEyebrow('Fresh From Kerala');
    setCtaText('Shop Now');
    setLinkUrl('/category/chips');
    setShowCta(true);
    setIsClickable(true);
    setOpenInNewTab(false);
    const existingCount = banners.filter((b) => (b.deviceTarget || 'desktop') === target).length;
    setDisplayOrder(existingCount + 1);
    setIsActive(true);
    setDeviceTarget(target);
    setIsBannerModalOpen(true);
  };

  const openEditBanner = (b: HomepageBanner) => {
    setEditingBanner(b);
    setTitle(b.title || '');
    setSubtitle(b.subtitle || '');
    setImageUrl(b.imageUrl || '');
    setImageStatus(b.imageUrl ? 'validating' : 'idle');
    setImageDimensions(null);
    setImageErrorMsg('');
    setImageRetryKey(0);
    setBgColor(b.backgroundColor || '#072C20');
    setTextColor(b.textColor || '#FFFFFF');
    setEyebrow(b.eyebrow || 'Fresh From Kerala');
    setCtaText(b.ctaText || 'Shop Now');
    setLinkUrl(b.linkUrl || '/category/chips');
    setShowCta(b.showCta !== false && Boolean(b.ctaText));
    setIsClickable(b.isClickable !== false);
    setOpenInNewTab(b.openInNewTab || false);
    setDisplayOrder(b.displayOrder);
    setIsActive(b.isActive);
    setDeviceTarget(b.deviceTarget === 'mobile' ? 'mobile' : 'desktop');
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageHeroBanners) {
      showToast('Permission Denied', 'Your administrator account lacks the "Hero Banner Management" (cms.hero_banners) permission.', 'error');
      return;
    }
    const trimmedTitle = title.trim();
    const trimmedImg = (imageUrl || '').trim().replace(/^["']|["']$/g, '');
    if (!trimmedTitle && !trimmedImg) {
      showToast('Validation Error', 'Either a Headline or an Image URL must be provided.', 'error');
      return;
    }

    if (trimmedImg) {
      const isValid = trimmedImg.startsWith('/') || /^https?:\/\//i.test(trimmedImg);
      if (!isValid) {
        showToast('Validation Error', 'Image URL must be a valid relative path (e.g. /assets/...) or HTTP/HTTPS URL.', 'error');
        return;
      }
      if (imageStatus === 'invalid') {
        showToast('Image Validation Failed', 'The image URL cannot be loaded. Please click Retry, enter a valid URL, or leave empty for Pure CSS.', 'error');
        return;
      }
    }

    setIsSavingBanner(true);
    try {
      const payload: Partial<HomepageBanner> = {
        title: trimmedTitle,
        subtitle: subtitle.trim(),
        imageUrl: trimmedImg || '',
        backgroundColor: bgColor,
        textColor: textColor,
        eyebrow: eyebrow.trim() || undefined,
        ctaText: showCta ? (ctaText.trim() || 'Shop Now') : '',
        linkUrl: linkUrl.trim() || '/category/chips',
        displayOrder: Number(displayOrder),
        deviceTarget: deviceTarget === 'mobile' ? 'mobile' : 'desktop',
        isActive,
        showCta,
        isClickable,
        openInNewTab
      };

      if (editingBanner) {
        const res = await updateBanner(editingBanner.id, payload);
        if (res.success) {
          showToast('Banner Updated', `Updated "${trimmedTitle || 'Banner'}" successfully. Persisted to database.`, 'success');
          setIsBannerModalOpen(false);
        } else {
          showToast('Database Error', res.error || 'Failed to update banner in database.', 'error');
        }
      } else {
        const res = await addBanner(payload as any);
        if (res.success) {
          showToast('Banner Created', `Added "${trimmedTitle || 'Banner'}" to database and homepage rotation.`, 'success');
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
    setCatImageStatus('idle');
    setCatImageDimensions(null);
    setCatImageErrorMsg('');
    setCatImageRetryKey(0);
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
    setCatImageStatus(cb.imageUrl ? 'validating' : 'idle');
    setCatImageDimensions(null);
    setCatImageErrorMsg('');
    setCatImageRetryKey(0);
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

    const trimmedCatImg = (catImageUrl || '').trim().replace(/^["']|["']$/g, '');
    if (trimmedCatImg) {
      const isValid = trimmedCatImg.startsWith('/') || /^https?:\/\//i.test(trimmedCatImg);
      if (!isValid) {
        showToast('Validation Error', 'Category image URL must begin with https://, http://, or /assets/', 'error');
        return;
      }
      if (catImageStatus === 'invalid') {
        showToast('Image Validation Failed', 'The category image URL cannot be loaded. Please click Retry, provide a valid URL, or leave empty for Pure CSS.', 'error');
        return;
      }
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
        imageUrl: trimmedCatImg,
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
        imageUrl: trimmedCatImg,
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

  const desktopBanners = [...banners]
    .filter((b) => b.deviceTarget === 'desktop' || (!b.deviceTarget && b.badgeText !== 'mobile'))
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const mobileBanners = [...banners]
    .filter((b) => b.deviceTarget === 'mobile' || b.badgeText === 'mobile')
    .sort((a, b) => a.displayOrder - b.displayOrder);

  
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
            onClick={() => setActiveTab('heritage_story')}
            className={`px-3 py-1.5 rounded-pill text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'heritage_story'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-content-muted hover:text-content-primary'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Heritage / Story Banner</span>
          </button>
          <button
            onClick={() => setActiveTab('corporate_gifting')}
            className={`px-3 py-1.5 rounded-pill text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'corporate_gifting'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-content-muted hover:text-content-primary'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Corporate / Gifting Banner</span>
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
        <div className="space-y-6">
          {/* Subnavigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-card border border-border-subtle shadow-subtle">
            <div>
              <h2 className="font-serif font-bold text-base text-content-primary flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-brand-primary" />
                <span>Hero Banner Source-of-Truth Management</span>
              </h2>
              <p className="text-xs text-content-muted mt-0.5">
                Two strictly isolated device targets: Section A (Desktop 16:9) and Section B (Mobile 390:220). Zero demo/legacy leaks.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start flex-wrap">
              {/* Device Filter Buttons */}
              <div className="flex items-center bg-canvas-subtle p-0.5 rounded-pill border border-border-subtle text-xs">
                <button
                  type="button"
                  data-testid="tab-desktop-banners"
                  onClick={() => {
                    setBannerDeviceFilter('desktop');
                    setDeviceTarget('desktop');
                  }}
                  className={`px-3 py-1.5 rounded-pill font-bold transition-all flex items-center gap-1.5 ${
                    bannerDeviceFilter === 'desktop'
                      ? 'bg-white text-brand-primary shadow-xs'
                      : 'text-content-muted hover:text-content-primary'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Section A: Desktop ({desktopBanners.length})</span>
                </button>
                <button
                  type="button"
                  data-testid="tab-mobile-banners"
                  onClick={() => {
                    setBannerDeviceFilter('mobile');
                    setDeviceTarget('mobile');
                  }}
                  className={`px-3 py-1.5 rounded-pill font-bold transition-all flex items-center gap-1.5 ${
                    bannerDeviceFilter === 'mobile'
                      ? 'bg-white text-brand-primary shadow-xs'
                      : 'text-content-muted hover:text-content-primary'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Section B: Mobile ({mobileBanners.length})</span>
                </button>
                <button
                  type="button"
                  data-testid="tab-all-banners"
                  onClick={() => setBannerDeviceFilter('all')}
                  className={`px-3 py-1.5 rounded-pill font-bold transition-all flex items-center gap-1.5 ${
                    bannerDeviceFilter === 'all'
                      ? 'bg-white text-brand-primary shadow-xs'
                      : 'text-content-muted hover:text-content-primary'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>View Both Sections ({banners.length})</span>
                </button>
              </div>

              <button
                onClick={purgeSeedBanners}
                className="px-3 py-1.5 rounded-btn border border-border-subtle bg-white text-content-muted hover:text-rose-600 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Purge default unapproved demo seed banners permanently"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Purge Demo Banners</span>
              </button>
            </div>
          </div>

          {/* SECTION A: DESKTOP HERO BANNERS */}
          {(bannerDeviceFilter === 'desktop' || bannerDeviceFilter === 'all') && (
            <div className="bg-white rounded-card border border-border-subtle shadow-subtle p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif font-bold text-base text-content-primary">
                        Section A: Desktop Hero Banners
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                        16:9 Aspect Ratio (Desktop Storefront Only)
                      </span>
                    </div>
                    <p className="text-xs text-content-muted">
                      Renders strictly on widescreen desktop viewports (≥768px). Never appears on mobile devices.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  data-testid="add-desktop-banner-btn"
                  onClick={() => openCreateBanner('desktop')}
                  className="px-3.5 py-2 rounded-btn bg-brand-primary text-white text-xs font-bold flex items-center gap-1.5 hover:bg-brand-primary-hover shadow-sm self-start"
                  aria-label="Add Hero Banner"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Desktop Banner</span>
                </button>
              </div>

              {desktopBanners.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-border-subtle p-8 text-center space-y-2.5">
                  <Monitor className="w-10 h-10 text-content-muted mx-auto" />
                  <h4 className="font-bold text-xs text-content-primary">No Desktop Banners Configured</h4>
                  <p className="text-[11px] text-content-muted max-w-sm mx-auto">
                    No banners are assigned to desktop. The desktop storefront will safely render the deliberate image-free CSS hero.
                  </p>
                  <button
                    onClick={() => openCreateBanner('desktop')}
                    className="px-3.5 py-1.5 rounded-btn bg-brand-primary text-white text-xs font-bold shadow-sm"
                  >
                    + Create Desktop Banner
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {desktopBanners.map((ban) => {
                    const hasImage = !!(ban.imageUrl && ban.imageUrl.trim());
                    return (
                      <div
                        key={ban.id}
                        className={`bg-canvas rounded-card border transition-all overflow-hidden flex flex-col justify-between ${
                          ban.isActive ? 'border-border-subtle shadow-xs' : 'border-border-subtle/50 opacity-75'
                        }`}
                      >
                        <div>
                          {/* 16:9 Aspect Ratio Visual Preview */}
                          <div
                            style={{
                              backgroundColor: ban.backgroundColor || '#072C20',
                              color: ban.textColor || '#FFFFFF'
                            }}
                            className="relative aspect-[16/9] w-full overflow-hidden flex items-center p-4 transition-colors"
                          >
                            {hasImage && (
                              <img
                                src={ban.imageUrl}
                                alt={ban.title}
                                referrerPolicy="no-referrer"
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            )}

                            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none" />

                            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/20">
                                🖥️ Desktop Only
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white/90 border border-white/20">
                                {hasImage ? 'With Image' : 'Pure CSS (Zero Images)'}
                              </span>
                              <button
                                onClick={() => handleToggleBannerActive(ban.id)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs transition-colors ${
                                  ban.isActive ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-white/80'
                                }`}
                              >
                                {ban.isActive ? 'Active' : 'Draft'}
                              </button>
                            </div>

                            <div className="relative z-10 space-y-1 max-w-sm">
                              {ban.eyebrow && (
                                <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#FAD982]">
                                  {ban.eyebrow}
                                </span>
                              )}
                              <h4 className="font-serif font-bold text-sm leading-tight text-white line-clamp-2">
                                {ban.title || <span className="italic opacity-70 font-sans text-xs">Image-Only Hero Banner</span>}
                              </h4>
                              {ban.subtitle && (
                                <p className="text-[10px] text-white/80 line-clamp-1 font-sans">
                                  {ban.subtitle}
                                </p>
                              )}
                            </div>

                            <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[9px] text-white font-mono z-10">
                              Priority: #{ban.displayOrder}
                            </div>
                          </div>

                          <div className="p-3.5 space-y-1.5 text-xs bg-white">
                            <h4 className="font-serif font-bold text-sm text-content-primary line-clamp-1">
                              {ban.title || <span className="italic text-content-muted font-sans text-xs">Image-Only Hero Banner</span>}
                            </h4>
                            {ban.subtitle && (
                              <p className="text-[11px] text-content-muted line-clamp-1">{ban.subtitle}</p>
                            )}
                            <div className="pt-1 flex items-center justify-between text-[11px]">
                              <span className="text-content-muted">CTA: <strong>{ban.ctaText || 'Shop Now'}</strong></span>
                              <span className="text-brand-primary font-mono truncate max-w-[160px]">→ {ban.linkUrl}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-2.5 bg-canvas-subtle border-t border-border-subtle flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => moveBannerOrder(ban, 'up')}
                              className="p-1 rounded border border-border-subtle hover:bg-white text-content-muted"
                              title="Increase priority"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => moveBannerOrder(ban, 'down')}
                              className="p-1 rounded border border-border-subtle hover:bg-white text-content-muted"
                              title="Decrease priority"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            {hasImage && (
                              <button
                                onClick={() => handleClearBannerImage(ban.id)}
                                className="px-2 py-0.5 rounded border border-border-subtle hover:bg-white text-[10px] font-bold text-rose-600 ml-1"
                              >
                                Remove Image
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openEditBanner(ban)}
                              className="px-2 py-1 rounded text-xs font-semibold text-content-muted hover:text-brand-primary hover:bg-white border border-border-subtle flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(ban.id)}
                              className="px-2 py-1 rounded text-xs font-semibold text-content-muted hover:text-rose-600 hover:bg-white border border-border-subtle flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
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
          )}

          {/* SECTION B: MOBILE HERO BANNERS */}
          {(bannerDeviceFilter === 'mobile' || bannerDeviceFilter === 'all') && (
            <div className="bg-white rounded-card border border-border-subtle shadow-subtle p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif font-bold text-base text-content-primary">
                        Section B: Mobile Hero Banners
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        390:220 Aspect Ratio (Smartphone Storefront Only)
                      </span>
                    </div>
                    <p className="text-xs text-content-muted">
                      Renders strictly on mobile smartphones (&lt;768px). Never appears on desktop displays.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  data-testid="add-mobile-banner-btn"
                  onClick={() => openCreateBanner('mobile')}
                  className="px-3.5 py-2 rounded-btn bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-800 shadow-sm self-start"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Mobile Banner</span>
                </button>
              </div>

              {mobileBanners.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-border-subtle p-8 text-center space-y-2.5">
                  <Smartphone className="w-10 h-10 text-content-muted mx-auto" />
                  <h4 className="font-bold text-xs text-content-primary">No Mobile Banners Configured</h4>
                  <p className="text-[11px] text-content-muted max-w-sm mx-auto">
                    No banners are assigned to mobile. The mobile storefront will safely render the deliberate image-free CSS hero.
                  </p>
                  <button
                    onClick={() => openCreateBanner('mobile')}
                    className="px-3.5 py-1.5 rounded-btn bg-emerald-700 text-white text-xs font-bold shadow-sm"
                  >
                    + Create Mobile Banner
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {mobileBanners.map((ban) => {
                    const hasImage = !!(ban.imageUrl && ban.imageUrl.trim());
                    return (
                      <div
                        key={ban.id}
                        className={`bg-canvas rounded-card border transition-all overflow-hidden flex flex-col justify-between ${
                          ban.isActive ? 'border-border-subtle shadow-xs' : 'border-border-subtle/50 opacity-75'
                        }`}
                      >
                        <div>
                          {/* 390:220 Smartphone Aspect Ratio Preview */}
                          <div
                            style={{
                              backgroundColor: ban.backgroundColor || '#072C20',
                              color: ban.textColor || '#FFFFFF'
                            }}
                            className="relative aspect-[390/220] w-full overflow-hidden flex items-center p-4 transition-colors"
                          >
                            {hasImage && (
                              <img
                                src={ban.imageUrl}
                                alt={ban.title}
                                referrerPolicy="no-referrer"
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            )}

                            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none" />

                            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/20">
                                📱 Mobile Only
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white/90 border border-white/20">
                                {hasImage ? 'With Image' : 'Pure CSS (Zero Images)'}
                              </span>
                              <button
                                onClick={() => handleToggleBannerActive(ban.id)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs transition-colors ${
                                  ban.isActive ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-white/80'
                                }`}
                              >
                                {ban.isActive ? 'Active' : 'Draft'}
                              </button>
                            </div>

                            <div className="relative z-10 space-y-1 max-w-sm">
                              {ban.eyebrow && (
                                <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#FAD982]">
                                  {ban.eyebrow}
                                </span>
                              )}
                              <h4 className="font-serif font-bold text-sm leading-tight text-white line-clamp-2">
                                {ban.title || <span className="italic opacity-70 font-sans text-xs">Image-Only Hero Banner</span>}
                              </h4>
                              {ban.subtitle && (
                                <p className="text-[10px] text-white/80 line-clamp-1 font-sans">
                                  {ban.subtitle}
                                </p>
                              )}
                            </div>

                            <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[9px] text-white font-mono z-10">
                              Priority: #{ban.displayOrder}
                            </div>
                          </div>

                          <div className="p-3.5 space-y-1.5 text-xs bg-white">
                            <h4 className="font-serif font-bold text-sm text-content-primary line-clamp-1">
                              {ban.title || <span className="italic text-content-muted font-sans text-xs">Image-Only Hero Banner</span>}
                            </h4>
                            {ban.subtitle && (
                              <p className="text-[11px] text-content-muted line-clamp-1">{ban.subtitle}</p>
                            )}
                            <div className="pt-1 flex items-center justify-between text-[11px]">
                              <span className="text-content-muted">CTA: <strong>{ban.ctaText || 'Shop Now'}</strong></span>
                              <span className="text-brand-primary font-mono truncate max-w-[160px]">→ {ban.linkUrl}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-2.5 bg-canvas-subtle border-t border-border-subtle flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => moveBannerOrder(ban, 'up')}
                              className="p-1 rounded border border-border-subtle hover:bg-white text-content-muted"
                              title="Increase priority"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => moveBannerOrder(ban, 'down')}
                              className="p-1 rounded border border-border-subtle hover:bg-white text-content-muted"
                              title="Decrease priority"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            {hasImage && (
                              <button
                                onClick={() => handleClearBannerImage(ban.id)}
                                className="px-2 py-0.5 rounded border border-border-subtle hover:bg-white text-[10px] font-bold text-rose-600 ml-1"
                              >
                                Remove Image
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openEditBanner(ban)}
                              className="px-2 py-1 rounded text-xs font-semibold text-content-muted hover:text-brand-primary hover:bg-white border border-border-subtle flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(ban.id)}
                              className="px-2 py-1 rounded text-xs font-semibold text-content-muted hover:text-rose-600 hover:bg-white border border-border-subtle flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
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
      ) : activeTab === 'heritage_story' ? (
        <div className="space-y-4">
          <HeritageBannerEditor
            section={heritageStorySection}
            onSave={updateHeritageStorySection}
            canManage={canManageSections || isSuperAdmin}
          />
        </div>
      ) : activeTab === 'corporate_gifting' ? (
        <div className="space-y-4">
          <CorporateGiftingEditor
            section={corporateGiftingSection}
            onSave={updateCorporateGiftingSection}
            canManage={canManageHeroBanners}
          />
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
          <div className="bg-white rounded-card max-w-lg w-full p-6 shadow-elevated space-y-4 text-xs my-6 max-h-[90vh] overflow-y-auto">
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

            {/* Locked Target Display Device Badge */}
            <div className="p-3 bg-canvas-subtle rounded-xl border border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {deviceTarget === 'mobile' ? (
                  <>
                    <div className="w-7 h-7 rounded-lg bg-emerald-600/10 text-emerald-700 flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-content-primary block">
                        Target Display Device: Mobile Storefront
                      </span>
                      <p className="text-[11px] text-content-muted">
                        Locked to Section B (390:220 smartphone ratio). Renders strictly on mobile viewports.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-7 h-7 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                      <Monitor className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-content-primary block">
                        Target Display Device: Desktop Storefront
                      </span>
                      <p className="text-[11px] text-content-muted">
                        Locked to Section A (16:9 widescreen ratio). Renders strictly on desktop viewports.
                      </p>
                    </div>
                  </>
                )}
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white border border-border-subtle font-bold text-content-muted">
                Locked
              </span>
            </div>

            {/* Live Interactive Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-content-primary flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Live Storefront Preview</span>
                </label>
                <span className="text-[10px] text-content-muted">
                  {imageUrl ? 'Direct Image URL' : 'Pure CSS Design (Zero Images)'}
                </span>
              </div>

              <div
                style={{ backgroundColor: bgColor, color: textColor }}
                className={`relative rounded-xl overflow-hidden border border-border-subtle p-4 transition-all flex items-center ${
                  deviceTarget === 'mobile'
                    ? 'aspect-[390/220] max-w-[340px] mx-auto shadow-sm'
                    : 'aspect-[16/9] w-full'
                }`}
              >
                {imageUrl && imageUrl.trim() ? (
                  imageStatus === 'invalid' ? (
                    <div className="absolute inset-0 bg-rose-950/80 flex flex-col items-center justify-center p-4 text-center z-20">
                      <AlertTriangle className="w-6 h-6 text-rose-400 mb-1" />
                      <p className="text-xs font-bold text-rose-200">Image Failed to Load</p>
                      <p className="text-[10px] text-rose-300 font-mono line-clamp-1 max-w-xs">{imageUrl.trim()}</p>
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setImageRetryKey((k) => k + 1)}
                          className="px-2.5 py-1 rounded bg-white text-rose-800 text-xs font-bold shadow hover:bg-rose-50 flex items-center gap-1"
                        >
                          <RotateCw className="w-3 h-3" /> Retry Load
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setImageUrl('');
                            setImageStatus('idle');
                          }}
                          className="px-2.5 py-1 rounded bg-black/40 text-white text-xs font-medium border border-white/20"
                        >
                          Clear URL
                        </button>
                      </div>
                    </div>
                  ) : imageStatus === 'validating' ? (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-4 text-center z-20">
                      <Loader2 className="w-6 h-6 text-white animate-spin mb-1" />
                      <p className="text-xs text-white/90 font-medium">Loading and verifying direct image URL...</p>
                    </div>
                  ) : (
                    <img
                      key={`${imageUrl.trim()}-${imageRetryKey}`}
                      src={imageUrl.trim()}
                      referrerPolicy="no-referrer"
                      alt="Banner Preview"
                      className="absolute inset-0 w-full h-full object-cover"
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
                        setImageStatus('valid');
                        setImageErrorMsg('');
                      }}
                      onError={() => {
                        setImageStatus('invalid');
                        setImageDimensions(null);
                        setImageErrorMsg('Unable to load image from direct URL.');
                      }}
                    />
                  )
                ) : null}

                {(!title && !subtitle && !eyebrow && !showCta) ? (
                  <div className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded bg-black/60 text-white/90 text-[10px] font-medium border border-white/20">
                    Image-Only Banner • {isClickable ? 'Clickable' : 'Static'}
                  </div>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none" />

                    <div className="relative z-10 p-2 space-y-1 text-white max-w-sm">
                      {eyebrow && (
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#FAD982]">
                          {eyebrow}
                        </span>
                      )}
                      {title && (
                        <h4 className="font-serif font-bold text-sm text-amber-200">
                          {title}
                        </h4>
                      )}
                      {subtitle && (
                        <p className="text-[11px] text-white/90 line-clamp-2">
                          {subtitle}
                        </p>
                      )}
                      {showCta ? (
                        <div className="pt-1">
                          <span className="inline-block px-3 py-1 rounded-lg bg-[#A67732] text-white text-[10px] font-bold shadow">
                            {ctaText || 'Shop Now'} →
                          </span>
                        </div>
                      ) : isClickable && linkUrl ? (
                        <div className="pt-1 text-[10px] text-amber-200/90 font-mono">
                          Entire banner links to {linkUrl} {openInNewTab ? '(New Tab)' : ''}
                        </div>
                      ) : null}
                    </div>
                  </>
                )}
              </div>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-bold text-content-primary block mb-1">Headline Heading (Optional for Image-Only)</label>
                  <input
                    type="text"
                    placeholder="e.g. Authentic Kerala Flavours Delivered to Your Home"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-content-primary block mb-1">Badge / Eyebrow (Optional)</label>
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
                <label className="font-bold text-content-primary block mb-1">Subheadline Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Harvested from Wayanad farms, thinly sliced & fried fresh in 100% pure cold-pressed coconut oil."
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                />
              </div>

              {/* Direct Image URL Validation & Preview (Zero File Uploads) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-content-primary block text-xs">
                    Direct Image URL (Optional)
                  </label>
                  <span className="text-[10px] text-content-muted font-medium">
                    Zero File Uploads • Direct Image Link Only
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Leave empty for Pure CSS (zero images), or enter direct image URL (/assets/... or https://...)"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className={`w-full px-3 py-2 pr-16 border rounded-input text-xs font-mono transition-colors ${
                      imageStatus === 'invalid'
                        ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500'
                        : imageStatus === 'valid'
                        ? 'border-emerald-400 bg-emerald-50/20 text-emerald-900 focus:border-emerald-500'
                        : 'border-border-subtle focus:border-brand-primary'
                    }`}
                  />
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl('');
                        setImageStatus('idle');
                        setImageErrorMsg('');
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[10px] font-bold text-content-muted hover:text-rose-600 bg-canvas-subtle rounded border border-border-subtle"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Status indicators */}
                {imageStatus === 'validating' && (
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 shrink-0" />
                    <span>Verifying image URL reachability...</span>
                  </div>
                )}

                {imageStatus === 'valid' && (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      {imageDimensions ? `${imageDimensions.width} × ${imageDimensions.height} px verified — ` : ''}
                      Image link verified and ready to save.
                    </span>
                  </div>
                )}

                {imageStatus === 'invalid' && (
                  <div className="flex items-start gap-1.5 text-[11px] text-rose-800 bg-rose-50 p-2 rounded-lg border border-rose-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <strong className="block font-semibold">Unable to load image from URL</strong>
                      <p className="text-[10px] text-content-muted font-mono break-all">{imageUrl.trim()}</p>
                      <p className="text-[10px] text-rose-700">{imageErrorMsg || 'Please provide a valid, reachable image URL or clear the field for Pure CSS.'}</p>
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setImageRetryKey((k) => k + 1)}
                          className="px-2.5 py-1 text-xs font-bold rounded bg-rose-100 text-rose-800 hover:bg-rose-200 flex items-center gap-1 transition-colors"
                        >
                          <RotateCw className="w-3 h-3" />
                          <span>Retry Load</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setImageUrl('');
                            setImageStatus('idle');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-canvas border border-border-subtle hover:bg-canvas-subtle transition-colors"
                        >
                          Clear URL
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!imageUrl && (
                  <p className="text-[11px] text-content-muted">
                    Leave empty to display a <strong>Pure CSS (zero images)</strong> luxury hero with the color preset below.
                  </p>
                )}
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

              {/* CTA & Click Behavior Controls */}
              <div className="p-3 bg-canvas-subtle rounded-xl border border-border-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showCta}
                      onChange={(e) => setShowCta(e.target.checked)}
                      className="rounded text-brand-primary focus:ring-brand-primary"
                    />
                    <span className="font-bold text-content-primary text-xs">Enable CTA Button</span>
                  </label>
                  <span className="text-[10px] text-content-muted">
                    {showCta ? 'Shows call-to-action button' : 'Omit button (Image-only or clickable)'}
                  </span>
                </div>

                {showCta ? (
                  <div className="grid grid-cols-2 gap-3 pt-1">
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
                ) : (
                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="font-bold text-content-primary block mb-1">Banner Destination URL</label>
                      <input
                        type="text"
                        placeholder="/category/chips"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs font-mono"
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                      <input
                        type="checkbox"
                        checked={isClickable}
                        onChange={(e) => setIsClickable(e.target.checked)}
                        className="rounded text-brand-primary focus:ring-brand-primary"
                      />
                      <span className="font-medium text-content-primary text-xs">
                        Make entire banner image clickable to destination URL
                      </span>
                    </label>
                  </div>
                )}

                <div className="pt-1 border-t border-border-subtle/60">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={openInNewTab}
                      onChange={(e) => setOpenInNewTab(e.target.checked)}
                      className="rounded text-brand-primary focus:ring-brand-primary"
                    />
                    <span className="text-[11px] text-content-secondary font-medium">
                      Open destination link in new browser tab (_blank)
                    </span>
                  </label>
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
                {catImageUrl && catImageUrl.trim() ? (
                  catImageStatus === 'invalid' ? (
                    <div className="absolute inset-0 bg-rose-950/80 flex flex-col items-center justify-center p-3 text-center z-20">
                      <AlertTriangle className="w-5 h-5 text-rose-400 mb-1" />
                      <p className="text-xs font-bold text-rose-200">Category Image Failed to Load</p>
                      <button
                        type="button"
                        onClick={() => setCatImageRetryKey((k) => k + 1)}
                        className="mt-1.5 px-2.5 py-1 rounded bg-white text-rose-800 text-[11px] font-bold shadow hover:bg-rose-50 flex items-center gap-1"
                      >
                        <RotateCw className="w-3 h-3" /> Retry Load
                      </button>
                    </div>
                  ) : catImageStatus === 'validating' ? (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-3 text-center z-20">
                      <Loader2 className="w-5 h-5 text-white animate-spin mb-1" />
                      <p className="text-[11px] text-white font-medium">Verifying category image URL...</p>
                    </div>
                  ) : (
                    <img
                      key={`${catImageUrl.trim()}-${catImageRetryKey}`}
                      src={catImageUrl.trim()}
                      referrerPolicy="no-referrer"
                      alt="Category background preview"
                      className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        setCatImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
                        setCatImageStatus('valid');
                        setCatImageErrorMsg('');
                      }}
                      onError={() => {
                        setCatImageStatus('invalid');
                        setCatImageDimensions(null);
                        setCatImageErrorMsg('Unable to load image from direct URL.');
                      }}
                    />
                  )
                ) : null}

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
                <div className="flex items-center justify-between mb-0.5">
                  <label className="font-bold text-content-primary block text-xs">
                    Optional Background Image URL (Empty by default)
                  </label>
                  <span className="text-[10px] text-content-muted font-medium">
                    Direct Image Link Only
                  </span>
                </div>
                <p className="text-[10px] text-content-muted mb-1">
                  Default is pure CSS background. Only provide a genuine image URL if available.
                </p>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Leave empty for image-free CSS banner, or enter direct URL (https://... or /assets/...)"
                    value={catImageUrl}
                    onChange={(e) => setCatImageUrl(e.target.value)}
                    className={`w-full px-3 py-2 pr-16 border rounded-input text-xs font-mono transition-colors ${
                      catImageStatus === 'invalid'
                        ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500'
                        : catImageStatus === 'valid'
                        ? 'border-emerald-400 bg-emerald-50/20 text-emerald-900 focus:border-emerald-500'
                        : 'border-border-subtle focus:border-brand-primary'
                    }`}
                  />
                  {catImageUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setCatImageUrl('');
                        setCatImageStatus('idle');
                        setCatImageDimensions(null);
                        setCatImageErrorMsg('');
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[10px] font-bold text-content-muted hover:text-rose-600 bg-canvas-subtle rounded border border-border-subtle"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Status indicators */}
                {catImageStatus === 'validating' && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 shrink-0" />
                    <span>Verifying category image URL reachability...</span>
                  </div>
                )}

                {catImageStatus === 'valid' && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      {catImageDimensions ? `${catImageDimensions.width} × ${catImageDimensions.height} px verified — ` : ''}
                      Category banner image verified and ready to save.
                    </span>
                  </div>
                )}

                {catImageStatus === 'invalid' && (
                  <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-rose-800 bg-rose-50 p-2 rounded-lg border border-rose-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <strong className="block font-semibold">Unable to load image from URL</strong>
                      <p className="text-[10px] text-content-muted font-mono break-all">{catImageUrl.trim()}</p>
                      <p className="text-[10px] text-rose-700">{catImageErrorMsg || 'Please provide an accessible image URL or clear the field for Pure CSS.'}</p>
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCatImageRetryKey((k) => k + 1)}
                          className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[11px] font-bold hover:bg-rose-200 flex items-center gap-1"
                        >
                          <RotateCw className="w-3 h-3" /> Retry Load
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCatImageUrl('');
                            setCatImageStatus('idle');
                          }}
                          className="px-2 py-0.5 rounded bg-white text-content-secondary border border-border-subtle text-[11px] hover:bg-canvas-subtle"
                        >
                          Clear URL
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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

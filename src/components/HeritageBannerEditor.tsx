import React, { useState, useEffect } from 'react';
import {
  Eye,
  Save,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Smartphone,
  Monitor,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { HeritageStorySectionConfig } from '../types';
import { useToast } from '../context/ToastContext';

interface HeritageBannerEditorProps {
  section: HeritageStorySectionConfig;
  onSave: (config: HeritageStorySectionConfig) => Promise<{ success: boolean; error?: string }>;
  canManage: boolean;
}

export const HeritageBannerEditor: React.FC<HeritageBannerEditorProps> = ({
  section,
  onSave,
  canManage
}) => {
  const { showToast } = useToast();

  const DEFAULT_CONFIG: HeritageStorySectionConfig = {
    id: 'h0000000-0000-0000-0000-000000000004',
    eyebrow: 'TRADITION MEETS PURITY',
    heading: 'Pure Ingredients, Generational Craft',
    subtitle: 'Rooted in Kerala. Crafted for Every Kitchen.',
    description:
      'Hand-picked raw materials, cold-pressed coconut oil, zero preservatives, and traditional recipes perfected across three generations.',
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

  const [eyebrow, setEyebrow] = useState(section?.eyebrow || DEFAULT_CONFIG.eyebrow);
  const [heading, setHeading] = useState(section?.heading || DEFAULT_CONFIG.heading);
  const [subtitle, setSubtitle] = useState(section?.subtitle || DEFAULT_CONFIG.subtitle);
  const [description, setDescription] = useState(section?.description || DEFAULT_CONFIG.description);
  const [imageUrl, setImageUrl] = useState(section?.imageUrl ?? DEFAULT_CONFIG.imageUrl);
  const [ctaLabel, setCtaLabel] = useState(section?.ctaLabel || DEFAULT_CONFIG.ctaLabel);
  const [ctaDestination, setCtaDestination] = useState(
    section?.ctaDestination || DEFAULT_CONFIG.ctaDestination
  );
  const [bgPreset, setBgPreset] = useState(section?.bgPreset || DEFAULT_CONFIG.bgPreset);
  const [textColor, setTextColor] = useState(section?.textColor || DEFAULT_CONFIG.textColor);
  const [isActive, setIsActive] = useState(section?.isActive !== false);
  const [desktopVisible, setDesktopVisible] = useState(section?.desktopVisible !== false);
  const [mobileVisible, setMobileVisible] = useState(section?.mobileVisible !== false);
  const [displayOrder, setDisplayOrder] = useState(section?.displayOrder || 6);

  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [imageTestError, setImageTestError] = useState(false);

  useEffect(() => {
    if (section) {
      setEyebrow(section.eyebrow || DEFAULT_CONFIG.eyebrow);
      setHeading(section.heading || DEFAULT_CONFIG.heading);
      setSubtitle(section.subtitle || DEFAULT_CONFIG.subtitle);
      setDescription(section.description || DEFAULT_CONFIG.description);
      setImageUrl(section.imageUrl ?? DEFAULT_CONFIG.imageUrl);
      setCtaLabel(section.ctaLabel || DEFAULT_CONFIG.ctaLabel);
      setCtaDestination(section.ctaDestination || DEFAULT_CONFIG.ctaDestination);
      setBgPreset(section.bgPreset || DEFAULT_CONFIG.bgPreset);
      setTextColor(section.textColor || DEFAULT_CONFIG.textColor);
      setIsActive(section.isActive !== false);
      setDesktopVisible(section.desktopVisible !== false);
      setMobileVisible(section.mobileVisible !== false);
      setDisplayOrder(section.displayOrder || 6);
    }
  }, [section]);

  useEffect(() => {
    setImageTestError(false);
  }, [imageUrl]);

  const COLOR_PRESETS = [
    { label: 'Warm Ivory (Signature)', bg: '#FAF6EE', text: '#1C1917' },
    { label: 'Forest Green (Heritage)', bg: '#072C20', text: '#FFFFFF' },
    { label: 'Royal Malabar', bg: '#38220F', text: '#FFFFFF' },
    { label: 'Deep Charcoal', bg: '#1C1917', text: '#FFFFFF' }
  ];

  const PRESET_IMAGES = [
    { label: 'Banana Chips Craft', url: '/assets/prod-banana-chips-hero.png' },
    { label: 'Kerala Delicacies', url: '/assets/prod-halwa-combo.png' },
    { label: 'Spices & Sweets', url: '/assets/cat-combos.png' }
  ];

  const handleApplyPreset = (preset: { bg: string; text: string }) => {
    setBgPreset(preset.bg);
    setTextColor(preset.text);
  };

  const handleRestoreDefaults = () => {
    if (!window.confirm('Restore central heritage banner to default brand content?')) return;
    setEyebrow(DEFAULT_CONFIG.eyebrow);
    setHeading(DEFAULT_CONFIG.heading);
    setSubtitle(DEFAULT_CONFIG.subtitle);
    setDescription(DEFAULT_CONFIG.description);
    setImageUrl(DEFAULT_CONFIG.imageUrl);
    setCtaLabel(DEFAULT_CONFIG.ctaLabel);
    setCtaDestination(DEFAULT_CONFIG.ctaDestination);
    setBgPreset(DEFAULT_CONFIG.bgPreset);
    setTextColor(DEFAULT_CONFIG.textColor);
    setIsActive(true);
    setDesktopVisible(true);
    setMobileVisible(true);
    setDisplayOrder(6);
    showToast('Defaults Restored', 'Click "Save Changes" to publish.', 'info');
  };

  const handleSave = async () => {
    if (!heading.trim()) {
      showToast('Validation Error', 'Heading cannot be empty.', 'error');
      return;
    }
    if (!ctaLabel.trim() || !ctaDestination.trim()) {
      showToast('Validation Error', 'CTA label and destination are required.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const configToSave: HeritageStorySectionConfig = {
        id: section?.id || DEFAULT_CONFIG.id,
        eyebrow: eyebrow.trim(),
        heading: heading.trim(),
        subtitle: subtitle.trim(),
        description: description.trim(),
        imageUrl: (imageUrl || '').trim(),
        ctaLabel: ctaLabel.trim(),
        ctaDestination: ctaDestination.trim(),
        bgPreset,
        textColor,
        isActive,
        displayOrder,
        desktopVisible,
        mobileVisible
      };

      const res = await onSave(configToSave);
      if (res.success) {
        showToast('Heritage Banner Saved', 'Homepage central banner updated in Supabase.', 'success');
      } else {
        showToast('Save Failed', res.error || 'Could not update banner.', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h3 className="font-serif font-bold text-base text-content-primary">
              Heritage / Story Banner Editor
            </h3>
          </div>
          <p className="text-xs text-content-secondary mt-0.5">
            Configure the central narrative section ("Pure Ingredients, Generational Craft") on the homepage.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleRestoreDefaults}
            disabled={!canManage || isSaving}
            className="px-3 py-1.5 rounded-lg border border-border hover:bg-canvas text-xs font-semibold text-content-secondary flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Defaults</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canManage || isSaving}
            className="px-4 py-1.5 rounded-lg bg-brand-primary hover:bg-brand-primary-hover active:scale-[0.98] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Fields & Toggles */}
        <div className="lg:col-span-7 space-y-4">
          {/* Status & Display Toggles Card */}
          <div className="bg-white p-4 rounded-xl border border-border shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-content-primary uppercase tracking-wider">
              Section Visibility &amp; Ordering
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-lg border border-border hover:bg-canvas-subtle transition-colors">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={!canManage}
                  className="rounded text-brand-primary focus:ring-brand-primary w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-content-primary block">Active on Store</span>
                  <span className="text-[10px] text-content-muted block">Enable on homepage</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-lg border border-border hover:bg-canvas-subtle transition-colors">
                <input
                  type="checkbox"
                  checked={desktopVisible}
                  onChange={(e) => setDesktopVisible(e.target.checked)}
                  disabled={!canManage}
                  className="rounded text-brand-primary focus:ring-brand-primary w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-content-primary block">Desktop View</span>
                  <span className="text-[10px] text-content-muted block">Visible on large screens</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-lg border border-border hover:bg-canvas-subtle transition-colors">
                <input
                  type="checkbox"
                  checked={mobileVisible}
                  onChange={(e) => setMobileVisible(e.target.checked)}
                  disabled={!canManage}
                  className="rounded text-brand-primary focus:ring-brand-primary w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-content-primary block">Mobile View</span>
                  <span className="text-[10px] text-content-muted block">Visible on mobile devices</span>
                </div>
              </label>
            </div>
          </div>

          {/* Copywriting & Content Card */}
          <div className="bg-white p-4 rounded-xl border border-border shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-content-primary uppercase tracking-wider">
              Banner Content &amp; Story Copy
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Eyebrow / Badge Text
                </label>
                <input
                  type="text"
                  value={eyebrow}
                  onChange={(e) => setEyebrow(e.target.value)}
                  disabled={!canManage}
                  placeholder="e.g. TRADITION MEETS PURITY"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-canvas-subtle focus:bg-white focus:border-brand-primary focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Main Headline
                </label>
                <input
                  type="text"
                  value={heading}
                  onChange={(e) => setHeading(e.target.value)}
                  disabled={!canManage}
                  placeholder="e.g. Pure Ingredients, Generational Craft"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-canvas-subtle focus:bg-white focus:border-brand-primary focus:outline-none transition-colors font-serif font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Subtitle / Subheading
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  disabled={!canManage}
                  placeholder="e.g. Rooted in Kerala. Crafted for Every Kitchen."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-canvas-subtle focus:bg-white focus:border-brand-primary focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Body Narrative / Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!canManage}
                  placeholder="Describe your generational craft, cold-pressed oils, spice provenance..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-canvas-subtle focus:bg-white focus:border-brand-primary focus:outline-none transition-colors leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Direct Image URL & Presets */}
          <div className="bg-white p-4 rounded-xl border border-border shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-content-primary uppercase tracking-wider">
                Direct Image URL &amp; Media
              </h4>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  <span>Clear Image (Text-Only Mode)</span>
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-primary mb-1">
                Image URL (Direct Path or CDN Link)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  disabled={!canManage}
                  placeholder="/assets/prod-banana-chips-hero.png or https://..."
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-border bg-canvas-subtle focus:bg-white focus:border-brand-primary focus:outline-none transition-colors font-mono"
                />
              </div>
              <p className="text-[10px] text-content-muted mt-1">
                Tip: Leave blank to display an elegant full-width text-only layout without broken placeholders.
              </p>
            </div>

            {/* Quick Presets */}
            <div>
              <span className="text-[10px] font-bold text-content-secondary uppercase tracking-wider block mb-1.5">
                Quick Image Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_IMAGES.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setImageUrl(p.url)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors flex items-center gap-1 ${
                      imageUrl === p.url
                        ? 'bg-amber-100 border-[#A67732] text-[#A67732] font-bold'
                        : 'bg-canvas-subtle border-border text-content-secondary hover:bg-canvas'
                    }`}
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Destination Card */}
          <div className="bg-white p-4 rounded-xl border border-border shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-content-primary uppercase tracking-wider">
              Call-to-Action (CTA) Button
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Button Label
                </label>
                <input
                  type="text"
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  disabled={!canManage}
                  placeholder="e.g. Read Our Story"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-canvas-subtle focus:bg-white focus:border-brand-primary focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Destination URL
                </label>
                <input
                  type="text"
                  value={ctaDestination}
                  onChange={(e) => setCtaDestination(e.target.value)}
                  disabled={!canManage}
                  placeholder="e.g. /our-story or /about"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-canvas-subtle focus:bg-white focus:border-brand-primary focus:outline-none transition-colors font-mono"
                />
              </div>
            </div>
          </div>

          {/* Color Presets Card */}
          <div className="bg-white p-4 rounded-xl border border-border shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-content-primary uppercase tracking-wider">
              Brand Color Presets
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {COLOR_PRESETS.map((cp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(cp)}
                  className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                    bgPreset === cp.bg
                      ? 'border-brand-primary ring-2 ring-brand-primary/20 shadow-xs'
                      : 'border-border hover:border-brand-primary/40'
                  }`}
                >
                  <div
                    className="w-full h-8 rounded-md mb-2 border border-black/10 flex items-center justify-center font-bold text-xs"
                    style={{ backgroundColor: cp.bg, color: cp.text }}
                  >
                    Aa
                  </div>
                  <span className="text-[11px] font-bold text-content-primary block leading-tight">
                    {cp.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Live Preview */}
        <div className="lg:col-span-5 space-y-3">
          <div className="sticky top-4 space-y-3">
            <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-border shadow-xs">
              <span className="text-xs font-bold text-content-primary flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-brand-primary" />
                <span>Live Responsive Preview</span>
              </span>

              <div className="flex items-center bg-canvas-subtle p-0.5 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setPreviewMode('desktop')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                    previewMode === 'desktop'
                      ? 'bg-white shadow-2xs text-brand-primary font-bold'
                      : 'text-content-muted hover:text-content-primary'
                  }`}
                >
                  <Monitor className="w-3 h-3" />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('mobile')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                    previewMode === 'mobile'
                      ? 'bg-white shadow-2xs text-brand-primary font-bold'
                      : 'text-content-muted hover:text-content-primary'
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Mobile</span>
                </button>
              </div>
            </div>

            {/* Simulated Frame */}
            <div
              className={`mx-auto transition-all duration-300 ${
                previewMode === 'mobile' ? 'max-w-[360px]' : 'w-full'
              }`}
            >
              <div
                className="rounded-2xl border p-5 relative overflow-hidden shadow-sm"
                style={{
                  backgroundColor: bgPreset,
                  borderColor:
                    bgPreset === '#072C20' || bgPreset === '#1C1917'
                      ? 'rgba(255,255,255,0.1)'
                      : '#EAE3D6',
                  color: textColor
                }}
              >
                {/* Decorative orb */}
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#A67732]/15 blur-2xl pointer-events-none" />

                <div className="space-y-3 relative z-10">
                  {eyebrow && (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-[#A67732]/20 text-[#A67732] border border-[#A67732]/30">
                      {eyebrow}
                    </span>
                  )}

                  <h3 className="font-serif font-bold text-base sm:text-lg leading-snug">
                    {heading || 'Pure Ingredients, Generational Craft'}
                    {subtitle && (
                      <span className="block text-xs font-normal text-[#A67732] mt-0.5">
                        {subtitle}
                      </span>
                    )}
                  </h3>

                  {description && (
                    <p className="text-xs opacity-80 leading-relaxed">
                      {description}
                    </p>
                  )}

                  {/* Image in preview if provided */}
                  {imageUrl && !imageTestError && (
                    <div className="my-2 rounded-xl overflow-hidden border border-black/10 aspect-[4/3] bg-black/5 flex items-center justify-center">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={() => setImageTestError(true)}
                      />
                    </div>
                  )}

                  {imageUrl && imageTestError && (
                    <div className="my-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] text-center">
                      Image URL could not be loaded. Please check the path.
                    </div>
                  )}

                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#072C20] text-white text-xs font-bold shadow-xs">
                      <span>{ctaLabel || 'Read Our Story'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Changes saved here persist directly to Supabase table <code className="font-mono font-bold">homepage_sections</code> (<code className="font-mono">heritage_story</code>). Refreshing the customer storefront immediately renders the updated content.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

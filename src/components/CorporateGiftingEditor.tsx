import React, { useState, useEffect } from 'react';
import {
  Gift,
  Eye,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  ArrowRight,
  MessageCircle,
  Smartphone,
  Monitor
} from 'lucide-react';
import { CorporateGiftingSectionConfig } from '../types';
import { useToast } from '../context/ToastContext';

interface CorporateGiftingEditorProps {
  section: CorporateGiftingSectionConfig;
  onSave: (config: CorporateGiftingSectionConfig) => Promise<{ success: boolean; error?: string }>;
  canManage: boolean;
}

export const CorporateGiftingEditor: React.FC<CorporateGiftingEditorProps> = ({
  section,
  onSave,
  canManage
}) => {
  const { showToast } = useToast();

  const DEFAULT_CONFIG: CorporateGiftingSectionConfig = {
    id: 'h0000000-0000-0000-0000-000000000003',
    eyebrow: 'Corporate & Wedding Gifting',
    heading: 'Planning a Festive Gathering or Corporate Event?',
    description:
      'Customized Kerala delicacy boxes, corporate gifting hampers, and wholesale spice orders handcrafted for your special occasions.',
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

  const [eyebrow, setEyebrow] = useState(section?.eyebrow || DEFAULT_CONFIG.eyebrow);
  const [heading, setHeading] = useState(section?.heading || DEFAULT_CONFIG.heading);
  const [description, setDescription] = useState(section?.description || DEFAULT_CONFIG.description);
  const [bulletPoints, setBulletPoints] = useState<string[]>(
    section?.bulletPoints || DEFAULT_CONFIG.bulletPoints
  );
  const [newBullet, setNewBullet] = useState('');
  const [primaryCtaLabel, setPrimaryCtaLabel] = useState(
    section?.primaryCtaLabel || DEFAULT_CONFIG.primaryCtaLabel
  );
  const [primaryCtaDestination, setPrimaryCtaDestination] = useState(
    section?.primaryCtaDestination || DEFAULT_CONFIG.primaryCtaDestination
  );
  const [secondaryCtaLabel, setSecondaryCtaLabel] = useState(
    section?.secondaryCtaLabel || DEFAULT_CONFIG.secondaryCtaLabel
  );
  const [secondaryCtaDestination, setSecondaryCtaDestination] = useState(
    section?.secondaryCtaDestination || DEFAULT_CONFIG.secondaryCtaDestination
  );
  const [bgPreset, setBgPreset] = useState(section?.bgPreset || DEFAULT_CONFIG.bgPreset);
  const [textColor, setTextColor] = useState(section?.textColor || DEFAULT_CONFIG.textColor);
  const [isActive, setIsActive] = useState(section?.isActive !== false);
  const [desktopVisible, setDesktopVisible] = useState(section?.desktopVisible !== false);
  const [mobileVisible, setMobileVisible] = useState(section?.mobileVisible !== false);
  const [displayOrder, setDisplayOrder] = useState(section?.displayOrder || 7);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (section) {
      setEyebrow(section.eyebrow || DEFAULT_CONFIG.eyebrow);
      setHeading(section.heading || DEFAULT_CONFIG.heading);
      setDescription(section.description || DEFAULT_CONFIG.description);
      setBulletPoints(section.bulletPoints || DEFAULT_CONFIG.bulletPoints);
      setPrimaryCtaLabel(section.primaryCtaLabel || DEFAULT_CONFIG.primaryCtaLabel);
      setPrimaryCtaDestination(section.primaryCtaDestination || DEFAULT_CONFIG.primaryCtaDestination);
      setSecondaryCtaLabel(section.secondaryCtaLabel || DEFAULT_CONFIG.secondaryCtaLabel);
      setSecondaryCtaDestination(section.secondaryCtaDestination || DEFAULT_CONFIG.secondaryCtaDestination);
      setBgPreset(section.bgPreset || DEFAULT_CONFIG.bgPreset);
      setTextColor(section.textColor || DEFAULT_CONFIG.textColor);
      setIsActive(section.isActive !== false);
      setDesktopVisible(section.desktopVisible !== false);
      setMobileVisible(section.mobileVisible !== false);
      setDisplayOrder(section.displayOrder || 7);
    }
  }, [section]);

  const handleAddBullet = () => {
    if (!newBullet.trim()) return;
    setBulletPoints((prev) => [...prev, newBullet.trim()]);
    setNewBullet('');
  };

  const handleRemoveBullet = (index: number) => {
    setBulletPoints((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRestoreDefault = () => {
    if (confirm('Restore default corporate gifting content? Any custom copy will be replaced with signature ZaDa brand text.')) {
      setEyebrow(DEFAULT_CONFIG.eyebrow);
      setHeading(DEFAULT_CONFIG.heading);
      setDescription(DEFAULT_CONFIG.description);
      setBulletPoints(DEFAULT_CONFIG.bulletPoints);
      setPrimaryCtaLabel(DEFAULT_CONFIG.primaryCtaLabel);
      setPrimaryCtaDestination(DEFAULT_CONFIG.primaryCtaDestination);
      setSecondaryCtaLabel(DEFAULT_CONFIG.secondaryCtaLabel);
      setSecondaryCtaDestination(DEFAULT_CONFIG.secondaryCtaDestination);
      setBgPreset(DEFAULT_CONFIG.bgPreset);
      setTextColor(DEFAULT_CONFIG.textColor);
      setIsActive(true);
      setDesktopVisible(true);
      setMobileVisible(true);
      showToast('Defaults Restored', 'Signature corporate gifting content restored.', 'info');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heading.trim()) {
      showToast('Validation Error', 'Heading is required.', 'error');
      return;
    }

    setIsSaving(true);
    const updated: CorporateGiftingSectionConfig = {
      id: section?.id || 'h0000000-0000-0000-0000-000000000003',
      eyebrow: eyebrow.trim(),
      heading: heading.trim(),
      description: description.trim(),
      bulletPoints,
      primaryCtaLabel: primaryCtaLabel.trim(),
      primaryCtaDestination: primaryCtaDestination.trim(),
      secondaryCtaLabel: secondaryCtaLabel.trim(),
      secondaryCtaDestination: secondaryCtaDestination.trim(),
      bgPreset,
      textColor,
      isActive,
      displayOrder: Number(displayOrder) || 7,
      desktopVisible,
      mobileVisible
    };

    const res = await onSave(updated);
    setIsSaving(false);

    if (res.success) {
      showToast('Corporate Banner Saved', 'Corporate gifting banner updated in database.', 'success');
    }
  };

  const COLOR_PRESETS = [
    { label: 'Forest Green (Signature)', bg: '#072C20', text: '#FFFFFF' },
    { label: 'Royal Malabar', bg: '#38220F', text: '#FFFFFF' },
    { label: 'Festive Burgundy', bg: '#4A1521', text: '#FFFFFF' },
    { label: 'Deep Teal', bg: '#1B3B2B', text: '#FFFFFF' },
    { label: 'Golden Harvest', bg: '#4A3511', text: '#FFFFFF' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif font-bold text-base text-content-primary flex items-center gap-2">
            <Gift className="w-5 h-5 text-[#A67732]" />
            <span>Corporate &amp; Wedding Gifting Banner</span>
          </h2>
          <p className="text-xs text-content-muted">
            Manage the large promotional editorial section on the homepage with live preview and device visibility controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRestoreDefault}
            className="px-3 py-1.5 rounded-btn border border-border-subtle bg-white text-content-secondary hover:text-content-primary text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Default</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !canManage}
            className="px-4 py-2 rounded-btn bg-[#A67732] hover:bg-[#8F6428] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Corporate Banner'}</span>
          </button>
        </div>
      </div>

      {/* Live Interactive Storefront Preview Card */}
      <div className="bg-canvas-subtle rounded-card border border-border-subtle p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#A67732]" />
            <span className="font-bold text-xs text-content-primary">Live Storefront Preview</span>
          </div>

          <div className="flex items-center bg-white p-0.5 rounded-pill border border-border-subtle text-xs">
            <button
              type="button"
              onClick={() => setPreviewMode('desktop')}
              className={`px-2.5 py-1 rounded-pill font-bold transition-all flex items-center gap-1 ${
                previewMode === 'desktop'
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-content-muted'
              }`}
            >
              <Monitor className="w-3 h-3" />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('mobile')}
              className={`px-2.5 py-1 rounded-pill font-bold transition-all flex items-center gap-1 ${
                previewMode === 'mobile'
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-content-muted'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span>Mobile (390px)</span>
            </button>
          </div>
        </div>

        {/* The rendered preview matching HomePage Section 7 */}
        <div
          className={`mx-auto transition-all duration-300 ${
            previewMode === 'mobile' ? 'max-w-[390px]' : 'w-full'
          }`}
        >
          {!isActive ? (
            <div className="p-8 bg-white rounded-2xl border border-dashed border-stone-300 text-center text-xs text-content-muted">
              Section is currently <strong>Inactive / Unpublished</strong>. It will be hidden from the storefront.
            </div>
          ) : (
            <div
              style={{ backgroundColor: bgPreset, color: textColor }}
              className="rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm border border-emerald-950/40 overflow-hidden relative"
            >
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#A67732]/15 blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-2xl space-y-3">
                {eyebrow && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {eyebrow}
                  </span>
                )}

                <h3 className="font-serif font-bold text-lg sm:text-2xl leading-snug">
                  {heading}
                </h3>

                {description && (
                  <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-xl">
                    {description}
                  </p>
                )}

                {bulletPoints.length > 0 && (
                  <ul className="space-y-1.5 pt-1">
                    {bulletPoints.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-white/90">
                        <Check className="w-4 h-4 text-amber-400 shrink-0 stroke-[2.5]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
                  <div className="px-4 py-2 rounded-xl bg-[#A67732] text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5">
                    <span>{primaryCtaLabel || 'Discuss a Custom Order'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>

                  <div className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold border border-white/20 flex items-center justify-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{secondaryCtaLabel || 'Chat on WhatsApp'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor Controls Form */}
      <form onSubmit={handleSave} className="bg-white rounded-card border border-border-subtle p-5 shadow-2xs space-y-5">
        <h3 className="font-bold text-sm text-content-primary">Banner Content &amp; Controls</h3>

        {/* Visibility Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3.5 rounded-xl bg-canvas-subtle border border-border-subtle text-xs">
          <div>
            <label className="font-bold text-content-primary block mb-1">Active Status</label>
            <label className="flex items-center gap-2 cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-brand-primary"
              />
              <span className="font-medium">{isActive ? 'Section Active (Published)' : 'Section Hidden (Draft)'}</span>
            </label>
          </div>

          <div>
            <label className="font-bold text-content-primary block mb-1">Desktop Visibility</label>
            <label className="flex items-center gap-2 cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={desktopVisible}
                onChange={(e) => setDesktopVisible(e.target.checked)}
                className="rounded text-brand-primary"
              />
              <span className="font-medium">{desktopVisible ? 'Visible on Desktop' : 'Hidden on Desktop'}</span>
            </label>
          </div>

          <div>
            <label className="font-bold text-content-primary block mb-1">Mobile Visibility</label>
            <label className="flex items-center gap-2 cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={mobileVisible}
                onChange={(e) => setMobileVisible(e.target.checked)}
                className="rounded text-brand-primary"
              />
              <span className="font-medium">{mobileVisible ? 'Visible on Mobile' : 'Hidden on Mobile'}</span>
            </label>
          </div>
        </div>

        {/* Text Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Eyebrow / Badge Text
            </label>
            <input
              type="text"
              value={eyebrow}
              onChange={(e) => setEyebrow(e.target.value)}
              className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs font-medium focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Display Order
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 7)}
              className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs font-medium focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Main Headline *
            </label>
            <input
              type="text"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs font-medium focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Description / Supporting Copy
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs font-medium focus:ring-1 focus:ring-brand-primary"
            />
          </div>
        </div>

        {/* Bullet Points List Editor */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-content-primary">
            Key Highlights / Bullet Points
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newBullet}
              onChange={(e) => setNewBullet(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddBullet();
                }
              }}
              placeholder="e.g. Customized Kerala delicacy boxes"
              className="flex-1 px-3 py-2 border border-border-subtle rounded-input text-xs font-medium focus:ring-1 focus:ring-brand-primary"
            />
            <button
              type="button"
              onClick={handleAddBullet}
              className="px-3.5 py-2 rounded-btn bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover shadow-2xs flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Point</span>
            </button>
          </div>

          <div className="space-y-1.5 pt-1">
            {bulletPoints.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-canvas-subtle border border-border-subtle text-xs"
              >
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-600" />
                  <span>{item}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveBullet(idx)}
                  className="text-stone-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Destinations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border-subtle">
          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Primary CTA Label
            </label>
            <input
              type="text"
              value={primaryCtaLabel}
              onChange={(e) => setPrimaryCtaLabel(e.target.value)}
              className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs font-medium focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Primary CTA Destination URL
            </label>
            <input
              type="text"
              value={primaryCtaDestination}
              onChange={(e) => setPrimaryCtaDestination(e.target.value)}
              placeholder="/bulk-orders"
              className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs font-medium focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Secondary CTA Label
            </label>
            <input
              type="text"
              value={secondaryCtaLabel}
              onChange={(e) => setSecondaryCtaLabel(e.target.value)}
              className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs font-medium focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Secondary CTA Destination URL
            </label>
            <input
              type="text"
              value={secondaryCtaDestination}
              onChange={(e) => setSecondaryCtaDestination(e.target.value)}
              placeholder="https://wa.me/917593959235"
              className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs font-medium focus:ring-1 focus:ring-brand-primary"
            />
          </div>
        </div>

        {/* Background Colour Presets */}
        <div className="pt-2 border-t border-border-subtle space-y-2">
          <label className="block text-xs font-semibold text-content-primary">
            Background Colour Preset
          </label>
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map((p) => (
              <button
                key={p.bg}
                type="button"
                onClick={() => {
                  setBgPreset(p.bg);
                  setTextColor(p.text);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-2 transition-all ${
                  bgPreset === p.bg ? 'ring-2 ring-brand-primary shadow-xs' : 'opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: p.bg, color: p.text }}
              >
                <span className="w-2.5 h-2.5 rounded-full border border-white/40" style={{ backgroundColor: p.bg }} />
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-border-subtle">
          <button
            type="submit"
            disabled={isSaving || !canManage}
            className="px-5 py-2.5 rounded-btn bg-[#A67732] hover:bg-[#8F6428] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving to Database...' : 'Save Corporate Banner'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

import React, { useRef, useEffect, useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Star, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';

export interface MultipleImageUrlsEditorProps {
  label?: string;
  imageUrls: string[];
  onChange: (urls: string[]) => void;
  helpText?: string;
}

interface ImagePreviewItemProps {
  url: string;
  index: number;
  isPrimary: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canRemove: boolean;
  inputRef: (el: HTMLInputElement | null) => void;
  onUrlChange: (val: string) => void;
  onSetPrimary: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

const ImagePreviewRow: React.FC<ImagePreviewItemProps> = ({
  url,
  index,
  isPrimary,
  canMoveUp,
  canMoveDown,
  canRemove,
  inputRef,
  onUrlChange,
  onSetPrimary,
  onMoveUp,
  onMoveDown,
  onRemove
}) => {
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const trimmed = (url || '').trim().replace(/^["']|["']$/g, '');

  useEffect(() => {
    if (!trimmed) {
      setLoadStatus('idle');
      return;
    }

    const isValid = trimmed.startsWith('/') || /^https?:\/\//i.test(trimmed);
    if (!isValid) {
      setLoadStatus('error');
      return;
    }

    setLoadStatus('loading');
    let isCancelled = false;
    const img = new Image();
    img.referrerPolicy = 'no-referrer';

    img.onload = () => {
      if (!isCancelled) setLoadStatus('success');
    };
    img.onerror = () => {
      if (!isCancelled) setLoadStatus('error');
    };
    img.src = trimmed;

    return () => {
      isCancelled = true;
    };
  }, [trimmed]);

  return (
    <div
      className={`p-3 rounded-xl border transition-all ${
        isPrimary
          ? 'bg-amber-50/40 border-[#A67732]/40 shadow-xs ring-1 ring-[#A67732]/20'
          : 'bg-[#FAF7F2] border-[#EAE3D6] hover:border-border'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {isPrimary ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#A67732] text-white shadow-2xs">
              <Star className="w-3 h-3 fill-current" />
              <span>Primary Cover (Card &amp; Hero)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-200/80 text-stone-700">
              <span>Gallery Photo #{index + 1}</span>
            </span>
          )}

          {loadStatus === 'success' && (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Valid Image</span>
            </span>
          )}
          {loadStatus === 'error' && trimmed.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>Unreachable URL</span>
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 self-end sm:self-auto">
          {!isPrimary && (
            <button
              type="button"
              onClick={onSetPrimary}
              className="px-2 py-1 text-[11px] font-semibold text-[#A67732] hover:text-[#8F6428] hover:bg-[#F3ECE1] rounded transition-colors cursor-pointer"
              title="Set as primary image"
            >
              Make Primary
            </button>
          )}

          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="p-1 text-content-muted hover:text-content-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer rounded hover:bg-stone-200/60"
            title="Move up in gallery order"
            aria-label="Move image up"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="p-1 text-content-muted hover:text-content-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer rounded hover:bg-stone-200/60"
            title="Move down in gallery order"
            aria-label="Move image down"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onRemove}
            disabled={!canRemove}
            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Remove this image"
            aria-label="Remove image"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Thumbnail Preview Box */}
        <div className="w-14 h-14 rounded-lg border border-[#E0D8CB] bg-white overflow-hidden shrink-0 flex items-center justify-center relative">
          {trimmed && loadStatus !== 'error' ? (
            <img
              src={trimmed}
              alt={`Product preview ${index + 1}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-stone-400 p-1">
              <ImageIcon className="w-5 h-5 stroke-[1.5]" />
            </div>
          )}
        </div>

        {/* Input Field */}
        <div className="flex-1">
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://... direct image link or /assets/photo.png"
            className="w-full px-3 py-2 text-xs bg-white border border-[#E0D8CB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#A67732] focus:border-[#A67732] transition-colors font-mono"
          />
        </div>
      </div>
    </div>
  );
};

export const MultipleImageUrlsEditor: React.FC<MultipleImageUrlsEditorProps> = ({
  label = 'Product Images & Gallery',
  imageUrls,
  onChange,
  helpText = 'Add multiple direct image URLs. Image #1 will be used as the Primary Cover across product cards, bestsellers, and search. Additional images will automatically form the customer photo gallery on the Product Detail Page.'
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pendingFocusIndex = useRef<number | null>(null);

  // Ensure at least one item
  const safeUrls = imageUrls.length === 0 ? [''] : imageUrls;

  useEffect(() => {
    if (pendingFocusIndex.current !== null) {
      const idx = pendingFocusIndex.current;
      pendingFocusIndex.current = null;
      if (inputRefs.current[idx]) {
        inputRefs.current[idx]?.focus();
      }
    }
  });

  const handleUrlChange = (index: number, val: string) => {
    const updated = [...safeUrls];
    updated[index] = val;
    onChange(updated);
  };

  const handleAddImage = () => {
    const updated = [...safeUrls, ''];
    pendingFocusIndex.current = updated.length - 1;
    onChange(updated);
  };

  const handleRemoveImage = (index: number) => {
    if (safeUrls.length <= 1) {
      onChange(['']);
      return;
    }
    const updated = safeUrls.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    const updated = [...safeUrls];
    const [selected] = updated.splice(index, 1);
    updated.unshift(selected);
    onChange(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...safeUrls];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    onChange(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === safeUrls.length - 1) return;
    const updated = [...safeUrls];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    onChange(updated);
  };

  const configuredCount = safeUrls.filter((u) => u.trim().length > 0).length;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="font-bold text-xs text-content-primary">{label}</label>
        <span className="text-[11px] text-content-muted font-medium">
          {configuredCount} image{configuredCount === 1 ? '' : 's'} configured
        </span>
      </div>

      <div className="space-y-2">
        {safeUrls.map((url, index) => (
          <ImagePreviewRow
            key={index}
            url={url}
            index={index}
            isPrimary={index === 0}
            canMoveUp={index > 0}
            canMoveDown={index < safeUrls.length - 1}
            canRemove={safeUrls.length > 1 || url.trim().length > 0}
            inputRef={(el) => (inputRefs.current[index] = el)}
            onUrlChange={(val) => handleUrlChange(index, val)}
            onSetPrimary={() => handleSetPrimary(index)}
            onMoveUp={() => handleMoveUp(index)}
            onMoveDown={() => handleMoveDown(index)}
            onRemove={() => handleRemoveImage(index)}
          />
        ))}

        <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleAddImage}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#A67732] hover:text-[#8F6428] bg-[#F7F2E9] hover:bg-[#EFE7D8] border border-[#E0D8CB] rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Another Image URL</span>
          </button>

          {helpText && (
            <span className="text-[10px] text-content-muted max-w-sm text-right">
              {helpText}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

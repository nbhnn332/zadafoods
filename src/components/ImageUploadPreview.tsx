import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Image as ImageIcon, Link2 } from 'lucide-react';

interface ImageUploadPreviewProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspectRatio?: '16:9' | '1:1' | '390:220' | 'auto';
  placeholder?: string;
  helpText?: string;
  required?: boolean;
}

export const ImageUploadPreview: React.FC<ImageUploadPreviewProps> = ({
  label,
  value,
  onChange,
  aspectRatio = 'auto',
  placeholder = 'Enter direct image URL (e.g. https://domain.com/photo.png or /assets/photo.png)',
  helpText = 'Provide a direct link to an image file (.png, .jpg, .webp, .svg). Webpage links are not supported.',
  required = false
}) => {
  const [loadError, setLoadError] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '16:9':
        return 'aspect-video';
      case '1:1':
        return 'aspect-square max-w-[120px]';
      case '390:220':
        return 'aspect-[390/220] max-w-[260px]';
      default:
        return 'max-h-48';
    }
  };

  const isWebpageUrl = (url: string): boolean => {
    const trimmed = url.trim().toLowerCase();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return false;
    // Known webpage paths that do not end in image extensions
    if (trimmed.endsWith('.html') || trimmed.endsWith('.htm') || trimmed.endsWith('.php')) return true;
    return false;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="font-bold text-content-primary text-xs flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
        </label>
        {value && (
          <button
            type="button"
            onClick={() => {
              setLoadError(false);
              setDimensions(null);
              onChange('');
            }}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear URL</span>
          </button>
        )}
      </div>

      {/* Direct Image URL input only — file upload controls strictly removed */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-content-muted">
          <Link2 className="w-3.5 h-3.5" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setLoadError(false);
            setDimensions(null);
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          className={`w-full pl-8 pr-3 py-2 border rounded-input text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary ${
            loadError ? 'border-rose-300 bg-rose-50/20' : 'border-border-subtle'
          }`}
        />
      </div>

      {helpText && <p className="text-[10px] text-content-muted leading-tight">{helpText}</p>}

      {isWebpageUrl(value) && (
        <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>This looks like a webpage URL rather than a direct image link. Make sure the link points directly to the image file.</span>
        </div>
      )}

      {/* Live Image Preview Area */}
      {value && value.trim() ? (
        <div className="p-2.5 rounded-xl border border-border-subtle bg-canvas-subtle space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-content-primary flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-brand-secondary" />
              <span>Direct URL Preview</span>
            </span>
            {loadError ? (
              <span className="text-rose-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Broken URL / Unreachable</span>
              </span>
            ) : dimensions ? (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>{dimensions.width} × {dimensions.height} px verified</span>
              </span>
            ) : (
              <span className="text-content-muted">Verifying image URL...</span>
            )}
          </div>

          <div
            className={`relative rounded-lg overflow-hidden border border-border-subtle/80 bg-white flex items-center justify-center ${getAspectRatioClass()}`}
          >
            {loadError ? (
              <div className="p-6 text-center space-y-1">
                <AlertTriangle className="w-6 h-6 text-rose-500 mx-auto" />
                <p className="text-xs font-bold text-rose-700">Unable to load image from direct URL</p>
                <p className="text-[10px] text-content-muted max-w-sm">
                  The URL is unreachable or does not point to an accessible image file. Ensure this is a direct image link (e.g. ending in .png, .jpg, .webp), not a webpage.
                </p>
              </div>
            ) : (
              <img
                src={value.trim()}
                alt="Direct URL Preview"
                onLoad={(e) => {
                  setLoadError(false);
                  const img = e.currentTarget;
                  setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
                }}
                onError={() => {
                  setLoadError(true);
                  setDimensions(null);
                }}
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

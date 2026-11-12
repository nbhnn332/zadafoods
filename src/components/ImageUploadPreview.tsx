import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, Image as ImageIcon, Link2, RotateCw, Loader2 } from 'lucide-react';

export interface ImageUploadPreviewProps {
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
  helpText = 'Provide a direct link to an image file (e.g. HTTPS link from any CDN, Unsplash, Cloudinary, Imgur, or /assets/...).',
  required = false
}) => {
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const cleanUrl = (raw: string): string => {
    return (raw || '').trim().replace(/^["']|["']$/g, '');
  };

  const isWebpageUrl = (url: string): boolean => {
    const trimmed = url.trim().toLowerCase();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return false;
    if (trimmed.endsWith('.html') || trimmed.endsWith('.htm') || trimmed.endsWith('.php')) return true;
    if (trimmed.includes('google.com/search') || trimmed.includes('drive.google.com/file')) return true;
    return false;
  };

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

  useEffect(() => {
    const cleaned = cleanUrl(value);
    if (!cleaned) {
      setLoadState('idle');
      setDimensions(null);
      setErrorMessage('');
      return;
    }

    const isValidProtocol = cleaned.startsWith('/') || /^https?:\/\//i.test(cleaned);
    if (!isValidProtocol) {
      setLoadState('error');
      setDimensions(null);
      setErrorMessage('URL must begin with https://, http://, or /assets/');
      return;
    }

    setLoadState('loading');
    setErrorMessage('');

    let isCancelled = false;
    const img = new Image();
    img.referrerPolicy = 'no-referrer';

    img.onload = () => {
      if (!isCancelled) {
        setLoadState('success');
        setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setErrorMessage('');
      }
    };

    img.onerror = () => {
      if (!isCancelled) {
        setLoadState('error');
        setDimensions(null);
        setErrorMessage(
          'Unable to load image from direct URL. The image is unreachable, restricted by the external host, or not a supported image format.'
        );
      }
    };

    if (retryCount > 0 && /^https?:\/\//i.test(cleaned)) {
      const sep = cleaned.includes('?') ? '&' : '?';
      img.src = `${cleaned}${sep}_retry=${Date.now()}`;
    } else {
      img.src = cleaned;
    }

    return () => {
      isCancelled = true;
    };
  }, [value, retryCount]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  const handleClear = () => {
    setLoadState('idle');
    setDimensions(null);
    setErrorMessage('');
    onChange('');
  };

  const handleInputChange = (raw: string) => {
    const cleaned = cleanUrl(raw);
    onChange(cleaned);
  };

  const inputId = `img-input-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="font-bold text-content-primary text-xs flex items-center gap-1 cursor-pointer">
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
        </label>
        {value && (
          <button
            type="button"
            onClick={handleClear}
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
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full pl-8 pr-16 py-2 border rounded-input text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary transition-colors ${
            loadState === 'error'
              ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500'
              : loadState === 'success'
              ? 'border-emerald-400 bg-emerald-50/20 text-emerald-900 focus:border-emerald-500'
              : 'border-border-subtle'
          }`}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[10px] font-bold text-content-muted hover:text-rose-600 bg-canvas-subtle rounded border border-border-subtle"
          >
            Clear
          </button>
        )}
      </div>

      {helpText && <p className="text-[10px] text-content-muted leading-tight">{helpText}</p>}

      {isWebpageUrl(value) && (
        <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>This looks like a webpage URL rather than a direct image link. Make sure the link points directly to an image file.</span>
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
            {loadState === 'loading' ? (
              <span className="text-amber-700 font-medium flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                <span>Verifying image URL...</span>
              </span>
            ) : loadState === 'success' && dimensions ? (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>{dimensions.width} × {dimensions.height} px verified</span>
              </span>
            ) : loadState === 'error' ? (
              <span className="text-rose-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Broken URL / Unreachable</span>
              </span>
            ) : null}
          </div>

          <div
            className={`relative rounded-lg overflow-hidden border border-border-subtle/80 bg-white flex items-center justify-center ${getAspectRatioClass()}`}
          >
            {loadState === 'loading' ? (
              <div className="p-6 text-center space-y-2">
                <Loader2 className="w-6 h-6 text-brand-primary animate-spin mx-auto" />
                <p className="text-xs font-semibold text-content-muted">Loading image preview...</p>
              </div>
            ) : loadState === 'error' ? (
              <div className="p-6 text-center space-y-2">
                <AlertTriangle className="w-6 h-6 text-rose-500 mx-auto" />
                <p className="text-xs font-bold text-rose-700">Unable to load image from direct URL</p>
                <p className="text-[10px] text-content-muted font-mono break-all max-w-sm mx-auto">{cleanUrl(value)}</p>
                <p className="text-[10px] text-rose-600 max-w-sm mx-auto">
                  {errorMessage || 'The URL is unreachable or does not point to an accessible image file.'}
                </p>
                <div className="pt-1 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="px-2.5 py-1 text-xs font-bold rounded bg-rose-100 text-rose-800 hover:bg-rose-200 flex items-center gap-1 transition-colors"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Retry Load</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-2.5 py-1 text-xs font-semibold rounded bg-canvas border border-border-subtle hover:bg-canvas-subtle transition-colors"
                  >
                    Clear URL
                  </button>
                </div>
              </div>
            ) : (
              <img
                key={`${cleanUrl(value)}-${retryCount}`}
                src={cleanUrl(value)}
                referrerPolicy="no-referrer"
                alt="Direct URL Preview"
                onLoad={(e) => {
                  setLoadState('success');
                  const img = e.currentTarget;
                  setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
                  setErrorMessage('');
                }}
                onError={() => {
                  setLoadState('error');
                  setDimensions(null);
                  setErrorMessage('Unable to load image from direct URL.');
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

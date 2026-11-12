import React, { useRef, useEffect } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface PointListEditorProps {
  label: string;
  points: string[];
  onChange: (points: string[]) => void;
  placeholder?: string;
  helperText?: string;
}

// Clean literal HTML entities such as &#x20;, &nbsp;, etc.
export const cleanTextEntities = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/&#x20;/gi, ' ')
    .replace(/&#32;/gi, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
};

export const PointListEditor: React.FC<PointListEditorProps> = ({
  label,
  points,
  onChange,
  placeholder = 'Type a point and press Enter...',
  helperText = 'Press Enter to add the next point. Press Backspace on an empty point to return to the previous point.'
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pendingFocusIndex = useRef<number | null>(null);

  // Ensure there is at least one item
  const safePoints = points.length === 0 ? [''] : points;

  useEffect(() => {
    if (pendingFocusIndex.current !== null) {
      const idx = pendingFocusIndex.current;
      pendingFocusIndex.current = null;
      if (inputRefs.current[idx]) {
        inputRefs.current[idx]?.focus();
      }
    }
  }, [safePoints.length]);

  const handleTextChange = (index: number, val: string) => {
    const cleaned = cleanTextEntities(val);
    const updated = [...safePoints];
    updated[index] = cleaned;
    onChange(updated);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const updated = [...safePoints];
      updated.splice(index + 1, 0, '');
      pendingFocusIndex.current = index + 1;
      onChange(updated);
    } else if (e.key === 'Backspace' && safePoints[index] === '' && safePoints.length > 1) {
      e.preventDefault();
      const updated = safePoints.filter((_, i) => i !== index);
      const prevIdx = Math.max(0, index - 1);
      pendingFocusIndex.current = prevIdx;
      onChange(updated);
    }
  };

  const handleAddPoint = () => {
    const updated = [...safePoints, ''];
    pendingFocusIndex.current = updated.length - 1;
    onChange(updated);
  };

  const handleRemovePoint = (index: number) => {
    if (safePoints.length <= 1) {
      onChange(['']);
      return;
    }
    const updated = safePoints.filter((_, i) => i !== index);
    const focusIdx = Math.max(0, index - 1);
    pendingFocusIndex.current = focusIdx;
    onChange(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...safePoints];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    pendingFocusIndex.current = index - 1;
    onChange(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === safePoints.length - 1) return;
    const updated = [...safePoints];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    pendingFocusIndex.current = index + 1;
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="font-bold text-xs text-content-primary">{label}</label>
        <span className="text-[11px] text-content-muted">
          {safePoints.filter((p) => p.trim().length > 0).length} point(s)
        </span>
      </div>

      <div className="space-y-1.5 bg-[#FAF7F2] p-2.5 rounded-xl border border-[#EAE3D6]">
        {safePoints.map((point, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <span className="w-5 text-center text-xs font-semibold text-[#A67732] shrink-0 select-none">
              {index + 1}.
            </span>
            <input
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              value={point}
              onChange={(e) => handleTextChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              placeholder={placeholder}
              className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-[#E0D8CB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#A67732] focus:border-[#A67732] transition-colors"
            />
            {/* Action buttons */}
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                className="p-1 text-content-muted hover:text-content-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Move up"
                aria-label="Move point up"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleMoveDown(index)}
                disabled={index === safePoints.length - 1}
                className="p-1 text-content-muted hover:text-content-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Move down"
                aria-label="Move point down"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleRemovePoint(index)}
                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                title="Remove point"
                aria-label="Remove point"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        <div className="pt-1 flex items-center justify-between">
          <button
            type="button"
            onClick={handleAddPoint}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#A67732] hover:text-[#8F6428] hover:bg-[#F3ECE1] rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Point</span>
          </button>
          <span className="text-[10px] text-content-muted">{helperText}</span>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useToast } from '../context/ToastContext';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-8 right-0 left-0 z-50 flex flex-col items-center gap-2 pointer-events-none px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-card bg-content-primary text-white shadow-modal border border-border-subtle/20 max-w-md w-full animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400 shrink-0" />}
          {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
          {toast.type === 'error' && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-snug">{toast.title}</p>
            {toast.message && (
              <p className="text-xs text-white/70 truncate mt-0.5">{toast.message}</p>
            )}
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 text-white/50 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

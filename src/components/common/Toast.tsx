import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { ...toast, id };
    setToasts(prev => [...prev.slice(-3), newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const success = useCallback((message: string, title?: string) => {
    showToast({ type: 'success', title: title || 'Imekamilika', message });
  }, [showToast]);

  const error = useCallback((message: string, title?: string) => {
    showToast({ type: 'error', title: title || 'Hitilafu', message });
  }, [showToast]);

  const info = useCallback((message: string, title?: string) => {
    showToast({ type: 'info', title: title || 'Taarifa', message });
  }, [showToast]);

  const warning = useCallback((message: string, title?: string) => {
    showToast({ type: 'warning', title: title || 'Tahadhari', message });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-[9999] pointer-events-none flex flex-col gap-2">
        {toasts.map(t => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto rounded-2xl p-4 shadow-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 flex items-start gap-3 ${
                isSuccess
                  ? 'bg-emerald-950/95 text-emerald-100 border-emerald-700/60 shadow-emerald-950/30'
                  : isError
                  ? 'bg-rose-950/95 text-rose-100 border-rose-700/60 shadow-rose-950/30'
                  : isWarning
                  ? 'bg-amber-950/95 text-amber-100 border-amber-700/60 shadow-amber-950/30'
                  : 'bg-neutral-900/95 text-neutral-100 border-neutral-700 shadow-neutral-950/30'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 stroke-[2.2px]" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-400 stroke-[2.2px]" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400 stroke-[2.2px]" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-blue-400 stroke-[2.2px]" />}
              </div>
              <div className="flex-1 min-w-0">
                {t.title && (
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-0.5 opacity-90">
                    {t.title}
                  </h4>
                )}
                <p className="text-xs font-medium leading-relaxed break-words">{t.message}</p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-white/60 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                aria-label="Funga"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      showToast: () => {},
      success: (msg: string) => console.log('[Success Toast]:', msg),
      error: (msg: string) => console.error('[Error Toast]:', msg),
      info: (msg: string) => console.info('[Info Toast]:', msg),
      warning: (msg: string) => console.warn('[Warning Toast]:', msg)
    };
  }
  return context;
};

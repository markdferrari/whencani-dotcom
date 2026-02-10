'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { X } from 'lucide-react';

export type ToastVariant = 'default' | 'success' | 'destructive';

interface ToastInput {
  title: string;
  variant?: ToastVariant;
}

interface ToastInternal extends ToastInput {
  id: string;
}

interface ToastContextValue {
  toast: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => undefined });

export function useToast() {
  return useContext(ToastContext);
}

const VARIANT_STYLES: Record<ToastVariant, string> = {
  default: 'bg-zinc-900 text-white',
  success: 'bg-emerald-500 text-white',
  destructive: 'bg-rose-500 text-white',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastInternal[]>([]);

  const pushToast = useCallback((toast: ToastInput) => {
    const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;

    setToasts((current) => [...current, { id, ...toast }]);

    setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const contextValue = useMemo(() => ({ toast: pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-center justify-between gap-3 rounded-2xl px-4 py-3 shadow-xl ${VARIANT_STYLES[toast.variant ?? 'default']}`}
          >
            <p className="text-sm font-semibold">{toast.title}</p>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="rounded-full bg-white/20 p-1 text-white hover:bg-white/30"
              aria-label="Dismiss toast"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

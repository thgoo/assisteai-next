'use client';

import {
  createContext, useCallback, useContext, useMemo, useState,
} from 'react';

export interface ToastData {
  id: string;
  type: 'success' | 'error';
  title: string;
  text: string;
  /** Milliseconds until it hides itself; without it, it stays until closed. */
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastData[];
  showToast: (toast: Omit<ToastData, 'id'>) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    setToasts(current => [{ ...toast, id: crypto.randomUUID() }, ...current]);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(current => current.filter(toast => toast.id !== id));
  }, []);

  const value = useMemo(() => ({ toasts, showToast, hideToast }), [toasts, showToast, hideToast]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');

  return context;
}

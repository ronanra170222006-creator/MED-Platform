import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

type Listener = (toast: ToastMessage) => void;
const listeners = new Set<Listener>();
let nextId = 1;

export function showToast(message: string, type: ToastType = 'info') {
  const toast: ToastMessage = { id: nextId++, message, type };
  listeners.forEach((fn) => fn(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler: Listener = (toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 3500);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4 space-y-2 pointer-events-none">
      {toasts.map((t) => {
        const styles =
          t.type === 'success'
            ? 'bg-emerald-600 text-white'
            : t.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-med-forest text-white';

        const Icon =
          t.type === 'success'
            ? CheckCircle2
            : t.type === 'error'
              ? AlertCircle
              : Info;

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-medium animate-slide-down ${styles}`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="opacity-70 hover:opacity-100"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

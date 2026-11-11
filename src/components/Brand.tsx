import React, { useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { RequestStatus } from '../types';

export function BrandLogo({
  size = 'md',
}: {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}) {
  const [imgError, setImgError] = useState(false);

  const containerSize =
    size === 'sm'
      ? 'h-9 px-2 py-0.5 rounded-xl'
      : size === 'lg'
        ? 'h-20 px-4 py-1.5 rounded-2xl'
        : 'h-12 px-3 py-1 rounded-xl';

  return (
    <div className="inline-flex items-center select-none">
      {!imgError ? (
        <div className={`${containerSize} bg-white shadow-md flex items-center justify-center overflow-hidden`}>
          <img
            src="/assets/aistudio/image_8276847a_e6aad66f.jpg"
            alt="Logo MED"
            onError={() => setImgError(true)}
            className="h-full w-auto object-contain"
          />
        </div>
      ) : (
        <div
          className={`${containerSize} bg-gradient-to-br from-med-light via-med-emerald to-med-deep flex items-center justify-center font-extrabold text-med-forest shadow-md`}
        >
          MED
        </div>
      )}
    </div>
  );
}

export function PageHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-med-forest via-med-deep to-med-emerald text-white shadow-sm">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
              aria-label="Retour"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-base font-bold truncate">{title}</h1>
        </div>
        {right && <div className="flex-shrink-0">{right}</div>}
      </div>
    </header>
  );
}

export function StatusBadge({ status }: { status: RequestStatus }) {
  const map: Record<RequestStatus, { label: string; cls: string }> = {
    pending: { label: 'EN ATTENTE', cls: 'badge-pending' },
    approved: { label: 'RÉUSSI', cls: 'badge-approved' },
    rejected: { label: 'REFUSÉ', cls: 'badge-rejected' },
  };
  const item = map[status] || map.pending;
  return <span className={`badge ${item.cls}`}>{item.label}</span>;
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

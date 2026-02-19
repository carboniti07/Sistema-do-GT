import React from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Container */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className="
            relative bg-card rounded-[18px] shadow-xl
            w-full
            max-w-lg lg:max-w-3xl xl:max-w-4xl
            max-h-[78vh] sm:max-h-[84vh]
            flex flex-col
          "
        >
          {/* Header fixo */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border shrink-0">
            <h3 className="text-base sm:text-lg font-heading font-semibold text-foreground">
              {title}
            </h3>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
            >
              <X size={20} className="text-muted-foreground" />
            </button>
          </div>

          {/* Conteúdo com scroll */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 sm:py-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

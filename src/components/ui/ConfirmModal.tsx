import React, { useEffect } from "react";
import { createPortal } from "react-dom";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  isDestructive = false,
}) => {
  // 1. Scroll-Locking: Prevents background scrolling when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // 2. Portal: Renders at the root to avoid CSS clipping/z-index issues
  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
      {/* Backdrop: Using our theme-aware backdrop blur */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onCancel}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-sm bg-bg-surface border border-border-color rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-black uppercase italic text-text-main mb-3 tracking-tight">
          {title}
        </h3>

        <p className="text-sm font-bold text-text-muted leading-relaxed mb-8">
          {message}
        </p>

        <div className="flex flex-col gap-3">
          {/* Primary Action */}
          <button
            onClick={onConfirm}
            className={`w-full py-4 rounded-2xl font-black uppercase italic tracking-widest transition-all active:scale-95 btn-scale ${
              isDestructive
                ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                : "bg-brand-primary text-bg-main shadow-lg shadow-brand-primary/20"
            }`}
          >
            {confirmText}
          </button>

          {/* Cancel Action */}
          <button
            onClick={onCancel}
            className="w-full py-4 bg-transparent text-text-muted font-black uppercase italic tracking-widest text-[10px] btn-scale"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

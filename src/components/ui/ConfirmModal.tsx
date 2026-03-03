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

  return createPortal(
    <div className="fixed inset-0 z-1000 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-bg-main/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onCancel}
      />

      {/* Modal Card: Standard XL Rounding for consistency with Dashboard cards */}
      <div className="relative w-full max-w-sm bg-bg-surface rounded-xl p-8 border border-border-color/40 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Title: Fitnex Performance Style */}
        <h3 className="text-2xl font-black uppercase italic text-text-main mb-3 tracking-tighter">
          {title}
        </h3>

        {/* Message */}
        <p className="text-sm font-bold text-text-muted leading-relaxed mb-8">
          {message}
        </p>

        <div className="flex flex-col gap-3">
          {/* Primary Action Button */}
          <button
            onClick={onConfirm}
            className={`w-full py-4 rounded-xl font-black uppercase italic tracking-[0.15em] text-[12px] transition-all active:scale-95 shadow-lg ${
              isDestructive
                ? "bg-rose-500 text-white shadow-rose-500/20"
                : "bg-brand-primary text-bg-main shadow-brand-primary/20"
            }`}
          >
            {confirmText}
          </button>

          {/* Cancel Action Button */}
          <button
            onClick={onCancel}
            className="w-full py-3 bg-transparent text-text-muted font-black uppercase italic tracking-[0.2em] text-[10px] transition-all active:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

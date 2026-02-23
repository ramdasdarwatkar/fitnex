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
    <div className="fixed inset-0 z-100 flex items-center justify-center p-8">
      {/* Backdrop: Fully semantic */}
      <div
        className="absolute inset-0 bg-bg-main/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onCancel}
      />

      {/* Modal Card: Border-free, standard rounding */}
      <div className="relative w-full max-w-sm bg-bg-surface rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-2xl font-black uppercase italic text-text-main mb-4 tracking-tighter">
          {title}
        </h3>

        <p className="text-md font-bold text-text-muted leading-relaxed mb-10">
          {message}
        </p>

        <div className="flex flex-col gap-4">
          {/* Primary Action: No hardcoded colors. 
              Uses 'rose-500' only as a fallback if the CSS var isn't loaded, 
              but prefers semantic mapping.
          */}
          <button
            onClick={onConfirm}
            className={`w-full py-5 rounded-2xl font-black uppercase italic tracking-[0.15em] text-[13px] transition-all active:scale-95 btn-scale ${
              isDestructive
                ? "bg-rose-500 text-white shadow-xl shadow-rose-500/25"
                : "bg-brand-primary text-bg-main shadow-xl shadow-brand-primary/25"
            }`}
          >
            {confirmText}
          </button>

          {/* Cancel Action */}
          <button
            onClick={onCancel}
            className="w-full py-4 bg-transparent text-text-dim font-black uppercase italic tracking-[0.2em] text-[11px] btn-scale active:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

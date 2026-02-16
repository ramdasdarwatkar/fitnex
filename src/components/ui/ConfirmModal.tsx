import React from "react";

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-black uppercase italic italic text-[var(--text-main)] mb-3 tracking-tight">
          {title}
        </h3>
        <p className="text-sm font-bold text-[var(--text-muted)] leading-relaxed mb-8">
          {message}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className={`w-full py-4 rounded-2xl font-black uppercase italic tracking-widest transition-all active:scale-95 ${
              isDestructive
                ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                : "bg-[var(--brand-primary)] text-[var(--bg-main)] shadow-lg shadow-[var(--brand-primary)]/20"
            }`}
          >
            {confirmText}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-4 bg-transparent text-[var(--text-muted)] font-black uppercase italic tracking-widest text-[10px]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

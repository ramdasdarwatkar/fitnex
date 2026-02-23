import { type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = ({ label, error, ...props }: InputProps) => (
  <div className="mb-6 w-full group">
    {/* Label: Upscaled to 11px for better legibility, increased tracking */}
    <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-text-muted mb-2 ml-1">
      {label}
    </label>

    <input
      {...props}
      className={`
        w-full h-14 bg-bg-surface px-5 rounded-2xl
        text-text-main text-[15px] font-medium 
        placeholder:text-text-dim/40
        transition-all duration-200
        outline-none ring-0
        /* BORDER LOGIC: Transparent by default, only shows on hover/focus */
        border-2
        ${
          error
            ? "border-rose-500/50 bg-rose-500/5"
            : "border-transparent hover:border-border-color focus:border-brand-primary"
        }
      `}
    />

    {/* Optional Error Message: Semantic color */}
    {error && (
      <p className="mt-2 ml-1 text-[11px] font-black text-rose-500 uppercase tracking-widest italic">
        {error}
      </p>
    )}
  </div>
);

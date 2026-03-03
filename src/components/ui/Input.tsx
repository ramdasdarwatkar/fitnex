import { type InputHTMLAttributes, type ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: ReactNode;
}

export const Input = ({
  label,
  error,
  icon,
  className,
  ...props
}: InputProps) => (
  <div className="mb-6 w-full group">
    {/* Label: Using your signature 10px tracking-widest style */}
    <label className="block text-[10px] font-black uppercase italic tracking-[0.2em] text-text-muted mb-2 ml-1 group-focus-within:text-brand-primary transition-colors">
      {label}
    </label>

    <div className="relative flex items-center">
      {/* Icon: Positioned to breathe with the new XL rounding */}
      {icon && (
        <div className="absolute left-5 text-text-muted/60 group-focus-within:text-brand-primary transition-colors pointer-events-none">
          {icon}
        </div>
      )}

      <input
        {...props}
        className={`
          w-full h-14 bg-bg-surface rounded-xl
          ${icon ? "pl-14" : "px-6"} pr-6
          text-text-main text-[15px] font-bold 
          transition-all duration-300 outline-none
          border border-border-color/40
          placeholder:text-text-muted/30
          
          /* Focus State: Matching the Nav Bar Neon Glow */
          focus:border-brand-primary/50 
          focus:ring-4 focus:ring-brand-primary/5
          
          /* Error State: Themed but consistent */
          ${error ? "border-rose-500/50 bg-rose-500/5 focus:ring-rose-500/5" : ""}
          
          ${className}
        `}
      />
    </div>

    {/* Error Message: Matching the typography standard */}
    {error && (
      <span className="mt-1.5 ml-1 text-[10px] font-bold text-rose-500 uppercase tracking-wider italic">
        {error}
      </span>
    )}
  </div>
);

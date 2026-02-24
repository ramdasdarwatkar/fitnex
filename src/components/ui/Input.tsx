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
    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2 ml-1 group-focus-within:text-brand-primary transition-colors">
      {label}
    </label>

    <div className="relative flex items-center">
      {icon && (
        <div className="absolute left-5 text-text-dim group-focus-within:text-brand-primary transition-colors pointer-events-none">
          {icon}
        </div>
      )}
      <input
        {...props}
        className={`
          w-full h-14 bg-bg-surface rounded-2xl
          ${icon ? "pl-14" : "px-6"} pr-6
          text-text-main text-[15px] font-medium 
          transition-all duration-200 outline-none border-2
          ${error ? "border-rose-500/50 bg-rose-500/5" : "border-border-color/10 focus:border-brand-primary"}
          ${className}
        `}
      />
    </div>
  </div>
);

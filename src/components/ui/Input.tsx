import { type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = ({ label, error, ...props }: InputProps) => (
  <div className="mb-4 w-full">
    {/* Label using our text-text-muted token */}
    <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-1.5 ml-1">
      {label}
    </label>

    <input
      {...props}
      className={`
        w-full h-12 bg-bg-surface border rounded-xl px-4 
        text-text-main placeholder:text-text-muted/30
        focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all
        ${error ? "border-red-500/50" : "border-border-color"}
      `}
    />

    {/* Optional Error Message */}
    {error && (
      <p className="mt-1 ml-1 text-[10px] font-bold text-red-400 uppercase tracking-tight">
        {error}
      </p>
    )}
  </div>
);

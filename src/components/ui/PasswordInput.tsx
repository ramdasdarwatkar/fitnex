import { useState, forwardRef, type InputHTMLAttributes } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, className, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false);

    const toggleVisibility = (e: React.MouseEvent) => {
      e.preventDefault(); // Prevents form submission or focus loss
      setIsVisible(!isVisible);
    };

    return (
      <div className="mb-6 w-full group relative text-left">
        {/* Label Header */}
        <div className="flex justify-between items-center mb-2 px-1">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-text-muted group-focus-within:text-brand-primary transition-colors duration-300">
            {label}
          </label>
        </div>

        <div className="relative flex items-center">
          {/* LEFT ICON: Lock (Pinned to the left) */}
          <div className="absolute left-5 z-20 text-text-dim group-focus-within:text-brand-primary transition-colors duration-300 pointer-events-none">
            <Lock size={18} strokeWidth={2.5} />
          </div>

          {/* THE INPUT FIELD */}
          <input
            {...props}
            ref={ref}
            type={isVisible ? "text" : "password"}
            className={`
              w-full h-14 bg-bg-surface rounded-[1.25rem] 
              pl-14 pr-14 /* Space for Lock on left, Eye on right */
              text-text-main text-[15px] font-semibold 
              placeholder:text-text-dim/30
              transition-all duration-300 ease-out
              outline-none ring-0 border-2
              
              /* State Logic */
              ${
                error
                  ? "border-rose-500/40 bg-rose-500/2 shadow-[0_0_20px_rgba(244,63,94,0.1)]"
                  : "border-border-color/10 hover:border-border-color focus:border-brand-primary bg-bg-surface"
              }

              /* Glow & Interaction */
              focus:shadow-[0_0_25px_-5px_rgba(var(--brand-primary-rgb),0.25)]
              ${className}
            `}
          />

          {/* RIGHT ICON: Toggle Button (Pinned to the right) */}
          <button
            type="button"
            onClick={toggleVisibility}
            className="absolute right-4 z-20 p-2 rounded-xl text-text-dim hover:text-text-main hover:bg-bg-surface-soft transition-all active:scale-90"
            tabIndex={-1}
          >
            {isVisible ? (
              <EyeOff size={18} strokeWidth={2} />
            ) : (
              <Eye size={18} strokeWidth={2} />
            )}
          </button>
        </div>

        {/* Error Logic */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2.5 ml-1 text-[11px] font-bold text-rose-500 flex items-center gap-1.5 overflow-hidden"
            >
              <span className="w-1 h-1 rounded-full bg-rose-500" />
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";

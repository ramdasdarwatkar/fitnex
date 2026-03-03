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
      e.preventDefault();
      setIsVisible(!isVisible);
    };

    return (
      <div className="mb-6 w-full group relative text-left">
        {/* Label Header: Fitnex Italic Branding */}
        <div className="flex justify-between items-center mb-2 px-1">
          <label className="block text-[10px] font-black uppercase italic tracking-[0.2em] text-text-muted group-focus-within:text-brand-primary transition-colors duration-300">
            {label}
          </label>
        </div>

        <div className="relative flex items-center">
          {/* LEFT ICON: Lock */}
          <div className="absolute left-5 z-20 text-text-muted/60 group-focus-within:text-brand-primary transition-colors duration-300 pointer-events-none">
            <Lock size={18} strokeWidth={2.5} />
          </div>

          {/* THE INPUT FIELD: Standard XL Rounding & Thin Border */}
          <input
            {...props}
            ref={ref}
            type={isVisible ? "text" : "password"}
            className={`
              w-full h-14 bg-bg-surface rounded-xl 
              pl-14 pr-14
              text-text-main text-[15px] font-bold 
              placeholder:text-text-muted/30
              transition-all duration-300 ease-out
              outline-none border
              
              /* Shield & Glow Logic */
              ${
                error
                  ? "border-rose-500/50 bg-rose-500/5 focus:ring-rose-500/10"
                  : "border-border-color/40 focus:border-brand-primary/50 focus:ring-brand-primary/5 bg-bg-surface"
              }

              /* The 'Shiny' Focus Ring */
              focus:ring-4
              
              ${className}
            `}
          />

          {/* RIGHT ICON: Toggle Button */}
          <button
            type="button"
            onClick={toggleVisibility}
            className="absolute right-4 z-20 p-2 rounded-lg text-text-muted/60 hover:text-text-main hover:bg-bg-main transition-all active:scale-90"
            tabIndex={-1}
          >
            {isVisible ? (
              <EyeOff size={18} strokeWidth={2} />
            ) : (
              <Eye size={18} strokeWidth={2} />
            )}
          </button>
        </div>

        {/* Error Logic: Animated & Italic */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 ml-1 text-[10px] font-bold text-rose-500 flex items-center gap-1.5 overflow-hidden uppercase tracking-wider italic"
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

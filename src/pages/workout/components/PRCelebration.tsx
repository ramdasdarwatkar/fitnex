import { useEffect } from "react";
import { Trophy } from "lucide-react";

// --- 1. STRICT INTERFACES ---

interface PRCelebrationProps {
  exerciseName: string;
  weight: number | string;
  onClose: () => void;
}

// --- 2. COMPONENT ---

export const PRCelebration = ({
  exerciseName,
  weight,
  onClose,
}: PRCelebrationProps) => {
  useEffect(() => {
    // Auto-close after 3 seconds for a fluid UX
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-500 flex items-center justify-center p-6 bg-bg-main/60 backdrop-blur-md animate-in fade-in duration-300">
      {/* Main Modal Container 
          - Using brand-primary with subtle glow to signify achievement
      */}
      <div className="bg-bg-surface border-2 border-brand-primary rounded-[3.5rem] p-10 flex flex-col items-center text-center shadow-2xl shadow-brand-primary/20 animate-in zoom-in duration-300">
        {/* Trophy Icon with Bounce Animation */}
        <div className="w-20 h-20 bg-brand-primary rounded-full flex items-center justify-center mb-6 shadow-xl animate-bounce">
          <Trophy size={40} className="text-bg-main" strokeWidth={2.5} />
        </div>

        {/* Achievement Text */}
        <h2 className="text-2xl font-black uppercase italic text-text-main mb-2 tracking-tight">
          New Record!
        </h2>

        <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-4 italic opacity-60">
          {exerciseName}
        </p>

        {/* The Big Number */}
        <div className="text-5xl font-black italic text-brand-primary tabular-nums">
          {weight} <span className="text-xs uppercase">kg</span>
        </div>

        {/* Optional: Subtle tapping area to close early */}
        <button
          onClick={onClose}
          className="mt-8 text-[9px] font-black uppercase tracking-widest text-text-muted opacity-30 hover:opacity-100 transition-opacity"
        >
          Tap to dismiss
        </button>
      </div>
    </div>
  );
};

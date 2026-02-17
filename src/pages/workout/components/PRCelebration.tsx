import { useEffect } from "react";
import { Trophy } from "lucide-react";

export const PRCelebration = ({ exerciseName, weight, onClose }: any) => {
  useEffect(() => {
    // Auto-close after 3 seconds
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-900 border-2 border-[var(--brand-primary)] rounded-[3rem] p-10 flex flex-col items-center text-center shadow-[0_0_50px_rgba(var(--brand-primary-rgb),0.3)] animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-[var(--brand-primary)] rounded-full flex items-center justify-center mb-6 shadow-xl animate-bounce">
          <Trophy size={40} className="text-black" />
        </div>
        <h2 className="text-2xl font-black uppercase italic text-white mb-2">
          New Record!
        </h2>
        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-4">
          {exerciseName}
        </p>
        <div className="text-4xl font-black italic text-[var(--brand-primary)]">
          {weight} KG
        </div>
      </div>
    </div>
  );
};

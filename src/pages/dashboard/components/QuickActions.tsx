import { Play, Rocket } from "lucide-react";

export const QuickActions = ({ isOngoing, onResume, onStart }: any) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <button
        onClick={isOngoing ? onResume : onStart}
        className="group relative overflow-hidden bg-[var(--brand-primary)] p-6 rounded-[2.2rem] flex items-center justify-between active:scale-95 transition-all"
      >
        <div className="relative z-10 text-left">
          <h3 className="text-black font-black uppercase italic text-lg leading-tight">
            {isOngoing ? "Resume Workout" : "Start Empty"}
          </h3>
          <p className="text-black/60 text-[10px] font-bold uppercase tracking-widest">
            {isOngoing ? "Pick up where you left off" : "Log a custom session"}
          </p>
        </div>
        <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-[var(--brand-primary)] group-hover:rotate-12 transition-transform">
          {isOngoing ? (
            <Rocket size={24} fill="currentColor" />
          ) : (
            <Play size={24} fill="currentColor" />
          )}
        </div>
      </button>
    </div>
  );
};

import { Play, CalendarClock, Coffee, X } from "lucide-react";

export const WorkoutSetupSheet = ({ onClose, onSelect }: any) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-slate-800 rounded-[3rem] p-8 animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black uppercase italic text-[var(--text-main)]">
            Begin Session
          </h2>
          <button onClick={onClose} className="p-2 text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <SetupOption
            icon={<Play size={20} fill="currentColor" />}
            title="Live Workout"
            sub="Start timer & log sets now"
            color="bg-[var(--brand-primary)]"
            onClick={() => onSelect("LIVE")}
          />
          <SetupOption
            icon={<CalendarClock size={20} />}
            title="Log Previous"
            sub="Enter data from a past session"
            color="bg-slate-800"
            onClick={() => onSelect("PAST")}
          />
          <SetupOption
            icon={<Coffee size={20} />}
            title="Rest Day"
            sub="Mark today for recovery"
            color="bg-slate-900"
            onClick={() => onSelect("REST")}
          />
        </div>
      </div>
    </div>
  );
};

const SetupOption = ({ icon, title, sub, color, onClick }: any) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-5 p-5 bg-[var(--bg-main)] border border-slate-800 rounded-3xl active:scale-[0.98] transition-all group"
  >
    <div
      className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-black`}
    >
      {icon}
    </div>
    <div className="text-left">
      <p className="text-sm font-black uppercase italic text-[var(--text-main)] group-hover:text-[var(--brand-primary)] transition-colors">
        {title}
      </p>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        {sub}
      </p>
    </div>
  </button>
);

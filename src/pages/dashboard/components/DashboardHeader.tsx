import { Trophy, Calendar, Sparkles } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useUI } from "../../../context/UIContext";

export const DashboardHeader = () => {
  const { athlete } = useAuth();
  const { openSidebar } = useUI();

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning,";
    if (hour < 17) return "Good afternoon,";
    return "Good evening,";
  };

  // Format name (e.g., "John" from "JOHN DOE")
  const displayName = athlete?.name
    ? athlete.name.split(" ")[0].charAt(0).toUpperCase() +
      athlete.name.split(" ")[0].slice(1).toLowerCase()
    : "Athlete";

  return (
    <header className="pt-4 pb-4 space-y-6 ios-no-top">
      {/* Top Row: Greeting & Calendar */}
      <div className="flex justify-between items-start">
        <div className="space-y-0.5">
          <p className="flex items-center gap-1.5 text-brand font-black italic text-[11px] uppercase tracking-widest">
            <Sparkles size={12} strokeWidth={3} />
            {getGreeting()}
          </p>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {displayName}!
          </h1>
        </div>

        <button className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 active:scale-90 transition-all">
          <Calendar size={22} />
        </button>
      </div>
    </header>
  );
};

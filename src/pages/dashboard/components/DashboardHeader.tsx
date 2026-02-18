import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { format } from "date-fns";

export const DashboardHeader = () => {
  const { athlete } = useAuth();

  // 1. Time-aware greeting logic
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  // 2. Extract First Name & Proper Case
  const firstName = useMemo(() => {
    if (!athlete?.name) return "Athlete";
    const namePart = athlete.name.trim().split(" ")[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1).toLowerCase();
  }, [athlete?.name]);

  // 3. Current Date for the Button
  const today = new Date();
  const monthName = format(today, "MMM");
  const dayNumber = format(today, "dd");

  return (
    <header className="pt-4 pb-2 flex justify-between items-center ios-no-top">
      <div className="space-y-1">
        <p className="flex items-center gap-2 text-[var(--brand-primary)] font-black italic text-[10px] uppercase tracking-[0.2em]">
          <Sparkles size={12} strokeWidth={3} fill="currentColor" />
          {greeting},
        </p>
        <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">
          {firstName}!
        </h1>
      </div>

      {/* Monthly View Trigger Button */}
      <button
        onClick={() => {
          // Future logic to open Monthly Calendar Modal
          console.log("Opening Monthly View...");
        }}
        className="dashboard-card w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-400 active:scale-90 transition-all hover:border-[var(--brand-primary)]/40 shadow-xl group"
      >
        <span className="text-[7px] font-black text-slate-500 group-hover:text-[var(--brand-primary)] transition-colors mb-0.5 uppercase tracking-tighter">
          {monthName}
        </span>
        <span className="text-sm font-black text-white leading-none tabular-nums">
          {dayNumber}
        </span>
      </button>
    </header>
  );
};

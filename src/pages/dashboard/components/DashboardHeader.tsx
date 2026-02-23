import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { format } from "date-fns"; // Fixes 'Cannot find name format'
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";

export const DashboardHeader = () => {
  const { athlete } = useAuth();
  const navigate = useNavigate();

  // 1. Time-aware greeting (Stable)
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  // 2. Extract First Name (Optimized for Compiler)
  // We extract the specific property outside to ensure dependency alignment
  const athleteName = athlete?.name;

  const firstName = useMemo(() => {
    if (!athleteName) return "Athlete";
    const namePart = athleteName.trim().split(" ")[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1).toLowerCase();
  }, [athleteName]);

  // 3. Current Date Logic (Stabilized)
  const { monthName, dayNumber } = useMemo(() => {
    const today = new Date();
    return {
      monthName: format(today, "MMM"),
      dayNumber: format(today, "dd"),
    };
  }, []);

  return (
    <header className="pt-4 pb-2 flex justify-between items-center">
      <div className="space-y-1">
        <p className="flex items-center gap-2 text-brand-primary font-black italic text-[10px] uppercase tracking-[0.2em]">
          <Sparkles size={12} strokeWidth={3} fill="currentColor" />
          {greeting},
        </p>
        <h1 className="text-3xl font-black text-text-main tracking-tighter uppercase italic leading-none">
          {firstName}!
        </h1>
      </div>

      {/* Monthly View Trigger Button */}
      <button
        onClick={() => navigate("/workout/history")}
        className="w-12 h-12 rounded-2xl bg-bg-surface border border-border-color flex flex-col items-center justify-center text-text-muted active:scale-90 transition-all hover:border-brand-primary/40 shadow-xl group"
      >
        <span className="text-[7px] font-black text-text-muted group-hover:text-brand-primary transition-colors mb-0.5 uppercase tracking-tighter">
          {monthName}
        </span>
        <span className="text-sm font-black text-text-main leading-none tabular-nums">
          {dayNumber}
        </span>
      </button>
    </header>
  );
};

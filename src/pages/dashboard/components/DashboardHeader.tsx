import { useMemo } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

interface DashboardHeaderProps {
  athlete: {
    name?: string;
  } | null;
}

export const DashboardHeader = ({ athlete }: DashboardHeaderProps) => {
  const navigate = useNavigate();

  const firstName = useMemo(() => {
    const name = athlete?.name?.trim().split(" ")[0] || "Athlete";
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }, [athlete?.name]);

  const dateInfo = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();

    let timeGreeting = "Good evening";
    if (hour < 12) timeGreeting = "Good morning";
    else if (hour < 17) timeGreeting = "Good afternoon";
    else if (hour > 21) timeGreeting = "Good night";

    return {
      dayNum: format(now, "dd"),
      shortMonth: format(now, "MMM"),
      shortDay: format(now, "EEE"),
      timeGreeting,
    };
  }, []);

  return (
    <header className="flex justify-between items-center w-full px-1 py-3">
      {/* LEFT: Symmetrical 2-Line Stack */}
      <div className="flex flex-col gap-1">
        {/* Line 1: Hello + Name */}
        <h1 className="text-[16px] lg:text-[18px] font-bold text-text-main tracking-tight">
          Hello, {firstName}
        </h1>

        {/* Line 2: Fancy Greeting (Same Size) */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-brand-primary/20 blur-md rounded-full animate-pulse" />
            <Sparkles
              size={12}
              className="relative text-brand-primary"
              fill="currentColor"
            />
          </div>
          <p className="text-[16px] lg:text-[18px] font-bold text-brand-primary tracking-tight">
            {dateInfo.timeGreeting}
          </p>
        </div>
      </div>

      {/* RIGHT: Production-Grade Modular Calendar Widget */}
      <button
        onClick={() => navigate("/workout/history")}
        className="group relative flex flex-col w-14 lg:w-16 rounded-xl border border-border-color bg-bg-surface transition-all duration-300 hover:border-brand-primary hover:shadow-glow-primary active:scale-95 overflow-hidden shadow-sm"
      >
        <div className="w-full bg-brand-primary py-1 flex justify-center">
          <span className="text-[8px] lg:text-[9px] font-black text-white uppercase tracking-[0.15em]">
            {dateInfo.shortMonth}
          </span>
        </div>

        <div className="flex-1 flex flex-col items-center py-2 lg:py-2.5">
          <span className="text-xl lg:text-2xl font-black text-text-main tabular-nums leading-none tracking-tighter">
            {dateInfo.dayNum}
          </span>
          <span className="text-[8px] font-black text-text-muted uppercase tracking-[0.15em] mt-1 group-hover:text-brand-primary transition-colors">
            {dateInfo.shortDay}
          </span>
        </div>
      </button>
    </header>
  );
};

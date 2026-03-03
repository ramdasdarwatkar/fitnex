import { useMemo } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  Flame,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  CloudMoon,
  Sparkle,
} from "lucide-react";

interface DashboardHeaderProps {
  athlete: {
    name?: string;
    active_days?: string[];
  } | null;
}

export const DashboardHeader = ({ athlete }: DashboardHeaderProps) => {
  const navigate = useNavigate();

  const firstName = useMemo(() => {
    const name = athlete?.name?.trim().split(" ")[0] || "Athlete";
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }, [athlete?.name]);

  const { dayNum, shortMonth, shortDay, timeGreeting, TimeIcon } =
    useMemo(() => {
      const now = new Date();
      const hour = now.getHours();

      let greeting = "Good morning";
      let Icon = Sunrise;

      if (hour >= 9 && hour < 12) {
        greeting = "Good morning";
        Icon = Sun;
      } else if (hour >= 12 && hour < 17) {
        greeting = "Good afternoon";
        Icon = Sparkle;
      } else if (hour >= 17 && hour < 21) {
        greeting = "Good evening";
        Icon = Sunset;
      } else if (hour >= 21 || hour < 5) {
        greeting = "Good night";
        Icon = Moon;
      } else {
        greeting = "Early bird";
        Icon = CloudMoon;
      }

      return {
        dayNum: format(now, "dd"),
        shortMonth: format(now, "MMM").toUpperCase(),
        shortDay: format(now, "EEE").toUpperCase(),
        timeGreeting: greeting,
        TimeIcon: Icon,
      };
    }, []);

  const streak = useMemo(() => {
    return athlete?.active_days?.length ?? 0;
  }, [athlete?.active_days]);

  return (
    <header className="flex justify-between items-center w-full py-4 px-1">
      {/* ── LEFT: Styled Greeting & Dynamic Icon ── */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-0.5">
          <TimeIcon size={14} className="text-brand-primary opacity-80" />
          <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-brand-primary">
            {timeGreeting}
          </span>
        </div>

        <h1 className="text-[28px] font-black uppercase tracking-widest text-text-main leading-none">
          <span className="text-brand-primary drop-shadow-[0_2px_8px_var(--glow-primary)]">
            {firstName}
          </span>
        </h1>

        {/* Streak pill */}
        {streak > 0 && (
          <div
            className="mt-2.5 w-fit flex items-center gap-1.5 px-2.5 py-0.5 rounded-full
                       bg-[var(--streak-bg)] border border-[var(--streak-border)]"
          >
            <Flame
              size={10}
              className="text-[var(--brand-streak)]"
              fill="currentColor"
            />
            <span className="text-[9px] font-black uppercase tracking-[0.1em] text-[var(--brand-streak)]">
              {streak} Day Streak
            </span>
          </div>
        )}
      </div>

      {/* ── RIGHT: Compact Calendar ── */}
      <button
        onClick={() => navigate("/workout/history")}
        className="group flex flex-col w-[52px] rounded-xl 
                   border border-border-color/40 bg-bg-surface overflow-hidden
                   transition-all duration-200 active:scale-95 shadow-sm hover:border-brand-primary/50"
      >
        <div className="w-full bg-brand-primary py-1 flex justify-center">
          <span className="text-[8px] font-black tracking-widest text-white leading-none">
            {shortMonth}
          </span>
        </div>

        <div className="flex flex-col items-center py-1.5 bg-bg-surface">
          <span className="text-[18px] font-black text-text-main leading-none tabular-nums">
            {dayNum}
          </span>
          <span className="text-[8px] font-bold text-text-muted/60 uppercase tracking-tighter mt-1 group-hover:text-brand-primary transition-colors">
            {shortDay}
          </span>
        </div>
      </button>
    </header>
  );
};

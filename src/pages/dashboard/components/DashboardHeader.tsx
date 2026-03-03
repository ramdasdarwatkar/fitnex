import { useMemo } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Flame, ChevronRight, Sparkle } from "lucide-react";

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

  const { dayNum, shortMonth, shortDay, timeGreeting, dayOfWeekIndex } =
    useMemo(() => {
      const now = new Date();
      const hour = now.getHours();

      let timeGreeting = "Good morning";
      if (hour >= 12 && hour < 17) timeGreeting = "Good afternoon";
      else if (hour >= 17 && hour < 21) timeGreeting = "Good evening";
      else if (hour >= 21) timeGreeting = "Good night";

      return {
        dayNum: format(now, "dd"),
        shortMonth: format(now, "MMM").toUpperCase(),
        shortDay: format(now, "EEE").toUpperCase(),
        timeGreeting,
        dayOfWeekIndex: (now.getDay() + 6) % 7,
      };
    }, []);

  const streak = useMemo(() => {
    return athlete?.active_days?.length ?? 0;
  }, [athlete?.active_days]);

  return (
    <header className="flex justify-between items-start w-full">
      {/* ── LEFT: Greeting stack ── */}
      <div className="flex flex-col gap-1">
        {/* Line 2: Greeting with glow dot — same style as original */}
        <div className="flex items-center gap-2">
          <p className="text-[16px] lg:text-[18px] font-bold italic text-brand-primary tracking-tight">
            {timeGreeting},&nbsp;{firstName}
          </p>
        </div>

        {/* Streak pill */}
        {streak > 0 && (
          <div
            className="mt-1 w-fit flex items-center gap-1 px-2.5 py-1 rounded-full
                          bg-[var(--streak-bg)] border border-[var(--streak-border)]"
            style={{ boxShadow: "0 0 12px var(--glow-streak)" }}
          >
            <Flame
              size={10}
              className="text-[var(--brand-streak)]"
              fill="currentColor"
            />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--brand-streak)]">
              {streak} day{streak !== 1 ? "s" : ""} active
            </span>
          </div>
        )}
      </div>

      {/* ── RIGHT: Calendar widget ── */}
      <button
        onClick={() => navigate("/workout/history")}
        aria-label="View workout history"
        className="group relative flex flex-col w-14 lg:w-16 rounded-2xl
                   border border-border-color/50 bg-bg-surface overflow-hidden
                   transition-transform duration-200 active:scale-95
                   hover:border-brand-primary/40"
        style={{
          boxShadow: "0 2px 8px var(--shadow-sm), 0 1px 2px var(--shadow-xs)",
        }}
      >
        {/* Month band */}
        <div className="w-full bg-brand-primary py-[5px] flex justify-center items-center">
          <span className="text-[8px] font-black tracking-[0.18em] text-[var(--color-on-brand)]">
            {shortMonth}
          </span>
        </div>

        {/* Day number */}
        <div className="flex flex-col items-center pt-2 pb-1.5 bg-bg-surface">
          <span className="text-[22px] lg:text-[26px] font-black text-text-main tabular-nums leading-none tracking-tighter">
            {dayNum}
          </span>
          <span className="text-[7.5px] font-bold text-text-muted/60 tracking-[0.18em] mt-0.5 group-hover:text-brand-primary transition-colors duration-200">
            {shortDay}
          </span>
        </div>

        {/* Week progress dots */}
        <div className="flex justify-center items-center gap-[3px] pb-2 pt-0.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === dayOfWeekIndex ? 6 : 3,
                height: 3,
                backgroundColor:
                  i <= dayOfWeekIndex
                    ? "var(--brand-primary)"
                    : "var(--border-color)",
                opacity:
                  i < dayOfWeekIndex ? 0.5 : i === dayOfWeekIndex ? 1 : 0.4,
              }}
            />
          ))}
        </div>

        {/* Hover arrow hint */}
        <div className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <ChevronRight size={8} className="text-brand-primary" />
        </div>
      </button>
    </header>
  );
};

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Coffee, Activity, TrendingUp } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";

// Components
import { DashboardHeader } from "./components/DashboardHeader";
import { WeeklyCalendar } from "./components/WeeklyCalendar";
import { BodyMapCard } from "./components/BodyMapCard";
import { StatGrid } from "./components/StatGrid";

// Services & Utils
import { AnalyticsService } from "../../services/AnalyticsService";
import { useAuth } from "../../hooks/useAuth";
import type { LocalCustomizedStats } from "../../types/database.types";
import { DateUtils } from "../../util/dateUtils";

const DEFAULT_ANALYTICS: LocalCustomizedStats = {
  user_id: "",
  workout_sessions: 0,
  total_sets: 0,
  total_reps: 0,
  total_volume: 0,
  total_distance: 0,
  calories: 0,
  total_steps: 0,
  total_duration_min: 0,
  active_days: [],
  rest_days: [],
  muscle_names: "",
  start_date: DateUtils.getISTDate(),
  end_date: DateUtils.getISTDate(),
};

export const Dashboard = () => {
  const { athlete } = useAuth();

  const dates = useMemo(() => {
    const now = new Date();
    return {
      week: [
        format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      ] as [string, string],
      today: format(now, "yyyy-MM-dd"),
    };
  }, []);

  const analytics = useLiveQuery(async () => {
    if (!athlete?.user_id) return null;

    const [week, today] = await Promise.all([
      AnalyticsService.getSmartCustomizedStats(
        athlete.user_id,
        dates.week[0],
        dates.week[1],
      ),
      AnalyticsService.getSmartCustomizedStats(
        athlete.user_id,
        dates.today,
        dates.today,
      ),
    ]);

    return { week, today };
  }, [athlete?.user_id, dates]);

  const weekData: LocalCustomizedStats = analytics?.week || DEFAULT_ANALYTICS;
  const todayData: LocalCustomizedStats = analytics?.today || DEFAULT_ANALYTICS;

  const isRestDayToday = useMemo(() => {
    return weekData.rest_days?.includes(dates.today) || false;
  }, [weekData.rest_days, dates.today]);

  if (!athlete?.user_id) return null;

  return (
    <div className="flex-1 flex flex-col bg-bg-main max-w-7xl mx-auto w-full lg:px-8 lg:py-8 gap-y-8 pb-28 lg:pb-10">
      {/* ── 1. HEADER ── */}
      <DashboardHeader
        athlete={{ ...athlete, active_days: weekData.active_days }}
      />

      {/* ── 2. RECOVERY BANNER ── */}
      {isRestDayToday && (
        <section className="animate-in fade-in slide-in-from-top-4 duration-700">
          <RecoveryBanner />
        </section>
      )}

      {/* ── 3. PERFORMANCE ROADMAP ── */}
      <section className="flex flex-col gap-5">
        <SectionLabel
          label="Performance Roadmap"
          icon={<TrendingUp size={11} />}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <div className="lg:col-span-7 rounded-2xl bg-bg-surface border border-border-color overflow-hidden card-glow">
            <WeeklyCalendar
              activeDays={weekData.active_days}
              restDays={weekData.rest_days}
              athlete={athlete}
            />
          </div>

          <div className="lg:col-span-5 rounded-2xl bg-bg-surface border border-border-color overflow-hidden card-glow">
            <BodyMapCard muscleNames={weekData.muscle_names} />
          </div>
        </div>
      </section>

      {/* ── 4. LIVE TELEMETRY ── */}
      <section className="flex flex-col gap-5">
        <SectionLabel label="Live Telemetry" icon={<Activity size={11} />} />
        <StatGrid today={todayData} week={weekData} />
      </section>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   RECOVERY BANNER
───────────────────────────────────────────────────────────── */
const RecoveryBanner = () => (
  <div
    className="relative overflow-hidden w-full py-4 px-5 rounded-2xl
                border border-emerald-500/15 bg-emerald-500/[0.04]
                flex items-center gap-4"
    style={{
      boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 0 24px rgba(34,197,94,0.09)",
    }}
  >
    {/* Ambient glow blob */}
    <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />

    {/* Icon */}
    <div className="relative shrink-0 w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
      <Coffee size={16} className="text-emerald-400" />
    </div>

    {/* Copy */}
    <div className="relative flex-1 min-w-0">
      <span className="block text-[9px] font-black uppercase italic tracking-[0.3em] text-emerald-400 mb-0.5">
        Recovery Active
      </span>
      <p className="text-[11px] font-medium text-text-muted/70 italic leading-snug line-clamp-2">
        System optimized for muscle synthesis and metabolic reset today.
      </p>
    </div>

    {/* Right decoration */}
    <div className="hidden md:flex items-center gap-1.5 shrink-0 ml-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="rounded-full bg-emerald-400/20"
          style={{ width: 3, height: 3 + i * 2.5, opacity: 0.4 + i * 0.12 }}
        />
      ))}
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   SECTION LABEL
───────────────────────────────────────────────────────────── */
const SectionLabel = ({
  label,
  icon,
}: {
  label: string;
  icon?: React.ReactNode;
}) => (
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-1 shrink-0">
      <div
        className="w-1.5 h-1.5 rounded-full bg-brand-primary"
        style={{ boxShadow: "0 0 6px 1px rgba(34,197,94,0.5)" }}
      />
      <div className="w-1 h-1 rounded-full bg-brand-primary/30" />
    </div>

    {icon && (
      <span className="text-brand-primary/60 flex items-center">{icon}</span>
    )}

    <h2 className="text-[9.5px] font-black uppercase italic tracking-[0.38em] text-text-muted/50 whitespace-nowrap">
      {label}
    </h2>

    {/* Uses border-color token so it adapts to dark mode automatically */}
    <div className="h-px flex-1 bg-gradient-to-r from-border-color/40 to-transparent" />
  </div>
);

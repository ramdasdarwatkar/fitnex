import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Coffee } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";

// Components
import { DashboardHeader } from "./components/DashboardHeader";
import { WeeklyCalendar } from "./components/WeeklyCalendar";
import { BodyMapCard } from "./components/BodyMapCard";
import { StatGrid } from "./components/StatGrid";

// Services & Utils
import { AnalyticsService } from "../../services/AnalyticsService";
import { useAuth } from "../../hooks/useAuth";

interface DashboardStats {
  user_id: string;
  workout_sessions: number;
  total_sets: number;
  total_reps: number;
  total_volume: number;
  total_distance: number;
  calories: number;
  total_steps: number;
  total_duration_min: number;
  active_days: string[];
  rest_days: string[];
  muscle_names: string;
}

const DEFAULT_ANALYTICS: DashboardStats = {
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
};

export const Dashboard = () => {
  const { athlete } = useAuth();

  // 1. Date range calculation (memoized for compiler efficiency)
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

  // 2. Data Fetching
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

  const weekData: DashboardStats = analytics?.week || DEFAULT_ANALYTICS;
  const todayData: DashboardStats = analytics?.today || DEFAULT_ANALYTICS;

  const isRestDayToday = useMemo(() => {
    return weekData.rest_days?.includes(dates.today) || false;
  }, [weekData.rest_days, dates.today]);

  if (!athlete?.user_id) return null;

  return (
    /* LAYOUT REFACTOR:
       - Removed 'mt-4' to prevent parent collision.
       - 'gap-y-8' provides professional breathing room without looking "disconnected".
       - 'px-5' is the sweet spot for professional mobile/desktop padding.
    */
    <div className="flex-1 flex flex-col bg-bg-main min-h-screen max-w-7xl mx-auto w-full relative lg:py-8 gap-y-8 overflow-x-hidden">
      {/* Flush Header Section */}
      <DashboardHeader athlete={athlete} />

      {/* Recovery Banner - Optimized for space */}
      {isRestDayToday && (
        <section className="animate-in fade-in slide-in-from-top-2 duration-700">
          <div className="w-full py-4 px-6 bg-brand-info/5 border border-brand-info/10 rounded-4xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-info/10 rounded-xl">
                <Coffee size={18} className="text-brand-info" />
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-info">
                  Recovery Active
                </span>
                <p className="text-[11px] font-medium text-text-muted">
                  System optimized for muscle synthesis today.
                </p>
              </div>
            </div>
            <div className="hidden md:block h-px flex-1 mx-8 bg-brand-info/10" />
          </div>
        </section>
      )}

      {/* MAIN PERFORMANCE GRID */}
      <section className="flex flex-col gap-4">
        <SectionLabel label="Performance Roadmap" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <div className="lg:col-span-7">
            <WeeklyCalendar
              activeDays={weekData.active_days}
              restDays={weekData.rest_days}
              athlete={athlete}
            />
          </div>
          <div className="lg:col-span-5">
            <BodyMapCard muscleNames={weekData.muscle_names} />
          </div>
        </div>
      </section>

      {/* LIVE TELEMETRY SECTION */}
      <section className="flex flex-col gap-4 pb-12">
        <SectionLabel label="Live Telemetry" />
        <StatGrid today={todayData} week={weekData} />
      </section>

      {/* Mobile Safe Area Spacer */}
      <div className="h-10 lg:hidden" />
    </div>
  );
};

/**
 * SectionLabel
 * Standardized labeling for a professional "SaaS" aesthetic.
 */
const SectionLabel = ({ label }: { label: string }) => (
  <div className="flex items-center gap-4 px-1">
    <div className="h-2 w-2 rounded-full bg-brand-primary/20 flex items-center justify-center">
      <div className="h-1 w-1 rounded-full bg-brand-primary" />
    </div>
    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted whitespace-nowrap">
      {label}
    </h2>
    <div className="h-px flex-1 bg-linear-to-r from-border-color/40 to-transparent" />
  </div>
);

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

// 1. Properly Type the Placeholder
// We use a type that matches the expected structure of your StatGrid and Calendar
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

  const [weekStart, weekEnd] = useMemo(() => {
    const now = new Date();
    return [
      format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    ];
  }, []);

  const [dayStart, dayEnd] = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    return [today, today];
  }, []);

  const analytics = useLiveQuery(async () => {
    if (!athlete?.user_id) return null;

    const [week, today] = await Promise.all([
      AnalyticsService.getSmartCustomizedStats(
        athlete.user_id,
        weekStart,
        weekEnd,
      ),
      AnalyticsService.getSmartCustomizedStats(
        athlete.user_id,
        dayStart,
        dayEnd,
      ),
    ]);

    return { week, today };
  }, [athlete?.user_id, weekStart, weekEnd, dayStart, dayEnd]);

  // Use the placeholder if data is null/loading
  const weekData: DashboardStats = analytics?.week || DEFAULT_ANALYTICS;
  const todayData: DashboardStats = analytics?.today || DEFAULT_ANALYTICS;

  const isRestDayToday = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    return weekData.rest_days?.includes(todayStr) || false;
  }, [weekData.rest_days]);

  if (!athlete?.user_id) return null;

  return (
    <div className="flex-1 flex flex-col bg-bg-main px-6 space-y-10 min-h-screen pb-10 pt-safe mt-4 max-w-6xl mx-auto w-full relative">
      <DashboardHeader />

      {isRestDayToday && (
        <section className="px-2 animate-in fade-in zoom-in duration-500">
          <div className="w-full py-6 bg-blue-500/5 border border-blue-500/20 rounded-[2.5rem] flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-3">
              <Coffee size={20} className="text-blue-400" />
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-400 italic">
                Recovery Mode Active
              </span>
            </div>
            <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest text-center px-4">
              Rest day logged. Your body is growing today.
            </p>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted italic">
            Performance Overview
          </h2>
          <div className="h-px flex-1 bg-border-color/30" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 h-full">
            <WeeklyCalendar
              activeDays={weekData.active_days}
              restDays={weekData.rest_days}
            />
          </div>
          <div className="lg:col-span-5 h-full">
            <BodyMapCard muscleNames={weekData.muscle_names} />
          </div>
        </div>
      </section>

      <section className="space-y-4 pb-10">
        <div className="flex items-center gap-3 px-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted italic">
            Live Analytics
          </h2>
          <div className="h-px flex-1 bg-border-color/30" />
        </div>
        <StatGrid today={todayData} week={weekData} />
      </section>

      <div className="h-10" />
    </div>
  );
};

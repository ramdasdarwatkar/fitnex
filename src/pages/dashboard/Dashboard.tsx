import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Coffee,
  Weight,
  Hash,
  Zap,
  Flame,
  Footprints,
  Clock,
} from "lucide-react";

// Components
import { DashboardHeader } from "./components/DashboardHeader";
import { WeeklyCalendar } from "./components/WeeklyCalendar";
import { BodyMapCard } from "./components/BodyMapCard";
import { StatTile } from "./components/StatTile";
import { WorkoutActionButton } from "./components/WorkoutActionButton";

// Services & Utils
import { AthleteService } from "../../services/AthleteService";
import { DateUtils } from "../../util/dateUtils";
import { useAuth } from "../../context/AuthContext";

export const Dashboard = () => {
  const { athlete } = useAuth();

  // 1. Get Date Ranges
  const [weekStart, weekEnd] = useMemo(
    () => DateUtils.getDateRange("week"),
    [],
  );
  const [dayStart, dayEnd] = useMemo(() => DateUtils.getDateRange("day"), []);

  // 2. Fetch Weekly and Daily Data
  const weekData = useLiveQuery(
    () =>
      athlete?.user_id
        ? AthleteService.getSmartCustomizedStats(
            athlete.user_id,
            weekStart,
            weekEnd,
          )
        : null,
    [athlete?.user_id, weekStart, weekEnd],
  );

  const todayData = useLiveQuery(
    () =>
      athlete?.user_id
        ? AthleteService.getSmartCustomizedStats(
            athlete.user_id,
            dayStart,
            dayEnd,
          )
        : null,
    [athlete?.user_id, dayStart, dayEnd],
  );

  // 3. Logic: Check if Today is a marked Rest Day
  const isRestDayToday = useMemo(() => {
    if (!weekData?.rest_days) return false;
    const todayISO = new Date().toISOString().split("T")[0];
    return weekData.rest_days.includes(todayISO);
  }, [weekData?.rest_days]);

  if (!weekData) return null;

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-main)] px-6 space-y-10 min-h-screen pb-10 pt-[env(safe-area-inset-top)] mt-4 max-w-6xl mx-auto w-full relative">
      <DashboardHeader />

      {/* FIX: We only render this section container if there is visible content (Rest Day Card).
          The FAB (WorkoutActionButton) is fixed, so it doesn't need a slot in the flex stack.
      */}
      {isRestDayToday ? (
        <section className="px-2">
          <div className="w-full py-6 bg-blue-500/5 border border-blue-500/20 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 animate-in fade-in zoom-in duration-500">
            <div className="flex items-center gap-3">
              <Coffee size={20} className="text-blue-400" />
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-400 italic">
                Recovery Mode Active
              </span>
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              Rest day logged. Your body is growing today.
            </p>
          </div>
        </section>
      ) : (
        ""
      )}

      {/* SECTION 2: PERFORMANCE OVERVIEW */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">
            Performance Overview
          </h2>
          <div className="h-[1px] flex-1 bg-slate-800/30" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 h-full">
            <WeeklyCalendar
              activeDays={weekData.active_days || []}
              restDays={weekData.rest_days || []}
            />
          </div>

          <div className="lg:col-span-5 h-full">
            <BodyMapCard muscleNames={weekData.muscle_names} />
          </div>
        </div>
      </section>

      {/* SECTION 3: LIVE ANALYTICS */}
      <section className="space-y-4 pb-10">
        <div className="flex items-center gap-3 px-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">
            Live Analytics
          </h2>
          <div className="h-[1px] flex-1 bg-slate-800/30" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatTile
            icon={<Weight size={16} />}
            label="Volume"
            todayValue={todayData?.total_volume || 0}
            weekValue={weekData.total_volume || 0}
            unit="kg"
          />
          <StatTile
            icon={<Hash size={16} />}
            label="Sets"
            todayValue={todayData?.total_sets || 0}
            weekValue={weekData.total_sets || 0}
          />
          <StatTile
            icon={<Zap size={16} />}
            label="Reps"
            todayValue={todayData?.total_reps || 0}
            weekValue={weekData.total_reps || 0}
          />
          <StatTile
            icon={<Flame size={16} />}
            label="Calories"
            todayValue={todayData?.calories || 0}
            weekValue={weekData.calories || 0}
            unit="kcal"
          />
          <StatTile
            icon={<Footprints size={16} />}
            label="Steps"
            todayValue={todayData?.total_steps || 0}
            weekValue={weekData.total_steps || 0}
          />
          <StatTile
            icon={<Clock size={16} />}
            label="Time"
            todayValue={todayData?.total_duration_min || 0}
            weekValue={weekData.total_duration_min || 0}
            isTime
          />
        </div>
      </section>

      <div className="h-10" />
    </div>
  );
};

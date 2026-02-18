import { useLiveQuery } from "dexie-react-hooks";
import { DashboardHeader } from "./components/DashboardHeader";
import { WeeklyCalendar } from "./components/WeeklyCalendar";
import { BodyMapCard } from "./components/BodyMapCard";
import { StatTile } from "./components/StatTile";
import { AthleteService } from "../../services/AthleteService";
import { DateUtils } from "../../util/dateUtils";
import { useAuth } from "../../context/AuthContext";
import { Weight, Hash, Zap, Flame, Footprints, Clock } from "lucide-react";

export const Dashboard = () => {
  const { athlete } = useAuth();
  const [weekStart, weekEnd] = DateUtils.getDateRange("week");
  const [dayStart, dayEnd] = DateUtils.getDateRange("day");

  const weekData = useLiveQuery(
    () =>
      athlete?.user_id
        ? AthleteService.getSmartCustomizedStats(
            athlete.user_id,
            weekStart,
            weekEnd,
          )
        : null,
    [athlete?.user_id],
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
    [athlete?.user_id],
  );

  if (!weekData) return null;

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-main)] px-6 space-y-10 min-h-screen pb-40 pt-[env(safe-area-inset-top)] mt-4 max-w-6xl mx-auto w-full">
      <DashboardHeader />

      {/* SECTION 1: WEEKLY OVERVIEW */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">
            Weekly Overview
          </h2>
          <div className="h-[1px] flex-1 bg-slate-800/30" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <WeeklyCalendar
              activeDays={weekData.active_days || []} // Passing ISO strings ["2026-02-17"]
              restDays={weekData.rest_days || []}
            />
          </div>
          <BodyMapCard muscleNames={weekData.muscle_names} />
        </div>
      </section>

      {/* SECTION 2: LIVE ANALYTICS */}
      <section className="space-y-4">
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
    </div>
  );
};

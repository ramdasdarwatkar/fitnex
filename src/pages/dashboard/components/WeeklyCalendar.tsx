import { useMemo } from "react";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { Zap, Target, CupSoda } from "lucide-react";

interface WeeklyCalendarProps {
  activeDays: string[];
  restDays: string[];
}

export const WeeklyCalendar = ({
  activeDays = [],
  restDays = [],
}: WeeklyCalendarProps) => {
  const today = new Date();

  const weekDays = useMemo(() => {
    const start = startOfWeek(today, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, []);

  const activeDateObjects = useMemo(
    () => activeDays?.map((d) => parseISO(d)) ?? [],
    [activeDays],
  );
  const restDateObjects = useMemo(
    () => restDays?.map((d) => parseISO(d)) ?? [],
    [restDays],
  );

  const workoutCount = activeDateObjects.length;
  const weeklyTarget = 5;
  const progressPercent = Math.min((workoutCount / weeklyTarget) * 100, 100);

  return (
    <section className="dashboard-card bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] shadow-xl h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Weekly Consistency
            </h3>
            <p className="text-[var(--brand-primary)] text-[9px] font-black uppercase italic">
              {workoutCount}/7 Sessions Finished
            </p>
          </div>
        </div>

        {/* 7-DAY GRID */}
        <div className="flex justify-between items-center mb-8 px-1">
          {weekDays.map((day) => {
            const isToday = isSameDay(day, today);
            const isWorkout = activeDateObjects.some((d) => isSameDay(d, day));
            const isRest = restDateObjects.some((d) => isSameDay(d, day));

            return (
              <div
                key={day.toString()}
                className="flex flex-col items-center gap-3"
              >
                <span
                  className={`text-[9px] font-black uppercase tracking-tighter ${
                    isToday ? "text-[var(--brand-primary)]" : "text-slate-600"
                  }`}
                >
                  {format(day, "EEE")}
                </span>

                <div
                  className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 ${
                    isWorkout
                      ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] shadow-[0_0_20px_rgba(204,255,0,0.2)]"
                      : isRest
                        ? "border-blue-500/40 bg-blue-500/10"
                        : isToday
                          ? "border-slate-500 bg-slate-800"
                          : "border-slate-800 bg-black/40"
                  }`}
                >
                  {isWorkout ? (
                    <Zap size={16} className="text-black fill-current" />
                  ) : isRest ? (
                    <CupSoda size={16} className="text-blue-400" />
                  ) : (
                    <span
                      className={`text-[11px] font-black ${isToday ? "text-white" : "text-slate-700"}`}
                    >
                      {format(day, "d")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* WEEKLY TARGET BAR */}
        <div className="bg-black/40 border border-slate-800/50 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Target size={12} className="text-slate-500" />
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                Weekly Goal
              </span>
            </div>
            <span className="text-[10px] font-black italic text-white">
              {workoutCount} / {weeklyTarget}
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--brand-primary)] transition-all duration-1000 ease-out shadow-[0_0_10px_var(--brand-primary)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

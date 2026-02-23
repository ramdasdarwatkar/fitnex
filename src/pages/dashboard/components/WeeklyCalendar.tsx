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
  // 1. Move the 'today' reference inside useMemo or keep it external
  // The compiler prefers that stable dates are calculated inside the memo block
  const { weekDays, today } = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i));

    return { weekDays: days, today: now };
  }, []);

  // 2. Parse ISO strings into Date objects for comparison
  const activeDateObjects = useMemo(
    () => activeDays.map((d) => parseISO(d)),
    [activeDays],
  );

  const restDateObjects = useMemo(
    () => restDays.map((d) => parseISO(d)),
    [restDays],
  );

  // 3. Calculation Logic
  const workoutCount = activeDateObjects.length;
  const weeklyTarget = 5;
  const progressPercent = Math.min((workoutCount / weeklyTarget) * 100, 100);

  return (
    <section className="bg-bg-surface border border-border-color p-6 rounded-[2.5rem] shadow-xl h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
              Weekly Consistency
            </h3>
            <p className="text-brand-primary text-[9px] font-black uppercase italic">
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
                key={day.toISOString()}
                className="flex flex-col items-center gap-3"
              >
                <span
                  className={`text-[9px] font-black uppercase tracking-tighter ${
                    isToday ? "text-brand-primary" : "text-text-muted"
                  }`}
                >
                  {format(day, "EEE")}
                </span>

                <div
                  className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 ${
                    isWorkout
                      ? "border-brand-primary bg-brand-primary shadow-[0_0_20px_rgba(var(--brand-primary-rgb),0.2)]"
                      : isRest
                        ? "border-blue-500/40 bg-blue-500/10"
                        : isToday
                          ? "border-text-muted bg-bg-surface-soft"
                          : "border-border-color bg-bg-main/40"
                  }`}
                >
                  {isWorkout ? (
                    <Zap size={16} className="text-black fill-current" />
                  ) : isRest ? (
                    <CupSoda size={16} className="text-blue-400" />
                  ) : (
                    <span
                      className={`text-[11px] font-black ${isToday ? "text-text-main" : "text-text-muted/40"}`}
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
        <div className="bg-bg-main/40 border border-border-color/50 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Target size={12} className="text-text-muted" />
              <span className="text-[8px] font-black uppercase tracking-widest text-text-muted">
                Weekly Goal
              </span>
            </div>
            <span className="text-10 font-black italic text-text-main">
              {workoutCount} / {weeklyTarget}
            </span>
          </div>
          <div className="h-1.5 w-full bg-bg-surface-soft rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-primary transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(var(--brand-primary-rgb),0.5)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

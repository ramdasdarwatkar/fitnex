import { useMemo } from "react";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  parseISO,
  isBefore,
  startOfDay,
} from "date-fns";
import { Zap, CupSoda, Flame, Dumbbell } from "lucide-react";
import { motion } from "framer-motion";
import type { AthleteSummary } from "../../../types/database.types";

interface WeeklyCalendarProps {
  activeDays: string[];
  restDays: string[];
  athlete: AthleteSummary;
}

export const WeeklyCalendar = ({
  activeDays = [],
  restDays = [],
  athlete,
}: WeeklyCalendarProps) => {
  const { weekDays, today, todayStart } = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    return { weekDays: days, today: now, todayStart: startOfDay(now) };
  }, []);

  const activeDateObjects = useMemo(
    () => activeDays.map((d) => parseISO(d)),
    [activeDays],
  );
  const restDateObjects = useMemo(
    () => restDays.map((d) => parseISO(d)),
    [restDays],
  );

  const activeCount = activeDateObjects.length;
  const weeklyTarget = athlete.target_days_per_week || 5;
  const goalProgress = Math.min((activeCount / weeklyTarget) * 100, 100);

  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (goalProgress / 100) * circumference;

  return (
    <section className="relative overflow-hidden bg-bg-surface/40 backdrop-blur-md border border-border-color/20 p-6 rounded-[2.5rem] shadow-xl h-full flex flex-col justify-between group">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-primary/10 rounded-xl border border-brand-primary/20">
            <Flame size={16} className="text-brand-primary" />
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted/60">
              Consistency
            </h3>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-text-main leading-none">
                {activeCount}
              </span>
              <span className="text-xs font-bold text-text-muted/40 uppercase">
                Sessions
              </span>
            </div>
          </div>
        </div>

        {/* GOAL RING */}
        <div className="relative flex items-center justify-center w-14 h-14">
          <svg className="w-full h-full transform -rotate-90 relative z-10">
            <circle
              cx="28"
              cy="28"
              r={radius}
              stroke="currentColor"
              strokeWidth="4.5"
              fill="transparent"
              className="text-text-main/5"
            />
            <motion.circle
              cx="28"
              cy="28"
              r={radius}
              stroke="var(--brand-primary)"
              strokeWidth="4.5"
              fill="transparent"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: strokeDashoffset }}
              transition={{ duration: 1, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center z-20 gap-0.5">
            <span className="text-[10px] font-black text-text-main tabular-nums">
              {activeCount}
            </span>
            <span className="text-[10px] font-bold text-text-muted/30">/</span>
            <span className="text-[10px] font-bold text-text-muted/60 tabular-nums">
              {weeklyTarget}
            </span>
          </div>
        </div>
      </div>

      {/* 7-DAY CALENDAR GRID */}
      <div className="flex justify-between items-end gap-1.5">
        {weekDays.map((day, idx) => {
          const isToday = isSameDay(day, today);
          const isPast = isBefore(day, todayStart);
          const isWorkout = activeDateObjects.some((d) => isSameDay(d, day));
          const isRest = restDateObjects.some((d) => isSameDay(d, day));

          const isAnalyzable = isToday || isPast;
          const isMissed = isAnalyzable && !isWorkout && !isRest;

          return (
            <motion.div
              key={day.toISOString()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.03 }}
              className="flex flex-col items-center gap-3 flex-1"
            >
              <span
                className={`text-[8px] font-black uppercase tracking-tighter ${isToday ? "text-brand-primary" : "text-text-muted/30"}`}
              >
                {format(day, "EEE")}
              </span>

              <div
                className={`relative w-full aspect-square max-w-9.5 rounded-[0.9rem] flex items-center justify-center transition-all duration-500 border-2 ${
                  isAnalyzable
                    ? isWorkout
                      ? "bg-transparent border-brand-primary shadow-glow-primary scale-105"
                      : isRest
                        ? "bg-transparent border-brand-success/50"
                        : isMissed && isPast
                          ? "bg-transparent border-brand-error/40"
                          : "bg-text-main/5 border-text-main/20"
                    : "bg-transparent border-border-color/10"
                }`}
              >
                {isWorkout && isAnalyzable ? (
                  <Dumbbell
                    size={14}
                    className="text-brand-primary fill-current"
                  />
                ) : isRest && isAnalyzable ? (
                  <CupSoda size={14} className="text-brand-success" />
                ) : (
                  <span
                    className={`text-[10px] font-bold tabular-nums ${
                      isMissed && isPast
                        ? "text-brand-error"
                        : isToday
                          ? "text-text-main"
                          : "text-text-muted/20"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                )}

                {isToday && !isWorkout && !isRest && (
                  <div className="absolute -bottom-1 w-1 h-1 bg-brand-primary rounded-full blur-[1px]" />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

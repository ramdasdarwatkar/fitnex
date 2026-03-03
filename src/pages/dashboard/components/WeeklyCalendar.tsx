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
import { CupSoda, Flame, Dumbbell } from "lucide-react";
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
    // No bg/border/rounded here — Dashboard wrapper card already provides that
    <section className="flex flex-col gap-8 h-full p-6 overflow-hidden">
      {/* ── HEADER ── */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div
            className="p-2 bg-brand-primary/10 rounded-xl border border-brand-primary/20"
            style={{ boxShadow: "0 0 10px var(--glow-primary)" }}
          >
            <Flame size={16} className="text-brand-primary" />
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] italic text-text-muted/60">
              Consistency
            </h3>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black italic text-text-main leading-none">
                {activeCount}
              </span>
              <span className="text-[10px] font-black italic text-text-muted/40 uppercase tracking-wider">
                Sessions
              </span>
            </div>
          </div>
        </div>

        {/* GOAL RING */}
        <div className="relative flex items-center justify-center w-14 h-14">
          <svg className="relative z-10 w-full h-full transform -rotate-90">
            <circle
              cx="28"
              cy="28"
              r={radius}
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className="text-text-main/5"
            />
            <motion.circle
              cx="28"
              cy="28"
              r={radius}
              stroke="var(--brand-primary)"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: "easeOut" }}
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 3px var(--brand-primary))" }}
            />
          </svg>
          <div className="absolute inset-0 z-20 flex items-center justify-center gap-0.5">
            <span className="text-[10px] font-black italic text-text-main tabular-nums">
              {activeCount}
            </span>
            <span className="text-[10px] font-bold text-text-muted/30">/</span>
            <span className="text-[10px] font-bold italic text-text-muted/60 tabular-nums">
              {weeklyTarget}
            </span>
          </div>
        </div>
      </div>

      {/* ── 7-DAY CALENDAR GRID ── */}
      <div className="flex items-end justify-between gap-1.5">
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="flex flex-col items-center flex-1 gap-2"
            >
              <span
                className={`text-[8px] font-black uppercase italic tracking-wider transition-colors ${
                  isToday ? "text-brand-primary" : "text-text-muted/30"
                }`}
              >
                {format(day, "EEE")}
              </span>

              <div
                className="relative w-full aspect-square rounded-lg flex items-center justify-center transition-all duration-500 border"
                style={
                  isAnalyzable
                    ? isWorkout
                      ? {
                          background: "var(--workout-bg)",
                          borderColor: "var(--brand-primary)",
                          boxShadow: "0 0 8px var(--glow-primary)",
                          transform: "scale(1.05)",
                        }
                      : isRest
                        ? {
                            background: "var(--rest-bg)",
                            borderColor: "var(--rest-border)",
                          }
                        : isMissed
                          ? {
                              background: "var(--missed-bg)",
                              borderColor: "var(--missed-border)",
                            }
                          : {
                              background: "transparent",
                              borderColor: "var(--border-color)",
                            }
                    : {
                        background: "transparent",
                        borderColor:
                          "color-mix(in srgb, var(--border-color), transparent 60%)",
                      }
                }
              >
                {isWorkout && isAnalyzable ? (
                  <Dumbbell
                    size={14}
                    className="text-brand-primary fill-current"
                  />
                ) : isRest && isAnalyzable ? (
                  <CupSoda size={14} style={{ color: "var(--brand-rest)" }} />
                ) : (
                  <span
                    className="text-[10px] font-black italic tabular-nums"
                    style={{
                      color:
                        isMissed && isPast
                          ? "var(--brand-missed)"
                          : isToday
                            ? "var(--text-main)"
                            : "color-mix(in srgb, var(--text-muted), transparent 70%)",
                    }}
                  >
                    {format(day, "d")}
                  </span>
                )}

                {isToday && !isWorkout && !isRest && (
                  <div
                    className="absolute -bottom-1 w-1 h-1 rounded-full bg-brand-primary"
                    style={{ boxShadow: "0 0 4px var(--glow-primary)" }}
                  />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

import { useMemo } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { CheckCircle2 } from "lucide-react";

export const WeeklyCalendar = () => {
  const today = new Date();

  // Mock data - replace with Dexie query later
  const COMPLETED_DAYS = [new Date().toISOString()];

  const weekDays = useMemo(() => {
    const start = startOfWeek(today, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, []);

  return (
    <section className="mt-2">
      <div className="bg-gradient-to-br from-slate-900/80 to-slate-950 border border-slate-800 p-6 rounded-[2.5rem]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            Weekly Activity
          </h3>
          <div className="px-3 py-1 bg-black/40 rounded-full border border-slate-800">
            <span className="text-[10px] font-black uppercase text-brand italic">
              {format(weekDays[0], "MMM d")} — {format(weekDays[6], "MMM d")}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          {weekDays.map((day) => {
            const isToday = isSameDay(day, today);
            const isCompleted = COMPLETED_DAYS.some((d) =>
              isSameDay(new Date(d), day),
            );

            return (
              <div
                key={day.toString()}
                className="flex flex-col items-center gap-3"
              >
                <span
                  className={`text-[10px] font-black uppercase tracking-tighter ${
                    isToday ? "text-brand" : "text-slate-600"
                  }`}
                >
                  {format(day, "EEE")}
                </span>

                <div className="relative">
                  {isCompleted ? (
                    <div className="bg-brand rounded-full p-1 shadow-[0_0_15px_rgba(14,165,233,0.3)] animate-in zoom-in">
                      <CheckCircle2 size={20} className="text-white" />
                    </div>
                  ) : (
                    <div
                      className={`w-9 h-9 rounded-2xl border-2 flex items-center justify-center transition-all ${
                        isToday
                          ? "border-brand bg-brand/5 shadow-[0_0_10px_rgba(14,165,233,0.15)]"
                          : "border-slate-800 bg-black/40"
                      }`}
                    >
                      <span
                        className={`text-[11px] font-black ${
                          isToday ? "text-white" : "text-slate-700"
                        }`}
                      >
                        {format(day, "d")}
                      </span>
                    </div>
                  )}

                  {isToday && !isCompleted && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand rounded-full shadow-[0_0_5px_#0ea5e9] animate-pulse" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

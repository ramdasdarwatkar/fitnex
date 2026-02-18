import { Check } from "lucide-react";

export const WeeklyStreak = ({ activeDays }: { activeDays: number[] }) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  // Convert JS Sunday (0) to 7 for easier mapping if week starts on Monday
  const normalizedActive = activeDays.map((d) => (d === 0 ? 7 : d));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Weekly Consistency
        </h3>
        <span className="text-[10px] font-black text-[var(--brand-primary)] uppercase italic">
          {normalizedActive.length}/7 Days
        </span>
      </div>
      <div className="flex justify-between">
        {days.map((day, i) => {
          const isDone = normalizedActive.includes(i + 1);
          return (
            <div key={i} className="flex flex-col items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  isDone
                    ? "bg-[var(--brand-primary)] border-[var(--brand-primary)] shadow-[0_0_15px_rgba(204,255,0,0.2)]"
                    : "border-slate-800 bg-black/20"
                }`}
              >
                {isDone ? (
                  <Check size={16} className="text-black" strokeWidth={4} />
                ) : (
                  <span className="text-[10px] font-bold text-slate-600">
                    {day}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

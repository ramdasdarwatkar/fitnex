import { useMemo, useState } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { Play, RotateCcw, X, CalendarClock, Coffee } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWorkout } from "../../../context/WorkoutContext";
import { useAuth } from "../../../context/AuthContext";
import { WorkoutService } from "../../../services/WorkoutService";

export const WeeklyCalendar = () => {
  const { user_id } = useAuth();
  const navigate = useNavigate();
  const { isOngoing, resumeSession } = useWorkout(); // Context now only provides state

  const today = new Date();
  const [showSetup, setShowSetup] = useState(false);

  const weekDays = useMemo(() => {
    const start = startOfWeek(today, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, []);

  const handleActionSelect = async (type: "LIVE" | "PAST" | "REST") => {
    if (!user_id) return;

    if (type === "REST") {
      setShowSetup(false);
      await WorkoutService.logRestDay(user_id);
      return;
    }

    if (type === "PAST") {
      setShowSetup(false);
      // Navigate to ActiveWorkout with past mode.
      // The Setup View we built in ActiveWorkout.tsx will handle the startNewWorkout call.
      navigate(`/workout/active?mode=past`);
      return;
    }

    // LIVE WORKOUT logic: Trigger service directly
    setShowSetup(false);
    try {
      await WorkoutService.startNewWorkout(user_id);
      navigate(`/workout/active?mode=live`);
    } catch (error) {
      console.error("Failed to start live workout:", error);
    }
  };

  return (
    <section className="mt-2 relative">
      <div className="bg-gradient-to-br from-slate-900 to-black border border-slate-800 p-6 rounded-[2.5rem] shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            Weekly Activity
          </h3>
          <div className="px-3 py-1 bg-slate-900 rounded-full border border-slate-800">
            <span className="text-[10px] font-black uppercase text-[var(--brand-primary)] italic">
              {format(weekDays[0], "MMM d")} — {format(weekDays[6], "MMM d")}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center mb-8">
          {weekDays.map((day) => {
            const isToday = isSameDay(day, today);
            return (
              <div
                key={day.toString()}
                className="flex flex-col items-center gap-3"
              >
                <span
                  className={`text-[10px] font-black uppercase tracking-tighter ${
                    isToday ? "text-[var(--brand-primary)]" : "text-slate-600"
                  }`}
                >
                  {format(day, "EEE")}
                </span>
                <div
                  className={`w-9 h-9 rounded-2xl border-2 flex items-center justify-center transition-all ${
                    isToday
                      ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/10"
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
              </div>
            );
          })}
        </div>

        <button
          onClick={() => (isOngoing ? resumeSession() : setShowSetup(true))}
          className={`w-full py-4.5 rounded-2xl flex items-center justify-center gap-3 font-black uppercase italic text-[11px] tracking-widest transition-all active:scale-[0.98] shadow-lg ${
            isOngoing
              ? "bg-[var(--brand-primary)] text-black"
              : "bg-white text-black"
          }`}
        >
          {isOngoing ? (
            <RotateCcw size={16} />
          ) : (
            <Play size={16} fill="currentColor" />
          )}
          {isOngoing ? "Resume Session" : "Start Workout"}
        </button>
      </div>

      {showSetup && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[3rem] p-8 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black uppercase italic text-white tracking-tight">
                Session Type
              </h2>
              <button
                onClick={() => setShowSetup(false)}
                className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 active:scale-90 transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid gap-4">
              <SetupOption
                icon={<Play size={20} fill="currentColor" />}
                title="Live Workout"
                sub="Real-time Tracking"
                color="bg-[var(--brand-primary)]"
                onClick={() => handleActionSelect("LIVE")}
              />
              <SetupOption
                icon={<CalendarClock size={20} />}
                title="Log Previous"
                sub="Manual Entry"
                color="bg-slate-700 text-white"
                onClick={() => handleActionSelect("PAST")}
              />
              <SetupOption
                icon={<Coffee size={20} />}
                title="Rest Day"
                sub="Recovery Mode"
                color="bg-slate-800 text-white"
                onClick={() => handleActionSelect("REST")}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

const SetupOption = ({ icon, title, sub, color, onClick }: any) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-5 p-5 bg-black border border-slate-800 rounded-3xl active:scale-[0.98] transition-all hover:border-slate-700"
  >
    <div
      className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center shadow-lg`}
    >
      {icon}
    </div>
    <div className="text-left">
      <p className="text-[13px] font-black uppercase italic text-white leading-none">
        {title}
      </p>
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">
        {sub}
      </p>
    </div>
  </button>
);

import { useMemo, useState } from "react";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import {
  Play,
  RotateCcw,
  X,
  CalendarClock,
  Coffee,
  Zap,
  Target,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWorkout } from "../../../context/WorkoutContext";
import { useAuth } from "../../../context/AuthContext";
import { WorkoutService } from "../../../services/WorkoutService";

interface WeeklyCalendarProps {
  activeDays: string[]; // e.g., ["2026-02-17"]
  restDays: string[]; // e.g., ["2026-02-18"]
}

export const WeeklyCalendar = ({
  activeDays = [],
  restDays = [],
}: WeeklyCalendarProps) => {
  const { user_id } = useAuth();
  const navigate = useNavigate();
  const { isOngoing, resumeSession } = useWorkout();
  const [showSetup, setShowSetup] = useState(false);

  const today = new Date();

  // 1. Generate the 7 days of the current week (Mon-Sun)
  const weekDays = useMemo(() => {
    const start = startOfWeek(today, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, []);

  // 2. Parse ISO strings to Date objects for accurate comparison
  const activeDateObjects = useMemo(
    () => activeDays?.map((d) => parseISO(d)) ?? [],
    [activeDays],
  );
  const restDateObjects = useMemo(
    () => restDays?.map((d) => parseISO(d)) ?? [],
    [restDays],
  );

  // 3. Target Logic
  const workoutCount = activeDateObjects.length;
  const weeklyTarget = 5;
  const progressPercent = Math.min((workoutCount / weeklyTarget) * 100, 100);

  const handleActionSelect = async (type: "LIVE" | "PAST" | "REST") => {
    if (!user_id) return;
    setShowSetup(false);
    if (type === "REST") return await WorkoutService.logRestDay(user_id);
    if (type === "PAST") return navigate(`/workout/active?mode=past`);
    await WorkoutService.startNewWorkout(user_id);
    navigate(`/workout/active?mode=live`);
  };

  return (
    <section className="dashboard-card bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] shadow-xl h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Weekly Consistency
            </h3>
            <p className="text-[var(--brand-primary)] text-[9px] font-black uppercase italic">
              Sessions Completed - {workoutCount}
            </p>
          </div>
          <div className="px-3 py-1 bg-black/40 rounded-full border border-slate-800">
            <span className="text-[8px] font-black uppercase text-slate-500 tabular-nums">
              {format(weekDays[0], "MMM d")} - {format(weekDays[6], "MMM d")}
            </span>
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
                    <Coffee size={16} className="text-blue-400" />
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
        <div className="bg-black/40 border border-slate-800/50 rounded-2xl p-4 mb-8">
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

      <button
        onClick={() => (isOngoing ? resumeSession() : setShowSetup(true))}
        className={`w-full py-5 rounded-3xl flex items-center justify-center gap-3 font-black uppercase italic text-[11px] tracking-widest transition-all active:scale-[0.98] ${
          isOngoing
            ? "bg-[var(--brand-primary)] text-black shadow-[0_0_20px_rgba(204,255,0,0.2)]"
            : "bg-white text-black"
        }`}
      >
        {isOngoing ? (
          <RotateCcw size={16} />
        ) : (
          <Play size={16} fill="currentColor" />
        )}
        {isOngoing ? "Resume Active Workout" : "Start New Session"}
      </button>

      {/* SETUP MODAL */}
      {showSetup && (
        <div className="fixed inset-0 z-[600] flex items-end justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[3.5rem] p-8 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-8 px-2">
              <h2 className="text-xl font-black uppercase italic text-white">
                Log Session
              </h2>
              <button
                onClick={() => setShowSetup(false)}
                className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid gap-3">
              <SetupOption
                icon={<Zap size={20} fill="currentColor" />}
                title="Live Session"
                sub="Real-time Tracking"
                color="bg-[var(--brand-primary)] text-black"
                onClick={() => handleActionSelect("LIVE")}
              />
              <SetupOption
                icon={<CalendarClock size={20} />}
                title="Manual Log"
                sub="Enter Past Workout"
                color="bg-slate-700 text-white"
                onClick={() => handleActionSelect("PAST")}
              />
              <SetupOption
                icon={<Coffee size={20} />}
                title="Rest Day"
                sub="Recovery Mode"
                color="bg-blue-600 text-white"
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
  <div
    onClick={onClick}
    className="flex items-center gap-5 p-5 bg-black border border-slate-800 rounded-[2rem] active:scale-95 transition-all cursor-pointer"
  >
    <div
      className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}
    >
      {icon}
    </div>
    <div className="text-left">
      <p className="text-[13px] font-black uppercase italic text-white leading-none">
        {title}
      </p>
      <p className="text-[8px] font-bold text-slate-500 uppercase mt-1.5 tracking-widest">
        {sub}
      </p>
    </div>
  </div>
);

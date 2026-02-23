import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SubPageLayout } from "../../../components/layout/SubPageLayout";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Share2,
  Calendar as CalendarIcon,
} from "lucide-react";
import { WorkoutService } from "../../../services/WorkoutService";
import { useAuth } from "../../../hooks/useAuth";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../db/database";
import { ExerciseCard, type LogRow } from "../components/ExerciseCard";
import { AnalyticsService } from "../../../services/AnalyticsService";

// --- 1. STRICT INTERFACES ---

interface WorkoutLogWithExercise {
  id: string;
  weight: number | null;
  reps: number | null;
  distance: number | null;
  duration: number | null;
  exercise?: {
    name: string;
    category: string;
  };
}

interface StrengthSummary {
  category: string;
  sets: number;
  volume: number;
}

// --- 2. MAIN COMPONENT ---

export const WorkoutHistory = () => {
  const navigate = useNavigate();
  const { user_id } = useAuth();
  const muscleAnalysisRef = useRef<HTMLDivElement>(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [logs, setLogs] = useState<WorkoutLogWithExercise[]>([]);
  const [isSharing, setIsSharing] = useState(false);

  // 1. Stable Date Bounds
  const mStart = useMemo(
    () => format(startOfMonth(currentDate), "yyyy-MM-dd"),
    [currentDate],
  );
  const mEnd = useMemo(
    () => format(endOfMonth(currentDate), "yyyy-MM-dd"),
    [currentDate],
  );

  // 2. FIXED: Stabilize Muscle Data in its own useMemo
  const rawMuscles = useLiveQuery(() => db.muscles.toArray(), []) || [];
  const muscles = useMemo(() => rawMuscles, [rawMuscles]);

  // 3. FIXED: Stabilize Monthly Workouts in its own useMemo
  const rawMonthly =
    useLiveQuery(
      () =>
        db.workout_history
          .where("start_time")
          .between(mStart, mEnd, true, true)
          .toArray(),
      [mStart, mEnd],
    ) || [];
  const monthly = useMemo(() => rawMonthly, [rawMonthly]);

  // Sync range with service
  useEffect(() => {
    if (user_id) {
      WorkoutService.getWorkoutsInRange(user_id, mStart, mEnd);
    }
  }, [user_id, mStart, mEnd]);

  const monthStats = useLiveQuery(async () => {
    if (!user_id) return null;
    return AnalyticsService.getSmartCustomizedStats(user_id, mStart, mEnd);
  }, [user_id, mStart, mEnd]);

  // Load details for specific selected day
  useEffect(() => {
    const dayStr = format(selectedDate, "yyyy-MM-dd");
    const workout = monthly.find((w) => w.start_time.startsWith(dayStr));

    if (workout && !workout.rest_day) {
      WorkoutService.getWorkoutDetails(workout.id).then((data) => {
        setLogs(data as WorkoutLogWithExercise[]);
      });
    } else {
      setLogs([]);
    }
  }, [selectedDate, monthly]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const groupedLogs = useMemo(() => {
    const map: Record<string, WorkoutLogWithExercise[]> = {};
    logs.forEach((l) => {
      const name = l.exercise?.name || "Exercise";
      if (!map[name]) map[name] = [];
      map[name].push(l);
    });
    return map;
  }, [logs]);

  const strengthSummaries = useMemo(() => {
    if (!muscles.length || !logs.length) return [];
    const muscleMap = new Map(muscles.map((m) => [m.id, m.name]));
    const sMap: Record<string, { sets: number; volume: number }> = {};

    logs.forEach((l) => {
      const isCardio = (l.distance || 0) > 0 || (!!l.duration && !l.weight);
      if (!isCardio) {
        const muscleId = l.exercise?.category || "";
        const muscleName = muscleMap.get(muscleId) || "Other";
        if (!sMap[muscleName]) sMap[muscleName] = { sets: 0, volume: 0 };
        sMap[muscleName].sets += 1;
        if (l.weight && l.reps) sMap[muscleName].volume += l.weight * l.reps;
      }
    });

    return Object.entries(sMap).map(
      ([k, v]): StrengthSummary => ({ category: k, ...v }),
    );
  }, [logs, muscles]);

  const fv = (v: string | number, u?: string) =>
    !v || v === 0 ? "-" : `${v}${u ? ` ${u}` : ""}`;

  const handleShare = async () => {
    if (!muscleAnalysisRef.current || !user_id) return;
    setIsSharing(true);
    try {
      const node = muscleAnalysisRef.current;
      const width = node.offsetWidth;
      const height = node.offsetHeight + 120;
      const canvas = document.createElement("canvas");
      canvas.width = width * 2;
      canvas.height = height * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(2, 2);

      const dateStr = format(selectedDate, "EEEE, MMM dd").toUpperCase();
      const svgData = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="color: white; font-family: system-ui; background: #020617; padding: 40px;">
              <div style="border-bottom: 2px solid var(--brand-primary); padding-bottom: 20px; margin-bottom: 30px;">
                  <div style="font-size: 28px; font-weight: 900; font-style: italic; color: var(--brand-primary);">ACTIVITY VAULT</div>
                  <div style="font-size: 12px; font-weight: 800; color: #64748b; margin-top: 5px;">${dateStr}</div>
              </div>
              ${node.innerHTML}
            </div>
          </foreignObject>
        </svg>`;

      const img = new Image();
      img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
      img.onload = async () => {
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL("image/png");
        const res = await fetch(pngUrl);
        const blob = await res.blob();
        if (navigator.share) {
          await navigator.share({
            files: [
              new File([blob], `Workout-${dateStr}.png`, { type: "image/png" }),
            ],
          });
        }
      };
    } catch (err) {
      console.error(err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <SubPageLayout title="Activity Vault">
      <div className="space-y-10 pb-40 animate-in fade-in duration-500">
        <header className="px-4 flex justify-between items-center bg-bg-surface border border-border-color p-6 rounded-4xl mx-4 shadow-xl">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="text-text-muted active:scale-90 transition-transform"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex flex-col items-center">
            <h2 className="font-black text-lg uppercase italic text-text-main leading-none">
              {format(currentDate, "MMMM")}
            </h2>
            <span className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.2em] mt-1 italic">
              {format(currentDate, "yyyy")}
            </span>
          </div>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="text-text-muted active:scale-90 transition-transform"
          >
            <ChevronRight size={24} />
          </button>
        </header>

        <div className="px-6 grid grid-cols-7 gap-3 text-center">
          {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
            <span
              key={d}
              className="text-[9px] font-black uppercase text-text-muted opacity-40 italic"
            >
              {d}
            </span>
          ))}
          {calendarDays.map((day, i) => {
            const ds = format(day, "yyyy-MM-dd");
            const workout = monthly.find((m) => m.start_time.startsWith(ds));
            const isSelected = isSameDay(day, selectedDate);
            const isCurrMonth = isSameMonth(day, currentDate);

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(day)}
                className={`relative aspect-square rounded-2xl transition-all flex items-center justify-center text-sm font-black italic
                    ${!isCurrMonth ? "opacity-0 pointer-events-none" : "opacity-100"}
                    ${isSelected ? "bg-brand-primary text-bg-main shadow-lg shadow-brand-primary/20 scale-110 z-10" : "bg-bg-surface text-text-main border border-border-color/30"}`}
              >
                {format(day, "d")}
                {workout && (
                  <div
                    className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${workout.rest_day ? "bg-brand-success" : isSelected ? "bg-bg-main" : "bg-brand-primary"}`}
                  />
                )}
              </button>
            );
          })}
        </div>

        <SectionDivider label="Monthly Stats" />
        <div className="grid grid-cols-3 gap-4 px-4">
          <MiniStat label="Volume" val={monthStats?.total_volume} unit="kg" />
          <MiniStat label="Sets" val={monthStats?.total_sets} />
          <MiniStat label="Reps" val={monthStats?.total_reps} />
          <MiniStat label="Calories" val={monthStats?.calories} />
          <MiniStat label="Steps" val={monthStats?.total_steps} />
          <MiniStat
            label="Time"
            val={monthStats?.total_duration_min}
            unit="min"
          />
        </div>

        <div className="px-4 flex items-center justify-between">
          <SectionDivider label="Workout Details" className="flex-1" />
          <div className="flex gap-2 ml-4">
            <button
              onClick={async () => {
                if (!user_id) return;
                const id = await WorkoutService.rePerformWorkout(user_id, logs);
                if (id) navigate("/workout/active?mode=live");
              }}
              className="p-3 bg-bg-surface border border-border-color rounded-2xl text-brand-primary active:scale-90 transition-transform shadow-lg"
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="p-3 bg-bg-surface border border-border-color rounded-2xl text-text-main active:scale-90 transition-transform shadow-lg"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-10 px-4">
          {Object.entries(groupedLogs).length > 0 ? (
            Object.entries(groupedLogs).map(([name, rows]) => (
              <ExerciseCard
                key={name}
                name={name}
                rows={rows.map(
                  (r): LogRow => ({
                    weight: r.weight || 0,
                    reps: r.reps || 0,
                    distance: r.distance || 0,
                    duration: r.duration || 0,
                  }),
                )}
                fv={fv}
              />
            ))
          ) : (
            <div className="py-20 flex flex-col items-center justify-center opacity-20 text-text-muted">
              <CalendarIcon size={48} strokeWidth={1} />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-4 italic">
                Rest Day
              </p>
            </div>
          )}
        </div>

        {strengthSummaries.length > 0 && (
          <div ref={muscleAnalysisRef} className="px-4 space-y-10 pb-10">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted italic flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />{" "}
                Muscle Distribution
              </h3>
              <div className="bg-bg-surface border border-border-color rounded-[2.5rem] p-6 shadow-xl">
                <table className="w-full">
                  <thead>
                    <tr className="text-left">
                      <th className="pb-4 text-[9px] font-black uppercase text-text-muted tracking-widest italic opacity-50">
                        Category
                      </th>
                      <th className="pb-4 text-[9px] font-black uppercase text-text-muted tracking-widest italic opacity-50">
                        Sets
                      </th>
                      <th className="pb-4 text-right text-[9px] font-black uppercase text-text-muted tracking-widest italic opacity-50">
                        Volume
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-color/10">
                    {strengthSummaries.map((s, i) => (
                      <tr key={i} className="h-12 tabular-nums">
                        <td className="text-sm font-black text-text-main italic">
                          {s.category}
                        </td>
                        <td className="text-sm font-bold text-text-muted">
                          {s.sets}
                        </td>
                        <td className="text-right text-sm font-black text-brand-primary italic">
                          {s.volume} kg
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </SubPageLayout>
  );
};

const SectionDivider = ({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) => (
  <div className={`flex items-center gap-4 ${className}`}>
    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted italic whitespace-nowrap opacity-60">
      {label}
    </span>
    <div className="h-px w-full bg-border-color/30" />
  </div>
);

const MiniStat = ({
  label,
  val,
  unit = "",
}: {
  label: string;
  val?: string | number;
  unit?: string;
}) => (
  <div className="bg-bg-surface border border-border-color p-5 rounded-3xl text-center shadow-md active:scale-95 transition-transform">
    <div className="text-xl font-black text-text-main italic tabular-nums leading-none mb-2">
      {!val || val === 0 ? "-" : val}
    </div>
    <div className="text-[8px] font-black uppercase text-text-muted tracking-widest opacity-50 leading-none">
      {label} {unit && `(${unit})`}
    </div>
  </div>
);

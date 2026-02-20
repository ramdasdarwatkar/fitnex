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
  setYear,
  setMonth,
  getYear,
} from "date-fns";
import { ChevronLeft, ChevronRight, RotateCcw, Share2 } from "lucide-react";
import { AthleteService } from "../../../services/AthleteService";
import { WorkoutService } from "../../../services/WorkoutService";
import { useAuth } from "../../../context/AuthContext";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../db/database";
import { DateUtils } from "../../../util/dateUtils";

/* -------------------------------------------------------------------------- */
/* EXTRACTED EXERCISE CARD                           */
/* -------------------------------------------------------------------------- */
const ExerciseCard = ({ name, rows, fv }: any) => {
  const hasWeight = rows.some((r: any) => r.weight > 0);
  const hasReps = rows.some((r: any) => r.reps > 0);
  const hasDistance = rows.some((r: any) => r.distance > 0);
  const hasDuration = rows.some((r: any) => r.duration > 0);

  return (
    <div className="space-y-3">
      <h3 className="font-black text-white">{name}</h3>
      <div className="bg-slate-900/40 rounded-xl p-4 text-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left">
              <th className="w-12 pb-3 uppercase text-[10px] text-slate-500">
                Set
              </th>
              {hasWeight && (
                <th className="pb-3 uppercase text-[10px] text-slate-500">
                  Weight
                </th>
              )}
              {hasReps && (
                <th className="pb-3 uppercase text-[10px] text-slate-500">
                  Reps
                </th>
              )}
              {hasDistance && (
                <th className="pb-3 uppercase text-[10px] text-slate-500">
                  Dist
                </th>
              )}
              {hasDuration && (
                <th className="pb-3 uppercase text-[10px] text-slate-500">
                  Time
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            <tr className="h-2"></tr>
            {rows.map((r: any, i: number) => (
              <tr key={i} className="h-8">
                <td className="w-12 align-middle text-slate-500">{i + 1}</td>
                {hasWeight && (
                  <td className="align-middle">{fv(r.weight, "kg")}</td>
                )}
                {hasReps && <td className="align-middle">{fv(r.reps)}</td>}
                {hasDistance && (
                  <td className="align-middle">
                    {fv((r.distance / 1000).toFixed(2), "km")}
                  </td>
                )}
                {hasDuration && (
                  <td className="align-middle">
                    {fv(Math.floor(r.duration / 60), "min")}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* MAIN HISTORY PAGE                               */
/* -------------------------------------------------------------------------- */
export const WorkoutHistory = () => {
  const navigate = useNavigate();
  const { athlete } = useAuth();
  const muscleAnalysisRef = useRef<HTMLDivElement>(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [logs, setLogs] = useState<any[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const muscles = useLiveQuery(() => db.muscles.toArray(), []) || [];

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h}h ${m}m`;
    }
    return `${mins}m`;
  };

  const monthRange = useMemo(
    () => ({
      start: format(startOfMonth(currentDate), "yyyy-MM-dd"),
      end: format(endOfMonth(currentDate), "yyyy-MM-dd"),
    }),
    [currentDate],
  );

  useEffect(() => {
    if (athlete?.user_id) {
      WorkoutService.getWorkoutsInRange(
        athlete.user_id,
        monthRange.start,
        monthRange.end,
      );
    }
  }, [athlete?.user_id, monthRange]);

  const monthly =
    useLiveQuery(
      () =>
        db.workout_history
          .where("start_time")
          .between(monthRange.start, monthRange.end, true, true)
          .toArray(),
      [monthRange],
    ) || [];

  const monthStats = useLiveQuery(async () => {
    if (!athlete?.user_id) return null;
    return AthleteService.getSmartCustomizedStats(
      athlete.user_id,
      monthRange.start,
      monthRange.end,
    );
  }, [monthRange]);

  useEffect(() => {
    const day = format(selectedDate, "yyyy-MM-dd");
    const workout = monthly.find((w) => w.start_time.startsWith(day));
    if (workout && !workout.rest_day) {
      WorkoutService.getWorkoutDetails(workout.id).then(setLogs);
    } else setLogs([]);
  }, [selectedDate, monthly]);

  const calendar = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    logs.forEach((l) => {
      const name = l.exercise?.name || "Exercise";
      if (!map[name]) map[name] = [];
      map[name].push(l);
    });
    return map;
  }, [logs]);

  const summaries = useMemo(() => {
    if (!muscles.length || !logs.length) return { strength: [], cardio: [] };
    const muscleMap = new Map(muscles.map((m) => [m.id, m.name]));
    const sMap: Record<string, { sets: number; volume: number }> = {};
    const cMap: Record<string, { duration: number; distance: number }> = {};

    logs.forEach((l) => {
      const isCardio = l.distance > 0 || (l.duration && !l.weight);
      const muscleId = l.exercise?.category;
      const muscleName = muscleMap.get(muscleId) || "Other";

      if (isCardio) {
        if (!cMap[muscleName]) cMap[muscleName] = { duration: 0, distance: 0 };
        cMap[muscleName].duration += l.duration || 0;
        cMap[muscleName].distance += l.distance || 0;
      } else {
        if (!sMap[muscleName]) sMap[muscleName] = { sets: 0, volume: 0 };
        sMap[muscleName].sets += 1;
        if (l.weight && l.reps) sMap[muscleName].volume += l.weight * l.reps;
      }
    });
    return {
      strength: Object.entries(sMap).map(([k, v]) => ({ category: k, ...v })),
      cardio: Object.entries(cMap).map(([k, v]) => ({ category: k, ...v })),
    };
  }, [logs, muscles]);

  const fv = (v: any, u?: string) =>
    !v || v === 0 ? "-" : `${v}${u ? ` ${u}` : ""}`;

  const handleShare = async () => {
    if (!muscleAnalysisRef.current || !athlete) return;
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

      const userName = (athlete.name || "PRO ATHLETE").toUpperCase();
      const dateStr = format(selectedDate, "EEEE-dd-MM-yyyy").toUpperCase();

      const data = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="color: white; font-family: sans-serif; background: #020617; padding: 30px; border-radius: 12px;">
              <style>
                .bg-slate-900\\/40 { background-color: rgba(15, 23, 42, 0.4); margin-bottom: 20px; padding: 16px; border-radius: 12px; }
                .text-brand { color: #ccff00; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th { text-align: left; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; }
                td { padding: 10px 0; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .header-box { border-bottom: 2px solid #ccff00; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
                .user-name { font-size: 24px; font-weight: 900; font-style: italic; letter-spacing: -0.03em; color: #ccff00; }
                .date-label { font-size: 10px; font-weight: 800; color: #64748b; margin-top: 4px; }
              </style>
              <div class="header-box">
                <div>
                  <div class="user-name">${userName}</div>
                  <div class="date-label">${dateStr}</div>
                </div>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccff00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                </svg>
              </div>
              ${node.innerHTML}
            </div>
          </foreignObject>
        </svg>
      `;

      const svgBase64 = btoa(unescape(encodeURIComponent(data)));
      const img = new Image();
      img.onload = async () => {
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL("image/png");
        const res = await fetch(pngUrl);
        const blob = await res.blob();
        if (navigator.share) {
          const file = new File([blob], dateStr + `.png`, {
            type: "image/png",
          });
          await navigator.share({ files: [file] });
        }
      };
      img.src = `data:image/svg+xml;base64,${svgBase64}`;
    } catch (err) {
      console.error(err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <SubPageLayout title="Activity Vault">
      <div className="space-y-10 pb-40">
        {/* MONTH HEADER */}
        <div className="flex justify-between px-4 items-center">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft />
          </button>
          <button onClick={() => setIsPickerOpen(!isPickerOpen)}>
            <h2 className="font-black text-lg">
              {format(currentDate, "MMMM yyyy")}
            </h2>
          </button>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight />
          </button>
        </div>

        {/* PICKER */}
        {isPickerOpen && (
          <div className="mx-4 bg-slate-900 border border-slate-800 rounded-xl p-4 animate-in zoom-in duration-200">
            <div className="grid grid-cols-4 gap-2 mb-4">
              {Array.from({ length: 12 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentDate(setMonth(currentDate, i));
                    setIsPickerOpen(false);
                  }}
                  className={`py-2 rounded-lg text-[10px] font-black uppercase ${currentDate.getMonth() === i ? "bg-brand text-black" : "bg-black/40 text-slate-500"}`}
                >
                  {format(new Date(2000, i, 1), "MMM")}
                </button>
              ))}
            </div>
            <div className="flex justify-center gap-4 border-t border-white/10 pt-4">
              {[2024, 2025, 2026].map((y) => (
                <button
                  key={y}
                  onClick={() => {
                    setCurrentDate(setYear(currentDate, y));
                    setIsPickerOpen(false);
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-black ${getYear(currentDate) === y ? "bg-white text-black" : "bg-black/40 text-slate-600"}`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CALENDAR */}
        <div className="px-4 grid grid-cols-7 gap-2 text-center">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <span key={d} className="text-[9px] uppercase text-slate-500">
              {d}
            </span>
          ))}
          {calendar.map((day, i) => {
            const ds = format(day, "yyyy-MM-dd");
            const w = monthly.find((m) => m.start_time.startsWith(ds));
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(day)}
                className={`relative aspect-square rounded-lg ${isSameDay(day, selectedDate) && "bg-brand text-black"} ${!isSameMonth(day, currentDate) && "opacity-0"}`}
              >
                {format(day, "d")}
                {w && (
                  <div
                    className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${w.rest_day ? "bg-emerald-500" : "bg-brand"}`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* MONTHLY SUMMARY */}
        <div className="px-4 flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic whitespace-nowrap">
            Monthly Summary
          </span>
          <div className="h-[1px] w-full bg-slate-800/50" />
        </div>

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

        {/* WORKOUT DETAILS HEADER */}
        <div className="px-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic whitespace-nowrap">
              Workout Details
            </span>
            <div className="h-[1px] w-full bg-slate-800/50" />
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={async () => {
                const id = await WorkoutService.rePerformWorkout(
                  athlete!.user_id,
                  logs,
                );
                if (id) navigate("/workout/active?mode=live");
              }}
              className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-brand"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>

        {/* LOGS WITH EXTRACTED COMPONENT */}
        <div className="space-y-8 px-4">
          {Object.entries(grouped).map(([name, rows]) => (
            <ExerciseCard key={name} name={name} rows={rows} fv={fv} />
          ))}
        </div>

        {/* SUMMARY SECTION (SHARE TARGET) */}
        {(summaries.strength.length > 0 || summaries.cardio.length > 0) && (
          <div ref={muscleAnalysisRef} className="px-4 space-y-8 pb-10">
            {summaries.strength.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">
                  Muscle Volume Analysis
                </h3>
                <div className="bg-slate-900/40 rounded-xl p-4 text-white">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left">
                        <th className="pb-3 uppercase text-[9px] text-slate-500">
                          Category
                        </th>
                        <th className="pb-3 uppercase text-[9px] text-slate-500">
                          Sets
                        </th>
                        <th className="pb-3 text-right uppercase text-[9px] text-slate-500">
                          Volume
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="h-2"></tr>
                      {summaries.strength.map((s, i) => (
                        <tr
                          key={i}
                          className="border-b border-white/5 last:border-0 h-10"
                        >
                          <td className="font-bold">{s.category}</td>
                          <td>{s.sets}</td>
                          <td className="text-right font-black text-brand">
                            {s.volume} kg
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {summaries.cardio.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">
                  Cardio & Endurance
                </h3>
                <div className="bg-slate-900/40 rounded-xl p-4 text-white">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left">
                        <th className="pb-3 uppercase text-[9px] text-slate-500">
                          Activity
                        </th>
                        <th className="pb-3 uppercase text-[9px] text-slate-500">
                          Dist
                        </th>
                        <th className="pb-3 text-right uppercase text-[9px] text-slate-500">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="h-2"></tr>
                      {summaries.cardio.map((c, i) => (
                        <tr
                          key={i}
                          className="border-b border-white/5 last:border-0 h-10"
                        >
                          <td className="font-bold">{c.category}</td>
                          <td>
                            {c.distance > 0
                              ? `${(c.distance / 1000).toFixed(2)} km`
                              : "-"}
                          </td>
                          <td className="text-right font-black text-brand">
                            {formatDuration(c.duration)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </SubPageLayout>
  );
};

const MiniStat = ({ label, val, unit = "" }: any) => (
  <div className="bg-slate-900/40 rounded-xl p-4 text-center text-white">
    <div className="text-xl font-black">{!val || val === 0 ? "-" : val}</div>
    <div className="text-[10px] uppercase text-slate-500">
      {label} {unit && `(${unit})`}
    </div>
  </div>
);

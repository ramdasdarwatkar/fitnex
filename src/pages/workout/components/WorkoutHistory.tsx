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
import { DateUtils } from "../../../util/dateUtils";

// --- INTERFACES ---

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

// --- SHARE IMAGE BUILDER ---

/**
 * Renders a premium dark share card showing each exercise
 * and its individual sets (weight × reps / distance / duration).
 */
// ---------------------------------------------------------------------------
// buildAndShareWorkout — pure Canvas 2D renderer, no SVG / foreignObject.
// Reliably produces two-column layout when exercise count > 7.
// ---------------------------------------------------------------------------

const CARD_BG = "rgba(255,255,255,0.04)";
const CARD_BORDER = "rgba(255,255,255,0.08)";
const GREEN = "#22c55e";
const WHITE = "#ffffff";
const WHITE_DIM = "rgba(255,255,255,0.55)";
const WHITE_FAINT = "rgba(255,255,255,0.25)";
const BG = "#020617";

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Returns the Y position after drawing all blocks in a column.
function drawColumn(
  ctx: CanvasRenderingContext2D,
  entries: [string, WorkoutLogWithExercise[]][],
  startX: number,
  startY: number,
  colW: number,
  scale: number,
): number {
  const pad = 14 * scale;
  const radius = 12 * scale;
  const rowH = 24 * scale;
  const dotR = 3 * scale;
  let y = startY;

  entries.forEach(([name, rows]) => {
    const hasWeight = rows.some((r) => r.weight && r.weight > 0);
    const hasReps = rows.some((r) => r.reps && r.reps > 0);
    const hasDistance = rows.some((r) => r.distance && r.distance > 0);
    const hasDuration = rows.some((r) => r.duration && r.duration > 0);

    const colDefs: {
      label: string;
      key: keyof WorkoutLogWithExercise | "set";
    }[] = [
      { label: "Set", key: "set" },
      ...(hasWeight ? [{ label: "Weight", key: "weight" as const }] : []),
      ...(hasReps ? [{ label: "Reps", key: "reps" as const }] : []),
      ...(hasDistance ? [{ label: "Dist", key: "distance" as const }] : []),
      ...(hasDuration ? [{ label: "Time", key: "duration" as const }] : []),
    ];

    const nameH = 20 * scale; // space for exercise name
    const colHeadH = 16 * scale; // space for SET/WEIGHT/REPS labels
    const headerH = nameH + colHeadH;
    const cardH = pad + headerH + rows.length * rowH + pad;

    // Card background
    roundRect(ctx, startX, y, colW, cardH, radius);
    ctx.fillStyle = CARD_BG;
    ctx.fill();
    ctx.strokeStyle = CARD_BORDER;
    ctx.lineWidth = scale;
    ctx.stroke();

    // Exercise name dot
    ctx.beginPath();
    ctx.arc(
      startX + pad + dotR,
      y + pad + nameH - 10 * scale,
      dotR,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = GREEN;
    ctx.shadowColor = GREEN;
    ctx.shadowBlur = 6 * scale;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Exercise name text
    ctx.font = `900 italic ${11 * scale}px Poppins, system-ui, sans-serif`;
    ctx.fillStyle = GREEN;
    ctx.textAlign = "left";
    const nameX = startX + pad + dotR * 2 + 6 * scale;
    const nameMaxW = colW - pad * 2 - dotR * 2 - 8 * scale;
    ctx.fillText(
      name.toUpperCase(),
      nameX,
      y + pad + nameH - 7 * scale,
      nameMaxW,
    );

    // Divider: sits between name row and column-header row
    const divY = y + pad + nameH;
    ctx.beginPath();
    ctx.moveTo(startX + pad, divY);
    ctx.lineTo(startX + colW - pad, divY);
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = scale;
    ctx.stroke();

    // Column headers
    // Layout: [pad][setCol=24][gap=6][dataCol1]...[dataColN][pad]
    // Each data col gets equal width. All right-aligned to their slot's right edge.
    const setColW = 24 * scale;
    const gapW = 6 * scale;
    const dataCount = Math.max(colDefs.length - 1, 1);
    const dataAreaW = colW - pad * 2 - setColW - gapW;
    const dataColW = dataAreaW / dataCount;
    const dataStartX = startX + pad + setColW + gapW;
    const headerY = y + pad + nameH + colHeadH - 4 * scale; // baseline inside colHeadH band
    ctx.font = `800 ${7 * scale}px Poppins, system-ui, sans-serif`;
    ctx.fillStyle = WHITE_FAINT;
    colDefs.forEach((col, ci) => {
      let cx: number;
      if (ci === 0) {
        // SET: centred in its fixed column
        cx = startX + pad + setColW / 2;
        ctx.textAlign = "center";
      } else {
        // Data cols: right-aligned to right edge of each equal slot
        cx = dataStartX + (ci - 1) * dataColW + dataColW;
        ctx.textAlign = "right";
      }
      ctx.fillText(col.label.toUpperCase(), cx, headerY);
    });

    // Set rows
    rows.forEach((row, ri) => {
      const rowY = y + pad + headerH + ri * rowH + rowH - 7 * scale;
      const rowBaseY = y + pad + headerH + ri * rowH;

      // Row divider (skip last)
      if (ri < rows.length - 1) {
        ctx.beginPath();
        ctx.moveTo(startX + pad, rowBaseY + rowH);
        ctx.lineTo(startX + colW - pad, rowBaseY + rowH);
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.lineWidth = scale;
        ctx.stroke();
      }

      colDefs.forEach((col, ci) => {
        let text = "—";
        let color = WHITE;

        if (col.key === "set") {
          text = String(ri + 1);
          color = WHITE_FAINT;
        } else if (col.key === "weight" && row.weight) {
          text = `${row.weight} kg`;
        } else if (col.key === "reps" && row.reps) {
          text = String(row.reps);
        } else if (col.key === "distance" && row.distance) {
          text = `${(row.distance / 1000).toFixed(2)} km`;
        } else if (col.key === "duration" && row.duration) {
          text = `${Math.floor(row.duration / 60)}m ${row.duration % 60}s`;
          color = GREEN;
        }

        ctx.font = `900 italic ${11 * scale}px Poppins, system-ui, sans-serif`;
        ctx.fillStyle = color;
        let cx: number;
        if (ci === 0) {
          cx = startX + pad + setColW / 2;
          ctx.textAlign = "center";
        } else {
          cx = dataStartX + (ci - 1) * dataColW + dataColW;
          ctx.textAlign = "right";
        }
        ctx.fillText(text, cx, rowY);
      });
    });

    y += cardH + 10 * scale;
  });

  return y;
}

async function buildAndShareWorkout(
  dateStr: string,
  groupedLogs: Record<string, WorkoutLogWithExercise[]>,
  name: string,
): Promise<Blob | null> {
  const entries = Object.entries(groupedLogs);
  const exerciseCount = entries.length;
  const twoCol = exerciseCount > 7;
  const scale = 2; // retina
  const PADDING = 32;
  const GAP = 16; // gap between columns (logical px)

  // Logical dimensions
  const logicalW = twoCol ? 860 : 420;
  const colW = twoCol
    ? Math.floor((logicalW - PADDING * 2 - GAP) / 2)
    : logicalW - PADDING * 2;

  // Estimate height per column
  const perExH = (rows: WorkoutLogWithExercise[]) =>
    rows.length * 24 + 28 + 14 * 2 + 10;
  const splitAt = twoCol ? Math.ceil(entries.length / 2) : entries.length;
  const leftH = entries
    .slice(0, splitAt)
    .reduce((a, [, r]) => a + perExH(r), 0);
  const rightH = twoCol
    ? entries.slice(splitAt).reduce((a, [, r]) => a + perExH(r), 0)
    : 0;
  const bodyH = Math.max(leftH, rightH);
  //const logicalH = Math.max(bodyH + 220, 500); // 220 = header (~140) + footer (~80)
  const HEADER_H = 100;
  const FOOTER_H = 60;

  const logicalH = Math.max(bodyH + HEADER_H + FOOTER_H);
  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = logicalW * scale;
  canvas.height = logicalH * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Ambient glow top-right
  const gr1 = ctx.createRadialGradient(
    canvas.width,
    0,
    0,
    canvas.width,
    0,
    200 * scale,
  );
  gr1.addColorStop(0, "rgba(34,197,94,0.08)");
  gr1.addColorStop(1, "transparent");
  ctx.fillStyle = gr1;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const s = scale; // shorthand
  const px = (n: number) => n * s;

  // --- HEADER ---
  const headerX = px(PADDING);
  let curY = px(PADDING);

  // "Activity Vault" label
  ctx.font = `700 italic ${px(13)}px Poppins, system-ui, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.textAlign = "left";
  ctx.letterSpacing = `${px(2)}px`;
  ctx.fillText(name.toUpperCase(), headerX, curY + px(10));
  ctx.letterSpacing = "0px";

  curY += px(18);

  // Date — split into day + date, matching label scale
  ctx.font = `800 ${px(10)}px Poppins, system-ui, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.fillText(dateStr, headerX, curY + px(10));
  curY += px(20);

  // Summary pills
  // Summary pills (top-right, replacing logo dot)

  const totalSets = entries.reduce((a, [, r]) => a + r.length, 0);

  const pill = (text: string, x: number, y: number, green: boolean) => {
    ctx.font = `800 ${px(9)}px Poppins, system-ui, sans-serif`;
    const tw = ctx.measureText(text).width;
    const pw = tw + px(24);
    const ph = px(22);

    roundRect(ctx, x, y, pw, ph, px(11));
    ctx.fillStyle = green ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.05)";
    ctx.fill();
    ctx.strokeStyle = green ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.10)";
    ctx.lineWidth = s;
    ctx.stroke();

    ctx.fillStyle = green ? GREEN : WHITE_DIM;
    ctx.textAlign = "left";
    ctx.fillText(text, x + px(12), y + px(14));

    return pw;
  };

  // Measure both pills first
  ctx.font = `800 ${px(9)}px Poppins, system-ui, sans-serif`;
  const text1 = `${exerciseCount} EXERCISE${exerciseCount !== 1 ? "S" : ""}`;
  const text2 = `${totalSets} SETS TOTAL`;

  const p1Width = ctx.measureText(text1).width + px(24);
  const p2Width = ctx.measureText(text2).width + px(24);
  const gap = px(8);

  const totalWidth = p1Width + gap + p2Width;

  // Anchor to same right padding area
  const startX = canvas.width - px(PADDING) - totalWidth;
  const startY = px(PADDING);

  // Draw pills
  const drawnP1 = pill(text1, startX, startY, true);
  pill(text2, startX + drawnP1 + gap, startY, false);
  // Divider
  const grad = ctx.createLinearGradient(
    headerX,
    0,
    canvas.width - px(PADDING),
    0,
  );
  grad.addColorStop(0, "rgba(34,197,94,0.35)");
  grad.addColorStop(1, "transparent");
  ctx.strokeStyle = grad;
  ctx.lineWidth = s;
  ctx.beginPath();
  ctx.moveTo(headerX, curY);
  ctx.lineTo(canvas.width - px(PADDING), curY);
  ctx.stroke();

  curY += px(16);

  // --- EXERCISE COLUMNS ---
  let bodyBottom: number;
  if (!twoCol) {
    bodyBottom = drawColumn(ctx, entries, headerX, curY, px(colW), s);
  } else {
    const rightX = headerX + px(colW) + px(GAP);
    const leftBottom = drawColumn(
      ctx,
      entries.slice(0, splitAt),
      headerX,
      curY,
      px(colW),
      s,
    );
    const rightBottom = drawColumn(
      ctx,
      entries.slice(splitAt),
      rightX,
      curY,
      px(colW),
      s,
    );
    bodyBottom = Math.max(leftBottom, rightBottom);
  }

  curY = bodyBottom;

  // --- FOOTER ---
  ctx.beginPath();
  ctx.moveTo(headerX, curY);
  ctx.lineTo(canvas.width - px(PADDING), curY);
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = s;
  ctx.stroke();

  curY += px(16);
  ctx.font = `800 ${px(9)}px Poppins, system-ui, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.textAlign = "left";
  ctx.fillText("POWERED BY FITNEX", headerX, curY);

  // Footer dots
  const fdx = canvas.width - px(PADDING);
  [
    [3, 0.4],
    [5, 0.6],
    [7, 1.0],
  ].forEach(([r, a], i) => {
    ctx.beginPath();
    ctx.arc(
      fdx - px(i === 0 ? 13 : i === 1 ? 7 : 0),
      curY + px(5),
      px(r as number) / 2,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = `rgba(34,197,94,${a})`;
    if (a === 1.0) {
      ctx.shadowColor = GREEN;
      ctx.shadowBlur = px(6);
    }
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

// --- MAIN COMPONENT ---

export const WorkoutHistory = () => {
  const navigate = useNavigate();
  const { user_id, athlete } = useAuth();
  const name = athlete?.name || "Athelete";
  // ref kept for the muscle distribution section DOM node (not used in share anymore)
  const muscleAnalysisRef = useRef<HTMLDivElement>(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [logs, setLogs] = useState<WorkoutLogWithExercise[]>([]);
  const [isSharing, setIsSharing] = useState(false);

  const mStart = useMemo(
    () => format(startOfMonth(currentDate), "yyyy-MM-dd"),
    [currentDate],
  );
  const mEnd = useMemo(
    () => format(endOfMonth(currentDate), "yyyy-MM-dd"),
    [currentDate],
  );

  const rawMuscles = useLiveQuery(() => db.muscles.toArray(), []) || [];
  const muscles = useMemo(() => rawMuscles, [rawMuscles]);

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

  useEffect(() => {
    if (user_id) WorkoutService.getWorkoutsInRange(user_id, mStart, mEnd);
  }, [user_id, mStart, mEnd]);

  const monthStats = useLiveQuery(async () => {
    if (!user_id) return null;
    return AnalyticsService.getSmartCustomizedStats(user_id, mStart, mEnd);
  }, [user_id, mStart, mEnd]);

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

  const strengthSummaries = useMemo((): StrengthSummary[] => {
    if (!muscles.length || !logs.length) return [];
    const muscleMap = new Map(muscles.map((m) => [m.id, m.name]));
    const sMap: Record<string, { sets: number; volume: number }> = {};
    logs.forEach((l) => {
      const isCardio = (l.distance || 0) > 0 || (!!l.duration && !l.weight);
      if (!isCardio) {
        const muscleName = muscleMap.get(l.exercise?.category || "") || "Other";
        if (!sMap[muscleName]) sMap[muscleName] = { sets: 0, volume: 0 };
        sMap[muscleName].sets += 1;
        if (l.weight && l.reps) sMap[muscleName].volume += l.weight * l.reps;
      }
    });
    return Object.entries(sMap).map(([k, v]) => ({ category: k, ...v }));
  }, [logs, muscles]);

  const fv = (v: string | number, u?: string) =>
    !v || v === 0 ? "-" : `${v}${u ? ` ${u}` : ""}`;

  const handleShare = async () => {
    if (!user_id) return;
    setIsSharing(true);
    try {
      const dateStr = format(selectedDate, "EEEE, dd MMMM yyyy").toUpperCase();
      const blob = await buildAndShareWorkout(dateStr, groupedLogs, name);
      if (blob && navigator.share) {
        await navigator.share({
          files: [
            new File(
              [blob],
              `${name}-${DateUtils.parseWallClockDate(dateStr)}.png`,
              { type: "image/png" },
            ),
          ],
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <SubPageLayout title="Activity Vault">
      <div className="space-y-8 pb-40 animate-in fade-in duration-500">
        {/* ── MONTH NAVIGATOR ── */}
        <div className="flex justify-between items-center bg-bg-surface border border-border-color p-5 rounded-3xl card-glow">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="w-10 h-10 flex items-center justify-center rounded-2xl
                       border border-border-color/50 text-text-muted
                       active:scale-90 transition-transform"
          >
            <ChevronLeft size={20} />
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
            className="w-10 h-10 flex items-center justify-center rounded-2xl
                       border border-border-color/50 text-text-muted
                       active:scale-90 transition-transform"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* ── CALENDAR GRID ── */}
        <div className="grid grid-cols-7 gap-2 text-center">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <span
              key={d}
              className="text-[9px] font-black uppercase text-text-muted/40 italic"
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
                className={`relative aspect-square rounded-2xl transition-all duration-200
                            flex items-center justify-center text-sm font-black italic
                            ${!isCurrMonth ? "opacity-0 pointer-events-none" : ""}
                            ${
                              isSelected
                                ? "bg-brand-primary scale-110 z-10"
                                : "bg-bg-surface border border-border-color/30 text-text-main"
                            }`}
                style={
                  isSelected
                    ? {
                        color: "var(--color-on-brand)",
                        boxShadow: "0 4px 16px var(--glow-primary)",
                      }
                    : undefined
                }
              >
                {format(day, "d")}
                {workout && (
                  <div
                    className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{
                      backgroundColor: isSelected
                        ? "var(--color-on-brand)"
                        : "var(--brand-primary)",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ── MONTHLY STATS ── */}
        <div className="space-y-4">
          <SectionLabel label="Monthly Stats" />
          <div className="grid grid-cols-3 gap-3">
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
        </div>

        {/* ── WORKOUT DETAILS ── */}
        <div className="space-y-5">
          {/* Header row with action buttons */}
          <div className="flex items-center justify-between">
            <SectionLabel label="Workout Details" />
            <div className="flex gap-2 shrink-0 ml-4">
              {/* Re-perform */}
              <button
                onClick={async () => {
                  if (!user_id) return;
                  const id = await WorkoutService.rePerformWorkout(
                    user_id,
                    logs,
                  );
                  if (id) navigate("/workout/active?mode=live");
                }}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl
                           border border-brand-primary/30 bg-brand-primary/10
                           text-brand-primary font-black text-[10px] uppercase italic
                           tracking-wider active:scale-95 transition-all"
                style={{ boxShadow: "0 0 16px var(--glow-primary)" }}
              >
                <RotateCcw size={16} />
                <span className="hidden sm:inline">Repeat</span>
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                disabled={isSharing}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl
                           bg-brand-primary font-black text-[10px] uppercase italic
                           tracking-wider active:scale-95 transition-all
                           disabled:opacity-50"
                style={{
                  color: "var(--color-on-brand)",
                  boxShadow: "0 4px 16px var(--glow-primary)",
                }}
              >
                <Share2 size={16} />
                <span className="hidden sm:inline">
                  {isSharing ? "Sharing..." : "Share"}
                </span>
              </button>
            </div>
          </div>

          {/* Exercise cards */}
          <div className="space-y-6">
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
              <div className="py-20 flex flex-col items-center justify-center text-text-muted/20">
                <CalendarIcon size={48} strokeWidth={1} />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-4 italic">
                  Rest Day
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── MUSCLE DISTRIBUTION ── */}
        {strengthSummaries.length > 0 && (
          <div ref={muscleAnalysisRef} className="space-y-4 pb-4">
            <SectionLabel label="Muscle Distribution" />
            <div className="bg-bg-surface border border-border-color rounded-3xl overflow-hidden card-glow">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-color/20">
                    <th className="px-5 py-4 text-left text-[9px] font-black uppercase text-text-muted/50 tracking-widest italic">
                      Category
                    </th>
                    <th className="py-4 text-left text-[9px] font-black uppercase text-text-muted/50 tracking-widest italic">
                      Sets
                    </th>
                    <th className="px-5 py-4 text-right text-[9px] font-black uppercase text-text-muted/50 tracking-widest italic">
                      Volume
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color/10">
                  {strengthSummaries.map((s, i) => (
                    <tr
                      key={i}
                      className="h-12 tabular-nums group hover:bg-brand-primary/[0.03] transition-colors"
                    >
                      <td className="px-5 text-sm font-black text-text-main italic">
                        {s.category}
                      </td>
                      <td className="text-sm font-bold text-text-muted/70">
                        {s.sets}
                      </td>
                      <td className="px-5 text-right text-sm font-black text-brand-primary italic">
                        {s.volume.toLocaleString()} kg
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </SubPageLayout>
  );
};

// --- SUB-COMPONENTS ---

const SectionLabel = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-1 shrink-0">
      <div
        className="w-1.5 h-1.5 rounded-full bg-brand-primary"
        style={{ boxShadow: "0 0 6px 1px var(--glow-primary)" }}
      />
      <div className="w-1 h-1 rounded-full bg-brand-primary/30" />
    </div>
    <span className="text-[9.5px] font-black uppercase tracking-[0.35em] text-text-muted/50 italic whitespace-nowrap">
      {label}
    </span>
    <div
      className="h-px flex-1"
      style={{
        background:
          "linear-gradient(to right, var(--border-color) 0%, transparent 100%)",
        opacity: 0.4,
      }}
    />
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
  <div className="bg-bg-surface border border-border-color/50 p-4 rounded-2xl text-center card-glow active:scale-95 transition-transform">
    <div className="text-xl font-black text-text-main italic tabular-nums leading-none mb-1.5">
      {!val || val === 0 ? "—" : Number(val).toLocaleString()}
    </div>
    <div className="text-[8px] font-black uppercase text-text-muted/50 tracking-widest leading-none">
      {label}
      {unit ? ` · ${unit}` : ""}
    </div>
  </div>
);

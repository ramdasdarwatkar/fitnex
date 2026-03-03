import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SubPageLayout } from "../../../components/layout/SubPageLayout";
import {
  BarChart2,
  Edit3,
  Trash2,
  Target,
  Box,
  Layers,
  Repeat,
  Weight,
  Zap,
  Move,
  Timer,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { ExerciseService } from "../../../services/ExerciseService";

// --- TYPES ---

interface MuscleLink {
  id: string;
  name: string;
  role: "primary" | "secondary" | "stabilizer";
}

interface ExerciseDetailData {
  id: string;
  name: string;
  status: boolean;
  categoryName: string;
  equipmentName: string;
  reps: boolean;
  weight: boolean;
  bodyweight: boolean;
  distance: boolean;
  duration: boolean;
  muscles: MuscleLink[];
}

interface MetricConfig {
  id: keyof ExerciseDetailData;
  icon: LucideIcon;
  label: string;
}

// Drives muscle role colors throughout — single source of truth
const ROLE_TOKENS = {
  primary: { color: "var(--brand-primary)", label: "Primary" },
  secondary: { color: "var(--brand-secondary)", label: "Secondary" },
  stabilizer: { color: "var(--brand-streak)", label: "Stabilizer" },
} as const;

type MuscleRole = keyof typeof ROLE_TOKENS;

// --- CONFIRM MODAL ---

const ConfirmModal = ({
  isOpen,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-bg-main/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onCancel}
      />
      <div
        className="relative w-full max-w-xs bg-bg-surface border border-border-color/40
                   rounded-2xl p-8 card-glow animate-in zoom-in-95 duration-200"
      >
        {/* Danger icon */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 mx-auto"
          style={{
            background: "var(--danger-bg)",
            border: "1px solid var(--danger-border)",
            color: "var(--brand-danger)",
          }}
        >
          <AlertCircle size={22} />
        </div>

        <h3 className="text-lg font-black uppercase italic text-text-main mb-2 text-center tracking-tight">
          Archive Entry?
        </h3>
        <p className="text-[11px] font-medium italic text-text-muted/60 leading-relaxed mb-8 text-center px-2">
          This will hide the entry from your active library. All past
          performance data remains protected.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full py-4 rounded-2xl font-black uppercase italic text-[10px]
                       tracking-[0.2em] active:scale-95 transition-all"
            style={{
              background: "var(--brand-danger)",
              color: "var(--color-on-brand)",
              boxShadow: "0 4px 16px var(--danger-border)",
            }}
          >
            Archive Entry
          </button>
          <button
            onClick={onCancel}
            className="w-full py-2 text-text-muted/50 font-black uppercase italic
                       text-[9px] tracking-[0.2em] hover:text-text-main transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

export const ExerciseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ExerciseDetailData | null>(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  useEffect(() => {
    if (id) {
      ExerciseService.getExerciseById(id).then((res) => {
        if (res) setData(res as ExerciseDetailData);
      });
    }
  }, [id]);

  const handleArchive = async () => {
    if (!id) return;
    try {
      await ExerciseService.archiveExercise(id);
      navigate("/library");
    } catch (err) {
      console.error("Archive failed", err);
    }
  };

  const metrics: MetricConfig[] = useMemo(
    () => [
      { id: "reps", icon: Repeat, label: "Reps" },
      { id: "weight", icon: Weight, label: "Weight" },
      { id: "bodyweight", icon: Zap, label: "Body" },
      { id: "distance", icon: Move, label: "Dist" },
      { id: "duration", icon: Timer, label: "Time" },
    ],
    [],
  );

  if (!data) return null;

  return (
    <SubPageLayout title="Exercise Identity">
      <div className="flex flex-col gap-8 pt-2 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* ── HEADER ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{
                background: data.status
                  ? "var(--brand-primary)"
                  : "var(--text-muted)",
                boxShadow: data.status ? "0 0 6px var(--glow-primary)" : "none",
              }}
            />
            <span className="text-[10px] font-black uppercase italic tracking-[0.3em] text-text-muted/60">
              {data.status ? "Live Library Entry" : "Archived Record"}
            </span>
          </div>
          <h1 className="text-4xl font-black italic text-text-main tracking-tighter leading-tight uppercase">
            {data.name}
          </h1>
        </div>

        {/* ── TRACKED METRICS ── */}
        <div className="space-y-3">
          <p className="text-[9.5px] font-black uppercase italic text-text-muted/50 tracking-[0.25em]">
            Tracked Telemetry
          </p>
          <div className="flex flex-wrap gap-2">
            {metrics.map((m) => {
              const isActive = data[m.id] === true;
              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border
                              transition-all duration-200
                              ${
                                isActive
                                  ? "bg-brand-primary/10 border-brand-primary/40 text-brand-primary"
                                  : "bg-bg-surface border-border-color/20 text-text-muted/20"
                              }`}
                  style={
                    isActive
                      ? { boxShadow: "0 0 12px var(--glow-primary)" }
                      : undefined
                  }
                >
                  <m.icon size={13} strokeWidth={isActive ? 3 : 2} />
                  <span className="text-[10px] font-black uppercase italic tracking-widest">
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── INFO GRID ── */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Layers, label: "Category", value: data.categoryName },
            { icon: Box, label: "Equipment", value: data.equipmentName },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="bg-bg-surface px-5 py-4 rounded-2xl border border-border-color/40 card-glow space-y-2"
            >
              <span
                className="text-[9px] font-black uppercase italic text-brand-primary/60
                               tracking-widest flex items-center gap-1.5"
              >
                <Icon size={11} /> {label}
              </span>
              <p className="text-[15px] font-black italic text-text-main tracking-tight uppercase">
                {value || "—"}
              </p>
            </div>
          ))}
        </div>

        {/* ── BIOMECHANICS ── */}
        <div className="bg-bg-surface border border-border-color/40 rounded-2xl p-6 space-y-6 card-glow">
          <div
            className="flex items-center gap-2.5 text-[9.5px] font-black uppercase italic
                          tracking-[0.3em] text-text-muted/50"
          >
            <Target size={14} className="text-brand-primary/70" />
            Biomechanics Profile
          </div>

          <div className="space-y-6">
            {(Object.keys(ROLE_TOKENS) as MuscleRole[]).map((role) => {
              const list = data.muscles.filter((m) => m.role === role);
              if (list.length === 0) return null;
              const { color, label } = ROLE_TOKENS[role];
              return (
                <div key={role} className="space-y-2.5">
                  <div
                    className="text-[9px] font-black uppercase italic tracking-widest flex items-center gap-2"
                    style={{ color }}
                  >
                    <div className="w-1 h-1 rounded-full bg-current" />
                    {label} Focus
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {list.map((m) => (
                      <span
                        key={m.id}
                        className="px-3 py-1.5 bg-bg-main rounded-xl text-[10px] font-black
                                   uppercase italic text-text-main border border-border-color/40
                                   tracking-wider card-glow"
                      >
                        {m.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── ACTIONS ── */}
        <div className="flex flex-col gap-3">
          {/* Primary CTA */}
          <button
            onClick={() => navigate(`/progress/exercise/${id}`)}
            className="w-full py-5 bg-brand-primary rounded-2xl font-black uppercase italic
                       text-[11px] tracking-[0.3em] flex items-center justify-center gap-3
                       active:scale-[0.98] transition-all"
            style={{
              color: "var(--color-on-brand)",
              boxShadow: "0 4px 24px var(--glow-primary)",
            }}
          >
            <BarChart2 size={20} /> Analytics
          </button>

          <div className="grid grid-cols-2 gap-3">
            {/* Edit */}
            <button
              onClick={() => navigate(`/library/exercises/edit/${id}`)}
              className="py-4 bg-bg-surface border border-border-color/40 rounded-2xl
                         font-black uppercase italic text-[10px] tracking-[0.2em]
                         text-text-main flex items-center justify-center gap-2.5
                         active:scale-[0.98] transition-all card-glow
                         hover:border-brand-primary/30"
            >
              <Edit3 size={17} /> Modify
            </button>

            {/* Archive */}
            <button
              onClick={() => setShowArchiveModal(true)}
              className="py-4 bg-bg-surface rounded-2xl font-black uppercase italic
                         text-[10px] tracking-[0.2em] flex items-center justify-center gap-2.5
                         active:scale-[0.98] transition-all card-glow"
              style={{
                color: "var(--brand-danger)",
                border: "1px solid var(--danger-border)",
              }}
            >
              <Trash2 size={17} /> Archive
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showArchiveModal}
        onConfirm={handleArchive}
        onCancel={() => setShowArchiveModal(false)}
      />
    </SubPageLayout>
  );
};

import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SubPageLayout } from "../../../components/layout/SubPageLayout";
import { LibraryService } from "../../../services/LibraryService";
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

// --- 1. STRICT INTERFACES ---

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

// --- 2. COMPONENTS ---

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
    <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-bg-main/90 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm bg-bg-surface border border-border-color rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-3xl bg-brand-error/10 flex items-center justify-center text-brand-error mb-8 mx-auto">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-black uppercase italic text-text-main mb-3 tracking-tighter text-center leading-none">
          Archive Exercise?
        </h3>
        <p className="text-xs font-bold text-text-muted leading-relaxed mb-10 text-center px-2 opacity-60">
          This will hide the entry from your active library. All past
          performance data remains protected.
        </p>
        <div className="flex flex-col gap-4">
          <button
            onClick={onConfirm}
            className="w-full py-6 bg-brand-error text-white rounded-2xl font-black uppercase italic tracking-widest active:scale-95 shadow-xl shadow-brand-error/20 transition-all"
          >
            Archive Entry
          </button>
          <button
            onClick={onCancel}
            className="w-full py-2 text-text-muted font-black uppercase italic text-[10px] tracking-widest hover:text-text-main transition-colors"
          >
            Cancel Action
          </button>
        </div>
      </div>
    </div>
  );
};

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
      await LibraryService.archiveExercise(id);
      navigate("/library");
    } catch (err) {
      console.error("Archive failed", err);
    }
  };

  const metrics: MetricConfig[] = useMemo(
    () => [
      { id: "reps", icon: Repeat, label: "Reps" },
      { id: "weight", icon: Weight, label: "Weight" },
      { id: "bodyweight", icon: Zap, label: "Bodyweight" },
      { id: "distance", icon: Move, label: "Distance" },
      { id: "duration", icon: Timer, label: "Duration" },
    ],
    [],
  );

  if (!data) return null;

  return (
    <SubPageLayout title="Exercise Details">
      <div className="flex flex-col gap-10 pb-40 px-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* 1. TYPOGRAPHY HEADER */}
        <div className="space-y-5 pt-6">
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`w-2 h-2 rounded-full ${data.status ? "bg-brand-success" : "bg-brand-primary"}`}
            />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted italic opacity-60">
              {data.status ? "Active Library" : "Archived Entry"}
            </span>
          </div>
          <h1 className="text-6xl font-black uppercase italic tracking-tighter leading-[0.8] text-text-main">
            {data.name}
          </h1>
        </div>

        {/* 2. METRICS TRACKING GRID */}
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase text-text-muted ml-4 tracking-[0.3em] opacity-40 italic">
            Telemetry Tracked
          </label>
          <div className="grid grid-cols-5 gap-3">
            {metrics.map((m) => {
              const isActive = data[m.id] === true;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col items-center justify-center aspect-square rounded-3xl border transition-all gap-2.5 
                    ${
                      isActive
                        ? "bg-brand-primary border-transparent text-bg-main shadow-xl shadow-brand-primary/20 scale-105 z-10"
                        : "bg-bg-surface border-border-color/30 text-text-muted opacity-40"
                    }`}
                >
                  <m.icon size={20} strokeWidth={isActive ? 3 : 2} />
                  <span className="text-[8px] font-black uppercase tracking-tighter">
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. INFO CARDS */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-bg-surface p-7 rounded-[2.5rem] border border-border-color shadow-sm flex flex-col gap-2">
            <span className="text-[9px] font-black uppercase text-text-muted tracking-[0.2em] flex items-center gap-2 italic">
              <Layers size={12} className="text-brand-primary" /> Category
            </span>
            <p className="text-sm font-black uppercase italic text-text-main truncate">
              {data.categoryName}
            </p>
          </div>
          <div className="bg-bg-surface p-7 rounded-[2.5rem] border border-border-color shadow-sm flex flex-col gap-2">
            <span className="text-[9px] font-black uppercase text-text-muted tracking-[0.2em] flex items-center gap-2 italic">
              <Box size={12} className="text-brand-primary" /> Equipment
            </span>
            <p className="text-sm font-black uppercase italic text-text-main truncate">
              {data.equipmentName}
            </p>
          </div>
        </div>

        {/* 4. MUSCLE INFLUENCE */}
        <div className="bg-bg-surface border border-border-color p-10 rounded-[3rem] space-y-10 shadow-xl">
          <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-text-muted italic">
            <Target size={16} className="text-brand-primary" />
            Biomechanics
          </div>

          <div className="space-y-10">
            {["primary", "secondary", "stabilizer"].map((role) => {
              const list = data.muscles.filter((m) => m.role === role);
              if (list.length === 0) return null;

              const roleColor =
                role === "primary"
                  ? "text-brand-primary"
                  : role === "secondary"
                    ? "text-brand-info"
                    : "text-brand-success";

              return (
                <div key={role} className="space-y-4">
                  {/* FIXED: Changed <p> to <div> to resolve hydration error */}
                  <div
                    className={`text-[10px] font-black uppercase tracking-widest italic flex items-center gap-2 ${roleColor}`}
                  >
                    <div className={`w-1 h-1 rounded-full bg-current`} />
                    {role} Focus
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {list.map((m) => (
                      <span
                        key={m.id}
                        className="px-6 py-3 bg-bg-main rounded-2xl text-[12px] font-black uppercase italic text-text-main border border-border-color/50 shadow-inner"
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

        {/* 5. PRODUCTION ACTIONS */}
        <div className="flex flex-col gap-4 mt-6">
          <button
            onClick={() => navigate(`/progress/exercise/${id}`)}
            className="w-full py-7 bg-brand-primary text-bg-main rounded-[2.5rem] font-black uppercase italic text-sm flex items-center justify-center gap-4 shadow-2xl active:scale-[0.97] transition-all"
          >
            <BarChart2 size={24} strokeWidth={3} /> Telemetry Analytics
          </button>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate(`/library/exercises/edit/${id}`)}
              className="py-6 bg-text-main text-bg-main rounded-[2.5rem] font-black uppercase italic text-[11px] flex items-center justify-center gap-3 active:scale-[0.97] transition-all shadow-xl"
            >
              <Edit3 size={18} /> Modify
            </button>
            <button
              onClick={() => setShowArchiveModal(true)}
              className="py-6 bg-brand-error/10 text-brand-error rounded-[2.5rem] font-black uppercase italic text-[11px] border border-brand-error/20 active:scale-[0.97] transition-all flex items-center justify-center gap-3"
            >
              <Trash2 size={18} /> Archive
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

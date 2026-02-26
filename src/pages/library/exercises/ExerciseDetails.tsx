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
        className="absolute inset-0 bg-bg-main/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-xs bg-bg-surface border border-border-color rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-xl bg-brand-error/10 flex items-center justify-center text-brand-error mb-6 mx-auto">
          <AlertCircle size={24} />
        </div>
        <h3 className="text-lg font-bold text-text-main mb-2 text-center">
          Archive Exercise?
        </h3>
        <p className="text-xs text-text-muted leading-relaxed mb-8 text-center px-2">
          This will hide the entry from your active library. All past
          performance data remains protected.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full py-3 bg-brand-error text-white rounded-xl font-bold uppercase text-xs tracking-widest active:scale-95 transition-all"
          >
            Archive Entry
          </button>
          <button
            onClick={onCancel}
            className="w-full py-2 text-text-muted font-bold uppercase text-[10px] tracking-widest hover:text-text-main transition-colors"
          >
            Cancel
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
    <SubPageLayout title="Details">
      <div className="flex flex-col gap-8 pb-40 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* HEADER SECTION */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full ${data.status ? "bg-brand-success" : "bg-text-muted"}`}
            />
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
              {data.status ? "Active Library" : "Archived"}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-text-main tracking-tight leading-tight">
            {data.name}
          </h1>
        </div>

        {/* METRICS TRACKING */}
        <div className="space-y-3">
          <label className="text-[11px] font-bold uppercase text-text-muted ml-1 tracking-wider">
            Tracked Metrics
          </label>
          <div className="flex flex-wrap gap-2">
            {metrics.map((m) => {
              const isActive = data[m.id] === true;
              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all 
                    ${
                      isActive
                        ? "bg-brand-primary border-brand-primary text-bg-main shadow-md"
                        : "bg-bg-surface border-border-color opacity-30"
                    }`}
                >
                  <m.icon size={14} strokeWidth={isActive ? 3 : 2} />
                  <span className="text-[10px] font-bold uppercase tracking-wide">
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* INFO GRID */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bg-surface p-5 rounded-xl border border-border-color shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase text-text-muted tracking-wider flex items-center gap-2">
              <Layers size={12} className="text-brand-primary" /> Category
            </span>
            <p className="text-sm font-semibold text-text-main">
              {data.categoryName}
            </p>
          </div>
          <div className="bg-bg-surface p-5 rounded-xl border border-border-color shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase text-text-muted tracking-wider flex items-center gap-2">
              <Box size={12} className="text-brand-primary" /> Equipment
            </span>
            <p className="text-sm font-semibold text-text-main">
              {data.equipmentName}
            </p>
          </div>
        </div>

        {/* MUSCLE INFLUENCE */}
        <div className="bg-bg-surface border border-border-color p-6 rounded-2xl space-y-6 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-text-muted">
            <Target size={16} className="text-brand-primary" />
            Biomechanics
          </div>

          <div className="space-y-6">
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
                <div key={role} className="space-y-3">
                  <div
                    className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${roleColor}`}
                  >
                    {role} Focus
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {list.map((m) => (
                      <span
                        key={m.id}
                        className="px-3 py-1.5 bg-bg-main rounded-lg text-xs font-semibold text-text-main border border-border-color"
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

        {/* ACTIONS */}
        <div className="flex flex-col gap-3 mt-4">
          <button
            onClick={() => navigate(`/progress/exercise/${id}`)}
            className="w-full py-4 bg-brand-primary text-bg-main rounded-xl font-bold uppercase text-xs flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] transition-all"
          >
            <BarChart2 size={18} /> View Analytics
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate(`/library/exercises/edit/${id}`)}
              className="py-3.5 bg-text-main text-bg-main rounded-xl font-bold uppercase text-[10px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <Edit3 size={16} /> Edit
            </button>
            <button
              onClick={() => setShowArchiveModal(true)}
              className="py-3.5 bg-bg-surface text-brand-error rounded-xl font-bold uppercase text-[10px] border border-border-color active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={16} /> Archive
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

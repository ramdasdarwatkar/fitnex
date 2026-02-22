import { useEffect, useState } from "react";
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
  ChevronLeft,
} from "lucide-react";

/**
 * TRENDY CONFIRM MODAL
 * Used for high-stakes actions like Archiving.
 */
const ConfirmModal = ({ isOpen, onConfirm, onCancel }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-6 mx-auto">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-black uppercase italic text-black dark:text-white mb-2 tracking-tight text-center">
          Archive Exercise?
        </h3>
        <p className="text-sm font-bold text-slate-500 leading-relaxed mb-8 text-center px-4">
          This will hide the exercise from your active library. All past workout
          data and history will be preserved.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full py-5 bg-red-500 text-white rounded-2xl font-black uppercase italic tracking-widest active:scale-95 shadow-lg shadow-red-500/20 transition-all"
          >
            Archive Now
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 text-slate-400 font-black uppercase italic text-[10px] tracking-widest hover:text-black dark:hover:text-white transition-colors"
          >
            Cancel Action
          </button>
        </div>
      </div>
    </div>
  );
};

export const ExerciseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  useEffect(() => {
    if (id) {
      LibraryService.getExerciseDetails(id).then((res) => {
        if (res) setData(res);
      });
    }
  }, [id]);

  if (!data) return null;

  const handleArchive = async () => {
    try {
      await LibraryService.archiveExercise(id!);
      navigate("/library");
    } catch (err) {
      console.error("Archive failed", err);
    }
  };

  // Metric Mapping Configuration
  const metrics = [
    { id: "reps", icon: Repeat, label: "Reps" },
    { id: "weight", icon: Weight, label: "Weight" },
    { id: "bodyweight", icon: Zap, label: "Bodyweight" },
    { id: "distance", icon: Move, label: "Distance" },
    { id: "duration", icon: Timer, label: "Duration" },
  ];

  return (
    <SubPageLayout title="Exercise Details">
      <div className="flex flex-col gap-8 pb-32 px-1">
        {/* 1. TYPOGRAPHY HEADER */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2 mb-1">
            <div
              className={`w-2 h-2 rounded-full ${data.status ? "bg-green-500" : "bg-orange-500"}`}
            />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">
              {data.status ? "Active Library" : "Archived Entry"}
            </span>
          </div>
          <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-[0.85] text-black dark:text-white">
            {data.name}
          </h1>
        </div>

        {/* 2. METRICS TRACKING GRID (Data-Driven Selection) */}
        <div className="space-y-3">
          <label className="text-[9px] font-black uppercase text-slate-400 ml-2 tracking-widest">
            Tracked Metrics
          </label>
          <div className="grid grid-cols-5 gap-2">
            {metrics.map((m) => {
              // Validates against DB values (supports both boolean and 1/0)
              const isActive = data[m.id] === 1 || data[m.id] === true;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col items-center justify-center py-5 rounded-[1.5rem] border transition-all gap-2 
                    ${
                      isActive
                        ? "bg-[var(--brand-primary)] border-transparent text-black shadow-lg shadow-[var(--brand-primary)]/20"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-700"
                    }`}
                >
                  <m.icon size={18} strokeWidth={isActive ? 3 : 2} />
                  <span className="text-[7px] font-black uppercase tracking-tight">
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. INFO CARDS */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col gap-1 shadow-sm">
            <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
              <Layers size={10} /> Category
            </span>
            <p className="text-sm font-black uppercase italic text-black dark:text-white truncate">
              {data.categoryName}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col gap-1 shadow-sm">
            <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
              <Box size={10} /> Equipment
            </span>
            <p className="text-sm font-black uppercase italic text-black dark:text-white truncate">
              {data.equipmentName}
            </p>
          </div>
        </div>

        {/* 4. MUSCLE INFLUENCE */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[3rem] space-y-8 shadow-sm">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">
            <Target size={14} className="text-[var(--brand-primary)]" /> Muscle
            Mapping
          </div>

          {["primary", "secondary", "stabilizer"].map((role) => {
            const list = data.muscles.filter((m: any) => m.role === role);
            if (list.length === 0) return null;
            return (
              <div key={role} className="space-y-3">
                <p
                  className={`text-[9px] font-black uppercase tracking-widest italic ${
                    role === "primary"
                      ? "text-orange-500"
                      : role === "secondary"
                        ? "text-blue-500"
                        : "text-emerald-500"
                  }`}
                >
                  {role}
                </p>
                <div className="flex flex-wrap gap-2">
                  {list.map((m: any) => (
                    <span
                      key={m.id}
                      className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-[11px] font-black uppercase italic text-black dark:text-white border border-slate-100 dark:border-slate-700/50"
                    >
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* 5. PRODUCTION ACTIONS */}
        <div className="flex flex-col gap-3 mt-4">
          <button
            onClick={() => navigate(`/progress/exercise/${id}`)}
            className="w-full py-6 bg-[var(--brand-primary)] text-black rounded-[2rem] font-black uppercase italic text-xs flex items-center justify-center gap-3 shadow-2xl active:scale-[0.98] transition-all"
          >
            <BarChart2 size={20} strokeWidth={3} /> See Progress Analytics
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate(`/library/exercises/edit/${id}`)}
              className="py-5 bg-black dark:bg-white text-white dark:text-black rounded-[2rem] font-black uppercase italic text-[10px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg"
            >
              <Edit3 size={16} /> Edit Details
            </button>
            <button
              onClick={() => setShowArchiveModal(true)}
              className="py-5 bg-red-500/10 text-red-500 rounded-[2rem] font-black uppercase italic text-[10px] border border-red-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={16} /> Archive
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRMATION OVERLAY */}
      <ConfirmModal
        isOpen={showArchiveModal}
        onConfirm={handleArchive}
        onCancel={() => setShowArchiveModal(false)}
      />
    </SubPageLayout>
  );
};

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SubPageLayout } from "../../../components/layout/SubPageLayout";
import { LibraryService } from "../../../services/LibraryService";
import {
  Search,
  Globe,
  Lock,
  Check,
  Weight,
  Repeat,
  Move,
  Timer,
  Zap,
  Box,
  ChevronDown,
  Minus,
  Trash2,
  Target,
  AlertCircle,
} from "lucide-react";

type MuscleRole = "primary" | "secondary" | "stabilizer";

// TRENDY CONFIRM MODAL COMPONENT
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-6 mx-auto">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-black uppercase italic text-[var(--text-main)] mb-2 tracking-tight text-center">
          Archive Exercise?
        </h3>
        <p className="text-sm font-bold text-[var(--text-muted)] leading-relaxed mb-8 text-center px-4">
          This will hide the exercise from your library. Past workout data will
          be preserved.
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
            className="w-full py-3 text-[var(--text-muted)] font-black uppercase italic text-[10px] tracking-widest hover:text-[var(--text-main)] transition-colors"
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

  const [loading, setLoading] = useState(true);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [data, setData] = useState<{ muscles: any[]; equipment: any[] }>({
    muscles: [],
    equipment: [],
  });
  const [muscleSearch, setMuscleSearch] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [equipmentId, setEquipmentId] = useState("");
  const [selectedMuscles, setSelectedMuscles] = useState<
    { id: string; name: string; role: MuscleRole }[]
  >([]);
  const [metrics, setMetrics] = useState({
    reps: true,
    weight: true,
    bodyweight: false,
    distance: false,
    duration: false,
  });

  useEffect(() => {
    const init = async () => {
      if (!id) return;
      const [details, muscles, equipment] = await Promise.all([
        LibraryService.getExerciseDetail(id),
        LibraryService.getActiveMuscles(),
        LibraryService.getAllEquipment(),
      ]);

      if (details) {
        setName(details.name);
        setIsPublic(details.is_public);
        setEquipmentId(details.equipmentId);
        setSelectedMuscles(details.muscles);
        setMetrics({
          reps: details.reps,
          weight: details.weight,
          bodyweight: details.bodyweight,
          distance: details.distance,
          duration: details.duration,
        });
      }
      setData({ muscles, equipment });
      setLoading(false);
    };
    init();
  }, [id]);

  const toggleMuscle = (muscle: any, role: MuscleRole) => {
    setSelectedMuscles((prev) => {
      const exists = prev.find((m) => m.id === muscle.id);
      if (exists && exists.role === role)
        return prev.filter((m) => m.id !== muscle.id);
      if (exists)
        return prev.map((m) => (m.id === muscle.id ? { ...m, role } : m));
      return [...prev, { id: muscle.id, name: muscle.name, role }];
    });
    setMuscleSearch("");
  };

  const onUpdate = async () => {
    try {
      const payload = {
        name,
        ...metrics,
        is_public: isPublic,
        updated_at: new Date().toISOString(),
      };
      await LibraryService.updateExercise(
        id!,
        payload,
        selectedMuscles,
        equipmentId || null,
      );
      navigate(-1);
    } catch (err) {
      alert("Update failed.");
    }
  };

  const onArchive = async () => {
    try {
      await LibraryService.archiveExercise(id!);
      navigate(-1);
    } catch (err) {
      alert("Archive failed.");
    }
  };

  if (loading) return null;

  return (
    <SubPageLayout title="Edit Exercise">
      <div className="flex flex-col gap-6 pb-24">
        {/* 1. NAME & PRIVACY */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-6 rounded-[2.2rem] space-y-6 shadow-sm">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent text-2xl font-black italic text-[var(--text-main)] outline-none uppercase tracking-tighter"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setIsPublic(false)}
              className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${!isPublic ? "bg-[var(--text-main)] text-[var(--bg-main)]" : "text-[var(--text-muted)] border-[var(--border-color)]"}`}
            >
              <Lock size={12} /> Private
            </button>
            <button
              onClick={() => setIsPublic(true)}
              className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${isPublic ? "bg-[var(--brand-primary)] text-[var(--bg-main)] shadow-lg shadow-[var(--brand-primary)]/20" : "text-[var(--text-muted)] border-[var(--border-color)]"}`}
            >
              <Globe size={12} /> Public
            </button>
          </div>
        </div>

        {/* 2. METRICS */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { id: "reps", icon: <Repeat size={16} /> },
            { id: "weight", icon: <Weight size={16} /> },
            { id: "bodyweight", icon: <Zap size={16} /> },
            { id: "distance", icon: <Move size={16} /> },
            { id: "duration", icon: <Timer size={16} /> },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() =>
                setMetrics({
                  ...metrics,
                  [m.id as keyof typeof metrics]:
                    !metrics[m.id as keyof typeof metrics],
                })
              }
              className={`flex flex-col items-center justify-center py-5 rounded-[1.4rem] border-2 transition-all gap-2 ${metrics[m.id as keyof typeof metrics] ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/5 text-[var(--brand-primary)]" : "border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-muted)]"}`}
            >
              {m.icon}
              <span className="text-[7px] font-black uppercase">{m.id}</span>
            </button>
          ))}
        </div>

        {/* 3. EQUIPMENT */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-6 rounded-[2.2rem] space-y-4">
          <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
            <Box size={12} /> Equipment
          </label>
          <div className="relative">
            <select
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl py-4.5 px-5 text-xs font-black uppercase italic text-[var(--text-main)] outline-none appearance-none transition-all focus:border-[var(--brand-primary)]"
            >
              <option value="">— NO EQUIPMENT —</option>
              <option value="bodyweight_id">BODYWEIGHT ONLY</option>
              {data.equipment.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
            />
          </div>
        </div>

        {/* 4. MUSCLE SELECTOR */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-6 rounded-[2.2rem] space-y-5">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] flex items-center gap-2">
            <Target size={12} /> Target Muscles
          </p>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              type="text"
              value={muscleSearch}
              onChange={(e) => setMuscleSearch(e.target.value)}
              placeholder="SEARCH..."
              className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl py-4 pl-12 text-xs font-bold outline-none focus:border-[var(--brand-primary)] transition-all"
            />
            {muscleSearch && (
              <div className="absolute top-[110%] left-0 w-full bg-[var(--bg-surface)] border-2 border-[var(--border-color)] rounded-[2rem] shadow-2xl z-50 overflow-hidden max-h-72 overflow-y-auto backdrop-blur-xl">
                {data.muscles
                  .filter((m) =>
                    m.name.toLowerCase().includes(muscleSearch.toLowerCase()),
                  )
                  .map((m) => (
                    <div
                      key={m.id}
                      className="p-5 border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-main)] space-y-4"
                    >
                      <span className="text-[12px] font-black uppercase italic text-[var(--text-main)] block tracking-tight">
                        {m.name}
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => toggleMuscle(m, "primary")}
                          className="py-3 rounded-xl text-[8px] font-black uppercase bg-orange-500/10 text-orange-500 border border-orange-500/20 active:scale-90 transition-all"
                        >
                          Primary
                        </button>
                        <button
                          onClick={() => toggleMuscle(m, "secondary")}
                          className="py-3 rounded-xl text-[8px] font-black uppercase bg-blue-500/10 text-blue-500 border border-blue-500/20 active:scale-90 transition-all"
                        >
                          Secondary
                        </button>
                        <button
                          onClick={() => toggleMuscle(m, "stabilizer")}
                          className="py-3 rounded-xl text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 active:scale-90 transition-all"
                        >
                          Stabilizer
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            {selectedMuscles.map((sm) => (
              <div
                key={sm.id}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${sm.role === "primary" ? "border-orange-500/20 bg-orange-500/[0.03]" : sm.role === "secondary" ? "border-blue-500/20 bg-blue-500/[0.03]" : "border-emerald-500/20 bg-emerald-500/[0.03]"}`}
              >
                <div className="flex flex-col">
                  <span className="text-[11px] font-black uppercase italic text-[var(--text-main)]">
                    {sm.name}
                  </span>
                  <span
                    className={`text-[8px] font-black uppercase tracking-[0.2em] mt-0.5 opacity-60 ${sm.role === "primary" ? "text-orange-500" : sm.role === "secondary" ? "text-blue-500" : "text-emerald-500"}`}
                  >
                    {sm.role}
                  </span>
                </div>
                <button
                  onClick={() =>
                    setSelectedMuscles((prev) =>
                      prev.filter((x) => x.id !== sm.id),
                    )
                  }
                  className="w-8 h-8 rounded-full bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 active:scale-90 transition-all"
                >
                  <Minus size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 5. ACTIONS */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onUpdate}
            className="w-full py-5 bg-[var(--brand-primary)] text-[var(--bg-main)] font-black uppercase italic rounded-3xl shadow-lg flex items-center justify-center gap-3 tracking-widest active:scale-95 transition-all shadow-xl shadow-[var(--brand-primary)]/20"
          >
            <Check size={20} strokeWidth={4} /> UPDATE EXERCISE
          </button>
          <button
            onClick={() => setShowArchiveModal(true)}
            className="w-full py-5 bg-red-500/10 text-red-500 font-black uppercase italic rounded-3xl flex items-center justify-center gap-3 tracking-widest active:scale-95 transition-all border border-red-500/20"
          >
            <Trash2 size={20} /> ARCHIVE
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showArchiveModal}
        onConfirm={onArchive}
        onCancel={() => setShowArchiveModal(false)}
      />
    </SubPageLayout>
  );
};

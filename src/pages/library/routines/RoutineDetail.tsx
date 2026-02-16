import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SubPageLayout } from "../../../components/layout/SubPageLayout";
import {
  LibraryService,
  type EnrichedExercise,
} from "../../../services/LibraryService";
import {
  Search,
  Check,
  Plus,
  Minus,
  MoveVertical,
  Trash2,
  AlertCircle,
  Lock,
  Globe,
} from "lucide-react";

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
          Archive Routine?
        </h3>
        <p className="text-sm font-bold text-[var(--text-muted)] leading-relaxed mb-8 text-center px-4">
          This template will be hidden. Existing workout logs using this routine
          will not be affected.
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
            className="w-full py-3 text-[var(--text-muted)] font-black uppercase italic text-[10px] tracking-widest"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export const RoutineDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [search, setSearch] = useState("");
  const [library, setLibrary] = useState<EnrichedExercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      if (!id) return;
      const [details, fullLibrary] = await Promise.all([
        LibraryService.getRoutineDetail(id),
        LibraryService.getExercisesWithMeta(),
      ]);

      if (details) {
        setName(details.name);
        setDescription(details.description || "");
        setIsPublic(details.is_public);
        setSelectedExercises(details.exercises);
      }
      setLibrary(fullLibrary);
      setLoading(false);
    };
    init();
  }, [id]);

  const muscleFocus = useMemo(() => {
    const counts: Record<string, number> = {};
    selectedExercises.forEach((ex) => {
      const baseEx = library.find(
        (l) => l.id === ex.exercise_id || l.id === ex.id,
      );
      baseEx?.all_muscles
        ?.filter((m) => m.role === "primary")
        .forEach((m) => {
          counts[m.name] = (counts[m.name] || 0) + 1;
        });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [selectedExercises, library]);

  const addExercise = (ex: EnrichedExercise) => {
    setSelectedExercises([
      ...selectedExercises,
      { ...ex, exercise_id: ex.id, target_sets: 3, target_reps: 10 },
    ]);
    setSearch("");
  };

  const updateTarget = (index: number, field: string, val: number) => {
    setSelectedExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, [field]: val } : ex)),
    );
  };

  const onUpdate = async () => {
    try {
      await LibraryService.updateRoutine(
        id!,
        {
          name,
          description,
          is_public: isPublic,
          updated_at: new Date().toISOString(),
        },
        selectedExercises,
      );
      navigate(-1);
    } catch (err) {
      alert("Update failed.");
    }
  };

  if (loading) return null;

  return (
    <SubPageLayout title="Edit Routine">
      <div className="flex flex-col gap-6 pb-32">
        {/* 1. NAME, DESCRIPTION & PRIVACY */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-6 rounded-[2.2rem] space-y-6">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent text-2xl font-black italic text-[var(--text-main)] outline-none uppercase tracking-tighter"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="ROUTINE DESCRIPTION"
            className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl p-4 text-xs font-bold text-[var(--text-main)] outline-none resize-none h-24 placeholder:opacity-30"
          />

          <div className="flex gap-2">
            <button
              onClick={() => setIsPublic(false)}
              className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${!isPublic ? "bg-[var(--text-main)] text-[var(--bg-main)] border-[var(--text-main)]" : "border-[var(--border-color)] text-[var(--text-muted)]"}`}
            >
              <Lock size={12} /> Private
            </button>
            <button
              onClick={() => setIsPublic(true)}
              className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${isPublic ? "bg-[var(--brand-primary)] text-[var(--bg-main)] shadow-lg shadow-[var(--brand-primary)]/20" : "border-[var(--border-color)] text-[var(--text-muted)]"}`}
            >
              <Globe size={12} /> Public
            </button>
          </div>

          <div className="flex gap-2">
            {muscleFocus.map(([mName]) => (
              <span
                key={mName}
                className="text-[8px] font-black uppercase px-3 py-1.5 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] rounded-full"
              >
                {mName}
              </span>
            ))}
          </div>
        </div>

        {/* 2. SEARCH & LIST */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ADD TO ROUTINE..."
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl py-5 pl-14 text-xs font-black uppercase italic outline-none"
          />
          {search && (
            <div className="absolute top-[110%] left-0 w-full bg-[var(--bg-surface)] border-2 border-[var(--border-color)] rounded-[2rem] shadow-2xl z-50 max-h-64 overflow-y-auto backdrop-blur-xl">
              {library
                .filter((ex) =>
                  ex.name.toLowerCase().includes(search.toLowerCase()),
                )
                .map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => addExercise(ex)}
                    className="w-full p-5 text-left border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-main)] font-black uppercase italic text-xs"
                  >
                    {ex.name}
                  </button>
                ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {selectedExercises.map((ex, idx) => (
            <div
              key={`${ex.exercise_id}-${idx}`}
              className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[1.8rem] p-5 flex flex-col gap-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MoveVertical
                    size={16}
                    className="text-[var(--text-muted)] opacity-30"
                  />
                  <span className="text-xs font-black uppercase italic text-[var(--text-main)]">
                    {ex.name ||
                      library.find((l) => l.id === ex.exercise_id)?.name}
                  </span>
                </div>
                <button
                  onClick={() =>
                    setSelectedExercises((prev) =>
                      prev.filter((_, i) => i !== idx),
                    )
                  }
                  className="w-8 h-8 rounded-full bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 active:scale-90 transition-all shadow-sm"
                >
                  <Minus size={14} strokeWidth={3} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--bg-main)] rounded-xl p-3 flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase text-[var(--text-muted)]">
                    Sets
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        updateTarget(
                          idx,
                          "target_sets",
                          Math.max(1, ex.target_sets - 1),
                        )
                      }
                      className="w-6 h-6 bg-[var(--bg-surface)] rounded-md flex items-center border border-[var(--border-color)] justify-center"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="text-xs font-black">{ex.target_sets}</span>
                    <button
                      onClick={() =>
                        updateTarget(idx, "target_sets", ex.target_sets + 1)
                      }
                      className="w-6 h-6 bg-[var(--bg-surface)] rounded-md flex items-center border border-[var(--border-color)] justify-center"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                </div>
                <div className="bg-[var(--bg-main)] rounded-xl p-3 flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase text-[var(--text-muted)]">
                    Reps
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        updateTarget(
                          idx,
                          "target_reps",
                          Math.max(1, ex.target_reps - 1),
                        )
                      }
                      className="w-6 h-6 bg-[var(--bg-surface)] rounded-md flex items-center border border-[var(--border-color)] justify-center"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="text-xs font-black">{ex.target_reps}</span>
                    <button
                      onClick={() =>
                        updateTarget(idx, "target_reps", ex.target_reps + 1)
                      }
                      className="w-6 h-6 bg-[var(--bg-surface)] rounded-md flex items-center border border-[var(--border-color)] justify-center"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onUpdate}
            className="w-full py-5 bg-[var(--brand-primary)] text-[var(--bg-main)] font-black uppercase italic rounded-3xl shadow-xl shadow-[var(--brand-primary)]/20 active:scale-[0.97] transition-all flex items-center justify-center gap-3 tracking-widest"
          >
            <Check size={20} strokeWidth={4} /> UPDATE TEMPLATE
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="w-full py-5 bg-red-500/10 text-red-500 font-black uppercase italic rounded-3xl flex items-center justify-center gap-3 border border-red-500/20 active:scale-95 transition-all"
          >
            <Trash2 size={20} /> ARCHIVE ROUTINE
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showModal}
        onConfirm={() =>
          LibraryService.archiveRoutine(id!).then(() => navigate(-1))
        }
        onCancel={() => setShowModal(false)}
      />
    </SubPageLayout>
  );
};

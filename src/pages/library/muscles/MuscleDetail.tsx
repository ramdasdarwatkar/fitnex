import { useEffect, useState, type ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SubPageLayout } from "../../../components/layout/SubPageLayout";
import {
  Save,
  Trash2,
  Target,
  GitMerge,
  ChevronDown,
  AlertCircle,
  Loader2,
  PencilLine,
  X,
} from "lucide-react";
import type { Muscle } from "../../../types/database.types";
import { MuscleService } from "../../../services/MuscleService";

// --- CONFIRM MODAL ---

interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal = ({ isOpen, onConfirm, onCancel }: ConfirmModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-bg-main/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onCancel}
      />
      <div
        className="relative w-full max-w-sm bg-bg-surface border border-border-color/40
                   rounded-2xl p-8 card-glow animate-in zoom-in-95 duration-200 text-center"
      >
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

        <h3 className="text-xl font-black uppercase italic text-text-main mb-2 tracking-tighter">
          Archive Muscle?
        </h3>
        <p
          className="text-[10px] font-black uppercase italic tracking-[0.2em]
                      text-text-muted/60 leading-relaxed mb-8 px-4"
        >
          This muscle will be hidden from the library but preserved in your
          workout history.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full py-4 rounded-2xl font-black uppercase italic
                       tracking-widest active:scale-[0.98] transition-all"
            style={{
              background: "var(--brand-danger)",
              color: "var(--color-on-brand)",
              boxShadow: "0 4px 16px var(--danger-border)",
            }}
          >
            Confirm Archive
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 text-text-muted/50 font-black uppercase italic
                       text-[10px] tracking-widest hover:text-text-main transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

export const MuscleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [muscles, setMuscles] = useState<Muscle[]>([]);
  const [form, setForm] = useState({ name: "", parent_id: "" });
  const [originalForm, setOriginalForm] = useState({ name: "", parent_id: "" });

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!id) return;
      try {
        const [target, list] = await Promise.all([
          MuscleService.getMuscleById(id),
          MuscleService.getActiveMuscles(),
        ]);
        if (isMounted && target) {
          const initialData = {
            name: target.name,
            parent_id: target.parent || "",
          };
          setForm(initialData);
          setOriginalForm(initialData);
          setMuscles(list.filter((m) => m.id !== id));
        }
      } catch (err) {
        console.error("Failed to load muscle details:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const onUpdate = async () => {
    if (!id || !form.name.trim() || processing) return;
    setProcessing(true);
    try {
      await MuscleService.updateMuscle(
        id,
        form.name.trim(),
        form.parent_id || null,
      );
      setOriginalForm(form);
      setIsEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
    } finally {
      setProcessing(false);
    }
  };

  const onCancelEdit = () => {
    setForm(originalForm);
    setIsEditing(false);
  };

  const onArchive = async () => {
    if (!id || processing) return;
    setProcessing(true);
    try {
      await MuscleService.archiveMuscle(id);
      navigate(-1);
    } catch (err) {
      console.error(err);
      alert("Could not archive muscle.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-brand-primary" size={30} />
      </div>
    );
  }

  const footer = isEditing ? (
    <div className="flex flex-col gap-3">
      <button
        onClick={onUpdate}
        disabled={processing || !form.name.trim()}
        className="w-full h-16 bg-brand-primary rounded-2xl font-black uppercase italic
                   tracking-[0.3em] flex items-center justify-center gap-3
                   active:scale-[0.98] transition-all disabled:opacity-30"
        style={{
          color: "var(--color-on-brand)",
          boxShadow: "0 4px 24px var(--glow-primary)",
        }}
      >
        {processing ? (
          <Loader2 className="animate-spin" size={22} />
        ) : (
          <Save size={22} strokeWidth={2.5} />
        )}
        <span>Save Changes</span>
      </button>

      <button
        onClick={onCancelEdit}
        disabled={processing}
        className="w-full py-4 bg-bg-surface text-text-muted/50 font-black uppercase italic
                   text-[10px] tracking-[0.3em] rounded-2xl flex items-center justify-center
                   gap-2 border border-border-color/40 active:scale-[0.98] transition-all"
      >
        <X size={16} /> Discard
      </button>
    </div>
  ) : (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => setIsEditing(true)}
        className="w-full h-16 bg-bg-surface border border-border-color/40 rounded-2xl
                   font-black uppercase italic tracking-[0.3em] card-glow
                   text-text-main flex items-center justify-center gap-3
                   active:scale-[0.98] transition-all
                   hover:border-brand-primary/30 hover:text-brand-primary"
      >
        <PencilLine size={20} />
        <span>Modify Details</span>
      </button>

      <button
        onClick={() => setShowModal(true)}
        className="w-full py-4 rounded-2xl font-black uppercase italic text-[10px]
                   tracking-[0.3em] flex items-center justify-center gap-2
                   active:scale-[0.98] transition-all"
        style={{
          color: "var(--brand-danger)",
          background: "var(--danger-bg)",
          border: "1px solid var(--danger-border)",
        }}
      >
        <Trash2 size={15} /> Archive Record
      </button>
    </div>
  );

  return (
    <SubPageLayout
      title={isEditing ? "Modify Muscle" : "Muscle Detail"}
      footer={footer}
    >
      <div
        className="flex flex-col gap-6 pt-2 pb-4
                      animate-in fade-in slide-in-from-bottom-2 duration-500"
      >
        {/* ── DATA CARD ── */}
        <div className="bg-bg-surface border border-border-color/40 rounded-2xl p-6 space-y-6 card-glow">
          {/* Name */}
          <div className="space-y-1.5">
            <p
              className="flex items-center gap-1.5 text-[9.5px] font-black uppercase italic
                          tracking-[0.3em] text-text-muted/50"
            >
              <Target size={12} className="text-brand-primary/60" />
              Display Label
            </p>
            <input
              type="text"
              disabled={!isEditing}
              value={form.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setForm({ ...form, name: e.target.value })
              }
              className={`w-full bg-bg-main border rounded-2xl py-3.5 px-5 text-2xl font-black
                          italic text-text-main outline-none transition-colors
                          uppercase tracking-tighter
                          ${
                            isEditing
                              ? "border-brand-primary/40 focus:border-brand-primary/60"
                              : "border-border-color/20 opacity-50"
                          }`}
            />
          </div>

          {/* Parent group */}
          <div className="space-y-1.5">
            <p
              className="flex items-center gap-1.5 text-[9.5px] font-black uppercase italic
                          tracking-[0.3em] text-text-muted/50"
            >
              <GitMerge size={13} className="text-brand-primary/60" />
              System Group
            </p>
            <div className="relative">
              <select
                disabled={!isEditing}
                value={form.parent_id}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setForm({ ...form, parent_id: e.target.value })
                }
                className={`w-full bg-bg-main border rounded-2xl py-3.5 px-5 pr-11
                            text-[11px] font-black uppercase italic tracking-[0.25em]
                            text-text-main outline-none appearance-none transition-colors
                            ${
                              isEditing
                                ? "border-brand-primary/40"
                                : "border-border-color/20 opacity-50"
                            }`}
              >
                <option value="">No parent (primary group)</option>
                {muscles.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={15}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted/40 pointer-events-none"
              />
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showModal}
        onConfirm={onArchive}
        onCancel={() => setShowModal(false)}
      />
    </SubPageLayout>
  );
};

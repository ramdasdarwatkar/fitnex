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
} from "lucide-react";

// 1. IMPORT YOUR TYPES
import type { Muscle } from "../../../types/database.types";
import { MuscleService } from "../../../services/MuscleService";

/**
 * CONFIRM MODAL
 * Defined outside to satisfy React Compiler purity.
 */
interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal = ({ isOpen, onConfirm, onCancel }: ConfirmModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm bg-bg-surface border border-border-color rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-2xl font-black uppercase italic text-text-main mb-2 tracking-tighter">
          Archive <span className="text-red-500">Muscle?</span>
        </h3>
        <p className="text-sm font-bold text-text-muted leading-relaxed mb-8 italic">
          This muscle will be hidden from the library but preserved in history.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full py-5 bg-red-500 text-white rounded-2xl font-black uppercase italic tracking-widest active:scale-95"
          >
            Confirm Archive
          </button>
          <button
            onClick={onCancel}
            className="w-full py-4 bg-transparent text-text-muted font-black uppercase italic text-[10px]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export const MuscleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // FIXED: No more 'any[]'
  const [muscles, setMuscles] = useState<Muscle[]>([]);
  const [form, setForm] = useState({ name: "", parent_id: "" });

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
          setForm({
            name: target.name,
            parent_id: target.parent || "",
          });
          // Exclude self from potential parents
          setMuscles(list.filter((m) => m.id !== id));
        }
      } catch (err: unknown) {
        // FIXED: 'err' is now used for debugging
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
      navigate(-1);
    } catch (err: unknown) {
      // FIXED: Used the error to alert the user properly
      const errorMsg = err instanceof Error ? err.message : "Update failed";
      alert(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  const onArchive = async () => {
    if (!id || processing) return;
    setProcessing(true);
    try {
      await MuscleService.archiveMuscle(id);
      navigate(-1);
    } catch (err: unknown) {
      console.error("Archive operation failed:", err);
      alert("Could not archive muscle.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return null;

  return (
    <SubPageLayout title="Muscle Settings">
      <div className="flex flex-col gap-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* EDIT CARD */}
        <div className="bg-bg-surface border border-border-color p-6 rounded-[2.5rem] space-y-8 shadow-sm">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3 block ml-1">
              <Target size={12} className="inline mr-1 text-brand-primary" />{" "}
              Display Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setForm({ ...form, name: e.target.value })
              }
              className="w-full bg-bg-main border border-border-color rounded-xl py-4 px-5 text-xl font-black italic text-text-main outline-none focus:border-brand-primary transition-all"
            />
          </div>

          <div className="relative">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3 block ml-1">
              <GitMerge size={12} className="inline mr-1 text-brand-primary" />{" "}
              Parent Group
            </label>
            <div className="relative">
              <select
                value={form.parent_id}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setForm({ ...form, parent_id: e.target.value })
                }
                className="w-full bg-bg-main border border-border-color rounded-xl py-4 px-5 text-xs font-black uppercase italic text-text-main outline-none appearance-none pr-12"
              >
                <option value="">No Parent (Primary)</option>
                {muscles.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onUpdate}
            disabled={processing}
            className="w-full py-5 bg-brand-primary text-black font-black uppercase italic rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] shadow-xl shadow-brand-primary/10 transition-all disabled:opacity-50"
          >
            {processing ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Save size={20} />
            )}
            Save Changes
          </button>

          <button
            onClick={() => setShowModal(true)}
            disabled={processing}
            className="w-full py-5 bg-red-500/10 text-red-500 font-black uppercase italic rounded-2xl flex items-center justify-center gap-2 border border-red-500/20 active:scale-[0.98] transition-all"
          >
            <Trash2 size={20} /> Archive Muscle
          </button>
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

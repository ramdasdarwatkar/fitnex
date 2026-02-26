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
        className="absolute inset-0 bg-bg-main/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm bg-bg-surface border border-border-color rounded-xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
        <div className="w-16 h-16 rounded-xl bg-brand-error/10 flex items-center justify-center text-brand-error mx-auto mb-6">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-2xl font-black uppercase italic text-text-main mb-2 tracking-tighter">
          Archive <span className="text-brand-error">Muscle?</span>
        </h3>
        <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted leading-relaxed mb-8">
          This muscle will be hidden from the library but preserved in your
          workout history.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full py-4 bg-brand-error text-bg-main rounded-xl font-black uppercase italic tracking-widest active:scale-[0.98] transition-all"
          >
            Confirm Archive
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 bg-transparent text-text-muted font-black uppercase italic text-[10px] tracking-widest"
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
      const errorMsg = err instanceof Error ? err.message : "Update failed";
      alert(errorMsg);
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
      console.log(err);
      alert("Could not archive muscle.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );
  }

  return (
    <SubPageLayout title={isEditing ? "Edit Muscle" : "Muscle Detail"}>
      <div className="flex flex-col gap-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* EDIT CARD */}
        <div className="bg-bg-surface border border-border-color p-6 rounded-xl space-y-8 shadow-sm">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase italic tracking-widest text-text-muted ml-1">
              <Target size={12} className="inline mr-1.5 text-brand-primary" />
              Display Name
            </label>
            <input
              type="text"
              disabled={!isEditing}
              value={form.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setForm({ ...form, name: e.target.value })
              }
              className={`w-full bg-bg-main border rounded-xl py-4 px-5 text-xl font-black italic text-text-main outline-none transition-all uppercase tracking-tighter ${
                isEditing
                  ? "border-brand-primary/50 ring-4 ring-brand-primary/5"
                  : "border-border-color/40 opacity-60"
              }`}
            />
          </div>

          <div className="relative space-y-1">
            <label className="text-[10px] font-black uppercase italic tracking-widest text-text-muted ml-1">
              <GitMerge
                size={12}
                className="inline mr-1.5 text-brand-primary"
              />
              Parent Group
            </label>
            <div className="relative">
              <select
                disabled={!isEditing}
                value={form.parent_id}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setForm({ ...form, parent_id: e.target.value })
                }
                className={`w-full bg-bg-main border rounded-xl py-4 px-5 text-[11px] font-black uppercase italic tracking-wide text-text-main outline-none appearance-none pr-12 transition-all ${
                  isEditing
                    ? "border-brand-primary/50 ring-4 ring-brand-primary/5"
                    : "border-border-color/40 opacity-60"
                }`}
              >
                <option value="">No Parent (Primary)</option>
                {muscles.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name.toUpperCase()}
                  </option>
                ))}
              </select>
              {isEditing && (
                <ChevronDown
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
              )}
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col gap-3">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="w-full h-14 bg-text-main text-bg-main font-black uppercase italic tracking-widest rounded-xl flex items-center justify-center gap-3 active:scale-[0.98] shadow-lg transition-all"
              >
                <PencilLine size={18} />
                Modify Details
              </button>

              <button
                onClick={() => setShowModal(true)}
                className="w-full py-4 bg-bg-surface text-brand-error font-black uppercase italic text-[10px] tracking-widest rounded-xl flex items-center justify-center gap-2 border border-brand-error/20 active:scale-[0.98] transition-all"
              >
                <Trash2 size={16} /> Archive Muscle
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onUpdate}
                disabled={processing || !form.name.trim()}
                className="w-full h-14 bg-brand-primary text-bg-main font-black uppercase italic tracking-widest rounded-xl flex items-center justify-center gap-3 active:scale-[0.98] shadow-md shadow-brand-primary/20 transition-all disabled:opacity-50"
              >
                {processing ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Save size={20} />
                )}
                Update Changes
              </button>

              <button
                onClick={onCancelEdit}
                disabled={processing}
                className="w-full py-4 bg-bg-surface text-text-muted font-black uppercase italic text-[10px] tracking-widest rounded-xl flex items-center justify-center gap-2 border border-border-color active:scale-[0.98] transition-all"
              >
                <X size={18} /> Cancel
              </button>
            </>
          )}
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

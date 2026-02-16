import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SubPageLayout } from "../../../components/layout/SubPageLayout";
import { db } from "../../../db/database";
import { supabase } from "../../../lib/supabase";
import {
  Save,
  Trash2,
  Target,
  GitMerge,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

// Types
import type { Database } from "../../../types/database.types";
type Muscle = Database["public"]["Tables"]["muscles"]["Row"];

/**
 * Custom Confirm Modal Component
 * Styled to match the Fitnex aesthetic
 */
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
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
          <AlertCircle size={28} />
        </div>
        <h3 className="text-xl font-black uppercase italic text-[var(--text-main)] mb-2 tracking-tight">
          Archive Muscle?
        </h3>
        <p className="text-sm font-bold text-[var(--text-muted)] leading-relaxed mb-8">
          This muscle will be hidden from the library but will remain preserved
          in your historical workout logs.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full py-4 bg-red-500 text-white rounded-2xl font-black uppercase italic tracking-widest active:scale-95 transition-all shadow-lg shadow-red-500/20"
          >
            Archive Muscle
          </button>
          <button
            onClick={onCancel}
            className="w-full py-4 bg-transparent text-[var(--text-muted)] font-black uppercase italic tracking-widest text-[10px]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export const MuscleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [allMuscles, setAllMuscles] = useState<Muscle[]>([]);
  const [form, setForm] = useState({
    name: "",
    parent_id: "" as string | null,
  });

  // Load Muscle Data
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      const [targetMuscle, list] = await Promise.all([
        db.muscles.get(id),
        db.muscles.toArray(),
      ]);

      if (targetMuscle) {
        setForm({
          name: targetMuscle.name,
          parent_id: targetMuscle.parent || "",
        });
      }

      // Filter out self to avoid circular parent dependency
      setAllMuscles(list.filter((m) => m.id !== id && m.status !== false));
      setLoading(false);
    };

    loadData();
  }, [id]);

  // Update Logic
  const handleUpdate = async () => {
    if (!id || !form.name) return;

    const payload = {
      name: form.name,
      parent: form.parent_id === "" ? null : form.parent_id,
    };

    const { error } = await supabase
      .from("muscles")
      .update(payload)
      .eq("id", id);

    if (!error) {
      await db.muscles.update(id, payload);
      navigate(-1);
    }
  };

  // Soft Delete (Archive) Logic
  const handleArchive = async () => {
    if (!id) return;

    const { error } = await supabase
      .from("muscles")
      .update({ status: false })
      .eq("id", id);

    if (!error) {
      await db.muscles.update(id, { status: false });
      navigate(-1);
    }
  };

  if (loading) return null;

  return (
    <SubPageLayout title="Muscle Settings">
      <div className="flex flex-col gap-6 pb-20">
        {/* EDIT FORM CARD */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-6 rounded-[2rem] space-y-8">
          {/* NAME */}
          <div>
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">
              <Target size={12} className="text-[var(--brand-primary)]" />
              Display Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-4 px-4 text-lg font-black italic text-[var(--text-main)] outline-none focus:border-[var(--brand-primary)] transition-all"
            />
          </div>

          {/* PARENT SELECTION */}
          <div className="relative">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">
              <GitMerge size={12} className="text-[var(--brand-primary)]" />
              Parent Group
            </label>
            <select
              value={form.parent_id || ""}
              onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-4 px-4 text-sm font-black italic text-[var(--text-main)] outline-none appearance-none focus:border-[var(--brand-primary)] uppercase transition-all"
            >
              <option value="">No Parent (Primary)</option>
              {allMuscles.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-4 bottom-4 text-[var(--text-muted)] pointer-events-none"
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleUpdate}
            className="w-full py-5 bg-[var(--brand-primary)] text-[var(--bg-main)] font-black uppercase italic tracking-widest rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-[var(--brand-primary)]/10"
          >
            <Save size={20} />
            Save Changes
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-5 bg-red-500/10 border border-red-500/20 text-red-500 font-black uppercase italic tracking-widest rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all mt-4"
          >
            <Trash2 size={20} />
            Archive Muscle
          </button>
        </div>
      </div>

      {/* CUSTOM CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onConfirm={handleArchive}
        onCancel={() => setShowDeleteModal(false)}
      />
    </SubPageLayout>
  );
};

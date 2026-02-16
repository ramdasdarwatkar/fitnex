import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SubPageLayout } from "../../../components/layout/SubPageLayout";
import { LibraryService } from "../../../services/LibraryService";
import {
  Save,
  Trash2,
  Target,
  GitMerge,
  ChevronDown,
  AlertCircle,
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
          This muscle will be hidden from the library but preserved in your
          history.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full py-4 bg-red-500 text-white rounded-2xl font-black uppercase italic tracking-widest active:scale-95 shadow-lg shadow-red-500/20"
          >
            Archive
          </button>
          <button
            onClick={onCancel}
            className="w-full py-4 bg-transparent text-[var(--text-muted)] font-black uppercase italic text-[10px]"
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
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [muscles, setMuscles] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", parent_id: "" });

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const [target, list] = await Promise.all([
        LibraryService.getMuscleById(id),
        LibraryService.getActiveMuscles(),
      ]);
      if (target)
        setForm({ name: target.name, parent_id: target.parent || "" });
      setMuscles(list.filter((m) => m.id !== id));
      setLoading(false);
    };
    load();
  }, [id]);

  const onUpdate = async () => {
    try {
      // Atomic Update: Reflected in Dexie immediately via Service
      await LibraryService.updateMuscle(id!, form.name, form.parent_id);
      navigate(-1);
    } catch (err) {
      alert("Update failed.");
    }
  };

  const onArchive = async () => {
    try {
      await LibraryService.archiveMuscle(id!);
      navigate(-1);
    } catch (err) {
      alert("Archive failed.");
    }
  };

  if (loading) return null;

  return (
    <SubPageLayout title="Muscle Settings">
      <div className="flex flex-col gap-6 pb-20">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-6 rounded-[2.2rem] space-y-8 shadow-sm">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 block">
              <Target size={12} className="inline mr-1" /> Display Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-4 px-4 text-xl font-black italic text-[var(--text-main)] outline-none focus:border-[var(--brand-primary)]"
            />
          </div>
          <div className="relative">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 block">
              <GitMerge size={12} className="inline mr-1" /> Parent Group
            </label>
            <select
              value={form.parent_id}
              onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-4 px-4 text-xs font-black uppercase italic text-[var(--text-main)] outline-none appearance-none"
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
              className="absolute right-4 bottom-4 text-[var(--text-muted)] pointer-events-none"
            />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={onUpdate}
            className="w-full py-5 bg-[var(--brand-primary)] text-[var(--bg-main)] font-black uppercase italic rounded-2xl flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-[var(--brand-primary)]/10"
          >
            <Save size={20} /> Save Changes
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="w-full py-5 bg-red-500/10 text-red-500 font-black uppercase italic rounded-2xl flex items-center justify-center gap-2 border border-red-500/20 active:scale-95"
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

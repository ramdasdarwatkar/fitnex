import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { SubPageLayout } from "../../../components/layout/SubPageLayout";
import { LibraryService } from "../../../services/LibraryService";
import { Plus, GitMerge, ChevronDown, Loader2 } from "lucide-react";
import type { Muscle } from "../../../types/database.types";
import { MuscleService } from "../../../services/MuscleService";

export const AddMuscle = () => {
  const navigate = useNavigate();

  // 1. Strict Typing for Muscle List
  const [muscles, setMuscles] = useState<Muscle[]>([]);
  const [form, setForm] = useState({ name: "", parent_id: "" });
  const [loading, setLoading] = useState(false);

  // 2. Initial Data Load
  useEffect(() => {
    let isMounted = true;
    MuscleService.getActiveMuscles().then((data) => {
      if (isMounted) setMuscles(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Save Logic with Sync Integration
  const onSave = async () => {
    if (!form.name.trim() || loading) return;

    setLoading(true);
    try {
      // In our Local-First engine, this writes to Dexie with is_synced: 0
      // and triggers SyncManager.reconcile()
      await MuscleService.addMuscle(form.name.trim(), form.parent_id || null);
      navigate(-1);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Muscle name must be unique.";
      alert(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SubPageLayout title="New Muscle">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* FORM CONTAINER */}
        <div className="bg-bg-surface border border-border-color p-6 rounded-[2.5rem] space-y-8 shadow-xl">
          {/* MUSCLE NAME INPUT */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">
              Muscle Name
            </label>
            <input
              autoFocus
              type="text"
              value={form.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setForm({ ...form, name: e.target.value })
              }
              placeholder="e.g. Upper Chest"
              className="w-full bg-bg-main border border-border-color rounded-2xl py-5 px-5 text-2xl font-black italic text-text-main outline-none focus:border-brand-primary transition-all placeholder:text-text-muted/20"
            />
          </div>

          {/* PARENT SELECT */}
          <div className="relative space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">
              <GitMerge size={12} className="text-brand-primary" />
              Parent Group
            </label>
            <div className="relative">
              <select
                value={form.parent_id}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setForm({ ...form, parent_id: e.target.value })
                }
                className="w-full bg-bg-main border border-border-color rounded-2xl py-5 px-5 text-xs font-black uppercase text-text-main outline-none appearance-none focus:border-brand-primary transition-all pr-12"
              >
                <option value="">No Parent (Primary)</option>
                {muscles.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={18}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* ACTION BUTTON */}
        <button
          onClick={onSave}
          disabled={loading || !form.name.trim()}
          className="w-full py-6 bg-brand-primary text-black font-black uppercase italic tracking-widest rounded-4xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-30 shadow-lg shadow-brand-primary/20"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={22} />
          ) : (
            <Plus size={24} strokeWidth={3} />
          )}
          <span>{loading ? "Syncing..." : "Add to Library"}</span>
        </button>

        <p className="text-center text-[9px] font-bold text-text-muted uppercase tracking-[0.2em] opacity-50">
          Created muscles are available across all exercises.
        </p>
      </div>
    </SubPageLayout>
  );
};

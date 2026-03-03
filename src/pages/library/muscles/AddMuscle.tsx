import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { SubPageLayout } from "../../../components/layout/SubPageLayout";
import { Plus, GitMerge, ChevronDown, Loader2 } from "lucide-react";
import type { Muscle } from "../../../types/database.types";
import { MuscleService } from "../../../services/MuscleService";

export const AddMuscle = () => {
  const navigate = useNavigate();

  const [muscles, setMuscles] = useState<Muscle[]>([]);
  const [form, setForm] = useState({ name: "", parent_id: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    MuscleService.getActiveMuscles().then((data) => {
      if (isMounted) setMuscles(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const onSave = async () => {
    if (!form.name.trim() || loading) return;
    setLoading(true);
    try {
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

  const saveButton = (
    <button
      onClick={onSave}
      disabled={loading || !form.name.trim()}
      className="w-full h-16 bg-brand-primary rounded-2xl font-black uppercase italic
                 tracking-[0.3em] flex items-center justify-center gap-3
                 active:scale-[0.98] transition-all disabled:opacity-30"
      style={{
        color: "var(--color-on-brand)",
        boxShadow: "0 4px 24px var(--glow-primary)",
      }}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={22} />
      ) : (
        <Plus size={22} strokeWidth={3.5} />
      )}
      <span>{loading ? "Saving..." : "Add to Library"}</span>
    </button>
  );

  return (
    <SubPageLayout title="New Muscle" footer={saveButton}>
      <div
        className="flex flex-col gap-6 pt-2 pb-4
                      animate-in fade-in slide-in-from-bottom-2 duration-500"
      >
        {/* ── FORM CARD ── */}
        <div className="bg-bg-surface border border-border-color/40 rounded-2xl p-6 space-y-6 card-glow">
          {/* Name */}
          <div className="space-y-1.5">
            <p className="text-[9.5px] font-black uppercase italic tracking-[0.3em] text-text-muted/50">
              Muscle Name
            </p>
            <input
              autoFocus
              type="text"
              value={form.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setForm({ ...form, name: e.target.value })
              }
              placeholder="e.g. Upper Chest"
              className="w-full bg-bg-main border border-border-color/40 rounded-2xl py-3.5 px-5
                         text-2xl font-black italic text-text-main outline-none
                         focus:border-brand-primary/40 transition-colors
                         placeholder:text-text-muted/15 uppercase tracking-tighter"
            />
          </div>

          {/* Parent group */}
          <div className="space-y-1.5">
            <p
              className="flex items-center gap-2 text-[9.5px] font-black uppercase italic
                          tracking-[0.3em] text-text-muted/50"
            >
              <GitMerge size={13} className="text-brand-primary/60" />
              Structural Group
            </p>
            <div className="relative">
              <select
                value={form.parent_id}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setForm({ ...form, parent_id: e.target.value })
                }
                className="w-full bg-bg-main border border-border-color/40 rounded-2xl
                           py-3.5 px-5 pr-11 text-[12px] font-black uppercase italic
                           tracking-widest text-text-main outline-none appearance-none
                           focus:border-brand-primary/40 transition-colors"
              >
                <option value="">No parent (primary group)</option>
                {muscles.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted/40 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Footnote */}
        <p
          className="text-center text-[9px] font-black uppercase italic text-text-muted/30
                      tracking-[0.35em] leading-relaxed px-6"
        >
          Created muscles are available across your full exercise library
        </p>
      </div>
    </SubPageLayout>
  );
};

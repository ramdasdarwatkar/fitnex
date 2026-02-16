import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SubPageLayout } from "../../../components/layout/SubPageLayout";
import { db } from "../../../db/database";
import { supabase } from "../../../lib/supabase";
import { Plus, GitMerge, ChevronDown } from "lucide-react";

export const AddMuscle = () => {
  const navigate = useNavigate();
  const [muscles, setMuscles] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", parent_id: "" });

  useEffect(() => {
    db.muscles.toArray().then(setMuscles);
  }, []);

  const onSave = async () => {
    if (!form.name) return;
    const payload = {
      name: form.name,
      parent: form.parent_id === "" ? null : form.parent_id,
    };

    const { data, error } = await supabase
      .from("muscles")
      .insert([payload])
      .select()
      .single();
    if (!error && data) {
      await db.muscles.put(data);
      navigate(-1);
    }
  };

  return (
    <SubPageLayout title="New Muscle">
      <div className="space-y-6">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-6 rounded-[2rem] space-y-6">
          <input
            autoFocus
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Name (e.g. Upper Chest)"
            className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-4 px-4 text-xl font-black italic text-[var(--text-main)] outline-none focus:border-[var(--brand-primary)]"
          />

          <div className="relative">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">
              <GitMerge size={12} className="text-[var(--brand-primary)]" />
              Assign to Parent Group
            </label>
            <select
              value={form.parent_id}
              onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-4 px-4 text-sm font-black italic text-[var(--text-main)] outline-none appearance-none focus:border-[var(--brand-primary)] uppercase"
            >
              <option value="">No Parent</option>
              {muscles.map((m) => (
                <option
                  key={m.id}
                  value={m.id}
                  className="bg-[var(--bg-surface)]"
                >
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

        <button
          onClick={onSave}
          className="w-full py-5 bg-[var(--brand-primary)] text-[var(--bg-main)] font-black uppercase italic tracking-widest rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Plus size={22} strokeWidth={3} />
          Add to Library
        </button>
      </div>
    </SubPageLayout>
  );
};

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SubPageLayout } from "../../../components/layout/SubPageLayout";
import { LibraryService } from "../../../services/LibraryService";
import { db } from "../../../db/database";
import {
  Save,
  Search,
  X,
  Globe,
  Lock,
  ChevronDown,
  Loader2,
} from "lucide-react";

export const EditExercise = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [muscles, setMuscles] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState<any>({
    name: "",
    isPublic: false,
    equipmentId: "",
    category: "",
    tracking: [],
    primaryMuscles: [],
    secondaryMuscles: [],
    stabilizerMuscles: [],
  });

  useEffect(() => {
    const load = async () => {
      const [m, e, initial] = await Promise.all([
        db.muscles.toArray(),
        db.equipment.toArray(),
        LibraryService.getExerciseForEdit(id!),
      ]);
      setMuscles(m);
      setEquipment(e);
      if (initial) setForm(initial);
      setLoading(false);
    };
    load();
  }, [id]);

  const addMuscle = (mId: string, role: string) => {
    const key = `${role}Muscles`;
    if (!form[key].includes(mId)) {
      setForm({ ...form, [key]: [...form[key], mId] });
    }
    setSearch("");
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await LibraryService.updateExercise(id!, form);
      navigate(-1);
    } catch (e) {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <SubPageLayout title="Update Exercise">
      <div className="flex flex-col gap-10 pb-40 px-2">
        {/* PUBLIC/PRIVATE TOGGLE */}
        <div className="bg-slate-100 dark:bg-slate-900 p-1.5 rounded-[2rem] flex relative border border-slate-200 dark:border-slate-800">
          <div
            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white dark:bg-slate-800 rounded-[1.8rem] shadow-xl transition-all duration-300 ${form.isPublic ? "translate-x-[100%]" : "translate-x-0"}`}
          />
          <button
            onClick={() => setForm({ ...form, isPublic: false })}
            className="flex-1 py-4 z-10 flex items-center justify-center gap-2 text-[10px] font-black uppercase italic tracking-widest"
          >
            <Lock
              size={14}
              className={
                !form.isPublic ? "text-black dark:text-white" : "text-slate-400"
              }
            />{" "}
            Private
          </button>
          <button
            onClick={() => setForm({ ...form, isPublic: true })}
            className="flex-1 py-4 z-10 flex items-center justify-center gap-2 text-[10px] font-black uppercase italic tracking-widest"
          >
            <Globe
              size={14}
              className={form.isPublic ? "text-emerald-500" : "text-slate-400"}
            />{" "}
            Public
          </button>
        </div>

        {/* NAME INPUT */}
        <div className="space-y-2 px-1">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">
            Exercise Name
          </label>
          <input
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2.5rem] text-black dark:text-white font-black uppercase italic outline-none focus:ring-2 ring-[var(--brand-primary)]"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        {/* DROPDOWNS */}
        <div className="grid grid-cols-1 gap-6 px-1">
          <SelectField
            label="Category"
            value={form.category}
            options={muscles.filter((m) => !m.parent_id)}
            onChange={(v) => setForm({ ...form, category: v })}
          />
          <SelectField
            label="Equipment"
            value={form.equipmentId}
            options={equipment}
            onChange={(v) => setForm({ ...form, equipmentId: v })}
          />
        </div>

        {/* METRIC TRACKING */}
        <div className="space-y-4 px-1">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">
            Tracked Metrics
          </label>
          <div className="flex flex-wrap gap-2">
            {["reps", "weight", "bodyweight", "distance", "duration"].map(
              (opt) => (
                <button
                  key={opt}
                  onClick={() =>
                    setForm({
                      ...form,
                      tracking: form.tracking.includes(opt)
                        ? form.tracking.filter((t: any) => t !== opt)
                        : [...form.tracking, opt],
                    })
                  }
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase italic border transition-all ${form.tracking.includes(opt) ? "bg-[var(--brand-primary)] border-transparent text-black" : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500"}`}
                >
                  {opt}
                </button>
              ),
            )}
          </div>
        </div>

        {/* MUSCLE SEARCH PICKER */}
        <div className="space-y-6 px-1">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">
            Muscle Focus
          </label>
          <div className="relative">
            <Search
              className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 pl-16 rounded-[2.5rem] text-sm text-black dark:text-white outline-none"
              placeholder="Add muscle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search.length > 1 && (
              <div className="absolute top-[110%] left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] z-50 shadow-2xl overflow-hidden">
                {muscles
                  .filter((m) =>
                    m.name.toLowerCase().includes(search.toLowerCase()),
                  )
                  .slice(0, 5)
                  .map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 last:border-0"
                    >
                      <span className="text-xs font-black uppercase italic dark:text-white">
                        {m.name}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => addMuscle(m.id, "primary")}
                          className="bg-orange-500 text-white text-[8px] font-black px-3 py-1.5 rounded-lg"
                        >
                          Pri
                        </button>
                        <button
                          onClick={() => addMuscle(m.id, "secondary")}
                          className="bg-blue-500 text-white text-[8px] font-black px-3 py-1.5 rounded-lg"
                        >
                          Sec
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <MuscleRow
              label="Primary"
              items={form.primaryMuscles}
              muscles={muscles}
              onRemove={(id) =>
                setForm({
                  ...form,
                  primaryMuscles: form.primaryMuscles.filter(
                    (m: any) => m !== id,
                  ),
                })
              }
              color="text-orange-500"
            />
            <MuscleRow
              label="Secondary"
              items={form.secondaryMuscles}
              muscles={muscles}
              onRemove={(id) =>
                setForm({
                  ...form,
                  secondaryMuscles: form.secondaryMuscles.filter(
                    (m: any) => m !== id,
                  ),
                })
              }
              color="text-blue-500"
            />
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="fixed bottom-10 left-6 right-6">
          <button
            onClick={handleUpdate}
            className="w-full py-6 bg-black dark:bg-[var(--brand-primary)] text-white dark:text-black rounded-[2.5rem] font-black uppercase italic tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}{" "}
            Update Changes
          </button>
        </div>
      </div>
    </SubPageLayout>
  );
};

const SelectField = ({ label, value, options, onChange }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">
      {label}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-[2rem] text-xs font-black uppercase italic text-black dark:text-white appearance-none outline-none"
      >
        <option value="">Choose {label}</option>
        {options.map((o: any) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      <ChevronDown
        className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        size={16}
      />
    </div>
  </div>
);

const MuscleRow = ({ label, items, muscles, onRemove, color }: any) => {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <span
        className={`text-[8px] font-black uppercase italic tracking-widest ${color}`}
      >
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {items.map((id: string) => (
          <div
            key={id}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-4 py-2 rounded-xl"
          >
            <span className="text-[10px] font-bold uppercase italic dark:text-white">
              {muscles.find((m: any) => m.id === id)?.name}
            </span>
            <button onClick={() => onRemove(id)}>
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

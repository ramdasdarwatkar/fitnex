import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save,
  Search,
  X,
  Globe,
  Lock,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { SubPageLayout } from "../../../components/layout/SubPageLayout";
import { useAuth } from "../../../context/AuthContext"; // Import Auth
import { db } from "../../../db/database";
import { LibraryService } from "../../../services/LibraryService";

export const AddExercise = () => {
  const navigate = useNavigate();
  const { user_id } = useAuth(); // Retrieve current user ID
  const [muscles, setMuscles] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    isPublic: false,
    equipmentId: "",
    category: "",
    tracking: [] as string[],
    primaryMuscles: [] as string[],
    secondaryMuscles: [] as string[],
    stabilizerMuscles: [] as string[],
  });

  useEffect(() => {
    db.muscles.toArray().then(setMuscles);
    db.equipment.toArray().then(setEquipment);
  }, []);

  const handleSave = async () => {
    if (!form.name || !form.category || !user_id) return;

    setIsSaving(true);
    try {
      await LibraryService.saveExercise(form, user_id);
      navigate("/library");
    } catch (error) {
      console.error("Failed to save exercise:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const addMuscle = (id: string, role: string) => {
    const key = `${role}Muscles` as keyof typeof form;
    if (!(form[key] as string[]).includes(id)) {
      setForm({ ...form, [key]: [...(form[key] as string[]), id] });
    }
    setSearchQuery("");
  };

  return (
    <SubPageLayout title="Create Exercise">
      <div className="flex flex-col gap-10 pb-40 px-2">
        {/* VISIBILITY SELECTOR */}
        <div className="bg-slate-100 dark:bg-slate-900 p-1.5 rounded-[2rem] flex relative border border-slate-200 dark:border-slate-800">
          <div
            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white dark:bg-slate-800 rounded-[1.8rem] shadow-xl transition-all duration-300 ${form.isPublic ? "translate-x-[100%]" : "translate-x-0"}`}
          />
          <button
            onClick={() => setForm({ ...form, isPublic: false })}
            className="flex-1 py-4 z-10 flex items-center justify-center gap-2 text-[10px] font-black uppercase italic tracking-widest transition-colors"
          >
            <Lock
              size={14}
              className={
                !form.isPublic ? "text-black dark:text-white" : "text-slate-400"
              }
            />
            <span
              className={
                !form.isPublic ? "text-black dark:text-white" : "text-slate-400"
              }
            >
              Private
            </span>
          </button>
          <button
            onClick={() => setForm({ ...form, isPublic: true })}
            className="flex-1 py-4 z-10 flex items-center justify-center gap-2 text-[10px] font-black uppercase italic tracking-widest transition-colors"
          >
            <Globe
              size={14}
              className={form.isPublic ? "text-emerald-500" : "text-slate-400"}
            />
            <span
              className={
                form.isPublic ? "text-black dark:text-white" : "text-slate-400"
              }
            >
              Public
            </span>
          </button>
        </div>

        {/* EXERCISE NAME */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">
            Exercise Name
          </label>
          <input
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2.5rem] text-black dark:text-white font-black uppercase italic outline-none focus:ring-2 ring-[var(--brand-primary)] transition-all"
            placeholder="E.G. ZOTTMAN CURLS"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        {/* SELECTS */}
        <div className="grid grid-cols-1 gap-6">
          <CustomSelect
            label="Main Category"
            value={form.category}
            options={muscles.filter((m) => !m.parent_id)}
            onChange={(val) => setForm({ ...form, category: val })}
          />
          <CustomSelect
            label="Equipment Used"
            value={form.equipmentId}
            options={equipment}
            onChange={(val) => setForm({ ...form, equipmentId: val })}
          />
        </div>

        {/* TRACKING OPTIONS */}
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">
            What to track
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
                        ? form.tracking.filter((t) => t !== opt)
                        : [...form.tracking, opt],
                    })
                  }
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase italic border transition-all ${form.tracking.includes(opt) ? "bg-[var(--brand-primary)] border-transparent text-black" : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500"}`}
                >
                  {opt}
                </button>
              ),
            )}
          </div>
        </div>

        {/* MUSCLE SEARCH */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">
              Muscle Mapping
            </label>
            <div className="relative">
              <Search
                className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 pl-16 rounded-[2.5rem] text-sm text-black dark:text-white outline-none shadow-sm focus:border-slate-400 transition-all"
                placeholder="Find muscle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery.length > 1 && (
                <div className="absolute top-[110%] left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] z-50 shadow-2xl overflow-hidden border-t-0">
                  {muscles
                    .filter((m) =>
                      m.name.toLowerCase().includes(searchQuery.toLowerCase()),
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
                          <QuickAddBtn
                            label="Pri"
                            className="bg-orange-500"
                            onClick={() => addMuscle(m.id, "primary")}
                          />
                          <QuickAddBtn
                            label="Sec"
                            className="bg-blue-500"
                            onClick={() => addMuscle(m.id, "secondary")}
                          />
                          <QuickAddBtn
                            label="Stb"
                            className="bg-emerald-500"
                            onClick={() => addMuscle(m.id, "stabilizer")}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <MuscleTagRow
              label="Primary Focus"
              items={form.primaryMuscles}
              muscles={muscles}
              onRemove={(id) =>
                setForm({
                  ...form,
                  primaryMuscles: form.primaryMuscles.filter((m) => m !== id),
                })
              }
              colorClass="text-orange-500"
            />
            <MuscleTagRow
              label="Secondary Support"
              items={form.secondaryMuscles}
              muscles={muscles}
              onRemove={(id) =>
                setForm({
                  ...form,
                  secondaryMuscles: form.secondaryMuscles.filter(
                    (m) => m !== id,
                  ),
                })
              }
              colorClass="text-blue-500"
            />
            <MuscleTagRow
              label="Stabilizers"
              items={form.stabilizerMuscles}
              muscles={muscles}
              onRemove={(id) =>
                setForm({
                  ...form,
                  stabilizerMuscles: form.stabilizerMuscles.filter(
                    (m) => m !== id,
                  ),
                })
              }
              colorClass="text-emerald-500"
            />
          </div>
        </div>

        {/* FLOATING ACTION BUTTON */}
        <div className="fixed bottom-10 left-6 right-6 z-[60]">
          <button
            disabled={isSaving || !form.name || !form.category}
            onClick={handleSave}
            className="w-full py-6 bg-black dark:bg-[var(--brand-primary)] text-white dark:text-black rounded-[2.5rem] font-black uppercase italic tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Save size={20} />
            )}
            {isSaving ? "Saving..." : "Create Exercise"}
          </button>
        </div>
      </div>
    </SubPageLayout>
  );
};

// HELPER COMPONENTS
const CustomSelect = ({ label, value, options, onChange }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">
      {label}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2.5rem] text-[12px] font-black uppercase italic text-black dark:text-white appearance-none outline-none focus:border-slate-400 transition-all"
      >
        <option value="">Choose {label}</option>
        {options.map((o: any) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
        <ChevronRight size={16} className="rotate-90 text-slate-400" />
      </div>
    </div>
  </div>
);

const QuickAddBtn = ({ label, className, onClick }: any) => (
  <button
    onClick={onClick}
    className={`${className} text-[8px] font-black uppercase px-3 py-1.5 rounded-lg text-white shadow-lg active:scale-90 transition-transform`}
  >
    {label}
  </button>
);

const MuscleTagRow = ({ label, items, muscles, onRemove, colorClass }: any) => {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <p
        className={`text-[9px] font-black uppercase tracking-[0.2em] italic ml-2 ${colorClass}`}
      >
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((id: string) => (
          <div
            key={id}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-4 py-2.5 rounded-2xl shadow-sm group"
          >
            <span className="text-[11px] font-black uppercase italic dark:text-white">
              {muscles.find((m: any) => m.id === id)?.name}
            </span>
            <button
              onClick={() => onRemove(id)}
              className="text-slate-400 hover:text-red-500 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

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
import { useAuth } from "../../../hooks/useAuth";
import { db } from "../../../db/database";
import { LibraryService } from "../../../services/LibraryService";
import { type Equipment, type Muscle } from "../../../types/database.types";
import { ExerciseService } from "../../../services/ExerciseService";

// --- 1. STRICT INTERFACES ---

interface ExerciseForm {
  name: string;
  isPublic: boolean;
  equipmentId: string;
  category: string;
  tracking: string[];
  primaryMuscles: string[];
  secondaryMuscles: string[];
  stabilizerMuscles: string[];
}

// --- 2. MAIN COMPONENT ---

export const AddExercise = () => {
  const navigate = useNavigate();
  const { user_id } = useAuth();

  const [muscles, setMuscles] = useState<Muscle[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState<ExerciseForm>({
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
    db.muscles.toArray().then((data) => setMuscles(data));
    db.equipment.toArray().then((data) => setEquipment(data));
  }, []);

  const handleSave = async () => {
    if (!form.name || !form.category || !user_id) return;

    setIsSaving(true);
    try {
      await ExerciseService.saveExercise(form, user_id);
      navigate("/library");
    } catch (error) {
      console.error("Failed to save exercise:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const addMuscle = (
    id: string,
    role: "primary" | "secondary" | "stabilizer",
  ) => {
    const key = `${role}Muscles` as keyof ExerciseForm;
    const currentList = form[key] as string[];

    if (!currentList.includes(id)) {
      setForm({ ...form, [key]: [...currentList, id] });
    }
    setSearchQuery("");
  };

  return (
    <SubPageLayout title="Create Exercise">
      <div className="flex flex-col gap-10 pb-48 px-2 animate-in fade-in duration-500">
        {/* VISIBILITY SELECTOR */}
        <div className="bg-bg-surface p-1.5 rounded-[2.5rem] flex relative border border-border-color shadow-inner">
          <div
            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-bg-main rounded-[2.2rem] shadow-xl transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
              form.isPublic ? "translate-x-full" : "translate-x-0"
            }`}
          />
          <button
            onClick={() => setForm({ ...form, isPublic: false })}
            className="flex-1 py-4 z-10 flex items-center justify-center gap-2 text-[10px] font-black uppercase italic tracking-widest transition-colors"
          >
            <Lock
              size={14}
              className={!form.isPublic ? "text-text-main" : "text-text-muted"}
            />
            <span
              className={!form.isPublic ? "text-text-main" : "text-text-muted"}
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
              className={
                form.isPublic ? "text-brand-success" : "text-text-muted"
              }
            />
            <span
              className={form.isPublic ? "text-text-main" : "text-text-muted"}
            >
              Public
            </span>
          </button>
        </div>

        {/* EXERCISE NAME */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-text-muted ml-6 tracking-[0.3em]">
            Identity
          </label>
          <input
            className="w-full bg-bg-surface border border-border-color p-7 rounded-[3rem] text-text-main font-black uppercase italic outline-none focus:ring-2 ring-brand-primary transition-all placeholder:opacity-20 shadow-sm"
            placeholder="E.G. ZOTTMAN CURLS"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        {/* SELECTS */}
        <div className="grid grid-cols-1 gap-8">
          <CustomSelect
            label="Main Category"
            value={form.category}
            options={muscles.filter((m) => !m.parent)}
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
        <div className="space-y-5">
          <label className="text-[10px] font-black uppercase text-text-muted ml-6 tracking-[0.3em]">
            Metrics
          </label>
          <div className="flex flex-wrap gap-2.5 px-2">
            {["reps", "weight", "bodyweight", "distance", "duration"].map(
              (opt) => {
                const isActive = form.tracking.includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() =>
                      setForm({
                        ...form,
                        tracking: isActive
                          ? form.tracking.filter((t) => t !== opt)
                          : [...form.tracking, opt],
                      })
                    }
                    className={`px-7 py-3.5 rounded-4xl text-[10px] font-black uppercase italic border transition-all duration-300 ${
                      isActive
                        ? "bg-brand-primary border-transparent text-bg-main shadow-lg shadow-brand-primary/20 scale-105"
                        : "bg-bg-surface border-border-color text-text-muted hover:border-text-muted"
                    }`}
                  >
                    {opt}
                  </button>
                );
              },
            )}
          </div>
        </div>

        {/* MUSCLE SEARCH */}
        <div className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-text-muted ml-6 tracking-[0.3em]">
              Biomechanics
            </label>
            <div className="relative">
              <Search
                className="absolute left-7 top-1/2 -translate-y-1/2 text-text-muted opacity-50"
                size={20}
              />
              <input
                className="w-full bg-bg-surface border border-border-color p-7 pl-16 rounded-[3rem] text-sm text-text-main outline-none shadow-inner focus:border-text-muted transition-all"
                placeholder="Find target muscle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery.length > 1 && (
                <div className="absolute top-[110%] left-0 right-0 bg-bg-surface border border-border-color rounded-[2.5rem] z-50 shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-300">
                  {muscles
                    .filter((m) =>
                      m.name.toLowerCase().includes(searchQuery.toLowerCase()),
                    )
                    .slice(0, 5)
                    .map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-6 border-b border-border-color/50 last:border-0 hover:bg-bg-main/50 transition-colors"
                      >
                        <span className="text-xs font-black uppercase italic text-text-main">
                          {m.name}
                        </span>
                        <div className="flex gap-2">
                          <QuickAddBtn
                            label="Pri"
                            className="bg-brand-primary"
                            onClick={() => addMuscle(m.id, "primary")}
                          />
                          <QuickAddBtn
                            label="Sec"
                            className="bg-blue-500"
                            onClick={() => addMuscle(m.id, "secondary")}
                          />
                          <QuickAddBtn
                            label="Stb"
                            className="bg-brand-success"
                            onClick={() => addMuscle(m.id, "stabilizer")}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
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
              colorClass="text-brand-primary"
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
              colorClass="text-brand-success"
            />
          </div>
        </div>

        {/* ACTION BUTTON */}
        <div className="fixed bottom-10 left-6 right-6 z-60">
          <button
            disabled={isSaving || !form.name || !form.category}
            onClick={handleSave}
            className="w-full py-7 bg-text-main text-bg-main rounded-[3rem] font-black uppercase italic tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={22} />
            ) : (
              <Save size={22} />
            )}
            {isSaving ? "Finalizing..." : "Initialize Exercise"}
          </button>
        </div>
      </div>
    </SubPageLayout>
  );
};

// --- HELPER COMPONENTS ---

interface SelectProps {
  label: string;
  value: string | number;
  options: { id: string | number; name: string }[];
  onChange: (val: string) => void;
}

const CustomSelect = ({ label, value, options, onChange }: SelectProps) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black uppercase text-text-muted ml-6 tracking-[0.3em]">
      {label}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-bg-surface border border-border-color p-7 rounded-[3rem] text-[13px] font-black uppercase italic text-text-main appearance-none outline-none focus:border-text-muted transition-all shadow-sm"
      >
        <option value="">Select {label}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id.toString()}>
            {o.name}
          </option>
        ))}
      </select>
      <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
        <ChevronRight size={18} className="rotate-90 text-text-main" />
      </div>
    </div>
  </div>
);

const QuickAddBtn = ({
  label,
  className,
  onClick,
}: {
  label: string;
  className: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`${className} text-[9px] font-black uppercase px-4 py-2 rounded-xl text-bg-main shadow-lg active:scale-90 transition-all`}
  >
    {label}
  </button>
);

interface TagRowProps {
  label: string;
  items: string[];
  muscles: Muscle[];
  onRemove: (id: string) => void;
  colorClass: string;
}

const MuscleTagRow = ({
  label,
  items,
  muscles,
  onRemove,
  colorClass,
}: TagRowProps) => {
  if (items.length === 0) return null;
  return (
    <div className="space-y-3 animate-in slide-in-from-left-2 duration-300">
      <p
        className={`text-[10px] font-black uppercase tracking-[0.2em] italic ml-4 ${colorClass}`}
      >
        {label}
      </p>
      <div className="flex flex-wrap gap-2.5">
        {items.map((id) => (
          <div
            key={id}
            className="flex items-center gap-3 bg-bg-surface border border-border-color px-5 py-3 rounded-2xl shadow-sm hover:border-text-muted transition-colors"
          >
            <span className="text-[12px] font-black uppercase italic text-text-main">
              {muscles.find((m) => m.id === id)?.name}
            </span>
            <button
              onClick={() => onRemove(id)}
              className="text-text-muted hover:text-brand-danger transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save,
  Search,
  X,
  Globe,
  Lock,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { SubPageLayout } from "../../../components/layout/SubPageLayout";
import { useAuth } from "../../../hooks/useAuth";
import { db } from "../../../db/database";
import { type Equipment, type Muscle } from "../../../types/database.types";
import { ExerciseService } from "../../../services/ExerciseService";

// --- 1. STRICT INTERFACES (UNCHANGED) ---
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

  // Performance optimized filtering
  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    return muscles
      .filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 5);
  }, [searchQuery, muscles]);

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
      <div className="flex flex-col gap-6 pb-40 max-w-2xl mx-auto animate-in fade-in duration-500">
        {/* VISIBILITY SELECTOR - Refined Toggle */}
        <div className="bg-bg-surface p-1 rounded-xl flex relative border border-border-color shadow-sm">
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-bg-main rounded-lg shadow-sm transition-all duration-300 ease-out ${
              form.isPublic ? "translate-x-full" : "translate-x-0"
            }`}
          />
          <button
            onClick={() => setForm({ ...form, isPublic: false })}
            className="flex-1 py-2.5 z-10 flex items-center justify-center gap-2 text-xs font-bold transition-colors"
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
            className="flex-1 py-2.5 z-10 flex items-center justify-center gap-2 text-xs font-bold transition-colors"
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
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase text-text-muted ml-1 tracking-wider">
            Identity
          </label>
          <input
            className="w-full bg-bg-surface border border-border-color p-4 rounded-xl text-text-main font-medium outline-none focus:ring-2 ring-brand-primary/10 transition-all placeholder:opacity-40"
            placeholder="e.g. Zottman Curls"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        {/* SELECTS - Grid for performance & space */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="space-y-3">
          <label className="text-[11px] font-bold uppercase text-text-muted ml-1 tracking-wider">
            Metrics
          </label>
          <div className="flex flex-wrap gap-2">
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
                    className={`px-5 py-2 rounded-lg text-xs font-bold border transition-all duration-200 ${
                      isActive
                        ? "bg-brand-primary border-brand-primary text-bg-main shadow-md"
                        : "bg-bg-surface border-border-color text-text-muted hover:border-text-main"
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
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase text-text-muted ml-1 tracking-wider">
              Biomechanics
            </label>
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                size={18}
              />
              <input
                className="w-full bg-bg-surface border border-border-color p-4 pl-12 rounded-xl text-sm text-text-main outline-none focus:border-text-muted transition-all"
                placeholder="Find target muscle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchResults.length > 0 && (
                <div className="absolute top-[110%] left-0 right-0 bg-bg-surface border border-border-color rounded-xl z-50 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                  {searchResults.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-3 border-b border-border-color/50 last:border-0 hover:bg-bg-main transition-colors"
                    >
                      <span className="text-sm font-semibold text-text-main">
                        {m.name}
                      </span>
                      <div className="flex gap-1.5">
                        <QuickAddBtn
                          label="Pri"
                          className="bg-brand-primary"
                          onClick={() => addMuscle(m.id, "primary")}
                        />
                        <QuickAddBtn
                          label="Sec"
                          className="bg-brand-info"
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

          {/* ACTIVE SELECTIONS */}
          <div className="space-y-3">
            <MuscleTagRow
              label="Primary"
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
              label="Secondary"
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
              colorClass="text-brand-info"
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
        <div className="fixed bottom-8 left-4 right-4 z-40 md:relative md:bottom-0 md:left-0 md:right-0">
          <button
            disabled={isSaving || !form.name || !form.category}
            onClick={handleSave}
            className="w-full py-4 bg-text-main text-bg-main rounded-xl font-bold uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-30"
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Save size={20} />
            )}
            {isSaving ? "Finalizing..." : "Initialize Exercise"}
          </button>
        </div>
      </div>
    </SubPageLayout>
  );
};

// --- REFINED HELPER COMPONENTS ---

interface SelectProps {
  label: string;
  value: string | number;
  options: { id: string | number; name: string }[];
  onChange: (val: string) => void;
}

const CustomSelect = ({ label, value, options, onChange }: SelectProps) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-bold uppercase text-text-muted ml-1 tracking-wider">
      {label}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-bg-surface border border-border-color p-3.5 rounded-xl text-sm font-semibold text-text-main appearance-none outline-none focus:border-text-muted transition-all shadow-sm"
      >
        <option value="">Select...</option>
        {options.map((o) => (
          <option key={o.id} value={o.id.toString()}>
            {o.name}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-main opacity-30 pointer-events-none"
      />
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
    className={`${className} text-[10px] font-bold px-3 py-1.5 rounded-lg text-bg-main shadow hover:brightness-110 active:scale-90 transition-all`}
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
    <div className="space-y-2 animate-in slide-in-from-left-2 duration-300">
      <p
        className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${colorClass}`}
      >
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((id) => (
          <div
            key={id}
            className="flex items-center gap-2 bg-bg-surface border border-border-color px-3 py-1.5 rounded-lg shadow-sm"
          >
            <span className="text-xs font-semibold text-text-main">
              {muscles.find((m) => m.id === id)?.name}
            </span>
            <button
              onClick={() => onRemove(id)}
              className="text-text-muted hover:text-brand-error transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

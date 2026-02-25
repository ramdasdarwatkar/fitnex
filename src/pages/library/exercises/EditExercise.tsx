import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SubPageLayout } from "../../../components/layout/SubPageLayout";
import { LibraryService } from "../../../services/LibraryService";
import { db } from "../../../db/database";
import { type Muscle, type Equipment } from "../../../types/database.types";
import {
  Save,
  Search,
  X,
  Globe,
  Lock,
  ChevronDown,
  Loader2,
} from "lucide-react";
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

// Interface to represent the raw data shape from the DB/Service
interface RawExerciseData {
  id?: string;
  name?: string;
  is_public?: boolean;
  isPublic?: boolean;
  equipment_id?: string | number;
  equipmentId?: string | number;
  category?: string;
  tracking?: (string | null)[];
  primary_muscles?: string[];
  primaryMuscles?: string[];
  secondary_muscles?: string[];
  secondaryMuscles?: string[];
  stabilizer_muscles?: string[];
  stabilizerMuscles?: string[];
}

// --- 2. MAIN COMPONENT ---

export const EditExercise = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [muscles, setMuscles] = useState<Muscle[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

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
    const load = async () => {
      if (!id) return;
      try {
        const [m, e, data] = await Promise.all([
          db.muscles.toArray(),
          db.equipment.toArray(),
          ExerciseService.getExerciseForEdit(id),
        ]);

        const initialData = data as RawExerciseData;
        setMuscles(m);
        setEquipment(e);

        if (initialData) {
          setForm({
            name: initialData.name ?? "",
            isPublic: !!(initialData.isPublic ?? initialData.is_public),
            equipmentId:
              (
                initialData.equipmentId ?? initialData.equipment_id
              )?.toString() ?? "",
            category: initialData.category ?? "",
            tracking: Array.isArray(initialData.tracking)
              ? (initialData.tracking as string[]).filter(Boolean)
              : [],
            primaryMuscles:
              initialData.primaryMuscles ?? initialData.primary_muscles ?? [],
            secondaryMuscles:
              initialData.secondaryMuscles ??
              initialData.secondary_muscles ??
              [],
            stabilizerMuscles:
              initialData.stabilizerMuscles ??
              initialData.stabilizer_muscles ??
              [],
          });
        }
      } catch (err) {
        console.error("Failed to load exercise:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const addMuscle = (
    mId: string,
    role: "primary" | "secondary" | "stabilizer",
  ) => {
    const key = `${role}Muscles` as keyof ExerciseForm;
    const currentList = form[key] as string[];
    if (!currentList.includes(mId)) {
      setForm((prev) => ({ ...prev, [key]: [...currentList, mId] }));
    }
    setSearch("");
  };

  const handleUpdate = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await ExerciseService.updateExercise(id, form);
      navigate(-1);
    } catch (e) {
      console.error("Update failed:", e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <SubPageLayout title="Update Exercise">
      <div className="flex flex-col gap-10 pb-48 px-2 animate-in fade-in duration-500">
        {/* PUBLIC/PRIVATE TOGGLE */}
        <div className="bg-bg-surface p-1.5 rounded-[2.5rem] flex relative border border-border-color shadow-inner">
          <div
            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-bg-main rounded-[2.2rem] shadow-xl transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
              form.isPublic ? "translate-x-full" : "translate-x-0"
            }`}
          />
          <button
            onClick={() => setForm((prev) => ({ ...prev, isPublic: false }))}
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
            onClick={() => setForm((prev) => ({ ...prev, isPublic: true }))}
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

        {/* IDENTITY */}
        <div className="space-y-3 px-1">
          <label className="text-[10px] font-black uppercase text-text-muted ml-6 tracking-[0.3em]">
            Identity
          </label>
          <input
            className="w-full bg-bg-surface border border-border-color p-7 rounded-[3rem] text-text-main font-black uppercase italic outline-none focus:ring-2 ring-brand-primary transition-all shadow-sm"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        </div>

        {/* DROPDOWNS */}
        <div className="grid grid-cols-1 gap-8 px-1">
          <SelectField
            label="Category"
            value={form.category}
            options={muscles.filter((m) => !m.parent)}
            onChange={(v) => setForm((prev) => ({ ...prev, category: v }))}
          />
          <SelectField
            label="Equipment"
            value={form.equipmentId}
            options={equipment}
            onChange={(v) => setForm((prev) => ({ ...prev, equipmentId: v }))}
          />
        </div>

        {/* TRACKING */}
        <div className="space-y-5 px-1">
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
                      setForm((prev) => ({
                        ...prev,
                        tracking: isActive
                          ? prev.tracking.filter((t) => t !== opt)
                          : [...prev.tracking, opt],
                      }))
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

        {/* BIOMECHANICS */}
        <div className="space-y-8 px-1">
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
                placeholder="Modify muscle focus..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search.length > 1 && (
                <div className="absolute top-[110%] left-0 right-0 bg-bg-surface border border-border-color rounded-[2.5rem] z-50 shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-300">
                  {muscles
                    .filter((m) =>
                      m.name.toLowerCase().includes(search.toLowerCase()),
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
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <MuscleRow
              label="Primary Focus"
              items={form.primaryMuscles}
              muscles={muscles}
              onRemove={(id) =>
                setForm((prev) => ({
                  ...prev,
                  primaryMuscles: prev.primaryMuscles.filter((m) => m !== id),
                }))
              }
              color="text-brand-primary"
            />
            <MuscleRow
              label="Secondary Support"
              items={form.secondaryMuscles}
              muscles={muscles}
              onRemove={(id) =>
                setForm((prev) => ({
                  ...prev,
                  secondaryMuscles: prev.secondaryMuscles.filter(
                    (m) => m !== id,
                  ),
                }))
              }
              color="text-blue-500"
            />
          </div>
        </div>

        {/* CTA */}
        <div className="fixed bottom-10 left-6 right-6 z-60">
          <button
            onClick={handleUpdate}
            disabled={saving}
            className="w-full py-7 bg-text-main text-bg-main rounded-[3rem] font-black uppercase italic tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={22} />
            ) : (
              <Save size={22} />
            )}
            Commit Changes
          </button>
        </div>
      </div>
    </SubPageLayout>
  );
};

// --- HELPERS ---

interface SelectProps {
  label: string;
  value: string;
  options: (Muscle | Equipment)[];
  onChange: (val: string) => void;
}

const SelectField = ({ label, value, options, onChange }: SelectProps) => (
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
      <ChevronDown
        className="absolute right-8 top-1/2 -translate-y-1/2 text-text-main pointer-events-none opacity-30"
        size={20}
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
    className={`${className} text-[9px] font-black uppercase px-4 py-2 rounded-xl text-bg-main shadow-lg active:scale-90 transition-all`}
  >
    {label}
  </button>
);

const MuscleRow = ({
  label,
  items,
  muscles,
  onRemove,
  color,
}: {
  label: string;
  items: string[];
  muscles: Muscle[];
  onRemove: (id: string) => void;
  color: string;
}) => {
  if (items.length === 0) return null;
  return (
    <div className="space-y-3 animate-in slide-in-from-left-2 duration-300">
      <span
        className={`text-[10px] font-black uppercase italic tracking-[0.2em] ml-4 ${color}`}
      >
        {label}
      </span>
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

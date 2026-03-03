import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SubPageLayout } from "../../../components/layout/SubPageLayout";
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

// --- TYPES ---

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

const ROLE_TOKENS = {
  primary: {
    label: "Pri",
    color: "var(--brand-primary)",
    glow: "var(--glow-primary)",
  },
  secondary: {
    label: "Sec",
    color: "var(--brand-secondary)",
    glow: "rgba(56,189,248,0.3)",
  },
  stabilizer: {
    label: "Stb",
    color: "var(--brand-streak)",
    glow: "var(--glow-streak)",
  },
} as const;

type MuscleRole = keyof typeof ROLE_TOKENS;

// --- MAIN COMPONENT ---

export const EditExercise = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [muscles, setMuscles] = useState<Muscle[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
        const raw = data as RawExerciseData;
        setMuscles(m);
        setEquipment(e);
        if (raw) {
          setForm({
            name: raw.name ?? "",
            isPublic: !!(raw.isPublic ?? raw.is_public),
            equipmentId:
              (raw.equipmentId ?? raw.equipment_id)?.toString() ?? "",
            category: raw.category ?? "",
            tracking: Array.isArray(raw.tracking)
              ? (raw.tracking as string[]).filter(Boolean)
              : [],
            primaryMuscles: raw.primaryMuscles ?? raw.primary_muscles ?? [],
            secondaryMuscles:
              raw.secondaryMuscles ?? raw.secondary_muscles ?? [],
            stabilizerMuscles:
              raw.stabilizerMuscles ?? raw.stabilizer_muscles ?? [],
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

  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return muscles.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 5);
  }, [searchQuery, muscles]);

  const addMuscle = (mId: string, role: MuscleRole) => {
    const key = `${role}Muscles` as keyof ExerciseForm;
    const current = form[key] as string[];
    if (!current.includes(mId)) {
      setForm((prev) => ({ ...prev, [key]: [...current, mId] }));
    }
    setSearchQuery("");
  };

  const removeMuscle = (mId: string, role: MuscleRole) => {
    const key = `${role}Muscles` as keyof ExerciseForm;
    setForm((prev) => ({
      ...prev,
      [key]: (prev[key] as string[]).filter((m) => m !== mId),
    }));
  };

  const handleUpdate = async () => {
    if (!id || saving || !form.name || !form.category) return;
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

  const saveButton = (
    <button
      disabled={saving || !form.name || !form.category}
      onClick={handleUpdate}
      className="w-full h-16 bg-brand-primary rounded-2xl font-black uppercase italic
                 tracking-[0.25em] flex items-center justify-center gap-3
                 active:scale-[0.98] transition-all disabled:opacity-30"
      style={{
        color: "var(--color-on-brand)",
        boxShadow: "0 4px 24px var(--glow-primary)",
      }}
    >
      {saving ? (
        <Loader2 className="animate-spin" size={22} />
      ) : (
        <Save size={22} strokeWidth={2.5} />
      )}
      <span>{saving ? "Saving..." : "Commit Changes"}</span>
    </button>
  );

  return (
    <SubPageLayout title="Update Exercise" footer={saveButton}>
      <div className="flex flex-col gap-6 pt-2 pb-4 animate-in fade-in duration-500">
        {/* ── VISIBILITY TOGGLE ── */}
        <div className="bg-bg-surface p-1 rounded-2xl flex relative border border-border-color/40 card-glow">
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-bg-main rounded-xl
                        border border-border-color/40 transition-all duration-300 ease-out
                        ${form.isPublic ? "translate-x-[calc(100%+4px)]" : "translate-x-0"}`}
          />
          {[
            { value: false, label: "Private", icon: <Lock size={13} /> },
            { value: true, label: "Public", icon: <Globe size={13} /> },
          ].map(({ value, label, icon }) => {
            const isActive = form.isPublic === value;
            return (
              <button
                key={label}
                onClick={() => setForm({ ...form, isPublic: value })}
                className={`flex-1 py-3 z-10 flex items-center justify-center gap-2
                            text-[10px] font-black uppercase italic tracking-widest
                            transition-colors duration-300
                            ${
                              isActive
                                ? value
                                  ? "text-brand-primary"
                                  : "text-text-main"
                                : "text-text-muted/40"
                            }`}
              >
                {icon}
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* ── NAME ── */}
        <div className="space-y-1.5">
          <FieldLabel>Identity</FieldLabel>
          <input
            className="w-full bg-bg-surface border border-border-color/40 px-5 py-4 rounded-2xl
                       text-text-main font-black italic outline-none text-lg tracking-tight
                       focus:border-brand-primary/40 transition-colors card-glow"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        {/* ── CATEGORY & EQUIPMENT ── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CustomSelect
            label="Category"
            value={form.category}
            options={muscles.filter((m) => !m.parent)}
            onChange={(val) => setForm({ ...form, category: val })}
          />
          <CustomSelect
            label="Equipment"
            value={form.equipmentId}
            options={equipment}
            onChange={(val) => setForm({ ...form, equipmentId: val })}
          />
        </div>

        {/* ── METRICS ── */}
        <div className="space-y-3">
          <FieldLabel>Metrics</FieldLabel>
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
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase italic
                              border transition-all duration-200
                              ${
                                isActive
                                  ? "bg-brand-primary border-transparent scale-[1.03]"
                                  : "bg-bg-surface border-border-color/40 text-text-muted/60 hover:border-brand-primary/30"
                              }`}
                    style={
                      isActive
                        ? {
                            color: "var(--color-on-brand)",
                            boxShadow: "0 2px 10px var(--glow-primary)",
                          }
                        : undefined
                    }
                  >
                    {opt}
                  </button>
                );
              },
            )}
          </div>
        </div>

        {/* ── MUSCLE SEARCH ── */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <FieldLabel>Biomechanics</FieldLabel>
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/40 pointer-events-none"
                size={16}
              />
              <input
                className="w-full bg-bg-surface border border-border-color/40 px-4 py-3.5 pl-11
                           rounded-2xl text-sm font-black italic text-text-main outline-none
                           focus:border-brand-primary/40 transition-colors card-glow"
                placeholder="Find target muscle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchResults.length > 0 && (
                <div
                  className="absolute top-[calc(100%+6px)] left-0 right-0 bg-bg-surface
                             border border-border-color/40 rounded-2xl z-50 overflow-hidden
                             animate-in fade-in slide-in-from-top-1 duration-200"
                  style={{ boxShadow: "0 8px 32px var(--shadow-sm)" }}
                >
                  {searchResults.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between px-4 py-3
                                 border-b border-border-color/10 last:border-0
                                 hover:bg-bg-main transition-colors"
                    >
                      <span className="text-[11px] font-black uppercase italic text-text-main tracking-wide">
                        {m.name}
                      </span>
                      <div className="flex gap-1.5">
                        {(Object.keys(ROLE_TOKENS) as MuscleRole[]).map(
                          (role) => (
                            <button
                              key={role}
                              onClick={() => addMuscle(m.id, role)}
                              className="text-[9px] font-black uppercase italic px-2.5 py-1.5
                                       rounded-lg active:scale-90 transition-all"
                              style={{
                                background: ROLE_TOKENS[role].color,
                                color: "var(--color-on-brand)",
                                boxShadow: `0 0 8px ${ROLE_TOKENS[role].glow}`,
                              }}
                            >
                              {ROLE_TOKENS[role].label}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active selections */}
          <div className="space-y-3">
            {(Object.keys(ROLE_TOKENS) as MuscleRole[]).map((role) => {
              const items = form[`${role}Muscles`] as string[];
              if (items.length === 0) return null;
              return (
                <MuscleTagRow
                  key={role}
                  label={role}
                  items={items}
                  muscles={muscles}
                  color={ROLE_TOKENS[role].color}
                  onRemove={(mId) => removeMuscle(mId, role)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </SubPageLayout>
  );
};

// --- SUB-COMPONENTS ---

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[9.5px] font-black uppercase italic text-text-muted/50 tracking-[0.25em]">
    {children}
  </p>
);

interface SelectProps {
  label: string;
  value: string | number;
  options: { id: string | number; name: string }[];
  onChange: (val: string) => void;
}

const CustomSelect = ({ label, value, options, onChange }: SelectProps) => (
  <div className="space-y-1.5">
    <FieldLabel>{label}</FieldLabel>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-bg-surface border border-border-color/40 px-4 py-3.5 rounded-2xl
                   text-[11px] font-black uppercase italic text-text-main
                   appearance-none outline-none focus:border-brand-primary/40
                   transition-colors card-glow"
      >
        <option value="">Select...</option>
        {options.map((o) => (
          <option key={o.id} value={o.id.toString()}>
            {o.name}
          </option>
        ))}
      </select>
      <ChevronDown
        size={15}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted/40 pointer-events-none"
      />
    </div>
  </div>
);

const MuscleTagRow = ({
  label,
  items,
  muscles,
  color,
  onRemove,
}: {
  label: string;
  items: string[];
  muscles: Muscle[];
  color: string;
  onRemove: (id: string) => void;
}) => (
  <div className="space-y-2 animate-in slide-in-from-left-2 duration-300">
    <p
      className="text-[9px] font-black uppercase italic tracking-widest capitalize"
      style={{ color }}
    >
      {label}
    </p>
    <div className="flex flex-wrap gap-2">
      {items.map((id) => (
        <div
          key={id}
          className="flex items-center gap-2 bg-bg-surface border border-border-color/40
                     px-3 py-1.5 rounded-xl card-glow"
        >
          <span className="text-[10px] font-black uppercase italic text-text-main tracking-tight">
            {muscles.find((m) => m.id === id)?.name ?? id}
          </span>
          <button
            onClick={() => onRemove(id)}
            className="text-text-muted/40 hover:text-brand-danger transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  </div>
);

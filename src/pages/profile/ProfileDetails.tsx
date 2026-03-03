import { useState, useEffect, type ChangeEvent, type ReactNode } from "react";
import { UserProfileService } from "../../services/UserProfileService";
import type { Database, UserProfile } from "../../types/database.types";
import { User, Target, ChevronDown, Save, RefreshCcw } from "lucide-react";
import { SubPageLayout } from "../../components/layout/SubPageLayout";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

type GenderType = Database["public"]["Tables"]["user_profile"]["Row"]["gender"];

interface SectionLabelProps {
  icon: ReactNode;
  title: string;
}

interface SelectInputProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

// --- MAIN COMPONENT ---

export const ProfileDetails = () => {
  const { user_id, athlete } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    gender: "",
    birth_date: "",
    target_weight: "",
    target_days_per_week: "4",
  });

  useEffect(() => {
    if (athlete) {
      setForm({
        name: athlete.name || "",
        gender: athlete.gender
          ? athlete.gender.charAt(0).toUpperCase() +
            athlete.gender.slice(1).toLowerCase()
          : "",
        birth_date: athlete.birthdate || "",
        target_weight: athlete.target_weight?.toString() || "",
        target_days_per_week: athlete.target_days_per_week?.toString() || "4",
      });
    }
  }, [athlete]);

  const onSave = async () => {
    if (!user_id || !athlete || !athlete.created_at || saving) return;
    setSaving(true);
    try {
      const updatedProfile: UserProfile = {
        user_id,
        name: form.name.trim(),
        gender: form.gender.toLowerCase() as GenderType,
        birthdate: form.birth_date,
        target_weight: parseFloat(form.target_weight) || 0,
        target_days_per_week: parseInt(form.target_days_per_week) || 4,
        updated_at: new Date().toISOString(),
        created_at: athlete.created_at,
        role: athlete.role,
      };
      await UserProfileService.updateProfile(updatedProfile);
      navigate(-1);
    } catch (err: unknown) {
      console.error("Profile update failed:", err);
      alert("Failed to update profile settings.");
    } finally {
      setSaving(false);
    }
  };

  // Passed to SubPageLayout footer prop — sits outside the scroll area, above safe area
  const saveButton = (
    <button
      disabled={saving}
      onClick={onSave}
      className="w-full h-16 bg-brand-primary rounded-2xl
                 text-base font-black uppercase italic tracking-[0.25em]
                 flex items-center justify-center gap-3
                 active:scale-[0.98] transition-all disabled:opacity-30"
      style={{
        color: "var(--color-on-brand)",
        boxShadow: "0 4px 24px var(--glow-primary)",
      }}
    >
      {saving ? (
        <RefreshCcw size={22} className="animate-spin" />
      ) : (
        <Save size={22} strokeWidth={2.5} />
      )}
      <span>{saving ? "Syncing..." : "Commit Changes"}</span>
    </button>
  );

  return (
    <SubPageLayout title="Athlete Identity" footer={saveButton}>
      <div className="space-y-8 pt-2 pb-4 animate-in fade-in duration-500">
        {/* ── IDENTITY ── */}
        <section className="space-y-3">
          <SectionLabel icon={<User size={13} />} title="Core Identity" />

          {/* Name */}
          <div
            className="bg-bg-surface border border-border-color/40 rounded-2xl px-5 pt-4 pb-5
                          card-glow focus-within:border-brand-primary/40 transition-colors"
          >
            <p className="text-[9px] font-black text-text-muted/50 uppercase tracking-[0.3em] italic mb-2">
              Full Athlete Name
            </p>
            <input
              type="text"
              value={form.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setForm({ ...form, name: e.target.value })
              }
              className="bg-transparent border-none outline-none text-3xl font-black italic
                         text-text-main w-full placeholder:text-text-muted/15
                         uppercase tracking-tighter"
              placeholder="Alex Stevens"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SelectInput
              label="Gender"
              value={form.gender}
              options={["Male", "Female", "Other"]}
              onChange={(v) => setForm({ ...form, gender: v })}
            />
            {/* Birth date */}
            <div
              className="bg-bg-surface border border-border-color/40 rounded-2xl px-5 pt-4 pb-5
                            card-glow focus-within:border-brand-primary/40 transition-colors"
            >
              <p className="text-[9px] font-black text-text-muted/50 uppercase tracking-[0.3em] italic mb-2">
                Birth Date
              </p>
              <input
                type="date"
                value={form.birth_date}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, birth_date: e.target.value })
                }
                className="bg-transparent border-none outline-none text-sm font-black
                           uppercase italic text-text-main w-full dark:invert-[0.8] cursor-pointer"
              />
            </div>
          </div>
        </section>

        {/* ── GOALS ── */}
        <section className="space-y-3">
          <SectionLabel
            icon={<Target size={13} />}
            title="Biometric Objectives"
          />

          <div className="grid grid-cols-2 gap-3">
            {/* Target weight */}
            <div
              className="bg-bg-surface border border-border-color/40 rounded-2xl px-5 pt-4 pb-5
                            card-glow focus-within:border-brand-primary/40 transition-colors"
            >
              <p className="text-[9px] font-black text-text-muted/50 uppercase tracking-[0.3em] italic mb-2">
                Target Mass
              </p>
              <div className="flex items-baseline gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.target_weight}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, target_weight: e.target.value })
                  }
                  className="bg-transparent border-none outline-none text-3xl font-black italic
                             text-text-main w-20 tabular-nums tracking-tighter
                             placeholder:text-text-muted/15"
                  placeholder="00.0"
                />
                <span className="text-brand-primary font-black italic text-xs uppercase tracking-widest">
                  kg
                </span>
              </div>
            </div>

            <SelectInput
              label="Weekly Days"
              value={form.target_days_per_week}
              options={["1", "2", "3", "4", "5", "6", "7"]}
              onChange={(v) => setForm({ ...form, target_days_per_week: v })}
            />
          </div>
        </section>
      </div>
    </SubPageLayout>
  );
};

// --- SUB-COMPONENTS ---

const SectionLabel = ({ icon, title }: SectionLabelProps) => (
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-1 shrink-0">
      <div
        className="w-1.5 h-1.5 rounded-full bg-brand-primary"
        style={{ boxShadow: "0 0 6px 1px var(--glow-primary)" }}
      />
      <div className="w-1 h-1 rounded-full bg-brand-primary/30" />
    </div>
    <div className="flex items-center gap-2">
      <span className="text-brand-primary/60">{icon}</span>
      <span className="text-[9.5px] font-black uppercase tracking-[0.35em] text-text-muted/50 italic whitespace-nowrap">
        {title}
      </span>
    </div>
    <div
      className="h-px flex-1"
      style={{
        background:
          "linear-gradient(to right, var(--border-color), transparent)",
        opacity: 0.4,
      }}
    />
  </div>
);

const SelectInput = ({ label, value, options, onChange }: SelectInputProps) => (
  <div
    className="bg-bg-surface border border-border-color/40 rounded-2xl px-5 pt-4 pb-5
                  card-glow focus-within:border-brand-primary/40 transition-colors group"
  >
    <p className="text-[9px] font-black text-text-muted/50 uppercase tracking-[0.3em] italic mb-2">
      {label}
    </p>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border-none outline-none text-xl font-black italic
                   text-text-main w-full appearance-none pr-7 cursor-pointer
                   relative z-10 uppercase tracking-tighter"
      >
        <option value="" disabled>
          Select
        </option>
        {options.map((opt) => (
          <option
            key={opt}
            value={opt}
            className="bg-bg-surface text-text-main"
          >
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="absolute right-0 top-1/2 -translate-y-1/2 text-text-muted/40
                   group-hover:text-brand-primary transition-colors pointer-events-none"
      />
    </div>
  </div>
);

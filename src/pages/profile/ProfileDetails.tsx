import { useState, useEffect, type ChangeEvent, type ReactNode } from "react";
import { UserProfileService } from "../../services/UserProfileService";
import type { Database, UserProfile } from "../../types/database.types";
import { User, Target, ChevronDown, Save, RefreshCcw } from "lucide-react";
import { SubPageLayout } from "../../components/layout/SubPageLayout";
import { useAuth } from "../../hooks/useAuth";

type GenderType = Database["public"]["Tables"]["user_profile"]["Row"]["gender"];

interface SectionHeaderProps {
  icon: ReactNode;
  title: string;
}

interface SelectInputProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

export const ProfileDetails = () => {
  const { user_id, athlete } = useAuth();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    gender: "",
    birth_date: "",
    target_weight: "",
    target_days_per_week: "4",
  });

  // Sync form with the athlete data whenever it updates reactively
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
    // Explicit check to ensure athlete and its required fields are present
    if (!user_id || !athlete || !athlete.created_at || saving) return;

    setSaving(true);

    try {
      /**
       * 1. Construct the payload strictly as UserProfile
       * We spread 'athlete' first, then override with form values.
       * We explicitly re-state 'created_at' to satisfy strict TS requirements.
       */
      const updatedProfile: UserProfile = {
        ...athlete,
        name: form.name.trim(),
        gender: form.gender.toLowerCase() as GenderType,
        birthdate: form.birth_date,
        target_weight: parseFloat(form.target_weight) || 0,
        target_days_per_week: parseInt(form.target_days_per_week) || 4,
        updated_at: new Date().toISOString(),
        created_at: athlete.created_at, // Explicitly mapped to resolve missing property error
      };

      /**
       * 2. Persist to Dexie
       * This triggers a reactive update via useLiveQuery in your AuthContext/Hook.
       */
      await UserProfileService.updateProfile(updatedProfile);

      // Feedback for the user
      console.log("Profile updated successfully");
    } catch (err: unknown) {
      console.error("Profile update failed:", err);
      alert("Failed to update profile settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SubPageLayout title="User Profile">
      <div className="flex-1 flex flex-col space-y-8 pb-32 bg-bg-main animate-in fade-in duration-500">
        {/* IDENTITY SECTION */}
        <section className="space-y-4">
          <SectionHeader icon={<User size={14} />} title="Identity" />

          <div className="bg-bg-surface border border-border-color p-6 rounded-4xl shadow-sm">
            <p className="text-[10px] font-black text-text-muted uppercase mb-3 tracking-[0.2em] ml-1">
              Full Athlete Name
            </p>
            <input
              type="text"
              value={form.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setForm({ ...form, name: e.target.value })
              }
              className="bg-transparent border-none outline-none text-2xl font-black italic text-text-main w-full placeholder:text-text-muted/20 uppercase tracking-tighter"
              placeholder="Full Name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SelectInput
              label="Gender"
              value={form.gender}
              options={["Male", "Female", "Other"]}
              onChange={(v) => setForm({ ...form, gender: v })}
            />

            <div className="bg-bg-surface border border-border-color p-6 rounded-4xl shadow-sm">
              <p className="text-[10px] font-black text-text-muted uppercase mb-3 tracking-[0.2em] ml-1">
                Birth Date
              </p>
              <input
                type="date"
                value={form.birth_date}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, birth_date: e.target.value })
                }
                className="bg-transparent border-none outline-none text-sm font-black uppercase text-text-main w-full dark:invert-[0.8] cursor-pointer"
              />
            </div>
          </div>
        </section>

        {/* GOALS SECTION */}
        <section className="space-y-4">
          <SectionHeader icon={<Target size={14} />} title="Goals" />

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-bg-surface border border-border-color p-6 rounded-4xl shadow-sm">
              <p className="text-[10px] font-black text-text-muted uppercase mb-3 tracking-[0.2em] ml-1">
                Target Weight
              </p>
              <div className="flex items-baseline gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.target_weight}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, target_weight: e.target.value })
                  }
                  className="bg-transparent border-none outline-none text-2xl font-black italic text-text-main w-16 tabular-nums"
                  placeholder="00"
                />
                <span className="text-brand-primary font-black italic text-xs uppercase">
                  kg
                </span>
              </div>
            </div>

            <SelectInput
              label="Days / Week"
              value={form.target_days_per_week}
              options={["1", "2", "3", "4", "5", "6", "7"]}
              onChange={(v) => setForm({ ...form, target_days_per_week: v })}
            />
          </div>
        </section>

        {/* ACTION BUTTON */}
        <div className="pt-4 px-2">
          <button
            disabled={saving}
            onClick={onSave}
            className="w-full py-6 bg-brand-primary text-black text-base font-black uppercase italic tracking-widest rounded-4xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-30 shadow-xl shadow-brand-primary/20"
          >
            {saving ? (
              <RefreshCcw size={20} className="animate-spin" />
            ) : (
              <Save size={20} />
            )}
            <span>{saving ? "Updating..." : "Update Profile"}</span>
          </button>
        </div>

        <div className="flex-1" />
      </div>
    </SubPageLayout>
  );
};

/* --- UI SUB-COMPONENTS --- */

const SectionHeader = ({ icon, title }: SectionHeaderProps) => (
  <div className="flex items-center gap-2 mb-1 px-3 font-black uppercase tracking-[0.2em] text-[10px] text-text-muted italic">
    <div className="text-brand-primary">{icon}</div>
    {title}
  </div>
);

const SelectInput = ({ label, value, options, onChange }: SelectInputProps) => (
  <div className="bg-bg-surface border border-border-color p-6 rounded-4xl relative shadow-sm group">
    <p className="text-[10px] font-black text-text-muted uppercase mb-3 tracking-[0.2em] ml-1">
      {label}
    </p>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border-none outline-none text-xl font-black italic text-text-main w-full appearance-none pr-10 cursor-pointer relative z-10"
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
        className="absolute right-0 top-1/2 -translate-y-1/2 text-text-muted opacity-40 group-hover:text-brand-primary group-hover:opacity-100 transition-all pointer-events-none"
      />
    </div>
  </div>
);

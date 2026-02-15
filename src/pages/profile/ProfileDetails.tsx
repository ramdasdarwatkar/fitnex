import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { UserProfileService } from "../../services/UserProfileService";
import type { Database } from "../../types/database.types";
import { User, Target, ChevronDown, Save, RefreshCcw } from "lucide-react";
import { SubPageLayout } from "../../components/layout/SubPageLayout";

type ProfileInsert = Database["public"]["Tables"]["user_profile"]["Insert"];
type GenderType = Database["public"]["Tables"]["user_profile"]["Row"]["gender"];

export const ProfileDetails = () => {
  const { user_id, athlete, refreshAthlete } = useAuth();
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
        gender: athlete.gender || "",
        birth_date: athlete.birthdate || "",
        target_weight: athlete.target_weight?.toString() || "",
        target_days_per_week: athlete.target_days_per_week?.toString() || "4",
      });
    }
  }, [athlete]);

  const onSave = async () => {
    if (!user_id) return;
    setSaving(true);

    const payload: ProfileInsert = {
      user_id,
      name: form.name,
      gender: form.gender as GenderType,
      birthdate: form.birth_date,
      target_weight: parseFloat(form.target_weight) || 0,
      target_days_per_week: parseInt(form.target_days_per_week) || 4,
      updated_at: new Date().toISOString(),
    };

    try {
      await UserProfileService.updateProfile(payload);
      await refreshAthlete();
    } catch (err) {
      console.error("Profile sync error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SubPageLayout title="User Profile">
      <div className="space-y-8 pb-32 px-1 bg-[var(--bg-main)]">
        <section className="space-y-4">
          <SectionHeader icon={<User size={14} />} title="Identity" />
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-5 rounded-[1.5rem]">
            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-2 tracking-widest">
              Full Athlete Name
            </p>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-transparent border-none outline-none text-2xl font-black italic text-[var(--text-main)] w-full placeholder:text-[var(--text-dim)]"
              placeholder="Full Name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SelectInput
              label="Gender"
              value={form.gender}
              options={["Male", "Female", "Other"]}
              onChange={(v: string) => setForm({ ...form, gender: v })}
            />
            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-5 rounded-[1.5rem]">
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-2 tracking-widest">
                Birth Date
              </p>
              <input
                type="date"
                value={form.birth_date}
                onChange={(e) =>
                  setForm({ ...form, birth_date: e.target.value })
                }
                className="bg-transparent border-none outline-none text-sm font-black uppercase text-[var(--text-main)] w-full invert-[0.8]"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader icon={<Target size={14} />} title="Goals" />
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-5 rounded-[1.5rem]">
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-2 tracking-widest">
                Target Weight
              </p>
              <div className="flex items-baseline gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.target_weight}
                  onChange={(e) =>
                    setForm({ ...form, target_weight: e.target.value })
                  }
                  className="bg-transparent border-none outline-none text-2xl font-black italic text-[var(--text-main)] w-16"
                  placeholder="00"
                />
                <span className="text-[var(--brand-primary)] font-black italic text-xs uppercase">
                  kg
                </span>
              </div>
            </div>

            <SelectInput
              label="Days / Week"
              value={form.target_days_per_week}
              options={["1", "2", "3", "4", "5", "6", "7"]}
              onChange={(v: string) =>
                setForm({ ...form, target_days_per_week: v })
              }
            />
          </div>
        </section>

        <div className="pt-4">
          <button
            disabled={saving}
            onClick={onSave}
            className="w-full py-4 bg-[var(--brand-primary)] text-[var(--bg-main)] text-base font-black uppercase italic tracking-[0.1em] rounded-[1.5rem] flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-50"
          >
            {saving ? (
              <RefreshCcw size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {saving ? "Updating..." : "Update Profile"}
          </button>
        </div>
      </div>
    </SubPageLayout>
  );
};

const SectionHeader = ({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) => (
  <div className="flex items-center gap-2 mb-3 px-2 font-black uppercase tracking-[0.2em] text-[10px] text-[var(--text-muted)]">
    <div className="text-[var(--brand-primary)]">{icon}</div>
    {title}
  </div>
);

const SelectInput = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) => (
  <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-5 rounded-[1.5rem] relative">
    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-2 tracking-widest">
      {label}
    </p>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent border-none outline-none text-xl font-black italic text-[var(--text-main)] w-full appearance-none pr-8 cursor-pointer"
    >
      {!value && <option value=""></option>}
      {options.map((opt) => (
        <option key={opt} value={opt} className="bg-black text-white">
          {opt}
        </option>
      ))}
    </select>
    <ChevronDown
      size={14}
      className="absolute right-5 bottom-6 text-[var(--text-dim)] pointer-events-none"
    />
  </div>
);

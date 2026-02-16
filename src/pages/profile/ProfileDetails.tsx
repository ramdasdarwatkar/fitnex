import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { UserProfileService } from "../../services/UserProfileService";
import type { Database } from "../../types/database.types";
import { User, Target, ChevronDown, Save, RefreshCcw } from "lucide-react";
import { SubPageLayout } from "../../components/layout/SubPageLayout";

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
        // Normalizing casing so "female" matches "Female" in the dropdown
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
    if (!user_id) return;
    setSaving(true);

    try {
      await UserProfileService.updateProfile({
        user_id,
        name: form.name,
        gender: form.gender.toLowerCase() as GenderType,
        birthdate: form.birth_date,
        target_weight: parseFloat(form.target_weight) || 0,
        target_days_per_week: parseInt(form.target_days_per_week) || 4,
      });
      await refreshAthlete();
    } catch (err) {
      console.error("Profile sync error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SubPageLayout title="User Profile">
      <div className="flex-1 flex flex-col space-y-8 pb-32 bg-[var(--bg-main)]">
        {/* IDENTITY SECTION */}
        <section className="space-y-4">
          <SectionHeader icon={<User size={14} />} title="Identity" />

          <div className="bg-[var(--bg-surface)] border border-slate-800 p-5 rounded-[1.5rem]">
            <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">
              Full Athlete Name
            </p>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-transparent border-none outline-none text-2xl font-black italic text-[var(--text-main)] w-full placeholder:text-slate-700"
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

            <div className="bg-[var(--bg-surface)] border border-slate-800 p-5 rounded-[1.5rem]">
              <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">
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

        {/* GOALS SECTION */}
        <section className="space-y-4">
          <SectionHeader icon={<Target size={14} />} title="Goals" />

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--bg-surface)] border border-slate-800 p-5 rounded-[1.5rem]">
              <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">
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

        {/* ACTION BUTTON */}
        <div className="pt-4">
          <button
            disabled={saving}
            onClick={onSave}
            className="w-full py-4 bg-[var(--brand-primary)] text-black text-base font-black uppercase italic tracking-[0.1em] rounded-[1.5rem] flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-50 shadow-lg shadow-[var(--brand-primary)]/20"
          >
            {saving ? (
              <RefreshCcw size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {saving ? "Updating..." : "Update Profile"}
          </button>
        </div>

        {/* SPRING SPACER */}
        <div className="flex-1" />
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
  <div className="flex items-center gap-2 mb-3 px-2 font-black uppercase tracking-[0.2em] text-[10px] text-slate-500">
    <div className="text-[var(--brand-primary)]">{icon}</div>
    {title}
  </div>
);

const SelectInput = ({ label, value, options, onChange }: any) => (
  <div className="bg-[var(--bg-surface)] border border-slate-800 p-5 rounded-[1.5rem] relative">
    <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">
      {label}
    </p>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent border-none outline-none text-xl font-black italic text-[var(--text-main)] w-full appearance-none pr-8 cursor-pointer relative z-10"
    >
      <option value="" disabled>
        Select
      </option>
      {options.map((opt: string) => (
        <option key={opt} value={opt} className="bg-black text-white">
          {opt}
        </option>
      ))}
    </select>
    <ChevronDown
      size={14}
      className="absolute right-5 bottom-6 text-slate-600 pointer-events-none"
    />
  </div>
);

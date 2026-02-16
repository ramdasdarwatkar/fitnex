import { useState, useEffect } from "react";
import { SubPageLayout } from "../../components/layout/SubPageLayout";
import { useAuth } from "../../context/AuthContext";
import { BodyMetricsService } from "../../services/BodyMetricsService";
import type { Database } from "../../types/database.types";
import {
  Scale,
  Ruler,
  Activity,
  Dumbbell,
  Save,
  RefreshCcw,
  GitCompare,
} from "lucide-react";

type BodyMetricsInsert = Database["public"]["Tables"]["body_metrics"]["Insert"];

interface MetricsState {
  weight: string;
  height: string;
  belly: string;
  waist: string;
  hips: string;
  chest: string;
  shoulder: string;
  neck: string;
  right_bicep: string;
  left_bicep: string;
  right_forearm: string;
  left_forearm: string;
  right_calf: string;
  left_calf: string;
  right_thigh: string;
  left_thigh: string;
  [key: string]: string;
}

const INITIAL_METRICS: MetricsState = {
  weight: "",
  height: "",
  belly: "",
  waist: "",
  hips: "",
  chest: "",
  shoulder: "",
  neck: "",
  right_bicep: "",
  left_bicep: "",
  right_forearm: "",
  left_forearm: "",
  right_calf: "",
  left_calf: "",
  right_thigh: "",
  left_thigh: "",
};

export const ProfileMetrics = () => {
  const { user_id, refreshAthlete } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [metrics, setMetrics] = useState<MetricsState>(INITIAL_METRICS);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await BodyMetricsService.getLatestMetrics();
        if (data) {
          const formatted: MetricsState = { ...INITIAL_METRICS };
          Object.keys(INITIAL_METRICS).forEach((key) => {
            const val = (data as any)[key];
            formatted[key] = val != null ? val.toString() : "";
          });
          setMetrics(formatted);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleUpdate = (key: keyof MetricsState, value: string) => {
    if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setMetrics((prev) => ({ ...prev, [key]: value }));
    }
  };

  const onSave = async () => {
    if (!user_id) return;
    setSaving(true);

    const payload: BodyMetricsInsert = {
      user_id,
      logdate: new Date().toISOString().split("T")[0],
      weight: parseFloat(metrics.weight) || 0,
      height: parseFloat(metrics.height) || 0,
    };

    Object.keys(INITIAL_METRICS).forEach((key) => {
      if (key === "weight" || key === "height") return;
      const val = metrics[key];
      (payload as any)[key] = val === "" ? null : parseFloat(val);
    });

    try {
      await BodyMetricsService.updateMetrics(payload);
      await refreshAthlete();
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <SubPageLayout title="Measurements">
        <div className="flex h-60 items-center justify-center">
          <RefreshCcw
            className="animate-spin text-[var(--brand-primary)]"
            size={28}
          />
        </div>
      </SubPageLayout>
    );

  return (
    <SubPageLayout title="Measurements">
      {/* min-h-full + flex-col to force background to bottom */}
      <div className="flex-1 flex flex-col space-y-10 bg-[var(--bg-main)]">
        <section>
          <SectionHeader icon={<Activity size={16} />} title="Core Vitals" />
          <div className="grid grid-cols-2 gap-4">
            <CompactInput
              label="Weight"
              value={metrics.weight}
              unit="kg"
              icon={<Scale size={16} />}
              onChange={(v: string) => handleUpdate("weight", v)}
            />
            <CompactInput
              label="Height"
              value={metrics.height}
              unit="cm"
              icon={<Ruler size={16} />}
              onChange={(v: string) => handleUpdate("height", v)}
            />
          </div>
        </section>

        <section>
          <SectionHeader icon={<Dumbbell size={16} />} title="Torso" />
          <div className="grid grid-cols-3 gap-3">
            {(
              ["neck", "shoulder", "chest", "belly", "waist", "hips"] as const
            ).map((key) => (
              <MiniInput
                key={key}
                label={key}
                value={metrics[key]}
                onChange={(v: string) => handleUpdate(key, v)}
              />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            icon={<GitCompare size={16} />}
            title="Limb Symmetry"
          />
          <div className="space-y-4">
            {[
              { label: "Bicep", l: "left_bicep", r: "right_bicep" },
              { label: "Forearm", l: "left_forearm", r: "right_forearm" },
              { label: "Thigh", l: "left_thigh", r: "right_thigh" },
              { label: "Calf", l: "left_calf", r: "right_calf" },
            ].map((row) => (
              <SymmetryRow
                key={row.label}
                label={row.label}
                leftKey={row.l}
                rightKey={row.r}
                metrics={metrics}
                onUpdate={(k: string, v: string) =>
                  handleUpdate(k as keyof MetricsState, v)
                }
              />
            ))}
          </div>
        </section>

        <div className="pt-6">
          <button
            disabled={saving}
            onClick={onSave}
            className="w-full py-4 bg-[var(--brand-primary)] text-black text-base font-black uppercase italic tracking-[0.1em] rounded-[1.5rem] flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-50 shadow-lg shadow-[var(--brand-primary)]/20"
          >
            {saving ? (
              <RefreshCcw size={22} className="animate-spin" />
            ) : (
              <Save size={22} />
            )}
            {saving ? "Updating..." : "Update Athlete Data"}
          </button>
        </div>

        {/* SPRING SPACER */}
        <div className="flex-1" />
      </div>
    </SubPageLayout>
  );
};

// Internal Components
const SectionHeader = ({ icon, title }: any) => (
  <div className="flex items-center gap-3 mb-5 px-2 font-black uppercase tracking-[0.25em] text-[12px] text-slate-500">
    <div className="text-[var(--brand-primary)]">{icon}</div>
    {title}
  </div>
);

const CompactInput = ({ label, value, unit, icon, onChange }: any) => (
  <div className="bg-[var(--bg-surface)] border border-slate-800 p-5 rounded-[2rem]">
    <div className="flex justify-between items-start mb-3 text-[var(--brand-primary)]">
      {icon}
      <span className="text-[10px] font-black text-slate-600">{unit}</span>
    </div>
    <input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent border-none outline-none text-2xl font-black italic text-[var(--text-main)] w-full placeholder:text-slate-800"
      placeholder="0.0"
    />
    <p className="text-[11px] font-bold text-slate-500 uppercase mt-1.5">
      {label}
    </p>
  </div>
);

const MiniInput = ({ label, value, onChange }: any) => (
  <div className="bg-[var(--bg-surface)] border border-slate-800 p-4 rounded-[1.5rem] text-center">
    <p className="text-[9px] font-black text-slate-600 uppercase mb-2">
      {label}
    </p>
    <input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent border-none outline-none text-base font-black italic text-[var(--text-main)] w-full text-center placeholder:text-slate-800"
      placeholder="—"
    />
  </div>
);

const SymmetryRow = ({ label, leftKey, rightKey, metrics, onUpdate }: any) => (
  <div className="flex items-center gap-4">
    <div className="w-20 text-[11px] font-black uppercase text-slate-500 italic">
      {label}
    </div>
    <div className="flex-1 grid grid-cols-2 gap-3">
      <input
        type="text"
        inputMode="decimal"
        value={metrics[leftKey]}
        onChange={(e) => onUpdate(leftKey, e.target.value)}
        className="w-full bg-[var(--bg-surface)] border border-slate-800 p-4 rounded-2xl text-sm font-black italic text-[var(--text-main)] text-center placeholder:text-slate-800"
        placeholder="L"
      />
      <input
        type="text"
        inputMode="decimal"
        value={metrics[rightKey]}
        onChange={(e) => onUpdate(rightKey, e.target.value)}
        className="w-full bg-[var(--bg-surface)] border border-slate-800 p-4 rounded-2xl text-sm font-black italic text-[var(--text-main)] text-center placeholder:text-slate-800"
        placeholder="R"
      />
    </div>
  </div>
);

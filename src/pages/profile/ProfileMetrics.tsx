import { useState, useEffect, type ReactNode, type ChangeEvent } from "react";
import { SubPageLayout } from "../../components/layout/SubPageLayout";
import { useAuth } from "../../hooks/useAuth";
import { BodyMetricsService } from "../../services/BodyMetricsService";
import type { BodyMetrics } from "../../types/database.types";
import {
  Scale,
  Ruler,
  Activity,
  Dumbbell,
  Save,
  GitCompare,
  Loader2,
} from "lucide-react";

// 1. Define Strict State Interface
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
  [key: string]: string; // Necessary for dynamic mapping
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

// 2. Sub-Component Interfaces
interface InputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  icon?: ReactNode;
}

interface SymmetryRowProps {
  label: string;
  leftKey: string;
  rightKey: string;
  metrics: MetricsState;
  onUpdate: (k: string, v: string) => void;
}

export const ProfileMetrics = () => {
  const { user_id } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [metrics, setMetrics] = useState<MetricsState>(INITIAL_METRICS);
  const [rawLatest, setRawLatest] = useState<BodyMetrics | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const data = await BodyMetricsService.getLatestMetrics();
        if (isMounted && data) {
          setRawLatest(data);
          const formatted: MetricsState = { ...INITIAL_METRICS };

          // Typed Mapping: avoid 'any' by casting to Record
          const rawData = data as unknown as Record<
            string,
            string | number | null
          >;
          Object.keys(INITIAL_METRICS).forEach((key) => {
            const val = rawData[key];
            formatted[key] = val != null ? val.toString() : "";
          });
          setMetrics(formatted);
        }
      } catch (err: unknown) {
        console.error("Failed to load metrics:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdate = (key: keyof MetricsState, value: string) => {
    if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setMetrics((prev) => ({ ...prev, [key]: value }));
    }
  };

  const onSave = async () => {
    if (!user_id || saving) return;
    setSaving(true);

    try {
      const now = new Date().toISOString();

      const payload: BodyMetrics = {
        ...(rawLatest || {}),
        user_id,
        logdate: now.split("T")[0],
        updated_at: now,
        created_at: rawLatest?.created_at || now,

        weight: parseFloat(metrics.weight) || 0,
        height: parseFloat(metrics.height) || 0,
        belly: metrics.belly ? parseFloat(metrics.belly) : null,
        waist: metrics.waist ? parseFloat(metrics.waist) : null,
        hips: metrics.hips ? parseFloat(metrics.hips) : null,
        chest: metrics.chest ? parseFloat(metrics.chest) : null,
        shoulder: metrics.shoulder ? parseFloat(metrics.shoulder) : null,
        neck: metrics.neck ? parseFloat(metrics.neck) : null,
        right_bicep: metrics.right_bicep
          ? parseFloat(metrics.right_bicep)
          : null,
        left_bicep: metrics.left_bicep ? parseFloat(metrics.left_bicep) : null,
        right_forearm: metrics.right_forearm
          ? parseFloat(metrics.right_forearm)
          : null,
        left_forearm: metrics.left_forearm
          ? parseFloat(metrics.left_forearm)
          : null,
        right_calf: metrics.right_calf ? parseFloat(metrics.right_calf) : null,
        left_calf: metrics.left_calf ? parseFloat(metrics.left_calf) : null,
        right_thigh: metrics.right_thigh
          ? parseFloat(metrics.right_thigh)
          : null,
        left_thigh: metrics.left_thigh ? parseFloat(metrics.left_thigh) : null,
      } as BodyMetrics;

      await BodyMetricsService.updateMetrics(payload);
    } catch (err: unknown) {
      console.error("Save metrics error:", err);
      alert("Failed to save measurements.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-bg-main pb-40">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );

  return (
    <SubPageLayout title="Measurements">
      <div className="flex-1 flex flex-col space-y-10 bg-bg-main animate-in fade-in duration-500">
        <section>
          <SectionHeader icon={<Activity size={16} />} title="Core Vitals" />
          <div className="grid grid-cols-2 gap-4">
            <CompactInput
              label="Weight"
              value={metrics.weight}
              unit="kg"
              icon={<Scale size={16} />}
              onChange={(v) => handleUpdate("weight", v)}
            />
            <CompactInput
              label="Height"
              value={metrics.height}
              unit="cm"
              icon={<Ruler size={16} />}
              onChange={(v) => handleUpdate("height", v)}
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
                onChange={(v) => handleUpdate(key, v)}
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
                onUpdate={(k, v) => handleUpdate(k as keyof MetricsState, v)}
              />
            ))}
          </div>
        </section>

        <div className="pt-6">
          <button
            disabled={saving}
            onClick={onSave}
            className="w-full py-6 bg-brand-primary text-black text-base font-black uppercase italic tracking-widest rounded-4xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-30 shadow-xl shadow-brand-primary/20"
          >
            {saving ? (
              <Loader2 size={22} className="animate-spin" />
            ) : (
              <Save size={22} />
            )}
            <span>{saving ? "Updating..." : "Update Athlete Data"}</span>
          </button>
        </div>
      </div>
    </SubPageLayout>
  );
};

/* --- CLEANED SUB-COMPONENTS --- */

const SectionHeader = ({ icon, title }: { icon: ReactNode; title: string }) => (
  <div className="flex items-center gap-3 mb-5 px-3 font-black uppercase tracking-[0.25em] text-[10px] text-text-muted italic">
    <div className="text-brand-primary">{icon}</div>
    {title}
  </div>
);

const CompactInput = ({ label, value, unit, icon, onChange }: InputProps) => (
  <div className="bg-bg-surface border border-border-color p-5 rounded-[2.2rem] shadow-sm">
    <div className="flex justify-between items-start mb-4 text-brand-primary">
      <div className="p-2 bg-bg-main rounded-xl border border-border-color/50">
        {icon}
      </div>
      <span className="text-[10px] font-black text-text-muted opacity-50 uppercase">
        {unit}
      </span>
    </div>
    <input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      className="bg-transparent border-none outline-none text-3xl font-black italic text-text-main w-full tabular-nums"
      placeholder="0.0"
    />
    <p className="text-[11px] font-bold text-text-muted uppercase mt-2 tracking-tighter">
      {label}
    </p>
  </div>
);

const MiniInput = ({ label, value, onChange }: InputProps) => (
  <div className="bg-bg-surface border border-border-color p-4 rounded-[1.8rem] text-center shadow-sm">
    <p className="text-[9px] font-black text-text-muted uppercase mb-2 opacity-60">
      {label}
    </p>
    <input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      className="bg-transparent border-none outline-none text-base font-black italic text-text-main w-full text-center tabular-nums"
      placeholder="—"
    />
  </div>
);

const SymmetryRow = ({
  label,
  leftKey,
  rightKey,
  metrics,
  onUpdate,
}: SymmetryRowProps) => (
  <div className="flex items-center gap-4 px-1">
    <div className="w-16 text-[10px] font-black uppercase text-text-muted italic opacity-80">
      {label}
    </div>
    <div className="flex-1 grid grid-cols-2 gap-3">
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={metrics[leftKey]}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onUpdate(leftKey, e.target.value)
          }
          className="w-full bg-bg-surface border border-border-color p-4 rounded-2xl text-sm font-black italic text-text-main text-center"
          placeholder="0.0"
        />
        <span className="absolute left-3 top-1 text-[7px] font-black text-text-muted opacity-30">
          L
        </span>
      </div>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={metrics[rightKey]}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onUpdate(rightKey, e.target.value)
          }
          className="w-full bg-bg-surface border border-border-color p-4 rounded-2xl text-sm font-black italic text-text-main text-center"
          placeholder="0.0"
        />
        <span className="absolute right-3 top-1 text-[7px] font-black text-text-muted opacity-30">
          R
        </span>
      </div>
    </div>
  </div>
);

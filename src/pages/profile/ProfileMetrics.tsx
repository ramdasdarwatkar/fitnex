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
  RefreshCcw,
} from "lucide-react";
import { DateUtils } from "../../util/dateUtils";

// --- TYPES ---

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

const TORSO_KEYS = [
  "neck",
  "shoulder",
  "chest",
  "belly",
  "waist",
  "hips",
] as const;

const LIMB_ROWS = [
  { label: "Bicep", l: "left_bicep", r: "right_bicep" },
  { label: "Forearm", l: "left_forearm", r: "right_forearm" },
  { label: "Thigh", l: "left_thigh", r: "right_thigh" },
  { label: "Calf", l: "left_calf", r: "right_calf" },
];

// --- MAIN COMPONENT ---

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
        const data = await BodyMetricsService.getLocalMetrics();
        if (isMounted && data) {
          setRawLatest(data);
          const rawData = data as unknown as Record<
            string,
            string | number | null
          >;
          const formatted = { ...INITIAL_METRICS };
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
      const now = DateUtils.getISTDate();
      const payload: BodyMetrics = {
        ...(rawLatest || {}),
        user_id,
        logdate: now.split("T")[0],
        updated_at: now,
        created_at: now,
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

  // Loading screen
  if (loading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-bg-main">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );
  }

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
      <span>{saving ? "Calibrating..." : "Commit Measurements"}</span>
    </button>
  );

  return (
    <SubPageLayout title="Measurement Lab" footer={saveButton}>
      <div className="space-y-8 pt-2 pb-4 animate-in fade-in duration-500">
        {/* ── CORE VITALS ── */}
        <section className="space-y-3">
          <SectionLabel
            icon={<Activity size={13} />}
            title="Biometric Baseline"
          />
          <div className="grid grid-cols-2 gap-3">
            <CompactInput
              label="Body Mass"
              value={metrics.weight}
              unit="kg"
              icon={<Scale size={16} />}
              onChange={(v) => handleUpdate("weight", v)}
            />
            <CompactInput
              label="Stature"
              value={metrics.height}
              unit="cm"
              icon={<Ruler size={16} />}
              onChange={(v) => handleUpdate("height", v)}
            />
          </div>
        </section>

        {/* ── TORSO ── */}
        <section className="space-y-3">
          <SectionLabel icon={<Dumbbell size={13} />} title="Torso Metrics" />
          <div className="grid grid-cols-3 gap-2.5">
            {TORSO_KEYS.map((key) => (
              <MiniInput
                key={key}
                label={key}
                value={metrics[key]}
                onChange={(v) => handleUpdate(key, v)}
              />
            ))}
          </div>
        </section>

        {/* ── LIMB SYMMETRY ── */}
        <section className="space-y-3">
          <SectionLabel icon={<GitCompare size={13} />} title="Limb Symmetry" />
          <div className="space-y-2.5">
            {LIMB_ROWS.map((row) => (
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
      </div>
    </SubPageLayout>
  );
};

// --- SUB-COMPONENTS ---

const SectionLabel = ({ icon, title }: { icon: ReactNode; title: string }) => (
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

const CompactInput = ({ label, value, unit, icon, onChange }: InputProps) => (
  <div
    className="bg-bg-surface border border-border-color/40 p-5 rounded-2xl card-glow
               focus-within:border-brand-primary/40 transition-colors"
  >
    <div className="flex justify-between items-start mb-4 text-brand-primary">
      <div className="p-2 bg-bg-main rounded-xl border border-border-color/20">
        {icon}
      </div>
      <span className="text-[9px] font-black text-text-muted/40 uppercase italic tracking-widest">
        {unit}
      </span>
    </div>
    <input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      className="bg-transparent border-none outline-none text-4xl font-black italic
                 text-text-main w-full tabular-nums tracking-tighter"
      placeholder="0.0"
    />
    <p className="text-[9px] font-black text-text-muted/40 uppercase mt-2 italic tracking-widest">
      {label}
    </p>
  </div>
);

const MiniInput = ({ label, value, onChange }: InputProps) => (
  <div
    className="bg-bg-surface border border-border-color/40 p-4 rounded-2xl text-center
               card-glow focus-within:border-brand-primary/40 transition-colors"
  >
    <p className="text-[8px] font-black text-text-muted/40 uppercase mb-2 italic tracking-widest truncate">
      {label}
    </p>
    <input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      className="bg-transparent border-none outline-none text-lg font-black italic
                 text-text-main w-full text-center tabular-nums"
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
  <div className="flex items-center gap-4">
    {/* Label */}
    <div className="w-14 shrink-0 text-[9px] font-black uppercase text-text-muted/50 italic tracking-widest">
      {label}
    </div>

    {/* L / R inputs */}
    <div className="flex-1 grid grid-cols-2 gap-2.5">
      {[
        { key: leftKey, side: "L" },
        { key: rightKey, side: "R" },
      ].map(({ key, side }) => (
        <div key={key} className="relative">
          <input
            type="text"
            inputMode="decimal"
            value={metrics[key]}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onUpdate(key, e.target.value)
            }
            className="w-full bg-bg-surface border border-border-color/40 rounded-xl
                       p-3.5 text-[13px] font-black italic text-text-main text-center
                       focus:border-brand-primary/40 transition-colors outline-none"
            placeholder="0.0"
          />
          <span className="absolute top-1.5 left-2.5 text-[7px] font-black text-brand-primary/40">
            {side}
          </span>
        </div>
      ))}
    </div>
  </div>
);
